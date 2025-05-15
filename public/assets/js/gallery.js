document.addEventListener('DOMContentLoaded', () => {
  createImageModal();
  loadImages();

  // Event-Listener für den Aktualisieren-Button
  document.getElementById('refreshButton').addEventListener('click', loadImages);

  // Event-Listener für den Vollständige Galerie Button
  document.getElementById('fullGalleryButton').addEventListener('click', () => {
    window.location.href = 'gallery_full.html';
  });
});

// Add a modal to display images
function createImageModal() {
  const modal = document.createElement('div');
  modal.id = 'imageModal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  modal.style.display = 'none';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';

  const img = document.createElement('img');
  img.id = 'modalImage';
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  modal.appendChild(img);

  modal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.body.appendChild(modal);
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
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.onclick = () => {
      const modal = document.getElementById('imageModal');
      const modalImage = document.getElementById('modalImage');
      modalImage.src = image.photo_url;
      modal.style.display = 'flex';
    };

    const info = document.createElement('div');
    info.className = 'gallery-info';

    const user = document.createElement('p');
    user.className = 'gallery-user';
    user.textContent = `Von: ${image.user}`;

    const date = document.createElement('p');
    date.className = 'gallery-date';
    date.textContent = `${new Date(image.timestamp).toLocaleDateString('de-DE')}`;

    const text = document.createElement('p');
    text.className = 'gallery-text';
    text.textContent = image.text || 'Keine Nachricht';

    info.appendChild(user);
    info.appendChild(date);
    info.appendChild(text);
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
