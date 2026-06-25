/* ===================================================================
   Maranhão Atlético Clube — interações
   =================================================================== */
document.addEventListener('DOMContentLoaded', function () {

  /* ---- Menu mobile ---- */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.classList.toggle('active');
    });
  }

  /* ---- Dropdown no mobile (clique) ---- */
  document.querySelectorAll('.has-dropdown > a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 980) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });

  /* ---- Acordeão FAQ ---- */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const answer = item.querySelector('.faq-a');
      const isOpen = item.classList.contains('open');
      // fecha os outros
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open');
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 40 + 'px';
    });
  });

  /* ---- Lightbox da galeria ---- */
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    document.querySelectorAll('.gallery-grid img').forEach(img => {
      img.addEventListener('click', () => {
        lbImg.src = img.src;
        lightbox.classList.add('open');
      });
    });
    const close = () => lightbox.classList.remove('open');
    lightbox.querySelector('.close').addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Carrossel do hero (cross-fade) ---- */
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1 && !reduceMotion) {
    let idx = 0;
    setInterval(() => {
      slides[idx].classList.remove('is-active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('is-active');
    }, 4500);
  }

  /* ---- Reveal ao rolar (IntersectionObserver) ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('visible'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ---- Contagem crescente dos números (ao entrar na tela) ---- */
  const counters = document.querySelectorAll('.count[data-count]');
  if (counters.length) {
    const finalText = (el) => (el.getAttribute('data-prefix') || '') + el.getAttribute('data-count');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(el => { el.textContent = finalText(el); });
    } else {
      const animateCount = (el) => {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const prefix = el.getAttribute('data-prefix') || '';
        const duration = 1400;
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out
          el.textContent = prefix + Math.round(eased * target);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = prefix + target;
        };
        requestAnimationFrame(step);
      };
      counters.forEach(el => { el.textContent = (el.getAttribute('data-prefix') || '') + '0'; });
      const countObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(el => countObserver.observe(el));
    }
  }

  /* ---- Hero com fotos que mudam ---- */
  const heroRotator = document.querySelector('[data-rotate]');
  if (heroRotator) {
    const imgs = JSON.parse(heroRotator.getAttribute('data-rotate'));
    let i = 0;
    setInterval(() => {
      i = (i + 1) % imgs.length;
      heroRotator.style.opacity = 0;
      setTimeout(() => {
        heroRotator.src = imgs[i];
        heroRotator.style.opacity = 1;
      }, 350);
    }, 4000);
    heroRotator.style.transition = 'opacity 0.35s ease';
  }

  /* ---- Envio de formulários (Netlify Forms, via AJAX) ---- */
  document.querySelectorAll('.club-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const feedback = form.querySelector('.form-feedback');
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Enviando...'; }
      const body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
        .then((res) => {
          if (!res.ok) throw new Error('falha');
          if (feedback) {
            feedback.classList.add('show');
            feedback.classList.remove('error');
            feedback.textContent = 'Mensagem enviada com sucesso! Em breve entraremos em contato.';
          }
          form.reset();
        })
        .catch(() => {
          if (feedback) {
            feedback.classList.add('show', 'error');
            feedback.textContent = 'Ops, não conseguimos enviar agora. Tente novamente ou fale pelo WhatsApp.';
          }
        })
        .finally(() => {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Enviar'; }
        });
    });
  });

  /* ---- Busca (placeholder) ---- */
  document.querySelectorAll('.header-search').forEach(box => {
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = box.querySelector('input').value.trim();
      if (q) alert('Busca ainda não conectada. Você procurou por: "' + q + '"');
    });
  });

});
