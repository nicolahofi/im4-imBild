// api/upload.js
const { google } = require('googleapis');
const stream = require('stream');
const fetch = require('node-fetch');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['CLIENT_ID', 'CLIENT_SECRET', 'REDIRECT_URI', 'REFRESH_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all Google Drive API credentials are set.');
}

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Set initial credentials with refresh token
oauth2Client.setCredentials({ 
  refresh_token: process.env.REFRESH_TOKEN 
});

// Add event listener for token refresh
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    // Store the new refresh token if provided
    console.log('🔄 New refresh token received');
  }
  if (tokens.access_token) {
    console.log('🔄 Access token refreshed');
  }
});

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

// Helper function to ensure valid token
async function ensureValidToken() {
  try {
    // This will automatically refresh the token if it's expired
    const { credentials } = await oauth2Client.getAccessToken();
    return true;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return false;
  }
}

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
    // Ensure we have a valid token before making API calls
    const tokenValid = await ensureValidToken();
    if (!tokenValid) {
      return res.status(401).json({ error: 'Token refresh fehlgeschlagen' });
    }

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
    
    // Check if it's an authentication error and try to refresh token
    if (err.code === 401 || err.message.includes('invalid_grant') || err.message.includes('unauthorized')) {
      console.log('🔄 Attempting token refresh due to auth error...');
      try {
        await ensureValidToken();
        return res.status(401).json({ 
          error: 'Token abgelaufen - bitte erneut versuchen', 
          detail: 'Authentication token was refreshed, please retry your request' 
        });
      } catch (refreshError) {
        console.error('❌ Token refresh nach Fehler fehlgeschlagen:', refreshError);
        return res.status(401).json({ 
          error: 'Authentifizierung fehlgeschlagen', 
          detail: 'Please check your Google Drive API credentials' 
        });
      }
    }
    
    return res.status(500).json({ error: 'Google Upload fehlgeschlagen', detail: err.message });
  }
};
