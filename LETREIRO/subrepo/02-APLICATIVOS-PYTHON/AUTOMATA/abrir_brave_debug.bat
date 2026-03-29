@echo off
echo ======================================================
echo    MODO DEPURACAO - AUTOMATA ROBOT
echo ======================================================
echo.
echo ATENCAO: Feche todas as janelas abertas do Brave 
echo antes de executar este script.
echo.
echo Pressione qualquer tecla para abrir o Brave na Porta 9222...
pause > nul

start brave.exe --remote-debugging-port=9222

echo.
echo Brave aberto com sucesso! 
echo Agora voce pode usar a Sincronizacao Inteligente no Automata.
timeout /t 5
