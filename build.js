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
// Endereço público do site. Fica aqui em cima porque as matérias precisam dele
// para montar o endereço absoluto da foto de capa (o WhatsApp e o Google não
// aceitam caminho relativo na hora de mostrar a prévia).
const SITE_URL = 'https://maranhaoatleticoclubebr.com.br';
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

// 1.1) Carrega as MATÉRIAS (content/noticias/*.md).
//
// Cada matéria é um arquivo próprio, criado pelo painel, com um cabeçalho
// entre "---" (título, data, categoria...) e o texto em markdown embaixo.
// Diferente do resto do site, aqui o número de páginas varia: o build gera
// uma página por matéria.
const NOTICIAS_DIR = path.join(CONTENT_DIR, 'noticias');

function lerCabecalho(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { dados: {}, corpo: texto };
  return { dados: yaml.load(m[1]) || {}, corpo: m[2] };
}

function dataISO(v) {
  if (!v) return '';
  return (v instanceof Date) ? v.toISOString().slice(0, 10) : String(v).trim().slice(0, 10);
}

const noticias = [];
if (fs.existsSync(NOTICIAS_DIR)) {
  for (const file of fs.readdirSync(NOTICIAS_DIR)) {
    if (!/\.md$/i.test(file)) continue;
    const { dados, corpo } = lerCabecalho(fs.readFileSync(path.join(NOTICIAS_DIR, file), 'utf8'));
    if (dados.draft) continue; // rascunho não vai para o site
    const slug = file.replace(/\.md$/i, '');
    noticias.push({
      ...dados,
      slug,
      url: `noticia-${slug}.html`,  // nome do arquivo gerado
      link: `noticia-${slug}`,      // endereço usado nos links (ver urlPublica)
      // Endereço completo da foto de capa. O painel grava caminho relativo,
      // mas prévia de WhatsApp e dado estruturado do Google exigem absoluto.
      image_url: dados.image ? `${SITE_URL}/${String(dados.image).replace(/^\/+/, '')}` : '',
      date: dataISO(dados.date),
      corpo,
    });
  }
  // Mais recentes primeiro
  noticias.sort((a, b) => String(b.date).localeCompare(String(a.date)));
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

// Filtro "data": o painel grava a data como 2026-03-15; o site mostra 15/03/2026.
// (Aceita também Date, que é como o js-yaml lê datas sem aspas.)
env.addFilter('data', (v) => {
  if (!v) return '';
  const iso = (v instanceof Date) ? v.toISOString().slice(0, 10) : String(v).trim();
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
});

// Filtro "markdown": texto longo (corpo das matérias) com parágrafos e listas.
// O filtro "md" é só para uma linha; este converte o texto inteiro.
env.addFilter('markdown', (s) => (s ? marked.parse(applyHighlights(String(s))) : ''));

// Filtro "resumo": corta o texto para a prévia dos cartões, sem cortar palavra.
// Tira também os marcadores de destaque ([[azul]] e ((vermelho))) e a
// marcação de markdown — no cartão vale só o texto limpo.
env.addFilter('resumo', (s, n) => {
  const limpo = String(s || '')
    .replace(/\[\[(.+?)\]\]/g, '$1')     // [[azul]] -> azul
    .replace(/\(\((.+?)\)\)/g, '$1')     // ((vermelho)) -> vermelho
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links e imagens -> só o texto
    .replace(/[#*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const max = n || 150;
  if (limpo.length <= max) return limpo;
  const corte = limpo.lastIndexOf(' ', max);
  return limpo.slice(0, corte > 0 ? corte : max) + '…';
});

// Filtro "jsonld": transforma um objeto em dados estruturados para o Google.
//
// Não usa o `dump` do Nunjucks porque ele não protege contra um "</script>"
// dentro de um título de matéria — bastaria isso para o navegador achar que o
// bloco acabou e o resto da página virar texto solto. Escapar o "<" resolve, e
// continua sendo JSON válido.
//
// Chaves vazias são removidas: schema com campo em branco atrapalha mais do
// que ajuda, e o cliente vai deixar campo vazio de vez em quando.
env.addFilter('jsonld', (obj) => {
  const limpar = (v) => {
    if (Array.isArray(v)) {
      const arr = v.map(limpar).filter((x) => x !== undefined);
      return arr.length ? arr : undefined;
    }
    if (v && typeof v === 'object') {
      const o = {};
      for (const [k, val] of Object.entries(v)) {
        const lv = limpar(val);
        if (lv !== undefined) o[k] = lv;
      }
      return Object.keys(o).length ? o : undefined;
    }
    if (v === null || v === undefined || v === '') return undefined;
    return v;
  };
  return JSON.stringify(limpar(obj) || {}).replace(/</g, '\\u003c');
});

// 3) Limpa a pasta de saída
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 4) Renderiza os templates de página (templates/*.njk, ignorando _partials)
const rendered = new Set();
const sitemapUrls = [];
// Aplica o cache-busting e grava a página.
/**
 * Endereço público de uma página, a partir do nome do arquivo.
 *
 * A Cloudflare Pages atende "contato.html" em "/contato" e redireciona quem
 * pede com .html (308). Por isso o canonical, o sitemap e os links do site
 * usam a forma sem .html: se o canonical apontasse para /contato.html, a
 * página estaria declarando como canônica uma URL que redireciona, e o Google
 * receberia dois sinais brigando entre si.
 *
 * A forma sem .html também responde 200 na Netlify, então isto não impede
 * voltar para lá se precisar.
 */
function urlPublica(outName) {
  if (outName === 'index.html') return '/';
  return '/' + outName.replace(/\.html$/, '');
}

function gravar(outName, html, { noSitemap, lastmod } = {}) {
  html = html
    .replace(/assets\/css\/style\.css/g, `assets/css/style.css?v=${CSS_V}`)
    .replace(/assets\/js\/main\.js/g, `assets/js/main.js?v=${JS_V}`)
    .replace(/assets\/img\/og-image\.jpg/g, `assets/img/og-image.jpg?v=${OG_V}`);
  fs.writeFileSync(path.join(OUT, outName), html);
  rendered.add(outName);
  if (!noSitemap && outName !== '404.html') {
    sitemapUrls.push({ loc: SITE_URL + urlPublica(outName), lastmod });
  }
}

if (fs.existsSync(TEMPLATES_DIR)) {
  for (const file of fs.readdirSync(TEMPLATES_DIR)) {
    if (file.endsWith('.njk') && !file.startsWith('_')) {
      const outName = file.replace(/\.njk$/, '.html');
      const url = SITE_URL + urlPublica(outName);
      const ctx = Object.assign({}, data, { noticias, site_url: SITE_URL, page: { name: outName, url } });
      gravar(outName, env.render(file, ctx));
    }
  }
}

// 4.1) Uma página para cada matéria (templates/_artigo.njk).
//
// As páginas ficam na RAIZ, como "noticia-<slug>.html", de propósito: o
// cabeçalho e o rodapé usam caminhos relativos (assets/…, index.html), que
// quebrariam dentro de uma subpasta. Assim nenhuma página existente precisa
// ser mexida.
if (noticias.length && fs.existsSync(path.join(TEMPLATES_DIR, '_artigo.njk'))) {
  for (const n of noticias) {
    const ctx = Object.assign({}, data, {
      noticias,
      noticia: n,
      site_url: SITE_URL,
      page: { name: n.url, url: SITE_URL + urlPublica(n.url) },
    });
    gravar(n.url, env.render('_artigo.njk', ctx), { lastmod: n.date });
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

// 6.1) Encolhe fotos grandes ANTES de publicar.
//
// Quem edita o site sobe foto direto do celular/câmera — imagens de 6000px e
// 6 MB para aparecer num card de poucos centímetros. Isso já estourou a cota
// da Netlify uma vez (a página do Elenco chegou a baixar 50 MB por visita) e
// deixa o site impraticável no 4G. Aqui, qualquer foto acima do limite é
// reduzida na hora de gerar o site.
//
// IMPORTANTE: mexe só no que vai para _site/. Os arquivos originais do
// projeto ficam intactos — dá para voltar atrás a qualquer momento.
const LIMITES = [
  { pasta: 'assets/img/elenco', lado: 900 },     // cards de jogador
  { pasta: 'assets/img/diretoria', lado: 900 },  // cards da diretoria
  { pasta: '', lado: 1600 },                     // demais (galeria, banners)
];
const MIN_BYTES = 400 * 1024; // abaixo disso não compensa mexer

function limiteDe(rel) {
  const r = rel.split(path.sep).join('/');
  return (LIMITES.find((l) => l.pasta && r.startsWith(l.pasta)) || LIMITES[LIMITES.length - 1]).lado;
}

let sharp = null;
try { sharp = require('sharp'); } catch (e) {
  console.warn('AVISO: sharp indisponível — as fotos vão para o site no tamanho original.');
}

async function encolherFotos() {
  if (!sharp) return;
  const fotos = [];
  (function varre(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) varre(p);
      else if (/\.(jpe?g|png)$/i.test(e.name) && fs.statSync(p).size > MIN_BYTES) fotos.push(p);
    }
  })(OUT);

  let ganho = 0, n = 0;
  for (const p of fotos) {
    const rel = path.relative(OUT, p);
    try {
      const antes = fs.statSync(p).size;
      const buf = await sharp(p)
        .rotate() // respeita a orientação da câmera
        .resize({ width: limiteDe(rel), height: limiteDe(rel), fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      if (buf.length < antes) {
        fs.writeFileSync(p, buf);
        ganho += antes - buf.length;
        n++;
      }
    } catch (e) {
      // Uma foto problemática não pode derrubar o build: segue com a original.
      console.warn(`AVISO: não consegui encolher ${rel} — ${e.message}`);
    }
  }
  if (n) console.log(`Fotos otimizadas: ${n} (${(ganho / 1048576).toFixed(1)} MB a menos para o visitante baixar)`);
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
  sitemapUrls.map(u =>
    `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
  ).join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// 8.1) Arquivos que a Cloudflare Pages lê do site pronto
//
// _routes.json diz em quais endereços a função de formulário deve rodar.
// Sem ele a Cloudflare gera um automático que roda a função em tudo, e aí
// cada foto e cada CSS vira "requisição dinâmica" (limitada) em vez de
// "requisição estática" (ilimitada e grátis). Só /api/ precisa de função.
fs.writeFileSync(path.join(OUT, '_routes.json'), JSON.stringify({
  version: 1,
  include: ['/api/*'],
  exclude: [],
}, null, 2) + '\n');

// _headers: cache eterno SÓ para CSS e JS, que saem daqui com impressão
// digital no endereço (style.css?v=05214f94) — trocou o arquivo, troca o
// endereço, o navegador busca de novo.
//
// As fotos ficam de fora de propósito. Elas não têm versão no nome, e o
// cliente troca foto pelo painel mantendo o mesmo arquivo: com cache longo,
// o torcedor continuaria vendo a foto antiga por meses. Aqui a banda é
// ilimitada e grátis, então não vale trocar acerto por economia.
fs.writeFileSync(path.join(OUT, '_headers'),
  [
    '/assets/css/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/assets/js/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '',
  ].join('\n'));

// 9) Encolhe as fotos grandes e encerra
encolherFotos()
  .catch((e) => console.warn('AVISO: otimização de fotos falhou —', e.message))
  .then(() => {
    const totalPages = fs.readdirSync(OUT).filter(f => f.endsWith('.html')).length;
    console.log(`Build OK — ${rendered.size} página(s) gerada(s) de templates, ${totalPages} HTML no total em _site/ (+ sitemap.xml, robots.txt)`);
  });
