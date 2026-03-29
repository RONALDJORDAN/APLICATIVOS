import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk
import pandas as pd
import os

# Configuração de aparência
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class ExcelExtractorApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("CodAureo - Extrator de Dados Excel")
        self.geometry("1000x700")

        self.df = None
        self.file_path = None
        self.column_vars = {}

        # Grid layout
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar_frame = ctk.CTkFrame(self, width=200, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, rowspan=4, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(6, weight=1)

        self.logo_label = ctk.CTkLabel(self.sidebar_frame, text="CodAureo", font=ctk.CTkFont(size=20, weight="bold"))
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 10))

        self.select_button = ctk.CTkButton(self.sidebar_frame, text="Selecionar Arquivo", command=self.select_file)
        self.select_button.grid(row=1, column=0, padx=20, pady=10)

        self.status_label = ctk.CTkLabel(self.sidebar_frame, text="Nenhum arquivo", font=ctk.CTkFont(size=12), wraplength=160)
        self.status_label.grid(row=2, column=0, padx=20, pady=10)

        self.sep = ctk.CTkLabel(self.sidebar_frame, text="--- Colunas para Duplicatas ---", font=ctk.CTkFont(size=10))
        self.sep.grid(row=3, column=0, padx=20, pady=(10, 0))

        # Scrollable frame for columns
        self.columns_frame = ctk.CTkScrollableFrame(self.sidebar_frame, height=200)
        self.columns_frame.grid(row=4, column=0, padx=20, pady=10, sticky="nsew")

        self.extract_button = ctk.CTkButton(self.sidebar_frame, text="Extrair e Limpar", command=self.process_data, state="disabled", fg_color="green", hover_color="darkgreen")
        self.extract_button.grid(row=5, column=0, padx=20, pady=10)

        # Main Content Area
        self.main_frame = ctk.CTkFrame(self, corner_radius=10)
        self.main_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        self.main_frame.grid_rowconfigure(1, weight=1)
        self.main_frame.grid_columnconfigure(0, weight=1)

        self.header_label = ctk.CTkLabel(self.main_frame, text="Visualização de Dados (Primeiras 50 linhas)", font=ctk.CTkFont(size=16, weight="bold"))
        self.header_label.grid(row=0, column=0, padx=20, pady=10)

        # Text area for preview
        self.preview_text = ctk.CTkTextbox(self.main_frame, font=ctk.CTkFont(family="Courier", size=12))
        self.preview_text.grid(row=1, column=0, padx=20, pady=10, sticky="nsew")

    def select_file(self):
        filetypes = (
            ('Arquivos Excel', '*.xlsx *.xls'),
            ('Arquivos CSV', '*.csv'),
            ('Todos os arquivos', '*.*')
        )
        self.file_path = filedialog.askopenfilename(title='Selecione o arquivo', filetypes=filetypes)
        
        if self.file_path:
            try:
                if self.file_path.endswith('.csv'):
                    self.df = pd.read_csv(self.file_path)
                else:
                    self.df = pd.read_excel(self.file_path)
                
                self.status_label.configure(text=f"Arquivo: {os.path.basename(self.file_path)}")
                self.extract_button.configure(state="normal")
                
                # Setup column checkboxes
                for widget in self.columns_frame.winfo_children():
                    widget.destroy()
                
                self.column_vars = {}
                for col in self.df.columns:
                    var = tk.BooleanVar(value=True)
                    self.column_vars[col] = var
                    cb = ctk.CTkCheckBox(self.columns_frame, text=col, variable=var)
                    cb.pack(fill="x", padx=5, pady=2)
                
                # Update preview
                self.preview_text.delete("1.0", tk.END)
                self.preview_text.insert(tk.END, self.df.head(50).to_string())
                
            except Exception as e:
                messagebox.showerror("Erro", f"Não foi possível ler o arquivo: {e}")

    def process_data(self):
        if self.df is not None:
            # Pegar colunas selecionadas
            selected_columns = [col for col, var in self.column_vars.items() if var.get()]
            
            if not selected_columns:
                messagebox.showwarning("Aviso", "Selecione pelo menos uma coluna para verificar duplicatas.")
                return

            try:
                initial_count = len(self.df)
                # Remove duplicates based on selected columns
                cleaned_df = self.df.drop_duplicates(subset=selected_columns)
                final_count = len(cleaned_df)
                
                removed_count = initial_count - final_count
                
                # Save to new file
                save_path = filedialog.asksaveasfilename(
                    defaultextension=".xlsx",
                    filetypes=[("Excel files", "*.xlsx")],
                    initialfile=f"LIMPADO_{os.path.basename(self.file_path).split('.')[0]}.xlsx"
                )
                
                if save_path:
                    cleaned_df.to_excel(save_path, index=False)
                    messagebox.showinfo("Sucesso", f"Processamento concluído!\n\nTotal inicial: {initial_count}\nRemovidos: {removed_count}\nRestantes: {final_count}\n\nArquivo salvo em:\n{save_path}")
            
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao processar dados: {e}")

if __name__ == "__main__":
    app = ExcelExtractorApp()
    app.mainloop()
