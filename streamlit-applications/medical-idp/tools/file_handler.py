
class FileHandler:
    def __init__(self, file_util):
        self.file_util = file_util

    def download_application_package_from_s3(self, input_data):
        """Download file from S3"""
        temp_file_path = self.file_util.unzip_from_s3(input_data['source_bucket'], input_data['source_key'])
        return [temp_file_path]

    def pdf_to_images(self, input_data):
        """Convert PDF to images"""
        return self.file_util.save_pdf_pages_as_png(input_data['pdf_path'])

    def get_binary_for_file(self, file_path):
        """Get binary data for a file"""
        binary_data = ""
        
        if file_path.endswith('.pdf'):
            binary_data = self.file_util.pdf_to_png_bytes(file_path)
            media_type = "png"
        elif file_path.endswith(('.jpeg', '.jpg', '.png')):
            binary_data, media_type = self.file_util.image_to_base64(file_path)
        else:
            binary_data, media_type = None, None
        return binary_data, media_type

    def clean_up_tool(self, input_data):
        """Clean up temporary files"""
        temp_folder_path = input_data['temp_folder_path']
        self.file_util.delete_folder(temp_folder_path)
        return

    def generate_temp_folder_name(self, length=5):
        """Generate a temporary folder name"""
        return self.file_util.generate_temp_folder_name(length)
