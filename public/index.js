document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name');
    const boxInput = document.getElementById('letterbox');
    const errorMessage = document.getElementById('error-message');
  
    // Eingaben vorausfüllen, wenn bereits gespeichert
    nameInput.value = localStorage.getItem('name') || '';
    boxInput.value = localStorage.getItem('letterbox') || '';
  
    document.getElementById('save-and-continue').addEventListener('click', () => {
      localStorage.setItem('name', nameInput.value.trim());
      localStorage.setItem('letterbox', boxInput.value.trim());
  
      // Überprüfen, ob die Briefkasten ID ausgefüllt ist
      if (!boxInput.value.trim()) {
        errorMessage.textContent = 'Bitte die Briefkasten ID ausfüllen.';
        errorMessage.style.display = 'block';
        return;
      }
  
      errorMessage.style.display = 'none'; // Fehlernachricht ausblenden, wenn das Feld ausgefüllt ist
      window.location.href = 'upload.html';
    });
  });

