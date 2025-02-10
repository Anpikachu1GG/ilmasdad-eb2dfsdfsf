document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const embedURL = params.get('embed');
    const episodeName = params.get('name');
    const movieTitle = localStorage.getItem('movieTitle');
    const movieSlug = localStorage.getItem('movieSlug');

    // Kiểm tra nếu thiếu thông tin cần thiết
    if (!embedURL || !episodeName || !movieTitle) {
        document.getElementById('video-player-container').innerHTML = '<p>Không tìm thấy thông tin video.</p>';
        return;
    }
    // Lấy danh sách tập từ localStorage
    const episodes = JSON.parse(localStorage.getItem('episodes')) || [];

    // Tạo giao diện VideoPlayer
    const playerHTML = `
        <div class="VideoPlayer">
            <a href="film-details.html?slug=${movieSlug}" class="details-link">
            <h5>${movieTitle}</h5>
            </a>
            <h1>Đang phát: Tập ${episodeName}</h1>
            <div id="VideoOption01" class="Video on">
                <iframe width="100%" height="100%" 
                    src="${embedURL}" 
                    frameborder="0" scrolling="no" allowfullscreen allow="autoplay">
                </iframe>
            </div>
            <span class="BtnLight AAIco-lightbulb_outline lgtbx-lnk"></span>
            <span class="lgtbx"></span>
            <div class="navepi tagcloud"></div>
        </div>
    `;

    document.getElementById('video-player-container').innerHTML = playerHTML;

    // Tạo danh sách tập phim
    const episodeListHTML = `
        <div class="episode-list-container">
            <h3>Danh sách tập:</h3>
            <ul class="episode-list">
                ${episodes.map(ep => `
                    <li>
                        <a href="watching-movie.html?embed=${encodeURIComponent(ep.embed)}&name=${encodeURIComponent(ep.name)}">
                            Tập ${ep.name}
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    // Thêm danh sách tập phim vào dưới VideoPlayer
    document.getElementById('video-player-container').innerHTML += episodeListHTML;

    const toggleBtn = document.getElementById('toggle-theme-btn');
    const body = document.body;

    // Kiểm tra chế độ đã lưu trong localStorage
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-theme');
        toggleBtn.textContent = '🌞'; // Biểu tượng mặt trời cho chế độ sáng
    }

    // Xử lý sự kiện khi nhấn nút
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-theme');

        // Cập nhật biểu tượng và lưu trạng thái
        if (body.classList.contains('light-theme')) {
            toggleBtn.textContent = '🌞';
            localStorage.setItem('theme', 'light');
        } else {
            toggleBtn.textContent = '🌙';
            localStorage.setItem('theme', 'dark');
        }
    });
});

document.getElementById('toggle-nav').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('active');
});

// Hàm chuyển hướng đến trang tìm kiếm
function redirectToSearchPage() {
    const keyword = document.getElementById('search-input').value.trim(); // Lấy từ khóa
    if (keyword.length === 0) {
        alert('Vui lòng nhập từ khóa tìm kiếm.');
        return;
    }
    // Chuyển hướng đến trang tìm kiếm với từ khóa
    const searchUrl = `search.html?keyword=${encodeURIComponent(keyword)}`;
    window.location.href = searchUrl;
}

// Hàm xử lý khi nhấn phím trong ô tìm kiếm
function handleSearchKey(event) {
    // Nếu phím nhấn là Enter
    if (event.key === 'Enter') {
        redirectToSearchPage(); // Chuyển hướng tới trang tìm kiếm
    }
}

// Chuyển hướng đến trang tìm kiếm
function redirectToSearchPage() {
    const keyword = document.getElementById('search-input').value.trim();
    if (keyword.length === 0) {
        alert('Vui lòng nhập từ khóa tìm kiếm.');
        return;
    }
    // Chuyển hướng tới trang search.html với từ khóa tìm kiếm
    window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
}


// Hàm tìm kiếm phim
async function searchMovies() {
    const keyword = document.getElementById('search-input').value.trim(); // Lấy từ khóa từ input
    if (keyword.length === 0) {
        document.getElementById('film-container').innerHTML = '<p>Vui lòng nhập từ khóa để tìm kiếm.</p>';
        return; // Không tìm kiếm nếu không có từ khóa
    }

    try {
        // Gửi yêu cầu tới API tìm kiếm
        const response = await axios.get(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}`);
        
        if (response.status !== 200) {
            throw new Error('Không thể kết nối tới API tìm kiếm.');
        }

        const data = response.data; // Lấy dữ liệu từ API
        const filmContainer = document.getElementById('film-container');

        // Xóa nội dung cũ
        filmContainer.innerHTML = '';

        if (data.items && data.items.length > 0) {
            // Hiển thị danh sách phim tìm kiếm được
            data.items.forEach(film => {
                const filmCard = document.createElement('div');
                filmCard.classList.add('film-card');
                filmCard.innerHTML = `
                <a href="film-details.html?slug=${film.slug}" class="details-link">
                    <img src="${film.thumb_url}" alt="${film.name}" class="film-image">
                    <h2>${film.name} (${film.original_name || 'N/A'})</h2>
                    <p><strong>Tổng số tập:</strong> ${film.total_episodes || 'Chưa có thông tin'}</p>
                    <p><strong>Tập hiện tại:</strong> ${film.current_episode || 'Chưa có thông tin'}</p>
                    <p><strong>Thể loại: </strong>
                        ${film.category['2'] ? film.category['2'].list.map(category => category.name).join(', ') : 'Đang cập nhật'}
                    </p>
                    <p><strong>Dàn diễn viên:</strong> ${film.casts || 'Không rõ'}</p>
                </a>`;
                filmContainer.appendChild(filmCard);
            });
        } else {
            // Hiển thị thông báo nếu không tìm thấy phim
            filmContainer.innerHTML = '<p>Không tìm thấy kết quả phù hợp.</p>';
        }
    } catch (error) {
        console.error('Lỗi khi tìm kiếm phim:', error);
        document.getElementById('film-container').innerHTML = '<p>Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.</p>';
    }
}
// Hàm chuyển hướng đến trang tìm kiếm
function redirectToSearchPage() {
    const keyword = document.getElementById('search-input').value.trim(); // Lấy từ khóa
    if (keyword.length === 0) {
        alert('Vui lòng nhập từ khóa tìm kiếm.');
        return;
    }
    // Chuyển hướng đến trang tìm kiếm với từ khóa
    const searchUrl = `search.html?keyword=${encodeURIComponent(keyword)}`;
    window.location.href = searchUrl;
}

// Hàm xử lý khi nhấn phím trong ô tìm kiếm
function handleSearchKey(event) {
    // Nếu phím nhấn là Enter
    if (event.key === 'Enter') {
        redirectToSearchPage(); // Chuyển hướng tới trang tìm kiếm
    }
}

// Chuyển hướng đến trang tìm kiếm
function redirectToSearchPage() {
    const keyword = document.getElementById('search-input').value.trim();
    if (keyword.length === 0) {
        alert('Vui lòng nhập từ khóa tìm kiếm.');
        return;
    }
    // Chuyển hướng tới trang search.html với từ khóa tìm kiếm
    window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
}

// Lắng nghe sự kiện cuộn trang
window.addEventListener('scroll', () => {
    const backToTopButton = document.getElementById('back-to-top');
    
    // Hiển thị nút khi người dùng cuộn xuống dưới 100px
    if (window.scrollY > 100) {
        backToTopButton.style.display = 'block';
    } else {
        backToTopButton.style.display = 'none';
    }
});

// Xử lý khi người dùng nhấn nút "Quay về đầu trang"
document.getElementById('back-to-top').addEventListener('click', () => {
    // Cuộn trang lên đầu
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


