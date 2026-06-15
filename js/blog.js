// =====================================================================
//  blog.js — fetch published posts from Supabase and render the blog grid
//  ---------------------------------------------------------------------
//  · Imports the shared supabase client and the language helpers.
//  · On load, fetches posts where published = true (newest first).
//  · Replaces the hardcoded cards inside #blog with live data.
//  · Renders FR/EN/SW variants with data-lang spans so the existing
//    setLang() system shows the right language.
//  If Supabase is not configured yet (or the fetch fails), the original
//  hardcoded cards are left in place as a graceful fallback.
// =====================================================================

import { supabase, isSupabaseConfigured } from '../supabase/supabase-config.js';
import { setLang, currentLang, revealObserver } from './main.js';

const grid = document.getElementById('blogGrid');

// --- helpers --------------------------------------------------------

// Strip any HTML from rich body content and trim to a short excerpt.
function makeExcerpt(html, max = 140) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

// Escape values that go into attributes / text to avoid breaking markup.
function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DATE_LOCALES = { fr: 'fr-FR', en: 'en-US', sw: 'sw-KE' };
function formatDate(iso, lang) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALES[lang] || 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '';
  }
}

// Build one blog card matching the site's existing structure / classes.
function cardHtml(post) {
  const cover = post.cover_image_url ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80';
  const author = post.author || 'Guido Murhula Zigabe';

  const titleFr = esc(post.title_fr || post.title_en || post.title_sw || '');
  const titleEn = esc(post.title_en || post.title_fr || post.title_sw || '');
  const titleSw = esc(post.title_sw || post.title_fr || post.title_en || '');

  const exFr = esc(makeExcerpt(post.body_fr || post.body_en || post.body_sw));
  const exEn = esc(makeExcerpt(post.body_en || post.body_fr || post.body_sw));
  const exSw = esc(makeExcerpt(post.body_sw || post.body_fr || post.body_en));

  return `
    <div class="blog-card reveal">
      <div class="blog-img" style="background-image: url('${esc(cover)}')">
        ${post.category ? `<div class="blog-category">${esc(post.category)}</div>` : ''}
      </div>
      <div class="blog-body">
        <div class="blog-meta">
          <span><i class="fas fa-calendar-alt"></i>
            <span data-lang="fr">${formatDate(post.created_at, 'fr')}</span>
            <span data-lang="en">${formatDate(post.created_at, 'en')}</span>
            <span data-lang="sw">${formatDate(post.created_at, 'sw')}</span>
          </span>
          <span><i class="fas fa-user"></i> ${esc(author)}</span>
        </div>
        <h3 class="blog-title">
          <span data-lang="fr">${titleFr}</span>
          <span data-lang="en">${titleEn}</span>
          <span data-lang="sw">${titleSw}</span>
        </h3>
        <p class="blog-excerpt">
          <span data-lang="fr">${exFr}</span>
          <span data-lang="en">${exEn}</span>
          <span data-lang="sw">${exSw}</span>
        </p>
        <a href="#blog" class="blog-read-more">
          <span data-lang="fr">Lire la suite</span>
          <span data-lang="en">Read more</span>
          <span data-lang="sw">Soma zaidi</span>
          <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>`;
}

function renderEmptyState() {
  grid.innerHTML = `
    <p style="grid-column: 1 / -1; text-align:center; color: var(--text-muted);">
      <span data-lang="fr">Aucun article pour le moment. Revenez bientôt !</span>
      <span data-lang="en">No articles yet. Check back soon!</span>
      <span data-lang="sw">Hakuna makala bado. Rudi hivi karibuni!</span>
    </p>`;
}

// --- main -----------------------------------------------------------

async function loadPosts() {
  if (!grid) return;

  // Skip the network call entirely until the project is configured —
  // keeps the hardcoded fallback cards visible during development.
  if (!isSupabaseConfigured) {
    console.info('[blog] Supabase not configured yet — keeping fallback cards.');
    return;
  }

  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      renderEmptyState();
    } else {
      grid.innerHTML = posts.map(cardHtml).join('');
    }

    // Re-apply the active language to the freshly injected markup and
    // hook the new .reveal cards into the scroll-reveal animation.
    setLang(currentLang);
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  } catch (err) {
    console.error('[blog] Failed to load posts — keeping fallback cards.', err);
  }
}

loadPosts();
