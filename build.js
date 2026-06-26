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
const { marked } = require('marked');

// Negrito (**texto**) vira destaque azul da marca (<strong class="hl">)
marked.use({
  renderer: {
    strong(text) {
      const t = (typeof text === 'object') ? (text.text ?? text.raw ?? '') : text;
      return `<strong class="hl">${t}</strong>`;
    }
  }
});

// Destaques de cor por marcadores simples (fáceis para quem edita no painel):
//   **azul**       -> negrito AZUL    (botão Negrito)
//   ((vermelho))   -> negrito VERMELHO
//   [[preto]]      -> negrito PRETO
function applyHighlights(s) {
  return String(s)
    .replace(/\[\[(.+?)\]\]/g, '<strong class="hl-black">$1</strong>')
    .replace(/\(\((.+?)\)\)/g, '<strong class="hl-red">$1</strong>');
}

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

// Filtro "md": converte negrito/itálico/links (markdown em linha) para HTML
env.addFilter('md', (s) => (s ? marked.parseInline(applyHighlights(String(s))) : ''));

// 3) Limpa a pasta de saída
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 4) Renderiza os templates de página (templates/*.njk, ignorando _partials)
const SITE_URL = 'https://maranhaoatleticoclube.netlify.app';
const rendered = new Set();
const sitemapUrls = [];
if (fs.existsSync(TEMPLATES_DIR)) {
  for (const file of fs.readdirSync(TEMPLATES_DIR)) {
    if (file.endsWith('.njk') && !file.startsWith('_')) {
      const outName = file.replace(/\.njk$/, '.html');
      const url = SITE_URL + (outName === 'index.html' ? '/' : '/' + outName);
      const ctx = Object.assign({}, data, { site_url: SITE_URL, page: { name: outName, url } });
      fs.writeFileSync(path.join(OUT, outName), env.render(file, ctx));
      rendered.add(outName);
      if (outName !== '404.html') sitemapUrls.push(url);
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

// 8) Gera sitemap.xml e robots.txt
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  sitemapUrls.map(u => `  <url><loc>${u}</loc></url>`).join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const totalPages = fs.readdirSync(OUT).filter(f => f.endsWith('.html')).length;
console.log(`Build OK — ${rendered.size} página(s) gerada(s) de templates, ${totalPages} HTML no total em _site/ (+ sitemap.xml, robots.txt)`);
