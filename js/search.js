document.addEventListener('DOMContentLoaded', () => {
    // Initial current page
    let currentPage = 1;
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const previousButton = document.getElementById('previous');
    const nextButton = document.getElementById('next');
    const toggleBtn = document.getElementById('toggle-theme-btn');
    const backToTopButton = document.getElementById('back-to-top');
    const pageInput = document.getElementById('pageInput'); // Get the page input element

    // Xử lý sự kiện tìm kiếm
    function redirectToSearchPage() {
        const keyword = searchInput.value.trim();
        if (!keyword) {
            alert('🔍 Vui lòng nhập từ khóa tìm kiếm.');
            return;
        }
        window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
    }

    // Lấy từ khóa từ URL
    function getQueryParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Hiển thị kết quả tìm kiếm
    async function loadSearchResults(page = 1) {
        const keyword = getQueryParameter('keyword');
        const filmContainer = document.getElementById('film-container');

        if (!keyword) {
            filmContainer.innerHTML = '<p>⚠️ Vui lòng nhập từ khóa để tìm kiếm.</p>';
            return;
        }

        searchInput.value = keyword; // Hiển thị từ khóa trong ô tìm kiếm
        filmContainer.innerHTML = '<p>⏳ Đang tải kết quả...</p>';

        try {
            const response = await axios.get(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}&page=${page}`);
            if (response.status !== 200) throw new Error('Không thể kết nối với API.');

            const films = response.data.items;
            filmContainer.innerHTML = ''; // Xóa nội dung cũ

            if (films.length === 0) {
                filmContainer.innerHTML = '<p>⚠️ Không tìm thấy phim nào phù hợp.</p>';
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

            // Cập nhật trạng thái phân trang
            previousButton.disabled = page === 1;
            nextButton.disabled = films.length < 10; // Giả sử mỗi trang có 10 phim

            // Set the current page in the page input field
            if (pageInput) {
                pageInput.value = currentPage;
            }

        } catch (error) {
            console.error('❌ Lỗi khi tìm kiếm phim:', error);
            filmContainer.innerHTML = '<h1>❌ Đã xảy ra lỗi khi tải kết quả. Vui lòng thử lại sau.</h1>';
        }
    }

    // Xử lý chuyển trang
    function handlePagination(action) {
        if (action === 'next') currentPage++;
        else if (action === 'prev' && currentPage > 1) currentPage--;

        loadSearchResults(currentPage);
    }

    // 🌞 Bật/tắt chế độ sáng/tối
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('toggle-theme-btn');
        const body = document.body;
    
        if (localStorage.getItem('theme') === 'light') {
            body.classList.add('light-theme');
            toggleBtn.textContent = '🌞';
        }
    
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('light-theme');
            toggleBtn.textContent = body.classList.contains('light-theme') ? '🌞' : '🌙';
            localStorage.setItem('theme', body.classList.contains('light-theme') ? 'light' : 'dark');
        });
    });

    // 🔝 Xử lý nút "Quay về đầu trang"
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            backToTopButton.style.display = window.scrollY > 100 ? 'block' : 'none';
        });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Gán sự kiện cho tìm kiếm
    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                redirectToSearchPage();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', redirectToSearchPage);
    }

    // Gán sự kiện phân trang
    if (previousButton) previousButton.addEventListener('click', () => handlePagination('prev'));
    if (nextButton) nextButton.addEventListener('click', () => handlePagination('next'));

    // Gọi API khi tải trang
    loadSearchResults(currentPage);
});
