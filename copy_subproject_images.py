import os
import shutil
import sys

def copy_images(source_root, dest_root):
    # Directories to exclude
    exclude_dirs = {'node_modules', '.git', '__pycache__', 'dist', 'build', 'docs', 'site', 'mkdocs-env'}
    copied_files = 0

    for root, dirs, files in os.walk(source_root):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        if 'images' in dirs:
            source_image_dir = os.path.join(root, 'images')
            project_name = os.path.relpath(root, source_root).split(os.sep)[0]
            dest_image_dir = os.path.join(dest_root, 'projects', project_name, 'images')

            if project_name == 'docs':
                print(f"Skipping {root} as it's in the docs directory")
                continue

            print(f"Copying images from {source_image_dir} to {dest_image_dir}")
            
            if not os.path.exists(dest_image_dir):
                os.makedirs(dest_image_dir)
            
            for item in os.listdir(source_image_dir):
                s = os.path.join(source_image_dir, item)
                d = os.path.join(dest_image_dir, item)
                if os.path.isfile(s):
                    shutil.copy2(s, d)
                    copied_files += 1
                    print(f"Copied: {s} -> {d}")

    print(f"Image copying complete. Total files copied: {copied_files}")

if __name__ == "__main__":
    project_root = os.getcwd()
    docs_dir = os.path.join(project_root, 'docs')
    
    if not os.path.exists(docs_dir):
        print(f"Error: 'docs' directory not found in {project_root}")
        sys.exit(1)
    
    copy_images(project_root, docs_dir)