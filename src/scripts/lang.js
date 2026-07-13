// Keeps the language toggle pointing at the current page's counterpart in
// the other language. The href is server-rendered correctly on a full load,
// but the header persists across client-side navigation within a language,
// so it must be refreshed per page.

function updateLangToggle() {
  const toggle = document.getElementById('langToggle');
  const match = location.pathname.match(/\/(en|zh)\//);
  if (!toggle || !match) return;
  const other = match[1] === 'en' ? 'zh' : 'en';
  toggle.setAttribute(
    'href',
    location.pathname.replace(`/${match[1]}/`, `/${other}/`),
  );
}

document.addEventListener('astro:page-load', updateLangToggle);
