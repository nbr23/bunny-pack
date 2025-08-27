#! /bin/bash

if ! command -v inkscape &> /dev/null; then
    echo "Error: Inkscape is required but not installed."
    exit 1
fi

if [ ! -f "./icons/icon.svg" ]; then
    echo "Error: ./icons/icon.svg not found"
    exit 1
fi


echo "Generating icons from ./icons/icon.svg..."

sizes=(32 48 64 128)
for size in "${sizes[@]}"; do
    echo "Generating ${size}x${size} icon..."
    inkscape --export-type=png --export-width=$size --export-height=$size --export-filename=./icons/icon_${size}.png ./icons/icon.svg
done

echo "Icons generated successfully!"
