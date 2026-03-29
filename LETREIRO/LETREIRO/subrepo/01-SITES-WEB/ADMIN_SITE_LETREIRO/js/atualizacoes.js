document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const database = firebase.database();

  const inVersion = document.getElementById("updVersion");
  const inBuild = document.getElementById("updBuild");
  const inDate = document.getElementById("updDate");
  const inSeverity = document.getElementById("updSeverity");
  const inLink = document.getElementById("updLink");
  const inChangelog = document.getElementById("updChangelog");
  const inRequired = document.getElementById("updRequired");
  const btnSave = document.getElementById("btnSaveUpdate");
  const historyBody = document.getElementById("historyTableBody");
  const lblCurrentVersion = document.getElementById("lblCurrentVersion");

  // Botões de severidade
  const sevBtns = document.querySelectorAll(".severity-btn");
  sevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sevBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      inSeverity.value = btn.dataset.val;
    });
  });

  // Data de hoje por padrão
  inDate.value = new Date().toISOString().split("T")[0];

  // =============================================
  // AUTENTICAÇÃO
  // =============================================
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      carregarDados();
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut().then(() => (window.location.href = "index.html"));
  });

  // =============================================
  // CARREGAR DADOS
  // =============================================
  function carregarDados() {
    // Versão ativa
    database.ref("app_update").once("value").then((snap) => {
      if (snap.exists()) {
        const data = snap.val();
        lblCurrentVersion.textContent = `v${data.version}`;

        // Preenche sugestões
        inVersion.value = data.version;
        inBuild.value = (parseInt(data.build_number) + 1) || "";
        inLink.value = data.download_url || "";
        inRequired.checked = data.required || false;

        sevBtns.forEach(b => {
          if (b.dataset.val === data.severity) b.click();
        });
      }
    }).catch(err => {
      console.error("Leitura falhou:", err);
      showToast("Erro ao ler dados do Firebase.", true);
    });

    // Histórico
    database.ref("app_update_history")
      .orderByChild("build_number")
      .limitToLast(15)
      .on("value", (snap) => {
        historyBody.innerHTML = "";
        if (!snap.exists()) {
          historyBody.innerHTML = `
            <tr><td colspan="5" style="text-align:center; padding:3rem; color:#555;">
              <i class="fas fa-inbox" style="font-size:2rem; display:block; margin-bottom:10px;"></i>
              Nenhum lançamento registrado ainda.
            </td></tr>`;
          return;
        }

        const items = [];
        snap.forEach(child => items.push({ id: child.key, ...child.val() }));
        items.reverse();

        // Pega a versão ativa pra marcar
        database.ref("app_update/version").once("value").then(activeSnap => {
          const activeVersion = activeSnap.val();

          items.forEach((item) => {
            const isActive = item.version === activeVersion && item.build_number === items[0].build_number;
            const row = document.createElement("tr");
            row.innerHTML = `
              <td class="text-mono" style="font-weight:600;">#${item.build_number}</td>
              <td>
                <span style="font-weight:700; color:#fff;">v${item.version}</span>
                ${item.required ? '<span style="color:#dc2626; font-size:0.7rem; margin-left:8px;"><i class="fas fa-lock"></i> Obrig.</span>' : ''}
              </td>
              <td style="font-size:0.8rem; color:#888;">${item.release_date || '—'}</td>
              <td>
                <span class="status-badge ${isActive ? 'current-badge' : 'past-badge'}">
                  ${isActive ? '● ATIVA' : 'Anterior'}
                </span>
              </td>
              <td style="text-align:right;">
                ${!isActive ? `
                  <button class="btn-premium" style="padding:5px 12px; font-size:0.7rem; background:rgba(255,255,255,0.05);"
                    onclick="republishVersion('${item.id}')">
                    <i class="fas fa-rotate"></i> Restaurar
                  </button>
                ` : '<span style="font-size:0.7rem; color:#10b981;"><i class="fas fa-check"></i> Em uso</span>'}
              </td>
            `;
            historyBody.appendChild(row);
          });
        });
      });
  }

  // =============================================
  // CONVERTER LINK DO GOOGLE DRIVE
  // =============================================
  function fixGoogleDriveLink(url) {
    // Converte link de visualização do Drive para download direto
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
  }

  // =============================================
  // LANÇAR ATUALIZAÇÃO
  // =============================================
  btnSave.addEventListener("click", () => {
    if (!inVersion.value || !inLink.value || !inBuild.value) {
      showToast("Preencha Versão, Build e Link!", true);
      return;
    }

    // Corrige link do Google Drive automaticamente
    const downloadUrl = fixGoogleDriveLink(inLink.value.trim());

    const changelogLines = inChangelog.value
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const updateData = {
      version: inVersion.value.trim(),
      build_number: parseInt(inBuild.value),
      release_date: inDate.value,
      download_url: downloadUrl,
      severity: inSeverity.value,
      required: inRequired.checked,
      changelog: changelogLines.length > 0 ? changelogLines : ["Melhorias gerais"],
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    btnSave.disabled = true;
    btnSave.innerHTML = "<i class='fas fa-spinner fa-spin'></i> PUBLICANDO...";

    const newHistoryRef = database.ref("app_update_history").push();

    Promise.all([
      database.ref("app_update").set(updateData),
      newHistoryRef.set(updateData)
    ]).then(() => {
      document.getElementById("successVersion").textContent = updateData.version;
      openModal("successModal");
    }).catch(err => {
      console.error("Erro ao publicar:", err);
      const report = {
        timestamp: new Date().toISOString(),
        error: err.code || err.message || "Erro desconhecido",
        payload: updateData
      };
      document.getElementById("errorReport").innerHTML = `<pre>${JSON.stringify(report, null, 2)}</pre>`;
      openModal("errorModal");
    }).finally(() => {
      btnSave.disabled = false;
      btnSave.innerHTML = "<i class='fas fa-paper-plane'></i> LANÇAR AGORA";
    });
  });

  // =============================================
  // REPUBLICAR VERSÃO
  // =============================================
  window.republishVersion = function(id) {
    if (!confirm("Deseja tornar esta versão a ATIVA para todos os terminais?")) return;

    database.ref(`app_update_history/${id}`).once("value").then(snap => {
      const data = snap.val();
      if (!data) return showToast("Versão não encontrada!", true);
      
      database.ref("app_update").set(data).then(() => {
        showToast("Versão restaurada com sucesso!");
        setTimeout(() => location.reload(), 800);
      }).catch(() => showToast("Erro ao restaurar.", true));
    });
  };

  // =============================================
  // UTILITÁRIOS
  // =============================================
  window.openModal = (id) => document.getElementById(id).classList.add("show");
  window.closeModal = (id) => document.getElementById(id).classList.remove("show");
  window.copyErrorReport = () => {
    navigator.clipboard.writeText(document.getElementById("errorReport").innerText);
    showToast("Relatório copiado!");
  };

  function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.querySelector("span").textContent = message;
    toast.style.background = isError ? "rgba(220, 38, 38, 0.95)" : "rgba(16, 185, 129, 0.95)";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
  }
});
