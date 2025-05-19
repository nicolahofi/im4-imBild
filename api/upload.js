// api/upload.js
const { google } = require('googleapis');
const stream = require('stream');
const fetch = require('node-fetch');
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
    return res.status(405).send('Only POST requests are allowed');
  }

  let body = req.body;

  // Falls body nicht automatisch geparst wurde
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error('Ungültiges JSON:', err);
      return res.status(400).json({ error: 'Ungültiges JSON', detail: err.message });
    }
  }

  const { name, type, data, text = '', userName = '', letterboxId = '' } = body;

  if (!name || !type || !data) {
    return res.status(400).json({ error: 'Erforderliche Felder fehlen (name, type, data)' });
  }

  console.log('🚀 Upload gestartet:', { name, type, userName, letterboxId });

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(data, 'base64'));

    const uploadResponse = await drive.files.create({
      requestBody: { name, mimeType: type },
      media: { mimeType: type, body: bufferStream }
    });

    const fileId = uploadResponse.data.id;

    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' }
    });

    const fileInfo = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink'
    });

    const photo_url = fileInfo.data.webViewLink;
    console.log('✅ Datei hochgeladen:', photo_url);

    // Weiterleiten an Infomaniak
    try {
      const dbResponse = await fetch('https://im4-imbild.ch/load.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url,
          text,
          user: userName,
          letterbox_id: letterboxId
        })
      });

      const dbResult = await dbResponse.text();

      if (!dbResponse.ok) {
        console.error('❌ Fehler bei DB-Request:', dbResult);
        return res.status(500).json({ error: 'Fehler bei Speicherung in Datenbank', detail: dbResult });
      }

      console.log('✅ DB-Antwort:', dbResult);
      return res.status(200).json({ link: photo_url });

    } catch (err) {
      console.error('❌ Fehler beim Senden an Infomaniak:', err);
      // Trotzdem Link zurückgeben
      return res.status(200).json({ link: photo_url, warning: 'Konnte nicht an Infomaniak senden' });
    }

  } catch (err) {
    console.error('❌ Fehler beim Google Upload:', err);
    return res.status(500).json({ error: 'Google Upload fehlgeschlagen', detail: err.message });
  }
};
