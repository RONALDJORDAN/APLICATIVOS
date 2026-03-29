import customtkinter as ctk
import pandas as pd
from playwright.sync_api import sync_playwright
import threading
import time
import tkinter as tk
from tkinter import filedialog, messagebox

# Configuração Padrão do Tema
ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class AppRoboEscolas2(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Robô Extração Escolas 2 - Codaureo Vision")
        self.geometry("750x700")
        
        # === Painel e Componentes ===
        self.lbl_title = ctk.CTkLabel(self, text="🤖 Robô Extração Escolas 2", font=("Arial", 24, "bold"))
        self.lbl_title.pack(pady=20)
        
        self.lbl_info = ctk.CTkLabel(self, text="1. Clique em INICIAR para abrir o Chrome.\n2. Navegue até o i-Educar e abra a ficha da escola.\n3. O robô extrairá os dados automaticamente.", font=("Arial", 14), text_color="gray70")
        self.lbl_info.pack(pady=5)

        # Configurações de Acesso (Link, Login, Senha)
        self.frame_acesso = ctk.CTkFrame(self)
        self.frame_acesso.pack(pady=10, padx=20, fill="x")
        
        self.lbl_acesso = ctk.CTkLabel(self.frame_acesso, text="Credenciais de Acesso (Opcional):", font=("Arial", 14, "bold"))
        self.lbl_acesso.pack(pady=5)
        
        self.entry_link = ctk.CTkEntry(self.frame_acesso, placeholder_text="Link para acesso (ex: https://dominio.ieducar.com.br)", width=500)
        self.entry_link.pack(pady=5)
        
        self.frame_creds = ctk.CTkFrame(self.frame_acesso, fg_color="transparent")
        self.frame_creds.pack(pady=5)
        
        self.entry_login = ctk.CTkEntry(self.frame_creds, placeholder_text="Login / CPF", width=240)
        self.entry_login.grid(row=0, column=0, padx=10)
        
        self.entry_senha = ctk.CTkEntry(self.frame_creds, placeholder_text="Senha", show="*", width=240)
        self.entry_senha.grid(row=0, column=1, padx=10)

        # Botões
        self.frame_botoes = ctk.CTkFrame(self, fg_color="transparent")
        self.frame_botoes.pack(pady=15)

        self.btn_iniciar = ctk.CTkButton(self.frame_botoes, text="▶ INICIAR", font=("Arial", 16, "bold"), fg_color="green", hover_color="darkgreen", height=45, width=150, command=self.iniciar_extracao)
        self.btn_iniciar.grid(row=0, column=0, padx=10)

        self.btn_parar = ctk.CTkButton(self.frame_botoes, text="⏹ PARAR", font=("Arial", 16, "bold"), fg_color="darkred", hover_color="#600000", height=45, width=150, state="disabled", command=self.parar_extracao)
        self.btn_parar.grid(row=0, column=1, padx=10)

        self.btn_exportar = ctk.CTkButton(self.frame_botoes, text="📥 EXPORTAR PLANILHA", font=("Arial", 14, "bold"), fg_color="#1E90FF", hover_color="#0000CD", height=45, width=200, command=self.exportar_planilha)
        self.btn_exportar.grid(row=0, column=2, padx=10)

        # Log
        self.txt_log = ctk.CTkTextbox(self, width=650, height=220, font=("Consolas", 12))
        self.txt_log.pack(pady=10)
        
        self.status_var = ctk.StringVar(value="Status: Aguardando Ação...")
        self.lbl_status = ctk.CTkLabel(self, textvariable=self.status_var, font=("Arial", 12), text_color="gray")
        self.lbl_status.pack(side="bottom", pady=5)

        # Variáveis de Controle
        self.is_running = False
        self.dados_extraidos = []  # Lista de dicionários guardando dados de cada escola

        self._escrever_log("Sistema pronto. Clique em INICIAR para abrir o navegador.")

    def _escrever_log(self, texto):
        agora = time.strftime("%H:%M:%S")
        self.txt_log.insert(tk.END, f"[{agora}] {texto}\n")
        self.txt_log.see(tk.END)
        self.update()

    def iniciar_extracao(self):
        link = self.entry_link.get().strip()
        login = self.entry_login.get().strip()
        senha = self.entry_senha.get().strip()

        if (login or senha) and not link:
            messagebox.showwarning("Atenção", "Você inseriu login ou senha, mas não forneceu o link de acesso. Verifique para prosseguir.")
            return

        if link and not link.startswith("http"):
            self.entry_link.delete(0, "end")
            self.entry_link.insert(0, "https://" + link)

        if self.is_running: return
        self.is_running = True
        
        self.btn_iniciar.configure(state="disabled")
        self.btn_parar.configure(state="normal")
        self.status_var.set("Status: Robô Executando (Monitorando Tela)")
        
        self._escrever_log(">>> ROBÔ INICIADO! Abrindo o Google Chrome...")
        
        # Inicia a thread em background para nao travar a UI
        self.thread_extracao = threading.Thread(target=self._loop_playwright, daemon=True)
        self.thread_extracao.start()

    def parar_extracao(self):
        self.is_running = False
        self.btn_iniciar.configure(state="normal")
        self.btn_parar.configure(state="disabled")
        self.status_var.set("Status: Robô Parado")
        self._escrever_log(">>> ROBÔ PARADO PELO USUÁRIO.")

    def _loop_playwright(self):
        """Loop que abre o Chrome e fica escaneando a pagina ativa a cada 2 segundos"""
        try:
            with sync_playwright() as p:
                try:
                    # Lança o Chrome limpo, com a UI visível
                    browser = p.chromium.launch(headless=False, channel="chrome", args=["--start-maximized"])
                    context = browser.new_context(no_viewport=True)
                    page = context.new_page()
                    
                    # Recupera chaves diretamente da interface gráfica (via attributes da classe atualizados ou com thread-safe access)
                    link = self.entry_link.get().strip()
                    login = self.entry_login.get().strip()
                    senha = self.entry_senha.get().strip()
                    
                    if link:
                        self.after(0, lambda l=link: self._escrever_log(f"Acessando sistema: {l}"))
                        page.goto(link)
                        
                        if login and senha:
                            self.after(0, lambda: self._escrever_log("Preenchendo login/senha e aguardando..."))
                            try:
                                # Tenta achar os campos de usuario
                                page.wait_for_selector("input", timeout=10000)
                                
                                locators_usuario = ["input[name='login']", "input[type='email']", "input[id*='cpf']", "input[id*='usuario']", "input[name*='cpf']", "input[type='text']"]
                                locators_senha = ["input[type='password']", "input[name='senha']", "input[id*='senha']"]
                                
                                user_found = False
                                for loc in locators_usuario:
                                    if page.locator(loc).count() > 0:
                                        page.locator(loc).first.fill(login)
                                        user_found = True
                                        break
                                        
                                pass_found = False
                                for loc in locators_senha:
                                    if page.locator(loc).count() > 0:
                                        page.locator(loc).first.fill(senha)
                                        pass_found = True
                                        break
                                        
                                if user_found and pass_found:
                                    btn_login = page.locator("button[type='submit'], input[type='submit'], button:has-text('Entrar'), button:has-text('Login'), button:has-text('Acessar')").first
                                    if btn_login.count() > 0:
                                        btn_login.click()
                                    else:
                                        page.keyboard.press("Enter")
                                    self.after(0, lambda: self._escrever_log("Login submetido com sucesso!"))
                                else:
                                    self.after(0, lambda: self._escrever_log("Não foi possível encontrar os campos de login/senha na página."))
                                    
                            except Exception as elm_e:
                                self.after(0, lambda e=elm_e: self._escrever_log(f"Falha na tentativa de login automático: {e}"))
                                
                    self.after(0, lambda: self._escrever_log("Navegador pronto! Pode navegar normalmente e abrir as fichas das escolas."))
                except Exception as e:
                    self.after(0, lambda e=e: self._escrever_log(f"❌ ERRO GRAVE: Não consegui abrir o Chrome nativamente. ({str(e)})"))
                    self.after(0, lambda: self._escrever_log("O Google Chrome está instalado na sua máquina?"))
                    self.after(0, self.parar_extracao)
                    return

                # Loop de Captura Constante
                escolas_ja_vistas = set()

                while self.is_running:
                    try:
                        # Se fechar o navegador, o script sai
                        if len(context.pages) == 0:
                            self.after(0, lambda: self._escrever_log("Navegador foi fechado. Parando robô."))
                            self.after(0, self.parar_extracao)
                            break
                            
                        aba_ativa = context.pages[0] # Pega a primeria aba
                        
                        # Extrai informações da tela 
                        dados_tela = self._analisar_dom_ieducar(aba_ativa)
                        
                        nome_escola = dados_tela.get("Escola", "")
                        inep = dados_tela.get("Código INEP", "")
                        cnpj = dados_tela.get("CNPJ", "")

                        chave_unica = inep if inep else (nome_escola + cnpj)

                        if chave_unica and chave_unica not in escolas_ja_vistas and nome_escola:
                            # Nova escola detectada!
                            escolas_ja_vistas.add(chave_unica)
                            self.dados_extraidos.append(dados_tela)
                            self.after(0, lambda d=nome_escola: self._escrever_log(f"✅ DETECTADO e EXTRAÍDO: {d}"))
                        
                    except Exception as e:
                        # Se houver erro de parsing (página recarregou, etc), silencia e tenta na próxima
                        pass
                    
                    time.sleep(2) # Dorme 2 segundos antes de escanear novamente a tela

                # Ao sair do loop
                browser.close()
        except Exception as e:
            self.after(0, lambda e=e: self._escrever_log(f"Erro no Playwright Worker: {e}"))
            self.after(0, self.parar_extracao)

    def _analisar_dom_ieducar(self, page):
        """
        Injeta código JS na página para varrer o DOM atrás das informações vitais.
        Retorna um dicionário.
        """
        
        codigo_js = """
        () => {
            let info = {};
            
            // 1. Procurar todos os Labels
            let labels = Array.from(document.querySelectorAll('label, div.label, span.label-text, th'));
            
            labels.forEach(lbl => {
                let text = (lbl.innerText || lbl.textContent || "").trim();
                text = text.replace(/\\*|:|\\n/g, '').trim(); // Limpa asteriscos e dois pontos
                
                if (!text) return;

                // Tentar encontrar o input que pertence a essa label (by ID)
                let inputElement = null;
                
                // Se a label tiver 'for'
                if (lbl.getAttribute('for')) {
                    inputElement = document.getElementById(lbl.getAttribute('for'));
                }
                
                // Procurar por input/select/textarea proximo se não encontrou by ID
                if (!inputElement) {
                    let parent = lbl.parentElement;
                    if (parent) {
                        inputElement = parent.querySelector('input, select, textarea');
                        if (!inputElement && parent.nextElementSibling) {
                            inputElement = parent.nextElementSibling.querySelector('input, select, textarea, div.form-control, span');
                        }
                    }
                }

                // Se achou o elemento correspondente, pegar o valor dele
                if (inputElement) {
                    let val = "";
                    if (inputElement.tagName === 'SELECT') {
                        let selectedOption = inputElement.options[inputElement.selectedIndex];
                        if (selectedOption) val = selectedOption.text;
                    } else if (inputElement.value !== undefined) {
                        val = inputElement.value;
                    } else {
                        val = inputElement.innerText || inputElement.textContent;
                    }
                    
                    if (val) {
                        info[text.toLowerCase()] = val.trim();
                    }
                }
            });

            // Fallback: busca bruta nos inputs e pega placeholder se houver
            let allInputs = document.querySelectorAll('input, textarea, select');
            allInputs.forEach(inp => {
                let ph = inp.getAttribute('placeholder');
                if (ph) {
                    let phClean = ph.replace(/\\*|:/g, '').trim().toLowerCase();
                    if (!info[phClean] && inp.value) {
                        info[phClean] = inp.value.trim();
                    }
                }
            });

            return info;
        }
        """
        
        # Pede pro navegador executar o script acima
        dados_brutos = page.evaluate(codigo_js)
        
        # Mapeia as chaves brutas retornadas (lowercase) para as colunas finais
        mapeamento = {
            "código inep": "Código INEP",
            "codigo inep": "Código INEP",
            "cnpj": "CNPJ",
            "cnpj polo": "CNPJ Polo",
            "escola": "Escola",
            "nome da escola": "Escola",
            "sigla": "Sigla",
            "instituição": "Instituição",
            "instituicao": "Instituição",
            "rede ensino": "Rede Ensino",
            "zona localização": "Zona localização",
            "zona localizacao": "Zona localização",
            "cep": "CEP",
            "endereço": "Endereço",
            "endereco": "Endereço",
            "número": "Número",
            "numero": "Número",
            "complemento": "Complemento",
            "bairro": "Bairro",
            "município": "Município",
            "municipio": "Município",
            "distrito": "Distrito"
        }
        
        dados_finais = {}
        for chave_bruta, valor in dados_brutos.items():
            for map_chave, map_valor in mapeamento.items():
                if map_chave == chave_bruta: # Match exato
                    if not dados_finais.get(map_valor):
                        dados_finais[map_valor] = valor
                elif map_chave in chave_bruta and len(chave_bruta) <= len(map_chave) + 2:
                    # Match parcial apenas se for muito parecido (ex: "cnpj:" e "cnpj")
                    if not dados_finais.get(map_valor):
                        dados_finais[map_valor] = valor
                        
        return dados_finais

    def exportar_planilha(self):
        if not self.dados_extraidos:
            messagebox.showwarning("Nenhum dado", "O robô ainda não extraiu dados de nenhuma escola.")
            return

        # Garante que tem todas as colunas mesmo que ausentem na 1a escola
        colunas_padrao = [
            "Código INEP", "CNPJ", "CNPJ Polo", "Escola", "Sigla",
            "Instituição", "Rede Ensino", "Zona localização",
            "CEP", "Endereço", "Número", "Complemento",
            "Bairro", "Município", "Distrito"
        ]
        
        df = pd.DataFrame(self.dados_extraidos, columns=colunas_padrao)

        filepath = filedialog.asksaveasfilename(
            title="Salvar como Excel",
            defaultextension=".xlsx",
            filetypes=[("Excel Files", "*.xlsx")],
            initialfile="escolas_extraidas_ieducar.xlsx"
        )
        
        if filepath:
            try:
                # Preencher NA com string vazia
                df.fillna("", inplace=True)
                df.to_excel(filepath, index=False)
                
                self._escrever_log(f"💾 SUCESSO! {len(self.dados_extraidos)} escolas exportadas para:")
                self._escrever_log(filepath)
                messagebox.showinfo("Sucesso", f"Planilha gerada com sucesso!\n{len(self.dados_extraidos)} escolas extraídas.")
            except Exception as e:
                self._escrever_log(f"❌ Erro ao salvar planilha: {e}")
                messagebox.showerror("Erro", f"Ocorreu um erro ao salvar o arquivo.\n{e}")

if __name__ == "__main__":
    app = AppRoboEscolas2()
    app.mainloop()
