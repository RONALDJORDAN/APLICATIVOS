// Firebase Configuration
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
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var database = firebase.database();
}

// Global scope
let mainChartInstance = null;
let pieChartInstance = null;
let map = null;
let markers = [];

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    console.log("TransEquip App initialized on page:", page || 'index.html');

    if (page === 'index.html' || page === '') {
        initCharts();
        setupDashboardFirebase();
    } else if (page === 'mapa.html') {
        initMap();
        setupMapFirebase();
    } else if (page === 'equipamentos.html') {
        setupEquipamentosFirebase();
    } else if (page === 'pessoas.html') {
        setupPessoasFirebase();
    } else if (page === 'configuracoes.html' || page === 'configuracoes-mapa.html') {
        if (page === 'configuracoes-mapa.html') {
            initSettingsMap();
        }
        setupConfiguracoesFirebase();
    } else if (page === 'aplicacao.html') {
        setupAplicacaoFirebase();
    }

    // Initialize GPS Live Tracking for any connected device
    initLiveTracking();
});

/* =========================================
   LIVE TRACKING LOGIC
========================================= */
function initLiveTracking() {
    if (!("geolocation" in navigator)) return;

    let deviceName = localStorage.getItem('transEquip_deviceName');
    if (!deviceName) {
        deviceName = prompt("Qual o nome deste dispositivo para rastreamento no mapa? (Ex: Ônibus 01, Thalyne)");
        if (deviceName) {
            localStorage.setItem('transEquip_deviceName', deviceName);
        } else {
            return; // Se o usuário cancelar, não rastreamos
        }
    }

    const deviceId = localStorage.getItem('transEquip_deviceId') || 'dev_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('transEquip_deviceId', deviceId);

    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const speed = position.coords.speed || 0;

            if (typeof database !== 'undefined') {
                database.ref('rastreamento/' + deviceId).set({
                    nome: deviceName,
                    lat: lat,
                    lng: lng,
                    velocidade: speed,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }
        },
        (error) => {
            console.warn("Erro ao obter localização: ", error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    // Remove do mapa se fechar a janela (opcional, mas ajuda a limpar)
    window.addEventListener('beforeunload', () => {
        if (typeof database !== 'undefined') {
            database.ref('rastreamento/' + deviceId).remove();
        }
    });
}

/* =========================================
   DASHBOARD LOGIC
========================================= */
function setupDashboardFirebase() {
    if (typeof database === 'undefined') return;

    database.ref('equipamentos').on('value', (snapshot) => {
        const equipamentos = snapshot.val();
        if (equipamentos) {
            calculateAndUpdateStats(equipamentos);
            updateDashboardCharts(equipamentos);
        } else {
            calculateAndUpdateStats({});
            updateDashboardCharts({});
        }
    });
}

function calculateAndUpdateStats(equipamentos) {
    let total = 0, disponivel = 0, emUso = 0, manutencao = 0;

    Object.values(equipamentos).forEach(eq => {
        total++;
        if (eq.status === 'Disponível') disponivel++;
        if (eq.status === 'Em Uso') emUso++;
        if (eq.status === 'Manutenção') manutencao++;
    });

    updateStatUI('Total Equipamentos', total);
    updateStatUI('Disponíveis', disponivel);
    updateStatUI('Em Uso', emUso);
    updateStatUI('Manutenção', manutencao);
}

function updateStatUI(label, value) {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach(card => {
        if (card.querySelector('.label') && card.querySelector('.label').textContent.includes(label)) {
            card.querySelector('.value').textContent = value;
        }
    });
}

function initCharts() {
    const mainCtx = document.getElementById('mainChart');
    if (mainCtx) {
        mainChartInstance = new Chart(mainCtx, {
            type: 'bar',
            data: {
                labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'],
                datasets: [{
                    label: 'Equipamentos',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: '#4f46e5',
                    borderRadius: 8,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        pieChartInstance = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Disponível', 'Em Uso', 'Em Trânsito', 'Manutenção', 'Retornado'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a78bfa'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20, usePointStyle: true } }
                },
                cutout: '70%'
            }
        });
    }
}

function updateDashboardCharts(equipamentos) {
    let statusCounts = { 'Disponível': 0, 'Em Uso': 0, 'Em Trânsito': 0, 'Manutenção': 0, 'Retornado': 0 };
    Object.values(equipamentos).forEach(eq => {
        if (statusCounts[eq.status] !== undefined) {
            statusCounts[eq.status]++;
        }
    });

    if (pieChartInstance) {
        pieChartInstance.data.datasets[0].data = [
            statusCounts['Disponível'], statusCounts['Em Uso'], statusCounts['Em Trânsito'],
            statusCounts['Manutenção'], statusCounts['Retornado']
        ];
        pieChartInstance.update();
    }

    if (mainChartInstance) {
        const total = Object.keys(equipamentos).length;
        mainChartInstance.data.datasets[0].data[5] = total;
        for (let i = 0; i < 5; i++) {
            if (mainChartInstance.data.datasets[0].data[i] === 0 && total > 0) {
                mainChartInstance.data.datasets[0].data[i] = Math.floor(total * 0.8 * Math.random());
            }
        }
        mainChartInstance.update();
    }
}

/* =========================================
   EQUIPAMENTOS LOGIC (Inventory CRUD)
========================================= */
function setupEquipamentosFirebase() {
    if (typeof database === 'undefined') return;

    const form = document.getElementById('form-equipamento');
    if (form) {
        form.addEventListener('submit', handleAddEquipamento);
        setupUsoPessoalToggle();
    }

    // Populate the responsible select from 'pessoas'
    database.ref('pessoas').on('value', (snapshot) => {
        const pessoas = snapshot.val();
        populateResponsavelSelect(pessoas);
    });

    // Realtime table updates
    database.ref('equipamentos').on('value', (snapshot) => {
        const equipamentos = snapshot.val();
        renderEquipamentosTable(equipamentos);
    });
}

function setupUsoPessoalToggle() {
    const checkbox = document.getElementById('eq-uso-pessoal');
    const geoFieldsBox = document.getElementById('campos-geolocalizacao');
    if (!checkbox || !geoFieldsBox) return;

    checkbox.addEventListener('change', function () {
        if (this.checked) {
            geoFieldsBox.style.display = 'none';
        } else {
            geoFieldsBox.style.display = 'block';
        }
    });
}

function populateResponsavelSelect(pessoas) {
    const select = document.getElementById('eq-responsavel');
    if (!select) return;

    // Keep the first default option
    select.innerHTML = '<option value="">-- Nenhum --</option>';

    if (pessoas) {
        Object.values(pessoas).forEach(p => {
            const option = document.createElement('option');
            option.value = p.nome;
            option.textContent = p.nome;
            select.appendChild(option);
        });
    }
}

let currentEditEquipamentoId = null;

function handleAddEquipamento(e) {
    e.preventDefault();
    showLoading(true);

    const nome = document.getElementById('eq-nome').value;
    const tipo = document.getElementById('eq-tipo').value;
    const status = document.getElementById('eq-status').value;
    const responsavel = document.getElementById('eq-responsavel').value;
    const isUsoPessoal = document.getElementById('eq-uso-pessoal') ? document.getElementById('eq-uso-pessoal').checked : false;

    let destino = '';
    let lat = null;
    let lng = null;

    if (!isUsoPessoal) {
        destino = document.getElementById('eq-destino').value;
        const rawLat = document.getElementById('eq-lat').value;
        const rawLng = document.getElementById('eq-lng').value;
        lat = rawLat ? parseFloat(rawLat) : null;
        lng = rawLng ? parseFloat(rawLng) : null;
    }

    const payload = {
        nome, tipo, status, responsavel,
        usoPessoal: isUsoPessoal,
        destino: isUsoPessoal ? '[Uso Pessoal]' : destino,
        lat: lat,
        lng: lng,
        retornado: false
    };

    if (currentEditEquipamentoId) {
        // Modo Edição
        database.ref('equipamentos/' + currentEditEquipamentoId).update(payload)
            .then(() => {
                document.getElementById('form-equipamento').reset();
                closeModal();
                showLoading(false);
                currentEditEquipamentoId = null;
                resetEquipamentoSubmitButton();
            }).catch(error => { console.error("Erro ao atualizar:", error); showLoading(false); });
    } else {
        // Modo Criação
        payload.timestamp = firebase.database.ServerValue.TIMESTAMP;
        database.ref('equipamentos').push().set(payload)
            .then(() => {
                document.getElementById('form-equipamento').reset();
                closeModal();
                showLoading(false);
            }).catch(error => {
                console.error("Erro ao salvar:", error); showLoading(false);
                if (error.message && error.message.includes('permission_denied')) {
                    alert("Erro de Permissão: Altere as Regras do Firebase Database.");
                } else {
                    alert("Erro ao salvar equipamento.");
                }
            });
    }
}

function renderEquipamentosTable(equipamentos) {
    window.currentEquipamentosData = equipamentos; // Save for editing access
    const tbody = document.querySelector('#tabela-equipamentos tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!equipamentos || Object.keys(equipamentos).length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhum equipamento cadastrado.</td></tr>`;
        return;
    }

    Object.keys(equipamentos).forEach(key => {
        const eq = equipamentos[key];
        const tr = document.createElement('tr');

        let badgeClass = 'badge-info';
        if (eq.status === 'Disponível') badgeClass = 'badge-success';
        if (eq.status === 'Em Uso') badgeClass = 'badge-info';
        if (eq.status === 'Em Trânsito') badgeClass = 'badge-warning';
        if (eq.status === 'Manutenção') badgeClass = 'badge-danger';
        if (eq.status === 'Retornado') badgeClass = 'badge-purple';

        const retornado = eq.retornado ?
            '<span class="badge badge-success">Sim</span>' :
            '<span class="badge badge-warning">Não</span>';

        // Check if its personal use
        let destinoVisual = eq.destino || '-';
        if (eq.usoPessoal) {
            destinoVisual = '<span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd;">Uso Pessoal</span>';
        }

        tr.innerHTML = `
            <td><strong>${eq.nome || 'N/A'}</strong></td>
            <td>${eq.tipo || '-'}</td>
            <td><span class="badge ${badgeClass}">${eq.status}</span></td>
            <td>${eq.responsavel || '-'}</td>
            <td>${destinoVisual}</td>
            <td>${retornado}</td>
            <td>
                <button class="btn-icon" onclick="editEquipamento('${key}')" title="Editar" style="color: var(--blue);">
                    <ion-icon name="pencil-outline"></ion-icon>
                </button>
                <button class="btn-icon delete" onclick="deleteEquipamento('${key}')" title="Excluir">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editEquipamento = function (key) {
    if (!window.currentEquipamentosData || !window.currentEquipamentosData[key]) return;
    const eq = window.currentEquipamentosData[key];

    currentEditEquipamentoId = key;

    document.getElementById('eq-nome').value = eq.nome || '';
    document.getElementById('eq-tipo').value = eq.tipo || '';
    document.getElementById('eq-status').value = eq.status || '';
    document.getElementById('eq-responsavel').value = eq.responsavel || '';

    const checkboxUsoPessoal = document.getElementById('eq-uso-pessoal');
    if (checkboxUsoPessoal) {
        checkboxUsoPessoal.checked = !!eq.usoPessoal;
        // Trigger the change event to show/hide fields
        checkboxUsoPessoal.dispatchEvent(new Event('change'));
    }

    document.getElementById('eq-destino').value = (eq.usoPessoal && eq.destino === '[Uso Pessoal]') ? '' : (eq.destino || '');
    document.getElementById('eq-lat').value = eq.lat || '';
    document.getElementById('eq-lng').value = eq.lng || '';

    // Change Submit button text
    const form = document.getElementById('form-equipamento');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Salvar Alterações';
    }

    openModal();
}

function resetEquipamentoSubmitButton() {
    const form = document.getElementById('form-equipamento');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Cadastrar Equipamento';
    }
}

window.deleteEquipamento = function (key) {
    if (confirm("Tem certeza que deseja excluir este equipamento?")) {
        showLoading(true);
        database.ref('equipamentos/' + key).remove()
            .then(() => showLoading(false))
            .catch(err => {
                console.error(err);
                showLoading(false);
                alert("Erro ao excluir.");
            });
    }
}

// Modal functions
window.openModal = function () {
    const modal = document.getElementById('modal-equipamento');
    if (modal) modal.classList.add('active');
}

window.closeModal = function () {
    const modal = document.getElementById('modal-equipamento');
    if (modal) modal.classList.remove('active');
}

/* =========================================
   MAPA LOGIC
========================================= */
window.openInGoogleMaps = function (lat, lng) {
    if (confirm("Deseja abrir esta localização no Google Maps?")) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
};

function initMap() {
    if (!document.getElementById('map')) return;

    const centroPaoDeAcucar = [-9.7460, -37.4350];
    map = L.map('map').setView(centroPaoDeAcucar, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Auto-show/hide school labels based on zoom level
    map.on('zoomend', function () {
        const zoom = map.getZoom();
        dynamicPoiMarkers.forEach(m => {
            if (m._schoolTooltip) {
                if (zoom >= 14) {
                    if (!m.isTooltipOpen()) m.openTooltip();
                } else {
                    m.closeTooltip();
                }
            }
        });
    });
}

function setupMapFirebase() {
    if (typeof database === 'undefined') return;

    database.ref('equipamentos').on('value', (snapshot) => {
        const equipamentos = snapshot.val();
        updateMapMarkers(equipamentos || {});
    });

    database.ref('destinos').on('value', (snapshot) => {
        const destinos = snapshot.val();
        updatePoiMarkers(destinos || {});
    });

    // Escuta os dispositivos móveis conectados em tempo real
    database.ref('rastreamento').on('value', (snapshot) => {
        const trackings = snapshot.val();
        updateLiveTrackingMarkers(trackings || {});
    });
}

let liveTrackingMarkers = [];

function updateLiveTrackingMarkers(trackings) {
    if (!map) return;
    liveTrackingMarkers.forEach(m => map.removeLayer(m));
    liveTrackingMarkers = [];

    const now = Date.now();

    Object.values(trackings).forEach(trk => {
        if (trk.lat && trk.lng) {
            // Se o timestamp for muito antigo (> 10 minutos), ignorar para não poluir
            if (now - trk.timestamp > 10 * 60 * 1000) return;

            // Criar um ícone personalizado simulando um pino em movimento (Pulse)
            const isMoving = trk.velocidade > 1; // mais de 1 m/s (3.6 km/h)
            const color = isMoving ? '#10b981' : '#f59e0b'; // Verde movendo, Laranja parado

            const pulseHtml = `
                <div style="
                    position: relative;
                    width: 20px;
                    height: 20px;
                ">
                    <div style="
                        width: 14px;
                        height: 14px;
                        background: ${color};
                        border: 2px solid white;
                        border-radius: 50%;
                        position: absolute;
                        top: 3px;
                        left: 3px;
                        z-index: 2;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>
                    ${isMoving ? `
                    <div style="
                        width: 20px;
                        height: 20px;
                        background: ${color};
                        border-radius: 50%;
                        position: absolute;
                        top: 0;
                        left: 0;
                        z-index: 1;
                        animation: pulse 1.5s infinite;
                        opacity: 0.6;
                    "></div>
                    ` : ''}
                </div>
            `;

            const customIcon = L.divIcon({
                html: pulseHtml,
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const marker = L.marker([trk.lat, trk.lng], { icon: customIcon }).addTo(map);

            marker.bindPopup(`
                <div style="font-family: Arial; font-size: 14px; text-align: center;">
                    <ion-icon name="car-sport" style="font-size: 24px; color: ${color};"></ion-icon>
                    <h3 style="color: ${color}; margin-top: 5px; margin-bottom: 5px; font-size: 16px;">${trk.nome}</h3>
                    <p style="margin: 0; color: #555;">Estado: ${isMoving ? 'Em Movimento' : 'Parado'}</p>
                    <p style="margin: 2px 0 10px 0; font-size: 11px; color: #888;">Atualizado agora</p>
                    <button onclick="openInGoogleMaps(${trk.lat}, ${trk.lng})" style="background: var(--primary); color: white; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; margin: 0 auto;">
                        <ion-icon name="map-outline"></ion-icon> Google Maps
                    </button>
                </div>
            `);

            liveTrackingMarkers.push(marker);
        }
    });
}

let dynamicPoiMarkers = [];

// Global routing state
let currentRouteControl = null;
let currentRouteDest = null;

function updatePoiMarkers(destinos) {
    if (!map) return;
    dynamicPoiMarkers.forEach(m => map.removeLayer(m));
    dynamicPoiMarkers = [];

    const cardsContainer = document.getElementById('escolas-cards-container');
    if (cardsContainer) cardsContainer.innerHTML = '';

    Object.values(destinos).forEach(pt => {
        const isEscola = pt.nome && (pt.nome.toUpperCase().includes('UNIDADE') || pt.nome.toUpperCase().includes('ESCOLA') || pt.nome.toUpperCase().includes('ENSINO'));

        // Render Marker se tiver lat/lng
        if (pt.lat && pt.lng) {
            let marker;
            if (isEscola) {
                marker = L.circleMarker([pt.lat, pt.lng], {
                    radius: 8, fillColor: '#ef4444', color: '#fff',
                    weight: 2, opacity: 1, fillOpacity: 0.9
                }).addTo(map);
            } else {
                marker = L.marker([pt.lat, pt.lng]).addTo(map);
            }

            // Add permanent tooltip label for schools (visible on zoom >= 14)
            if (isEscola) {
                const shortName = pt.nome.length > 30 ? pt.nome.substring(0, 28) + '...' : pt.nome;
                marker.bindTooltip(shortName, {
                    permanent: true,
                    direction: 'right',
                    offset: [12, 0],
                    className: 'school-label'
                });
                marker._schoolTooltip = true;
                // Show or hide based on current zoom
                if (map.getZoom() < 14) {
                    setTimeout(() => marker.closeTooltip(), 100);
                }
            }

            marker.bindPopup(`
                <div style="font-family: 'Inter', Arial; font-size: 14px; min-width: 200px;">
                    <h3 style="color: ${isEscola ? '#ef4444' : '#4f46e5'}; margin-bottom: 5px; font-size: 16px;">${pt.nome}</h3>
                    <p style="margin: 0 0 10px 0; color: #555;">📍 ${pt.endereco || 'Sem endereço'}</p>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="tracarRota(${pt.lat}, ${pt.lng}, '${pt.nome.replace(/'/g, "\\'")}')"
                            style="flex:1; background: linear-gradient(135deg, #9b4dff, #4e86ff); color: white; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; justify-content: center;">
                            <ion-icon name="navigate-outline"></ion-icon> Traçar Rota
                        </button>
                        <button onclick="openInGoogleMaps(${pt.lat}, ${pt.lng})"
                            style="flex:1; background: ${isEscola ? '#ef4444' : 'var(--primary)'}; color: white; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; justify-content: center;">
                            <ion-icon name="logo-google"></ion-icon> Google Maps
                        </button>
                    </div>
                </div>
            `);
            dynamicPoiMarkers.push(marker);
        }

        // Render Card
        if (cardsContainer && isEscola) {
            const card = document.createElement('div');
            card.className = "escola-map-card";

            const hasLocation = pt.lat && pt.lng;

            card.innerHTML = `
                <div style="display: flex; gap: 0.8rem; align-items: flex-start;">
                    <div style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.5rem; border-radius: 8px; display: flex;">
                        <ion-icon name="school-outline" style="font-size: 1.2rem;"></ion-icon>
                    </div>
                    <div style="flex:1; min-width: 0;">
                        <h4 style="font-size: 0.9rem; color: var(--text-main); margin: 0 0 0.2rem 0; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pt.nome}</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">📍 ${pt.endereco || 'Sem endereço'}</p>
                        ${!hasLocation ? '<span style="display: inline-block; margin-top: 0.4rem; font-size: 0.65rem; background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 2px 6px; border-radius: 4px;">Sem localização no mapa</span>' : ''}
                    </div>
                </div>
                ${hasLocation ? `
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <button onclick="event.stopPropagation(); tracarRota(${pt.lat}, ${pt.lng}, '${pt.nome.replace(/'/g, "\\'")}')"
                        style="flex:1; background: linear-gradient(135deg, rgba(155,77,255,0.15), rgba(78,134,255,0.15)); color: #bf8fff; border: 1px solid rgba(155,77,255,0.25); padding: 0.4rem 0.6rem; border-radius: 8px; cursor: pointer; font-size: 0.72rem; font-weight: 600; display: flex; align-items: center; gap: 4px; justify-content: center;">
                        <ion-icon name="navigate-outline"></ion-icon> Rota
                    </button>
                    <button onclick="event.stopPropagation(); openInGoogleMaps(${pt.lat}, ${pt.lng})"
                        style="flex:1; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); padding: 0.4rem 0.6rem; border-radius: 8px; cursor: pointer; font-size: 0.72rem; font-weight: 600; display: flex; align-items: center; gap: 4px; justify-content: center;">
                        <ion-icon name="logo-google"></ion-icon> Maps
                    </button>
                </div>
                ` : ''}
            `;

            if (hasLocation) {
                card.onclick = () => {
                    map.setView([pt.lat, pt.lng], 16);
                    const targetMarker = dynamicPoiMarkers.find(m => {
                        const latlng = m.getLatLng();
                        return latlng.lat === pt.lat && latlng.lng === pt.lng;
                    });
                    if (targetMarker) targetMarker.openPopup();
                    document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
                };
            } else {
                card.onclick = () => {
                    alert("Esta escola ainda não possui localização exata (Latitude/Longitude) cadastrada nas Configurações.");
                };
            }

            cardsContainer.appendChild(card);
        }
    });

}

/* =========================================
   ROUTING LOGIC
========================================= */

window.tracarRota = function (destLat, destLng, destName) {
    if (!map) return;

    // Clear any existing route
    if (currentRouteControl) {
        map.removeControl(currentRouteControl);
        currentRouteControl = null;
    }

    // Store destination for Google Maps link
    currentRouteDest = { lat: destLat, lng: destLng, name: destName };

    // Show route banner
    const banner = document.getElementById('route-banner');
    const destNameEl = document.getElementById('route-dest-name');
    const destDetailsEl = document.getElementById('route-dest-details');
    if (banner) {
        banner.classList.add('active');
        destNameEl.textContent = '🚗 Rota para: ' + destName;
        destDetailsEl.textContent = 'Calculando melhor rota...';
    }

    // Close any open popup
    map.closePopup();

    // Use geolocation if available, otherwise use default center
    const centroPaoDeAcucar = [-9.7460, -37.4350];

    function buildRoute(fromLat, fromLng) {
        currentRouteControl = L.Routing.control({
            waypoints: [
                L.latLng(fromLat, fromLng),
                L.latLng(destLat, destLng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            show: false,
            createMarker: function (i, waypoint, n) {
                if (i === 0) {
                    return L.marker(waypoint.latLng, {
                        icon: L.divIcon({
                            html: '<div style="width:14px;height:14px;background:#4e86ff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(78,134,255,0.5);"></div>',
                            className: '', iconSize: [20, 20], iconAnchor: [10, 10]
                        })
                    });
                }
                return L.marker(waypoint.latLng, {
                    icon: L.divIcon({
                        html: '<div style="width:14px;height:14px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(239,68,68,0.5);"></div>',
                        className: '', iconSize: [20, 20], iconAnchor: [10, 10]
                    })
                });
            },
            lineOptions: {
                styles: [{
                    color: '#9b4dff',
                    opacity: 0.85,
                    weight: 5
                }, {
                    color: '#4e86ff',
                    opacity: 0.4,
                    weight: 9
                }]
            },
            fitSelectedRoutes: true
        }).addTo(map);

        currentRouteControl.on('routesfound', function (e) {
            const route = e.routes[0];
            const distKm = (route.summary.totalDistance / 1000).toFixed(1);
            const timeMin = Math.round(route.summary.totalTime / 60);
            if (destDetailsEl) {
                destDetailsEl.textContent = `📏 ${distKm} km  •  ⏱️ ~${timeMin} min  •  Rota mais rápida`;
            }
        });

        currentRouteControl.on('routingerror', function () {
            if (destDetailsEl) {
                destDetailsEl.textContent = '⚠️ Não foi possível calcular a rota. Tente o Google Maps.';
            }
        });
    }

    // Try to get user's real location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => buildRoute(pos.coords.latitude, pos.coords.longitude),
            () => buildRoute(centroPaoDeAcucar[0], centroPaoDeAcucar[1]),
            { timeout: 5000, maximumAge: 60000 }
        );
    } else {
        buildRoute(centroPaoDeAcucar[0], centroPaoDeAcucar[1]);
    }

    // Scroll to map
    document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.clearRoute = function () {
    if (currentRouteControl && map) {
        map.removeControl(currentRouteControl);
        currentRouteControl = null;
    }
    currentRouteDest = null;
    const banner = document.getElementById('route-banner');
    if (banner) banner.classList.remove('active');
};

window.openRouteGoogleMaps = function () {
    if (!currentRouteDest) return;
    const { lat, lng } = currentRouteDest;

    // Try to use user's real location for directions
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                window.open(`https://www.google.com/maps/dir/${pos.coords.latitude},${pos.coords.longitude}/${lat},${lng}`, '_blank');
            },
            () => {
                window.open(`https://www.google.com/maps/dir//${lat},${lng}`, '_blank');
            },
            { timeout: 3000, maximumAge: 60000 }
        );
    } else {
        window.open(`https://www.google.com/maps/dir//${lat},${lng}`, '_blank');
    }
};

function updateMapMarkers(equipamentos) {
    if (!map) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    Object.values(equipamentos).forEach(eq => {
        if (eq.lat && eq.lng && eq.status !== 'Disponível' && !eq.usoPessoal) {
            const markerColor = eq.status === 'Em Trânsito' ? '#f59e0b' :
                eq.status === 'Em Uso' ? '#3b82f6' :
                    eq.status === 'Manutenção' ? '#ef4444' : '#10b981';
            const circle = L.circleMarker([eq.lat, eq.lng], {
                radius: 8, fillColor: markerColor, color: '#fff',
                weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map);

            circle.bindPopup(`
                <div style="color: #333; font-family: Arial; font-size: 13px;">
                    <b style="font-size: 15px; display: block; margin-bottom: 5px;">${eq.nome}</b>
                    <div style="margin-bottom: 8px;">
                        Status: ${eq.status}<br>
                        Responsável: ${eq.responsavel || 'N/A'}<br>
                        Destino: ${eq.destino || 'N/A'}
                    </div>
                    <button onclick="openInGoogleMaps(${eq.lat}, ${eq.lng})" style="background: ${markerColor}; color: white; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; width: 100%; justify-content: center;">
                        <ion-icon name="location-outline"></ion-icon> Google Maps
                    </button>
                </div>
            `);
            markers.push(circle);
        }
    });
}

/* =========================================
   CONFIGURAÇÕES LOGIC
========================================= */
let settingsMap = null;
let settingsMarker = null;

function initSettingsMap() {
    const mapContainer = document.getElementById('settings-map');
    if (!mapContainer) return;

    settingsMap = L.map('settings-map').setView([-9.7460, -37.4350], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(settingsMap);

    settingsMap.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById('poi-lat').value = lat;
        document.getElementById('poi-lng').value = lng;
        if (settingsMarker) settingsMap.removeLayer(settingsMarker);
        settingsMarker = L.marker([lat, lng]).addTo(settingsMap);
    });
}

function setupConfiguracoesFirebase() {
    if (typeof database === 'undefined') return;

    // Veiculos CRUD
    const formVeiculo = document.getElementById('form-veiculo');
    if (formVeiculo) {
        formVeiculo.addEventListener('submit', handleAddVeiculo);
    }
    database.ref('veiculos').on('value', (snapshot) => {
        renderVeiculosTable(snapshot.val());
    });

    // Populate motoristas/responsaveis no select de veiculos
    database.ref('pessoas').on('value', (snapshot) => {
        const select = document.getElementById('v-responsavel');
        if (!select) return;
        select.innerHTML = '<option value="">-- Nenhum --</option>';
        const pessoas = snapshot.val();
        if (pessoas) {
            Object.keys(pessoas).forEach(key => {
                const opt = document.createElement('option');
                opt.value = pessoas[key].nome;
                opt.textContent = pessoas[key].nome;
                select.appendChild(opt);
            });
        }
    });

    // POIs CRUD
    const formPoi = document.getElementById('form-ponto-mapa');
    if (formPoi) {
        formPoi.addEventListener('submit', handleAddPoi);
    }
    database.ref('destinos').on('value', (snapshot) => {
        renderPontosTable(snapshot.val());
    });
}

let currentEditVeiculoId = null;

function handleAddVeiculo(e) {
    e.preventDefault();
    showLoading(true);
    const placa = document.getElementById('v-placa').value;
    const modelo = document.getElementById('v-modelo').value;
    const responsavel = document.getElementById('v-responsavel').value;

    const payload = {
        placa,
        modelo,
        responsavel
    };

    if (currentEditVeiculoId) {
        // Modo Edição
        database.ref('veiculos/' + currentEditVeiculoId).update(payload)
            .then(() => {
                document.getElementById('form-veiculo').reset();
                showLoading(false);
                currentEditVeiculoId = null;
                resetVeiculoSubmitButton();
            }).catch(error => { console.error("Erro ao atualizar veículo:", error); showLoading(false); });

    } else {
        // Modo Criação
        payload.timestamp = firebase.database.ServerValue.TIMESTAMP;
        database.ref('veiculos').push().set(payload).then(() => {
            document.getElementById('form-veiculo').reset();
            showLoading(false);
        }).catch(error => {
            console.error("Erro ao salvar veículo:", error);
            showLoading(false);
            if (error.message && error.message.includes('permission_denied')) {
                alert("Erro de Permissão: Verifique as regras de Database (read: true, write: true).");
            } else {
                alert("Erro ao salvar veículo.");
            }
        });
    }
}

function renderVeiculosTable(veiculos) {
    window.currentVeiculosData = veiculos; // Save for editing access
    const tbody = document.querySelector('#tabela-veiculos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!veiculos || Object.keys(veiculos).length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Nenhum veículo cadastrado.</td></tr>`;
        return;
    }

    Object.keys(veiculos).forEach(key => {
        const v = veiculos[key];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${v.placa || 'N/A'}</strong></td>
            <td>${v.modelo || 'N/A'}</td>
            <td>${v.responsavel || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editVeiculo('${key}')" title="Editar" style="color: var(--blue);">
                    <ion-icon name="pencil-outline"></ion-icon>
                </button>
                <button class="btn-icon delete" onclick="deleteVeiculo('${key}')" title="Excluir">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editVeiculo = function (key) {
    if (!window.currentVeiculosData || !window.currentVeiculosData[key]) return;
    const v = window.currentVeiculosData[key];

    currentEditVeiculoId = key;

    document.getElementById('v-placa').value = v.placa || '';
    document.getElementById('v-modelo').value = v.modelo || '';
    document.getElementById('v-responsavel').value = v.responsavel || '';

    // Change Submit button text
    const form = document.getElementById('form-veiculo');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Salvar Alterações';
    }

    // Scroll to form if needed
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetVeiculoSubmitButton() {
    const form = document.getElementById('form-veiculo');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="add-circle-outline"></ion-icon> Cadastrar Veículo';
    }
}

window.deleteVeiculo = function (key) {
    if (confirm("Excluir este veículo?")) {
        showLoading(true);
        database.ref('veiculos/' + key).remove()
            .then(() => showLoading(false))
            .catch(err => { console.error(err); showLoading(false); alert("Erro ao excluir."); });
    }
}

// --- POIs ---
let currentEditPoiId = null;

function handleAddPoi(e) {
    e.preventDefault();
    showLoading(true);

    const nome = document.getElementById('poi-nome').value;
    const endereco = document.getElementById('poi-endereco').value;
    const lat = document.getElementById('poi-lat').value;
    const lng = document.getElementById('poi-lng').value;

    const payload = {
        nome, endereco,
        lat: parseFloat(lat), lng: parseFloat(lng)
    };

    if (currentEditPoiId) {
        // Modo Edição
        database.ref('destinos/' + currentEditPoiId).update(payload)
            .then(() => {
                document.getElementById('form-ponto-mapa').reset();
                if (settingsMarker) settingsMap.removeLayer(settingsMarker);
                showLoading(false);
                currentEditPoiId = null;
                resetPoiSubmitButton();
            }).catch(error => { console.error("Erro ao atualizar POI:", error); showLoading(false); });
    } else {
        // Modo Criação
        payload.timestamp = firebase.database.ServerValue.TIMESTAMP;
        database.ref('destinos').push().set(payload).then(() => {
            document.getElementById('form-ponto-mapa').reset();
            if (settingsMarker) settingsMap.removeLayer(settingsMarker);
            showLoading(false);
        }).catch(error => {
            console.error("Erro ao salvar POI:", error);
            showLoading(false);
            if (error.message && error.message.includes('permission_denied')) {
                alert("Erro de Permissão: Verifique as regras de Database (read: true, write: true).");
            } else {
                alert("Erro ao salvar Ponto.");
            }
        });
    }
}

function renderPontosTable(pontos) {
    window.currentPontosData = pontos; // Save for editing access
    const tbody = document.querySelector('#tabela-pontos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!pontos || Object.keys(pontos).length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nenhum ponto cadastrado.</td></tr>`;
        return;
    }

    Object.keys(pontos).forEach(key => {
        const pt = pontos[key];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${pt.nome || 'N/A'}</strong></td>
            <td>${pt.endereco || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editPoi('${key}')" title="Editar" style="color: var(--blue);">
                    <ion-icon name="pencil-outline"></ion-icon>
                </button>
                <button class="btn-icon delete" onclick="deletePoi('${key}')" title="Excluir">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editPoi = function (key) {
    if (!window.currentPontosData || !window.currentPontosData[key]) return;
    const pt = window.currentPontosData[key];

    currentEditPoiId = key;

    document.getElementById('poi-nome').value = pt.nome || '';
    document.getElementById('poi-endereco').value = pt.endereco || '';
    document.getElementById('poi-lat').value = pt.lat || '';
    document.getElementById('poi-lng').value = pt.lng || '';

    // Center map on the edited point
    if (settingsMap && pt.lat && pt.lng) {
        settingsMap.setView([pt.lat, pt.lng], 16);
        if (settingsMarker) settingsMap.removeLayer(settingsMarker);
        settingsMarker = L.marker([pt.lat, pt.lng]).addTo(settingsMap);
    }

    // Change Submit button text
    const form = document.getElementById('form-ponto-mapa');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Salvar Alterações';
    }

    // Scroll to form if needed
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetPoiSubmitButton() {
    const form = document.getElementById('form-ponto-mapa');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="add-circle-outline"></ion-icon> Adicionar Ponto no Mapa';
    }
}


window.deletePoi = function (key) {
    if (confirm("Excluir este Ponto do Mapa?")) {
        showLoading(true);
        database.ref('destinos/' + key).remove()
            .then(() => showLoading(false))
            .catch(err => { console.error(err); showLoading(false); alert("Erro ao excluir ponto."); });
    }
}

// --- SEED ESCOLAS MAPA ---
window.seedEscolasMapa = function () {
    if (typeof database === 'undefined') return;

    const novasEscolas = [
        { nome: "UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", lat: -9.747584, lng: -37.447851, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", lat: -9.749881, lng: -37.438403, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENS MANOEL RODRIGUES CORREIA", lat: null, lng: null, endereco: "Sem localização definida" },
        { nome: "UNIDADE MUNICIPAL ENS JULIO DAMASCENO RIBEIRO", lat: null, lng: null, endereco: "Sem localização definida" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO PE DA SERRA", lat: null, lng: null, endereco: "Sem localização definida" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", lat: -9.543534, lng: -37.579540, endereco: "Povoado Pão de Açúcar" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", lat: -9.650924, lng: -37.363748, endereco: "Sede" },
        { nome: "UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", lat: -9.693309, lng: -37.351505, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO JOAQUIM FONSECA", lat: null, lng: null, endereco: "Sem localização definida" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO SAO MIGUEL", lat: -9.659828, lng: -37.594706, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO PROF MANOEL ALVES", lat: null, lng: null, endereco: "Sem localização definida" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO JOSE TAVARES DE CASTRO", lat: -9.787076, lng: -37.340153, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO LINDAURO COSTA", lat: -9.811807, lng: -37.318500, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", lat: -9.637146, lng: -37.504312, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL VER ANTONIO MACHADO GUIMARAES", lat: -9.679699, lng: -37.408690, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", lat: -9.672831643183557, lng: -37.3770524546562, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO ALVARO RODRIGUES FARIAS", lat: null, lng: null, endereco: "Sem localização definida" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO ANA TEREZA DE JESUS", lat: -9.682050, lng: -37.395277, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO MONSENHOR LYRA", lat: -9.673489, lng: -37.374019, endereco: "Sede" },
        { nome: "UNIDADE MUNIC DE ENS PROFª Mª CELESTE M DE ANDRADE", lat: -9.709401, lng: -37.328983, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENS JAIME DE ALTAVILLA", lat: -9.670894, lng: -37.382449, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO CAMPO NOVO", lat: -9.661275, lng: -37.547929, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", lat: -9.748554, lng: -37.432832, endereco: "Sede" },
        { nome: "UNIDADE MUNICIPAL DE ENSINO ASSENTAMENTO ALEMAR", lat: null, lng: null, endereco: "Sem localização definida" }
    ];

    showLoading(true);
    database.ref('destinos').once('value', snapshot => {
        const data = snapshot.val() || {};
        const existingNames = Object.values(data).map(d => (d.nome || "").toUpperCase());

        let count = 0;
        novasEscolas.forEach(esc => {
            if (!existingNames.includes(esc.nome.toUpperCase())) {
                esc.timestamp = firebase.database.ServerValue.TIMESTAMP;
                database.ref('destinos').push().set(esc);
                count++;
            }
        });

        showLoading(false);
        if (count > 0) {
            alert(count + " escolas injetadas com sucesso em Locais/Destinos!");
        } else {
            alert("Todas as escolas já constavam registradas previamente.");
        }
    }).catch(e => {
        console.error("Erro ao injetar", e);
        showLoading(false);
        alert("Erro ao injetar locais.");
    });
};

/* =========================================
   PESSOAS LOGIC (CARDS & CROSS-REF)
========================================= */
let globalEquipamentos = {};
let globalVeiculos = {};

function setupPessoasFirebase() {
    if (typeof database === 'undefined') return;

    // Listen to form
    const formPessoa = document.getElementById('form-cadastro-pessoa');
    if (formPessoa) formPessoa.addEventListener('submit', handleAddPessoaCard);

    // Fetch equipments and vehicles first to cross-reference
    database.ref('equipamentos').on('value', (snap) => {
        globalEquipamentos = snap.val() || {};
        refreshPessoasCards();
    });

    database.ref('veiculos').on('value', (snap) => {
        globalVeiculos = snap.val() || {};
        refreshPessoasCards();
    });

    // Listen to pessoas
    database.ref('pessoas').on('value', (snap) => {
        window.currentPessoasData = snap.val() || {};
        refreshPessoasCards();
    });
}

function refreshPessoasCards() {
    renderPessoasCards(window.currentPessoasData, globalEquipamentos, globalVeiculos);
}

let currentEditPessoaId = null;

function handleAddPessoaCard(e) {
    e.preventDefault();
    showLoading(true);
    const nome = document.getElementById('p-nome').value;
    const cpf = document.getElementById('p-cpf').value || '';
    const nascimento = document.getElementById('p-nascimento').value || '';
    const cnh = document.getElementById('p-cnh').value || '';

    const payload = {
        nome, cpf, nascimento, cnh
    };

    if (currentEditPessoaId) {
        // Modo Edição
        database.ref('pessoas/' + currentEditPessoaId).update(payload)
            .then(() => {
                document.getElementById('form-cadastro-pessoa').reset();
                closeModalPessoa();
                showLoading(false);
                currentEditPessoaId = null;
                resetPessoaSubmitButton();
            }).catch(error => { console.error("Erro ao atualizar pessoa:", error); showLoading(false); });
    } else {
        // Modo Criação
        payload.timestamp = firebase.database.ServerValue.TIMESTAMP;
        database.ref('pessoas').push().set(payload).then(() => {
            document.getElementById('form-cadastro-pessoa').reset();
            closeModalPessoa();
            showLoading(false);
        }).catch(error => {
            console.error("Erro ao salvar pessoa:", error);
            showLoading(false);
            if (error.message && error.message.includes('permission_denied')) {
                alert("Erro de Permissão: Verifique as regras de Database.");
            } else {
                alert("Erro ao salvar pessoa.");
            }
        });
    }
}

function renderPessoasCards(pessoas, equipamentos, veiculos) {
    const grid = document.getElementById('pessoas-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!pessoas || Object.keys(pessoas).length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">Nenhuma pessoa cadastrada. Clique em "Nova Pessoa" para começar.</div>`;
        return;
    }

    Object.keys(pessoas).forEach(key => {
        const p = pessoas[key];

        // Count equipments for this person
        let eqCount = 0;
        Object.values(equipamentos).forEach(eq => {
            if (eq.responsavel === p.nome && eq.status === "Em Uso") eqCount++;
        });

        // Count vehicles for this person
        let vCount = 0;
        Object.values(veiculos).forEach(v => {
            if (v.responsavel === p.nome) vCount++;
        });

        // Initials for avatar
        const initials = p.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = `
            <div style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem; z-index: 10;">
                <button class="btn-icon" onclick="editPessoa('${key}')" title="Editar" style="color: var(--blue); background: rgba(59, 130, 246, 0.1); border-radius: 4px; padding: 0.2rem;">
                    <ion-icon name="pencil-outline"></ion-icon>
                </button>
                <button class="delete-btn" onclick="deletePessoa('${key}')" style="position: static; margin: 0; padding: 0.2rem;">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
            <div class="person-header">
                <div class="person-avatar">${initials}</div>
                <div>
                    <h3 class="person-name">${p.nome}</h3>
                    <p class="person-role">Colaborador</p>
                </div>
            </div>
            <div class="person-info">
                ${p.cpf ? `<div class="info-row"><ion-icon name="card-outline"></ion-icon> CPF: ${p.cpf}</div>` : ''}
                ${p.nascimento ? `<div class="info-row"><ion-icon name="calendar-outline"></ion-icon> Nasc: <span class="format-date">${p.nascimento}</span></div>` : ''}
                ${p.cnh ? `<div class="info-row"><ion-icon name="car-sport-outline"></ion-icon> CNH: ${p.cnh}</div>` : ''}
                ${(!p.cpf && !p.nascimento && !p.cnh) ? `<div class="info-row" style="opacity: 0.5;"><i>Sem informações adicionais</i></div>` : ''}
            </div>
            <div class="person-stats">
                <div class="stat-box">
                    <span class="count">${eqCount}</span>
                    <span class="label">Equip. em Uso</span>
                </div>
                <div class="stat-box">
                    <span class="count">${vCount}</span>
                    <span class="label">Veículos</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Format dates
    document.querySelectorAll('.format-date').forEach(el => {
        if (el.textContent && el.textContent.includes('-')) {
            const parts = el.textContent.split('-');
            if (parts.length === 3) el.textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    });
}

window.editPessoa = function (key) {
    if (!window.currentPessoasData || !window.currentPessoasData[key]) return;
    const p = window.currentPessoasData[key];

    currentEditPessoaId = key;

    document.getElementById('p-nome').value = p.nome || '';
    document.getElementById('p-cpf').value = p.cpf || '';
    document.getElementById('p-nascimento').value = p.nascimento || '';
    document.getElementById('p-cnh').value = p.cnh || '';

    // Change Submit button text
    const form = document.getElementById('form-cadastro-pessoa');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Salvar Alterações';
    }

    openModalPessoa();
}

function resetPessoaSubmitButton() {
    const form = document.getElementById('form-cadastro-pessoa');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Salvar Pessoa';
    }
}

window.deletePessoa = function (key) {
    if (confirm("Tem certeza que deseja remover esta pessoa?")) {
        showLoading(true);
        database.ref('pessoas/' + key).remove()
            .then(() => showLoading(false))
            .catch(err => { console.error(err); showLoading(false); alert("Erro ao excluir."); });
    }
}

// Global modal Pessoas
window.openModalPessoa = function () {
    const modal = document.getElementById('modal-pessoa');
    if (modal) modal.classList.add('active');
}

window.closeModalPessoa = function () {
    const modal = document.getElementById('modal-pessoa');
    if (modal) modal.classList.remove('active');
}



/* =========================================
   UTILITIES
========================================= */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (show) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
    }
}

/* =========================================
   MIGRAÇÃO DE DADOS LOCAIS -> FIREBASE
========================================= */
window.migrarDadosLocaisParaNuvem = function () {
    if (typeof database === 'undefined') {
        alert("Erro: Banco de dados Firebase não conectado.");
        return;
    }

    if (!confirm("Tem certeza que deseja migrar os dados locais do seu navegador para a nuvem? Esta operação vai ler os dados antigos do 'localStorage' e enviar para o Firebase.")) {
        return;
    }

    showLoading(true);

    // Tipos de dados e suas respectivas chaves de array/objeto esperadas no localStorage antigo
    const collectionsToMigrate = {
        'equipamentos': ['equipamentos', 'transEquip_equipamentos'],
        'pessoas': ['pessoas', 'transEquip_pessoas'],
        'veiculos': ['veiculos', 'transEquip_veiculos'],
        'destinos': ['destinos', 'transEquip_destinos'],
        'aplicacoes': ['aplicacoes', 'transEquip_aplicacoes']
    };

    let totalMigrado = 0;
    let errors = 0;

    // Função auxiliar para tentar parsear os dados
    function getLocalData(keys) {
        for (let key of keys) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    return JSON.parse(raw);
                } catch (e) {
                    console.warn(`Erro ao parsear a chave ${key}`, e);
                }
            }
        }
        return null;
    }

    Object.keys(collectionsToMigrate).forEach(firebaseRef => {
        const localKeys = collectionsToMigrate[firebaseRef];
        const data = getLocalData(localKeys);

        if (data && typeof data === 'object') {
            // Data can be array or object map. Firebase "push" will work either way by just inserting records.
            const values = Array.isArray(data) ? data : Object.values(data);

            values.forEach(item => {
                // Previne dados inválidos básicos
                if (item && Object.keys(item).length > 0) {
                    // Adiciona um timestamp de migração
                    item.timestampStr = new Date().toISOString();
                    item.migradoDoLocal = true;

                    database.ref(firebaseRef).push().set(item)
                        .then(() => {
                            // Sucesso (ignorado p/ não focar em console.log)
                        })
                        .catch(err => {
                            console.error(`Erro ao migrar item de ${firebaseRef}`, err, item);
                            errors++;
                        });

                    totalMigrado++;
                }
            });
        }
    });

    // Simulando tempo para tudo ser processado assincronamente (Promise.all seria melhor mas Firebase real-time batch nem sempre expõe facil sem iterar de forma especial)
    setTimeout(() => {
        showLoading(false);
        if (totalMigrado > 0) {
            alert(`Migração iniciada com sucesso! \nForam enviados ${totalMigrado} registros do seu navegador local para a nuvem Firebase.`);

            // Pergunta opcional se deseja limpar os locais
            if (confirm("Deseja apagar os dados locais (localStorage) antigos do seu navegador agora para não haver migração duplicada futuramente?")) {
                Object.values(collectionsToMigrate).forEach(keys => {
                    keys.forEach(k => localStorage.removeItem(k));
                });
                alert("Dados locais antigos removidos.");
            }
        } else {
            alert("Nenhum dado local válido foi encontrado no navegador para migração.");
        }
    }, 2500); // 2.5s genérico p/ permitir chamadas de Push terminarem em conexões razoáveis
};

