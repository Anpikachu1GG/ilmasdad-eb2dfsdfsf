document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let isSearching = false; // Kiểm tra trạng thái tìm kiếm
    let searchKeyword = ''; // Lưu từ khóa tìm kiếm

    const filmContainer = document.getElementById('film-container');
    const searchInput = document.getElementById('search-input');
    const backToTopButton = document.getElementById('back-to-top');
    const toggleBtn = document.getElementById('toggle-theme-btn');
    const prevBtns = document.querySelectorAll('#previous, #previous-bottom');
    const nextBtns = document.querySelectorAll('#next, #next-bottom');
    const goToPageBtns = document.querySelectorAll('#goToPage, #goToPage-bottom');

    const tmdbApiKey = 'fe149ef5184995f0ce33134201fb0c3d';

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

    /** 📌 Hàm tìm điểm đánh giá trên TMDB **/
    const getTmdbRating = async (originalName) => {
        try {
            if (!originalName) return 'N/A';
            const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(originalName)}`;
            const response = await axios.get(searchUrl);
            const movies = response.data.results;
            return movies.length ? movies[0].vote_average.toFixed(1) : 'Chưa có đánh giá';
        } catch (error) {
            console.error(`❌ Lỗi khi lấy điểm đánh giá TMDB cho phim: ${originalName}`, error);
            return 'N/A';
        }
    };

    /** 📌 Hàm tải phim theo trang (Kết hợp với điểm TMDB) **/
    const loadFilms = async (page) => {
        if (!filmContainer) return;
        filmContainer.innerHTML = '<h1 class="not-found">⏳ Đang tải phim...</h1>';

        const films = await fetchFilms(`https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=${page}`);

        if (films.length === 0) {
            filmContainer.innerHTML = '<p class="not-found">⚠️ Không tìm thấy phim nào.</p>';
            return;
        }

        let filmHTML = '';

        for (const film of films) {
            const rating = await getTmdbRating(film.original_name); // Lấy điểm từ TMDB

            filmHTML += `
                <div class="film-card">
                    <a href="film-details.html?slug=${film.slug}" class="details-link">
                        <img src="${film.thumb_url}" alt="${film.original_name}" class="film-image">
                        <h2>${film.name}</h2>
                        <p><strong>Tổng số tập:</strong> ${film.total_episodes || 'Chưa rõ'}</p>
                        <p><strong>Tập hiện tại:</strong> ${film.current_episode || 'Chưa rõ'}</p>
                        <p><strong>Đạo diễn:</strong> ${film.director || 'Không rõ'}</p>
                        <p><strong>Dàn diễn viên:</strong> ${film.casts || 'Không rõ'}</p>
                        <p><strong>Điểm đánh giá:</strong> ⭐ ${rating}/10</p>
                    </a>
                </div>`;
        }

        filmContainer.innerHTML = filmHTML;

        // Cập nhật trạng thái của các nút phân trang
        prevBtns.forEach(btn => btn.disabled = page === 1);
        nextBtns.forEach(btn => btn.disabled = films.length < 10);
    };

    /** 📌 Hàm tìm kiếm phim (Kết hợp với TMDB) **/
    const searchMovies = async (isPagination = false) => {
        if (!isPagination) {
            searchKeyword = searchInput.value.trim();
            if (!searchKeyword) return alert("🔍 Vui lòng nhập từ khóa tìm kiếm.");
            currentPage = 1; // Reset về trang đầu khi tìm kiếm mới
        }

        isSearching = true; // Đánh dấu trạng thái tìm kiếm
        filmContainer.innerHTML = '<p class="not-found">⏳ Đang tìm kiếm...</p>';
        const films = await fetchFilms(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}`);

        if (films.length === 0) {
            filmContainer.innerHTML = '<h1 class="not-found">⚠️ Không tìm thấy kết quả phù hợp.</h1>';
            return;
        }

        let filmHTML = '';

        for (const film of films) {
            const rating = await getTmdbRating(film.original_name); // Lấy điểm từ TMDB

            filmHTML += `
                <div class="film-card">
                    <a href="film-details.html?slug=${film.slug}" class="details-link">
                        <img src="${film.thumb_url}" alt="${film.original_name}" class="film-image">
                        <h2>${film.name}</h2>
                        <p><strong>Tổng số tập:</strong> ${film.total_episodes || 'Chưa có thông tin'}</p>
                        <p><strong>Tập hiện tại:</strong> ${film.current_episode || 'Chưa có thông tin'}</p>
                        <p><strong>Điểm TMDB:</strong> ⭐ ${rating}/10</p>
                    </a>
                </div>`;
        }

        filmContainer.innerHTML = filmHTML;

        // Cập nhật trạng thái của các nút phân trang
        prevBtns.forEach(btn => btn.disabled = currentPage === 1);
        nextBtns.forEach(btn => btn.disabled = films.length < 10);
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

        if (isSearching) {
            searchMovies(true); // Gọi lại tìm kiếm nhưng giữ nguyên từ khóa
        } else {
            loadFilms(currentPage);
        }
    };

    /** 📌 Hàm bật/tắt chế độ sáng/tối **/
    const toggleTheme = () => {
        document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        toggleBtn.textContent = document.body.classList.contains('light-theme') ? '🌞' : '🌙';
    };

    /** 📌 Cài đặt các sự kiện **/
    const setupEventListeners = () => {
        prevBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('prev')));
        nextBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('next')));
        goToPageBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('goTo')));

        document.getElementById('search-button')?.addEventListener('click', searchMovies);
        document.getElementById('toggle-theme-btn')?.addEventListener('click', toggleTheme);
        document.getElementById('toggle-nav')?.addEventListener('click', () => {
            document.querySelector('.nav-links')?.classList.toggle('active');
        });

        searchInput?.addEventListener('keypress', event => {
            if (event.key === 'Enter') searchMovies();
        });

        if (backToTopButton) {
            backToTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    };

    /** 📌 Khởi chạy ứng dụng **/
    const init = () => {
        setupEventListeners();
        loadFilms(currentPage);
    };

    init();
});
