// api/upload.js
const { google } = require('googleapis');
const stream = require('stream');
const fetch = require('node-fetch'); // falls du es lokal brauchst

require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST allowed');
  }

  const { name, type, data, text, userName, letterboxId } = req.body;

  if (!name || !type || !data) {
    return res.status(400).send('Missing data');
  }

  try {
    // Datei aus base64 erzeugen
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(data, 'base64'));

    // In Google Drive hochladen
    const response = await drive.files.create({
      requestBody: {
        name,
        mimeType: type
      },
      media: {
        mimeType: type,
        body: bufferStream
      }
    });

    // Öffentlich machen
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Link abrufen
    const fileInfo = await drive.files.get({
      fileId: response.data.id,
      fields: 'webViewLink, webContentLink'
    });

    const photo_url = fileInfo.data.webViewLink;

    // An Infomaniak weitergeben - mit Name und Letterbox
    try {
      const dbResponse = await fetch('https://im4-imbild.ch/load.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url,
          text: text || '',
          userName: userName || '',         // Name hinzufügen
          letterboxId: letterboxId || ''    // Letterbox-ID hinzufügen
        })
      });
      
      if (!dbResponse.ok) {
        const errorText = await dbResponse.text();
        console.error('Fehler beim Speichern in der Datenbank:', errorText);
        res.status(500).json({ error: 'DB-Fehler', detail: errorText });
      }
      
      // Erfolgreich antworten
      res.status(200).json({ link: photo_url });
    } catch (err) {
      console.error('Fehler beim Speichern in der Datenbank:', err);
      // Trotzdem erfolgreich antworten, damit der Link zurückgegeben wird
      res.status(200).json({ link: photo_url });
    }

  } catch (err) {
    res.status(500).send(err.message);
  }
};
