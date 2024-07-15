import os
import shutil
import sys

def copy_images(source_root, dest_root):
    # Directories to exclude
    exclude_dirs = {'node_modules', '.git', '__pycache__', 'dist', 'build', 'docs', 'site', 'mkdocs-env'}

    for root, dirs, files in os.walk(source_root):
        # Remove excluded directories from dirs to prevent os.walk from traversing them
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        if 'images' in dirs:
            source_image_dir = os.path.join(root, 'images')
            relative_path = os.path.relpath(root, source_root)
            dest_image_dir = os.path.join(dest_root, relative_path, 'images')
            
            # Skip if the source is inside the docs directory
            if relative_path.startswith('docs'):
                continue

            print(f"Copying images from {source_image_dir} to {dest_image_dir}")
            
            if not os.path.exists(dest_image_dir):
                os.makedirs(dest_image_dir)
            
            for item in os.listdir(source_image_dir):
                s = os.path.join(source_image_dir, item)
                d = os.path.join(dest_image_dir, item)
                if os.path.isfile(s):
                    shutil.copy2(s, d)

if __name__ == "__main__":
    project_root = os.getcwd()
    docs_dir = os.path.join(project_root, 'docs')
    
    if not os.path.exists(docs_dir):
        print("Error: 'docs' directory not found.")
        sys.exit(1)
    
    copy_images(project_root, docs_dir)
    print("Image copying complete.")