// --- SUPREME ADMIN LOGIC ---

// State
let allLicenses = [];

// DOM Elements
const loadingDiv = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");
const addLicenseBtn = document.getElementById("addLicenseBtn");
const logoutBtn = document.getElementById("logoutBtn");
const newLicenseModal = document.getElementById("newLicenseModal");
const detailsModal = document.getElementById("detailsModal");
const toastEl = document.getElementById("toast");
const generateRandomBtn = document.getElementById("generateRandomBtn");

// Mobile Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");

// Modal Elements
const modalKeyTitle = document.getElementById("modalKeyTitle");
const modalStatusBadge = document.getElementById("modalStatusBadge");
const deviceDetailsPanel = document.getElementById("deviceDetails");
const noDeviceMessage = document.getElementById("noDeviceMessage");
const modalResetBtn = document.getElementById("modalResetBtn");

// --- AUTH & LOAD ---
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadData();
  }
});

if (logoutBtn) logoutBtn.addEventListener("click", () => auth.signOut());

function loadData() {
  database.ref("licencas").on(
    "value",
    (snap) => {
      const val = snap.val() || {};
      allLicenses = Object.keys(val).map((key) => ({ key, ...val[key] }));

      updateStats();
      renderActiveView();
      if (loadingDiv) loadingDiv.style.display = "none";
    },
    (err) => {
      console.error(err);
      showToast("Erro de permissão no Firebase!", "#ff3333");
    },
  );
}

// Mobile Menu Toggle
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("active");
    const icon = mobileMenuBtn.querySelector("i");
    if (sidebar.classList.contains("active")) {
      icon.classList.replace("fa-bars", "fa-times");
    } else {
      icon.classList.replace("fa-times", "fa-bars");
    }
  });

  document.addEventListener("click", (e) => {
    if (
      sidebar.classList.contains("active") &&
      !sidebar.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)
    ) {
      sidebar.classList.remove("active");
      mobileMenuBtn.querySelector("i").classList.replace("fa-times", "fa-bars");
    }
  });
}

// --- UTILS & HELPERS ---
function isExpired(item) {
    if (!item.data_expiracao) return false;
    const exp = new Date(item.data_expiracao + 'T23:59:59');
    return exp < new Date();
}

function getStatusInfo(item) {
    const isUsed = !!item.hwid_vinculado;
    if (isExpired(item)) {
        return { label: 'EXPIRADO', cssClass: 'badge-danger', icon: 'fa-times-circle' };
    }
    if (isUsed) {
        return { label: 'ATIVO', cssClass: 'badge-active', icon: 'fa-check-circle' };
    }
    return { label: 'PENDENTE', cssClass: 'badge-pending', icon: 'fa-clock' };
}

function formatDateBR(dateStr) {
    if (!dateStr) return '---';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return '---';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

window.setPresetDate = function(id, days) {
    if (days === 0) {
        document.getElementById(id).value = '';
        return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    document.getElementById(id).value = dateStr;
};

// --- RENDER LOGIC ---
function updateStats() {
  const activeCount = allLicenses.filter((l) => l.hwid_vinculado && !isExpired(l)).length;
  const expiredCount = allLicenses.filter((l) => isExpired(l)).length;
  const pendingCount = allLicenses.length - activeCount - expiredCount;

  const setStat = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setStat("stat-total", allLicenses.length);
  setStat("stat-active", activeCount);
  setStat("stat-pending", pendingCount);
  setStat("mgmt-stat-total", allLicenses.length);
  setStat("mgmt-stat-active", activeCount);
  setStat("mgmt-stat-pending", pendingCount);
  setStat("mgmt-stat-expired", expiredCount);
}

function renderActiveView(data = allLicenses) {
  const currentTable = document.getElementById("tableBody");
  const mgmtTable = document.getElementById("mgmtTableBody");

  if (currentTable) renderTable(data, currentTable, false);
  if (mgmtTable) renderTable(data, mgmtTable, true);
}

function renderTable(data, container, isFullView) {
  const sorted = [...data].sort((a, b) => {
    if (isExpired(a) && !isExpired(b)) return 1;
    if (!isExpired(a) && isExpired(b)) return -1;
    if (a.hwid_vinculado && !b.hwid_vinculado) return -1;
    if (!a.hwid_vinculado && b.hwid_vinculado) return 1;
    return (b.data_ativacao || "").localeCompare(a.data_ativacao || "") || a.key.localeCompare(b.key);
  });

  container.innerHTML = "";

  if (sorted.length === 0) {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 5rem; opacity:0.5;">
            <i class="fas fa-search fa-3x" style="margin-bottom:1rem; display:block"></i>
            Nenhum registro encontrado.
        </td></tr>`;
    return;
  }

  const displayData = isFullView ? sorted : sorted.slice(0, 10);

  displayData.forEach((item) => {
    const isUsed = !!item.hwid_vinculado;
    const row = createTableRow(item, isUsed, isFullView);
    container.appendChild(row);
  });
}

function createTableRow(item, isUsed, isFull) {
  const statusInfo = getStatusInfo(item);
  const row = document.createElement("tr");
  row.className = isExpired(item) ? "row-expired" : (isUsed ? "row-active" : "row-pending");
  row.style.cursor = "pointer";

  row.onclick = (e) => {
    if (e.target.closest("button")) return;
    showDetails(item);
  };

  const statusTag = `<span class="badge ${statusInfo.cssClass}"><i class="fas ${statusInfo.icon}"></i> ${statusInfo.label}</span>`;

  const deviceName = item.info_aparelho?.name || (isUsed ? "Desconhecido" : "Aguardando...");
  const activationDate = item.data_ativacao ? new Date(item.data_ativacao).toLocaleDateString("pt-BR") : "---";
  
  const inicioStr = formatDateBR(item.data_inicio);
  const expStr = formatDateBR(item.data_expiracao);
  const expColor = isExpired(item) ? '#F44336' : '#4CAF50';
  const validadeCell = item.data_expiracao 
      ? `<div style="font-size: 0.8rem;"><span style="color: #888;">${inicioStr}</span><br><span style="color: ${expColor}; font-weight: 600;">até ${expStr}</span></div>` 
      : `<span style="color: #888; font-size: 0.8rem;">Sem limite</span>`;

  if (isFull) {
    const ownerName = item.nome_proprietario || "Não vinculado";
    const ownerDoc = item.documento_identificado || "";

    row.innerHTML = `
            <td>
                <div class="key-container">
                    <code class="key-pill">${item.key}</code>
                    <button onclick="copyToClipboard('${item.key}', this)" class="btn-copy-sm" title="Copiar"><i class="far fa-copy"></i></button>
                </div>
            </td>
            <td>
                <div class="owner-cell">
                    <div class="owner-avatar">${ownerName.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="owner-name">${ownerName}</div>
                        <div class="owner-doc">${ownerDoc}</div>
                    </div>
                </div>
            </td>
            <td>${statusTag}</td>
            <td>${validadeCell}</td>
            <td>
                <div class="device-cell">
                    <span class="device-name"><i class="fas fa-laptop-code"></i> ${deviceName}</span>
                    <span class="device-date">${activationDate}</span>
                </div>
            </td>
            <td style="text-align:right;">
                <div class="actions-group">
                    <button onclick="manageValidity('${item.key}')" class="btn-action validity" title="Gerenciar Validade"><i class="fas fa-calendar-alt"></i></button>
                    <button onclick="resetHwid('${item.key}')" class="btn-action reset" title="Liberar Chave (Reset HWID)"><i class="fas fa-rotate"></i></button>
                    <button onclick="deleteLicense('${item.key}')" class="btn-action delete" title="Remover Definitivamente"><i class="fas fa-trash-can"></i></button>
                </div>
            </td>
        `;
  } else {
    row.innerHTML = `
            <td>${item.key}</td>
            <td>${statusTag}</td>
            <td>${validadeCell}</td>
            <td>${deviceName}</td>
            <td><small>${activationDate}</small></td>
            <td style="text-align:right;"><i class="fas fa-chevron-right" style="opacity:0.2"></i></td>
        `;
  }
  return row;
}

// --- SEARCH & FILTER ---
window.handleSearch = function (query) {
  const q = query.toLowerCase().trim();
  const filtered = allLicenses.filter(
    (l) =>
      l.key.toLowerCase().includes(q) ||
      (l.nome_proprietario || "").toLowerCase().includes(q) ||
      (l.documento_identificado || "").toLowerCase().includes(q)
  );
  renderActiveView(filtered);
};

if (searchInput) {
  searchInput.oninput = (e) => handleSearch(e.target.value);
}

window.filterData = function (type, btn) {
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  let filtered = allLicenses;
  if (type === "active") filtered = allLicenses.filter((l) => l.hwid_vinculado && !isExpired(l));
  if (type === "pending") filtered = allLicenses.filter((l) => !l.hwid_vinculado && !isExpired(l));
  if (type === "expired") filtered = allLicenses.filter((l) => isExpired(l));

  renderActiveView(filtered);
};

// --- MODAL ACTIONS ---
function showDetails(item) {
  modalKeyTitle.innerText = `Chave: ${item.key}`;
  const statusInfo = getStatusInfo(item);
  const isUsed = !!item.hwid_vinculado;

  modalStatusBadge.innerHTML = `<span class="badge ${statusInfo.cssClass}">${statusInfo.label}</span>`;

  // Update Expiration Display
  document.getElementById("detail-inicio").innerText = formatDateBR(item.data_inicio);
  document.getElementById("detail-expiracao").innerText = formatDateBR(item.data_expiracao);

  if (isUsed) {
    deviceDetailsPanel.classList.remove("hidden");
    noDeviceMessage.classList.add("hidden");
    modalResetBtn.style.display = "inline-flex";

    document.getElementById("detail-name").innerText = item.info_aparelho?.name || "Desconhecido";
    document.getElementById("detail-os").innerText = item.info_aparelho?.os || "Desconhecido";
    document.getElementById("detail-user").innerText = item.info_aparelho?.user || "Desconhecido";
    document.getElementById("detail-hwid").innerText = item.hwid_vinculado || "N/A";
    document.getElementById("detail-date").innerText = item.data_ativacao || "N/A";

    document.getElementById("detail-owner").innerText = item.nome_proprietario || "Não Informado";
    document.getElementById("detail-doc").innerText = item.documento_identificado || "Não Informado";
    document.getElementById("detail-lgpd").innerHTML = item.aceite_lgpd
      ? '<i class="fas fa-shield-alt"></i> Aceito'
      : '<span style="color: var(--danger);">Não Registrado</span>';

    modalResetBtn.onclick = () => {
      resetHwid(item.key);
      closeModal("detailsModal");
    };
  } else {
    deviceDetailsPanel.classList.add("hidden");
    noDeviceMessage.classList.remove("hidden");
    modalResetBtn.style.display = "none";
  }

  detailsModal.classList.add("active");
}

window.manageValidity = function(key) {
    const item = allLicenses.find(l => l.key === key);
    if (!item) return;

    document.getElementById('validityKeyRef').innerText = `CHAVE: ${key}`;
    document.getElementById('editValidInicio').value = item.data_inicio || '';
    document.getElementById('editValidExp').value = item.data_expiracao || '';

    const saveBtn = document.getElementById('saveValidityFinalBtn');
    saveBtn.onclick = () => {
        const newInicio = document.getElementById('editValidInicio').value;
        const newExp = document.getElementById('editValidExp').value;
        
        const updates = {
            data_inicio: newInicio || '',
            data_expiracao: newExp || ''
        };

        // Calcula Status ao salvar
        if (newExp) {
            const expDate = new Date(newExp + 'T23:59:59');
            if (expDate < new Date()) updates.status = "expirado";
            else updates.status = item.hwid_vinculado ? "ativo" : "pendente_pagamento";
        } else {
            updates.status = item.hwid_vinculado ? "ativo" : "pendente_pagamento";
        }

        database.ref(`licencas/${key}`).update(updates).then(() => {
            showToast("Validade atualizada com sucesso!");
            closeModal('validityModal');
        });
    };

    document.getElementById('validityModal').classList.add('active');
};

window.closeModal = (id) => document.getElementById(id).classList.remove("active");

// --- DATABASE ACTIONS ---
if (addLicenseBtn) {
  addLicenseBtn.onclick = () => {
    document.getElementById("newKeyInput").value = "";
    document.getElementById("newDataInicio").value = new Date().toISOString().split('T')[0];
    document.getElementById("newDataExpiracao").value = "";
    newLicenseModal.classList.add("active");
  };
}

if (generateRandomBtn) {
  generateRandomBtn.onclick = () => {
    const uuid = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    document.getElementById("newKeyInput").value = `${uuid()}-${uuid()}-${uuid()}`;
  };
}

const saveBtnMain = document.getElementById("saveBtn");
if (saveBtnMain) {
  saveBtnMain.onclick = () => {
    const key = document.getElementById("newKeyInput").value.trim().toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase();
    const dataInicio = document.getElementById("newDataInicio").value;
    const dataExp = document.getElementById("newDataExpiracao").value;

    if (allLicenses.some((l) => l.key === key)) {
      showToast("Esta chave já existe!", "#ff4d6d");
      return;
    }

    let status = "pendente_pagamento";
    if (dataExp) {
        const expDate = new Date(dataExp + 'T23:59:59');
        if (expDate < new Date()) status = "expirado";
    }

    database.ref(`licencas/${key}`).set({
        hwid_vinculado: "",
        data_ativacao: "",
        data_inicio: dataInicio,
        data_expiracao: dataExp,
        status: status
      }).then(() => {
        closeModal("newLicenseModal");
        showToast("Licença gerada com sucesso!");
      });
  };
}

window.resetHwid = function (key) {
  if (!confirm(`Deseja resetar a ativação da chave ${key}?`)) return;
  database.ref(`licencas/${key}`).update({
      hwid_vinculado: "",
      data_ativacao: "",
      info_aparelho: null,
      nome_proprietario: "",
      documento_identificado: "",
      aceite_lgpd: false
    }).then(() => showToast("Chave liberada para novo uso!"));
};

window.deleteLicense = function (key) {
  if (!confirm(`Excluir a chave ${key} permanentemente?`)) return;
  database.ref(`licencas/${key}`).remove().then(() => showToast("Licença excluída!", "#ff4d6d"));
};

// --- UTILS ---
window.copyToClipboard = function (text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const icon = btn.querySelector("i");
    const oldClass = icon.className;
    icon.className = "fas fa-check";
    icon.style.color = "var(--success)";
    showToast("Chave copiada!");
    setTimeout(() => {
      icon.className = oldClass;
      icon.style.color = "";
    }, 2000);
  });
};

window.exportToCSV = function () {
  if (allLicenses.length === 0) return;
  let csv = "Chave,Status,Proprietário,Documento,Expiração\n";
  allLicenses.forEach((l) => {
    const status = getStatusInfo(l).label;
    csv += `${l.key},${status},${l.nome_proprietario || ""},${l.documento_identificado || ""},${l.data_expiracao || "Sem limite"}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = `relatorio-licencas.csv`;
  a.click();
};

function showToast(msg, color = "var(--primary)") {
  const span = toastEl.querySelector("span");
  span.innerText = msg;
  toastEl.style.borderLeft = `4px solid ${color}`;
  toastEl.classList.add("active");
  setTimeout(() => toastEl.classList.remove("active"), 3500);
}

// Cancel
const cnclBtn = document.getElementById("cancelBtn");
if (cnclBtn) cnclBtn.onclick = () => closeModal("newLicenseModal");
