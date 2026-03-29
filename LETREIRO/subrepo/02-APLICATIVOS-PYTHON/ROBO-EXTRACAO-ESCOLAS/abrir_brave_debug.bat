@echo off
echo Feche TODAS as janelas do Brave antes de continuar.
echo Pressione qualquer tecla para abrir o Brave no modo Depuracao (Porta 9222)...
pause

start brave.exe --remote-debugging-port=9222

echo Brave aberto com sucesso! Agora voce pode usar o Extrator.
pause
