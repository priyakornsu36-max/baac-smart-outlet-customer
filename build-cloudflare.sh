#!/usr/bin/env sh
# Cloudflare Pages: build command "sh build-cloudflare.sh", output directory "dist"
set -eu
mkdir -p dist
find . -maxdepth 1 -type f \( \
  -name '*.html' -o -name '*.css' -o -name '*.js' -o \
  -name '*.webmanifest' -o -name '*.svg' -o -name '*.png' -o \
  -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.ico' \
\) -exec cp {} dist/ \;
cp _headers dist/_headers
test -f dist/index.html
test -f dist/install.html
test -f dist/manifest.webmanifest
test -f dist/sw.js
echo "BAAC SMART OUTLET static PWA ready for Cloudflare Pages"
