// ═══════════════════════════════════════════════════════
// AUREO HUB — AUTH GUARD + FIREBASE (auth.js)
// Inclua ANTES do app.js em todas as páginas protegidas
// ═══════════════════════════════════════════════════════

const _FIREBASE_CONFIG = {
    apiKey: "AIzaSyDklNxvjx2i9PDuBI5AhuqpSGbedrlXlYs",
    authDomain: "teste-f2dfb.firebaseapp.com",
    projectId: "teste-f2dfb",
    storageBucket: "teste-f2dfb.firebasestorage.app",
    messagingSenderId: "824690991990",
    appId: "1:824690991990:web:355c25a2c7bbe7a8985057",
    measurementId: "G-GQ6QND2PXZ"
};

// Inicializa só uma vez (evita o erro "already initialized")
if (!firebase.apps.length) {
    firebase.initializeApp(_FIREBASE_CONFIG);
}
const auth = firebase.auth();

// Guarda o usuário atual globalmente
window.currentUser = null;

// ─── GUARD: Redireciona para login se não autenticado ─────────────
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.replace('login.html');
        return;
    }
    window.currentUser = user;

    // Injeta o avatar e nome na header de todas as páginas
    const headerUser = document.getElementById('headerUser');
    if (headerUser) {
        const displayName = user.displayName || user.email.split('@')[0];
        const photoUrl = user.photoURL
            ? `<img src="${user.photoURL}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
            : `<div style="width:32px;height:32px;border-radius:50%;background:var(--primary);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:0.85rem;">${displayName[0].toUpperCase()}</div>`;
        headerUser.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="document.getElementById('userMenu').classList.toggle('show')" title="Menu do usuário">
                ${photoUrl}
                <span style="font-size:0.82rem;font-weight:600;color:#fff;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayName}</span>
                <i class="fas fa-chevron-down" style="font-size:0.65rem;color:var(--text-muted);"></i>
            </div>
            <div id="userMenu" style="display:none;position:absolute;top:110%;right:0;background:#0d0f1a;border:1px solid var(--border);border-radius:14px;padding:8px;min-width:180px;z-index:999;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
                <div style="padding:10px 12px;border-bottom:1px solid var(--border);margin-bottom:6px;">
                    <div style="font-size:0.8rem;font-weight:700;color:#fff;">${displayName}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;">${user.email}</div>
                </div>
                <button onclick="doLogout()" style="width:100%;background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.2);color:var(--danger);padding:9px 12px;border-radius:9px;cursor:pointer;font-size:0.82rem;font-weight:700;font-family:inherit;text-align:left;transition:0.2s;" onmouseover="this.style.background='rgba(255,77,109,0.15)'" onmouseout="this.style.background='rgba(255,77,109,0.08)'">
                    <i class="fas fa-right-from-bracket"></i> Sair do Hub
                </button>
            </div>`;
        headerUser.style.position = 'relative';

        // Fecha menu ao clicar fora
        document.addEventListener('click', e => {
            const menu = document.getElementById('userMenu');
            if (menu && !headerUser.contains(e.target)) menu.classList.remove('show');
        });

        // Aplica estilo show para display flex
        const style = document.createElement('style');
        style.textContent = `#userMenu.show { display: block !important; animation: fadeInUp 0.2s ease; }`;
        document.head.appendChild(style);
    }
});

// ─── LOGOUT ───────────────────────────────────────────────────────
window.doLogout = function() {
    openDangerConfirm({
        title: 'Sair do Aureo Hub',
        message: 'Tem certeza que deseja encerrar a sessão atual?',
        btnLabel: 'Sim, Sair',
        onConfirm: async () => {
            await auth.signOut();
            window.location.replace('login.html');
        }
    });
};  // <-- ponto-e-vírgula obrigatório antes do IIFE abaixo

// ═══════════════════════════════════════════════════════
// MODAL DE CONFIRMAÇÃO EM DUAS ETAPAS (2-Step Confirm)
// Para ações perigosas (exclusão de repositórios, etc.)
// ═══════════════════════════════════════════════════════
;(function injectConfirmModal() {

    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.style.cssText = `
        position:fixed;top:0;left:0;right:0;bottom:0;
        background:rgba(0,0,0,0.85);backdrop-filter:blur(15px);
        display:none;align-items:center;justify-content:center;
        z-index:9999;padding:20px;`;
    modal.innerHTML = `
        <div style="background:#0d0f1a;border:1px solid rgba(255,77,109,0.3);border-radius:24px;
                    max-width:480px;width:100%;padding:2.5rem;animation:modalSlideUp 0.4s cubic-bezier(0.23,1,0.32,1);
                    box-shadow:0 30px 60px rgba(0,0,0,0.8);">
            <div style="text-align:center;margin-bottom:1.5rem;">
                <div id="confirmIcon" style="width:64px;height:64px;border-radius:50%;
                    background:rgba(255,77,109,0.12);border:2px solid rgba(255,77,109,0.3);
                    display:inline-flex;align-items:center;justify-content:center;
                    font-size:1.6rem;color:#ff4d6d;margin-bottom:1rem;">
                    <i class="fas fa-triangle-exclamation"></i>
                </div>
                <h3 id="confirmTitle" style="color:#fff;font-size:1.3rem;font-weight:800;margin-bottom:0.5rem;"></h3>
                <p id="confirmMessage" style="color:#6b7280;font-size:0.88rem;line-height:1.6;"></p>
            </div>

            <!-- ETAPA 2: Redigitar o nome para confirmar -->
            <div id="confirmStep2" style="display:none;margin-bottom:1.5rem;">
                <label style="font-size:0.75rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;">
                    <i class="fas fa-shield-halved" style="color:#ffca28;"></i> Digite exatamente para confirmar:
                </label>
                <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,202,40,0.3);border-radius:10px;padding:10px 14px;font-size:0.85rem;color:#ffca28;font-family:monospace;margin-bottom:10px;" id="confirmRequiredText"></div>
                <input type="text" id="confirmInput" placeholder="Digite aqui..."
                    style="width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px 14px;color:#fff;font-size:0.9rem;outline:none;font-family:monospace;"
                    oninput="validateConfirmInput()">
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="closeConfirmModal()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:11px 20px;border-radius:10px;cursor:pointer;font-size:0.88rem;font-weight:600;font-family:inherit;transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                    Cancelar
                </button>
                <button id="confirmActionBtn" onclick="_executeConfirmAction()" disabled style="background:rgba(255,77,109,0.15);border:1px solid rgba(255,77,109,0.3);color:#ff4d6d;padding:11px 20px;border-radius:10px;cursor:not-allowed;font-size:0.88rem;font-weight:700;font-family:inherit;transition:0.3s;opacity:0.5;">
                    <i class="fas fa-trash-alt"></i> <span id="confirmBtnLabel">Confirmar</span>
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
})();

let _confirmCallback = null;
let _confirmRequired = null;

/**
 * Abre o modal de confirmação em 2 etapas.
 * @param {Object} options
 * @param {string} options.title  - Título do modal
 * @param {string} options.message - Descrição do perigo
 * @param {string} options.confirmText - Texto que o usuário deve digitar (se quiser 2a etapa)
 * @param {string} options.btnLabel - Texto do botão de confirmar
 * @param {Function} options.onConfirm - Callback executado se o usuário confirmar
 */
window.openDangerConfirm = function({ title, message, confirmText, btnLabel = 'Confirmar', onConfirm }) {
    _confirmCallback = onConfirm;
    _confirmRequired = confirmText || null;

    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmBtnLabel').textContent = btnLabel;

    const step2 = document.getElementById('confirmStep2');
    const btn   = document.getElementById('confirmActionBtn');
    const input = document.getElementById('confirmInput');

    if (confirmText) {
        step2.style.display = 'block';
        document.getElementById('confirmRequiredText').textContent = confirmText;
        input.value = '';
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    } else {
        step2.style.display = 'none';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }

    const modal = document.getElementById('confirmModal');
    modal.style.display = 'flex';
}

window.validateConfirmInput = function() {
    const input = document.getElementById('confirmInput').value;
    const btn   = document.getElementById('confirmActionBtn');
    const match = input === _confirmRequired;
    btn.disabled = !match;
    btn.style.opacity = match ? '1' : '0.5';
    btn.style.cursor  = match ? 'pointer' : 'not-allowed';
    btn.style.background = match ? 'rgba(255,77,109,0.3)' : 'rgba(255,77,109,0.15)';
}

window.closeConfirmModal = function() {
    document.getElementById('confirmModal').style.display = 'none';
    _confirmCallback = null;
    _confirmRequired = null;
}

window._executeConfirmAction = function() {
    if (_confirmCallback) _confirmCallback();
    closeConfirmModal();
}
