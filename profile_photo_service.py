import os
from io import BytesIO
from PIL import Image

PHOTOS_DIR = "profile_photos"
DEFAULT_PHOTO = os.path.join(PHOTOS_DIR, "default.png")

def save_photo(patient_id: str, file_bytes: bytes) -> str:
    """
    Resizes image to 300x300 while maintaining aspect ratio,
    compresses it, and saves as JPG.
    """
    if not os.path.exists(PHOTOS_DIR):
        os.makedirs(PHOTOS_DIR)

    image = Image.open(BytesIO(file_bytes))
    
    # Convert to RGB if it's RGBA or P
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
        
    # Resize keeping aspect ratio, max 300x300
    image.thumbnail((300, 300), Image.Resampling.LANCZOS)
    
    # Force crop to square 300x300
    width, height = image.size
    new_size = min(width, height)
    left = (width - new_size) / 2
    top = (height - new_size) / 2
    right = (width + new_size) / 2
    bottom = (height + new_size) / 2
    image = image.crop((left, top, right, bottom))
    image = image.resize((300, 300), Image.Resampling.LANCZOS)

    save_path = os.path.join(PHOTOS_DIR, f"{patient_id}.jpg")
    image.save(save_path, format="JPEG", quality=85)
    return save_path

def get_photo_path(patient_id: str) -> str:
    """
    Returns the path to the patient's photo if it exists,
    otherwise returns the default photo path.
    """
    path = os.path.join(PHOTOS_DIR, f"{patient_id}.jpg")
    if os.path.exists(path):
        return path
    return DEFAULT_PHOTO

def delete_photo(patient_id: str) -> bool:
    """
    Deletes the patient's custom photo if it exists.
    Returns True if deleted, False otherwise.
    """
    path = os.path.join(PHOTOS_DIR, f"{patient_id}.jpg")
    if os.path.exists(path):
        os.remove(path)
        return True
    return False
