from PIL import Image
import os
import glob
from collections import deque

assets_dir = r"c:\Users\panca\.gemini\antigravity\scratch\santa_tracker\web\assets"
files = glob.glob(os.path.join(assets_dir, "*.png"))

print(f"Checking {len(files)} files for background removal (Flood Fill)...")

def color_distance(c1, c2):
    return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))

def flood_fill_transparency(img):
    width, height = img.size
    pixels = img.load()
    
    # Sample the top-left corner as the "background color"
    # We'll assume the corner is ALWAYS background for these assets
    bg_color = pixels[0, 0]
    
    # If already transparent, maybe start from other corners?
    # But for now, assume 0,0 is the key.
    if bg_color[3] == 0:
        return False # Already transparent

    queue = deque([(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)])
    visited = set()
    
    # Initialize queue with corners that match the background color
    valid_starts = []
    for x, y in queue:
        if color_distance(pixels[x, y], bg_color) < 30: # Tolerance of 30
            valid_starts.append((x,y))
            visited.add((x,y))
    
    queue = deque(valid_starts)

    changed = False
    while queue:
        x, y = queue.popleft()
        
        # Make transparent
        if pixels[x,y][3] != 0:
            pixels[x, y] = (0, 0, 0, 0)
            changed = True
        
        # Check neighbors
        for nx, ny in [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]:
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    # Check if neighbor matches the BACKGROUND color
                    if color_distance(pixels[nx, ny], bg_color) < 30:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
                    # Stop at edges (color difference > 30)
    
    return changed

def remove_grey_artifacts(img, tolerance=5):
    # specifically target the 157,157,157 grey from the checkerboard
    # because flood fill might fail if the white connecting squares are already gone
    pixels = img.load()
    width, height = img.size
    target = (157, 157, 157)
    changed = False
    
    for y in range(height):
        for x in range(width):
            if pixels[x,y][3] != 0:
                if color_distance(pixels[x,y], target) < tolerance:
                    pixels[x, y] = (0, 0, 0, 0)
                    changed = True
    return changed

for file_path in files:
    try:
        img = Image.open(file_path)
        img = img.convert("RGBA")
        
        c1 = flood_fill_transparency(img)
        c2 = remove_grey_artifacts(img)
        
        if c1 or c2:
            img.save(file_path, "PNG")
            print(f"Cleaned background for: {os.path.basename(file_path)}")
        else:
            print(f"No background changes for: {os.path.basename(file_path)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
