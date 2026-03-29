import shutil
import os

paths = [
    r'C:\Users\adna\Documents\PROJETOS\01-SITES-WEB\MODEL - EIXOS - 01\.git',
    r'C:\Users\adna\Documents\PROJETOS\01-SITES-WEB\MY-PORTFOLIO\.git'
]

for path in paths:
    if os.path.exists(path):
        try:
            shutil.rmtree(path)
            print(f"Deleted {path}")
        except Exception as e:
            print(f"Error deleting {path}: {e}")
    else:
        print(f"Not found: {path}")
