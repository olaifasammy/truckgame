import json
import struct
from pathlib import Path

path = Path("public/models/trucks/scania-test.glb")

if not path.exists():
    raise SystemExit(f"Model not found: {path}")

with path.open("rb") as f:
    magic, version, total_length = struct.unpack("<4sII", f.read(12))

    if magic != b"glTF":
        raise SystemExit("Invalid GLB file")

    document = None

    while f.tell() < total_length:
        chunk_length, chunk_type = struct.unpack("<II", f.read(8))
        chunk = f.read(chunk_length)

        if chunk_type == 0x4E4F534A:
            document = json.loads(chunk.decode("utf-8"))
            break

if document is None:
    raise SystemExit("GLB JSON chunk not found")

accessors = document.get("accessors", [])
meshes = document.get("meshes", [])
nodes = document.get("nodes", [])
materials = document.get("materials", [])
textures = document.get("textures", [])
images = document.get("images", [])
animations = document.get("animations", [])

print("\n========== TRUCK MODEL INSPECTION ==========")
print("File:", path.name)
print("Size:", round(path.stat().st_size / 1024 / 1024, 2), "MB")
print("GLB version:", version)

mesh_count = 0
vertex_count = 0

print("\n--- MESHES ---")
for mesh in meshes:
    print("\nMesh:", mesh.get("name", "Unnamed"))

    for primitive in mesh.get("primitives", []):
        mesh_count += 1
        accessor_id = primitive.get("attributes", {}).get("POSITION")
        vertices = accessors[accessor_id].get("count", 0) if accessor_id is not None else 0
        vertex_count += vertices

        print(" Vertices:", vertices)
        print(" Material:", primitive.get("material", "None"))

print("\nMesh primitives:", mesh_count)
print("Total vertices:", vertex_count)

print("\n--- NODES ---")
for index, node in enumerate(nodes):
    print(index, node.get("name", "Unnamed"),
          "| Mesh:", node.get("mesh", "None"),
          "| Children:", node.get("children", []))

print("\n--- MATERIALS ---")
for material in materials:
    print("-", material.get("name", "Unnamed"))

print("\n--- TEXTURES ---")
print("Textures:", len(textures))
print("Images:", len(images))

for image in images:
    print("-", image.get("name", "Unnamed"),
          "| MIME:", image.get("mimeType", "Unknown"))

print("\n--- ANIMATIONS ---")
for animation in animations:
    print("-", animation.get("name", "Unnamed"))

if not animations:
    print("No animations found.")

print("\n========== INSPECTION COMPLETE ==========")
