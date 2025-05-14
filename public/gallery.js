// gallery.js - JavaScript für die Bildergalerie

document.addEventListener('DOMContentLoaded', () => {
  // Initial alle Bilder laden
  loadImages();

  // Event-Listener für den Aktualisieren-Button
  document.getElementById('refreshButton').addEventListener('click', loadImages);
});

// Funktion zum Transformieren von Google Drive Links
function transformGoogleDriveLink(link) {
  const match = link.match(/\/d\/([a-zA-Z0-9_-]+)\/view/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return link; // Fallback, falls der Link nicht passt
}

// Funktion zum Laden der Galerie-Bilder
function loadGalleryImages(images) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = ''; // Galerie leeren

  if (images.length === 0) {
    document.getElementById('noImages').style.display = 'block';
    return;
  }

  document.getElementById('noImages').style.display = 'none';

  images.forEach(image => {
    const transformedLink = transformGoogleDriveLink(image.photo_url);

    const item = document.createElement('div');
    item.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = transformedLink;
    img.alt = image.text || 'Bild';
    img.className = 'gallery-image';

    const info = document.createElement('div');
    info.className = 'gallery-info';

    const text = document.createElement('p');
    text.className = 'gallery-text';
    text.textContent = image.text || 'Kein Text';

    const user = document.createElement('p');
    user.className = 'gallery-user';
    user.textContent = `Hochgeladen von: ${image.user}`;

    info.appendChild(text);
    info.appendChild(user);
    item.appendChild(img);
    item.appendChild(info);
    gallery.appendChild(item);
  });
}

// Funktion zum Laden der Bilder
async function loadImages() {
  const gallery = document.getElementById('gallery');
  const loading = document.getElementById('loading');
  const noImages = document.getElementById('noImages');

  let limit = 10; // Standardlimit von 10 Bildern

  // UI zurücksetzen
  gallery.innerHTML = '';
  loading.style.display = 'block';
  noImages.style.display = 'none';

  try {
    // Briefkasten-ID festlegen
    const letterboxId = '5678';

    // URL mit festgelegter Briefkasten-ID aufbauen
    let url = 'https://im4-imbild.ch/unload.php?letterbox_id=' + letterboxId;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Debugging erweitern: API-URL und vollständige Antwort protokollieren
    console.log('API Request URL:', url);
    console.log('API Response:', data);

    if (data.success && data.count > 0) {
      loadGalleryImages(data.posts);
      loading.style.display = 'none';
    } else {
      // Keine Bilder gefunden
      console.warn('Keine Bilder gefunden. API Response:', data);
      loading.style.display = 'none';
      noImages.style.display = 'block';
    }
  } catch (error) {
    console.error('Fehler beim Laden der Bilder:', error);
    loading.textContent = 'Fehler beim Laden der Bilder: ' + error.message;
  }
}
