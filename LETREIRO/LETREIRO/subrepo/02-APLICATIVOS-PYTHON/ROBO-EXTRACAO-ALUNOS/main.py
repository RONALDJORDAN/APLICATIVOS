"""
Robô de Extração de Alunos - Sistema i-Educar
Captura visual de tela + Paginação automática
"""

import re
import os
import sys
import time
import logging
import threading
from datetime import datetime

import tkinter as tk
from tkinter import scrolledtext, messagebox, ttk

import pandas as pd

# --- Bibliotecas de Automação Visual ---
try:
    import pyautogui
    import pyperclip
except ImportError:
    print("ERRO: Execute: pip install pyautogui pyperclip pillow opencv-python pandas openpyxl")
    sys.exit(1)

# --- Configurações Gerais ---
pyautogui.FAILSAFE = True   # Mova o mouse pro canto superior-esquerdo para abortar
pyautogui.PAUSE    = 0.1    # Pausa mínima entre ações

logging.basicConfig(
    filename="robo_log.txt",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    encoding="utf-8"
)

COLUNAS_IEDUCAR = ["Código Aluno", "Código INEP", "Nome do Aluno", "Nome da Mãe", "Situação", "Turma", "Escola"]

# ──────────────────────────────────────────────────────────────
# PARSER: Extrai alunos sem turma de um bloco de texto copiado
# ──────────────────────────────────────────────────────────────
def extrair_alunos_sem_turma(texto: str) -> list[dict]:
    """
    Recebe texto bruto copiado da tela e devolve
    somente os registros cujo campo 'Turma' estiver vazio.

    Formato esperado i-Educar (colunas separadas por TAB ou 2+ espaços):
    Cód. Aluno | Cód. INEP | Nome Aluno | Nome Mãe | Situação | Turma | Escola
    """
    resultado = []
    TURMA_VAZIA = {"", "-", "---", "n/a", "não enturmado", "sem turma"}

    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha:
            continue

        # Separação por TAB ou 2+ espaços consecutivos
        partes = re.split(r"\t| {2,}", linha)
        partes = [p.strip() for p in partes]

        # Precisamos de pelo menos 6 colunas (até Turma)
        if len(partes) < 6:
            continue

        turma = partes[5].strip()

        # Filtra apenas sem turma
        if turma.lower() not in TURMA_VAZIA:
            continue

        resultado.append({
            "Código Aluno": partes[0],
            "Código INEP":  partes[1] if len(partes) > 1 else "",
            "Nome do Aluno": partes[2] if len(partes) > 2 else "",
            "Nome da Mãe":  partes[3] if len(partes) > 3 else "",
            "Situação":     partes[4] if len(partes) > 4 else "",
            "Turma":        turma,
            "Escola":       partes[6].strip() if len(partes) > 6 else "",
        })

    return resultado


# ──────────────────────────────────────────────────────────────
# APLICAÇÃO PRINCIPAL
# ──────────────────────────────────────────────────────────────
class RoboApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Robô i-Educar – Extração de Alunos Sem Turma")
        self.geometry("1020x720")
        self.configure(bg="#ecf0f1")
        self.resizable(True, True)
        self.attributes("-topmost", True)

        # Estado
        self._stop   = threading.Event()
        self._pause  = threading.Event()
        self._pause.set()   # Começa sem pausa
        self._running = False

        self.dados_totais: list[dict] = []
        self.chaves_vistas: set       = set()
        self.passos_scroll            = tk.IntVar(value=3)

        # Coordenadas do botão Próximo (definidas pelo usuário)
        self.botao_x = tk.IntVar(value=0)
        self.botao_y = tk.IntVar(value=0)
        self._coordenadas_definidas = False

        self._build_ui()

    # ── INTERFACE ─────────────────────────────────────────────

    def _build_ui(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview",        font=("Segoe UI", 9), rowheight=26, background="#ffffff")
        style.configure("Treeview.Heading",font=("Segoe UI", 9, "bold"), background="#2c3e50", foreground="white")
        style.map("Treeview", background=[("selected", "#3498db")])

        # ── HEADER ─────────────────────────────────────────────
        hdr = tk.Frame(self, bg="#2c3e50")
        hdr.pack(fill="x")
        tk.Label(hdr, text="ROBÔ DE EXTRAÇÃO  ·  i-Educar",
                 font=("Segoe UI", 15, "bold"), fg="white", bg="#2c3e50").pack(side="left", padx=20, pady=12)
        tk.Label(hdr, text="© CodAureo DevStudio",
                 font=("Segoe UI", 8), fg="#bdc3c7", bg="#2c3e50").pack(side="right", padx=20)

        # ── STATUS BAR ─────────────────────────────────────────
        self.frm_status = tk.Frame(self, bg="#34495e")
        self.frm_status.pack(fill="x")
        self.lbl_status = tk.Label(self.frm_status, text="⏸  Pronto para iniciar",
                                   font=("Segoe UI", 9), fg="#1abc9c", bg="#34495e", anchor="w")
        self.lbl_status.pack(side="left", padx=12, pady=4)
        self.lbl_contagem = tk.Label(self.frm_status, text="Alunos coletados: 0  |  Página: -",
                                     font=("Segoe UI", 9), fg="#ecf0f1", bg="#34495e", anchor="e")
        self.lbl_contagem.pack(side="right", padx=12)

        # ── CONTROLES ──────────────────────────────────────────
        frm_ctrl = tk.Frame(self, bg="#ecf0f1", pady=6)
        frm_ctrl.pack(fill="x", padx=16)

        self.btn_start = tk.Button(frm_ctrl, text="▶  INICIAR",
            command=self.iniciar, width=14, height=2,
            bg="#27ae60", fg="white", font=("Segoe UI", 10, "bold"),
            relief="flat", cursor="hand2")
        self.btn_start.grid(row=0, column=0, padx=4)

        self.btn_pause = tk.Button(frm_ctrl, text="⏸  PAUSAR",
            command=self.pausar_continuar, width=14, height=2,
            bg="#f39c12", fg="white", font=("Segoe UI", 10, "bold"),
            relief="flat", cursor="hand2", state="disabled")
        self.btn_pause.grid(row=0, column=1, padx=4)

        self.btn_stop = tk.Button(frm_ctrl, text="🛑  PARAR",
            command=self.parar, width=14, height=2,
            bg="#e74c3c", fg="white", font=("Segoe UI", 10, "bold"),
            relief="flat", cursor="hand2")
        self.btn_stop.grid(row=0, column=2, padx=4)

        # Separador
        tk.Frame(frm_ctrl, bg="#bdc3c7", width=2, height=45).grid(row=0, column=3, padx=10)

        # ── Painel de coordenadas (linha 1) ───────────────────
        frm_coord = tk.LabelFrame(self, text=" 📍 Coordenada do Botão 'Próximo'  ›  (Clique CALIBRAR, vá ao sistema, posicione o mouse sobre o botão e aguarde 5s) ",
            bg="#ecf0f1", font=("Segoe UI", 8, "bold"), fg="#2c3e50", padx=8, pady=6)
        frm_coord.pack(fill="x", padx=16, pady=(0, 4))

        tk.Label(frm_coord, text="X:", bg="#ecf0f1", font=("Segoe UI", 9, "bold")).grid(row=0, column=0)
        tk.Entry(frm_coord, textvariable=self.botao_x, width=6,
                 font=("Segoe UI", 9), justify="center").grid(row=0, column=1, padx=(2, 10))

        tk.Label(frm_coord, text="Y:", bg="#ecf0f1", font=("Segoe UI", 9, "bold")).grid(row=0, column=2)
        tk.Entry(frm_coord, textvariable=self.botao_y, width=6,
                 font=("Segoe UI", 9), justify="center").grid(row=0, column=3, padx=(2, 10))

        self.lbl_coord_status = tk.Label(frm_coord, text="⚠️  Não calibrado",
            bg="#ecf0f1", fg="#e74c3c", font=("Segoe UI", 9, "bold"))
        self.lbl_coord_status.grid(row=0, column=4, padx=10)

        tk.Button(frm_coord, text="🎯  CALIBRAR  (5s)",
            command=self.calibrar_coordenada, width=18,
            bg="#8e44ad", fg="white", font=("Segoe UI", 9, "bold"),
            relief="flat", cursor="hand2").grid(row=0, column=5, padx=8)

        # Passos de scroll e limpar (voltam ao frm_ctrl)
        tk.Label(frm_ctrl, text="Scrolls/pág:", bg="#ecf0f1",
                 font=("Segoe UI", 9)).grid(row=0, column=4, padx=(10, 2))
        tk.Spinbox(frm_ctrl, from_=1, to=20, textvariable=self.passos_scroll,
                   width=4, font=("Segoe UI", 9)).grid(row=0, column=5)

        # Botão Limpar
        tk.Button(frm_ctrl, text="🗑 Limpar Lista",
            command=self.limpar, width=13, height=2,
            bg="#95a5a6", fg="white", font=("Segoe UI", 9),
            relief="flat", cursor="hand2").grid(row=0, column=6, padx=10)

        # ── TABELA DE RESULTADOS ───────────────────────────────
        tk.Label(self, text=" Alunos identificados SEM turma:", font=("Segoe UI", 10, "bold"),
                 bg="#ecf0f1", fg="#2c3e50", anchor="w").pack(fill="x", padx=16, pady=(10, 2))

        frm_tabela = tk.Frame(self, bg="#ecf0f1")
        frm_tabela.pack(expand=True, fill="both", padx=16)

        self.tree = ttk.Treeview(frm_tabela, columns=COLUNAS_IEDUCAR, show="headings")
        
        # Configuração de larguras
        widths = {"Código Aluno": 90, "Código INEP": 90, "Nome do Aluno": 200,
                  "Nome da Mãe": 170, "Situação": 100, "Turma": 70, "Escola": 180}
        for col in COLUNAS_IEDUCAR:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=widths.get(col, 120), anchor="w")

        scr_y = ttk.Scrollbar(frm_tabela, orient="vertical",   command=self.tree.yview)
        scr_x = ttk.Scrollbar(frm_tabela, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=scr_y.set, xscrollcommand=scr_x.set)

        self.tree.grid(row=0, column=0, sticky="nsew")
        scr_y.grid(row=0, column=1, sticky="ns")
        scr_x.grid(row=1, column=0, sticky="ew")
        frm_tabela.rowconfigure(0, weight=1)
        frm_tabela.columnconfigure(0, weight=1)

        # ── LOG ────────────────────────────────────────────────
        frm_log = tk.LabelFrame(self, text=" Log de Execução ", bg="#ecf0f1",
                                font=("Segoe UI", 8, "bold"), pady=4, padx=6)
        frm_log.pack(fill="x", padx=16, pady=(6, 10))
        self.txt_log = scrolledtext.ScrolledText(frm_log, height=7,
            font=("Consolas", 8), state="disabled", bg="#1e2124", fg="#a8d8a8")
        self.txt_log.pack(fill="x")

    # ── LOGGING ───────────────────────────────────────────────

    def log(self, msg: str):
        ts = datetime.now().strftime("%H:%M:%S")
        linha = f"[{ts}] {msg}\n"
        logging.info(msg)

        self.txt_log.configure(state="normal")
        self.txt_log.insert("end", linha)
        self.txt_log.see("end")
        self.txt_log.configure(state="disabled")

    def set_status(self, msg: str, cor: str = "#1abc9c"):
        self.lbl_status.config(text=f"  {msg}", fg=cor)

    def atualizar_contagem(self, pagina: int = 0):
        self.lbl_contagem.config(
            text=f"Alunos coletados: {len(self.dados_totais)}  |  Página: {pagina if pagina else '-'}"
        )

    # ── BOTÕES ─────────────────────────────────────────────────

    def iniciar(self):
        if self._running:
            return
        self.dados_totais.clear()
        self.chaves_vistas.clear()

        self._stop.clear()
        self._pause.set()
        self._running = True

        self.btn_start.config(state="disabled")
        self.btn_pause.config(state="normal")

        messagebox.showinfo("ATENÇÃO",
            "Ao clicar OK você terá 5 segundos.\n"
            "Vá para a janela do i-Educar antes do robô começar!")
        
        t = threading.Thread(target=self._automacao, daemon=True)
        t.start()

    def pausar_continuar(self):
        if self._pause.is_set():
            self._pause.clear()
            self.btn_pause.config(text="▶  CONTINUAR", bg="#16a085")
            self.set_status("⏸  Pausado", "#f39c12")
            self.log("⏸ Automação pausada.")
        else:
            self._pause.set()
            self.btn_pause.config(text="⏸  PAUSAR", bg="#f39c12")
            self.set_status("▶  Executando...", "#1abc9c")
            self.log("▶ Automação retomada.")

    def parar(self):
        self._stop.set()
        self._pause.set()   # Desbloqueia caso esteja em pausa
        self.set_status("🛑  Parado", "#e74c3c")
        self.log("🛑 PARADA SOLICITADA.")
        self._finalizar_ui()

    def limpar(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        self.dados_totais.clear()
        self.chaves_vistas.clear()
        self.atualizar_contagem(0)
        self.log("🗑 Lista limpa.")

    # ── CAPTURAR IMAGEM DO BOTÃO PRÓXIMO ───────────────────────

    def calibrar_coordenada(self):
        """Conta 5s e registra a posição do mouse como coordenada do botão Próximo."""
        messagebox.showinfo("Calibração de Coordenada",
            "1. Clique OK.\n"
            "2. Vá até o sistema i-Educar.\n"
            "3. Vá até o FIM da página onde está o botão  ›  (Próximo).\n"
            "4. Posicione o mouse EXATAMENTE sobre ele.\n"
            "5. Aguarde 5 segundos SEM MOVER o mouse.\n\n"
            "A coordenada será salva automaticamente.")
        self.lower()
        time.sleep(0.5)
        for i in range(5, 0, -1):
            self.log(f"🎯 Capturando coordenada em {i}s...")
            time.sleep(1)
        x, y = pyautogui.position()
        self.botao_x.set(x)
        self.botao_y.set(y)
        self._coordenadas_definidas = True
        self.lift()
        self.lbl_coord_status.config(text=f"✅  X={x}  Y={y}", fg="#27ae60")
        self.log(f"✅ Coordenada do botão definida: X={x}, Y={y}")
        messagebox.showinfo("Calibrado!", f"Coordenada registrada: X={x}, Y={y}\nO robô vai clicar aqui para avançar a página.")

    # ── AUTOMAÇÃO PRINCIPAL ────────────────────────────────────

    def _automacao(self):
        try:
            self.log("⏳ Iniciando em 5 segundos...")
            time.sleep(5)
            self.log("🚀 Iniciando extração!")

            pagina = 1

            while not self._stop.is_set():
                self.set_status(f"▶  Extraindo Página {pagina}...", "#1abc9c")
                self.log(f"\n{'─'*50}")
                self.log(f"📄 PÁGINA {pagina}")

                # ── 1. Ir para o TOPO ──────────────────────────
                self._aguardar_pausa()
                if self._stop.is_set(): break
                
                # Sem clique do mouse — uso de teclado apenas
                pyautogui.hotkey("ctrl", "Home")
                time.sleep(0.8)
                self.log("⬆️  Topo da página.")

                # ── 2. Varredura topo → rodapé ─────────────────
                texto_anterior = ""
                passos = self.passos_scroll.get()

                for passo in range(passos + 1):   # +1 garante leitura antes do scroll
                    self._aguardar_pausa()
                    if self._stop.is_set(): break

                    # Copiar conteúdo da tela atual
                    pyautogui.hotkey("ctrl", "a")
                    time.sleep(0.3)
                    pyautogui.hotkey("ctrl", "c")
                    time.sleep(0.5)

                    texto = pyperclip.paste()
                    pyperclip.copy("")  # Limpa clipboard para o próximo ciclo

                    if texto and texto != texto_anterior:
                        novos = extrair_alunos_sem_turma(texto)
                        qtd   = self._adicionar(novos)
                        if qtd:
                            self.log(f"  ✅ +{qtd} aluno(s) | passo {passo + 1}/{passos + 1}")
                        texto_anterior = texto
                    
                    # Scroll para baixo (exceto no último passo)
                    if passo < passos:
                        self.log(f"  ⬇️  Rolando tela ({passo + 1}/{passos})...")
                        pyautogui.scroll(-600)
                        time.sleep(0.6)

                if self._stop.is_set(): break

                # Salva progresso após cada página
                self._salvar_excel()
                self.after(0, self.atualizar_contagem, pagina)
                self.log(f"✔️  Página {pagina} concluída. Total: {len(self.dados_totais)}")

                # ── 3. Ir para o RODAPÉ e procurar botão › ────
                self.set_status(f"🔎  Buscando próxima página...", "#f39c12")
                pyautogui.hotkey("ctrl", "End")
                time.sleep(1.0)

                avancou = self._clicar_proximo()

                if avancou:
                    pagina += 1
                    self.log(f"➡️  Indo para página {pagina}...")
                    time.sleep(3.0)   # Carregamento da nova página
                else:
                    # Não para automaticamente — aguarda até o usuário clicar STOP
                    self.log("⚠️  Botão 'Próximo' não encontrado.")
                    self.log("🔁 Aguardando... Clique PARAR para encerrar.")
                    self.set_status("⚠️  Aguardando ação manual (ou PARAR)", "#f39c12")
                    # Fica em espera até _stop ser acionado
                    while not self._stop.is_set():
                        time.sleep(1.0)
                    break

        except Exception as e:
            self.log(f"❌ ERRO: {e}")
            self.set_status(f"❌ Erro: {e}", "#e74c3c")

        finally:
            self._running = False
            self.after(0, self._finalizar_ui)

    # ── HELPERS ────────────────────────────────────────────────

    def _aguardar_pausa(self):
        """Fica bloqueado aqui se o usuário pausou."""
        while not self._pause.is_set():
            if self._stop.is_set(): return
            time.sleep(0.3)

    def _adicionar(self, novos: list[dict]) -> int:
        """Adiciona alunos novos à tabela e lista, evitando duplicatas."""
        count = 0
        for al in novos:
            chave = f"{al['Código Aluno']}|{al['Nome do Aluno']}"
            if chave in self.chaves_vistas:
                continue
            self.chaves_vistas.add(chave)
            self.dados_totais.append(al)
            self.after(0, self._inserir_linha, al)
            count += 1
        return count

    def _inserir_linha(self, al: dict):
        self.tree.insert("", "end", values=[al.get(c, "") for c in COLUNAS_IEDUCAR])

    def _clicar_proximo(self) -> bool:
        """Clica na coordenada fixa definida pelo usuário para avançar a página."""
        if not self._coordenadas_definidas:
            self.log("⚠️  Coordenada do botão 'Próximo' não calibrada.")
            self.log("    Use o botão 🎯 CALIBRAR antes de iniciar.")
            return False

        x = self.botao_x.get()
        y = self.botao_y.get()

        if x == 0 and y == 0:
            self.log("⚠️  Coordenadas X=0, Y=0 inválidas. Calibre novamente.")
            return False

        self.log(f"�️  Clicando no botão 'Próximo' em X={x}, Y={y}...")
        pyautogui.click(x, y)
        return True

    def _salvar_excel(self):
        if not self.dados_totais: return
        arquivo = "relatorio_final.xlsx"
        try:
            df = pd.DataFrame(self.dados_totais, columns=COLUNAS_IEDUCAR)
            df.insert(len(COLUNAS_IEDUCAR), "Data Extração",
                      datetime.now().strftime("%d/%m/%Y %H:%M"))
            df.to_excel(arquivo, index=False)
            self.log(f"💾 Excel salvo: {os.path.abspath(arquivo)}")
        except Exception as e:
            self.log(f"  ⚠️  Erro ao salvar Excel: {e}")

    def _finalizar_ui(self):
        self.btn_start.config(state="normal")
        self.btn_pause.config(state="disabled", text="⏸  PAUSAR", bg="#f39c12")


# ── ENTRY POINT ───────────────────────────────────────────────
if __name__ == "__main__":
    app = RoboApp()
    app.mainloop()
