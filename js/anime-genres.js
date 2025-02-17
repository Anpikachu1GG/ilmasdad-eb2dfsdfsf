const FilmApp = {
    currentPage: 1,
    anilistApiUrl: "https://graphql.anilist.co",
    currentSort: "TRENDING_DESC",
    genres: null, // Cache danh sách thể loại

    statusTranslations: new Map([
        ["FINISHED", "Hoàn Thành"],
        ["RELEASING", "Đang Phát Sóng"],
        ["NOT_YET_RELEASED", "Chưa Phát Sóng"],
        ["CANCELLED", "Đã Hủy"],
        ["HIATUS", "Tạm Dừng"],
        ["UPCOMING", "Sắp Ra Mắt"]
    ]),

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            if (timeout) cancelAnimationFrame(timeout);
            timeout = requestAnimationFrame(() => func.apply(this, args));
        };
    },

    async fetchAnimeByGenre(genre, page = this.currentPage, sort = this.currentSort) {
        const query = `
            query ($genre: [String], $page: Int, $sort: [MediaSort]) {
                Page(page: $page, perPage: 12) {
                    media(sort: $sort, type: ANIME, genre_in: $genre) {
                        id
                        title { romaji english }
                        genres
                        coverImage { large }
                        averageScore
                        episodes
                        description
                        status
                    }
                }
            }
        `;

        try {
            const response = await fetch(this.anilistApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ query, variables: { genre: [genre], page, sort: [sort] } })
            });

            const { data } = await response.json();
            this.totalFilmCount = data?.Page?.media.length || 0; // Cập nhật tổng số lượng phim
            return data?.Page?.media || [];
        } catch (error) {
            console.error("Lỗi khi lấy danh sách anime:", error);
            return [];
        }
    },

    async renderAnimes(animes) {
        const container = document.getElementById("anime-genres");
        if (!container) return console.error("Không tìm thấy phần tử 'anime-genres'");

        container.innerHTML = "<p>Đang tải...</p>";

        if (animes.length === 0) {
            container.innerHTML = "<p>Không tìm thấy anime nào.</p>";
            return;
        }

        const fragment = document.createDocumentFragment();
        animes.forEach(anime => {
            const card = document.createElement("li");
            card.classList.add("film-card");
            card.innerHTML = this.createAnimeCard(anime);

            // Gán sự kiện hover để hiển thị mô tả
            const overview = card.querySelector(".film-overview");
            card.addEventListener("mouseenter", () => overview.classList.remove("hidden"));
            card.addEventListener("mouseleave", () => overview.classList.add("hidden"));

            // Áp dụng giới hạn cho mô tả
            overview.style.display = "-webkit-box";
            overview.style.webkitBoxOrient = "vertical";
            overview.style.webkitLineClamp = "19";  // Giới hạn mô tả ở 5 dòng
            overview.style.overflow = "hidden";

            fragment.appendChild(card);
        });

        container.innerHTML = "";
        container.appendChild(fragment);

        document.querySelectorAll(".search-nguonc-button").forEach(button =>
            button.addEventListener("click", () => this.searchOnNguonc(button.dataset.title))
        );

        this.updatePaginationControls(animes.length);
    },

    createAnimeCard(anime) {
        const status = this.statusTranslations.get(anime.status) || anime.status;
        return `
            <a class="details-link">
                <img src="${anime.coverImage.large}" alt="${anime.title.romaji}" class="film-image" loading="lazy">
                <h2>${anime.title.romaji}</h2>
                <p><strong>Tổng số tập:</strong> ${anime.episodes || 'Chưa rõ'}</p>
                <p><strong>Điểm đánh giá:</strong> ⭐ ${anime.averageScore || 'N/A'}/100</p>
                <p><strong>Trạng thái:</strong> ${status}</p>
                <p><strong>Thể loại:</strong> ${anime.genres.join(', ') || 'Chưa có'}</p>
                <div class="film-overview hidden">${anime.description || 'Không có mô tả.'}</div>
            </a>
            <button class="search-nguonc-button" data-title="${anime.title.english || anime.title.romaji}">Tìm kiếm</button>
        `;
    },

    updatePaginationControls(filmCount) {
        const previousButtons = document.querySelectorAll("#previous, #previous-bottom");
        const nextButtons = document.querySelectorAll("#next, #next-bottom");
        const pageInputs = document.querySelectorAll("#pageInput, #pageInput-bottom");

        previousButtons.forEach(btn => btn.disabled = this.currentPage === 1);
        nextButtons.forEach(btn => btn.disabled = filmCount < 12);
        pageInputs.forEach(input => input.value = this.currentPage);
    },

    handlePagination(action) {
        if (action === 'next') {
            this.currentPage++;
        } else if (action === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        } else if (action === 'goTo') {
            const targetPage = parseInt(document.querySelector("#pageInput").value);
            if (!isNaN(targetPage) && targetPage >= 1) {
                this.currentPage = targetPage;
            } else {
                alert('⚠️ Vui lòng nhập số trang hợp lệ!');
                return;
            }
        }
        this.loadAnimeByGenre();
    },

    loadAnimeByGenre() {
        const genre = this.getQueryParam("genre");
        if (!genre) return;

        document.getElementById("anime-genres").innerHTML = "<p>Đang tải...</p>";

        this.fetchAnimeByGenre(genre, this.currentPage)
            .then(animes => {
                this.renderAnimes(animes);
                this.updatePaginationControls(animes.length);
            });
    },

    async searchOnNguonc(title) {
        if (!title) return alert('Không tìm thấy tên anime để tìm kiếm.');

        try {
            const response = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(title)}`);
            const data = await response.json();
            if (data?.items?.length) {
                window.location.href = `search.html?keyword=${encodeURIComponent(title)}`;
            } else {
                alert('Anime chưa có trên trang, thử tìm với tên khác.');
            }
        } catch {
            alert('Lỗi kết nối, vui lòng thử lại.');
        }
    },

    getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    },

    async loadGenres() {
        if (this.genres) return;

        try {
            const response = await fetch(this.anilistApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ query: "query { GenreCollection }" })
            });

            const { data } = await response.json();
            this.genres = (data?.GenreCollection || []).filter(genre => genre !== "Hentai");

            const genreDropdownMenu = document.getElementById("genre-dropdown-menu");
            if (genreDropdownMenu) {
                genreDropdownMenu.innerHTML = this.genres.map(genre =>
                    `<button onclick="redirectToGenre('${genre}')">${genre}</button>`
                ).join("");
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách thể loại:", error);
        }
    },

    init() {
        this.loadAnimeByGenre();
        this.loadGenres();

        this.updateSort = this.debounce(function (sortType) {
            this.currentSort = sortType;
            this.currentPage = 1;
            this.loadAnimeByGenre();
        }, 300);

        document.addEventListener("click", (event) => {
            if (event.target.matches(".sort-button")) {
                this.updateSort(event.target.dataset.sort);
            }
        });

        // Initialize pagination buttons with the new functions
        document.getElementById("previous").addEventListener("click", () => this.handlePagination('prev'));
        document.getElementById("next").addEventListener("click", () => this.handlePagination('next'));
        document.getElementById("goToPage").addEventListener("click", () => this.handlePagination('goTo'));
        document.getElementById("previous-bottom").addEventListener("click", () => this.handlePagination('prev'));
        document.getElementById("next-bottom").addEventListener("click", () => this.handlePagination('next'));
        document.getElementById("goToPage-bottom").addEventListener("click", () => this.handlePagination('goTo'));
    }
};

function redirectToGenre(genre) {
    window.location.href = `anime-genres.html?genre=${encodeURIComponent(genre)}`;
}

document.addEventListener("DOMContentLoaded", () => FilmApp.init());
