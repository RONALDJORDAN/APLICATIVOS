import os
import shutil
import glob

source = r"c:\Users\adna\Documents\PROJETOS"
dest = r"c:\Users\adna\Documents\PROJETOS\LIXO"

# Ensure destination exists
if not os.path.exists(dest):
    os.makedirs(dest)

files_patterns = ["*.bat", "*.log", "*.txt"]
specific_files = [
    "package-lock.json",
    "package.json",
    os.path.join("01-SITES-WEB", "escala.html")
]

dirs_to_move = [
    "node_modules",
    ".venv",
    os.path.join("03-DOCUMENTOS-LATEX", "PRO_JETO-RELATORIO-LATEX")
]

moved_count = 0
errors = 0

# Move patterns
for pattern in files_patterns:
    for f in glob.glob(os.path.join(source, pattern)):
        # Skip this script and the log file we create
        if "move_files.py" in f or "move_result.log" in f or "README.txt" in f:
            continue
        try:
            print(f"Moving file: {f}")
            shutil.move(f, dest)
            moved_count += 1
        except Exception as e:
            print(f"Error moving {f}: {e}")
            errors += 1

# Move specific files
for rel_path in specific_files:
    f = os.path.join(source, rel_path)
    if os.path.exists(f):
        try:
            print(f"Moving file: {f}")
            shutil.move(f, dest)
            moved_count += 1
        except Exception as e:
            print(f"Error moving {f}: {e}")
            errors += 1

# Move directories
for rel_path in dirs_to_move:
    d = os.path.join(source, rel_path)
    if os.path.exists(d):
        try:
            print(f"Moving directory: {d}")
            # Check destination conflict
            target = os.path.join(dest, os.path.basename(rel_path))
            if os.path.exists(target):
                print(f"Target already exists for {d}, skipping or renaming needed.")
                # Maybe rename old?
                pass
            
            shutil.move(d, dest)
            moved_count += 1
        except Exception as e:
            print(f"Error moving directory {d}: {e}")
            errors += 1

# Cleanup temp scripts
for f in ["cleanup.cmd", "cleanup_tmp.bat"]:
    try:
        path = os.path.join(source, f)
        if os.path.exists(path):
            os.remove(path)
            print(f"Removed {f}")
    except:
        pass

with open(os.path.join(source, "move_result.log"), "w") as log:
    log.write(f"Moved {moved_count} items. Errors: {errors}")

print(f"Done. Moved {moved_count}, Errors {errors}")
