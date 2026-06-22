# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the website for **Maranhão Atlético Clube (MAC)**, a football club from Maranhão. A first version of the site is built as a **static multi-page site (plain HTML/CSS/JS, no build step)**, with layout/structure adapted from the ABR (Associação Brasileira de Rally) design mockups and re-skinned to the club's identity.

Club colors: **red and blue** (as seen in `ESCUDO MAC.PNG`). The palette is defined as CSS variables at the top of `assets/css/style.css` (`--mac-blue`, `--mac-red`, etc.).

Most text content (sponsors, board member names, project details, contact info, phone/email) is **placeholder** and meant to be replaced with real club data.

## Site Pages (from design mockups)

The PDF files in the root directory are design specs for each page:

| File | Page |
|---|---|
| `Site ABR (Págnia Inicial).pdf` | Home / Landing page |
| `Site ABR (Projetos).pdf` | Projects |
| `Site ABR (As Fotos Mudam).pdf` | Photo gallery / slideshow |
| `Site ABR (Diretoria).pdf` | Board of Directors |
| `Site ABR (Ouvidoria).pdf` | Ombudsman / Feedback channel |
| `Site ABR (Perguntas Frequentes).pdf` | FAQ |
| `Site ABR (Contato).pdf` | Contact |
| `Site ABR (Termos de Cotações).pdf` | Quotation Terms |

## Available Assets

- **`ESCUDO MAC.PNG`** — Club crest/logo (red & blue shield with "MAC" lettering)
- **`Imagens MAC/`** — 27 club photographs (IMG_*.JPG) for use in the gallery and throughout the site

## Tech Stack & Structure

Plain HTML/CSS/JS — no framework, no build step.

```
index.html              Home (Início)
projetos.html           Projects
galeria.html            Photo gallery (lightbox + rotating hero)
diretoria.html          Board of Directors
ouvidoria.html          Ombudsman (text + form)
faq.html                FAQ (accordion)
contato.html            Contact (info + form)
termos-cotacoes.html    Quotation Terms
assets/css/style.css    All styles (palette via CSS vars at top)
assets/js/main.js       Mobile menu, dropdown, FAQ accordion, lightbox, hero rotator, form handling
assets/img/             Logo (escudo-mac.png)
Imagens MAC/            27 club photos used across the site
build-pages.sh          Generator: rebuilds the 7 inner pages from a shared header/footer template
```

The header and footer are duplicated into every page. To change them globally, edit the template inside `build-pages.sh` and re-run it (this regenerates every page **except `index.html`**, which must be edited by hand to match).

## Run / Preview

No build needed. Either open `index.html` directly in a browser, or serve locally:

```bash
node .claude/server.js      # static server on http://localhost:5500
# or, if available:
python3 -m http.server 5500
```

Use a server (not file://) so the gallery `fetch`/relative paths behave like in production.

## Notes for future work

- Forms currently show a success message client-side only — connect them to an email service (Formspree, EmailJS, or a backend) for real delivery. WhatsApp link and phone/email are placeholders.
- The reference design mockups are the `Site ABR (*).pdf` files in the root (require `brew install poppler` to read programmatically).
