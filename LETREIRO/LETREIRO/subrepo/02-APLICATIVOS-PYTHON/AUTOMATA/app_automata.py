import os
import json
import threading
import time
import tkinter as tk
from tkinter import filedialog, messagebox

import customtkinter as ctk
from pynput import keyboard

# Using absolute import or relative import based on directory structure
from recorder import ActionRecorder, ActionPlayer
from smart_sync import SmartSync

# Configuração Padrão do Tema
ctk.set_appearance_mode("System")
ctk.set_default_color_theme("blue")

class AppAutomata(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Automata - Automação de Telas")
        self.geometry("650x700")

        # Instances (Classic Macro)
        self.recorder = ActionRecorder()
        self.player = ActionPlayer()
        self.current_macro_actions = []
        self.macro_file_path = None
        
        # Instances (Smart Sync)
        self.smart_sync = SmartSync(log_callback=self._escrever_log)

        # Hotkeys listener (runs in background)
        self.hotkey_listener = keyboard.GlobalHotKeys({
            '<f9>': self.toggle_recording,
            '<f10>': self.toggle_playback,
            '<f11>': self.run_smart_sync
        })
        self.hotkey_listener.start()

        self._build_ui()
        self._escrever_log("Sistema pronto.")
        self._escrever_log(">> F9: Gravar/Parar | F10: Reproduzir Macro | F11: Sincronizar Abas")

    def _build_ui(self):
        # === Painel e Componentes ===
        self.lbl_title = ctk.CTkLabel(self, text="🤖 Automata: Robô Assistente", font=("Arial", 24, "bold"))
        self.lbl_title.pack(pady=10)

        # Tabs
        self.tabview = ctk.CTkTabview(self, width=600, height=350)
        self.tabview.pack(pady=5, padx=20, fill="both", expand=True)
        
        self.tab_sync = self.tabview.add("Sincronização Inteligente")
        self.tab_macro = self.tabview.add("Gravador de Macros")
        
        # ==========================================
        # TAB 1: SMART SYNC
        # ==========================================
        self.lbl_sync_title = ctk.CTkLabel(self.tab_sync, text="Auto-Preenchimento (i-Educar ➡️ Innovplay)", font=("Arial", 16, "bold"))
        self.lbl_sync_title.pack(pady=10)
        
        info_text = (
            "1. Abra o navegador Brave pela porta de desenvolvedor (9222).\n"
            "2. Deixe uma aba no i-Educar e outra na tela de \nCadastro de Escola do Innovplay.\n"
            "3. Clique no botão abaixo ou pressione F11 para preencher."
        )
        self.lbl_sync_info = ctk.CTkLabel(self.tab_sync, text=info_text, font=("Arial", 14), text_color="gray70", justify="left")
        self.lbl_sync_info.pack(pady=15)
        
        self.btn_sync = ctk.CTkButton(self.tab_sync, text="🔄 SINCRONIZAR AGORA (F11)", font=("Arial", 16, "bold"), fg_color="#1E90FF", hover_color="#0000CD", height=50, width=300, command=self.run_smart_sync)
        self.btn_sync.pack(pady=20)
        
        # ==========================================
        # TAB 2: MACRO RECORDER
        # ==========================================
        self.lbl_info = ctk.CTkLabel(self.tab_macro, text="Atalhos:\n[F9] Iniciar/Parar Gravação\n[F10] Iniciar/Parar Reprodução", font=("Arial", 14), text_color="gray70")
        self.lbl_info.pack(pady=5)

        # Status
        self.status_var = ctk.StringVar(value="Status: Ocioso")
        self.lbl_status = ctk.CTkLabel(self.tab_macro, textvariable=self.status_var, font=("Arial", 16, "bold"), text_color="green")
        self.lbl_status.pack(pady=10)

        self.actions_count_var = ctk.StringVar(value="Ações na memória: 0")
        self.lbl_actions = ctk.CTkLabel(self.tab_macro, textvariable=self.actions_count_var, font=("Arial", 12))
        self.lbl_actions.pack(pady=5)

        # Botões Principais
        self.frame_botoes = ctk.CTkFrame(self.tab_macro, fg_color="transparent")
        self.frame_botoes.pack(pady=10)

        self.btn_gravar = ctk.CTkButton(self.frame_botoes, text="⏺ GRAVAR (F9)", font=("Arial", 14, "bold"), fg_color="darkred", hover_color="#800000", height=40, width=150, command=self.toggle_recording)
        self.btn_gravar.grid(row=0, column=0, padx=5, pady=5)

        self.btn_reproduzir = ctk.CTkButton(self.frame_botoes, text="▶ REPRODUZIR (F10)", font=("Arial", 14, "bold"), fg_color="green", hover_color="darkgreen", height=40, width=150, command=self.toggle_playback)
        self.btn_reproduzir.grid(row=0, column=1, padx=5, pady=5)

        # Botões de Arquivo
        self.frame_arquivo = ctk.CTkFrame(self.tab_macro, fg_color="transparent")
        self.frame_arquivo.pack(pady=5)

        self.btn_salvar = ctk.CTkButton(self.frame_arquivo, text="💾 SALVAR", font=("Arial", 12, "bold"), fg_color="#4682B4", hover_color="#4169E1", height=30, width=100, command=self.salvar_macro)
        self.btn_salvar.grid(row=0, column=0, padx=5)

        self.btn_carregar = ctk.CTkButton(self.frame_arquivo, text="📂 CARREGAR", font=("Arial", 12, "bold"), fg_color="#FF8C00", hover_color="#B8860B", height=30, width=100, command=self.carregar_macro)
        self.btn_carregar.grid(row=0, column=1, padx=5)
        
        self.btn_limpar = ctk.CTkButton(self.frame_arquivo, text="🗑 LIMPAR", font=("Arial", 12, "bold"), fg_color="gray", hover_color="darkgray", height=30, width=100, command=self.limpar_macro)
        self.btn_limpar.grid(row=0, column=2, padx=5)

        # Configurações de Reprodução
        self.frame_config = ctk.CTkFrame(self.tab_macro)
        self.frame_config.pack(pady=10, padx=10, fill="x")

        self.lbl_velocidade = ctk.CTkLabel(self.frame_config, text="Velocidade:", font=("Arial", 12))
        self.lbl_velocidade.grid(row=0, column=0, padx=5, pady=5)

        self.slider_velocidade = ctk.CTkSlider(self.frame_config, from_=0.1, to=5.0, number_of_steps=49, command=self._update_speed_label)
        self.slider_velocidade.set(1.0)
        self.slider_velocidade.grid(row=0, column=1, padx=5, pady=5)

        self.lbl_velocidade_val = ctk.CTkLabel(self.frame_config, text="1.0x", font=("Arial", 12, "bold"))
        self.lbl_velocidade_val.grid(row=0, column=2, padx=5, pady=5)

        # ==========================================
        # LOG GLOBAL
        # ==========================================
        self.txt_log = ctk.CTkTextbox(self, width=580, height=150, font=("Consolas", 12))
        self.txt_log.pack(pady=10, padx=20)

    # ... (Smart Sync Methods) ...
    def run_smart_sync(self):
        self.tabview.set("Sincronização Inteligente") # Focus tab
        self.btn_sync.configure(state="disabled", text="⏳ SINCRONIZANDO...")
        
        def _thread_sync():
            self._escrever_log(">>> INICIANDO SINCRONIZAÇÃO INTELIGENTE")
            self.smart_sync.execute_sync()
            self.after(0, lambda: self.btn_sync.configure(state="normal", text="🔄 SINCRONIZAR AGORA (F11)"))
            
        threading.Thread(target=_thread_sync, daemon=True).start()

    # ... (Macro Methods) ...
    def _update_speed_label(self, value):
        self.lbl_velocidade_val.configure(text=f"{value:.1f}x")

    def _escrever_log(self, texto):
        agora = time.strftime("%H:%M:%S")
        self.txt_log.insert(tk.END, f"[{agora}] {texto}\n")
        self.txt_log.see(tk.END)
        self.update()
        
    def _update_ui_state(self):
        if self.recorder.is_recording:
            self.status_var.set("Status: GRAVANDO 🔴")
            self.lbl_status.configure(text_color="red")
            self.btn_gravar.configure(text="⏹ PARAR (F9)")
            self.btn_reproduzir.configure(state="disabled")
            self.btn_salvar.configure(state="disabled")
            self.btn_carregar.configure(state="disabled")
            self.btn_limpar.configure(state="disabled")
        elif self.player.is_playing:
            self.status_var.set("Status: REPRODUZINDO ▶")
            self.lbl_status.configure(text_color="green")
            self.btn_reproduzir.configure(text="⏹ PARAR (F10)")
            self.btn_gravar.configure(state="disabled")
            self.btn_salvar.configure(state="disabled")
            self.btn_carregar.configure(state="disabled")
            self.btn_limpar.configure(state="disabled")
        else:
            self.status_var.set("Status: Ocioso")
            self.lbl_status.configure(text_color="gray")
            self.btn_gravar.configure(text="⏺ GRAVAR (F9)", state="normal")
            self.btn_reproduzir.configure(text="▶ REPRODUZIR (F10)", state="normal" if self.current_macro_actions else "disabled")
            self.btn_salvar.configure(state="normal" if self.current_macro_actions else "disabled")
            self.btn_carregar.configure(state="normal")
            self.btn_limpar.configure(state="normal" if self.current_macro_actions else "disabled")
            
            # Atualiza contador
            self.actions_count_var.set(f"Ações na memória: {len(self.current_macro_actions)}")

    def toggle_recording(self):
        self.tabview.set("Gravador de Macros") # Focus tab
        
        if self.player.is_playing:
            return 
            
        if self.recorder.is_recording:
            self.recorder.stop_recording()
            
            actions = self.recorder.actions
            filtered_actions = []
            for i in range(len(actions)):
                action = actions[i]
                is_f9 = action['type'] in ['keyboard_press', 'keyboard_release'] and action['key'] == 'Key.f9'
                if not is_f9:
                    filtered_actions.append(action)
                    
            self.current_macro_actions = filtered_actions
            self._escrever_log(f"Gravação concluída. {len(self.current_macro_actions)} ações capturadas.")
        else:
            self.current_macro_actions = []
            self.recorder.start_recording()
            self._escrever_log("Gravação INICIADA! Realize os cliques e digitações agora.")
            
        self.after(0, self._update_ui_state)

    def toggle_playback(self):
        self.tabview.set("Gravador de Macros") # Focus tab
        
        if self.recorder.is_recording:
            return 
            
        if self.player.is_playing:
            self.player.is_playing = False 
            self._escrever_log("Parando reprodução...")
            self.after(0, self._update_ui_state)
        else:
            if not self.current_macro_actions:
                self._escrever_log("Nenhuma macro carregada na memória.")
                return
                
            speed = self.slider_velocidade.get()
            self._escrever_log(f"Iniciando reprodução ({speed:.1f}x)...")
            
            def on_playback_complete():
                self.after(0, lambda: self._escrever_log("Reprodução finalizada com sucesso!"))
                self.after(0, self._update_ui_state)
                
            self.player.play_actions(self.current_macro_actions, speed_multiplier=speed, callback=on_playback_complete)
            self.after(0, self._update_ui_state)

    def salvar_macro(self):
        if not self.current_macro_actions:
            messagebox.showwarning("Aviso", "Não há ações gravadas para salvar.")
            return

        filepath = filedialog.asksaveasfilename(
            title="Salvar Macro",
            defaultextension=".json",
            filetypes=[("Arquivos JSON", "*.json")],
            initialfile="macro_automata.json"
        )
        
        if filepath:
            try:
                with open(filepath, 'w') as f:
                    json.dump(self.current_macro_actions, f, indent=4)
                self.macro_file_path = filepath
                self._escrever_log(f"Macro salva em: {os.path.basename(filepath)}")
            except Exception as e:
                self._escrever_log(f"Erro ao salvar macro: {e}")
                messagebox.showerror("Erro", f"Não foi possível salvar:\\n{e}")

    def carregar_macro(self):
        filepath = filedialog.askopenfilename(
            title="Carregar Macro",
            filetypes=[("Arquivos JSON", "*.json")]
        )
        
        if filepath:
            try:
                with open(filepath, 'r') as f:
                    actions = json.load(f)
                    
                if not isinstance(actions, list):
                    raise ValueError("Formato de arquivo inválido.")
                    
                self.current_macro_actions = actions
                self.macro_file_path = filepath
                self._escrever_log(f"Macro carregada! ({len(actions)} ações)")
                self._update_ui_state()
            except Exception as e:
                self._escrever_log(f"Erro ao carregar macro: {e}")
                messagebox.showerror("Erro", f"Não foi possível carregar:\\n{e}")

    def limpar_macro(self):
        if messagebox.askyesno("Confirmar", "Tem certeza que deseja limpar a macro atual?"):
            self.current_macro_actions = []
            self.macro_file_path = None
            self._escrever_log("Memória limpa.")
            self._update_ui_state()

    def on_closing(self):
        self.hotkey_listener.stop()
        self.recorder.stop_recording()
        self.player.is_playing = False
        self.destroy()

if __name__ == "__main__":
    app = AppAutomata()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()
