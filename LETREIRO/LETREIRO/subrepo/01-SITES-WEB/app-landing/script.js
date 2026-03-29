// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDklNxvjx2i9PDuBI5AhuqpSGbedrlXlYs",
    authDomain: "teste-f2dfb.firebaseapp.com",
    databaseURL: "https://teste-f2dfb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "teste-f2dfb",
    storageBucket: "teste-f2dfb.firebasestorage.app",
    messagingSenderId: "824690991990",
    appId: "1:824690991990:web:355c25a2c7bbe7a8985057",
    measurementId: "G-GQ6QND2PXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Reference to the APK file in Firebase Storage
// NOTE to user: Make sure the file "app.apk" is uploaded to the root of your Firebase Storage bucket
const apkRef = ref(storage, 'app.apk');

document.addEventListener('DOMContentLoaded', async () => {
    const downloadSection = document.getElementById('download-section');

    try {
        // Obter URL de download do Firebase Storage
        const appDownloadLink = await getDownloadURL(apkRef);

        const copyLinkHTML = `
            <div class="copy-link-section">
                <p>Link de Acesso (Depois de Instalar):</p>
                <div class="copy-container">
                    <input type="text" value="https://paodeacucar.innovplay.com.br/" readonly id="link-input">
                    <button id="btn-copy-link" title="Copiar Link">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            </div>
        `;

        // Mostra o botão de download para todos os dispositivos
        downloadSection.innerHTML = `
            <a href="${appDownloadLink}" class="btn-download" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-download"></i>
                Baixar Aplicativo
            </a>
            ${copyLinkHTML}
        `;

        // Adiciona evento de clique para o botão de copiar
        const btnCopy = document.getElementById('btn-copy-link');
        const linkInput = document.getElementById('link-input');

        if (btnCopy && linkInput) {
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(linkInput.value).then(() => {
                    const icon = btnCopy.querySelector('i');
                    icon.className = 'fa-solid fa-check';
                    btnCopy.style.background = '#10B981';
                    btnCopy.style.color = 'white';
                    btnCopy.style.borderColor = '#10B981';

                    setTimeout(() => {
                        icon.className = 'fa-regular fa-copy';
                        btnCopy.style = '';
                    }, 2000);
                }).catch(err => {
                    console.error('Falha ao copiar texto: ', err);
                });
            });
        }
    } catch (error) {
        console.error("Erro ao obter link de download:", error);

        // Em caso de erro (ex: arquivo não encontrado, sem permissão)
        downloadSection.innerHTML = `
            <div class="non-android-msg">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 32px; color: #EF4444;"></i>
                <p style="text-align: center;">Não foi possível carregar o link de download.<br>Verifique se o arquivo está no Firebase Storage.</p>
            </div>
        `;
    }
});
