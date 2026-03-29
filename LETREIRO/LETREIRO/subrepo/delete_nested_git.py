import shutil
import os

path = r'C:\Users\adna\Documents\PROJETOS\03-APLICATIVOS-CSHARP\LETREIRO-DIGITAL-WPF\_ADMIN_SITE\public\.git'
if os.path.exists(path):
    shutil.rmtree(path)
    print("Deleted")
else:
    print("Not found")
