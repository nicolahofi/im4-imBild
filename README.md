# im4-imBild

## Architektur

Dieses Projekt besteht aus einer verteilten Architektur mit mehreren Komponenten:

1. **Infomaniak Server**
   - Hostet die Datenbank
   - Stellt die `load.php` und `unload.php` Endpunkte bereit
   - Infomaniak URL: `https://im4-imbild.ch/`

2. **Vercel Server**
   - Hostet die Web-Frontend-Anwendung für das Hochladen von Bildern
   - Stellt die API-Endpunkte unter `/api` bereit
   - Hauptverantwortlich für den Upload-Prozess über `api/upload.js`

3. **ESP32 Microcontroller**
   - Zeigt die Galerie/Bilder auf einem angeschlossenen Display an
   - Kommuniziert mit dem Infomaniak Server über die `unload.php`
   - Kann für spezifische Briefkästen konfiguriert werden

## Datenfluss

1. **Bilder hochladen**:
   - Benutzer laden Bilder über die Web-App hoch (Vercel)
   - `api/upload.js` lädt das Bild zu Google Drive hoch
   - Metadaten (einschließlich Briefkasten-ID) werden zur Infomaniak-Datenbank über `load.php` gesendet

2. **Bilder anzeigen**:
   - Der ESP32 fragt regelmäßig Bilder von `https://im4-imbild.ch/unload.php` ab
   - Die Web-Galerie ruft Bilder vom gleichen Endpunkt ab
 
