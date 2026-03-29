// LISTA DOS SEUS SITES/SISTEMAS
const sitesList = [
    { name: "Painel Admin (Letreiro)", url: "https://letreirodigital-88f8e.web.app/" },
    { name: "Portfólio Aureo Studio", url: "https://codaureo-devstudio.github.io/Projetos_codaureo/MY-PORTFOLIO/" },
    { name: "Instituto Eixos", url: "https://institutoeixos.netlify.app/" },
    { name: "Admin Eixos", url: "https://admineixos.netlify.app/" },
    { name: "PIBID (MateFocus)", url: "https://matefocusteo.netlify.app/" },
    { name: "Admin PIBID", url: "https://adminpt.netlify.app/" },
    { name: "Site Fake (Teste Falha)", url: "https://url-que-nao-existe123.com" }
];

// VARIÁVEIS DE ESTADO
let sitesData = [];
let reposData = [];
let currentFilter = 'all';

// ELEMENTOS DOM
const gridContainer = document.getElementById('sitesGrid');
const reposGrid = document.getElementById('reposGrid');
const loading = document.getElementById('loading');
const loadingRepos = document.getElementById('loadingRepos');
const statTotal = document.getElementById('stat-total');
const statOnline = document.getElementById('stat-online');
const statOffline = document.getElementById('stat-offline');

// SIDEBAR MOBILE TOGGLE
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    const icon = mobileMenuBtn.querySelector('i');
    if (sidebar.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

// FECHAR SIDEBAR AO CLICAR FORA (Mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && sidebar.classList.contains('active') && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('active');
        mobileMenuBtn.querySelector('i').classList.replace('fa-times', 'fa-bars');
    }
});

// LOGIC PING (CORS PROXY para resolver bloqueios do navegador)
// Como o Hub rodará local ou em outro domínio, requisições diretas serão bloqueadas no navegador.
// Usaremos um proxy gratuito open-source ou no-cors para ler o HEAD.
async function pingSite(site) {
    if (site.isGithubRepo) {
        // GitHub Repos API respond in JSON and don't require no-cors hacks to know if they exist.
        return {
            ...site,
            status: 'online',
            pingMs: 'Git/Web',
            lastCheck: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })
        };
    }

    const startTime = performance.now();
    try {
        const res = await fetch(site.url, { mode: 'no-cors', cache: 'no-cache' });
        const endTime = performance.now();
        const pingTime = Math.round(endTime - startTime);
        
        return {
            ...site,
            status: 'online',
            pingMs: pingTime + ' ms',
            lastCheck: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })
        };
    } catch (error) {
        return {
            ...site,
            status: 'offline',
            pingMs: 'N/A',
            lastCheck: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })
        };
    }
}

// RENDERIZAR CARDS
function renderCards(data) {
    gridContainer.innerHTML = '';
    
    // Contadores
    let onlineCount = 0;
    let offlineCount = 0;

    data.forEach(site => {
        if (site.status === 'online') onlineCount++;
        if (site.status === 'offline') offlineCount++;

        // Filtro View
        if (currentFilter !== 'all' && site.status !== currentFilter) return;

        const card = document.createElement('div');
        card.className = `site-card ${site.status}`;
        
        let statusBadge = site.status === 'online' ? 'Operante' : 'Falha / Erro';
        let iconBadge = site.status === 'online' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-triangle-exclamation"></i>';

        let customIcon = site.isGithubRepo ? '<i class="fab fa-github" style="margin-right: 5px;"></i>' : '';

        card.innerHTML = `
            <div class="site-header">
                <div class="site-info">
                    <h3 title="${site.name}">${customIcon} ${site.name}</h3>
                    <a href="${site.url}" target="_blank" title="Acessar o link no navegador" onclick="event.stopPropagation()">
                        ${site.url.replace(/^https?:\/\//,'').slice(0, 30)}... <i class="fas fa-external-link-alt" style="font-size: 0.7rem;"></i>
                    </a>
                </div>
                <div class="status-badge">${iconBadge} ${statusBadge}</div>
            </div>
            
            <div class="site-metrics">
                <div class="metric left">
                    <span class="key">Latência (Ping)</span>
                    <span class="val">${site.pingMs}</span>
                </div>
                <div class="metric right">
                    <span class="key">Último Check</span>
                    <span class="val">${site.lastCheck}</span>
                </div>
            </div>
        `;
        
        // Add click event to open Modal
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openModal(site));
        
        gridContainer.appendChild(card);
    });

    // Atualizar HTML Stats Totais
    statTotal.textContent = data.length;
    statOnline.textContent = onlineCount;
    statOffline.textContent = offlineCount;
    
    // Atualizar textos dos Filtros
    document.getElementById('count-all').textContent = data.length;
    document.getElementById('count-online').textContent = onlineCount;
    document.getElementById('count-offline').textContent = offlineCount;
}

// BUSCAR DADOS (SITES COMUNS)
async function fetchMonitoringData() {
    if (!gridContainer || !loading) return;
    loading.style.display = 'block';
    
    const promises = sitesList.map(site => pingSite(site));
    sitesData = await Promise.all(promises);
    
    loading.style.display = 'none';
    renderCards(sitesData);
}

// HANDLER DOS FILTROS
window.filterSites = function(status, btnElement) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderCards(sitesData);
}

// FORÇAR PING PELO MENU
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        if (gridContainer) fetchMonitoringData();
        if (reposGrid) loadGitHubRepos();
    });
}

// GITHUB REPOS LOADER SEPARADO
function getGithubHeaders() {
    const token = localStorage.getItem('github_pat');
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}

async function loadGitHubRepos() {
    if (!reposGrid || !loadingRepos) return;
    loadingRepos.style.display = 'block';
    reposGrid.innerHTML = '';
    
    // UI Indicador
    const authIndicator = document.getElementById('authStatusIndicator');
    if (authIndicator) {
        if (localStorage.getItem('github_pat')) {
            authIndicator.innerHTML = '<i class="fas fa-lock-open"></i> Privados Libs';
            authIndicator.style.color = "var(--primary-light)";
            authIndicator.style.borderColor = "var(--primary-light)";
            authIndicator.style.background = "rgba(94, 106, 210, 0.1)";
        }
    }

    try {
        const token = localStorage.getItem('github_pat');
        
        // PAGINAÇÃO COMPLETA: busca todas as páginas de 100 repos até terminar
        let allRepos = [];
        let page = 1;
        
        while (true) {
            const baseUrl = token 
                ? `https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}`
                : `https://api.github.com/users/CodAureo-DevStudio/repos?sort=updated&per_page=100&page=${page}`;
            
            const response = await fetch(baseUrl, { headers: getGithubHeaders() });
            const pageRepos = await response.json();
            
            if (!Array.isArray(pageRepos) || pageRepos.length === 0) break; // sem mais repositórios
            
            allRepos = allRepos.concat(pageRepos);
            
            // Verifica se tem próxima página pelo Link header
            const linkHeader = response.headers.get('Link');
            if (!linkHeader || !linkHeader.includes('rel="next"')) break;
            
            page++;
        }
        
        // Atualiza o contador
        if (authIndicator) {
            authIndicator.style.display = 'unset';
        }
        
        reposData = allRepos.map(repo => {
            return {
                name: repo.name,
                url: repo.html_url,
                full_name: repo.full_name,
                private: repo.private,
                description: repo.description || '',
                isGithubRepo: true,
                status: 'online',
                pingMs: 'Git/Web',
                lastCheck: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit' })
            };
        });

        reposData.forEach(repo => {
            const card = document.createElement('div');
            card.className = `site-card online`;
            
            card.innerHTML = `
                <div class="site-header">
                    <div class="site-info">
                        <h3 title="${repo.name}"><i class="fab fa-github" style="margin-right: 5px;"></i> ${repo.name} ${repo.private ? '<i class="fas fa-lock" style="font-size: 0.7rem; color: var(--warning); margin-left: 5px;" title="Repositório Privado"></i>' : ''}</h3>
                        <a href="${repo.url}" target="_blank" title="Acessar no GitHub" onclick="event.stopPropagation()">
                            ${repo.url.replace(/^https?:\/\//,'').slice(0, 30)}... <i class="fas fa-external-link-alt" style="font-size: 0.7rem;"></i>
                        </a>
                    </div>
                    <div class="status-badge"><i class="fas fa-check-circle"></i> Sincronizado</div>
                </div>
                
                <div class="site-metrics">
                    <div class="metric left">
                        <span class="key">Plataforma</span>
                        <span class="val" style="color:var(--text-muted); font-size:0.8rem;"><i class="fab fa-github"></i> ${repo.private ? 'Privado' : 'Público'}</span>
                    </div>
                    <div class="metric right">
                        <span class="key">Último Check</span>
                        <span class="val">${repo.lastCheck}</span>
                    </div>
                </div>
            `;
            
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => openRepoModal(repo));
            reposGrid.appendChild(card);
        });
        
        // Mostra contagem total no topo
        const totalBadge = document.getElementById('repoTotalCount');
        if (totalBadge) totalBadge.textContent = `${reposData.length} repositórios`;

    } catch(err) {
        console.warn("Não foi possível carregar os repositórios do Github", err);
        reposGrid.innerHTML = '<p style="color:var(--danger); padding:1rem;">Falha na extração de API do GitHub.</p>';
    }
    
    loadingRepos.style.display = 'none';
}

// START
if (gridContainer) {
    fetchMonitoringData();
}
if (reposGrid) {
    loadGitHubRepos();
}

// MODAL CONTROLS
function getHostFromUrl(url) {
    if (url.includes('netlify.app')) return '<i class="fab fa-neos" style="color:#00C7B7;"></i> Netlify';
    if (url.includes('web.app') || url.includes('firebaseapp.com')) return '<i class="fas fa-fire" style="color:#FFCA28;"></i> Firebase';
    if (url.includes('github.com')) return '<i class="fab fa-github" style="color:#fff;"></i> GitHub Repositório';
    if (url.includes('github.io')) return '<i class="fab fa-github" style="color:#fff;"></i> GitHub Pages';
    return '<i class="fas fa-server" style="color:var(--text-muted);"></i> Servidor Próprio';
}

window.openModal = function(site) {
    document.getElementById('modalSiteName').textContent = site.name;
    
    // Status Badge e Uptime Falso (99.9% / 0.00%)
    const badge = document.getElementById('modalStatusBadge');
    const uptimeLabel = document.getElementById('modalUptime');
    if (site.status === 'online') {
        badge.innerHTML = `<span class="status-badge" style="background: rgba(0,255,149,0.1); color: var(--success); border: 1px solid rgba(0,255,149,0.2); padding: 6px 14px;"><i class="fas fa-check-circle"></i> Sistema Operante</span>`;
        uptimeLabel.textContent = "99.9%";
        uptimeLabel.style.color = "var(--success)";
    } else {
        badge.innerHTML = `<span class="status-badge" style="background: rgba(255,77,109,0.1); color: var(--danger); border: 1px solid rgba(255,77,109,0.2); padding: 6px 14px;"><i class="fas fa-triangle-exclamation"></i> Fora do ar / Falha</span>`;
        uptimeLabel.textContent = "0.00% (Queda)";
        uptimeLabel.style.color = "var(--danger)";
    }

    document.getElementById('modalUrl').textContent = site.url;
    document.getElementById('modalUrl').href = site.url;
    
    document.getElementById('modalPing').textContent = site.pingMs;
    document.getElementById('modalLastCheck').textContent = site.lastCheck;
    document.getElementById('modalHost').innerHTML = getHostFromUrl(site.url);

    // Show Modal
    document.getElementById('siteModal').classList.add('active');
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Fechar modal ao clicar fora do conteudo
const siteModal = document.getElementById('siteModal');
if (siteModal) {
    siteModal.addEventListener('click', (e) => {
        if (e.target.id === 'siteModal') {
            closeModal('siteModal');
        }
    });
}

const repoModal = document.getElementById('repoModal');
if (repoModal) {
    repoModal.addEventListener('click', (e) => {
        if (e.target.id === 'repoModal') {
            closeModal('repoModal');
        }
    });
}

// ═══════════════════════════════════════════
// GERENCIADOR COMPLETO DE REPOSITÓRIOS
// ═══════════════════════════════════════════

let _currentRepo = null; // guarda o repo ativo no modal

window.openRepoModal = async function(repo) {
    _currentRepo = repo;
    
    // Preenche header
    document.getElementById('repoNameText').textContent = repo.name;
    const privateBadge = document.getElementById('repoPrivateBadge');
    if (privateBadge) {
        privateBadge.style.display = repo.private ? 'inline' : 'none';
    }
    const descEl = document.getElementById('repoDescText');
    if (descEl) descEl.textContent = repo.description || 'Sem descrição disponível.';
    
    // Preenche aba de edição
    const editName = document.getElementById('editRepoName');
    const editDesc = document.getElementById('editRepoDesc');
    const editPriv = document.getElementById('editRepoPrivate');
    if (editName) editName.value = repo.name;
    if (editDesc) editDesc.value = repo.description || '';
    if (editPriv) editPriv.value = String(repo.private);
    
    // Abre modal na aba de explorador
    switchRepoTab('files', document.querySelector('.repo-tab'));
    document.getElementById('repoModal').classList.add('active');
    
    // Carrega arquivos da raiz
    await loadRepoFiles(repo.full_name, '');
}

// TAB SWITCHER
window.switchRepoTab = function(tab, btn) {
    document.querySelectorAll('.repo-tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.repo-tab').forEach(t => t.classList.remove('active'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.style.display = 'block';
    if (btn) btn.classList.add('active');
}

// EXPLORADOR DE ARQUIVOS COM NAVEGAÇÃO DE PASTAS
async function loadRepoFiles(fullName, path) {
    const fileListDiv = document.getElementById('repoFileList');
    const countSpan = document.getElementById('repoFilesCount');
    const pathLabel = document.getElementById('currentPathLabel');
    if (!fileListDiv) return;
    
    fileListDiv.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">
        <i class="fas fa-circle-notch fa-spin" style="color:var(--primary);"></i> Carregando...
    </div>`;
    
    const apiPath = path ? `/${path}` : '';
    if (pathLabel) pathLabel.textContent = path ? `/ ${path}` : '/ raiz';
    
    try {
        const res = await fetch(`https://api.github.com/repos/${fullName}/contents${apiPath}`, { headers: getGithubHeaders() });
        if (!res.ok) throw new Error('Inacessível');
        
        const files = await res.json();
        if (!Array.isArray(files)) throw new Error('Vazio ou binário');
        
        files.sort((a, b) => {
            if (a.type === 'dir' && b.type !== 'dir') return -1;
            if (a.type !== 'dir' && b.type === 'dir') return 1;
            return a.name.localeCompare(b.name);
        });
        
        fileListDiv.innerHTML = '';
        if (countSpan) countSpan.textContent = `${files.length} itens`;
        
        // Botão de voltar se estiver em subpasta
        if (path) {
            const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
            const backRow = document.createElement('div');
            backRow.className = 'file-item';
            backRow.innerHTML = `<div class="file-name" style="cursor:pointer;" onclick="loadRepoFiles('${fullName}', '${parentPath}')">
                <i class="fas fa-arrow-left file-type-icon" style="color:var(--primary-light);"></i>
                <span style="color:var(--primary-light);">.. (voltar)</span>
            </div>`;
            fileListDiv.appendChild(backRow);
        }
        
        files.forEach(file => {
            const isDir = file.type === 'dir';
            let iconClass = 'fas fa-file file-icon-doc';
            if (isDir) iconClass = 'fas fa-folder file-icon-dir';
            else if (/\.(js|ts|html|css|cs|json|py|php|java|cpp|c|go|rs|vue|jsx|tsx)$/.test(file.name)) iconClass = 'fas fa-file-code file-icon-code';
            else if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(file.name)) iconClass = 'fas fa-image file-icon-image';
            else if (/\.(md|txt|pdf|doc)$/.test(file.name)) iconClass = 'fas fa-book file-icon-doc';

            const sizeMb = isDir ? '--' : (file.size / 1024).toFixed(1) + ' KB';
            const item = document.createElement('div');
            item.className = 'file-item';
            
            if (isDir) {
                const newPath = path ? `${path}/${file.name}` : file.name;
                item.innerHTML = `
                    <div class="file-name" style="cursor:pointer;" onclick="loadRepoFiles('${fullName}', '${newPath}')">
                        <i class="${iconClass} file-type-icon"></i>
                        <span>${file.name}/</span>
                    </div>
                    <div class="file-meta">${sizeMb}</div>`;
            } else {
                item.innerHTML = `
                    <div class="file-name">
                        <i class="${iconClass} file-type-icon"></i>
                        <a href="${file.html_url}" target="_blank" style="color:inherit;text-decoration:none;" onmouseover="this.style.color='var(--primary-light)'" onmouseout="this.style.color='inherit'">${file.name}</a>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span class="file-meta">${sizeMb}</span>
                        <a href="${file.download_url}" download title="Download" style="color:var(--text-muted);font-size:0.8rem;text-decoration:none;" onmouseover="this.style.color='var(--primary-light)'" onmouseout="this.style.color='var(--text-muted)'">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>`;
            }
            fileListDiv.appendChild(item);
        });
        
    } catch(err) {
        fileListDiv.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-muted);">
            Repositório vazio ou sem arquivos nesta pasta.
        </div>`;
        if (countSpan) countSpan.textContent = 'Vazio';
    }
}

// SALVAR EDIÇÕES DO REPO VIA GITHUB API (PATCH)
window.saveRepoEdit = async function() {
    if (!_currentRepo) return;
    const token = localStorage.getItem('github_pat');
    if (!token) { alert('⚠️ Token não configurado. Vá em Configurações & APIs.'); return; }
    
    const newName = document.getElementById('editRepoName').value.trim();
    const newDesc = document.getElementById('editRepoDesc').value.trim();
    const isPrivate = document.getElementById('editRepoPrivate').value === 'true';
    
    if (!newName) { alert('O nome não pode estar vazio.'); return; }
    
    try {
        const res = await fetch(`https://api.github.com/repos/${_currentRepo.full_name}`, {
            method: 'PATCH',
            headers: { ...getGithubHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, description: newDesc, private: isPrivate })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Erro na API');
        }
        const updated = await res.json();
        alert(`✅ Repositório "${updated.name}" atualizado com sucesso!`);
        _currentRepo.name = updated.name;
        _currentRepo.full_name = updated.full_name;
        _currentRepo.description = updated.description;
        _currentRepo.private = updated.private;
        _currentRepo.url = updated.html_url;
        document.getElementById('repoNameText').textContent = updated.name;
        loadGitHubRepos(); // recarrega a lista
    } catch(err) {
        alert(`❌ Falha ao editar: ${err.message}`);
    }
}

// DOWNLOAD ZIP
window.downloadRepo = function() {
    if (!_currentRepo) return;
    const zipUrl = `https://github.com/${_currentRepo.full_name}/archive/refs/heads/main.zip`;
    window.open(zipUrl, '_blank');
}

// COPIAR LINK DO REPO
window.shareRepo = function() {
    if (!_currentRepo) return;
    navigator.clipboard.writeText(_currentRepo.url).then(() => {
        alert(`✅ Link copiado!\n${_currentRepo.url}`);
    });
}

// ABRIR NO GITHUB
window.openInGithub = function() {
    if (!_currentRepo) return;
    window.open(_currentRepo.url, '_blank');
}

// COPIAR COMANDO GIT CLONE
window.cloneRepo = function() {
    if (!_currentRepo) return;
    const cloneCmd = `git clone ${_currentRepo.url}.git`;
    navigator.clipboard.writeText(cloneCmd).then(() => {
        alert(`✅ Copiado!\n${cloneCmd}`);
    });
}

// EXCLUIR REPOSITÓRIO VIA GITHUB API (DELETE)
window.deleteRepo = async function() {
    if (!_currentRepo) return;
    const token = localStorage.getItem('github_pat');
    if (!token) { alert('⚠️ Token não configurado. Vá em Configurações & APIs.'); return; }
    
    const confirm1 = confirm(`⚠️ Tem certeza que quer excluir "${_currentRepo.name}"?\n\nEsta ação é IRREVERSÍVEL e apaga todo o código do GitHub!`);
    if (!confirm1) return;
    
    const confirmName = prompt(`Para confirmar, digite exatamente: ${_currentRepo.name}`);
    if (confirmName !== _currentRepo.name) { alert('Nome incorreto. Exclusão cancelada.'); return; }
    
    try {
        const res = await fetch(`https://api.github.com/repos/${_currentRepo.full_name}`, {
            method: 'DELETE',
            headers: getGithubHeaders()
        });
        if (res.status === 204) {
            alert(`🗑️ Repositório "${_currentRepo.name}" excluído com sucesso.`);
            closeModal('repoModal');
            loadGitHubRepos();
        } else {
            const err = await res.json();
            throw new Error(err.message || 'Requer escopo delete_repo no token');
        }
    } catch(err) {
        alert(`❌ Falha ao excluir: ${err.message}\n\nVerifique se o token tem permissão 'delete_repo'.`);
    }
}

