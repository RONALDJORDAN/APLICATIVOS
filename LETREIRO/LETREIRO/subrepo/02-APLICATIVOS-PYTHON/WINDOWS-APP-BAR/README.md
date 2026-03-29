# Windows Custom AppBar (Python + PyQt6)

Este projeto implementa uma **Application Desktop Toolbar (AppBar)** usando Python e a API nativa do Windows (`shell32.dll`).

## 🚀 Funcionalidades

- **Reserva de Espaço (Work Area):** Ao iniciar, a barra "empurra" outras janelas (como Chrome ou VS Code), impedindo que elas cubram a área da barra quando maximizadas.
- **Docking Lateral:** Fixada na lateral **ESQUERDA** da tela com largura customizável.
- **Frameless UI:** Interface moderna sem bordas usando PyQt6.
- **Cleanup Automático:** Garante que o espaço reservado seja liberado ao fechar o script, evitando "buracos" fantasmas na área de trabalho.

## 🛠️ Requisitos

- Windows 10 ou 11.
- Python 3.9+.
- `PyQt6` (instalável via pip).

## 💻 Como Executar

1. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
2. Execute o script principal:
   ```bash
   python main.py
   ```

## ⚠️ Nota Importante

O script usa chamadas de baixo nível (`ctypes`). Se o script for encerrado de forma forçada (via Gerenciador de Tarefas, por exemplo), o Windows pode não detectar a remoção da AppBar imediatamente. O código inclui um tratamento via `atexit` e `closeEvent` para minimizar esse risco.
