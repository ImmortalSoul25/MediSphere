from PIL import Image, ImageDraw, ImageFont

def create_default_avatar():
    img = Image.new('RGB', (300, 300), color=(226, 232, 240)) # slate-200
    d = ImageDraw.Draw(img)
    # Draw a simple generic person silhouette
    d.ellipse((100, 50, 200, 150), fill=(148, 163, 184)) # slate-400
    d.ellipse((50, 160, 250, 400), fill=(148, 163, 184))
    img.save("profile_photos/default.png")

if __name__ == "__main__":
    create_default_avatar()
