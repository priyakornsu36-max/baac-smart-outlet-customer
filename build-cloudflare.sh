#!/usr/bin/env sh
# Cloudflare Pages: build command "sh build-cloudflare.sh", output directory "dist"
set -eu
rm -rf dist
mkdir -p dist
find . -maxdepth 1 -type f \( \
  -name '*.html' -o -name '*.css' -o -name '*.js' -o \
  -name '*.webmanifest' -o -name '*.svg' -o -name '*.png' -o \
  -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' -o -name '*.ico' \
\) -exec cp {} dist/ \;
cp _headers dist/_headers
cp _redirects dist/_redirects
if [ -f .well-known/assetlinks.json ]; then
  mkdir -p dist/.well-known
  cp .well-known/assetlinks.json dist/.well-known/assetlinks.json
fi
test -f dist/index.html
test -f dist/install.html
test -f dist/manifest.webmanifest
test -f dist/sw.js
echo "BAAC SMART OUTLET static PWA ready for Cloudflare Pages"
