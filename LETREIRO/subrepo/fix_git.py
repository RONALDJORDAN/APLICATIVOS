import subprocess

folders_to_clean = [
    "01-SITES-WEB/ADMIN_SITE_LETREIRO",
    "01-SITES-WEB/EDUMO_SITES",
    "01-SITES-WEB/PROJETO_CAMARA",
    "01-SITES-WEB/SITES_ALPHA",
    "04-LETREIRO_DIGITAL"
]

with open("git_final_output.txt", "w", encoding="utf-8") as f:
    for folder in folders_to_clean:
        f.write(f"Running git rm --cached {folder}\n")
        result = subprocess.run(["git", "rm", "--cached", folder], capture_output=True, text=True)
        f.write(f"STDOUT: {result.stdout}\n")
        f.write(f"STDERR: {result.stderr}\n")

    f.write("Running git add .\n")
    res_add = subprocess.run(["git", "add", "."], capture_output=True, text=True)
    f.write(f"ADD STDOUT: {res_add.stdout}\n")
    f.write(f"ADD STDERR: {res_add.stderr}\n")

    if res_add.returncode == 0:
        f.write("Running git commit\n")
        res_commit = subprocess.run(["git", "commit", "-m", "Commit de todos os projetos: SITES-WEB, APLICATIVOS-PYTHON e LETREIRO-DIGITAL"], capture_output=True, text=True)
        f.write(f"COMMIT STDOUT: {res_commit.stdout}\n")
        f.write(f"COMMIT STDERR: {res_commit.stderr}\n")
        
        f.write("Running git push\n")
        res_push = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
        f.write(f"PUSH STDOUT: {res_push.stdout}\n")
        f.write(f"PUSH STDERR: {res_push.stderr}\n")
