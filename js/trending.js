document.addEventListener('DOMContentLoaded', async () => {
    let currentPage = 1;
    const tmdbApiKey = 'fe149ef5184995f0ce33134201fb0c3d';
    const urlParams = new URLSearchParams(window.location.search);
    let currentType = urlParams.get('type') || 'movie'; // Default is 'movie'
    let currentTimeframe = urlParams.get('timeframe') || 'day'; // Default is 'day'

    document.getElementById('trending-films').innerText = `Danh sách ${currentType === 'movie' ? 'phim lẻ' : 'TV Series'} (${currentTimeframe})`;

    const elements = {
        filmContainer: document.getElementById('trending-films'),
        searchInput: document.getElementById('search-input'),
        backToTop: document.getElementById('back-to-top'),
        prevBtns: document.querySelectorAll('#previous, #previous-bottom'),
        nextBtns: document.querySelectorAll('#next, #next-bottom'),
        goToPageBtns: document.querySelectorAll('#goToPage, #goToPage-bottom'),
        pageInput: document.getElementById('pageInput'),
    };

    // API request function with error handling
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

    // Fetch movie/TV show details
    const fetchDetails = async (id) => {
        try {
            const [vnData, enData, creditsData] = await Promise.all([
                fetchJSON(`https://api.themoviedb.org/3/${currentType}/${id}?api_key=${tmdbApiKey}&language=vi-VN`),
                fetchJSON(`https://api.themoviedb.org/3/${currentType}/${id}?api_key=${tmdbApiKey}&language=en-US`),
                fetchJSON(`https://api.themoviedb.org/3/${currentType}/${id}/credits?api_key=${tmdbApiKey}&language=en-US`)
            ]);

            return vnData && enData ? {
                nameVN: vnData.title || vnData.name,
                nameEN: enData.title || enData.name,
                episodes: vnData.number_of_episodes || 'Không rõ',
                rating: vnData.vote_average?.toFixed(1) || 'N/A',
                poster: vnData.poster_path ? `https://image.tmdb.org/t/p/w500${vnData.poster_path}` : 'placeholder.jpg',
                cast: creditsData?.cast?.slice(0, 5).map(cast => cast.name).join(', ') || 'Không có sẵn',
                overview: vnData.overview || 'Không có mô tả.',
            } : null;
        } catch (error) {
            console.error(`⚠️ Lỗi khi lấy chi tiết phim ${id}`, error);
            return null;
        }
    };

    // Fetch trending list
    const fetchTrending = async (page = 1) =>
        fetchJSON(`https://api.themoviedb.org/3/trending/${currentType}/${currentTimeframe}?api_key=${tmdbApiKey}&language=vi-VN&page=${page}`);

    // Display movies
    const displayMovies = async (movies) => {
        elements.filmContainer.innerHTML = movies.length ? '' : '<h1 class="not-found">Không tìm thấy phim nào.</h1>';
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
                <button class='search-nguonc-button'>Tìm kiếm</button>
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
            overview.style.webkitLineClamp = '19';
            overview.style.overflow = 'hidden';

            filmCard.querySelector('.search-nguonc-button').addEventListener('click', () => searchOnNguonc(details.nameEN, details.nameVN));
            elements.filmContainer.appendChild(filmCard);
        });

        elements.prevBtns.forEach(btn => btn.disabled = currentPage === 1);
        elements.nextBtns.forEach(btn => btn.disabled = movies.length < 10);

        // Update page input value
        if (elements.pageInput) {
            elements.pageInput.value = currentPage;
        }
        
        const pageInputs = document.querySelectorAll('#pageInput, #pageInput-bottom');
        pageInputs.forEach(input => input.value = currentPage);        
    };

    // Handle pagination
    const handlePagination = async (action) => {
        if (action === 'next') currentPage++;
        else if (action === 'prev' && currentPage > 1) currentPage--;
        else if (action === 'goTo') {
            const targetPage = parseInt(elements.pageInput.value);
            if (!isNaN(targetPage) && targetPage >= 1) currentPage = targetPage;
            else return alert('⚠️ Vui lòng nhập số trang hợp lệ!');
        }
        await loadTrending();
    };

    function showLoader() {
        const loader = document.querySelector(".wheel-and-hamster");
        if (loader) loader.style.display = "flex";
    }

    function hideLoader() {
        const loader = document.querySelector(".wheel-and-hamster");
        if (loader) loader.style.display = "none";
    }

    // Load trending films
    const loadTrending = async () => {
        showLoader();
        const trending = await fetchTrending(currentPage);
        await displayMovies(trending?.results || []);
        hideLoader();
    };

    // Hàm tìm kiếm trên `nguonc.com`
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
            alert('Phim có thể chưa có trên trang hoặc có tên khác, hãy thử tìm lại bằng tên khác trên thanh tìm kiếm, bạn hãy thử bỏ số phần đi, ví dụ thay vì Shangri-La Frontier 2nd Season, thì hãy thử Shangri-La Frontier.');
        }
    };

    // Event listeners for pagination buttons
    elements.prevBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('prev')));
    elements.nextBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('next')));
    elements.goToPageBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('goTo')));
    elements.backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Load trending films on page load
    await loadTrending();
});
