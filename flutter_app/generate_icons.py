import os
from PIL import Image, ImageDraw, ImageFilter

base_dir = r"d:\marketplace\flutter_app"
source_image_path = os.path.join(base_dir, "LOGO", "Gemini_Generated_Image_2h3zz82h3zz82h3z.png")

img = Image.open(source_image_path).convert("RGBA")
print(f"Source size: {img.size}")

# The logo image has a circular badge with infinity symbol.
# Let's crop/center it onto a high-res 1024x1024 master canvas.
master_size = 1024
master_icon = Image.new("RGBA", (master_size, master_size), (255, 255, 255, 255))

# Resize source to fit nicely inside 1024x1024
fitted = img.resize((master_size, master_size), Image.Resampling.LANCZOS)
master_icon.paste(fitted, (0, 0), fitted)

# 1. Save master 1024x1024 app icon
assets_dir = os.path.join(base_dir, "assets", "images")
os.makedirs(assets_dir, exist_ok=True)
master_icon.save(os.path.join(assets_dir, "app_logo.png"), "PNG")
print("Saved assets/images/app_logo.png")

# 2. Android legacy mipmaps
android_res = os.path.join(base_dir, "android", "app", "src", "main", "res")
android_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in android_sizes.items():
    folder_path = os.path.join(android_res, folder)
    os.makedirs(folder_path, exist_ok=True)
    resized = master_icon.resize((size, size), Image.Resampling.LANCZOS)
    out_path = os.path.join(folder_path, "ic_launcher.png")
    resized.save(out_path, "PNG")
    print(f"Saved {folder}/ic_launcher.png ({size}x{size})")

# 3. Android Adaptive Icon Foreground (432x432, with logo in center 66% ~ 280x280)
drawable_dir = os.path.join(android_res, "drawable")
os.makedirs(drawable_dir, exist_ok=True)

adaptive_fg = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
fg_logo_size = 288
fg_logo = master_icon.resize((fg_logo_size, fg_logo_size), Image.Resampling.LANCZOS)
offset = (432 - fg_logo_size) // 2
adaptive_fg.paste(fg_logo, (offset, offset), fg_logo)
adaptive_fg.save(os.path.join(drawable_dir, "ic_launcher_foreground.png"), "PNG")
print("Saved drawable/ic_launcher_foreground.png (432x432)")

# 4. Android mipmap-anydpi-v26/ic_launcher.xml
anydpi_dir = os.path.join(android_res, "mipmap-anydpi-v26")
os.makedirs(anydpi_dir, exist_ok=True)
xml_content = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
"""
with open(os.path.join(anydpi_dir, "ic_launcher.xml"), "w", encoding="utf-8") as f:
    f.write(xml_content)
print("Saved mipmap-anydpi-v26/ic_launcher.xml")

# 5. Android res/values/colors.xml
values_dir = os.path.join(android_res, "values")
os.makedirs(values_dir, exist_ok=True)
colors_xml = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
"""
with open(os.path.join(values_dir, "colors.xml"), "w", encoding="utf-8") as f:
    f.write(colors_xml)
print("Saved values/colors.xml")

# 6. iOS App Icons
ios_appiconset = os.path.join(base_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset")
os.makedirs(ios_appiconset, exist_ok=True)

ios_files = {
    "Icon-App-20x20@1x.png": 20,
    "Icon-App-20x20@2x.png": 40,
    "Icon-App-20x20@3x.png": 60,
    "Icon-App-29x29@1x.png": 29,
    "Icon-App-29x29@2x.png": 58,
    "Icon-App-29x29@3x.png": 87,
    "Icon-App-40x40@1x.png": 40,
    "Icon-App-40x40@2x.png": 80,
    "Icon-App-40x40@3x.png": 120,
    "Icon-App-60x60@2x.png": 120,
    "Icon-App-60x60@3x.png": 180,
    "Icon-App-76x76@1x.png": 76,
    "Icon-App-76x76@2x.png": 152,
    "Icon-App-83.5x83.5@2x.png": 167,
    "Icon-App-1024x1024@1x.png": 1024,
}

for fname, dim in ios_files.items():
    out_img = master_icon.resize((dim, dim), Image.Resampling.LANCZOS)
    out_img.convert("RGB").save(os.path.join(ios_appiconset, fname), "PNG")
    print(f"Saved iOS {fname} ({dim}x{dim})")

print("All app launcher icons generated successfully!")
