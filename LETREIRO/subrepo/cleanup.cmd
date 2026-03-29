@echo off
echo Starting cleanup...
if not exist "c:\Users\adna\Documents\PROJETOS\LIXO" mkdir "c:\Users\adna\Documents\PROJETOS\LIXO"
move /Y "c:\Users\adna\Documents\PROJETOS\*.bat" "c:\Users\adna\Documents\PROJETOS\LIXO\"
move /Y "c:\Users\adna\Documents\PROJETOS\*.log" "c:\Users\adna\Documents\PROJETOS\LIXO\"
move /Y "c:\Users\adna\Documents\PROJETOS\*.txt" "c:\Users\adna\Documents\PROJETOS\LIXO\"
if exist "c:\Users\adna\Documents\PROJETOS\package-lock.json" move /Y "c:\Users\adna\Documents\PROJETOS\package-lock.json" "c:\Users\adna\Documents\PROJETOS\LIXO\"
if exist "c:\Users\adna\Documents\PROJETOS\package.json" move /Y "c:\Users\adna\Documents\PROJETOS\package.json" "c:\Users\adna\Documents\PROJETOS\LIXO\"
if exist "c:\Users\adna\Documents\PROJETOS\.venv" move /Y "c:\Users\adna\Documents\PROJETOS\.venv" "c:\Users\adna\Documents\PROJETOS\LIXO\"
if exist "c:\Users\adna\Documents\PROJETOS\node_modules" move /Y "c:\Users\adna\Documents\PROJETOS\node_modules" "c:\Users\adna\Documents\PROJETOS\LIXO\"
if exist "c:\Users\adna\Documents\PROJETOS\01-SITES-WEB\escala.html" move /Y "c:\Users\adna\Documents\PROJETOS\01-SITES-WEB\escala.html" "c:\Users\adna\Documents\PROJETOS\LIXO\"
if exist "c:\Users\adna\Documents\PROJETOS\03-DOCUMENTOS-LATEX\PRO_JETO-RELATORIO-LATEX" move /Y "c:\Users\adna\Documents\PROJETOS\03-DOCUMENTOS-LATEX\PRO_JETO-RELATORIO-LATEX" "c:\Users\adna\Documents\PROJETOS\LIXO\"
if exist "c:\Users\adna\Documents\PROJETOS\cleanup_tmp.bat" del "c:\Users\adna\Documents\PROJETOS\cleanup_tmp.bat"
echo Cleanup complete.
