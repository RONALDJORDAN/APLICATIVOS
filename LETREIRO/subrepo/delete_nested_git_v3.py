import shutil
import os
import stat

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

paths = [
    r'C:\Users\adna\Documents\PROJETOS\01-SITES-WEB\MODEL - EIXOS - 01\.git',
    r'C:\Users\adna\Documents\PROJETOS\01-SITES-WEB\MY-PORTFOLIO\.git'
]

for path in paths:
    if os.path.exists(path):
        try:
            shutil.rmtree(path, onerror=remove_readonly)
            print(f"Deleted {path}")
        except Exception as e:
            print(f"Error deleting {path}: {e}")
    else:
        print(f"Not found: {path}")
