#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h> // Bibliothek für den LED-Ring

// WLAN-Daten
const char* ssid = "tinkergarden";
const char* password = "strenggeheim";

// Pin-Definitionen
#define PIR_PIN 13          // Bewegungssensor
#define LED_RING_PIN 12     // LED-Ring
#define LED_COUNT 16        // Anzahl der LEDs im Ring

// Farben definieren
#define LED_COLOR_RED    Adafruit_NeoPixel::Color(255, 0, 0)
#define LED_COLOR_GREEN  Adafruit_NeoPixel::Color(0, 255, 0)
#define LED_COLOR_BLUE   Adafruit_NeoPixel::Color(0, 0, 255)
#define LED_COLOR_YELLOW Adafruit_NeoPixel::Color(255, 255, 0)
#define LED_COLOR_OFF    Adafruit_NeoPixel::Color(0, 0, 0)

// API & Webserver
const char* serverUrl = "https://im4-imbild.ch";
const char* unloadUrl = "https://im4-imbild.ch/unload.php?limit=10";
const char* galleryUrl = "https://im4-im-bild.vercel.app/gallery.html";
WebServer server(80);

// Briefkasten-ID (wenn nur Bilder für einen bestimmten Briefkasten angezeigt werden sollen)
const char* briefkastenId = ""; // Leer lassen für alle Bilder, oder eine ID eintragen

// LED-Ring initialisieren
Adafruit_NeoPixel ring = Adafruit_NeoPixel(LED_COUNT, LED_RING_PIN, NEO_GRB + NEO_KHZ800);

// Status
bool motionDetected = false;
bool newDataFound = false;
int newItemCount = 0;
unsigned long lastMotionTime = 0; // Zeitpunkt der letzten Bewegungserkennung
const int MOTION_TIMEOUT = 60000;  // Timeout in Millisekunden (60 Sekunden)
unsigned long lastCheck = 0;      // Letzte Überprüfung der Datenbank
const int CHECK_INTERVAL = 10000; // Prüfintervall in Millisekunden (10 Sekunden)

// Setup
void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  
  // LED-Ring initialisieren
  ring.begin();
  ring.setBrightness(50); // 50% Helligkeit
  setRingColor(LED_COLOR_BLUE); // Blau während des Startens

  // WLAN verbinden
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWLAN verbunden. IP: " + WiFi.localIP().toString());
    // Kurz grün blinken zur Bestätigung
    blinkRing(LED_COLOR_GREEN, 3, 200);
  } else {
    Serial.println("\nWLAN-Verbindung fehlgeschlagen!");
    // Rot blinken bei Fehler
    blinkRing(LED_COLOR_RED, 5, 200);
  }

  // API-Endpunkte einrichten
  setupEndpoints();
  
  // Webserver starten
  server.begin();
  
  // Bereit - LED ausschalten
  setRingColor(LED_COLOR_OFF);
  
  Serial.println("ESP32 Briefkasten bereit!");
}

void loop() {
  server.handleClient();

  // Bewegungssensor auslesen
  checkMotionSensor();
  
  // Regelmäßige Überprüfung der Datenbank
  if (millis() - lastCheck > CHECK_INTERVAL) {
    checkForNewData();
    lastCheck = millis();
  }
  
  // Timeout für Bewegungserkennung prüfen
  if (motionDetected && (millis() - lastMotionTime > MOTION_TIMEOUT)) {
    Serial.println("Bewegungs-Timeout erreicht.");
    motionDetected = false;
    setRingColor(LED_COLOR_OFF);
  }
  
  delay(100);
}

// Überprüft den Bewegungssensor
void checkMotionSensor() {
  int sensorValue = digitalRead(PIR_PIN);
  
  if (sensorValue == HIGH && !motionDetected) {
    // Neue Bewegung erkannt
    motionDetected = true;
    lastMotionTime = millis();
    Serial.println("Bewegung erkannt!");
    
    // LED-Ring gelb setzen während wir auf Daten warten
    setRingColor(LED_COLOR_YELLOW);
    
    // Daten aktualisieren
    checkForNewData();
  }
}

// Überprüft, ob neue Daten in der Datenbank vorhanden sind
void checkForNewData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WLAN nicht verbunden, kann keine Daten abrufen.");
    return;
  }
  
  HTTPClient http;
  String url = unloadUrl;
  
  // Falls eine Briefkasten-ID festgelegt ist, diese als Parameter anhängen
  if (briefkastenId && strlen(briefkastenId) > 0) {
    url += "&letterbox_id=";
    url += briefkastenId;
  }
  
  http.begin(url);
  int code = http.GET();
  
  if (code == 200) {
    String payload = http.getString();
    
    // JSON parsen
    DynamicJsonDocument doc(16384); // Größere Kapazität für mehr Bilder
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error && doc["success"].as<bool>()) {
      newItemCount = doc["count"].as<int>();
      newDataFound = (newItemCount > 0);
      
      Serial.print("Daten abgerufen. Anzahl Bilder: ");
      Serial.println(newItemCount);
      
      // LED-Farbe abhängig von den gefundenen Daten setzen
      if (motionDetected) {
        if (newDataFound) {
          // Grün wenn neue Daten vorhanden sind
          setRingColor(LED_COLOR_GREEN);
        } else {
          // Rot wenn keine Daten gefunden wurden
          setRingColor(LED_COLOR_RED);
        }
      }
    } else {
      Serial.println("Fehler beim Parsen der JSON-Daten");
      if (motionDetected) {
        blinkRing(LED_COLOR_RED, 2, 300); // Fehleranzeige
      }
    }
  } else {
    Serial.printf("HTTP-Fehler: %d\n", code);
    if (motionDetected) {
      blinkRing(LED_COLOR_RED, 3, 200); // Fehleranzeige
    }
  }
  
  http.end();
}

// Richtet die API-Endpunkte für den Webserver ein
void setupEndpoints() {
  // Status-Endpunkt für die Bewegungserkennung und Daten
  server.on("/status", HTTP_GET, []() {
    // Status-Objekt erstellen
    StaticJsonDocument<512> status;
    status["motion"] = motionDetected;
    status["motion_age"] = millis() - lastMotionTime;
    status["timeout"] = MOTION_TIMEOUT;
    status["active"] = (motionDetected && (millis() - lastMotionTime < MOTION_TIMEOUT));
    status["data_available"] = newDataFound;
    status["item_count"] = newItemCount;
    status["briefkasten_id"] = briefkastenId;
    
    String response;
    serializeJson(status, response);
    
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", response);
  });

  // Einfache Info-Seite
  server.on("/", HTTP_GET, []() {
    String html = "<html><body style='font-family: Arial, sans-serif; text-align: center; background-color: #273522; color: white;'>";
    html += "<h1>ESP32 Smart-Briefkasten</h1>";
    html += "<div style='margin: 20px; padding: 20px; background-color: rgba(255,255,255,0.1); border-radius: 10px;'>";
    html += "<p>Status: <span style='color: " + String(motionDetected ? "#33ff33" : "#aaaaaa") + ";'>" + 
            String(motionDetected ? "Bewegung erkannt" : "Keine Bewegung") + "</span></p>";
    html += "<p>Daten: <span style='color: " + String(newDataFound ? "#33ff33" : "#ff3333") + ";'>" + 
            String(newDataFound ? String(newItemCount) + " Bilder verfügbar" : "Keine Bilder") + "</span></p>";
    
    // Berechnung der verbleibenden Zeit, wenn Bewegung erkannt wurde
    if (motionDetected) {
      unsigned long elapsedTime = millis() - lastMotionTime;
      if (elapsedTime < MOTION_TIMEOUT) {
        int remainingSeconds = (MOTION_TIMEOUT - elapsedTime) / 1000;
        html += "<p>Zeit verbleibend: " + String(remainingSeconds) + " Sekunden</p>";
      } else {
        html += "<p>Timeout erreicht</p>";
      }
    }
    
    html += "<p>IP-Adresse: " + WiFi.localIP().toString() + "</p>";
    html += "<p><a href='/status' style='color: #7FD1B9;'>Status (JSON)</a></p>";
    html += "</div>";
    
    // Link zur Galerie
    html += "<p><a href='" + String(galleryUrl) + "?esp32=" + WiFi.localIP().toString() + 
            "' target='_blank' style='display: inline-block; background-color: #DF7A49; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Zur Galerie</a></p>";
    
    html += "</body></html>";
    server.send(200, "text/html", html);
  });
}

// Setzt die Farbe aller LEDs im Ring
void setRingColor(uint32_t color) {
  for (int i = 0; i < LED_COUNT; i++) {
    ring.setPixelColor(i, color);
  }
  ring.show();
}

// Lässt den Ring in einer bestimmten Farbe blinken
void blinkRing(uint32_t color, int times, int delayMs) {
  for (int t = 0; t < times; t++) {
    setRingColor(color);
    delay(delayMs);
    setRingColor(LED_COLOR_OFF);
    delay(delayMs);
  }
}
