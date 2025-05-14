document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name');
    const boxInput = document.getElementById('letterbox');
  
    // Eingaben vorausfüllen, wenn bereits gespeichert
    nameInput.value = localStorage.getItem('name') || '';
    boxInput.value = localStorage.getItem('letterbox') || '';
  
    document.getElementById('save-and-continue').addEventListener('click', () => {
      localStorage.setItem('name', nameInput.value.trim());
      localStorage.setItem('letterbox', boxInput.value.trim());
  
      // Weiterleitung (Dateiname anpassen)
      window.location.href = 'upload.html';
    });
  });
  
  