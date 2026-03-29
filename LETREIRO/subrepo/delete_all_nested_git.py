import os
import shutil
import stat

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

root_dir = r'c:\Users\adna\Documents\PROJETOS'

for dirpath, dirnames, filenames in os.walk(root_dir):
    if dirpath == root_dir:
        continue
    if '.git' in dirnames:
        git_path = os.path.join(dirpath, '.git')
        print(f"Deleting nested git folder: {git_path}")
        try:
            shutil.rmtree(git_path, onerror=remove_readonly)
            print(f"Successfully deleted: {git_path}")
        except Exception as e:
            print(f"Failed to delete {git_path}: {e}")
    # Don't descend into .git folders anyway, but especially not if we just deleted it
    if '.git' in dirnames:
        dirnames.remove('.git')
