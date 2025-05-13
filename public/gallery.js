// gallery.js - JavaScript für die Bildergalerie

document.addEventListener('DOMContentLoaded', () => {
  // Initial alle Bilder laden
  loadImages();
  
  // Event-Listener für den Aktualisieren-Button
  document.getElementById('refreshButton').addEventListener('click', loadImages);
  
  // Event-Listener für Enter-Taste im Filter-Feld
  document.getElementById('letterboxFilter').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadImages();
    }
  });
  
  document.getElementById('limitFilter').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadImages();
    }
  });
});

// Funktion zum Laden der Bilder
async function loadImages() {
  const gallery = document.getElementById('gallery');
  const loading = document.getElementById('loading');
  const noImages = document.getElementById('noImages');
  const letterboxId = document.getElementById('letterboxFilter').value.trim();
  let limit = parseInt(document.getElementById('limitFilter').value) || 10;
  
  // Limit auf 20 begrenzen
  if (limit > 20) limit = 20;
  document.getElementById('limitFilter').value = limit;
  
  // UI zurücksetzen
  gallery.innerHTML = '';
  loading.style.display = 'block';
  noImages.style.display = 'none';
  
  try {
    // URL mit Parametern aufbauen
    let url = 'https://im4-imbild.ch/unload.php?limit=' + limit;
    if (letterboxId) {
      url += '&letterbox_id=' + encodeURIComponent(letterboxId);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.count > 0) {
      // Für jedes Bild einen Eintrag erstellen
      data.posts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Falls die URL ein Google Drive Link ist, formatieren wir sie um
        let imageUrl = post.photo_url;
        
        // Überprüfen, ob es ein Google Drive Link ist und entsprechend umwandeln
        if (imageUrl.includes('drive.google.com/file/d/')) {
          const fileId = imageUrl.match(/\/d\/([^\/]*)/)[1];
          imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
        
        // Datum formatieren, falls vorhanden
        let dateDisplay = '';
        if (post.timestamp) {
          const date = new Date(post.timestamp);
          dateDisplay = `<span class="gallery-date">${date.toLocaleDateString()}</span>`;
        }
        
        // HTML für das Galerie-Element zusammenbauen
        item.innerHTML = `
          <a href="${post.photo_url}" target="_blank">
            <img src="${imageUrl}" alt="${post.text || 'Bild'}" class="gallery-image" onerror="this.src='/media/img/image-placeholder.png'">
          </a>
          <div class="gallery-info">
            <p class="gallery-text">${post.text || ''}</p>
            <p class="gallery-user">Von: ${post.user || 'Anonym'} ${dateDisplay}</p>
            <p class="gallery-letterbox">Briefkasten: ${post.letterbox_id || 'Unbekannt'}</p>
          </div>
        `;
        
        gallery.appendChild(item);
      });
      
      loading.style.display = 'none';
    } else {
      // Keine Bilder gefunden
      loading.style.display = 'none';
      noImages.style.display = 'block';
    }
  } catch (error) {
    console.error('Fehler beim Laden der Bilder:', error);
    
    // Fehlermeldung anzeigen
    let errorMsg = 'Fehler beim Laden der Bilder: ' + error.message;
    
    // Versuchen, weitere Details zu erhalten
    try {
      if (error.message.includes('HTTP error')) {
        // Füge einen Debug-Button hinzu
        loading.innerHTML = `
          ${errorMsg}
          <div style="margin-top: 10px;">
            <button id="debugBtn" style="background-color: #666; color: white; padding: 5px 10px; border: none; border-radius: 4px;">
              Fehlerbehebung starten
            </button>
          </div>
        `;
        
        // Event-Listener für den Debug-Button
        document.getElementById('debugBtn').addEventListener('click', async () => {
          loading.innerHTML = 'Führe Diagnose durch...';
          
          try {
            // Direkte Anfrage mit weniger Optionen versuchen
            const testUrl = 'https://im4-imbild.ch/unload.php?limit=1';
            loading.innerHTML += '<p>Teste einfache Anfrage: ' + testUrl + '</p>';
            
            const testResponse = await fetch(testUrl);
            const testText = await testResponse.text();
            
            loading.innerHTML += '<p>Antwort vom Server:</p><pre style="background:#f5f5f5;padding:10px;overflow:auto;max-height:200px;font-size:12px;">' + 
              testText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
            
            // Versuchen, die Antwort als JSON zu parsen
            try {
              JSON.parse(testText);
              loading.innerHTML += '<p style="color:green;">✓ JSON ist gültig</p>';
            } catch (e) {
              loading.innerHTML += '<p style="color:red;">✗ JSON ist ungültig: ' + e.message + '</p>';
            }
            
            // Ratschläge zur Problembehebung
            loading.innerHTML += '<p>Empfehlungen zur Fehlerbehebung:</p>' + 
              '<ol>' +
              '<li>Überprüfen Sie die unload.php auf Ihrem Infomaniak-Server</li>' +
              '<li>Stellen Sie sicher, dass die Datenbankverbindung funktioniert</li>' +
              '<li>Überprüfen Sie die Tabellenspalten in der Datenbank</li>' +
              '<li>Sehen Sie in den Server-Logs nach detaillierten Fehlermeldungen</li>' +
              '</ol>';
          } catch (diagError) {
            loading.innerHTML += '<p>Fehler bei der Diagnose: ' + diagError.message + '</p>';
          }
        });
      } else {
        loading.textContent = errorMsg;
      }
    } catch (e) {
      loading.textContent = errorMsg;
    }
  }
}
