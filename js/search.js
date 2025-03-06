document.addEventListener('DOMContentLoaded', () => {
    // Biến toàn cục
    let currentPage = 1;
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const previousButton = document.getElementById('previous');
    const nextButton = document.getElementById('next');
    const backToTopButton = document.getElementById('back-to-top');
    const pageInput = document.getElementById('pageInput');

    // Xử lý nút chuyển đổi theme
    const themeToggle = document.querySelector('.switch .input__check');
    const body = document.body;

    if (themeToggle) {
        // Kiểm tra theme từ localStorage
        if (localStorage.getItem('theme') === 'light') {
            body.classList.add('light-theme');
            themeToggle.checked = true;
        }

        // Bật/tắt theme
        themeToggle.addEventListener('change', () => {
            body.classList.toggle('light-theme');
            localStorage.setItem('theme', body.classList.contains('light-theme') ? 'light' : 'dark');
        });
    }

    // Xử lý tìm kiếm
    function redirectToSearchPage() {
        const keyword = searchInput.value.trim();
        if (!keyword) {
            alert('🔍 Vui lòng nhập từ khóa tìm kiếm.');
            return;
        }
        window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
    }

    function getQueryParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    function showLoader() {
        const loader = document.querySelector(".wheel-and-hamster");
        if (loader) loader.style.display = "flex";
    }

    function hideLoader() {
        const loader = document.querySelector(".wheel-and-hamster");
        if (loader) loader.style.display = "none";
    }

    async function loadSearchResults(page = 1) {
        const keyword = getQueryParameter('keyword');
        const filmContainer = document.getElementById('film-search-container');

        if (!filmContainer) return;

        if (!keyword) {
            filmContainer.innerHTML = "<h1>⚠️ Vui lòng nhập từ khóa để tìm kiếm.</h1>";
            return;
        }

        searchInput.value = keyword;
        filmContainer.innerHTML = "<h1>⏳ Đang tải kết quả...</h1>";
        showLoader();

        try {
            const response = await axios.get(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`);
            if (response.status !== 200) throw new Error('Không thể kết nối với API.');

            const films = response.data.items;
            filmContainer.innerHTML = '';

            if (films.length === 0) {
                filmContainer.innerHTML = '<h1 class="not-found">⚠️ Không tìm thấy phim nào phù hợp.</h1>';
                hideLoader();
                return;
            }

            films.forEach(film => {
                const filmCard = document.createElement('div');
                filmCard.classList.add('film-card');
                filmCard.innerHTML = `
                    <a href="film-details.html?slug=${film.slug}" class="details-link">
                        <img src="${film.thumb_url}" alt="${film.name}" class="film-image">
                        <h2>${film.name}</h2>
                        <p><strong>Tổng số tập:</strong> ${film.total_episodes || 'Chưa có thông tin'}</p>
                        <p><strong>Tập hiện tại:</strong> ${film.current_episode || 'Chưa có thông tin'}</p>
                        <p><strong>Đạo diễn:</strong> ${film.director || 'Không rõ'}</p>
                        <p><strong>Dàn diễn viên:</strong> ${film.casts || 'Không rõ'}</p>
                    </a>
                `;
                filmContainer.appendChild(filmCard);
            });

            previousButton.disabled = page === 1;
            nextButton.disabled = films.length < 10;

            if (pageInput) {
                pageInput.value = currentPage;
            }

        } catch (error) {
            console.error('❌ Lỗi khi tìm kiếm phim:', error);
            filmContainer.innerHTML = '<h1 class="not-found">❌ Đã xảy ra lỗi khi tải kết quả. Vui lòng thử lại sau.</h1>';
        } finally {
            hideLoader();
        }
    }

    // Xử lý tìm kiếm bằng phím Enter
    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') redirectToSearchPage();
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', redirectToSearchPage);
    }

    // Chuyển trang
    function handlePagination(action) {
        if (action === 'next') currentPage++;
        else if (action === 'prev' && currentPage > 1) currentPage--;

        loadSearchResults(currentPage);
    }

    if (previousButton) previousButton.addEventListener('click', () => handlePagination('prev'));
    if (nextButton) nextButton.addEventListener('click', () => handlePagination('next'));

    // Xử lý "Quay về đầu trang"
    if (backToTopButton) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 100) {
              backToTopBtn.style.display = "flex"; // Hiển thị nút khi cuộn xuống
            } else {
              backToTopBtn.style.display = "none"; // Ẩn khi ở đầu trang
            }
          });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Gọi API khi tải trang
    loadSearchResults(currentPage);
});
