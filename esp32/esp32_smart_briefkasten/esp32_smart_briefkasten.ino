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
#define PIR_PIN 6
#define LED_RING_PIN 4
#define LED_COUNT 12

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
const char* briefkastenId = "5678"; // Briefkasten-ID festlegen

// LED-Ring
Adafruit_NeoPixel ring = Adafruit_NeoPixel(LED_COUNT, LED_RING_PIN, NEO_GRB + NEO_KHZ800);

// Status
bool motionDetected = false;
bool newDataFound = false;
int newItemCount = 0;
unsigned long lastMotionTime = 0;
const int MOTION_TIMEOUT = 5000;
unsigned long lastCheck = 0;
const int CHECK_INTERVAL = 10000;

// Globale Variable für die IDs der neuen Einträge
String newPostIds = "";

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

void markAsViewed(const String& postIds) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WLAN nicht verbunden.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(serverUrl) + "/mark_as_viewed.php";

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  // JSON-Payload mit den Post-IDs erstellen
  String payload = "{\"post_ids\": [" + postIds + "]}";

  int code = http.POST(payload);

  if (code == 200) {
    Serial.println("Einträge erfolgreich als angeschaut markiert.");
  } else {
    Serial.printf("Fehler beim Markieren der Einträge: %d\n", code);
  }

  http.end();
}

void checkForNewData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WLAN nicht verbunden.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  // Filtere nur Bilder mit der Briefkasten-ID 5678 und viewed=0
  String url = String(unloadUrl) + "&letterbox_id=" + briefkastenId + "&viewed=false";

  http.begin(client, url);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(16384);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"].as<bool>()) {
      // Anzahl der neuen Einträge (viewed=0) aktualisieren
      newItemCount = doc["count"].as<int>();
      newDataFound = (newItemCount > 0);

      Serial.print("Anzahl neue Bilder: ");
      Serial.println(newItemCount);

      if (newDataFound) {
        // IDs der neuen Einträge sammeln
        newPostIds = "";
        for (JsonObject post : doc["posts"].as<JsonArray>()) {
          if (!newPostIds.isEmpty()) {
            newPostIds += ",";
          }
          newPostIds += post["post_id"].as<String>();
        }
      }

      if (motionDetected) {
        setRingColor(newDataFound ? LED_COLOR_GREEN : LED_COLOR_RED);
      }
    } else {
      Serial.println("JSON-Fehler oder keine neuen Bilder gefunden.");
    }
  } else {
    Serial.printf("HTTPS-Fehler: %d\n", code);
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

  server.on("/mark_viewed", HTTP_POST, []() {
    if (!newDataFound || newPostIds.isEmpty()) {
      server.send(400, "application/json", "{\"error\": \"No new data to mark as viewed\"}");
      return;
    }

    // Einträge als angeschaut markieren
    markAsViewed(newPostIds);

    server.send(200, "application/json", "{\"success\": true}");
  });

server.on("/", HTTP_GET, []() {
  String html = "<!DOCTYPE html><html lang='de'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<style>";
  html += "body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #fdf5e6; height: 100vh; display: flex; flex-direction: column; align-items: center; position: relative; }";
  html += ".briefkasten { position: absolute; top: 24px; right: 24px; background-color: #4A582E; color: white; padding: 12px 22px; border-radius: 16px; font-weight: 500; font-size: 1.2rem; }";
  html += ".center-wrapper { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }";
  html += ".message-box { background-color: #4A582E; color: white; padding: 32px 48px; border-radius: 16px; font-size: 1.8rem; text-align: center; max-width: 90%; margin-bottom: 20px; }";
  html += ".button { background-color: #DF7A49; color: white; padding: 16px 32px; border: none; border-radius: 16px; font-size: 1.2rem; text-decoration: none; display: inline-block; margin-top: 20px; box-shadow: none; }";
  html += ".button:hover { background-color: #c56a3e; }";
  html += ".gallery-button { position: absolute; bottom: 24px; right: 24px; }";
  html += "</style></head><body>";

  html += "<div class='briefkasten'>Briefkasten: " + String(briefkastenId) + "</div>";

  if (newDataFound) {
    html += "<div class='center-wrapper'>";
    html += "<div class='message-box'>Du hast " + String(newItemCount) + " neue<br>Nachrichten</div>";
    html += "<p><a href='" + String(galleryUrl) + "?letterbox_id=" + briefkastenId + "' target='_blank' style='display: inline-block; background-color: #DF7A49; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;' onclick=\"fetch('/mark_viewed', {method: 'POST'})\">Zur Galerie</a></p>";    html += "</div>";
  } else {
    html += "<div class='center-wrapper'>";
    html += "<div class='message-box'>Du hast keine neuen Nachrichten</div>";
    html += "</div>";
  }
    html += "<a href='https://im4-im-bild.vercel.app/gallery_full.html' class='button gallery-button' target='_blank'>Galerie</a>";

  html += "<script>";
  html += "async function markAndOpenGallery() {";
  html += "  try {";
  html += "    const res = await fetch('/mark_viewed', { method: 'POST' });";
  html += "    if (res.ok) {";
  html += "      window.open('https://im4-im-bild.vercel.app/gallery.html', '_blank');";
  html += "    } else { alert('Fehler beim Markieren der Nachrichten.'); }";
  html += "  } catch (e) { alert('Verbindung zum Server fehlgeschlagen.'); }";
  html += "}";
  html += "</script>";

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