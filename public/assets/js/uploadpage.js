let selectedFile = null;

document.getElementById('cameraInput').addEventListener('change', (event) => {
selectedFile = event.target.files[0];
document.getElementById('status').textContent = 'Datei ausgewählt: ' + selectedFile.name;
});

document.getElementById('galleryInput').addEventListener('change', (event) => {
selectedFile = event.target.files[0];
document.getElementById('status').textContent = 'Datei ausgewählt: ' + selectedFile.name;
});

async function manualUpload() {
if (!selectedFile) {
    alert('Bitte ein Bild auswählen');
    return;
}

const name = localStorage.getItem('name') || '';
const letterbox = localStorage.getItem('letterbox') || '';

if (!name || !letterbox) {
    alert('Bitte melde dich zuerst an');
    window.location.href = 'index.html';
    return;
}

const userText = document.getElementById('userText').value;
document.getElementById('status').textContent = 'Upload läuft...';

const reader = new FileReader();
reader.onload = async () => {
    const base64 = reader.result.split(',')[1];

    try {
    const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        name: selectedFile.name,
        type: selectedFile.type,
        data: base64,
        text: userText,
        userName: name,
        letterboxId: letterbox
        })
    });

    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }

    document.getElementById('status').textContent = 'Upload erfolgreich!';

    // Nach erfolgreichem Upload das Formular zurücksetzen
    selectedFile = null;
    document.getElementById('cameraInput').value = '';
    document.getElementById('galleryInput').value = '';
    document.getElementById('userText').value = '';
    } catch (error) {
    document.getElementById('status').textContent = 'Fehler: ' + error.message;
    console.error('Upload error:', error);
    }
};

reader.readAsDataURL(selectedFile);
}