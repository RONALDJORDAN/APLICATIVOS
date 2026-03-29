import subprocess
import os

folders_to_clean = [
    "01-SITES-WEB/ADMIN_SITE_LETREIRO",
    "01-SITES-WEB/EDUMO_SITES",
    "01-SITES-WEB/PROJETO_CAMARA",
    "01-SITES-WEB/SITES_ALPHA",
    "04-LETREIRO_DIGITAL"
]

for folder in folders_to_clean:
    # First ensure no .git exists locally
    git_dir = os.path.join(folder, ".git")
    if os.path.exists(git_dir):
        print(f"Need to delete {git_dir}, removing manually...")
        import shutil
        import stat
        def remove_readonly(func, path, excinfo):
            os.chmod(path, stat.S_IWRITE)
            func(path)
        shutil.rmtree(git_dir, onerror=remove_readonly)
        
    # Then remove from git cache just in case it's registered as submodule
    subprocess.run(["git", "rm", "--cached", "-f", folder], check=False)

# After cleanup, let's also remove any other submodules recursively if they exist
commands = [
    ["git", "status"],
    ["git", "add", "."],
    ["git", "commit", "-m", "Commit de todos os projetos: SITES-WEB, APLICATIVOS-PYTHON e LETREIRO-DIGITAL"],
    ["git", "push", "origin", "main"]
]

with open("git_output.txt", "w", encoding="utf-8") as f:
    for cmd in commands:
        f.write(f"Executing: {' '.join(cmd)}\n")
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        f.write(f"Return code: {result.returncode}\n")
        f.write(f"STDOUT:\n{result.stdout}\n")
        f.write(f"STDERR:\n{result.stderr}\n")
        f.write("-" * 40 + "\n")
