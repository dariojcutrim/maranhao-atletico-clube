#!/usr/bin/env bash
# Monta a pasta de publicação (_site) apenas com os arquivos do site,
# deixando de fora arquivos de desenvolvimento (build-pages.sh, CLAUDE.md, etc.).
set -e
cd "$(dirname "$0")"

rm -rf _site
mkdir -p _site

cp *.html _site/
cp -R assets _site/
cp -R "Imagens MAC" _site/

# remove qualquer .DS_Store que tenha entrado
find _site -name ".DS_Store" -delete 2>/dev/null || true

echo "Publicação montada em _site/ ($(ls _site/*.html | wc -l | tr -d ' ') páginas)"
