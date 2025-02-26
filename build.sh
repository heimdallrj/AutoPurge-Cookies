#!/bin/bash

# Set up directories
BUILD_DIR="dist"
SRC_DIR="src"

# Remove existing dist folder if it exists
rm -rf "$BUILD_DIR"

# Recreate the dist structure
mkdir -p "$BUILD_DIR/firefox"
mkdir -p "$BUILD_DIR/chrome"

# Copy source files
cp -r "$SRC_DIR/" "$BUILD_DIR/firefox/"
cp -r "$SRC_DIR/" "$BUILD_DIR/chrome/"

# Read version from manifest.json
VERSION=$(jq -r '.version' "$SRC_DIR/manifest.json")

# Modify manifest.json for Chrome
jq '
  .manifest_version = 3 |
  .permissions = ["cookies", "storage", "tabs"] |
  . + { "host_permissions": ["<all_urls>"] } |
  .background = { "service_worker": "background.js" } |
  if .browser_action then
    .action = .browser_action | del(.browser_action)
  else
    .
  end
' "$SRC_DIR/manifest.json" > "$BUILD_DIR/chrome/manifest.json"

# Rename directories with version number
mv "$BUILD_DIR/firefox" "$BUILD_DIR/firefox_$VERSION"
mv "$BUILD_DIR/chrome" "$BUILD_DIR/chrome_$VERSION"

# Convert .gitignore into zip exclusion pattern
EXCLUDE_PATTERN=()
if [ -f ".gitignore" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue  # Skip comments and empty lines
    EXCLUDE_PATTERN+=("-x" "$line")
  done < ".gitignore"
fi

# Create zip files, applying exclusion patterns dynamically
cd "$BUILD_DIR"
zip -r "firefox_$VERSION.zip" "firefox_$VERSION"/* "${EXCLUDE_PATTERN[@]}"
zip -r "chrome_$VERSION.zip" "chrome_$VERSION"/* "${EXCLUDE_PATTERN[@]}"
cd ..

# Cleanup: Remove extracted directories
rm -rf "$BUILD_DIR/firefox_$VERSION" "$BUILD_DIR/chrome_$VERSION"

echo "Build and packaging completed successfully!"
