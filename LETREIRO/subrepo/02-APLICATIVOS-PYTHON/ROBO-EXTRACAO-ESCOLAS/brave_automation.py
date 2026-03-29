import customtkinter as ctk
import pandas as pd
from bs4 import BeautifulSoup
import tkinter as tk
from tkinter import filedialog, messagebox
import threading
from playwright.sync_api import sync_playwright
import pyautogui
import pytesseract
from PIL import Image
import os
import time

# Tente configurar o caminho do Tesseract se ele existir em locais comuns
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Users\{}\AppData\Local\Tesseract-OCR\tesseract.exe".format(os.getlogin()),
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
]

for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break

ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Extrator de Dados - Codaureo Vision")
        self.geometry("900x750")
        
        # Titulo Principal
        self.lbl_titulo = ctk.CTkLabel(self, text="Extrator de Dados Web & Tela", font=("Arial", 24, "bold"))
        self.lbl_titulo.pack(pady=10)

        # Tabs
        self.tabview = ctk.CTkTabview(self, width=850, height=550)
        self.tabview.pack(pady=10, padx=20, fill="both", expand=True)
        self.tab_brave = self.tabview.add("Conectar ao Brave")
        self.tab_vision = self.tabview.add("Olhar a Tela (OCR)")
        self.tab_html = self.tabview.add("Colar HTML Manual")
        
        # --- TAB BRAVE ---
        self.lbl_brave = ctk.CTkLabel(self.tab_brave, text="Extrair Tudo do Brave", font=("Arial", 18, "bold"))
        self.lbl_brave.pack(pady=10)
        
        self.lbl_inst_brave = ctk.CTkLabel(
            self.tab_brave, 
            text="Extrai Tabelas E todo o texto visível da aba atual.\n"
                 "Certifique-se que o Brave esteja aberto na porta 9222.",
            font=("Arial", 14)
        )
        self.lbl_inst_brave.pack(pady=5)
        
        self.btn_extract_brave = ctk.CTkButton(self.tab_brave, text="Extrair Dados da Aba Atual", 
                                             command=self.extract_from_brave, height=45, font=("Arial", 14, "bold"))
        self.btn_extract_brave.pack(pady=20)

        # --- TAB VISION ---
        self.lbl_vision = ctk.CTkLabel(self.tab_vision, text="Extrair Informações via Visão Computacional", font=("Arial", 18, "bold"))
        self.lbl_vision.pack(pady=10)
        
        self.lbl_inst_vision = ctk.CTkLabel(
            self.tab_vision, 
            text="Este modo tira um print da sua tela atual e tenta ler todo o texto.\n"
                 "Útil para capturar dados que não são selecionáveis.",
            font=("Arial", 14)
        )
        self.lbl_inst_vision.pack(pady=5)

        self.btn_look_screen = ctk.CTkButton(self.tab_vision, text="Olhar para a Tela Agora", 
                                           command=self.extract_via_ocr, height=45, font=("Arial", 14, "bold"), fg_color="darkred")
        self.btn_look_screen.pack(pady=20)
        
        self.txt_ocr_preview = ctk.CTkTextbox(self.tab_vision, width=750, height=250)
        self.txt_ocr_preview.pack(pady=10)
        
        # --- TAB HTML ---
        self.lbl_html = ctk.CTkLabel(self.tab_html, text="Cole o Código HTML", font=("Arial", 16, "bold"))
        self.lbl_html.pack(pady=10)
        
        self.text_html = ctk.CTkTextbox(self.tab_html, width=750, height=350)
        self.text_html.pack(pady=10)
        
        self.btn_extract_html = ctk.CTkButton(self.tab_html, text="Processar HTML", command=self.extract_from_html, height=40)
        self.btn_extract_html.pack(pady=10)
        
        # --- PAINEL WEB ---
        import webbrowser
        self.btn_web = ctk.CTkButton(self, text="🌐 Abrir Painel Web no Navegador", 
                                     command=lambda: webbrowser.open("http://127.0.0.1:5000"),
                                     fg_color="transparent", border_width=1, text_color=("gray20", "gray80"))
        self.btn_web.pack(side="bottom", pady=(0, 5))

        # --- STATUS ---
        self.lbl_status = ctk.CTkLabel(self, text="Status: Pronto", text_color="gray", font=("Arial", 12))
        self.lbl_status.pack(side="bottom", pady=10)

    def save_data(self, data_dict, default_name="dados_extraidos.xlsx"):
        """Salva um dicionário de DataFrames em um arquivo Excel."""
        file_path = filedialog.asksaveasfilename(
            title="Salvar Planilha",
            defaultextension=".xlsx",
            filetypes=[("Excel files", "*.xlsx")],
            initialfile=default_name
        )
        
        if file_path:
            try:
                with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                    for sheet_name, df in data_dict.items():
                        if not df.empty:
                            df.to_excel(writer, sheet_name=sheet_name[:31], index=False)
                messagebox.showinfo("Sucesso", f"Dados salvos com sucesso em:\n{file_path}")
                self.lbl_status.configure(text=f"Salvo em {os.path.basename(file_path)}")
            except Exception as e:
                messagebox.showerror("Erro ao Salvar", f"Não foi possível salvar o arquivo: {e}")
        else:
            self.lbl_status.configure(text="Salvamento cancelado.")

    def process_content(self, html_content):
        """Processa HTML buscando tabelas e textos gerais."""
        data_to_save = {}
        
        # 1. Tentar Tabelas Estruturadas
        try:
            dfs = pd.read_html(html_content)
            for i, df in enumerate(dfs):
                df = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
                if not df.empty:
                    data_to_save[f"Tabela_{i+1}"] = df
        except Exception:
            pass
        
        # 2. Tentar Extrair todo o texto (Fallback ou Complemento)
        soup = BeautifulSoup(html_content, 'html.parser')
        text_lines = [line.strip() for line in soup.get_text(separator='\n').splitlines() if line.strip()]
        if text_lines:
            data_to_save["Texto_Geral"] = pd.DataFrame({"Informacao": text_lines})
            
        if not data_to_save:
            messagebox.showwarning("Aviso", "Nenhuma informação útil encontrada no conteúdo.")
            return

        self.save_data(data_to_save)

    def extract_from_html(self):
        html = self.text_html.get("1.0", tk.END).strip()
        if not html:
            messagebox.showwarning("Erro", "Cole o HTML primeiro.")
            return
        self.process_content(html)

    def extract_via_ocr(self):
        """Tira um print e usa OCR, enviando para a API local."""
        self.lbl_status.configure(text="Capturando tela em 2 segundos... Minimize esta janela!")
        self.update()
        time.sleep(2)
        
        try:
            screenshot = pyautogui.screenshot()
            text = pytesseract.image_to_string(screenshot, lang='por+eng')
            
            self.txt_ocr_preview.delete("1.0", tk.END)
            self.txt_ocr_preview.insert(tk.END, "----- TEXTO BRUTO LIDO (OCR) -----\n")
            self.txt_ocr_preview.insert(tk.END, text + "\n\n")
            
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            if not lines:
                messagebox.showwarning("OCR", "Nenhum texto foi detectado na imagem.")
                return

            self.lbl_status.configure(text="Processando no Parser Inteligente...")
            self.update()

            import urllib.request
            import json
            
            req = urllib.request.Request(
                "http://127.0.0.1:5000/extrair",
                data=json.dumps({"texto": text}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    
                self.txt_ocr_preview.insert(tk.END, "----- DADOS ESTRUTURADOS E SALVOS -----\n")
                if "dados" in res_data and res_data["dados"]:
                    for k, v in res_data["dados"].items():
                        self.txt_ocr_preview.insert(tk.END, f"{k.upper()}: {v}\n")
                    
                    encontrados = res_data.get('campos_encontrados', 0)
                    total = res_data.get('total_campos', 27)
                    self.txt_ocr_preview.insert(tk.END, f"\nSUCESSO: {encontrados}/{total} campos identificados!")
                    messagebox.showinfo("Sucesso OCR", f"OCR processado!\n{encontrados} campos extraídos da tela e salvos diretamente no banco de dados!")
                else:
                    self.txt_ocr_preview.insert(tk.END, "O Parser leu o texto da tela, mas não encontrou nenhum campo da ficha i-Educar.\n")
                    messagebox.showwarning("Aviso", "OCR concluído, mas a tela não parecia conter dados da ficha da escola.")
                    
            except Exception as e:
                self.txt_ocr_preview.insert(tk.END, f"❌ Erro ao enviar para o Parser Web: {e}\nOs dados brutos acima não foram estruturados.")
                messagebox.showerror("Erro de Conexão", f"O Servidor Web não respondeu.\n{e}")

        except Exception as e:
            messagebox.showerror("Erro OCR", f"Erro crítico na visão computacional: {e}\n\nCertifique-se que o Tesseract OCR está instalado no seu computador.")
        finally:
            self.lbl_status.configure(text="Pronto")

    def extract_from_brave(self):
        self.lbl_status.configure(text="Conectando ao Brave...")
        threading.Thread(target=self._run_brave_sync, daemon=True).start()

    def _run_brave_sync(self):
        try:
            with sync_playwright() as p:
                browser = p.chromium.connect_over_cdp("http://localhost:9222")
                page = browser.contexts[0].pages[0]
                page.wait_for_load_state("networkidle")
                html = page.content()
                browser.close()
            self.after(0, lambda: self.process_content(html))
        except Exception as e:
            self.after(0, lambda: messagebox.showerror("Erro Brave", f"Conexão falhou: {e}"))
        finally:
            self.after(0, lambda: self.lbl_status.configure(text="Pronto"))

if __name__ == "__main__":
    app = App()
    app.mainloop()

