document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let isSearching = false;
    let searchKeyword = '';

    const filmContainer = document.getElementById('film-container');
    const searchInput = document.getElementById('search-input');
    const prevBtns = document.querySelectorAll('#previous, #previous-bottom');
    const backToTopButton = document.getElementById('back-to-top');
    const nextBtns = document.querySelectorAll('#next, #next-bottom');
    const goToPageBtns = document.querySelectorAll('#goToPage, #goToPage-bottom');
    const toggleBtn = document.getElementById('toggle-theme-btn');
    const tmdbApiKey = 'fe149ef5184995f0ce33134201fb0c3d';

    const pageInput = document.getElementById('pageInput');  // Get the page input field

    /** 📌 Hàm gọi API lấy danh sách phim **/
    const fetchFilms = async (url) => {
        try {
            const response = await axios.get(url);
            return response.status === 200 ? response.data.items : [];
        } catch (error) {
            console.error("❌ Lỗi khi tải phim:", error);
            return [];
        }
    };

    /** 📌 Hàm lấy điểm TMDB hàng loạt **/
    const getTmdbRatings = async (filmNames) => {
        try {
            const ratings = {};
            await Promise.all(filmNames.map(async (name) => {
                const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(name)}`;
                const response = await axios.get(searchUrl);
                if (response.data.results.length) {
                    ratings[name] = response.data.results[0].vote_average?.toFixed(1) || 'Chưa có đánh giá';
                }
            }));
            return ratings;
        } catch (error) {
            console.error("❌ Lỗi khi lấy điểm TMDB", error);
            return {};
        }
    };

    /** 📌 Hàm tải danh sách phim nhanh hơn **/
    const loadFilms = async (page) => {
        filmContainer.innerHTML = '<h1>⏳ Đang tải phim...</h1>';

        const films = await fetchFilms(`https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=${page}`);
        if (!films.length) {
            filmContainer.innerHTML = '<h1 class="not-found">⚠️ Không tìm thấy phim nào.</h1>';
            return;
        }

        let filmHTML = films.map(film => `
            <div class="film-card" id="film-${film.slug}">
                <a href="film-details.html?slug=${film.slug}" class="details-link">
                    <img src="${film.thumb_url}" alt="${film.original_name}" class="film-image">
                    <h2>${film.name}</h2>
                    <p><strong>Tổng số tập:</strong> ${film.total_episodes || 'Chưa rõ'}</p>
                    <p><strong>Tập hiện tại:</strong> ${film.current_episode || 'Chưa rõ'}</p>
                    <p><strong>Đạo diễn:</strong> ${film.director || 'Không rõ'}</p>
                    <p><strong>Dàn diễn viên:</strong> ${film.casts || 'Không rõ'}</p>
                    <p><strong>Điểm TMDB:</strong> ⭐<span id="rating-${film.slug}">⏳ Đang cập nhật...</span>/10</p>
                </a>
            </div>
        `).join('');

        filmContainer.innerHTML = filmHTML;

        const filmNames = films.map(film => film.original_name);
        const ratings = await getTmdbRatings(filmNames);

        films.forEach(film => {
            document.getElementById(`rating-${film.slug}`).textContent = ratings[film.original_name] || 'Chưa có đánh giá';
        });

        prevBtns.forEach(btn => btn.disabled = page === 1);
        nextBtns.forEach(btn => btn.disabled = films.length < 10);

        // Set the current page in the page input field
        if (pageInput) {
            pageInput.value = currentPage;
        }
    };

    /** 📌 Hàm tìm kiếm phim **/
    const searchMovies = async (isPagination = false) => {
        if (!isPagination) {
            searchKeyword = searchInput.value.trim();
            if (!searchKeyword) return alert("🔍 Vui lòng nhập từ khóa tìm kiếm.");
            currentPage = 1;
        }

        isSearching = true;
        filmContainer.innerHTML = '<h1 class="not-found">⏳ Đang tìm kiếm...</h1>';

        const films = await fetchFilms(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}`);
        if (!films.length) {
            filmContainer.innerHTML = '<h1>⚠️ Không tìm thấy kết quả phù hợp.</h1>';
            return;
        }

        let filmHTML = films.map(film => `
            <div class="film-card" id="film-${film.slug}">
                <a href="film-details.html?slug=${film.slug}" class="details-link">
                    <img src="${film.thumb_url}" alt="${film.original_name}" class="film-image">
                    <h2>${film.name}</h2>
                    <p><strong>Tổng số tập:</strong> ${film.total_episodes || 'Chưa rõ'}</p>
                    <p><strong>Tập hiện tại:</strong> ${film.current_episode || 'Chưa rõ'}</p>
                    <p><strong>Điểm TMDB:</strong> <span id="rating-${film.slug}">⏳ Đang cập nhật...</span></p>
                </a>
            </div>
        `).join('');

        filmContainer.innerHTML = filmHTML;

        const filmNames = films.map(film => film.original_name);
        const ratings = await getTmdbRatings(filmNames);

        films.forEach(film => {
            document.getElementById(`rating-${film.slug}`).textContent = ratings[film.original_name] || 'N/A';
        });

        prevBtns.forEach(btn => btn.disabled = currentPage === 1);
        nextBtns.forEach(btn => btn.disabled = films.length < 10);

        // Update the page input field with the current page
        if (pageInput) {
            pageInput.value = currentPage;
        }
    };

    /** 📌 Hàm điều hướng trang **/
    const handlePagination = (action) => {
        const pageInput = document.getElementById('pageInput');
        if (action === 'next') currentPage++;
        else if (action === 'prev' && currentPage > 1) currentPage--;
        else if (action === 'goTo' && pageInput) {
            const targetPage = parseInt(pageInput.value);
            if (!isNaN(targetPage) && targetPage >= 1) currentPage = targetPage;
            else return alert("⚠️ Vui lòng nhập số trang hợp lệ!");
        }

        isSearching ? searchMovies(true) : loadFilms(currentPage);
    };

    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            backToTopButton.style.display = window.scrollY > 100 ? 'block' : 'none';
        });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /** 📌 Hàm bật/tắt chế độ sáng/tối **/

    /** 📌 Cài đặt sự kiện **/
    const setupEventListeners = () => {
        prevBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('prev')));
        nextBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('next')));
        goToPageBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('goTo')));

        document.getElementById('search-button')?.addEventListener('click', searchMovies);
        searchInput?.addEventListener('keypress', event => {
            if (event.key === 'Enter') searchMovies();
        });
    };

    /** 📌 Khởi chạy ứng dụng **/
    const init = () => {
        setupEventListeners();
        loadFilms(currentPage);
    };

    init();
});
