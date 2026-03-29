import sys
import os
from PyQt6.QtWidgets import (QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, 
                             QLineEdit, QPushButton, QWidget, QFrame, QLabel, QSlider, 
                             QCheckBox, QGraphicsOpacityEffect)
from PyQt6.QtCore import Qt, QUrl, QPoint, QPropertyAnimation, QEasingCurve
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings, QWebEngineProfile, QWebEnginePage, QWebEngineScript
from PyQt6.QtGui import QIcon

# ======================================================
#  IMPORTANTE: Configurar ANTES de criar o QApplication
#  Habilita codecs proprietários (H.264, AAC) no Chromium
# ======================================================
os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = (
    "--autoplay-policy=no-user-gesture-required "
    "--enable-features=OverlayScrollbar "
    "--disable-features=MediaEngagementBypassAutoplayPolicies "
)


class SettingsPanel(QFrame):
    """Painel lateral deslizante com configurações."""
    def __init__(self, controller):
        super().__init__()
        self.controller = controller
        self.setFixedWidth(0)
        self.setStyleSheet("""
            background-color: rgba(10, 10, 10, 220);
            border-left: 1px solid rgba(255, 255, 255, 0.08);
        """)
        
        self.panel_layout = QVBoxLayout(self)
        self.panel_layout.setContentsMargins(15, 20, 15, 20)
        self.panel_layout.setSpacing(20)
        
        # Título
        lbl_title = QLabel("CONFIGURAÇÕES")
        lbl_title.setStyleSheet("color: #fff; font-size: 10px; font-weight: bold; letter-spacing: 1px;")
        self.panel_layout.addWidget(lbl_title)
        
        # --- Controle de Opacidade ---
        opacity_box = QVBoxLayout()
        opacity_box.setSpacing(5)
        lbl_opacity = QLabel("Opacidade")
        lbl_opacity.setStyleSheet("color: #aaa; font-size: 11px;")
        opacity_box.addWidget(lbl_opacity)
        
        self.slider_opacity = QSlider(Qt.Orientation.Horizontal)
        self.slider_opacity.setRange(20, 100)
        self.slider_opacity.setValue(100)
        self.slider_opacity.setCursor(Qt.CursorShape.PointingHandCursor)
        self.slider_opacity.setStyleSheet("""
            QSlider::groove:horizontal { height: 4px; background: #333; border-radius: 2px; }
            QSlider::handle:horizontal { background: #ff0000; width: 14px; height: 14px; margin: -5px 0; border-radius: 7px; }
            QSlider::sub-page:horizontal { background: #ff0000; border-radius: 2px; }
        """)
        self.slider_opacity.valueChanged.connect(self.controller.change_opacity)
        opacity_box.addWidget(self.slider_opacity)
        self.panel_layout.addLayout(opacity_box)

        # --- Tamanho ---
        size_box = QVBoxLayout()
        size_box.setSpacing(5)
        lbl_size = QLabel("Tamanho")
        lbl_size.setStyleSheet("color: #aaa; font-size: 11px;")
        size_box.addWidget(lbl_size)
        
        size_btns = QHBoxLayout()
        size_btns.setSpacing(5)
        for label, w, h in [("P", 400, 280), ("M", 580, 380), ("G", 800, 500)]:
            btn = QPushButton(label)
            btn.setFixedSize(35, 28)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton { background: #222; color: #aaa; border-radius: 6px; font-size: 10px; font-weight: bold; border: 1px solid #333; }
                QPushButton:hover { background: #ff0000; color: white; border-color: #ff0000; }
            """)
            btn.clicked.connect(lambda checked, ww=w, hh=h: self.controller.resize(ww, hh))
            size_btns.addWidget(btn)
        size_box.addLayout(size_btns)
        self.panel_layout.addLayout(size_box)

        # --- Checkbox "Sempre no Topo" ---
        self.chk_ontop = QCheckBox("Sempre no Topo")
        self.chk_ontop.setChecked(True)
        self.chk_ontop.setCursor(Qt.CursorShape.PointingHandCursor)
        self.chk_ontop.setStyleSheet("""
            QCheckBox { color: #aaa; font-size: 11px; spacing: 8px; }
            QCheckBox::indicator { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #555; background: #222; }
            QCheckBox::indicator:checked { background: #ff0000; border-color: #ff0000; }
        """)
        self.chk_ontop.toggled.connect(self.controller.toggle_always_on_top)
        self.panel_layout.addWidget(self.chk_ontop)
        
        self.panel_layout.addStretch()


class YouTubePlayer(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("YouTube Mini Player")
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.resize(580, 380)
        self.oldPos = self.pos()
        self.init_ui()

    def init_ui(self):
        # ========== Container Principal ==========
        self.main_container = QFrame(self)
        self.main_container.setObjectName("MainContainer")
        self.main_container.setStyleSheet("""
            QFrame#MainContainer {
                background-color: rgba(15, 15, 15, 245);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
            }
        """)
        self.setCentralWidget(self.main_container)

        root_layout = QVBoxLayout(self.main_container)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # ========== Barra de Título ==========
        title_bar = QFrame()
        title_bar.setFixedHeight(40)
        title_bar.setStyleSheet("background: transparent; border-bottom: 1px solid rgba(255,255,255,0.05);")
        title_layout = QHBoxLayout(title_bar)
        title_layout.setContentsMargins(15, 0, 10, 0)

        lbl_logo = QLabel("ANTIGRAVITY PLAYER")
        lbl_logo.setStyleSheet("color: rgba(255, 255, 255, 0.5); font-weight: bold; letter-spacing: 2px; font-size: 9px;")
        title_layout.addWidget(lbl_logo)
        title_layout.addStretch()

        for icon, handler, close in [("⚙", self.toggle_settings, False), ("✕", self.close, True)]:
            btn = QPushButton(icon)
            btn.setFixedSize(28, 28)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            hover = "#ff4b2b" if close else "rgba(255,255,255,0.1)"
            btn.setStyleSheet(f"""
                QPushButton {{ background: transparent; color: #666; border-radius: 14px; font-size: 12px; border: none; }}
                QPushButton:hover {{ background: {hover}; color: white; }}
            """)
            btn.clicked.connect(handler)
            title_layout.addWidget(btn)

        root_layout.addWidget(title_bar)

        # ========== Área de Conteúdo ==========
        content = QFrame()
        content_layout = QHBoxLayout(content)
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(0)

        # --- Player ---
        player_frame = QFrame()
        player_layout = QVBoxLayout(player_frame)
        player_layout.setContentsMargins(10, 10, 10, 10)
        player_layout.setSpacing(8)

        # Configurar WebEngine Profile
        cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "browser_data")
        profile = QWebEngineProfile("ytplayer", self)
        profile.setPersistentStoragePath(cache_dir)
        profile.setHttpCacheType(QWebEngineProfile.HttpCacheType.DiskHttpCache)
        profile.setHttpUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )

        # Criar WebView com perfil customizado
        self.web_view = QWebEngineView()
        page = QWebEnginePage(profile, self.web_view)
        self.web_view.setPage(page)
        self.web_view.setStyleSheet("background: black; border-radius: 8px;")

        # Configurações
        s = self.web_view.settings()
        s.setAttribute(QWebEngineSettings.WebAttribute.FullScreenSupportEnabled, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)
        s.setAttribute(QWebEngineSettings.WebAttribute.PluginsEnabled, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.LocalStorageEnabled, True)
        s.setAttribute(QWebEngineSettings.WebAttribute.AllowRunningInsecureContent, True)

        # Injetar CSS para esconder header/footer do YouTube (modo limpo)
        self.yt_cleanup_script = QWebEngineScript()
        self.yt_cleanup_script.setName("yt_cleanup")
        self.yt_cleanup_script.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentReady)
        self.yt_cleanup_script.setWorldId(QWebEngineScript.ScriptWorldId.ApplicationWorld)
        self.yt_cleanup_script.setSourceCode("""
            (function() {
                var style = document.createElement('style');
                style.textContent = `
                    #masthead-container, #related, #comments, #secondary, 
                    ytd-mini-guide-renderer, #guide-button, tp-yt-app-drawer,
                    .ytp-chrome-top, .ytp-pause-overlay, .ytp-endscreen-content,
                    #below { display: none !important; }
                    #primary { max-width: 100% !important; }
                    ytd-watch-flexy[theater] #player-theater-container { max-height: 100vh !important; }
                    #page-manager { margin-top: 0 !important; }
                    body { overflow: hidden !important; }
                `;
                document.head.appendChild(style);
                
                // Tentar entrar em modo teatro automaticamente
                setTimeout(function() {
                    var theaterBtn = document.querySelector('.ytp-size-button');
                    if (theaterBtn) theaterBtn.click();
                }, 3000);
            })();
        """)
        page.scripts().insert(self.yt_cleanup_script)

        # HTML de espera
        self.web_view.setHtml("""
            <body style="background:#0a0a0a;color:#444;font-family:'Segoe UI',sans-serif;
                         display:flex;flex-direction:column;align-items:center;
                         justify-content:center;height:100vh;margin:0;">
                <div style="font-size:40px;filter:drop-shadow(0 0 15px rgba(255,0,0,0.2));">▶️</div>
                <div style="font-size:12px;margin-top:15px;letter-spacing:1px;opacity:0.7;">AGUARDANDO LINK</div>
            </body>
        """)
        player_layout.addWidget(self.web_view)

        # --- Barra de Controle ---
        controls = QFrame()
        ctrl_layout = QHBoxLayout(controls)
        ctrl_layout.setContentsMargins(0, 5, 0, 0)
        ctrl_layout.setSpacing(8)

        self.url_input = QLineEdit()
        self.url_input.setPlaceholderText("Cole o link do YouTube aqui...")
        self.url_input.setStyleSheet("""
            QLineEdit {
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px; color: white; padding: 8px 12px; font-size: 12px;
            }
            QLineEdit:focus { border-color: #ff0000; background: rgba(255,255,255,0.1); }
        """)
        self.url_input.returnPressed.connect(self.load_video)
        ctrl_layout.addWidget(self.url_input)

        btn_play = QPushButton("PLAY")
        btn_play.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_play.setFixedSize(60, 34)
        btn_play.setStyleSheet("""
            QPushButton { background:#ff0000; color:white; border-radius:8px; font-weight:bold; font-size:10px; }
            QPushButton:hover { background:#cc0000; }
        """)
        btn_play.clicked.connect(self.load_video)
        ctrl_layout.addWidget(btn_play)

        player_layout.addWidget(controls)
        content_layout.addWidget(player_frame)

        # --- Painel de Configurações ---
        self.settings_panel = SettingsPanel(self)
        content_layout.addWidget(self.settings_panel)

        root_layout.addWidget(content)

    # ===================== Ações =====================

    def toggle_settings(self):
        w = self.settings_panel.width()
        target = 160 if w == 0 else 0
        self.anim1 = QPropertyAnimation(self.settings_panel, b"minimumWidth")
        self.anim1.setDuration(250)
        self.anim1.setStartValue(w)
        self.anim1.setEndValue(target)
        self.anim1.setEasingCurve(QEasingCurve.Type.InOutQuart)
        self.anim2 = QPropertyAnimation(self.settings_panel, b"maximumWidth")
        self.anim2.setDuration(250)
        self.anim2.setStartValue(w)
        self.anim2.setEndValue(target)
        self.anim2.setEasingCurve(QEasingCurve.Type.InOutQuart)
        self.anim1.start()
        self.anim2.start()

    def change_opacity(self, value):
        self.setWindowOpacity(value / 100.0)

    def toggle_always_on_top(self, checked):
        if checked:
            self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)
        else:
            self.setWindowFlags(self.windowFlags() & ~Qt.WindowType.WindowStaysOnTopHint)
        self.show()

    def load_video(self):
        url = self.url_input.text().strip()
        if not url:
            return
        
        # Extrair video ID
        video_id = None
        if "youtu.be/" in url:
            video_id = url.split("youtu.be/")[-1].split("?")[0]
        elif "v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        elif "embed/" in url:
            video_id = url.split("embed/")[-1].split("?")[0]
        
        if video_id:
            # *** SOLUÇÃO: carregar a página completa do YouTube, NÃO o embed ***
            # A página completa usa VP9/WebM que SÃO suportados pelo QtWebEngine.
            # O embed usa H.264 que NÃO é suportado → Erro 153.
            watch_url = f"https://www.youtube.com/watch?v={video_id}"
            self.web_view.setUrl(QUrl(watch_url))
        else:
            self.web_view.setUrl(QUrl(url))

    # ===================== Drag da Janela =====================

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.oldPos = event.globalPosition().toPoint()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.MouseButton.LeftButton:
            delta = QPoint(event.globalPosition().toPoint() - self.oldPos)
            self.move(self.x() + delta.x(), self.y() + delta.y())
            self.oldPos = event.globalPosition().toPoint()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    player = YouTubePlayer()
    player.show()
    sys.exit(app.exec())
