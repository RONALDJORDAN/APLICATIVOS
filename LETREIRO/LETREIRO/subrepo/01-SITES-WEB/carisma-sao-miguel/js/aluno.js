import { loginUser, logoutUser, monitorAuthState, registerAttendance, getUserAttendance, uploadAttendancePhoto, uploadUserProfilePhoto } from './app.js';

document.addEventListener('DOMContentLoaded', () => {

    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    let currentUser = null;

    // ------------------------------------------------
    // Monitora estado de autenticação
    // ------------------------------------------------
    monitorAuthState((user) => {
        if (user) {
            currentUser = user;
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'flex';
            loadDashboard(user);
            initTabs();
        } else {
            loginSection.style.display = 'flex';
            dashboardSection.style.display = 'none';
        }
    });

    // ------------------------------------------------
    // Formulário de Login do Aluno
    // ------------------------------------------------
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formLogin.querySelector('button');
            const orig = btn.innerHTML;
            btn.innerHTML = 'Entrando... <i class="ph ph-spinner ph-spin"></i>';
            btn.disabled = true;

            const usuario = document.getElementById('login-user').value.toLowerCase().replace(/\s+/g, '');
            const senha = document.getElementById('login-senha').value;

            const res = await loginUser(usuario, senha);
            if (!res.success) {
                alert(res.message);
                btn.innerHTML = orig;
                btn.disabled = false;
            }
        });
    }

    // ------------------------------------------------
    // Botão Logout
    // ------------------------------------------------
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            await logoutUser();
        });
    }

    // ------------------------------------------------
    // Dashboard do Aluno
    // ------------------------------------------------
    function loadDashboard(user) {
        document.getElementById('user-name').innerText = user.nome || 'Aluno';

        // Renderiza foto de perfil se existir
        const avatarDiv = document.getElementById('user-avatar');
        if (user.photoURL) {
            avatarDiv.innerHTML = `<img src="${user.photoURL}" alt="Perfil" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            avatarDiv.innerHTML = `<i class="ph ph-user"></i>`;
        }

        const today = new Date();
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').innerText = today.toLocaleDateString('pt-BR', opts);

        verifyClassStatus(user);
        loadHistory(user);
        initPhotoUpload(user);
    }

    // ------------------------------------------------
    // Upload de Foto de Perfil
    // ------------------------------------------------
    function initPhotoUpload(user) {
        const btnChange = document.getElementById('btn-change-photo');
        const avatarDiv = document.getElementById('user-avatar');
        const inputPhoto = document.getElementById('user-photo-input');

        if (!btnChange || !avatarDiv || !inputPhoto) return;

        // Ao clicar no botão ou no avatar, abre o seletor
        const trigger = () => inputPhoto.click();
        btnChange.onclick = trigger;
        avatarDiv.onclick = trigger;

        inputPhoto.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Feedback visual imediato (loading)
            const oldContent = avatarDiv.innerHTML;
            avatarDiv.innerHTML = '<i class="ph ph-spinner ph-spin" style="font-size: 1.5rem;"></i>';
            btnChange.disabled = true;

            const res = await uploadUserProfilePhoto(user.id, file);

            if (res.success) {
                avatarDiv.innerHTML = `<img src="${res.url}" alt="Perfil" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                alert("Erro ao atualizar foto: " + res.message);
                avatarDiv.innerHTML = oldContent;
            }

            btnChange.disabled = false;
            inputPhoto.value = ''; // Reseta input
        };
    }

    async function verifyClassStatus(user) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();

        const btnCheckin = document.getElementById('btn-checkin');
        const checkinMsg = document.getElementById('checkin-msg');
        const checkinSubmsg = document.getElementById('checkin-submsg');
        const classStatusTitle = document.getElementById('class-status-title');
        const classStatusDesc = document.getElementById('class-status-desc');

        const isClassOpen = (dayOfWeek === 1 || dayOfWeek === 2) && (hour >= 18 && hour <= 23);
        const dateString = now.toISOString().split('T')[0];

        btnCheckin.disabled = true;
        btnCheckin.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';

        const attendance = await getUserAttendance(user.id);
        const hasCheckedInToday = attendance.some(a => a.date === dateString);

        if (hasCheckedInToday) {
            classStatusTitle.innerText = "Presença Confirmada!";
            classStatusDesc.innerText = "Sua presença para hoje foi registrada com sucesso. Boa aula!";
            btnCheckin.innerHTML = '<i class="ph ph-check"></i>';
            btnCheckin.classList.add('success');
            checkinMsg.innerText = "Check-in Realizado";
            checkinSubmsg.innerText = "Obrigado por registrar sua presença.";

        } else if (isClassOpen) {
            classStatusTitle.innerText = "Aula em Andamento";
            classStatusDesc.innerText = "O registro de presença está aberto. Clique no botão abaixo.";
            btnCheckin.disabled = false;
            btnCheckin.style.color = 'var(--primary)';
            btnCheckin.innerHTML = '<i class="ph ph-fingerprint"></i>';
            checkinMsg.innerText = "Registrar Presença";
            checkinSubmsg.innerText = "Clique no botão para confirmar";

            btnCheckin.onclick = () => {
                document.getElementById('camera-input').click();
            };

        } else {
            classStatusTitle.innerText = "Nenhuma Aula Aberta";
            classStatusDesc.innerText = "O registro de presença fica disponível às Segundas e Terças, a partir das 18h.";
            btnCheckin.disabled = true;
            btnCheckin.style.color = 'var(--text-muted)';
            btnCheckin.innerHTML = '<i class="ph ph-fingerprint"></i>';
            checkinMsg.innerText = "Presença Bloqueada";
            checkinSubmsg.innerText = "Fora do horário das aulas.";
        }
    }

    async function loadHistory(user) {
        const tbody = document.getElementById('attendance-history');
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;"><i class="ph ph-spinner ph-spin"></i></td></tr>';

        const records = await getUserAttendance(user.id);
        records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        tbody.innerHTML = '';
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhuma presença registrada.</td></tr>';
            return;
        }

        records.forEach(rec => {
            const parts = rec.date.split('-');
            const date = `${parts[2]}/${parts[1]}/${parts[0]} às ${rec.time}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${date}</td><td>${rec.className}</td><td><span class="status-badge present">Presente</span></td>`;
            tbody.appendChild(tr);
        });
    }

    function initTabs() {
        const links = document.querySelectorAll('.sidebar-link[data-tab]');
        const tabs = document.querySelectorAll('.tab-pane');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-tab');
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                tabs.forEach(t => t.classList.remove('active'));
                const targetTab = document.getElementById(`tab-${target}`);
                if (targetTab) targetTab.classList.add('active');
            });
        });
    }

    // ------------------------------------------------
    // Captura e Upload de Foto da Presença
    // ------------------------------------------------
    const cameraInput = document.getElementById('camera-input');
    const photoModal = document.getElementById('photo-modal');
    const photoPreview = document.getElementById('photo-preview');
    const btnCancelPhoto = document.getElementById('btn-cancel-photo');
    const btnConfirmPhoto = document.getElementById('btn-confirm-photo');
    let currentPhotoFile = null;

    if (cameraInput) {
        cameraInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                currentPhotoFile = file;
                photoPreview.src = URL.createObjectURL(file);
                photoModal.classList.add('active');
            }
        });
    }

    if (btnCancelPhoto) {
        btnCancelPhoto.addEventListener('click', () => {
            photoModal.classList.remove('active');
            cameraInput.value = ''; // Reseta o input
            currentPhotoFile = null;
            // Câmera NÃO é reaberta — o aluno pode clicar no botão de presença novamente
        });
    }

    if (btnConfirmPhoto) {
        btnConfirmPhoto.addEventListener('click', async () => {
            if (!currentUser || !currentPhotoFile) return;

            const origHtml = btnConfirmPhoto.innerHTML;
            btnConfirmPhoto.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Enviando...';
            btnConfirmPhoto.disabled = true;
            btnCancelPhoto.disabled = true;

            // Faz o upload da foto para o Storage
            const uploadRes = await uploadAttendancePhoto(currentUser.id, currentPhotoFile);

            if (!uploadRes.success) {
                alert('Erro ao enviar a foto. Tente novamente.');
                btnConfirmPhoto.innerHTML = origHtml;
                btnConfirmPhoto.disabled = false;
                btnCancelPhoto.disabled = false;
                return;
            }

            // Registra a presença
            const dateString = new Date().toISOString().split('T')[0];
            const result = await registerAttendance(currentUser, dateString, uploadRes.url);

            if (result.success) {
                photoModal.classList.remove('active');
                verifyClassStatus(currentUser);
                loadHistory(currentUser);
            } else {
                alert("Erro ao salvar presença: " + result.message);
            }

            btnConfirmPhoto.innerHTML = origHtml;
            btnConfirmPhoto.disabled = false;
            btnCancelPhoto.disabled = false;
            cameraInput.value = '';
            currentPhotoFile = null;
        });
    }

});
