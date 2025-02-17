window.FilmApp = {
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

    // Gọi API động theo loại dữ liệu
    async fetchMovies(category, slug, page = 1) {
        try {
            const response = await axios.get(`https://phim.nguonc.com/api/films/${category}/${slug}?page=${page}`);
            return response.status === 200 ? response.data.items : [];
        } catch (error) {
            console.error(`Lỗi tải phim (${category} - ${slug}):`, error);
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
                        <h2>${film.name}</h2>
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

    // Tải phim theo danh mục
    async loadFilmsByCategory(category, slug) {
        const films = await this.fetchMovies(category, slug, this.currentPage);
        this.renderFilms(films);
        this.updatePaginationControls(films.length);
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

    // Cập nhật điều khiển phân trang
    updatePaginationControls(filmCount) {
        const prevBtns = document.querySelectorAll('#previous, #previous-bottom');
        const nextBtns = document.querySelectorAll('#next, #next-bottom');
        const pageInput = document.querySelector("#pageInput, #pageInput-bottom");

        prevBtns.forEach(btn => btn.disabled = this.currentPage === 1);
        nextBtns.forEach(btn => btn.disabled = filmCount < 12);
        pageInput.value = this.currentPage;
    },

    // Xử lý phân trang
    setupPagination() {
        document.addEventListener("click", (event) => {
            if (event.target.matches("#previous, #previous-bottom") && this.currentPage > 1) {
                this.currentPage--;
                this.loadFilmsByCategory("the-loai", this.getQueryParam("slug"));
            } else if (event.target.matches("#next, #next-bottom")) {
                this.currentPage++;
                this.loadFilmsByCategory("the-loai", this.getQueryParam("slug"));
            } else if (event.target.matches("#goToPage, #goToPage-bottom")) {
                const pageInput = document.querySelector("#pageInput, #pageInput-bottom");
                const targetPage = parseInt(pageInput.value);
                if (!isNaN(targetPage) && targetPage > 0) {
                    this.currentPage = targetPage;
                    this.loadFilmsByCategory("the-loai", this.getQueryParam("slug"));
                } else {
                    alert("Vui lòng nhập số trang hợp lệ!");
                }
            }
        });
    },

    // Khởi tạo trang
    init() {
        const category = this.getQueryParam("category") || "the-loai";
        const slug = this.getQueryParam("slug");
        if (slug) this.loadFilmsByCategory(category, slug);

        this.setupPagination();
    },
};

// Chạy ứng dụng khi tải trang
document.addEventListener("DOMContentLoaded", () => window.FilmApp.init());
