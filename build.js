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

// Destaques do painel. Cada um tem um BOTÃO próprio na barra do editor —
// o cliente seleciona a palavra e clica; ele nunca digita estes marcadores.
//   **texto**   -> negrito comum   (botão N, nativo do editor)
//   [[texto]]   -> negrito AZUL    (botão A, adicionado por assets/js/admin-cores.js)
//   ((texto))   -> negrito VERMELHO(botão V, idem)
// Obs.: "**" continua sendo negrito de verdade (antes ele virava azul, o que
// impedia ter negrito comum). Os 42 destaques azuis antigos foram migrados
// para [[ ]] na mesma leva, então a aparência do site não mudou.
function applyHighlights(s) {
  return String(s)
    .replace(/\[\[(.+?)\]\]/g, '<strong class="hl">$1</strong>')
    .replace(/\(\((.+?)\)\)/g, '<strong class="hl-red">$1</strong>');
}

const ROOT = __dirname;
const OUT = path.join(ROOT, '_site');
const CONTENT_DIR = path.join(ROOT, 'content');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

// Cache-busting: gera uma "versão" do CSS/JS a partir do conteúdo do arquivo.
// Assim, quando o arquivo muda, o link muda (?v=...) e o navegador busca o novo
// na hora — sem o visitante precisar limpar cache / dar hard refresh.
const crypto = require('crypto');
function assetVersion(rel) {
  try { return crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 8); }
  catch (e) { return Date.now().toString(36); }
}
const CSS_V = assetVersion('assets/css/style.css');
const JS_V = assetVersion('assets/js/main.js');
const OG_V = assetVersion('assets/img/og-image.jpg');

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

// Filtro "pluck": [{src:'a'},{src:'b'}] -> ['a','b'].
// As listas de fotos são guardadas como objetos ({ src: ... }) para que o
// painel mostre a MINIATURA de cada foto; o carrossel precisa da lista simples.
env.addFilter('pluck', (arr, key) =>
  Array.isArray(arr) ? arr.map((it) => (it && typeof it === 'object' ? it[key] : it)) : []);

// 3) Limpa a pasta de saída
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 4) Renderiza os templates de página (templates/*.njk, ignorando _partials)
const SITE_URL = 'https://maranhaoatleticoclubebr.com.br';
const rendered = new Set();
const sitemapUrls = [];
if (fs.existsSync(TEMPLATES_DIR)) {
  for (const file of fs.readdirSync(TEMPLATES_DIR)) {
    if (file.endsWith('.njk') && !file.startsWith('_')) {
      const outName = file.replace(/\.njk$/, '.html');
      const url = SITE_URL + (outName === 'index.html' ? '/' : '/' + outName);
      const ctx = Object.assign({}, data, { site_url: SITE_URL, page: { name: outName, url } });
      let html = env.render(file, ctx);
      html = html
        .replace(/assets\/css\/style\.css/g, `assets/css/style.css?v=${CSS_V}`)
        .replace(/assets\/js\/main\.js/g, `assets/js/main.js?v=${JS_V}`)
        .replace(/assets\/img\/og-image\.jpg/g, `assets/img/og-image.jpg?v=${OG_V}`);
      fs.writeFileSync(path.join(OUT, outName), html);
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
