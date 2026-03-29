@echo off
echo Starting git commit and push...
git remote set-url origin "https://github.com/CodAureo-DevStudio/Projetos_codaureo"
git add .
git commit -m "Commit de todos os projetos: SITES-WEB, APLICATIVOS-PYTHON e LETREIRO-DIGITAL"
git push origin main
echo Done.
