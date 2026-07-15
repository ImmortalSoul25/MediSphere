import io
from PIL import Image, ImageDraw, ImageFont
import bson
from database import profile_photos_collection

async def save_photo(patient_id: str, file_bytes: bytes) -> bool:
    """
    Resizes image to 300x300 while maintaining aspect ratio,
    compresses it, and saves it to MongoDB.
    """
    image = Image.open(io.BytesIO(file_bytes))
    
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
    
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG', quality=85)
    binary_data = bson.Binary(img_byte_arr.getvalue())
    
    await profile_photos_collection.update_one(
        {"patient_id": patient_id},
        {"$set": {"image_data": binary_data}},
        upsert=True
    )
    return True

async def get_photo_bytes(patient_id: str) -> bytes:
    """
    Returns the binary bytes of the patient's photo if it exists,
    otherwise returns a dynamically generated default photo.
    """
    doc = await profile_photos_collection.find_one({"patient_id": patient_id})
    if doc and "image_data" in doc:
        return doc["image_data"]
    
    # Generate default profile picture dynamically
    img = Image.new('RGB', (300, 300), color=(241, 245, 249)) # Tailwind slate-100
    draw = ImageDraw.Draw(img)
    # Draw a simple user silhouette
    draw.ellipse((100, 60, 200, 160), fill=(148, 163, 184)) # Tailwind slate-400
    draw.ellipse((50, 180, 250, 380), fill=(148, 163, 184))
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

async def delete_photo(patient_id: str) -> bool:
    """
    Deletes the patient's custom photo if it exists.
    Returns True if deleted, False otherwise.
    """
    result = await profile_photos_collection.delete_one({"patient_id": patient_id})
    return result.deleted_count > 0
