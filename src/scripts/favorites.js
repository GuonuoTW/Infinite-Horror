// Favorites, stored in localStorage as [{ path, title, timestamp }].
// `path` is the page's pathname (including its language prefix), so
// favorites survive across visits. All clicks are delegated because the
// header element is replaced when the language switches.

const FAV_KEY = 'trpg-favorites';

const STRINGS = {
  en: {
    heading: 'Favorites',
    empty: 'No favorites yet. Click the star icon to add the current page to favorites.',
    remove: 'Remove',
    add: 'Add to favorites',
    removeTitle: 'Remove from favorites',
  },
  zh: {
    heading: '收藏夹',
    empty: '还没有收藏。点击星形图标将当前页面加入收藏。',
    remove: '移除',
    add: '加入收藏',
    removeTitle: '从收藏中移除',
  },
};

const lang = () => (location.pathname.match(/\/(en|zh)\//) || [])[1] || 'en';
const t = () => STRINGS[lang()];
const currentPath = () => window.location.pathname;
const currentTitle = () => document.title.replace(/ – Infinite Horror$/, '');

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function isFavorite(path) {
  return loadFavorites().some((f) => f.path === path);
}

function updateFavBtn() {
  const favBtn = document.getElementById('favoriteToggle');
  if (!favBtn) return;
  const fav = isFavorite(currentPath());
  favBtn.textContent = fav ? '★' : '☆';
  favBtn.style.color = fav ? '#ffd700' : '#999';
  favBtn.title = fav ? t().removeTitle : t().add;
}

function showFavoritesList() {
  const favorites = loadFavorites();
  const content = document.getElementById('content');
  content.innerHTML = '';

  const heading = document.createElement('h1');
  heading.textContent = t().heading;
  content.appendChild(heading);

  if (favorites.length === 0) {
    const p = document.createElement('p');
    p.textContent = t().empty;
    content.appendChild(p);
    return;
  }

  favorites.forEach((fav) => {
    const item = document.createElement('div');
    item.className = 'favorite-item';

    const link = document.createElement('a');
    link.href = fav.path;
    link.textContent = fav.title;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-fav-btn';
    removeBtn.textContent = t().remove;
    removeBtn.addEventListener('click', () => {
      saveFavorites(loadFavorites().filter((f) => f.path !== fav.path));
      item.remove();
      updateFavBtn();
    });

    item.appendChild(link);
    item.appendChild(removeBtn);
    content.appendChild(item);
  });
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#showFavorites')) {
    showFavoritesList();
    return;
  }
  if (e.target.closest('#favoriteToggle')) {
    let favorites = loadFavorites();
    if (isFavorite(currentPath())) {
      favorites = favorites.filter((f) => f.path !== currentPath());
    } else {
      favorites.push({
        path: currentPath(),
        title: currentTitle(),
        timestamp: Date.now(),
      });
    }
    saveFavorites(favorites);
    updateFavBtn();
  }
});

document.addEventListener('astro:page-load', updateFavBtn);
