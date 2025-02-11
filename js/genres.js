const FilmApp = {
    currentPage: 1,
    tmdbApiKey: "fe149ef5184995f0ce33134201fb0c3d",

    // Lấy tham số URL
    getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    },

    // Gọi API TMDb để lấy đánh giá
    async getTMDbRating(originalName) {
        if (!originalName) return "N/A";
        try {
            const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${this.tmdbApiKey}&query=${encodeURIComponent(originalName)}`);
            const data = await response.json();
            return data.results.length ? data.results[0].vote_average : "Chưa đánh giá";
        } catch (error) {
            console.error("Lỗi lấy điểm TMDb:", error);
            return "N/A";
        }
    },

    // Gọi API lấy danh sách phim theo thể loại
    async loadFilmsByGenre() {
        const slug = this.getQueryParam("slug");
        if (!slug) return alert("Không tìm thấy thể loại!");

        try {
            const response = await axios.get(`https://phim.nguonc.com/api/films/the-loai/${slug}?page=${this.currentPage}`);
            return response.status === 200 ? response.data.items : [];
        } catch (error) {
            console.error("Lỗi tải phim:", error);
            return [];
        }
    },

    // Hiển thị danh sách phim
    async renderFilms(films) {
        const container = document.getElementById("film-container");
        container.innerHTML = "<p>⏳ Đang tải dữ liệu...</p>";

        const filmsWithRatings = await Promise.all(
            films.map(async (film) => {
                const rating = await this.getTMDbRating(film.original_name);
                return { ...film, rating };
            })
        );

        container.innerHTML = filmsWithRatings.length
            ? filmsWithRatings.map((film) => `
                <div class="film-card">
                    <a href="film-details.html?slug=${film.slug}" class="details-link">
                        <img src="${film.thumb_url}" alt="${film.name}" class="film-image">
                        <h2>${film.name}</h2
                        <p><strong>Tổng số tập:</strong> ${film.total_episodes}</p>
                        <p><strong>Tập hiện tại:</strong> ${film.current_episode}</p>
                        <p><strong>Đạo diễn:</strong> ${film.director}</p>
                        <p><strong>Dàn diễn viên:</strong> ${film.casts}</p>
                        <p><strong>⭐ Đánh giá:</strong> ${film.rating}/10</p>
                    </a>
                </div>
            `).join("")
            : "<p>Không tìm thấy phim nào.</p>";
    },

    // Tải phim theo trang
    async loadFilmsByGenrePage(page) {
        this.currentPage = page;
        const films = await this.loadFilmsByGenre();
        this.renderFilms(films);
    },

    // Xử lý tìm kiếm phim
    async searchMovies() {
        const keyword = document.getElementById("search-input").value.trim();
        if (!keyword) return alert("Vui lòng nhập từ khóa.");

        try {
            const response = await axios.get(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}`);
            this.renderFilms(response.data.items || []);
        } catch (error) {
            console.error("Lỗi tìm kiếm phim:", error);
        }
    },

    // Chuyển hướng trang tìm kiếm
    redirectToSearchPage() {
        const keyword = document.getElementById("search-input").value.trim();
        if (keyword) window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
    },

    // Chuyển đổi chế độ sáng/tối
    toggleTheme() {
        const body = document.body;
        const btn = document.getElementById("toggle-theme-btn");
    
        if (!btn) return; // Nếu nút không tồn tại thì không làm gì cả
    
        // Kiểm tra theme lưu trong localStorage và áp dụng ngay
        const savedTheme = localStorage.getItem("theme") || "dark";
        if (savedTheme === "light") {
            body.classList.add("light-theme");
            btn.textContent = "🌞";
        } else {
            body.classList.remove("light-theme");
            btn.textContent = "🌙";
        }
    
        // Chỉ gán sự kiện click một lần
        btn.onclick = () => {
            const isLight = body.classList.toggle("light-theme");
            const newTheme = isLight ? "light" : "dark";
            localStorage.setItem("theme", newTheme);
            btn.textContent = isLight ? "🌞" : "🌙";
        };
    },    

    // Xử lý phân trang
    setupPagination() {
        document.addEventListener("click", (event) => {
            if (event.target.matches("#previous, #previous-bottom") && this.currentPage > 1) {
                this.loadFilmsByGenrePage(--this.currentPage);
            } else if (event.target.matches("#next, #next-bottom")) {
                this.loadFilmsByGenrePage(++this.currentPage);
            } else if (event.target.matches("#goToPage, #goToPage-bottom")) {
                const pageInput = document.querySelector("#pageInput, #pageInput-bottom");
                const targetPage = parseInt(pageInput.value);
                if (!isNaN(targetPage) && targetPage > 0) {
                    this.loadFilmsByGenrePage(targetPage);
                } else {
                    alert("Vui lòng nhập số trang hợp lệ!");
                }
            }
        });
    },

    // Quay về đầu trang
    setupBackToTop() {
        const btn = document.getElementById("back-to-top");
        window.addEventListener("scroll", () => btn.style.display = window.scrollY > 100 ? "block" : "none");
        btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    },

    // Lưu & tải bộ lọc
    filterStorageKey(slug) {
        return `filmFilterStatus_${slug}`;
    },

    getSavedStatus(slug) {
        return localStorage.getItem(this.filterStorageKey(slug));
    },

    saveFilterStatus(slug, status) {
        localStorage.setItem(this.filterStorageKey(slug), status);
    },

    // Reset bộ lọc nếu slug thay đổi
    resetFilterIfSlugChanged(slug) {
        const prevSlug = localStorage.getItem("currentSlug");
        if (prevSlug !== slug) {
            localStorage.removeItem(this.filterStorageKey(prevSlug));
            localStorage.setItem("currentSlug", slug);
        }
    },

    // Khởi tạo trang
    init() {
        this.loadFilmsByGenrePage(this.currentPage);
    
        // Gọi ngay để áp dụng theme
        this.toggleTheme();
    
        this.setupBackToTop();
        this.setupPagination();
    
        document.getElementById("filter-confirm-button")?.addEventListener("click", () => {
            this.saveFilterStatus(this.getQueryParam("slug"), document.getElementById("filter-select").value);
            this.loadFilmsByGenrePage(this.currentPage);
        });
    
        document.getElementById("search-input")?.addEventListener("keypress", (event) => {
            if (event.key === "Enter") this.redirectToSearchPage();
        });
    },
};    

// Chạy ứng dụng khi tải trang
document.addEventListener("DOMContentLoaded", () => FilmApp.init());
