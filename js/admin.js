// =====================================================================
//  admin.js — auth-protected blog admin (login + post CRUD)
//  ---------------------------------------------------------------------
//  · Supabase Auth (email/password) gates the dashboard.
//  · Cover images upload to the 'blog-images' Storage bucket; the public
//    URL is stored on the post.
//  · Create / update / delete posts in the `posts` table.
//  · The post list refreshes after every change.
// =====================================================================

import { supabase, isSupabaseConfigured } from '../supabase/supabase-config.js';

// ---- element refs ---------------------------------------------------
const $ = (id) => document.getElementById(id);

const loginView      = $('login-view');
const dashboardView  = $('dashboard-view');
const loginForm      = $('login-form');
const loginAlert     = $('login-alert');
const configWarning  = $('config-warning');
const userEmailEl    = $('user-email');

const postForm   = $('post-form');
const formTitle  = $('form-title');
const dashAlert  = $('dash-alert');
const postsList  = $('posts-list');
const coverInput = $('cover');
const coverPreview = $('cover-preview');

const fields = ['title_fr','title_en','title_sw','body_fr','body_en','body_sw','category','author'];

// ---- small UI helpers ----------------------------------------------
function showAlert(el, msg, type = 'error') {
  el.textContent = msg;
  el.className = `alert ${type} show`;
}
function clearAlert(el) { el.className = 'alert'; el.textContent = ''; }

function showLogin() {
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
}
function showDashboard(user) {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  userEmailEl.textContent = user?.email || '';
  loadPosts();
}

// =====================================================================
//  AUTH
// =====================================================================
if (!isSupabaseConfigured) {
  configWarning.style.display = 'block';
}

async function init() {
  if (!isSupabaseConfigured) { showLogin(); return; }
  const { data: { session } } = await supabase.auth.getSession();
  if (session) showDashboard(session.user);
  else showLogin();
}

// React to login/logout across tabs and after sign-in.
if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) showDashboard(session.user);
    else showLogin();
  });
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert(loginAlert);
  if (!isSupabaseConfigured) {
    showAlert(loginAlert, 'Configurez Supabase dans supabase/supabase-config.js d’abord.');
    return;
  }
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) showAlert(loginAlert, error.message);
  // success → onAuthStateChange swaps the view.
});

$('signout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  // onAuthStateChange shows the login view.
});

// =====================================================================
//  IMAGE UPLOAD
// =====================================================================
coverInput.addEventListener('change', () => {
  const file = coverInput.files?.[0];
  if (file) {
    coverPreview.src = URL.createObjectURL(file);
    coverPreview.classList.add('show');
  }
});

async function uploadCover(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('blog-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
  return data.publicUrl;
}

// =====================================================================
//  POST CRUD
// =====================================================================
function resetForm() {
  postForm.reset();
  $('post-id').value = '';
  $('cover_image_url').value = '';
  coverPreview.classList.remove('show');
  coverPreview.src = '';
  formTitle.textContent = 'Nouvel article';
  clearAlert(dashAlert);
}
$('reset-btn').addEventListener('click', resetForm);

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert(dashAlert);

  const saveBtn = $('save-btn');
  saveBtn.disabled = true;
  const originalBtn = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';

  try {
    // 1) upload a new cover if one was chosen, else keep existing URL.
    let coverUrl = $('cover_image_url').value || null;
    const file = coverInput.files?.[0];
    if (file) coverUrl = await uploadCover(file);

    // 2) assemble the record.
    const record = {
      title_fr: $('title_fr').value.trim() || null,
      title_en: $('title_en').value.trim() || null,
      title_sw: $('title_sw').value.trim() || null,
      body_fr:  $('body_fr').value.trim()  || null,
      body_en:  $('body_en').value.trim()  || null,
      body_sw:  $('body_sw').value.trim()  || null,
      category: $('category').value.trim() || null,
      author:   $('author').value.trim()   || 'Guido Murhula Zigabe',
      cover_image_url: coverUrl,
      published: $('published').checked,
    };

    // 3) insert or update.
    const id = $('post-id').value;
    let error;
    if (id) {
      ({ error } = await supabase.from('posts').update(record).eq('id', id));
    } else {
      ({ error } = await supabase.from('posts').insert(record));
    }
    if (error) throw error;

    showAlert(dashAlert, id ? 'Article mis à jour ✓' : 'Article créé ✓', 'success');
    resetForm();
    await loadPosts();
  } catch (err) {
    showAlert(dashAlert, 'Erreur : ' + (err.message || err));
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalBtn;
  }
});

async function loadPosts() {
  postsList.innerHTML = '<p class="muted">Chargement…</p>';
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    postsList.innerHTML = `<p class="muted">Erreur de chargement : ${escapeHtml(error.message)}</p>`;
    return;
  }
  if (!posts || posts.length === 0) {
    postsList.innerHTML = '<p class="muted">Aucun article pour le moment.</p>';
    return;
  }

  postsList.innerHTML = posts.map(rowHtml).join('');

  // wire up edit / delete buttons
  postsList.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => editPost(btn.dataset.edit)));
  postsList.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deletePost(btn.dataset.delete, btn.dataset.title)));
}

function rowHtml(p) {
  const title = p.title_fr || p.title_en || p.title_sw || '(sans titre)';
  const date = p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '';
  const thumb = p.cover_image_url
    ? `<img class="post-thumb" src="${escapeHtml(p.cover_image_url)}" alt="" />`
    : `<div class="post-thumb"></div>`;
  const badge = p.published
    ? '<span class="badge pub">Publié</span>'
    : '<span class="badge draft">Brouillon</span>';
  return `
    <div class="post-row">
      ${thumb}
      <div class="post-main">
        <strong>${escapeHtml(title)}</strong>
        <div class="post-meta">${badge} · ${escapeHtml(p.category || '—')} · ${date}</div>
      </div>
      <div class="post-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${p.id}"><i class="fas fa-pen"></i> Éditer</button>
        <button class="btn btn-danger btn-sm" data-delete="${p.id}" data-title="${escapeHtml(title)}"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
}

async function editPost(id) {
  const { data: p, error } = await supabase.from('posts').select('*').eq('id', id).single();
  if (error) { showAlert(dashAlert, error.message); return; }

  $('post-id').value = p.id;
  fields.forEach(f => { if ($(f)) $(f).value = p[f] || ''; });
  $('published').checked = !!p.published;
  $('cover_image_url').value = p.cover_image_url || '';
  if (p.cover_image_url) {
    coverPreview.src = p.cover_image_url;
    coverPreview.classList.add('show');
  } else {
    coverPreview.classList.remove('show');
  }
  coverInput.value = '';
  formTitle.textContent = 'Modifier l’article';
  clearAlert(dashAlert);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deletePost(id, title) {
  if (!confirm(`Supprimer « ${title} » ? Cette action est irréversible.`)) return;
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) { showAlert(dashAlert, error.message); return; }
  showAlert(dashAlert, 'Article supprimé ✓', 'success');
  await loadPosts();
}

// ---- util ----------------------------------------------------------
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

init();
