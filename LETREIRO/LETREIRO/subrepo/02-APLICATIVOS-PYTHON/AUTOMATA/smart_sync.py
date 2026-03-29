import time
from playwright.sync_api import sync_playwright

class SmartSync:
    def __init__(self, log_callback=print):
        self.log = log_callback
        self.port = 9222
        
    def execute_sync(self):
        self.log("Conectando ao navegador na porta 9222...")
        try:
            with sync_playwright() as p:
                try:
                    browser = p.chromium.connect_over_cdp(f"http://localhost:{self.port}")
                except Exception as e:
                    self.log(f"Erro de conexão. O Brave está aberto com --remote-debugging-port={self.port}?")
                    return False
                    
                context = browser.contexts[0]
                
                # Identificar as duas abas necessárias
                aba_origem = None
                aba_destino = None
                
                self.log(f"Analisando {len(context.pages)} abas abertas...")
                for page in context.pages:
                    url = page.url.lower()
                    title = page.title().lower()
                    
                    # Heurística para achar o i-Educar (origem)
                    if "yantec" in url or "ieducar" in url or "escola" in title:
                        if not aba_origem or "cad" in url: # Prefere a tela de cadastro/detalhes
                            aba_origem = page
                            
                    # Heurística para achar o Innovplay (destino)
                    if "innovplay" in url or "cadastrar escola" in title:
                        aba_destino = page
                        
                if not aba_origem:
                    self.log("❌ Não encontrei a aba do i-Educar (Origem).")
                    browser.close()
                    return False
                    
                if not aba_destino:
                    self.log("❌ Não encontrei a aba do Innovplay (Destino).")
                    browser.close()
                    return False
                    
                self.log(f"✅ Origem: {aba_origem.title()[:30]}...")
                self.log(f"✅ Destino: {aba_destino.title()[:30]}...")
                
                # 1. Extrair Dados da Origem (i-Educar)
                self.log("Extraindo dados...")
                dados = self._extrair_dados_ieducar(aba_origem)
                
                if not dados:
                    self.log("Aviso: Nenhum dado extraído da aba de origem.")
                    
                # Mostra o que achou
                for k, v in dados.items():
                    self.log(f"  - {k}: {v}")
                    
                # 2. Injetar Dados no Destino (Innovplay)
                self.log("Preenchendo formulário no Innovplay...")
                sucesso = self._preencher_innovplay(aba_destino, dados)
                
                if sucesso:
                    self.log("✅ Sincronização concluída com sucesso!")
                else:
                    self.log("Aviso: Falha ao preencher alguns campos.")
                    
                browser.close()
                return True
                
        except Exception as e:
            self.log(f"Erro inesperado durante a sincronização: {str(e)}")
            return False

    def _extrair_dados_ieducar(self, page):
        """Usa a mesma lógica robusta do robô anterior para ler o DOM do i-Educar"""
        js_code = """
        () => {
            let info = {};
            let labels = Array.from(document.querySelectorAll('label, div.label, span.label-text, th, td.label'));
            
            labels.forEach(lbl => {
                let text = (lbl.innerText || lbl.textContent || "").trim();
                text = text.replace(/\\*|:|\\n/g, '').trim(); 
                
                if (!text) return;

                let inputElement = null;
                
                // Procurar "following-sibling" ou dentro do parent
                let parent = lbl.parentElement;
                if (parent) {
                    inputElement = parent.querySelector('input, select, textarea');
                    if (!inputElement && parent.nextElementSibling) {
                        inputElement = parent.nextElementSibling.querySelector('input, select, textarea, div.form-control, span');
                        if (!inputElement) {
                            // As vezes o texto ta direto na div
                            let textContent = parent.nextElementSibling.innerText || "";
                            if (textContent.trim()) {
                                info[text.toLowerCase()] = textContent.trim();
                                return;
                            }
                        }
                    }
                }

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

            // Fallback para td adjuntos (Tabelas)
            let tds = Array.from(document.querySelectorAll('td'));
            for(let i=0; i < tds.length - 1; i++) {
                let td = tds[i];
                if (td.className.includes('label') || td.style.fontWeight === 'bold' || td.querySelector('b')) {
                    let key = (td.innerText || "").replace(/\\*|:|\\n/g, '').trim().toLowerCase();
                    let val = (tds[i+1].innerText || "").trim();
                    if (key && val && !info[key]) {
                        info[key] = val;
                    }
                }
            }

            return info;
        }
        """
        dados_brutos = page.evaluate(js_code)
        
        # Mapear para dicionário limpo
        dados_limpos = {}
        mapeamento = {
            "código inep": "inep", "codigo inep": "inep", "cod. inep": "inep",
            "cnpj": "cnpj", 
            "escola": "nome", "nome da escola": "nome",
            "instituição": "instituicao", "instituicao": "instituicao",
            "cep": "cep",
            "endereço": "endereco", "endereco": "endereco",
            "número": "numero", "numero": "numero",
            "bairro": "bairro",
            "município": "municipio", "municipio": "municipio",
            "telefone": "telefone", "celular": "celular"
        }
        
        for k_bruto, valor in dados_brutos.items():
            for map_k, limpo_k in mapeamento.items():
                if map_k in k_bruto:
                    if limpo_k not in dados_limpos or not dados_limpos[limpo_k]:
                        dados_limpos[limpo_k] = valor
                        
        return dados_limpos

    def _preencher_innovplay(self, page, dados):
        """Injeta os valores extraidos no formulário do Innovplay comparando Labels"""
        js_inject = """
        (dados) => {
            let inputsPreenchidos = 0;
            // Pega todos os text fields e textareas
            let allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea'));
            
            allInputs.forEach(inp => {
                // Tenta descobrir o "nome" do campo baseado no placeholder, id, name ou label próxima
                let fieldName = (inp.getAttribute('placeholder') || 
                               inp.getAttribute('name') || 
                               inp.getAttribute('id') || "").toLowerCase();
                               
                // Tenta achar a Label acima dele
                let previousText = "";
                let prevElement = inp.previousElementSibling;
                while(prevElement) {
                    if (prevElement.innerText) {
                        previousText += " " + prevElement.innerText.toLowerCase();
                    }
                    prevElement = prevElement.previousElementSibling;
                }
                
                // Se estiver dentro de uma div com label
                let parentText = (inp.parentElement.innerText || "").toLowerCase();
                
                let searchSpace = fieldName + " " + previousText + " " + parentText;
                
                // Logica de match
                let valorParaPreencher = null;
                
                if (searchSpace.includes("institu")) {
                    valorParaPreencher = dados["instituicao"];
                } else if (searchSpace.includes("cnpj")) {
                    valorParaPreencher = dados["cnpj"];
                } else if (searchSpace.includes("inep")) {
                    valorParaPreencher = dados["inep"];
                } else if (searchSpace.includes("nome") || searchSpace.includes("escola")) {
                    // Cuidado pra não sobrescrever os de cima se tiver "nome da instituicao"
                    if (!searchSpace.includes("institu")) {
                        valorParaPreencher = dados["nome"];
                    }
                } else if (searchSpace.includes("cep")) {
                    valorParaPreencher = dados["cep"];
                } else if (searchSpace.includes("endere") || searchSpace.includes("rua")) {
                    valorParaPreencher = dados["endereco"];
                } else if (searchSpace.includes("num") || searchSpace.includes("nº") || searchSpace.includes("núm")) {
                    valorParaPreencher = dados["numero"];
                } else if (searchSpace.includes("bairr")) {
                    valorParaPreencher = dados["bairro"];
                } else if (searchSpace.includes("munic") || searchSpace.includes("cidad")) {
                    valorParaPreencher = dados["municipio"];
                } else if (searchSpace.includes("tel") || searchSpace.includes("celul")) {
                    valorParaPreencher = dados["telefone"] || dados["celular"];
                }
                
                if (valorParaPreencher) {
                    // Preenche via React/Vue simulação
                    let lastValue = inp.value;
                    inp.value = valorParaPreencher;
                    let event = new Event('input', { bubbles: true });
                    // Hack para React
                    let tracker = inp._valueTracker;
                    if (tracker) {
                        tracker.setValue(lastValue);
                    }
                    inp.dispatchEvent(event);
                    inp.dispatchEvent(new Event('change', { bubbles: true }));
                    inputsPreenchidos++;
                }
            });
            
            return inputsPreenchidos > 0;
        }
        """
        resultado = page.evaluate(js_inject, dados)
        return resultado
