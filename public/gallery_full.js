document.addEventListener('DOMContentLoaded', async () => {
  const gallery = document.getElementById('gallery');
  const loading = document.getElementById('loading');
  const noImages = document.getElementById('noImages');

  // UI zurücksetzen
  gallery.innerHTML = '';
  loading.style.display = 'block';
  noImages.style.display = 'none';

  try {
    // Abruf aller Bilder, unabhängig von viewed
    const url = 'https://im4-imbild.ch/unload.php?letterbox_id=5678&limit=100&viewed=all';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.count > 0) {
      data.posts.forEach(image => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => window.open(image.photo_url, '_blank');

        const info = document.createElement('div');
        info.className = 'gallery-info';

        const user = document.createElement('p');
        user.className = 'gallery-user';
        user.textContent = `Von: ${image.user}`;

        const text = document.createElement('p');
        text.className = 'gallery-text';
        text.textContent = image.text || 'Keine Nachricht';

        const date = document.createElement('p');
        date.className = 'gallery-date';
        date.textContent = `${new Date(image.timestamp).toLocaleDateString('de-DE')}`;


        item.appendChild(info);
        info.appendChild(user);
        info.appendChild(text);
        info.appendChild(date);
        gallery.appendChild(item);
      });
      loading.style.display = 'none';
    } else {
      loading.style.display = 'none';
      noImages.style.display = 'block';
    }
  } catch (error) {
    console.error('Fehler beim Laden der Bilder:', error);
    loading.textContent = 'Fehler beim Laden der Bilder: ' + error.message;
  }
});
