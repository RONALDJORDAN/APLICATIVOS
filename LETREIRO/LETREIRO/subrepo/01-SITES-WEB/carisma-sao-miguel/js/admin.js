import { logoutUser, loginUser, monitorAuthState, getAllUsers, getAllAttendance, updateUserRole, getPendingInscriptions, approveInscription, rejectInscription, getApprovedInscriptions, updateStudentData, deleteStudentData, resetStudentAuth } from './app.js';

document.addEventListener('DOMContentLoaded', () => {

    const loginSection = document.getElementById('admin-login-section');
    const adminPanel = document.getElementById('admin-panel');

    // ------------------------------------------------
    // Monitora estado de autenticação
    // ------------------------------------------------
    monitorAuthState(async (user) => {
        if (!user) {
            // Sem sessão: mostra a tela de login do admin
            showLogin();
        } else if (user.role !== 'admin') {
            // Usuário é aluno — acesso negado, desloga e mantém no login
            await showAlert("Acesso Negado", 'Esta área é restrita a administradores.', 'error');
            logoutUser();
            showLogin();
        } else {
            // Admin autenticado com sucesso
            hideLogin();
            initAdmin(user);
        }
    });

    function showLogin() {
        if (loginSection) loginSection.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';
    }

    function hideLogin() {
        if (loginSection) loginSection.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'flex';
    }

    // ------------------------------------------------
    // Formulário de Login do Admin (próprio da página)
    // ------------------------------------------------
    const formAdminLogin = document.getElementById('formAdminLogin');
    if (formAdminLogin) {
        formAdminLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formAdminLogin.querySelector('button[type="submit"]');
            const orig = btn.innerHTML;
            btn.innerHTML = 'Verificando... <i class="ph ph-spinner ph-spin"></i>';
            btn.disabled = true;

            const email = document.getElementById('admin-email').value.trim();
            const senha = document.getElementById('admin-senha').value;

            const res = await loginUser(email, senha);
            if (!res.success) {
                await showAlert("Erro de Login", res.message, 'error');
                btn.innerHTML = orig;
                btn.disabled = false;
            }
            // onAuthStateChanged vai lidar com a verificação de role automaticamente
        });
    }

    // ------------------------------------------------
    // Navegação entre Abas
    // ------------------------------------------------
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            const target = item.getAttribute('data-tab');
            document.getElementById(`tab-${target}`)?.classList.add('active');
        });
    });

    // ------------------------------------------------
    // Logout
    // ------------------------------------------------
    const btnLogout = document.getElementById('btn-admin-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => await logoutUser());
    }

    // ------------------------------------------------
    // Modal Edit (Admin)
    // ------------------------------------------------
    const editModal = document.getElementById('edit-student-modal');
    const formEdit = document.getElementById('formEditStudent');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const btnResetAuth = document.getElementById('btn-reset-auth');

    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => {
            editModal.classList.remove('active');
        });
    }

    // ------------------------------------------------
    // SISTEMA DE MODAIS CUSTOMIZADOS (ALERT/CONFIRM)
    // ------------------------------------------------
    function showAlert(title, text, type = 'success') {
        const modal = document.getElementById('custom-alert-modal');
        const titleEl = document.getElementById('alert-title');
        const textEl = document.getElementById('alert-text');
        const iconEl = document.getElementById('alert-icon');
        const btnOk = document.getElementById('btn-alert-ok');

        titleEl.innerText = title;
        textEl.innerText = text;
        iconEl.innerHTML = type === 'success'
            ? '<i class="ph ph-check-circle"></i>'
            : '<i class="ph ph-warning-circle" style="color:#ff4d4f;"></i>';

        modal.classList.add('active');

        return new Promise((resolve) => {
            btnOk.onclick = () => {
                modal.classList.remove('active');
                resolve();
            };
        });
    }

    function showConfirm(title, text) {
        const modal = document.getElementById('custom-confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const textEl = document.getElementById('confirm-text');
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');

        titleEl.innerText = title;
        textEl.innerText = text;
        modal.classList.add('active');

        return new Promise((resolve) => {
            btnOk.onclick = () => {
                modal.classList.remove('active');
                resolve(true);
            };
            btnCancel.onclick = () => {
                modal.classList.remove('active');
                resolve(false);
            };
        });
    }

    // ------------------------------------------------
    // Painel Admin — Carregamento principal
    // ------------------------------------------------
    async function initAdmin(user) {
        setLoading(true);

        const [usersData, attendanceData, approvedInscriptions] = await Promise.all([
            getAllUsers(),
            getAllAttendance(),
            getApprovedInscriptions()
        ]);

        setLoading(false);

        // Separa alunos e admins para as estatísticas corretas
        const alunos = usersData.filter(u => u.role === 'aluno');

        loadDashboardStats(alunos, attendanceData);
        loadRecentActivities(attendanceData);
        loadUsersTable(usersData, attendanceData, approvedInscriptions);
        loadInscriptions();

        // Busca em tempo real
        const searchInput = document.getElementById('search-student');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterUsers(e.target.value.toLowerCase());
            });
        }
    }

    function setLoading(isLoading) {
        const spinner = '<i class="ph ph-spinner ph-spin"></i>';
        if (isLoading) {
            const el = (id) => { const e = document.getElementById(id); if (e) e.innerHTML = spinner; };
            el('stat-total-students');
            el('stat-total-attendance');
            el('stat-today-attendance');
            const tbl = document.getElementById('recent-activities-table');
            if (tbl) tbl.innerHTML = `<tr><td colspan="5" style="text-align:center;">${spinner}</td></tr>`;
            const stb = document.getElementById('students-table');
            if (stb) stb.innerHTML = `<tr><td colspan="5" style="text-align:center;">${spinner}</td></tr>`;
        }
    }

    // ------------------------------------------------
    // Estatísticas do Dashboard
    // ------------------------------------------------
    function loadDashboardStats(alunos, attendance) {
        const hoje = new Date().toISOString().split('T')[0];
        const hojeCount = attendance.filter(a => a.date === hoje).length;

        document.getElementById('stat-total-students').innerText = alunos.length;
        document.getElementById('stat-total-attendance').innerText = attendance.length;
        document.getElementById('stat-today-attendance').innerText = hojeCount;
    }

    // ------------------------------------------------
    // Últimas atividades no Dashboard
    // ------------------------------------------------
    function loadRecentActivities(attendance) {
        const tbody = document.getElementById('recent-activities-table');
        const recent = [...attendance]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">Nenhuma atividade ainda.</td></tr>';
            return;
        }

        tbody.innerHTML = recent.map(r => {
            const [y, m, d] = r.date.split('-');
            const photoEl = r.photoUrl
                ? `<a href="${r.photoUrl}" target="_blank"><img src="${r.photoUrl}" alt="Foto" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid var(--primary);"></a>`
                : `<span style="color:var(--text-muted); font-size:0.8rem;">Sem Foto</span>`;

            return `
                <tr>
                    <td>${photoEl}</td>
                    <td style="font-weight:500;">${r.userName}</td>
                    <td>${d}/${m}/${y}</td>
                    <td>${r.time}</td>
                    <td><span style="color:#4caf50;"><i class="ph ph-check-circle"></i> Presente</span></td>
                </tr>`;
        }).join('');
    }

    // ------------------------------------------------
    // Tabela de Usuários com botão de alteração de Role
    // ------------------------------------------------
    let allUsersData = [];

    function loadUsersTable(users, attendance, approvedInscriptions) {
        // Mapeia usuários reais
        const activeUsers = users.map(u => ({
            ...u,
            totalPresences: u.role === 'admin' ? '—' : attendance.filter(a => a.userId === u.id).length,
            status: 'ativo'
        }));

        // Mapeia inscrições aprovadas (que ainda não logaram)
        const pendingFirstLogin = approvedInscriptions.map(i => ({
            id: i.id,
            nome: `${i.nome} ${i.sobrenome}`.trim(),
            email: i.expected_login, // Mostra apenas o login sem @carisma.com
            data_nascimento: i.data_nascimento,
            telefone: i.telefone,
            role: 'aluno',
            totalPresences: 0,
            status: 'pre-ativo'
        }));

        allUsersData = [...activeUsers, ...pendingFirstLogin];
        renderUsersTable(allUsersData);
    }

    function filterUsers(term) {
        const filtered = allUsersData.filter(u =>
            u.nome?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term)
        );
        renderUsersTable(filtered);
    }

    function renderUsersTable(data) {
        const tbody = document.getElementById('students-table');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => {
            const isPreAtivo = u.status === 'pre-ativo';
            const isAluno = u.role === 'aluno';
            const btnColor = isAluno ? 'var(--primary)' : '#ff4d4f';
            const btnIcon = isAluno ? 'ph-arrow-fat-up' : 'ph-arrow-fat-down';
            const btnLabel = isAluno ? 'Tornar Admin' : 'Tornar Aluno';
            const nextRole = isAluno ? 'admin' : 'aluno';

            let roleLabel = u.role === 'admin'
                ? '<span style="background:rgba(242,95,34,0.2);color:var(--primary);padding:2px 8px;border-radius:4px;font-size:0.8rem;">ADMIN</span>'
                : '<span style="background:rgba(255,255,255,0.08);color:var(--text-secondary);padding:2px 8px;border-radius:4px;font-size:0.8rem;">ALUNO</span>';

            if (isPreAtivo) {
                roleLabel += ' <span style="background:rgba(230,168,34,0.2);color:#e6a822;padding:2px 8px;border-radius:4px;font-size:0.65rem;margin-left:5px;">AGUARDANDO 1º LOGIN</span>';
            }

            const actionsHtml = isPreAtivo
                ? `<span style="color:var(--text-muted); font-size:0.8rem;">(Aguardando ativação)</span>`
                : `<button
                    class="btn-role-toggle"
                    style="background:transparent;border:1px solid ${btnColor};color:${btnColor};padding:0.4rem 0.8rem;border-radius:6px;cursor:pointer;font-size:0.85rem;"
                    data-id="${u.id}"
                    data-newrole="${nextRole}" title="${btnLabel}">
                    <i class="ph ${btnIcon}"></i> Cargo
                </button>`;

            // Serializa os dados do usuário para colocar no dataset do botão Editar com segurança
            const safeData = encodeURIComponent(JSON.stringify(u));

            return `
                <tr>
                    <td style="font-weight:500;">${u.nome} <br>${roleLabel}</td>
                    <td>${u.email}</td>
                    <td>${u.telefone || '—'}</td>
                    <td style="font-family:var(--font-heading);font-weight:800;font-size:1.2rem;">${u.totalPresences}</td>
                    <td>
                        <div style="display:flex; gap:0.5rem; justify-content:flex-start; align-items:center;">
                            ${actionsHtml}
                            <button
                                class="btn-edit-student"
                                style="background:#5e35b1; border:none; color:#fff; padding:0.4rem 0.6rem; border-radius:6px; cursor:pointer;"
                                data-encoded="${safeData}" title="Editar Dados">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            ${!isPreAtivo ? `
                            <button
                                class="btn-delete-student"
                                style="background:#ff4d4f; border:none; color:#fff; padding:0.4rem 0.6rem; border-radius:6px; cursor:pointer;"
                                data-id="${u.id}" data-ispre="false" title="Excluir Aluno">
                                <i class="ph ph-trash"></i>
                            </button>
                            ` : `
                            <button
                                class="btn-delete-student"
                                style="background:#ff4d4f; border:none; color:#fff; padding:0.4rem 0.6rem; border-radius:6px; cursor:pointer;"
                                data-id="${u.id}" data-ispre="true" title="Cancelar Inscrição">
                                <i class="ph ph-trash"></i>
                            </button>
                            `}
                        </div>
                    </td>
                </tr>`;
        }).join('');

        // Eventos dos botões
        tbody.querySelectorAll('.btn-role-toggle').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = btn.getAttribute('data-id');
                const nextRole = btn.getAttribute('data-newrole');
                const action = nextRole === 'admin' ? 'tornar ADMINISTRADOR' : 'tornar ALUNO';

                const confirmed = await showConfirm("Alterar Cargo", `Tem certeza que deseja ${action} este usuário?`);
                if (!confirmed) return;

                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Aguarde...';
                btn.disabled = true;

                const res = await updateUserRole(userId, nextRole);
                if (res.success) {
                    await showAlert("Sucesso", `Cargo atualizado para: ${nextRole.toUpperCase()}`);
                    window.location.reload();
                } else {
                    await showAlert("Erro", 'Erro ao alterar cargo: ' + (res.message || 'Tente novamente.'), 'error');
                    btn.disabled = false;
                    btn.innerHTML = btn.getAttribute('data-newrole') === 'admin'
                        ? '<i class="ph ph-arrow-fat-up"></i> Cargo'
                        : '<i class="ph ph-arrow-fat-down"></i> Cargo';
                }
            });
        });

        // Eventos EXCLUIR
        tbody.querySelectorAll('.btn-delete-student').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await showConfirm("Excluir Usuário", 'ATENÇÃO: Deseja realmente excluir este usuário do sistema? Esta ação o impedirá de acessar o painel e não pode ser desfeita.');
                if (!confirmed) return;

                const id = btn.getAttribute('data-id');
                const isPre = btn.getAttribute('data-ispre') === 'true';

                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                btn.disabled = true;

                const res = await deleteStudentData(id, isPre);
                if (res.success) {
                    await showAlert("Excluído", 'Usuário removido com sucesso.');
                    window.location.reload();
                } else {
                    await showAlert("Erro", 'Erro ao excluir: ' + res.message, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-trash"></i>';
                }
            });
        });

        // Eventos EDITAR (Abrir modal)
        tbody.querySelectorAll('.btn-edit-student').forEach(btn => {
            btn.addEventListener('click', () => {
                const rawData = decodeURIComponent(btn.getAttribute('data-encoded'));
                const student = JSON.parse(rawData);

                // Preencher campos
                document.getElementById('edit-id').value = student.id;
                document.getElementById('edit-id').dataset.ispre = student.status === 'pre-ativo' ? 'true' : 'false';
                document.getElementById('edit-nome').value = student.nome;

                // Se o Firebase tiver o campo data_nascimento salvo
                document.getElementById('edit-data-nasc').value = student.data_nascimento || '';

                document.getElementById('edit-whatsapp').value = student.telefone || '';
                document.getElementById('edit-email').value = student.email || '';
                document.getElementById('edit-extras').value = student.extras || '';

                // Ocultar block resetAuth se for um pre-ativo (pois a senha já é limpa e ele não logou)
                if (student.status === 'pre-ativo') {
                    btnResetAuth.style.display = 'none';
                } else {
                    btnResetAuth.style.display = 'block';
                }

                editModal.classList.add('active');
            });
        });
    }

    // Modal Salvar Edição
    if (formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btn-save-edit');
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvando...';

            const id = document.getElementById('edit-id').value;
            const isPre = document.getElementById('edit-id').dataset.ispre === 'true';

            const payload = {
                nome: document.getElementById('edit-nome').value.trim(),
                telefone: document.getElementById('edit-whatsapp').value.trim(),
                data_nascimento: document.getElementById('edit-data-nasc').value, // novo campo no users tb
                extras: document.getElementById('edit-extras').value.trim()
            };

            const res = await updateStudentData(id, isPre, payload);
            if (res.success) {
                await showAlert("Sucesso", 'Dados atualizados com sucesso!');
                window.location.reload();
            } else {
                await showAlert("Erro", 'Erro ao salvar: ' + res.message, 'error');
                btnSave.disabled = false;
                btnSave.innerHTML = 'Salvar Alterações';
            }
        });
    }

    // Modal Resetar Acesso via Auth (Lazy Creation Fake)
    if (btnResetAuth) {
        btnResetAuth.addEventListener('click', async () => {
            const confirmed = await showConfirm("Resetar Acesso", 'VOCÊ TEM CERTEZA?\n\nIsso vai invalidar o acesso atual do usuário. Ele passará para a lista "Aguardando 1º Login" e precisará usar seu 1º Nome e Data de Nasc. como login a partir de agora.');
            if (!confirmed) return;

            btnResetAuth.disabled = true;
            btnResetAuth.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Resetando...';

            const id = document.getElementById('edit-id').value;
            const nomeStr = document.getElementById('edit-nome').value;
            const nascStr = document.getElementById('edit-data-nasc').value;
            const telStr = document.getElementById('edit-whatsapp').value;

            if (!nascStr || !nomeStr) {
                await showAlert("Atenção", "Nome e Data de Nascimento são obrigatórios para gerar o novo acesso. Preencha-os e clique em Resetar.", 'error');
                btnResetAuth.disabled = false;
                btnResetAuth.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Resetar Acesso';
                return;
            }

            const res = await resetStudentAuth(id, nomeStr, nascStr, telStr);

            if (res.success) {
                await showAlert("Reset Concluído!", `Novo Usuário: ${res.login}\nNova Senha: ${res.senha}\n\nCopie essa informação e envie ao aluno.`);
                window.location.reload();
            } else {
                await showAlert("Erro", 'Erro ao resetar acesso: ' + res.message, 'error');
                btnResetAuth.disabled = false;
                btnResetAuth.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Resetar Acesso';
            }
        });
    }

    // ------------------------------------------------
    // Tabela de Inscrições Pendentes
    // ------------------------------------------------
    async function loadInscriptions() {
        const tbody = document.getElementById('inscriptions-table');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;"><i class="ph ph-spinner ph-spin"></i> Carregando...</td></tr>`;

        const inscriptions = await getPendingInscriptions();

        if (inscriptions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">Nenhuma inscrição pendente.</td></tr>';
            return;
        }

        tbody.innerHTML = inscriptions.map(i => {
            return `
                <tr>
                    <td style="font-weight:500;">${i.nome} ${i.sobrenome}</td>
                    <td>${new Date(i.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td>${i.telefone}</td>
                    <td style="font-size:0.85rem; color:var(--text-secondary);">${new Date(i.data_solicitacao).toLocaleString('pt-BR')}</td>
                    <td>
                        <button class="btn-approve" data-id="${i.id}" style="background:#4caf50; border:none; color:#fff; padding:0.4rem 0.8rem; border-radius:6px; cursor:pointer; margin-right:0.5rem;" title="Aprovar">
                            <i class="ph ph-check"></i>
                        </button>
                        <button class="btn-reject" data-id="${i.id}" style="background:#ff4d4f; border:none; color:#fff; padding:0.4rem 0.8rem; border-radius:6px; cursor:pointer;" title="Rejeitar">
                            <i class="ph ph-x"></i>
                        </button>
                    </td>
                </tr>`;
        }).join('');

        // Eventos Aprovar/Rejeitar
        tbody.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await showConfirm("Aprovar Aluno", 'Deseja aprovar este aluno? Ele poderá fazer login usando Login: (1º Nome + DataNasc) e Senha: (DataNasc).');
                if (!confirmed) return;

                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                btn.disabled = true;
                const id = btn.getAttribute('data-id');
                const res = await approveInscription(id);
                if (res.success) {
                    await showAlert("Sucesso", 'Aluno aprovado com sucesso!');
                    loadInscriptions(); // recarrega a tabela
                } else {
                    await showAlert("Erro", 'Erro ao aprovar.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-check"></i>';
                }
            });
        });

        tbody.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await showConfirm("Rejeitar Inscrição", 'Deseja realmente rejeitar esta inscrição?');
                if (!confirmed) return;

                btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
                btn.disabled = true;
                const id = btn.getAttribute('data-id');
                const res = await rejectInscription(id);
                if (res.success) {
                    await showAlert("Sucesso", 'Inscrição rejeitada.');
                    loadInscriptions(); // recarrega a tabela
                } else {
                    await showAlert("Erro", 'Erro ao rejeitar.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-x"></i>';
                }
            });
        });
    }

});
