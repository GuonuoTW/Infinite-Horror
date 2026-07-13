// Sidebar resizer, dragged width is remembered per tab. The sidebar element
// is replaced when switching sections, so it is looked up on use and the
// saved width re-applied after every navigation.

let isResizing = false;

function applyWidth() {
  const saved = sessionStorage.getItem('ih-sidebar-width');
  if (saved) document.getElementById('sidebar').style.width = saved + 'px';
}

document.addEventListener('mousedown', (e) => {
  if (e.target.id !== 'resizer') return;
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = e.clientX;
  if (newWidth >= 150 && newWidth <= 600) {
    document.getElementById('sidebar').style.width = newWidth + 'px';
    sessionStorage.setItem('ih-sidebar-width', newWidth);
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

document.addEventListener('astro:page-load', applyWidth);
