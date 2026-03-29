@echo off
echo Starting git sync...
git remote set-url origin "https://github.com/CodAureo-DevStudio/Projetos_codaureo"
git add .
git commit -m "Auto-commit: Syncing all projects to GitHub"
git branch -M main
git push -u origin main
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS > git_status.txt
) else (
    echo FAILURE %ERRORLEVEL% > git_status.txt
)
