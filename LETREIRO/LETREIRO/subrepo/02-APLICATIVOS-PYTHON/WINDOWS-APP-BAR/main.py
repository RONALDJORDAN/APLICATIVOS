import sys
import ctypes
from ctypes import wintypes
import atexit
from PyQt6.QtWidgets import (QApplication, QWidget, QVBoxLayout, QHBoxLayout, 
                             QLabel, QPushButton, QStackedWidget, QFrame)
from PyQt6.QtCore import Qt, QTimer, QRect, pyqtProperty, QPropertyAnimation, QEasingCurve
from PyQt6.QtGui import QColor, QPalette, QLinearGradient, QBrush

# --- Windows API Constants ---
ABM_NEW = 0x00000000
ABM_REMOVE = 0x00000001
ABM_QUERYPOS = 0x00000002
ABM_SETPOS = 0x00000003

ABE_LEFT = 0
ABE_TOP = 1
ABE_RIGHT = 2
ABE_BOTTOM = 3

# --- Custom ctypes Structures ---
class RECT(ctypes.Structure):
    _fields_ = [
        ("left", ctypes.c_long),
        ("top", ctypes.c_long),
        ("right", ctypes.c_long),
        ("bottom", ctypes.c_long),
    ]

class APPBARDATA(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("hWnd", wintypes.HWND),
        ("uCallbackMessage", wintypes.UINT),
        ("uEdge", wintypes.UINT),
        ("rc", RECT),
        ("lParam", wintypes.LPARAM),
    ]

# Initialize Shell32
shell32 = ctypes.windll.shell32
user32 = ctypes.windll.user32

# --- WinAPI Function Prototypes ---
user32.IsWindowVisible.argtypes = [wintypes.HWND]
user32.IsWindowVisible.restype = wintypes.BOOL

user32.GetClassNameW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.GetClassNameW.restype = ctypes.c_int

user32.GetWindowRect.argtypes = [wintypes.HWND, ctypes.POINTER(RECT)]
user32.GetWindowRect.restype = wintypes.BOOL

user32.SetWindowPos.argtypes = [wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.UINT]
user32.SetWindowPos.restype = wintypes.BOOL

ENUM_WINDOWS_PROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
user32.EnumWindows.argtypes = [ENUM_WINDOWS_PROC, wintypes.LPARAM]
user32.EnumWindows.restype = wintypes.BOOL

class ScreenWidget(QFrame):
    """Base class for animated screens with premium styling."""
    def __init__(self, title, description, color="#00d2ff"):
        super().__init__()
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(30, 40, 30, 40)
        self.layout.setSpacing(20)

        # Title
        self.label_title = QLabel(title)
        self.label_title.setStyleSheet(f"font-size: 28px; font-weight: bold; color: {color};")
        self.label_title.setWordWrap(True)
        self.layout.addWidget(self.label_title)

        # Description
        self.label_desc = QLabel(description)
        self.label_desc.setStyleSheet("font-size: 14px; color: #ccc; font-weight: normal;")
        self.label_desc.setWordWrap(True)
        self.layout.addWidget(self.label_desc)
        
        self.layout.addStretch()

class HomeScreen(ScreenWidget):
    def __init__(self, parent):
        super().__init__("Bem-vindo", "Esta é a tela de início do seu Windows AppBar customizado. Tudo pronto para começar?", "#00d2ff")
        self.parent = parent

        self.btn_start = QPushButton("INICIAR SESSÃO")
        self.btn_start.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_start.setStyleSheet("""
            QPushButton {
                background-color: #00d2ff;
                color: black;
                border-radius: 12px;
                padding: 15px;
                font-size: 14px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #00a8cc;
            }
        """)
        self.btn_start.clicked.connect(lambda: self.parent.switch_to_screen(1))
        self.layout.addWidget(self.btn_start)

class EndScreen(ScreenWidget):
    def __init__(self, parent):
        super().__init__("Sessão Finalizada", "A tarefa foi concluída com sucesso. Deseja retornar ao início ou encerrar o aplicativo?", "#ff4b2b")
        self.parent = parent

        btn_layout = QVBoxLayout()
        btn_layout.setSpacing(10)

        self.btn_back = QPushButton("VOLTAR AO INÍCIO")
        self.btn_back.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_back.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                color: white;
                border: 2px solid #555;
                border-radius: 12px;
                padding: 12px;
                font-size: 13px;
                font-weight: bold;
            }
            QPushButton:hover {
                border-color: #888;
                background-color: rgba(255, 255, 255, 0.05);
            }
        """)
        self.btn_back.clicked.connect(lambda: self.parent.switch_to_screen(0))
        btn_layout.addWidget(self.btn_back)

        self.btn_quit = QPushButton("ENCERRAR APP")
        self.btn_quit.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_quit.setStyleSheet("""
            QPushButton {
                background-color: #ff4b2b;
                color: white;
                border-radius: 12px;
                padding: 12px;
                font-size: 13px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #e04326;
            }
        """)
        self.btn_quit.clicked.connect(self.parent.close)
        btn_layout.addWidget(self.btn_quit)

        self.layout.addLayout(btn_layout)

class WindowsAppBar(QWidget):
    def __init__(self, width=300):
        super().__init__()
        self.bar_width = width
        self._is_registered = False

        # Configurações da Janela
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Tool)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # Design Visual Premium
        self.setStyleSheet("""
            QWidget#MainContainer {
                background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 rgba(20, 20, 20, 245), stop:1 rgba(35, 35, 35, 245));
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            }
            QLabel {
                background: transparent;
            }
        """)

        # Main Layout
        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)

        # Central Container (for Styling)
        self.container = QFrame()
        self.container.setObjectName("MainContainer")
        self.container_layout = QVBoxLayout(self.container)
        self.main_layout.addWidget(self.container)

        # Header with Stop Button
        self.header = QFrame()
        header_layout = QHBoxLayout(self.header)
        header_layout.setContentsMargins(20, 20, 20, 10)
        
        self.brand_label = QLabel("AUREO BAR")
        self.brand_label.setStyleSheet("font-size: 12px; letter-spacing: 2px; color: #888; font-weight: bold;")
        header_layout.addWidget(self.brand_label)
        
        header_layout.addStretch()
        
        self.btn_close = QPushButton("✕")
        self.btn_close.setFixedSize(30, 30)
        self.btn_close.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_close.setStyleSheet("""
            QPushButton {
                background-color: rgba(255, 255, 255, 0.05);
                color: #888;
                border-radius: 15px;
                border: none;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #ff4b2b;
                color: white;
            }
        """)
        self.btn_close.clicked.connect(self.close)
        header_layout.addWidget(self.btn_close)
        
        self.container_layout.addWidget(self.header)

        # Stacked Widget for Screens
        self.stack = QStackedWidget()
        self.home_screen = HomeScreen(self)
        self.end_screen = EndScreen(self)
        
        self.stack.addWidget(self.home_screen)
        self.stack.addWidget(self.end_screen)
        
        self.container_layout.addWidget(self.stack)

        # Footer
        self.footer = QFrame()
        self.footer.setStyleSheet("border-top: 1px solid rgba(255, 255, 255, 0.05);")
        footer_layout = QVBoxLayout(self.footer)
        footer_layout.setContentsMargins(20, 20, 20, 20)
        
        self.status_label = QLabel("STATUS: CONECTADO")
        self.status_label.setStyleSheet("font-size: 10px; color: #00d2ff; font-weight: bold; border: none;")
        footer_layout.addWidget(self.status_label)
        
        self.container_layout.addWidget(self.footer)

        # Timer para registrar após a janela ser renderizada
        QTimer.singleShot(100, self.register_appbar)

    def switch_to_screen(self, index):
        self.stack.setCurrentIndex(index)

    def register_appbar(self):
        hwnd = int(self.winId())
        abd = APPBARDATA()
        abd.cbSize = ctypes.sizeof(APPBARDATA)
        abd.hWnd = hwnd
        abd.uCallbackMessage = 0
        
        if not shell32.SHAppBarMessage(ABM_NEW, ctypes.byref(abd)):
            print("Falha ao registrar AppBar.")
            return

        self._is_registered = True
        self.update_appbar_pos()
        
        # Iniciar o reforço de janelas (Window Enforcer)
        self.enforce_timer = QTimer(self)
        self.enforce_timer.timeout.connect(self.enforce_window_constraints)
        self.enforce_timer.start(200) # Checar a cada 200ms

    def update_appbar_pos(self):
        if not self._is_registered:
            return

        hwnd = int(self.winId())
        screen_geo = QApplication.primaryScreen().geometry()
        
        abd = APPBARDATA()
        abd.cbSize = ctypes.sizeof(APPBARDATA)
        abd.hWnd = hwnd
        abd.uEdge = ABE_LEFT
        
        abd.rc.left = 0
        abd.rc.top = 0
        abd.rc.right = self.bar_width
        abd.rc.bottom = screen_geo.height()

        shell32.SHAppBarMessage(ABM_QUERYPOS, ctypes.byref(abd))
        shell32.SHAppBarMessage(ABM_SETPOS, ctypes.byref(abd))

        self.setGeometry(abd.rc.left, abd.rc.top, 
                          abd.rc.right - abd.rc.left, 
                          abd.rc.bottom - abd.rc.top)
        
        self.show()

    def enforce_window_constraints(self):
        """Força as outras janelas a respeitarem o espaço da AppBar, inclusive em F11."""
        screen_geo = QApplication.primaryScreen().geometry()
        screen_width = screen_geo.width()
        screen_height = screen_geo.height()
        
        # Margem de segurança e área permitida
        limit_x = self.bar_width
        
        def enum_window_callback(hwnd, lParam):
            if hwnd == int(self.winId()):
                return True
            
            if not user32.IsWindowVisible(hwnd):
                return True
            
            # Pular janelas do sistema conhecidas
            class_name = ctypes.create_unicode_buffer(256)
            user32.GetClassNameW(hwnd, class_name, 256)
            if class_name.value in ["Shell_TrayWnd", "Progman", "WorkerW", "TaskHasWnd"]:
                return True

            # Obter dimensões da janela
            rect = RECT()
            if not user32.GetWindowRect(hwnd, ctypes.byref(rect)):
                return True
            
            # Se a janela está invadindo a área da barra
            if rect.left < limit_x:
                # Verificar se é uma janela que devemos ignorar (tooltips, overlays pequenos)
                width = rect.right - rect.left
                height = rect.bottom - rect.top
                
                if width < 50 or height < 50:
                    return True
                
                # Ajustar a janela
                new_x = limit_x
                new_y = rect.top
                new_w = width
                new_h = height
                
                # Se a janela estava tentando ser "fullscreen" (cobrindo a tela toda)
                if rect.left <= 0 and rect.right >= screen_width:
                    new_w = screen_width - limit_x
                
                # Re-posicionar a janela forçadamente
                # SWP_NOACTIVATE (0x0010) para não roubar o foco
                # SWP_NOZORDER (0x0004) para não mexer na ordem Z
                user32.SetWindowPos(hwnd, 0, new_x, new_y, new_w, new_h, 0x0010 | 0x0004)
                
            return True

        # Usar o protótipo do callback definido no topo
        callback_obj = ENUM_WINDOWS_PROC(enum_window_callback)
        user32.EnumWindows(callback_obj, 0)

    def unregister_appbar(self):
        if self._is_registered:
            hwnd = int(self.winId())
            abd = APPBARDATA()
            abd.cbSize = ctypes.sizeof(APPBARDATA)
            abd.hWnd = hwnd
            shell32.SHAppBarMessage(ABM_REMOVE, ctypes.byref(abd))
            self._is_registered = False
            print("AppBar removida com sucesso.")

    def closeEvent(self, event):
        self.unregister_appbar()
        event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # Criar a barra (Esquerda)
    window_left = WindowsAppBar(width=340)
    
    # Registrar cleanup extra (atexit)
    atexit.register(window_left.unregister_appbar)
    
    sys.exit(app.exec())
