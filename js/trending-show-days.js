document.addEventListener('DOMContentLoaded', async () => {
    const tmdbApiKey = 'fe149ef5184995f0ce33134201fb0c3d';
    const elements = {
        filmContainer: document.getElementById('trending-show-days')
    };

    const fetchJSON = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
            return response.json();
        } catch (error) {
            console.error(`❌ Lỗi khi gọi API: ${url}`, error);
            return null;
        }
    };

    const fetchDetails = async (id) => {
        try {
            const [vnData, enData, creditsData] = await Promise.all([
                fetchJSON(`https://api.themoviedb.org/3/tv/${id}?api_key=${tmdbApiKey}&language=vi-VN`),
                fetchJSON(`https://api.themoviedb.org/3/tv/${id}?api_key=${tmdbApiKey}&language=en-US`),
                fetchJSON(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=${tmdbApiKey}&language=en-US`)
            ]);

            return vnData && enData ? {
                nameVN: vnData.name || vnData.title,
                nameEN: enData.name || enData.title,
                episodes: vnData.number_of_episodes || 'Không rõ',
                rating: vnData.vote_average?.toFixed(1) || 'N/A',
                poster: vnData.poster_path ? `https://image.tmdb.org/t/p/w500${vnData.poster_path}` : 'placeholder.jpg',
                cast: creditsData?.cast?.slice(0, 5).map(cast => cast.name).join(', ') || 'Không có sẵn',
                overview: vnData.overview || 'Không có mô tả.'
            } : null;
        } catch (error) {
            console.error(`⚠️ Lỗi khi lấy chi tiết phim ${id}`, error);
            return null;
        }
    };

    const fetchTrending = async () => {
        const trending = await fetchJSON(`https://api.themoviedb.org/3/trending/tv/day?api_key=${tmdbApiKey}&language=vi-VN`);
        return trending?.results?.slice(0, 4) || [];
    };

    const displayMovies = async (movies) => {
        if (!movies || !movies.length) {
            elements.filmContainer.innerHTML = '<h1 class="not-found">Không tìm thấy phim nào.</h1>';
            return;
        }
        elements.filmContainer.innerHTML = '';
        const detailsList = await Promise.all(movies.map(movie => fetchDetails(movie.id)));

        detailsList.forEach(details => {
            if (!details) return;

            const filmCard = document.createElement('div');
            filmCard.className = 'film-card';
            filmCard.innerHTML = `
                <a class='details-link'>
                    <img src='${details.poster}' alt='${details.nameVN}' class='film-image'>
                    <h2>${details.nameVN}</h2>
                    <p><strong>Tổng số tập:</strong> ${details.episodes}</p>
                    <p><strong>Diễn viên:</strong> ${details.cast}</p>
                    <p><strong>Điểm đánh giá:</strong> ⭐ ${details.rating}/10</p>
                    <div class='film-overview hidden'>${details.overview}</div>
                </a>
                <button class='search-nguonc-button'>
                Tìm Kiếm
            </button>
            `;

            filmCard.addEventListener('mouseenter', () => {
                filmCard.querySelector('.film-overview').classList.remove('hidden');
            });
            filmCard.addEventListener('mouseleave', () => {
                filmCard.querySelector('.film-overview').classList.add('hidden');
            });

            const overview = filmCard.querySelector('.film-overview');
            overview.style.display = '-webkit-box';
            overview.style.webkitBoxOrient = 'vertical';
            overview.style.webkitLineClamp = '16';
            overview.style.overflow = 'hidden';

            filmCard.querySelector('.search-nguonc-button').addEventListener('click', () => searchOnNguonc(details.nameEN, details.nameVN));
            elements.filmContainer.appendChild(filmCard);
        });
    };

    const searchOnNguonc = async (englishName, vietnameseName) => {
        const keyword = englishName || vietnameseName;
        if (!keyword) return alert('Không tìm thấy tên phim để tìm kiếm.');
        const data = await fetchJSON(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}`);
        if (data && data.items && data.items.length) {
            window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
        } else if (englishName && vietnameseName) {
            console.log(`Không tìm thấy phim "${englishName}", thử lại với "${vietnameseName}"`);
            searchOnNguonc(vietnameseName, '');
        } else {
            alert('Phim có thể chưa có trên trang hoặc có tên khác...');
        }
    };

    const movies = await fetchTrending();
    await displayMovies(movies);
});