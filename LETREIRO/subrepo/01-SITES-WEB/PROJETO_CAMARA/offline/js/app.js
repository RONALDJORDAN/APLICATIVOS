// ==================== NSTechWeb Offline - Full App ====================
// 100% Offline - localStorage persistence

// ===== DATA LAYER =====
const DB = {
    get(key) { try { return JSON.parse(localStorage.getItem('nstech_' + key)) || []; } catch { return []; } },
    set(key, data) { localStorage.setItem('nstech_' + key, JSON.stringify(data)); },
    nextId(key) {
        const items = this.get(key);
        return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    }
};

// ===== SEED DATA =====
function seedData() {
    if (localStorage.getItem('nstech_seeded')) return;

    const vereadores = [
        { id: 1001, nome: 'ALEXANDRE PEREIRA DOS SANTOS', partido: 'MDB', foto: '' },
        { id: 1002, nome: 'ROBSON ALFREDO DA SILVA MOURA', partido: 'PP', foto: '' },
        { id: 1003, nome: 'ASSIS DO MERCADO', partido: 'PSD', foto: '' },
        { id: 1005, nome: 'CICERO ALVES BARBOSA', partido: 'PDT', foto: '' },
        { id: 1006, nome: 'EDSON FRANCISCO DA SILVA', partido: 'PSB', foto: '' },
        { id: 1007, nome: 'ERIVALDO DA SILVA', partido: 'PT', foto: '' },
        { id: 1008, nome: 'FABIO LUIZ DOS SANTOS SILVA', partido: 'PMDB', foto: '' },
        { id: 1009, nome: 'GENIVAL DA SILVA', partido: 'PL', foto: '' },
        { id: 1010, nome: 'GILVAN FRANCISCO DA SILVA', partido: 'PSDB', foto: '' },
        { id: 1011, nome: 'JOSE CARLOS DA SILVA', partido: 'DEM', foto: '' },
        { id: 1012, nome: 'LAUTER CAVALCANTE', partido: 'PP', foto: '' },
        { id: 1013, nome: 'JOSE AGNALDO DOS SANTOS', partido: 'MDB', foto: '' },
        { id: 1014, nome: 'PETRONIO VERCOSA', partido: 'PSD', foto: '' },
        { id: 1015, nome: 'SIMONE DE LIMA E SILVA', partido: 'PT', foto: '' },
        { id: 1016, nome: 'WELLINGTON DA SILVA (TINHO)', partido: 'PDT', foto: '' },
        { id: 1017, nome: 'PREFEITURA MUNICIPAL SMC', partido: '-', foto: '' },
        { id: 1019, nome: 'ARSÊNIO MARTINS DA SILVA', partido: 'PSDB', foto: '' },
        { id: 1020, nome: 'DJALMA DA SILVA', partido: 'PSB', foto: '' },
        { id: 1021, nome: 'EDVALDO PEREIRA', partido: 'PL', foto: '' },
        { id: 1022, nome: 'WELLBERT TELES', partido: 'DEM', foto: '' },
        { id: 1023, nome: 'PEDRO DA SAUDE', partido: 'PMDB', foto: '' },
        { id: 1024, nome: 'JAILTON CORREIA', partido: 'MDB', foto: '' },
        { id: 1025, nome: 'BERNARD BOMFIM CORREIA', partido: 'PP', foto: '' },
        { id: 1026, nome: 'GLEYDSON DOS SANTOS', partido: 'PSD', foto: '' },
        { id: 1027, nome: 'ADRIANA DE CARVALHO SILVA DE OMENA', partido: 'PT', foto: '' },
        { id: 1028, nome: 'IVANILDO DOS SANTOS', partido: 'PDT', foto: '' },
        { id: 1030, nome: 'JOSE CICERO DA SILVA', partido: 'PSB', foto: '' },
        { id: 1031, nome: 'JOSIVALDO JOSE DA SILVA', partido: 'PL', foto: '' },
    ];
    DB.set('vereadores', vereadores);

    const tiposMateria = ['INDICAÇÃO', 'MOÇÃO', 'PROJETO DE LEI', 'REQUERIMENTO', 'RESOLUÇÃO', 'VETO'];
    const materias = [];
    for (let i = 1; i <= 40; i++) {
        materias.push({
            id: i,
            tipo: tiposMateria[Math.floor(Math.random() * tiposMateria.length)],
            autorId: vereadores[Math.floor(Math.random() * (vereadores.length - 1))].id,
            protocolo: `${String(i).padStart(3, '0')}/${2025}`,
            titulo: `Matéria legislativa nº ${i} - ${tiposMateria[i % tiposMateria.length]}`,
            texto: `Texto completo da matéria legislativa número ${i}.`,
            dataEntrada: `${String((i % 28) + 1).padStart(2, '0')}/${String((i % 12) + 1).padStart(2, '0')}/2025`,
            tipoAutoria: i % 3 === 0 ? 'Executivo' : 'Legislativo',
            status: ['P', 'V', 'F'][i % 3]
        });
    }
    DB.set('materias', materias);

    const sessoes = [
        { id: 132, data: '12/12/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [1, 2, 3] },
        { id: 131, data: '01/12/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [4, 5] },
        { id: 130, data: '10/11/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [6, 7, 8] },
        { id: 129, data: '03/11/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'E', materiaIds: [9] },
        { id: 128, data: '20/10/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [10, 11, 12] },
        { id: 127, data: '13/10/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [13, 14] },
        { id: 126, data: '03/10/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [] },
        { id: 125, data: '22/09/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [15, 16] },
        { id: 124, data: '01/09/2025', horaInicio: '10:00', horaFim: '12:00', tipo: 'O', materiaIds: [17, 18, 19] },
        { id: 123, data: '18/08/2025', horaInicio: '10:00', horaFim: '12:00', tipo: 'E', materiaIds: [20] },
        { id: 122, data: '11/08/2025', horaInicio: '10:00', horaFim: '12:00', tipo: 'O', materiaIds: [] },
        { id: 121, data: '14/07/2025', horaInicio: '19:00', horaFim: '21:00', tipo: 'E', materiaIds: [21, 22] },
        { id: 120, data: '07/07/2025', horaInicio: '10:00', horaFim: '13:00', tipo: 'O', materiaIds: [23, 24, 25] },
    ];
    DB.set('sessoes', sessoes);
    DB.set('votos', []);
    localStorage.setItem('nstech_seeded', '1');
}

// ===== UTILITIES =====
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function esc(s) { return s ? String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }
function toast(msg, type = 'success') {
    const c = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' error' : '');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}
function getVereadorNome(id) {
    const v = DB.get('vereadores').find(v => v.id === id);
    return v ? v.nome : 'N/A';
}
function statusLabel(s) {
    const map = { P: ['Pendente', 'badge-orange'], V: ['Em Votação', 'badge-blue'], F: ['Finalizada', 'badge-green'] };
    const [label, cls] = map[s] || ['Desconhecido', 'badge-gray'];
    return `<span class="badge ${cls}">${label}</span>`;
}
function tipoSessaoLabel(t) { return t === 'O' ? 'Ordinária' : 'Extraordinária'; }

// ===== ROUTER =====
const routes = {};
function route(hash, fn) { routes[hash] = fn; }
function navigate(hash) { location.hash = hash; }
function handleRoute() {
    const hash = location.hash.slice(1) || 'dashboard';
    const [page, ...params] = hash.split('/');
    const fn = routes[page];
    if (fn) fn(...params);
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
}
window.addEventListener('hashchange', handleRoute);

// ===== MODAL HELPERS =====
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ===== VIEW: DASHBOARD =====
route('dashboard', () => {
    const sessoes = DB.get('sessoes'), materias = DB.get('materias'), vereadores = DB.get('vereadores');
    const votos = DB.get('votos');
    const pendentes = materias.filter(m => m.status === 'P').length;
    const finalizadas = materias.filter(m => m.status === 'F').length;

    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header"><h1>📊 Painel de Controle</h1></div>
            <div class="grid-4">
                <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-info"><h3>${sessoes.length}</h3><p>Sessões</p></div></div>
                <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-info"><h3>${materias.length}</h3><p>Matérias</p></div></div>
                <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-info"><h3>${vereadores.length}</h3><p>Vereadores</p></div></div>
                <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-info"><h3>${pendentes}</h3><p>Pendentes</p></div></div>
            </div>
            <div class="grid-2" style="margin-top:20px">
                <div class="card">
                    <div class="card-header">Últimas Sessões</div>
                    <div class="card-body no-pad"><div class="table-wrap">
                        <table><thead><tr><th>Data</th><th>Horário</th><th>Tipo</th><th>Matérias</th></tr></thead>
                        <tbody>${sessoes.slice(0, 5).map(s => `<tr onclick="navigate('pautas/${s.id}')">
                            <td>${esc(s.data)}</td><td>${esc(s.horaInicio)} - ${esc(s.horaFim)}</td>
                            <td><span class="badge ${s.tipo === 'O' ? 'badge-green' : 'badge-orange'}">${tipoSessaoLabel(s.tipo)}</span></td>
                            <td>${s.materiaIds.length}</td>
                        </tr>`).join('')}</tbody></table>
                    </div></div>
                </div>
                <div class="card">
                    <div class="card-header">Matérias Recentes</div>
                    <div class="card-body no-pad"><div class="table-wrap">
                        <table><thead><tr><th>Tipo</th><th>Autor</th><th>Status</th></tr></thead>
                        <tbody>${materias.slice(0, 8).map(m => `<tr onclick="navigate('materias')">
                            <td>${esc(m.tipo)}</td><td style="font-size:0.75rem">${esc(getVereadorNome(m.autorId))}</td>
                            <td>${statusLabel(m.status)}</td>
                        </tr>`).join('')}</tbody></table>
                    </div></div>
                </div>
            </div>
        </div>`;
});

// ===== VIEW: VEREADORES =====
route('vereadores', () => {
    const vereadores = DB.get('vereadores');
    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1>👥 Vereadores</h1>
                <button class="btn btn-primary" onclick="editVereador()">+ Novo Vereador</button>
            </div>
            <div class="card"><div class="card-body no-pad"><div class="table-wrap table-scroll">
                <table><thead><tr><th>ID</th><th>Nome</th><th>Partido</th><th>Ações</th></tr></thead>
                <tbody>${vereadores.map(v => `<tr>
                    <td>${v.id}</td><td><strong>${esc(v.nome)}</strong></td><td><span class="badge badge-blue">${esc(v.partido)}</span></td>
                    <td class="actions-cell">
                        <button class="btn btn-secondary btn-sm" onclick="editVereador(${v.id})">✏️ Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteVereador(${v.id})">🗑️</button>
                    </td>
                </tr>`).join('')}</tbody></table>
            </div></div></div>
        </div>`;
});

window.editVereador = (id) => {
    const v = id ? DB.get('vereadores').find(x => x.id === id) : { id: 0, nome: '', partido: '', foto: '' };
    $('#modalArea').innerHTML = `
        <div class="modal-overlay show" id="mdlVer">
            <div class="modal"><div class="modal-header"><h3>${id ? 'Editar' : 'Novo'} Vereador</h3>
                <button class="modal-close" onclick="closeModal('mdlVer')">✕</button></div>
            <div class="modal-body">
                <div class="form-group"><label>Nome</label><input class="form-control" id="fVerNome" value="${esc(v.nome)}"></div>
                <div class="form-group"><label>Partido</label><input class="form-control" id="fVerPartido" value="${esc(v.partido)}"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('mdlVer')">Cancelar</button>
                <button class="btn btn-primary" onclick="saveVereador(${v.id})">Gravar</button>
            </div></div></div>`;
};
window.saveVereador = (id) => {
    const nome = $('#fVerNome').value.trim(), partido = $('#fVerPartido').value.trim();
    if (!nome) return toast('Nome obrigatório', 'error');
    let list = DB.get('vereadores');
    if (id) { list = list.map(v => v.id === id ? { ...v, nome, partido } : v); }
    else { list.push({ id: DB.nextId('vereadores'), nome: nome.toUpperCase(), partido: partido.toUpperCase(), foto: '' }); }
    DB.set('vereadores', list);
    closeModal('mdlVer'); toast('Vereador salvo!'); navigate('vereadores');
};
window.deleteVereador = (id) => {
    if (!confirm('Deseja excluir este vereador?')) return;
    DB.set('vereadores', DB.get('vereadores').filter(v => v.id !== id));
    toast('Vereador excluído!'); navigate('vereadores');
};

// ===== VIEW: MATÉRIAS =====
route('materias', () => {
    const materias = DB.get('materias');
    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1>📋 Matérias</h1>
                <button class="btn btn-primary" onclick="editMateria()">+ Nova Matéria</button>
            </div>
            <div class="card"><div class="card-body no-pad"><div class="table-wrap table-scroll">
                <table><thead><tr><th>ID</th><th>Tipo</th><th>Protocolo</th><th>Autor</th><th>Título</th><th>Dt.Entrada</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>${materias.map(m => `<tr>
                    <td>${m.id}</td><td><span class="badge badge-gray">${esc(m.tipo)}</span></td><td>${esc(m.protocolo)}</td>
                    <td style="font-size:0.75rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(getVereadorNome(m.autorId))}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.titulo)}</td>
                    <td>${esc(m.dataEntrada)}</td><td>${statusLabel(m.status)}</td>
                    <td class="actions-cell">
                        <button class="btn btn-secondary btn-sm" onclick="editMateria(${m.id})">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMateria(${m.id})">🗑️</button>
                    </td>
                </tr>`).join('')}</tbody></table>
            </div></div></div>
        </div>`;
});

window.editMateria = (id) => {
    const m = id ? DB.get('materias').find(x => x.id === id) : { id: 0, tipo: 'INDICAÇÃO', autorId: '', protocolo: '', titulo: '', texto: '', dataEntrada: '', tipoAutoria: 'Legislativo', status: 'P' };
    const vereadores = DB.get('vereadores');
    const tipos = ['INDICAÇÃO', 'MOÇÃO', 'PROJETO DE LEI', 'REQUERIMENTO', 'RESOLUÇÃO', 'VETO'];
    $('#modalArea').innerHTML = `
        <div class="modal-overlay show" id="mdlMat">
            <div class="modal" style="max-width:640px"><div class="modal-header"><h3>${id ? 'Editar' : 'Nova'} Matéria</h3>
                <button class="modal-close" onclick="closeModal('mdlMat')">✕</button></div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group"><label>Tipo</label><select class="form-control" id="fMatTipo">${tipos.map(t => `<option ${m.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Protocolo</label><input class="form-control" id="fMatProt" value="${esc(m.protocolo)}"></div>
                </div>
                <div class="form-group"><label>Autor</label><select class="form-control" id="fMatAutor">${vereadores.map(v => `<option value="${v.id}" ${m.autorId === v.id ? 'selected' : ''}>${esc(v.nome)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Título</label><input class="form-control" id="fMatTit" value="${esc(m.titulo)}"></div>
                <div class="form-group"><label>Texto da Matéria</label><textarea class="form-control" id="fMatTxt">${esc(m.texto)}</textarea></div>
                <div class="form-row-3">
                    <div class="form-group"><label>Data Entrada</label><input class="form-control" id="fMatDt" value="${esc(m.dataEntrada)}" placeholder="dd/mm/aaaa"></div>
                    <div class="form-group"><label>Tipo Autoria</label><select class="form-control" id="fMatTpAut"><option ${m.tipoAutoria === 'Legislativo' ? 'selected' : ''}>Legislativo</option><option ${m.tipoAutoria === 'Executivo' ? 'selected' : ''}>Executivo</option></select></div>
                    <div class="form-group"><label>Status</label><select class="form-control" id="fMatSts"><option value="P" ${m.status === 'P' ? 'selected' : ''}>Pendente</option><option value="V" ${m.status === 'V' ? 'selected' : ''}>Em Votação</option><option value="F" ${m.status === 'F' ? 'selected' : ''}>Finalizada</option></select></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('mdlMat')">Cancelar</button>
                <button class="btn btn-primary" onclick="saveMateria(${m.id})">Gravar</button>
            </div></div></div>`;
};
window.saveMateria = (id) => {
    const obj = {
        tipo: $('#fMatTipo').value, autorId: parseInt($('#fMatAutor').value),
        protocolo: $('#fMatProt').value, titulo: $('#fMatTit').value, texto: $('#fMatTxt').value,
        dataEntrada: $('#fMatDt').value, tipoAutoria: $('#fMatTpAut').value, status: $('#fMatSts').value
    };
    if (!obj.titulo) return toast('Título obrigatório', 'error');
    let list = DB.get('materias');
    if (id) { list = list.map(m => m.id === id ? { ...m, ...obj } : m); }
    else { list.push({ id: DB.nextId('materias'), ...obj }); }
    DB.set('materias', list);
    closeModal('mdlMat'); toast('Matéria salva!'); navigate('materias');
};
window.deleteMateria = (id) => {
    if (!confirm('Deseja excluir esta matéria?')) return;
    DB.set('materias', DB.get('materias').filter(m => m.id !== id));
    toast('Matéria excluída!'); navigate('materias');
};

// ===== VIEW: SESSÕES E PAUTAS =====
route('pautas', (selectedId) => {
    const sessoes = DB.get('sessoes'), materias = DB.get('materias');
    const sel = selectedId ? sessoes.find(s => s.id === parseInt(selectedId)) : null;
    const matPauta = sel ? materias.filter(m => sel.materiaIds.includes(m.id)) : [];
    const matPendentes = sel ? materias.filter(m => m.status === 'P' && !sel.materiaIds.includes(m.id)) : [];

    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header"><h1>📅 Sessões e Pautas</h1>
                <button class="btn btn-primary" onclick="editSessao()">+ Nova Sessão</button></div>
            <div class="grid-2">
                <div class="card">
                    <div class="card-header">Sessões (${sessoes.length})</div>
                    <div class="card-body no-pad"><div class="table-scroll">
                        <table><thead><tr><th>Data</th><th>Início</th><th>Fim</th><th>Tipo</th><th>Ações</th></tr></thead>
                        <tbody>${sessoes.map(s => `<tr class="${sel && sel.id === s.id ? 'selected' : ''}" onclick="navigate('pautas/${s.id}')">
                            <td><strong>${esc(s.data)}</strong></td><td>${esc(s.horaInicio)}</td><td>${esc(s.horaFim)}</td>
                            <td><span class="badge ${s.tipo === 'O' ? 'badge-green' : 'badge-orange'}">${tipoSessaoLabel(s.tipo)}</span></td>
                            <td class="actions-cell">
                                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();editSessao(${s.id})">✏️</button>
                                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteSessao(${s.id})">🗑️</button>
                            </td>
                        </tr>`).join('')}</tbody></table>
                    </div></div>
                </div>
                <div>
                    <div class="card">
                        <div class="card-header">Matérias da Pauta${sel ? ` - ${sel.data} (${matPauta.length})` : ''}
                            ${sel ? `<button class="btn btn-ghost btn-sm" onclick="printPauta(${sel.id})">🖨️ Imprimir</button>` : ''}
                        </div>
                        <div class="card-body no-pad"><div class="table-wrap table-scroll-sm">
                            ${matPauta.length ? `<table><thead><tr><th>ID</th><th>Tipo</th><th>Autor</th><th>Título</th><th>Status</th><th></th></tr></thead>
                            <tbody>${matPauta.map(m => `<tr><td>${m.id}</td><td>${esc(m.tipo)}</td>
                                <td style="font-size:0.75rem">${esc(getVereadorNome(m.autorId))}</td>
                                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.titulo)}</td>
                                <td>${statusLabel(m.status)}</td>
                                <td><button class="btn btn-danger btn-sm" onclick="removeMatPauta(${sel.id},${m.id})">✕</button></td>
                            </tr>`).join('')}</tbody></table>` :
                            `<div class="empty-msg">Selecione uma sessão para ver as matérias</div>`}
                        </div></div>
                    </div>
                    ${sel ? `<div class="card">
                        <div class="card-header">Matérias Pendentes (${matPendentes.length})</div>
                        <div class="card-body no-pad"><div class="table-wrap table-scroll-sm">
                            ${matPendentes.length ? `<table><thead><tr><th>ID</th><th>Tipo</th><th>Autor</th><th>Título</th><th></th></tr></thead>
                            <tbody>${matPendentes.map(m => `<tr><td>${m.id}</td><td>${esc(m.tipo)}</td>
                                <td style="font-size:0.75rem">${esc(getVereadorNome(m.autorId))}</td>
                                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.titulo)}</td>
                                <td><button class="btn btn-success btn-sm" onclick="addMatPauta(${sel.id},${m.id})">+ Incluir</button></td>
                            </tr>`).join('')}</tbody></table>` :
                            `<div class="empty-msg">Nenhuma matéria pendente</div>`}
                        </div></div>
                    </div>` : ''}
                </div>
            </div>
        </div>`;
});

window.editSessao = (id) => {
    const s = id ? DB.get('sessoes').find(x => x.id === id) : { id: 0, data: '', horaInicio: '', horaFim: '', tipo: 'O', materiaIds: [] };
    $('#modalArea').innerHTML = `
        <div class="modal-overlay show" id="mdlSes">
            <div class="modal"><div class="modal-header"><h3>${id ? 'Editar' : 'Nova'} Sessão</h3>
                <button class="modal-close" onclick="closeModal('mdlSes')">✕</button></div>
            <div class="modal-body">
                <div class="form-group"><label>Data</label><input class="form-control" id="fSesData" value="${esc(s.data)}" placeholder="dd/mm/aaaa"></div>
                <div class="form-row">
                    <div class="form-group"><label>Hora Início</label><input class="form-control" id="fSesIni" value="${esc(s.horaInicio)}" placeholder="HH:MM"></div>
                    <div class="form-group"><label>Hora Término</label><input class="form-control" id="fSesFim" value="${esc(s.horaFim)}" placeholder="HH:MM"></div>
                </div>
                <div class="form-group"><label>Tipo</label><div class="radio-group">
                    <label><input type="radio" name="tipoSes" value="O" ${s.tipo === 'O' ? 'checked' : ''}> Ordinária</label>
                    <label><input type="radio" name="tipoSes" value="E" ${s.tipo === 'E' ? 'checked' : ''}> Extraordinária</label>
                </div></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('mdlSes')">Cancelar</button>
                <button class="btn btn-primary" onclick="saveSessao(${s.id})">Gravar</button>
            </div></div></div>`;
};
window.saveSessao = (id) => {
    const obj = { data: $('#fSesData').value, horaInicio: $('#fSesIni').value, horaFim: $('#fSesFim').value, tipo: document.querySelector('input[name=tipoSes]:checked')?.value || 'O' };
    if (!obj.data) return toast('Data obrigatória', 'error');
    let list = DB.get('sessoes');
    if (id) { list = list.map(s => s.id === id ? { ...s, ...obj } : s); }
    else { list.unshift({ id: DB.nextId('sessoes'), ...obj, materiaIds: [] }); }
    DB.set('sessoes', list); closeModal('mdlSes'); toast('Sessão salva!'); navigate('pautas');
};
window.deleteSessao = (id) => {
    if (!confirm('Excluir esta sessão?')) return;
    DB.set('sessoes', DB.get('sessoes').filter(s => s.id !== id)); toast('Sessão excluída!'); navigate('pautas');
};
window.addMatPauta = (sesId, matId) => {
    let list = DB.get('sessoes');
    list = list.map(s => s.id === sesId ? { ...s, materiaIds: [...s.materiaIds, matId] } : s);
    DB.set('sessoes', list); toast('Matéria incluída!'); navigate('pautas/' + sesId);
};
window.removeMatPauta = (sesId, matId) => {
    let list = DB.get('sessoes');
    list = list.map(s => s.id === sesId ? { ...s, materiaIds: s.materiaIds.filter(i => i !== matId) } : s);
    DB.set('sessoes', list); toast('Matéria removida!'); navigate('pautas/' + sesId);
};
window.printPauta = (id) => {
    const s = DB.get('sessoes').find(x => x.id === id);
    const mats = DB.get('materias').filter(m => s.materiaIds.includes(m.id));
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Pauta ${s.data}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}th{background:#004d1a;color:#fff}h1{font-size:18px;color:#004d1a}h2{font-size:14px}</style></head><body>
    <h1>Câmara de São Miguel dos Campos - AL</h1><h2>Pauta da Sessão ${tipoSessaoLabel(s.tipo)} - ${s.data} (${s.horaInicio} às ${s.horaFim})</h2>
    <table><thead><tr><th>Nº</th><th>Tipo</th><th>Autor</th><th>Protocolo</th><th>Título</th></tr></thead>
    <tbody>${mats.map((m, i) => `<tr><td>${i + 1}</td><td>${m.tipo}</td><td>${getVereadorNome(m.autorId)}</td><td>${m.protocolo}</td><td>${m.titulo}</td></tr>`).join('')}</tbody></table>
    </body></html>`);
    w.document.close(); w.print();
};

// ===== VIEW: VOTAÇÃO =====
route('votacao', () => {
    const sessoes = DB.get('sessoes');
    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header"><h1>🗳️ Processo de Votação</h1></div>
            <div class="card"><div class="card-body">
                <div class="form-row">
                    <div class="form-group"><label>Selecione a Sessão</label>
                        <select class="form-control" id="selSesVot" onchange="loadVotacao()">
                            <option value="">-- Selecione --</option>
                            ${sessoes.map(s => `<option value="${s.id}">${s.data} - ${tipoSessaoLabel(s.tipo)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>Selecione a Matéria</label>
                        <select class="form-control" id="selMatVot" onchange="loadVotePanel()">
                            <option value="">-- Selecione a sessão primeiro --</option>
                        </select>
                    </div>
                </div>
            </div></div>
            <div id="votePanelArea"></div>
        </div>`;
});

window.loadVotacao = () => {
    const sesId = parseInt($('#selSesVot').value);
    if (!sesId) return;
    const s = DB.get('sessoes').find(x => x.id === sesId);
    const mats = DB.get('materias').filter(m => s.materiaIds.includes(m.id));
    $('#selMatVot').innerHTML = `<option value="">-- Selecione --</option>` + mats.map(m => `<option value="${m.id}">${m.protocolo} - ${m.titulo}</option>`).join('');
};

let timerInterval = null, timerSeconds = 0;
window.loadVotePanel = () => {
    const matId = parseInt($('#selMatVot').value);
    if (!matId) { $('#votePanelArea').innerHTML = ''; return; }
    const vereadores = DB.get('vereadores').filter(v => v.partido !== '-');
    const votos = DB.get('votos');
    const sesId = parseInt($('#selSesVot').value);
    timerSeconds = 0;

    $('#votePanelArea').innerHTML = `
        <div class="card" style="margin-top:16px">
            <div class="card-header">Painel de Votação
                <div>
                    <button class="btn btn-ghost btn-sm" onclick="startTimer()">▶ Iniciar</button>
                    <button class="btn btn-ghost btn-sm" onclick="stopTimer()">⏸ Pausar</button>
                    <button class="btn btn-ghost btn-sm" onclick="resetTimer()">↺ Zerar</button>
                </div>
            </div>
            <div class="card-body">
                <div class="timer-display" id="timerDisplay">00:00</div>
                <div class="vote-panel" id="voteCards">
                    ${vereadores.map(v => {
                        const voto = votos.find(x => x.sesId === sesId && x.matId === matId && x.verId === v.id);
                        const cur = voto ? voto.voto : '';
                        return `<div class="vote-card">
                            <div class="ver-name">${esc(v.nome.split(' ').slice(0, 2).join(' '))}</div>
                            <div class="vote-btns">
                                <button class="vote-sim ${cur === 'S' ? 'active' : ''}" onclick="registerVoto(${sesId},${matId},${v.id},'S')">SIM</button>
                                <button class="vote-nao ${cur === 'N' ? 'active' : ''}" onclick="registerVoto(${sesId},${matId},${v.id},'N')">NÃO</button>
                                <button class="vote-abs ${cur === 'A' ? 'active' : ''}" onclick="registerVoto(${sesId},${matId},${v.id},'A')">ABS</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div id="voteResult" style="margin-top:16px"></div>
                <div style="text-align:center;margin-top:12px">
                    <button class="btn btn-primary btn-lg" onclick="finalizarVotacao(${sesId},${matId})">✅ Finalizar Votação</button>
                </div>
            </div>
        </div>`;
    updateVoteResult(sesId, matId);
};

window.registerVoto = (sesId, matId, verId, voto) => {
    let votos = DB.get('votos');
    votos = votos.filter(v => !(v.sesId === sesId && v.matId === matId && v.verId === verId));
    votos.push({ sesId, matId, verId, voto });
    DB.set('votos', votos);
    loadVotePanel();
};

function updateVoteResult(sesId, matId) {
    const votos = DB.get('votos').filter(v => v.sesId === sesId && v.matId === matId);
    const sim = votos.filter(v => v.voto === 'S').length;
    const nao = votos.filter(v => v.voto === 'N').length;
    const abs = votos.filter(v => v.voto === 'A').length;
    const total = votos.length;
    const el = document.getElementById('voteResult');
    if (el) el.innerHTML = `<div class="grid-3" style="text-align:center">
        <div class="stat-card" style="justify-content:center"><div class="stat-info"><h3 style="color:#2e7d32">${sim}</h3><p>Sim</p></div></div>
        <div class="stat-card" style="justify-content:center"><div class="stat-info"><h3 style="color:#c62828">${nao}</h3><p>Não</p></div></div>
        <div class="stat-card" style="justify-content:center"><div class="stat-info"><h3 style="color:#e65100">${abs}</h3><p>Abstenção</p></div></div>
    </div><p style="text-align:center;margin-top:8px;color:var(--text2);font-size:0.85rem">Total de votos: ${total}</p>`;
}

window.finalizarVotacao = (sesId, matId) => {
    let materias = DB.get('materias');
    materias = materias.map(m => m.id === matId ? { ...m, status: 'F' } : m);
    DB.set('materias', materias);
    stopTimer(); toast('Votação finalizada!');
    loadVotePanel();
};

window.startTimer = () => { if (timerInterval) return; timerInterval = setInterval(() => { timerSeconds++; const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0'); const s = String(timerSeconds % 60).padStart(2, '0'); const el = document.getElementById('timerDisplay'); if (el) el.textContent = `${m}:${s}`; }, 1000); };
window.stopTimer = () => { clearInterval(timerInterval); timerInterval = null; };
window.resetTimer = () => { stopTimer(); timerSeconds = 0; const el = document.getElementById('timerDisplay'); if (el) el.textContent = '00:00'; };

// ===== VIEW: CONSULTA =====
route('consulta', () => {
    const materias = DB.get('materias'), vereadores = DB.get('vereadores');
    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header"><h1>🔍 Consulta de Matérias</h1></div>
            <div class="card"><div class="card-body">
                <div class="form-row-3">
                    <div class="form-group"><label>Tipo</label><select class="form-control" id="cTipo" onchange="filterConsulta()"><option value="">Todos</option><option>INDICAÇÃO</option><option>MOÇÃO</option><option>PROJETO DE LEI</option><option>REQUERIMENTO</option><option>RESOLUÇÃO</option><option>VETO</option></select></div>
                    <div class="form-group"><label>Autor</label><select class="form-control" id="cAutor" onchange="filterConsulta()"><option value="">Todos</option>${vereadores.map(v => `<option value="${v.id}">${esc(v.nome)}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Status</label><select class="form-control" id="cStatus" onchange="filterConsulta()"><option value="">Todos</option><option value="P">Pendente</option><option value="V">Em Votação</option><option value="F">Finalizada</option></select></div>
                </div>
            </div></div>
            <div class="card"><div class="card-body no-pad"><div id="consultaResults" class="table-wrap table-scroll"></div></div></div>
        </div>`;
    filterConsulta();
});

window.filterConsulta = () => {
    let materias = DB.get('materias');
    const tipo = $('#cTipo')?.value, autor = $('#cAutor')?.value, status = $('#cStatus')?.value;
    if (tipo) materias = materias.filter(m => m.tipo === tipo);
    if (autor) materias = materias.filter(m => m.autorId === parseInt(autor));
    if (status) materias = materias.filter(m => m.status === status);
    const el = document.getElementById('consultaResults');
    if (!el) return;
    el.innerHTML = materias.length ? `<table><thead><tr><th>ID</th><th>Tipo</th><th>Protocolo</th><th>Autor</th><th>Título</th><th>Data</th><th>Autoria</th><th>Status</th></tr></thead>
        <tbody>${materias.map(m => `<tr><td>${m.id}</td><td>${esc(m.tipo)}</td><td>${esc(m.protocolo)}</td>
            <td style="font-size:0.75rem">${esc(getVereadorNome(m.autorId))}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.titulo)}</td>
            <td>${esc(m.dataEntrada)}</td><td>${esc(m.tipoAutoria)}</td><td>${statusLabel(m.status)}</td>
        </tr>`).join('')}</tbody></table>` : `<div class="empty-msg">Nenhuma matéria encontrada</div>`;
};

// ===== VIEW: RELATÓRIOS =====
route('relatorios', () => {
    const votos = DB.get('votos'), sessoes = DB.get('sessoes'), materias = DB.get('materias'), vereadores = DB.get('vereadores').filter(v => v.partido !== '-');
    // Presença por vereador
    const presenca = vereadores.map(v => {
        const votou = new Set(votos.filter(x => x.verId === v.id).map(x => x.sesId));
        return { nome: v.nome, partido: v.partido, presencas: votou.size, total: sessoes.length, pct: sessoes.length ? Math.round(votou.size / sessoes.length * 100) : 0 };
    }).sort((a, b) => b.pct - a.pct);

    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header"><h1>📊 Relatórios</h1>
                <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir</button></div>
            <div class="card">
                <div class="card-header">Presença dos Vereadores nas Votações</div>
                <div class="card-body no-pad"><div class="table-wrap">
                    <table><thead><tr><th>Vereador</th><th>Partido</th><th>Presenças</th><th>Total Sessões</th><th>%</th></tr></thead>
                    <tbody>${presenca.map(p => `<tr><td><strong>${esc(p.nome)}</strong></td><td><span class="badge badge-blue">${esc(p.partido)}</span></td>
                        <td>${p.presencas}</td><td>${p.total}</td>
                        <td><span class="badge ${p.pct >= 75 ? 'badge-green' : p.pct >= 50 ? 'badge-orange' : 'badge-red'}">${p.pct}%</span></td>
                    </tr>`).join('')}</tbody></table>
                </div></div>
            </div>
            <div class="card" style="margin-top:16px">
                <div class="card-header">Resumo de Matérias por Status</div>
                <div class="card-body">
                    <div class="grid-3">
                        <div class="stat-card" style="justify-content:center"><div class="stat-info"><h3 style="color:#e65100">${materias.filter(m=>m.status==='P').length}</h3><p>Pendentes</p></div></div>
                        <div class="stat-card" style="justify-content:center"><div class="stat-info"><h3 style="color:#1565c0">${materias.filter(m=>m.status==='V').length}</h3><p>Em Votação</p></div></div>
                        <div class="stat-card" style="justify-content:center"><div class="stat-info"><h3 style="color:#2e7d32">${materias.filter(m=>m.status==='F').length}</h3><p>Finalizadas</p></div></div>
                    </div>
                </div>
            </div>
        </div>`;
});

// ===== VIEW: CONFIG =====
route('config', () => {
    $('#view').innerHTML = `
        <div class="page">
            <div class="page-header"><h1>⚙️ Configurações</h1></div>
            <div class="card"><div class="card-body">
                <h3 style="margin-bottom:16px;color:var(--primary)">Gerenciamento de Dados</h3>
                <div style="display:flex;gap:12px;flex-wrap:wrap">
                    <button class="btn btn-primary" onclick="exportData()">📥 Exportar Dados (JSON)</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">📤 Importar Dados</button>
                    <input type="file" id="importFile" accept=".json" style="display:none" onchange="importData(event)">
                    <button class="btn btn-danger" onclick="resetData()">🗑️ Resetar Tudo</button>
                </div>
                <p style="margin-top:16px;color:var(--text2);font-size:0.82rem">Os dados são salvos automaticamente no navegador (localStorage). Use Exportar para criar backup.</p>
            </div></div>
        </div>`;
});

window.exportData = () => {
    const data = { vereadores: DB.get('vereadores'), materias: DB.get('materias'), sessoes: DB.get('sessoes'), votos: DB.get('votos') };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `nstech_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast('Dados exportados!');
};
window.importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.vereadores) DB.set('vereadores', data.vereadores);
            if (data.materias) DB.set('materias', data.materias);
            if (data.sessoes) DB.set('sessoes', data.sessoes);
            if (data.votos) DB.set('votos', data.votos);
            toast('Dados importados!'); navigate('dashboard');
        } catch { toast('Arquivo inválido', 'error'); }
    };
    reader.readAsText(file);
};
window.resetData = () => {
    if (!confirm('ATENÇÃO: Todos os dados serão perdidos! Continuar?')) return;
    localStorage.removeItem('nstech_seeded');
    ['vereadores', 'materias', 'sessoes', 'votos'].forEach(k => localStorage.removeItem('nstech_' + k));
    seedData(); toast('Dados resetados!'); navigate('dashboard');
};

// ===== SIDEBAR TOGGLE =====
window.toggleSidebar = () => { $('.sidebar').classList.toggle('open'); };

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    seedData();
    handleRoute();
    // Close sidebar on nav click (mobile)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-item') && window.innerWidth <= 768) {
            $('.sidebar').classList.remove('open');
        }
    });
});
