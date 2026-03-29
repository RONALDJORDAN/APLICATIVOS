import subprocess

commands = [
    ["git", "status"],
    ["git", "add", "."],
    ["git", "commit", "-m", "Commit de todos os projetos: SITES-WEB, APLICATIVOS-PYTHON e LETREIRO-DIGITAL"],
    ["git", "push", "origin", "main"]
]

with open("git_output.txt", "w", encoding="utf-8") as f:
    for cmd in commands:
        f.write(f"Executing: {' '.join(cmd)}\n")
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)
            f.write(f"Return code: {result.returncode}\n")
            f.write(f"STDOUT:\n{result.stdout}\n")
            f.write(f"STDERR:\n{result.stderr}\n")
            f.write("-" * 40 + "\n")
        except Exception as e:
            f.write(f"Exception: {e}\n")
