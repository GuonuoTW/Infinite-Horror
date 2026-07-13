// Folder open/close behavior. The tree itself is static HTML rendered at
// build time; this only toggles visibility. Open state is remembered per
// tab (sessionStorage) so it survives page navigation.
//
// The sidebar persists across navigations within a section, but is REPLACED
// when switching between rules and resources — so folder toggles use event
// delegation on the document, and open state is re-applied on every
// astro:page-load rather than only once at startup.

const STORAGE_KEY = 'ih-open-folders';

function loadOpenSet() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveOpenSet(openSet) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...openSet]));
}

const openSet = loadOpenSet();

function setFolderOpen(header, open) {
  const content = header.parentElement.querySelector(':scope > .folder-content');
  const toggle = header.querySelector('.folder-toggle');
  const icon = header.querySelector('.folder-icon');
  content.classList.toggle('open', open);
  toggle.textContent = open ? '−' : '+';
  icon.src = icon.src.replace(
    open ? 'folder-closed' : 'folder-open',
    open ? 'folder-open' : 'folder-closed',
  );
}

// Folder toggle and header button clicks, all delegated so they survive
// sidebar and header replacement (section or language switches).
document.addEventListener('click', (e) => {
  if (e.target.closest('#openAll')) return setAll(true);
  if (e.target.closest('#closeAll')) return setAll(false);

  const toggle = e.target.closest('.folder-toggle');
  if (!toggle) return;
  e.stopPropagation();
  const header = toggle.closest('.folder-header');
  const content = header.parentElement.querySelector(':scope > .folder-content');
  const open = !content.classList.contains('open');
  setFolderOpen(header, open);
  if (open) openSet.add(content.dataset.folder);
  else openSet.delete(content.dataset.folder);
  saveOpenSet(openSet);
});

function setAll(open) {
  document.querySelectorAll('.folder-header').forEach((header) => {
    setFolderOpen(header, open);
    const content = header.parentElement.querySelector(':scope > .folder-content');
    if (open) openSet.add(content.dataset.folder);
    else openSet.delete(content.dataset.folder);
  });
  saveOpenSet(openSet);
}

// Re-apply remembered open folders (a freshly rendered sidebar only has the
// current page's ancestors open) and remember server-opened ones.
function applyOpenState() {
  document.querySelectorAll('.folder-content').forEach((content) => {
    const header = content.parentElement.querySelector(':scope > .folder-header');
    if (openSet.has(content.dataset.folder)) {
      setFolderOpen(header, true);
    } else if (content.classList.contains('open')) {
      openSet.add(content.dataset.folder);
    }
  });
  saveOpenSet(openSet);
}

// Move the active highlight to the current page's sidebar entry and open
// the folders containing it.
function updateActive() {
  const path = location.pathname.replace(/\/+$/, '') || '/';

  document
    .querySelectorAll('.folder-header.active, .file-item.active')
    .forEach((el) => el.classList.remove('active'));

  let activeLink = null;
  document.querySelectorAll('#sidebar a').forEach((a) => {
    if ((a.pathname.replace(/\/+$/, '') || '/') === path) activeLink = a;
  });
  if (!activeLink) return;

  const item = activeLink.classList.contains('file-item')
    ? activeLink
    : activeLink.closest('.folder-header');
  item.classList.add('active');

  // A folder page opens its own folder, plus all ancestors.
  const startContent = item.classList.contains('folder-header')
    ? item.parentElement.querySelector(':scope > .folder-content')
    : item.closest('.folder-content');
  for (let content = startContent; content; content = content.parentElement.closest('.folder-content')) {
    setFolderOpen(content.parentElement.querySelector(':scope > .folder-header'), true);
    openSet.add(content.dataset.folder);
  }
  saveOpenSet(openSet);
}

document.addEventListener('astro:page-load', () => {
  applyOpenState();
  updateActive();
});
