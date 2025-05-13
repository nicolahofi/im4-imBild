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
    let url = '/unload.php?limit=' + limit;
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
        if (post.created_at) {
          const date = new Date(post.created_at);
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
    loading.textContent = 'Fehler beim Laden der Bilder: ' + error.message;
  }
}
