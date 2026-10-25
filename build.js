(function () {
    const list = document.getElementById('list');
    const button = document.getElementById('loadmore');
    const status = document.getElementById('loadmore-status');
    const viewSelect = document.getElementById('view-select');
    const sectionHeading = document.getElementById('section-heading');

    if (!list || !button) return;

    let allGames = [];
    let currentView = 'new'; 
    let currentIndex = 0;   
    const limit = parseInt(list.dataset.limit || '24', 10);
    const jsonFile = list.dataset.jsonFile || '/games.json';

    function esc(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function createCardHtml(item) {
        const pkgId = String(item.pkg_id || '').trim();
        const name = String(item.game_name || '').trim();
        if (!pkgId || !name) return '';

        const logo = item.logo ? `/logo/${item.logo}` : '/logo/default.png';

        return `
            <a class="featured__item" href="/package/${encodeURIComponent(pkgId)}/">
                <article class="featured__card">
                    <div class="featured__thumb-wrap">
                        <img
                            class="featured__thumb"
                            src="${esc(logo)}"
                            alt="${esc(name)}"
                            loading="lazy"
                            decoding="async"
                            width="180"
                            height="180"
                        >
                    </div>
                    <h3 class="featured__name">${esc(name)}</h3>
                </article>
            </a>
        `;
    }

    async function initData() {
        try {
            const res = await fetch(jsonFile);
            if (res.ok) {
                allGames = await res.json();
                loadMore(); 
            }
        } catch (e) {
            console.error("JSON load error:", e);
        }
    }

    function getFilteredList() {
        if (currentView === 'popular') {
            return allGames.filter(g => g.popular);
        } else {
            return allGames.filter(g => g.new_release);
        }
    }

    function switchView(viewType) {
        currentView = viewType;
        currentIndex = 0; 
        
        if (currentView === 'popular') {
            sectionHeading.textContent = 'Popular Games';
        } else {
            sectionHeading.textContent = 'New Releases';
        }

        list.innerHTML = '';
        button.style.display = 'block'; 
        status.style.display = 'none';  
        
        loadMore();
    }

    function loadMore() {
        if (!allGames.length) return;

        button.disabled = true;
        status.style.display = 'block';
        status.textContent = 'Loading...';

        const filtered = getFilteredList();
        const nextItems = filtered.slice(currentIndex, currentIndex + limit);
        let html = '';

        nextItems.forEach(function (item) {
            html += createCardHtml(item);
        });

        if (html !== '') {
            list.insertAdjacentHTML('beforeend', html);
        }

        currentIndex += nextItems.length;

        if (currentIndex >= filtered.length) {
            button.style.display = 'none';
            status.style.display = 'block';
            status.textContent = 'No more items.';
        } else {
            button.style.display = 'block';
            status.style.display = 'none';
            status.textContent = '';
        }

        button.disabled = false;
    }

    viewSelect.addEventListener('change', function () {
        switchView(this.value);
    });

    button.addEventListener('click', loadMore);

    initData();
})();
