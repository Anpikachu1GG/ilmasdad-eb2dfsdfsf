document.addEventListener('DOMContentLoaded', async () => {
    let currentPage = 1;
    let isSearching = false;
    const tmdbApiKey = 'fe149ef5184995f0ce33134201fb0c3d';

    const elements = {
        filmContainer: document.getElementById('trending-films'),
        searchInput: document.getElementById('search-input'),
        backToTop: document.getElementById('back-to-top'),
        prevBtns: document.querySelectorAll('#previous, #previous-bottom'),
        nextBtns: document.querySelectorAll('#next, #next-bottom'),
        goToPageBtns: document.querySelectorAll('#goToPage, #goToPage-bottom'),
        pageInput: document.getElementById('pageInput'),
    };

    const fetchJSON = async (url) => {
        try {
            const response = await fetch(url);
            return response.ok ? response.json() : null;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
        }
    };

    const fetchTVShowDetails = async (tvShowId) => {
        const [vnData, enData, creditsData] = await Promise.all([
            fetchJSON(`https://api.themoviedb.org/3/tv/${tvShowId}?api_key=${tmdbApiKey}&language=vi-VN`),
            fetchJSON(`https://api.themoviedb.org/3/tv/${tvShowId}?api_key=${tmdbApiKey}&language=en-US`),
            fetchJSON(`https://api.themoviedb.org/3/tv/${tvShowId}/credits?api_key=${tmdbApiKey}&language=en-US`)
        ]);

        return vnData && enData ? {
            nameVN: vnData.name || enData.name,
            nameEN: enData.name || vnData.name,
            episodes: vnData.number_of_episodes || 'Không rõ',
            rating: vnData.vote_average?.toFixed(1) || 'N/A',
            poster: vnData.poster_path ? `https://image.tmdb.org/t/p/w500${vnData.poster_path}` : 'placeholder.jpg',
            cast: creditsData?.cast?.slice(0, 5).map(cast => cast.name).join(', ') || 'Không có sẵn',
            overview: vnData.overview || 'Không có mô tả.'
        } : null;
    };

    const fetchTrendingMovies = (page = 1) => 
        fetchJSON(`https://api.themoviedb.org/3/trending/tv/day?api_key=${tmdbApiKey}&language=vi-VN&page=${page}`);

    const searchOnNguonc = async (englishName, vietnameseName) => {
        const keyword = englishName || vietnameseName;
        if (!keyword) return alert('Không tìm thấy tên phim để tìm kiếm.');

        const data = await fetchJSON(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}`);
        if (data?.items?.length) {
            window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
        } else if (englishName && vietnameseName) {
            console.log(`Không tìm thấy phim "${englishName}", thử lại với "${vietnameseName}"`);
            searchOnNguonc(vietnameseName, '');
        } else {
            alert('Phim có thể chưa có trên trang.');
        }
    };

    const displayTVShows = async (tvShows) => {
        elements.filmContainer.innerHTML = tvShows.length ? '' : '<p>Không tìm thấy phim nào.</p>';
        const tvShowDetails = await Promise.all(tvShows.map(show => fetchTVShowDetails(show.id)));
        
        tvShowDetails.forEach(details => {
            if (!details) return;

            const filmCard = document.createElement('div');
            filmCard.className = 'film-card';
            filmCard.innerHTML = `
                <a class='details-link'>
                    <img src='${details.poster}' alt='${details.nameVN || details.nameEN}' class='film-image'>
                    <h2>${details.nameVN || details.nameEN}</h2>
                    <p><strong>Tổng số tập:</strong> ${details.episodes}</p>
                    <p><strong>Diễn viên:</strong> ${details.cast}</p>
                    <p><strong>Điểm đánh giá:</strong> ⭐ ${details.rating}/10</p>
                    <div class='film-overview hidden'>${details.overview}</div>
                </a>
                <button class='search-nguonc-button'>Tìm kiếm</button>
            `;

            filmCard.addEventListener('mouseenter', () => {
                filmCard.querySelector('.film-overview').classList.remove('hidden');
            });
            filmCard.addEventListener('mouseleave', () => {
                filmCard.querySelector('.film-overview').classList.add('hidden');
            });
            filmCard.querySelector('.search-nguonc-button').addEventListener('click', () => searchOnNguonc(details.nameEN, details.nameVN));
            elements.filmContainer.appendChild(filmCard);
        });

        elements.prevBtns.forEach(btn => btn.disabled = currentPage === 1);
        elements.nextBtns.forEach(btn => btn.disabled = tvShows.length < 10);
    };

    const handlePagination = (action) => {
        if (action === 'next') currentPage++;
        else if (action === 'prev' && currentPage > 1) currentPage--;
        else if (action === 'goTo') {
            const targetPage = parseInt(elements.pageInput.value);
            if (!isNaN(targetPage) && targetPage >= 1) currentPage = targetPage;
            else return alert('⚠️ Vui lòng nhập số trang hợp lệ!');
        }
        loadTrendingMovies();
    };

    const loadTrendingMovies = async () => {
        const trendingTVShows = await fetchTrendingMovies(currentPage);
        displayTVShows(trendingTVShows?.results || []);
    };

    elements.prevBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('prev')));
    elements.nextBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('next')));
    elements.goToPageBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('goTo')));
    elements.backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    loadTrendingMovies();
});
