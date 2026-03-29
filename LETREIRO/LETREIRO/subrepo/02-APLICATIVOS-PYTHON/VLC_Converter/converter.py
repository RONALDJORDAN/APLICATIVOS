import os
import sys
import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter.ttk import Progressbar, Style
import threading
# Try importing moviepy (Logic handles v1.x and v2.x)
try:
    # Try v2.0+ approach first
    from moviepy import VideoFileClip, AudioFileClip
except ImportError:
    try:
        # Fallback to v1.x approach
        from moviepy.editor import VideoFileClip, AudioFileClip
    except ImportError:
        pass



class ConverterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Conversor de Vídeo para MP3")
        self.root.geometry("600x500")
        self.root.configure(bg="#f0f2f5")

        self.style = Style()
        self.style.theme_use('clam')
        
        # Colors
        self.primary_color = "#4a90e2"
        self.secondary_color = "#ffffff"
        self.text_color = "#333333"

        # State
        self.files_to_convert = []
        self.output_folder = None # None means same folder as video

        # Check dependency
        if 'moviepy' not in sys.modules:
            messagebox.showerror("Erro de Dependência", "A biblioteca 'moviepy' não foi encontrada.\nPor favor, instale-a usando:\npip install moviepy")
            # We don't exit hard here to allow the UI to show, but functionality will be limited
        
        # Layout
        self.create_widgets()

    def create_widgets(self):
        # Header
        header_frame = tk.Frame(self.root, bg=self.primary_color, height=80)
        header_frame.pack(fill=tk.X)
        
        title_label = tk.Label(
            header_frame, 
            text="Conversor de Mídia para MP3", 
            font=("Segoe UI", 18, "bold"), 
            bg=self.primary_color, 
            fg="white"
        )
        title_label.pack(pady=20)

        # Main Content Container
        container = tk.Frame(self.root, bg="#f0f2f5")
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Instructions
        tk.Label(
            container, 
            text="Selecione os arquivos de mídia (vídeo ou áudio) para converter em MP3.", 
            font=("Segoe UI", 11), 
            bg="#f0f2f5", 
            fg="#555555"
        ).pack(anchor="w", pady=(0, 10))
        
        # File List Area
        list_frame = tk.Frame(container, bg="white", relief=tk.SOLID, bd=1)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        self.file_listbox = tk.Listbox(
            list_frame, 
            selectmode=tk.EXTENDED, 
            font=("Consolas", 10),
            bg="white",
            relief=tk.FLAT,
            bd=0,
            highlightthickness=0
        )
        self.file_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        scrollbar = tk.Scrollbar(list_frame, orient=tk.VERTICAL)
        scrollbar.config(command=self.file_listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.file_listbox.config(yscrollcommand=scrollbar.set)

        # Destination Folder Area
        dest_frame = tk.Frame(container, bg="#f0f2f5")
        dest_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.lbl_destination = tk.Label(
            dest_frame, 
            text="Destino: Mesma pasta do vídeo (Padrão)", 
            font=("Segoe UI", 9), 
            bg="#f0f2f5", 
            fg="#555555"
        )
        self.lbl_destination.pack(side=tk.LEFT)
        
        tk.Button(
            dest_frame, 
            text="Alterar Destino", 
            command=self.choose_directory,
            bg="white",
            font=("Segoe UI", 8),
            bd=1
        ).pack(side=tk.RIGHT)

        # Buttons Area
        btn_frame = tk.Frame(container, bg="#f0f2f5")
        btn_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.btn_select = tk.Button(
            btn_frame, 
            text="📂 Selecionar Arquivos", 
            command=self.select_files,
            bg="white",
            fg=self.text_color,
            font=("Segoe UI", 10, "bold"),
            relief=tk.RAISED,
            bd=1,
            padx=15,
            pady=8,
            cursor="hand2"
        )
        self.btn_select.pack(side=tk.LEFT)
        
        self.btn_clear = tk.Button(
            btn_frame, 
            text="Limpar Lista", 
            command=self.clear_list,
            bg="white",
            fg="#e74c3c",
            font=("Segoe UI", 10),
            relief=tk.RAISED,
            bd=1,
            padx=10,
            pady=8,
            cursor="hand2"
        )
        self.btn_clear.pack(side=tk.LEFT, padx=10)

        self.btn_convert = tk.Button(
            btn_frame, 
            text="Converter Agora 🎵", 
            command=self.start_conversion_thread,
            bg=self.primary_color,
            fg="white",
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=20,
            pady=8,
            cursor="hand2",
            state=tk.DISABLED
        )
        self.btn_convert.pack(side=tk.RIGHT)

        # Progress Area
        self.progress_frame = tk.Frame(container, bg="#f0f2f5")
        self.progress_frame.pack(fill=tk.X)
        
        self.status_label = tk.Label(
            self.progress_frame, 
            text="Aguardando arquivos...", 
            font=("Segoe UI", 9), 
            bg="#f0f2f5", 
            fg="#777777"
        )
        self.status_label.pack(anchor="w", pady=(0, 2))
        
        self.progress = Progressbar(
            self.progress_frame, 
            orient=tk.HORIZONTAL, 
            mode='determinate'
        )
        self.progress.pack(fill=tk.X, ipady=3)

    def choose_directory(self):
        folder = filedialog.askdirectory(title="Selecione a pasta de destino")
        if folder:
            self.output_folder = folder
            self.lbl_destination.config(text=f"Destino: {folder}", fg="#2ecc71")
        else:
            # If user cancels but had previously selected one, keep it? Or reset?
            # Let's keep it if set, or reset if they want to clear? usually cancel implies no change.
            # To reset, functionality might be needed, but usually overwriting with empty isn't clear.
            pass

    def select_files(self):
        filetypes = (
            ('Arquivos de Mídia', '*.mp4 *.avi *.mkv *.mov *.wmv *.flv *.webm *.mpeg *.mpg *.m4v *.3gp *.ts *.mts *.m2ts *.vob *.ogv *.mp3 *.wav *.aac *.wma *.flac *.m4a *.ogg *.opus *.MP4 *.AVI *.MKV *.MOV *.WMV *.FLV *.WEBM *.MPEG *.MPG *.M4V *.3GP *.TS *.MTS *.M2TS *.VOB *.OGV *.MP3 *.WAV *.AAC *.WMA *.FLAC *.M4A *.OGG *.OPUS'),
            ('Todos os arquivos', '*.*')
        )
        
        filenames = filedialog.askopenfilenames(
            title='Selecione os arquivos',
            initialdir='/',
            filetypes=filetypes
        )
        
        if filenames:
            count_new = 0
            for f in filenames:
                if f not in self.files_to_convert:
                    self.files_to_convert.append(f)
                    self.file_listbox.insert(tk.END, os.path.basename(f))
                    count_new += 1
            
            if self.files_to_convert:
                self.btn_convert.config(state=tk.NORMAL)
                self.btn_convert.config(bg="#2ecc71") # Green when ready
                self.status_label.config(text=f"{len(self.files_to_convert)} arquivo(s) na fila.")

    def clear_list(self):
        self.files_to_convert.clear()
        self.file_listbox.delete(0, tk.END)
        self.btn_convert.config(state=tk.DISABLED, bg=self.primary_color)
        self.status_label.config(text="Lista limpa.")
        self.progress['value'] = 0

    def start_conversion_thread(self):
        if 'moviepy' not in sys.modules:
            messagebox.showerror("Erro", "Biblioteca moviepy não instalada.\nExecute: pip install moviepy")
            return

        if not self.files_to_convert:
            return
            
        self.btn_select.config(state=tk.DISABLED)
        self.btn_clear.config(state=tk.DISABLED)
        self.btn_convert.config(state=tk.DISABLED)
        
        # Start conversion in a separate thread
        threading.Thread(target=self.convert_files, daemon=True).start()

    def convert_files(self):
        total_files = len(self.files_to_convert)
        self.update_progress_max(total_files)
        self.update_progress_val(0)
        
        success_count = 0
        
        for index, video_path in enumerate(self.files_to_convert):
            filename = os.path.basename(video_path)
            self.update_status(f"Convertendo {index+1}/{total_files}: {filename}...")
            
            try:
                # Output path
                if self.output_folder:
                    name_no_ext = os.path.splitext(filename)[0]
                    output_path = os.path.join(self.output_folder, name_no_ext + ".mp3")
                else:
                    output_path = os.path.splitext(video_path)[0] + ".mp3"
                
                # Conversion logic
                # AudioFileClip works for both audio files and video files
                clip = AudioFileClip(video_path)
                clip.write_audiofile(output_path, logger=None)
                clip.close()
                success_count += 1
                
            except Exception as e:
                print(f"Error: {e}")
                self.show_error_later(f"Erro ao converter {filename}:\n{str(e)}")

            
            self.update_progress_val(index + 1)
            
        self.update_status(f"Finalizado! {success_count} convertidos com sucesso.")
        self.root.after(0, self.reset_ui)
        self.root.after(0, lambda: messagebox.showinfo("Concluído", f"Conversão terminada!\n{success_count} arquivos convertidos."))

    def update_status(self, message):
        self.root.after(0, lambda: self.status_label.config(text=message))

    def update_progress_max(self, val):
        self.root.after(0, lambda: self.progress.configure(maximum=val))

    def update_progress_val(self, val):
        self.root.after(0, lambda: self.progress.configure(value=val))
        
    def show_error_later(self, msg):
        self.root.after(0, lambda: messagebox.showwarning("Aviso", msg))

    def reset_ui(self):
        self.btn_select.config(state=tk.NORMAL)
        self.btn_clear.config(state=tk.NORMAL)
        self.btn_convert.config(state=tk.NORMAL)

if __name__ == "__main__":
    if hasattr(sys, '_MEIPASS'):
        # Support for PyInstaller
        os.chdir(sys._MEIPASS)
        
    root = tk.Tk()
    app = ConverterApp(root)
    root.mainloop()
