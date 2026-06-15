// =====================================================================
//  main.js — all existing site behaviour, as an ES module
//  ---------------------------------------------------------------------
//  Lang switcher · navbar scroll · scroll reveal · counter animation
//  · lightbox · contact form handler · smooth anchor scroll.
//
//  Because module scripts run in their own scope, the functions that the
//  HTML calls via inline onclick="" handlers are explicitly attached to
//  `window` at the bottom of this file. A few values are also exported so
//  blog.js can stay in sync with the active language.
// =====================================================================

// ===== LANGUAGE SWITCHER =====
export let currentLang = 'fr';

export function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-lang') === lang);
  });
  document.querySelectorAll('.lang-btn').forEach((btn, i) => {
    btn.classList.toggle('active', ['fr', 'en', 'sw'][i] === lang);
  });
  document.documentElement.lang = lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'sw';
}

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== HAMBURGER =====
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.add('open');
});
document.getElementById('mobileClose')?.addEventListener('click', closeMobile);
function closeMobile() {
  document.getElementById('mobileMenu')?.classList.remove('open');
}

// ===== SCROLL REVEAL =====
// Exported so dynamically-injected content (e.g. blog cards) can be observed too.
export const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.impact-number[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.dataset.count);
      const suffix = '+';
      let start = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) {
          e.target.textContent = target.toLocaleString() + suffix;
          clearInterval(timer);
        } else {
          e.target.textContent = Math.floor(start).toLocaleString();
        }
      }, 20);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
counters.forEach(el => counterObserver.observe(el));

// ===== LIGHTBOX =====
const galleryImages = Array.from(
  document.querySelectorAll('#galleryGrid .gallery-item img')
).map(img => img.src);
let currentImg = 0;
function openLightbox(idx) {
  currentImg = idx;
  document.getElementById('lightboxImg').src = galleryImages[idx];
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
function prevImage() {
  currentImg = (currentImg - 1 + galleryImages.length) % galleryImages.length;
  document.getElementById('lightboxImg').src = galleryImages[currentImg];
}
function nextImage() {
  currentImg = (currentImg + 1) % galleryImages.length;
  document.getElementById('lightboxImg').src = galleryImages[currentImg];
}
document.getElementById('lightbox')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') prevImage();
  if (e.key === 'ArrowRight') nextImage();
});

// ===== FORM =====
function handleFormSubmit(btn) {
  btn.innerHTML = '<i class="fas fa-check"></i> <span>' +
    (currentLang === 'fr' ? 'Message envoyé !' : currentLang === 'en' ? 'Message sent!' : 'Ujumbe umetumwa!') +
    '</span>';
  btn.style.background = '#25d366';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' +
      (currentLang === 'fr' ? 'Envoyer le Message' : currentLang === 'en' ? 'Send Message' : 'Tuma Ujumbe') +
      '</span>';
    btn.style.background = '';
    btn.disabled = false;
  }, 3000);
}

// ===== SMOOTH ANCHOR SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id && id !== '#') {
      e.preventDefault();
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== EXPOSE INLINE-HANDLER FUNCTIONS ON window =====
// The HTML still uses onclick="setLang('fr')", onclick="openLightbox(0)", etc.
// Module scope is private, so re-export those onto the global object.
Object.assign(window, {
  setLang,
  closeMobile,
  openLightbox,
  closeLightbox,
  prevImage,
  nextImage,
  handleFormSubmit,
});
