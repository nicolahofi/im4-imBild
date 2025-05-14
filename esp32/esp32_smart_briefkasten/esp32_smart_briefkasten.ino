#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>

// WLAN-Daten
const char* ssid = "tinkergarden";
const char* password = "strenggeheim";

// Pin-Definitionen
#define PIR_PIN 13
#define LED_RING_PIN 12
#define LED_COUNT 16

// Farben
#define LED_COLOR_RED    Adafruit_NeoPixel::Color(255, 0, 0)
#define LED_COLOR_GREEN  Adafruit_NeoPixel::Color(0, 255, 0)
#define LED_COLOR_BLUE   Adafruit_NeoPixel::Color(0, 0, 255)
#define LED_COLOR_YELLOW Adafruit_NeoPixel::Color(255, 255, 0)
#define LED_COLOR_OFF    Adafruit_NeoPixel::Color(0, 0, 0)

// URLs
const char* serverUrl = "https://im4-imbild.ch";
const char* unloadUrl = "https://im4-imbild.ch/unload.php?limit=10";
const char* galleryUrl = "https://im4-im-bild.vercel.app/gallery.html";
WebServer server(80);

// Briefkasten-ID
const char* briefkastenId = "";

// LED-Ring
Adafruit_NeoPixel ring = Adafruit_NeoPixel(LED_COUNT, LED_RING_PIN, NEO_GRB + NEO_KHZ800);

// Status
bool motionDetected = false;
bool newDataFound = false;
int newItemCount = 0;
unsigned long lastMotionTime = 0;
const int MOTION_TIMEOUT = 60000;
unsigned long lastCheck = 0;
const int CHECK_INTERVAL = 10000;

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  
  ring.begin();
  ring.setBrightness(50);
  setRingColor(LED_COLOR_BLUE);

  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWLAN verbunden. IP: " + WiFi.localIP().toString());
    blinkRing(LED_COLOR_GREEN, 3, 200);
  } else {
    Serial.println("\nWLAN-Verbindung fehlgeschlagen!");
    blinkRing(LED_COLOR_RED, 5, 200);
  }

  setupEndpoints();
  server.begin();
  setRingColor(LED_COLOR_OFF);
  Serial.println("ESP32 Briefkasten bereit!");
}

void loop() {
  server.handleClient();
  checkMotionSensor();

  if (millis() - lastCheck > CHECK_INTERVAL) {
    checkForNewData();
    lastCheck = millis();
  }

  if (motionDetected && (millis() - lastMotionTime > MOTION_TIMEOUT)) {
    Serial.println("Bewegungs-Timeout erreicht.");
    motionDetected = false;
    setRingColor(LED_COLOR_OFF);
  }

  delay(100);
}

void checkMotionSensor() {
  int sensorValue = digitalRead(PIR_PIN);
  
  if (sensorValue == HIGH && !motionDetected) {
    motionDetected = true;
    lastMotionTime = millis();
    Serial.println("Bewegung erkannt!");
    setRingColor(LED_COLOR_YELLOW);
    checkForNewData();
  }
}

void checkForNewData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WLAN nicht verbunden.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();  // <-- unsicher, aber einfach für Testzwecke

  HTTPClient http;
  String url = unloadUrl;

  if (briefkastenId && strlen(briefkastenId) > 0) {
    url += "&letterbox_id=";
    url += briefkastenId;
  }

  http.begin(client, url);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(16384);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"].as<bool>()) {
      newItemCount = doc["count"].as<int>();
      newDataFound = (newItemCount > 0);

      Serial.print("Anzahl Bilder: ");
      Serial.println(newItemCount);

      if (motionDetected) {
        setRingColor(newDataFound ? LED_COLOR_GREEN : LED_COLOR_RED);
      }
    } else {
      Serial.println("JSON-Fehler");
      if (motionDetected) blinkRing(LED_COLOR_RED, 2, 300);
    }
  } else {
    Serial.printf("HTTPS-Fehler: %d\n", code);
    if (motionDetected) blinkRing(LED_COLOR_RED, 3, 200);
  }

  http.end();
}

void setupEndpoints() {
  server.on("/status", HTTP_GET, []() {
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

  server.on("/", HTTP_GET, []() {
    String html = "<html><body style='font-family: Arial, sans-serif; text-align: center; background-color: #273522; color: white;'>";
    html += "<h1>ESP32 Smart-Briefkasten</h1>";
    html += "<div style='margin: 20px; padding: 20px; background-color: rgba(255,255,255,0.1); border-radius: 10px;'>";
    html += "<p>Status: <span style='color: " + String(motionDetected ? "#33ff33" : "#aaaaaa") + ";'>" + 
            String(motionDetected ? "Bewegung erkannt" : "Keine Bewegung") + "</span></p>";
    html += "<p>Daten: <span style='color: " + String(newDataFound ? "#33ff33" : "#ff3333") + ";'>" + 
            String(newDataFound ? String(newItemCount) + " Bilder verfügbar" : "Keine Bilder") + "</span></p>";

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
    html += "<p><a href='/status' style='color: #7FD1B9;'>Status (JSON)</a></p></div>";
    html += "<p><a href='" + String(galleryUrl) + "?esp32=" + WiFi.localIP().toString() + 
            "' target='_blank' style='display: inline-block; background-color: #DF7A49; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Zur Galerie</a></p>";
    html += "</body></html>";

    server.send(200, "text/html", html);
  });
}

void setRingColor(uint32_t color) {
  for (int i = 0; i < LED_COUNT; i++) {
    ring.setPixelColor(i, color);
  }
  ring.show();
}

void blinkRing(uint32_t color, int times, int delayMs) {
  for (int t = 0; t < times; t++) {
    setRingColor(color);
    delay(delayMs);
    setRingColor(LED_COLOR_OFF);
    delay(delayMs);
  }
}
