#!/bin/bash
# Gera as páginas internas a partir de um header/footer compartilhado.
# Uso: bash build-pages.sh  (rode da raiz do projeto)
set -e
cd "$(dirname "$0")"

WA_SVG='<svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.115zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>'
IG_SVG='<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>'
ML_SVG='<svg viewBox="0 0 24 24"><path d="M0 3v18h24V3H0zm21.518 2L12 12.713 2.482 5h19.036zM2 19V7.183l10 8.104 10-8.104V19H2z"/></svg>'

# $1 = arquivo, $2 = título, $3 = chave da página ativa, $4 = conteúdo <main>
make_page () {
  local FILE="$1" TITLE="$2" ACTIVE="$3" CONTENT="$4"
  # marca ativo
  local A_HIST="" A_PROJ="" A_DIR="" A_GAL="" A_FAQ="" A_CON=""
  case "$ACTIVE" in
    historia) A_HIST=' class="active"';;
    projetos) A_PROJ=' class="active"';;
    diretoria) A_DIR=' class="active"';;
    galeria) A_GAL=' class="active"';;
    faq) A_FAQ=' class="active"';;
    contato) A_CON=' class="active"';;
  esac

  cat > "$FILE" <<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${TITLE} — Maranhão Atlético Clube</title>
  <link rel="icon" type="image/png" href="assets/img/escudo-mac.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Saira+Condensed:ital,wght@0,600;0,700;1,600;1,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="brand">
        <img src="assets/img/escudo-mac.png" alt="Escudo do Maranhão Atlético Clube">
        <span class="brand-text">
          <strong>Maranhão A.C.</strong>
          <span>Atlético Clube</span>
        </span>
      </a>
      <button class="menu-toggle" aria-label="Abrir menu"><span></span><span></span><span></span></button>
      <nav class="main-nav">
        <ul>
          <li><a href="historia.html"${A_HIST}>História</a></li>
          <li><a href="projetos.html"${A_PROJ}>Projetos</a></li>
          <li class="has-dropdown"><a href="#">Transparência</a>
            <ul class="dropdown">
              <li><a href="diretoria.html">Diretoria</a></li>
              <li><a href="ouvidoria.html">Ouvidoria</a></li>
              <li><a href="termos-cotacoes.html">Termos de Cotações</a></li>
            </ul>
          </li>
          <li><a href="galeria.html"${A_GAL}>Galeria</a></li>
          <li><a href="faq.html"${A_FAQ}>Perguntas Frequentes</a></li>
          <li><a href="contato.html"${A_CON}>Contatos</a></li>
        </ul>
      </nav>
      <form class="header-search">
        <input type="text" placeholder="Buscar">
        <button type="submit" aria-label="Buscar">&#128269;</button>
      </form>
    </div>
  </header>

${CONTENT}

  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img src="assets/img/escudo-mac.png" alt="Maranhão Atlético Clube">
        <p>Promovendo o melhor do futebol maranhense com tradição, paixão e compromisso com a sua história.</p>
        <div class="footer-social">
          <a href="#" aria-label="WhatsApp">${WA_SVG}</a>
          <a href="#" aria-label="Instagram">${IG_SVG}</a>
          <a href="#" aria-label="E-mail">${ML_SVG}</a>
        </div>
      </div>
      <nav class="footer-nav">
        <a href="historia.html">História</a>
        <a href="projetos.html">Projetos</a>
        <a href="diretoria.html">Diretoria</a>
        <a href="ouvidoria.html">Ouvidoria</a>
        <a href="galeria.html">Galeria</a>
        <a href="faq.html">Perguntas Frequentes</a>
        <a href="termos-cotacoes.html">Termos de Cotações</a>
        <a href="contato.html">Contatos</a>
      </nav>
    </div>
    <div class="footer-bottom">
      <div class="container">© Maranhão Atlético Clube | 2026</div>
    </div>
  </footer>

  <a class="wa-float" href="https://wa.me/5598000000000" target="_blank" rel="noopener" aria-label="Fale conosco no WhatsApp">${WA_SVG}</a>
  <script src="assets/js/main.js"></script>
</body>
</html>
HTML
  echo "gerado: $FILE"
}

# ============================================================ PROJETOS
read -r -d '' PROJETOS <<'CONTENT' || true
  <section class="page-head">
    <div class="container"><h1 class="section-title">Projetos</h1></div>
  </section>
  <section class="section-sm">
    <div class="container">
      <div class="project-block">
        <div class="project-img"><img src="Imagens MAC/IMG_3867.JPG" alt="Categoria de base do MAC"></div>
        <div class="project-info">
          <h3>Formação de Atletas</h3>
          <p class="project-meta"><strong>Categorias:</strong> Sub-15, Sub-17 e Sub-20<br>
          <strong>Período:</strong> temporada 2026<br>
          <strong>Local:</strong> Centro de Treinamento do MAC</p>
          <p>Projeto que viabiliza a formação de jovens atletas maranhenses, oferecendo estrutura de treino, acompanhamento técnico, médico e educacional.</p>
          <p>O projeto contempla a manutenção do centro de treinamento, contratação de comissão técnica especializada, aquisição de materiais esportivos, transporte e logística para as competições estaduais e nacionais de base.</p>
        </div>
      </div>
      <div class="project-block reverse">
        <div class="project-img"><img src="Imagens MAC/IMG_5135.JPG" alt="Equipe profissional do MAC"></div>
        <div class="project-info">
          <h3>Temporada Profissional</h3>
          <p class="project-meta"><strong>Competição:</strong> Campeonato Maranhense<br>
          <strong>Período:</strong> janeiro a maio de 2026<br>
          <strong>Local:</strong> São Luís / MA</p>
          <p>Projeto que viabiliza a participação da equipe profissional do Maranhão Atlético Clube nas principais competições do calendário estadual.</p>
          <p>Contempla a montagem do elenco, comissão técnica, infraestrutura de jogos e treinos, serviços de logística e transporte, materiais esportivos e ações de relacionamento com a torcida.</p>
        </div>
      </div>
      <div class="project-block">
        <div class="project-img"><img src="Imagens MAC/IMG_4096.JPG" alt="Projeto social do MAC" style="object-position: center 18%;"></div>
        <div class="project-info">
          <h3>MAC na Comunidade</h3>
          <p class="project-meta"><strong>Público:</strong> crianças e adolescentes<br>
          <strong>Período:</strong> ações contínuas<br>
          <strong>Local:</strong> bairros de São Luís</p>
          <p>Projeto social que leva o esporte a crianças e jovens da comunidade, utilizando o futebol como ferramenta de inclusão, cidadania e desenvolvimento.</p>
          <p>Inclui escolinhas gratuitas, doação de materiais esportivos e atividades educativas, fortalecendo o vínculo do clube com a comunidade maranhense.</p>
        </div>
      </div>
    </div>
  </section>
CONTENT

# ============================================================ DIRETORIA
read -r -d '' DIRETORIA <<'CONTENT' || true
  <section class="page-head">
    <div class="container"><h1 class="section-title">Diretoria</h1></div>
  </section>
  <section class="section-sm">
    <div class="container">
      <p class="board-intro">Todos os ocupantes de cargos estatutários (diretoria executiva) são voluntários e atuam em prol do desenvolvimento do clube e do futebol maranhense.</p>
      <div class="board-list">
        <div class="board-item"><h4>Presidente</h4><p>Nome do Presidente</p></div>
        <div class="board-item"><h4>Vice-Presidente</h4><p>Nome do Vice-Presidente</p></div>
        <div class="board-item"><h4>Diretor Financeiro</h4><p>Nome do Diretor Financeiro</p></div>
        <div class="board-item"><h4>Diretor de Patrimônio</h4><p>Nome do Diretor de Patrimônio</p></div>
        <div class="board-item"><h4>Diretor de Futebol</h4><p>Nome do Diretor de Futebol</p></div>
        <div class="board-item council"><h4>Conselho Fiscal</h4><p>Membro do Conselho 1<br>Membro do Conselho 2<br>Membro do Conselho 3</p></div>
      </div>
    </div>
  </section>
CONTENT

# ============================================================ GALERIA
read -r -d '' GALERIA <<'CONTENT' || true
  <section class="hero" style="min-height:420px;">
    <img class="hero-bg" data-rotate='["Imagens MAC/IMG_3804.JPG","Imagens MAC/IMG_5052.JPG","Imagens MAC/IMG_3844.JPG","Imagens MAC/IMG_5135.JPG","Imagens MAC/IMG_4061.JPG"]' src="Imagens MAC/IMG_3804.JPG" alt="Momentos do MAC">
    <div class="hero-content"><div class="container">
      <h1>Galeria <span class="accent">MAC</span></h1>
      <p class="subtitle">Os melhores momentos do Maranhão Atlético Clube dentro e fora de campo.</p>
    </div></div>
  </section>
  <section class="section">
    <div class="container">
      <h2 class="section-title">Momentos</h2>
      <div class="gallery-grid">
GALLERY_IMAGES
      </div>
    </div>
  </section>
  <div class="lightbox"><span class="close">&times;</span><img src="" alt="Foto ampliada"></div>
CONTENT

# monta as imagens da galeria dinamicamente
GAL_IMGS=""
for f in "Imagens MAC"/*.JPG; do
  base=$(basename "$f")
  GAL_IMGS+="        <img src=\"Imagens MAC/${base}\" alt=\"Foto do MAC\">"$'\n'
done
GALERIA="${GALERIA/GALLERY_IMAGES/$GAL_IMGS}"

# ============================================================ FAQ
read -r -d '' FAQ <<'CONTENT' || true
  <section class="page-head">
    <div class="container"><h1 class="section-title">Perguntas Frequentes</h1></div>
  </section>
  <section class="section-sm">
    <div class="container">
      <div class="faq-list">
        <div class="faq-item"><button class="faq-q">Como faço para me tornar sócio do Maranhão Atlético Clube? <span class="chev">&#10095;</span></button><div class="faq-a"><p>Você pode se associar pela página de Contatos ou diretamente na sede do clube. Em breve disponibilizaremos a adesão online com diferentes planos de sócio-torcedor.</p></div></div>
        <div class="faq-item"><button class="faq-q">O MAC possui categorias de base? <span class="chev">&#10095;</span></button><div class="faq-a"><p>Sim. O clube mantém categorias de base (Sub-15, Sub-17 e Sub-20) que revelam talentos do futebol maranhense. Saiba mais na página de Projetos.</p></div></div>
        <div class="faq-item"><button class="faq-q">Como acontecem as peneiras / testes para atletas? <span class="chev">&#10095;</span></button><div class="faq-a"><p>As datas de avaliação são divulgadas nas redes sociais oficiais e no site. Fique atento à seção de notícias e ao nosso Instagram.</p></div></div>
        <div class="faq-item"><button class="faq-q">Como minha empresa pode patrocinar o clube? <span class="chev">&#10095;</span></button><div class="faq-a"><p>Temos diferentes cotas de patrocínio e parceria. Entre em contato pela página de Contatos e nossa diretoria apresentará as oportunidades disponíveis.</p></div></div>
        <div class="faq-item"><button class="faq-q">Onde compro ingressos para os jogos? <span class="chev">&#10095;</span></button><div class="faq-a"><p>Os pontos de venda e valores são divulgados antes de cada partida nos canais oficiais do clube.</p></div></div>
        <div class="faq-item"><button class="faq-q">O clube desenvolve projetos sociais? <span class="chev">&#10095;</span></button><div class="faq-a"><p>Sim. O projeto "MAC na Comunidade" leva o esporte a crianças e jovens, usando o futebol como ferramenta de inclusão e cidadania.</p></div></div>
        <div class="faq-item"><button class="faq-q">Como faço uma reclamação, sugestão ou elogio? <span class="chev">&#10095;</span></button><div class="faq-a"><p>Utilize nossa Ouvidoria, um canal direto entre o torcedor/associado e a diretoria do clube.</p></div></div>
      </div>
    </div>
  </section>
CONTENT

# ============================================================ OUVIDORIA
read -r -d '' OUVIDORIA <<'CONTENT' || true
  <section class="page-head">
    <div class="container"><h1 class="section-title">Ouvidoria</h1></div>
  </section>
  <section class="section-sm">
    <div class="container">
      <div class="form-grid">
        <div class="contact-info">
          <p style="margin-bottom:16px;">A ouvidoria do Maranhão Atlético Clube firma-se como um elo entre os associados, a Diretoria Executiva e todos os departamentos do clube.</p>
          <p style="margin-bottom:16px;">Compete ao ouvidor receber dos visitantes, funcionários e associados do clube as reclamações, as sugestões, as opiniões, as críticas ou elogios relacionados a quaisquer órgãos, departamentos ou pessoas que participem da gestão do clube.</p>
          <p style="margin-bottom:16px;">Das manifestações que dependam de informações específicas, caberá à Ouvidoria encaminhá-las aos setores responsáveis, para que apresentem os esclarecimentos necessários.</p>
          <p>O endereço eletrônico é: <a href="mailto:ouvidoria@macmaranhao.com.br">ouvidoria@macmaranhao.com.br</a></p>
        </div>
        <form class="club-form">
          <div class="form-feedback"></div>
          <div class="field"><label>Nome: <span class="req">*</span></label><input type="text" placeholder="Digite seu nome completo" required></div>
          <div class="field"><label>Celular/WhatsApp: <span class="req">*</span></label><input type="tel" placeholder="Digite seu número de celular/WhatsApp" required></div>
          <div class="field"><label>Telefone Residencial:</label><input type="tel" placeholder="Digite seu telefone residencial"></div>
          <div class="field"><label>E-mail: <span class="req">*</span></label><input type="email" placeholder="Digite seu e-mail" required></div>
          <div class="field"><label>Matrícula:</label><input type="text" placeholder="Se for associado"></div>
          <div class="field"><label>Mensagem <span class="req">*</span></label><textarea placeholder="Escreva sua dúvida, sugestão ou solicitação" required></textarea></div>
          <div><button type="submit" class="btn btn-primary">Enviar</button></div>
        </form>
      </div>
    </div>
  </section>
CONTENT

# ============================================================ CONTATO
read -r -d '' CONTATO <<'CONTENT' || true
  <section class="page-head">
    <div class="container"><h1 class="section-title">Fale Conosco</h1></div>
  </section>
  <section class="section-sm">
    <div class="container">
      <div class="form-grid">
        <div class="contact-info">
          <h3>Endereço:</h3>
          <p>Av. Exemplo, 000 — São Luís / MA</p>
          <h3>Telefone:</h3>
          <p>(98) 0000-0000 / WhatsApp</p>
          <h3>Horário de Atendimento:</h3>
          <p>De segunda a sexta / 9h às 17h<br><em>*atendimento online ou por WhatsApp</em></p>
          <h3>E-mail:</h3>
          <p><a href="mailto:contato@macmaranhao.com.br">contato@macmaranhao.com.br</a></p>
        </div>
        <form class="club-form">
          <div class="form-feedback"></div>
          <div class="field"><label>Nome: <span class="req">*</span></label><input type="text" placeholder="Digite seu nome completo" required></div>
          <div class="field"><label>E-mail: <span class="req">*</span></label><input type="email" placeholder="Digite seu e-mail" required></div>
          <div class="field"><label>Telefone: <span class="req">*</span></label><input type="tel" placeholder="Digite seu telefone" required></div>
          <div class="field"><label>Mensagem: <span class="req">*</span></label><textarea placeholder="Escreva sua mensagem" required></textarea></div>
          <div><button type="submit" class="btn btn-primary">Enviar</button></div>
        </form>
      </div>
    </div>
  </section>
CONTENT

# ============================================================ TERMOS
read -r -d '' TERMOS <<'CONTENT' || true
  <section class="page-head">
    <div class="container"><h1 class="section-title">Termos de Cotações</h1></div>
  </section>
  <section class="section-sm">
    <div class="container">
      <ul class="terms-list">
        <div class="terms-divider"></div>
        <li><a href="#">Cotações — Projeto Formação de Atletas</a></li>
        <li><a href="#">Cotações — Temporada Profissional</a></li>
        <li><a href="#">Cotações — MAC na Comunidade</a></li>
      </ul>
    </div>
  </section>
CONTENT

# ============================================================ HISTÓRIA
read -r -d '' HISTORIA <<'CONTENT' || true
  <section class="hero" style="min-height:420px;">
    <img class="hero-bg" src="Imagens MAC/IMG_5135.JPG" alt="Maranhão Atlético Clube em campo">
    <div class="hero-content"><div class="container">
      <h1>Nossa <span class="accent">História</span></h1>
      <p class="subtitle">Mais de 90 anos de tradição, conquistas e paixão pelo quadricolor de São Luís.</p>
    </div></div>
  </section>

  <section class="section">
    <div class="container">
      <p class="history-intro">O <strong>Maranhão Atlético Clube</strong> é o <strong>Bode Gregório</strong>, o quadricolor de São Luís. Fundado em <strong>24 de setembro de 1932</strong>, nasceu de uma dissidência do antigo Ciro e mostrou força desde o primeiro dia: na estreia, venceu o ex-rival por 4 a 0. Dali em diante, construiu uma das histórias mais vitoriosas do futebol maranhense.</p>

      <h2 class="section-title" style="margin-top:48px;">Linha do Tempo</h2>

      <div class="timeline">
        <div class="tl-item"><div class="tl-year">1932</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Nasce o Bode Gregório</h4><p>Fundado em 24 de setembro, o MAC estreia goleando o ex-rival por 4 a 0 — o primeiro capítulo de uma trajetória de sucesso.</p></div></div>

        <div class="tl-item"><div class="tl-year">1937</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>O primeiro título estadual</h4><p>O Maranhão conquista o Campeonato Maranhense pela primeira vez e inaugura sua era de protagonismo.</p></div></div>

        <div class="tl-item"><div class="tl-year">39 · 41 · 43</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Sequência vitoriosa</h4><p>Novas conquistas estaduais em 1939, 1941 e 1943 consolidam o clube entre os grandes do estado.</p></div></div>

        <div class="tl-item"><div class="tl-year">1951</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Campeão na década de 50</h4><p>Em meio a um período mais modesto, o MAC levanta mais uma taça maranhense.</p></div></div>

        <div class="tl-item"><div class="tl-year">1963</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>De volta ao topo</h4><p>O clube retoma a hegemonia estadual e reafirma sua tradição vencedora.</p></div></div>

        <div class="tl-item"><div class="tl-year">1979</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>A melhor campanha nacional</h4><p>Na elite do futebol brasileiro, o Maranhão fez história superando gigantes do país. (veja o destaque abaixo)</p></div></div>

        <div class="tl-item"><div class="tl-year">1986</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Vice da Série B</h4><p>O MAC chega à decisão do Campeonato Brasileiro da Série B, mostrando força no cenário nacional.</p></div></div>

        <div class="tl-item"><div class="tl-year">93 · 94 · 95</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Tricampeão maranhense</h4><p>Uma nova era de domínio: três títulos estaduais seguidos entre 1993 e 1995.</p></div></div>

        <div class="tl-item"><div class="tl-year">1999</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Mais um estadual</h4><p>O quadricolor encerra a década com nova conquista maranhense.</p></div></div>

        <div class="tl-item"><div class="tl-year">2000</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Vice da Copa Norte e Copa do Brasil</h4><p>Vice-campeão da Copa Norte, garante vaga na Copa dos Campeões. Na Copa do Brasil, alcança sua melhor campanha: a terceira fase.</p></div></div>

        <div class="tl-item"><div class="tl-year">2007</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Campeão maranhense</h4><p>O MAC volta a erguer a taça estadual no novo século.</p></div></div>

        <div class="tl-item"><div class="tl-year">2013</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Mais um título estadual</h4><p>Nova conquista reafirma a tradição vencedora do clube.</p></div></div>

        <div class="tl-item"><div class="tl-year">2015</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Reação imediata</h4><p>Após o rebaixamento em 2014, o Maranhão conquista a Série B estadual e retorna à elite.</p></div></div>

        <div class="tl-item"><div class="tl-year">2022</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>De volta à elite</h4><p>Mais uma vez resiliente, o clube é campeão da Série B estadual e volta à primeira divisão.</p></div></div>

        <div class="tl-item"><div class="tl-year">2023</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>Campeão maranhense</h4><p>O Bode Gregório volta a erguer o Campeonato Maranhense.</p></div></div>

        <div class="tl-item"><div class="tl-year">2025</div><div class="tl-mid"><span class="tl-dot"></span></div>
          <div class="tl-content"><h4>O 18º título maranhense</h4><p>A tradição confirmada: o MAC conquista seu 18º Campeonato Maranhense.</p></div></div>
      </div>

      <div class="feature-1979">
        <span class="tag">Auge nacional</span>
        <h3>1979: o Maranhão na elite do Brasil</h3>
        <p>Foi em 1979 que o clube alcançou a sua melhor campanha na história: disputou a Primeira Divisão do Campeonato Brasileiro e terminou em 26º entre quase 100 equipes, superando camisas pesadas como <strong>Fluminense, Bahia e Botafogo</strong>.</p>
        <div class="mini-stats">
          <div><span>8</span><small>Vitórias</small></div>
          <div><span>3</span><small>Empates</small></div>
          <div><span>5</span><small>Derrotas</small></div>
          <div><span>26º</span><small>Entre ~100 clubes</small></div>
        </div>
      </div>

      <div class="history-block">
        <h3>Estádios</h3>
        <p>O MAC manda a maior parte de seus jogos no <strong>Estádio Nhozinho Santos</strong> e utiliza o <strong>Castelão</strong> nas partidas de maior demanda — ambos em São Luís.</p>

        <h3>Torcida e Rivalidades</h3>
        <p>O clube tem uma das maiores torcidas do estado e é apontado como o terceiro mais popular da capital, com rivalidades históricas contra <strong>Moto Club</strong> e <strong>Sampaio Corrêa</strong>.</p>

        <h3>Quem somos hoje</h3>
        <p>Tradição, camisa quadricolor e presença constante nas decisões. O Maranhão Atlético Clube segue como pilar do futebol maranhense: competitivo no estadual, ativo no calendário nacional e sustentado por uma torcida que atravessa gerações. É o Bode Gregório em campo — resistência, paixão e resultado, com história para contar e ambição para seguir crescendo.</p>
      </div>
    </div>
  </section>
CONTENT

make_page "historia.html"        "Nossa História"      "historia"  "$HISTORIA"
make_page "projetos.html"        "Projetos"             "projetos"  "$PROJETOS"
make_page "diretoria.html"       "Diretoria"            "diretoria" "$DIRETORIA"
make_page "galeria.html"         "Galeria"              "galeria"   "$GALERIA"
make_page "faq.html"             "Perguntas Frequentes" "faq"       "$FAQ"
make_page "ouvidoria.html"       "Ouvidoria"            ""          "$OUVIDORIA"
make_page "contato.html"         "Contatos"             "contato"   "$CONTATO"
make_page "termos-cotacoes.html" "Termos de Cotações"   ""          "$TERMOS"

echo "OK — páginas geradas."
