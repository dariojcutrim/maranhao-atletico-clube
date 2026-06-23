/* ===================================================================
   Build do site do Maranhão Atlético Clube.
   Lê o conteúdo editável de content/*.yaml, renderiza os templates
   de templates/*.njk e monta a pasta _site/ (que a Netlify publica).
   Páginas ainda não migradas (root *.html) são copiadas como estão.
   =================================================================== */
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const yaml = require('js-yaml');

const ROOT = __dirname;
const OUT = path.join(ROOT, '_site');
const CONTENT_DIR = path.join(ROOT, 'content');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

// 1) Carrega todo o conteúdo editável (content/<nome>.yaml -> data.<nome>)
const data = {};
if (fs.existsSync(CONTENT_DIR)) {
  for (const file of fs.readdirSync(CONTENT_DIR)) {
    if (/\.ya?ml$/i.test(file)) {
      const key = file.replace(/\.ya?ml$/i, '');
      data[key] = yaml.load(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8')) || {};
    }
  }
}

// 2) Configura o Nunjucks
const env = nunjucks.configure(TEMPLATES_DIR, { autoescape: true, noCache: true });

// 3) Limpa a pasta de saída
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 4) Renderiza os templates de página (templates/*.njk, ignorando _partials)
const rendered = new Set();
if (fs.existsSync(TEMPLATES_DIR)) {
  for (const file of fs.readdirSync(TEMPLATES_DIR)) {
    if (file.endsWith('.njk') && !file.startsWith('_')) {
      const outName = file.replace(/\.njk$/, '.html');
      fs.writeFileSync(path.join(OUT, outName), env.render(file, data));
      rendered.add(outName);
    }
  }
}

// 5) Copia páginas ainda não migradas (root *.html que não foram renderizadas)
for (const file of fs.readdirSync(ROOT)) {
  if (file.endsWith('.html') && !rendered.has(file)) {
    fs.copyFileSync(path.join(ROOT, file), path.join(OUT, file));
  }
}

// 6) Copia pastas estáticas
for (const dir of ['assets', 'Imagens MAC', 'admin']) {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(OUT, dir), { recursive: true });
}

// 7) Remove .DS_Store que tenha entrado
(function clean(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) clean(p);
    else if (e.name === '.DS_Store') fs.rmSync(p);
  }
})(OUT);

const totalPages = fs.readdirSync(OUT).filter(f => f.endsWith('.html')).length;
console.log(`Build OK — ${rendered.size} página(s) gerada(s) de templates, ${totalPages} HTML no total em _site/`);
