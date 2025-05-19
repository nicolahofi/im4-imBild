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
   - Lege den Inhalt des `public/`-Ordners auf einen Webserver, der Node.js unterstützt (z.B. Vercel, Netlify).
   - Stelle sicher, dass die API-Endpunkte (`/api/upload`, `unload.php`, etc.) erreichbar sind.

4. **Datenbank**
   - Lege die PHP-Dateien auf dem Server ab. Vercel und Netlify ermöglichen keine herkömmliche Datenbank, deswegen musst du hier auf andere Angebote wie z.B. Infomaniak zurückgreifen.
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

![screenflow_im4](https://github.com/user-attachments/assets/8e4a99ba-9e5b-4267-bde6-7ed919f11ae2)

---

## Komponentenplan

![komponentenplan_im4](https://github.com/user-attachments/assets/51ed046c-9cb8-4463-832a-3b53e027aa0a)

**Beschreibung:**
- **ESP32 (Briefkasten):** Erkennt Bewegung, prüft auf neue Nachrichten, steuert LEDs, kommuniziert per HTTP mit dem Backend.
- **Backend/API:** PHP-Skripte, Schnittstelle zwischen ESP32, Web-Frontend und Datenbank.
- **Datenbank:** Speichert Bilder, Nachrichten, Status (z.B. MySQL).
- **Web-Frontend:** Galerie, Upload, Statusanzeige, Kommunikation mit Backend/API.

---

## Steckschema

![steckschema_im4](https://github.com/user-attachments/assets/b62cc28c-9131-4254-b794-cc095b4d63ff)

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
- Parallele Arbeit am Hardwareaufbau und der Entwicklung des Web-Frontends.
- API-Schnittstellen entworfen und getestet
- UI/UX-Design angepasst (Farben, Responsive Design, Modale Bildanzeige)

**Verworfene Lösungsansätze:**
- Ursprünglich war die Umsetzung mithilfe eines CMS, welches die Bilder handhabt geplant. 

**Designentscheidungen:**
- Einfache, moderne UI mit klaren Farben
- Upload-Seite für Mobile optimiert
- Gallerie für Tablet optimiert
- Maximale Textlänge beim Upload auf 50 Zeichen begrenzt

**Inspirationen:**
- 
- 

**Challenges:**
- Handhabung von drei verschiedenen "Orten" (Vercel, Infomaniak, lokales Frontend)
- Fehlerbehandlung bei Upload und API

**Lerneffekt:**
- Vertiefung in ESP32-Programmierung und Webentwicklung
- Umgang mit Datenbankanbindung
- Besseres Verständnis für UI/UX und Responsive Design

**Known Bugs:**
- Die lokale Seite auf dem ESP-32 hat am unteren Bildschirmrand einen weissen Strich.

**Planung & Aufgabenverteilung:**
- Wir haben von Anfang an parallel an der Hardwarekomponente und der Software gearbeitet. Lisa hat sich vorallem um die Erstellung und Gestaltung der Upload-Page und danach mehrheitlich um die Hardware gekümmert. Nicola hat sich um alles rund um die Datenbank gekümmert und hat danach die Gallerie Seite gebaut. Den Code für den ESP-32 haben wir in Teamarbeit geschrieben. 

**Hilfsmittel:**
- YouTube Tutorial Google Drive: https://www.youtube.com/watch?v=1y0-IfRW114&t=2s
- ChatGPT
- Die Inputs unserer fantastischen Dozierenden und Lehrbeauftragten. :*

---

## Video-Dokumentation

[Video-Dokumentation auf YouTube](LINK_ZUM_VIDEO)

---

## Lizenz

MIT License

---

Fragen oder Feedback? Einfach im Code kommentieren oder ein Issue eröffnen.

