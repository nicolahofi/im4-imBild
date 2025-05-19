# im4-imBild Briefkasten Projekt

## Übersicht

Dieses Projekt ist eine smarte Briefkasten-Lösung, die mit einem ESP32, einer Web-Galerie und einem Upload-Frontend arbeitet. Nutzer können Bilder hochladen, die dann in einer Galerie angezeigt werden. Der ESP32 erkennt neue Einträge und zeigt den Status über einen LED-Ring an.

---

## Reproduzierbarkeit: Schritt-für-Schritt-Anleitung

1. **ESP32 Firmware flashen**
   - Öffne die `esp32/esp32_smart_briefkasten/esp32_smart_briefkasten.ino` im Arduino IDE.
   - Passe WLAN-Zugangsdaten und die Briefkasten-ID an.
   - Schließe den ESP32 wie im Steckschema unten an.
   - Flashe die Firmware auf den ESP32.

2. **Webserver/Frontend aufsetzen**
   -NODE
   -
   - Lege den Inhalt des `public/`-Ordners auf einen Webserver (z.B. Vercel, Netlify).
   - Stelle sicher, dass die API-Endpunkte (`/api/upload`, `unload.php`, etc.) erreichbar sind.

4. **Backend/API & Datenbank**
   - "Norameler Server"
   -
   - Lege die PHP-Dateien und das `api/`-Verzeichnis auf dem Server ab.
   - Erstelle deine eigene db_connection.php mit deinen Zugangsdaten (host, datenbankname, username, passwort).
   - Erstelle die benötigten Tabellen in der Datenbank mit folgendem SQL-Befehl:
      CREATE TABLE posts (
          user VARCHAR(50) NOT NULL,
          post_id INT(9) PRIMARY KEY AUTO_INCREMENT ,
          photo_url TEXT NOT NULL, 
          text VARCHAR(50) NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          letterbox_id INT(4) NOT NULL,
          viewed BOOLEAN DEFAULT 0
      );

5. **Testen**
   - Öffne die Weboberfläche im Browser und teste Upload, Galerie und Statusanzeige.
   - Prüfe die Funktion des ESP32 (Bewegungserkennung, LED, Webinterface).

---

## Flussdiagramm

<!-- Hier das Flussdiagramm einfügen (siehe oben, z.B. als Mermaid oder Bild) -->

```mermaid
graph TD
    ESP32[ESP32 (Briefkasten)]
    API[Backend/API (PHP, REST)]
    DB[(Datenbank MySQL)]
    WEB[Web-Frontend (HTML, CSS, JS)]

    ESP32 -- HTTP --> API
    API -- SQL --> DB
    WEB -- HTTP --> API
    API -- HTTP --> WEB
```

---

## Komponentenplan

```
+-------------------+         +-------------------+         +-------------------+
|    ESP32          | <-----> |     Backend/API   | <-----> |   Datenbank       |
|  (Briefkasten)    |  HTTPS  |  (Infomaniak, PHP)|   SQL   |   (MySQL, Infom.) |
|  + eigene Page    |         +-------------------+         +-------------------+
+-------------------+                 ^
        |                             |  HTTPS
        |                             |
        v                             |
+-------------------+                 |
|   Web-Frontend    |-----------------+
|   (Vercel)        |  HTTPS
+-------------------+
```

**Beschreibung:**
- **ESP32 (Briefkasten):** Erkennt Bewegung, prüft auf neue Nachrichten, steuert LEDs, kommuniziert per HTTP mit dem Backend.
- **Backend/API:** PHP-Skripte (z.B. `unload.php`, `mark_as_viewed.php`, `/api/upload`), Schnittstelle zwischen ESP32, Web-Frontend und Datenbank.
- **Datenbank:** Speichert Bilder, Nachrichten, Status (z.B. MySQL).
- **Web-Frontend:** Galerie, Upload, Statusanzeige, Kommunikation mit Backend/API.

---

## Steckschema

<!-- Hier das Breadboard-Steckschema als Bild einfügen -->

![Steckschema](BILDPFAD_ZUM_STECKSCHEMA.png)

**Beschreibung:**
- ESP32 Dev Board
- PIR Bewegungssensor an Pin 13
- NeoPixel LED-Ring an Pin 12
- GND und 5V entsprechend verbinden
- (Details siehe Fritzing/Steckplan)

---

## Screenshots / Bilder / GIFs

<!-- Hier Screenshots der Weboberfläche, Galerie, Upload, ESP32 im Einsatz, etc. einfügen -->

![Screenshot Galerie](BILDPFAD_GALERIE.png)
![Screenshot Upload](BILDPFAD_UPLOAD.png)
![ESP32 im Einsatz](BILDPFAD_ESP32.png)

---

## Bericht zum Umsetzungsprozess

**Entwicklungsprozess:**
- Start mit der Definition der Anforderungen (smarter Briefkasten, Web-Galerie, Upload, LED-Feedback)
- Zunächst ESP32-Programmierung und Hardwareaufbau (Bewegungssensor, LED-Ring)
- Parallele Entwicklung des Web-Frontends (HTML, CSS, JS) und Backend (PHP, MySQL)
- API-Schnittstellen entworfen und getestet
- UI/UX-Design iterativ verbessert (Farben, Responsive Design, Modale Bildanzeige)

**Verworfene Lösungsansätze:**
- Ursprünglich war ein anderes Logo/Design geplant
- Erstes Konzept für die Bildanzeige öffnete neue Tabs, wurde auf Modal umgestellt
- Verschiedene Ansätze für die Datenbankstruktur getestet

**Designentscheidungen:**
- Einfache, moderne UI mit klaren Farben
- Mobile-First-Ansatz für die Weboberfläche
- Maximale Textlänge beim Upload auf 50 Zeichen begrenzt

**Inspirationen:**
- Smarte Briefkasten-Projekte auf GitHub
- UI-Farben und Layouts von modernen Webapps

**Fehlschläge & Umplanung:**
- Probleme mit der WLAN-Verbindung des ESP32 (Debugging, Standortwechsel)
- API-Fehlerbehandlung und CORS-Probleme
- Anpassung der Galerie-Logik für bessere Performance

**Challenges:**
- Synchronisation zwischen ESP32, Backend und Frontend
- Responsive Design für verschiedene Geräte
- Fehlerbehandlung bei Upload und API

**Lerneffekt:**
- Vertiefung in ESP32-Programmierung und Webentwicklung
- Umgang mit REST-APIs und Datenbankanbindung
- Besseres Verständnis für UI/UX und Responsive Design

**Known Bugs:**
- [PLATZHALTER: Hier bekannte Bugs eintragen]

**Planung & Aufgabenverteilung:**
- [PLATZHALTER: Wer hat was gemacht?]

**Hilfsmittel:**
- GitHub Copilot, ChatGPT, Fritzing, draw.io, VS Code, Arduino IDE, Browser DevTools

---

## Video-Dokumentation

<!-- Hier den Link zum Video einfügen -->

[Video-Dokumentation auf YouTube](LINK_ZUM_VIDEO)

---

## Lizenz

MIT License

---

Fragen oder Feedback? Einfach im Code kommentieren oder ein Issue eröffnen.

