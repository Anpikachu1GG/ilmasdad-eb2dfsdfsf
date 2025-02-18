document.addEventListener('DOMContentLoaded', async () => {
    let currentPage = 1;
    const elements = {
        filmContainer: document.getElementById('trending-animes'),
        prevBtns: document.querySelectorAll('#previous, #previous-bottom'),
        nextBtns: document.querySelectorAll('#next, #next-bottom'),
        goToPageBtns: document.querySelectorAll('#goToPage, #goToPage-bottom'),
        pageInputs: document.querySelectorAll('#pageInput, #pageInput-bottom')
    };

    const fetchAniListTrending = async (page = 1) => {
        const query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(sort: TRENDING_DESC, type: ANIME) {
                        id
                        title { romaji english native }
                        coverImage { large }
                        episodes
                        averageScore
                        description
                    }
                }
            }
        `;
        const variables = { page, perPage: 12 };

        try {
            const response = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, variables })
            });
            const data = await response.json();
            return data?.data?.Page?.media || [];
        } catch (error) {
            console.error("Lỗi khi lấy danh sách trending từ AniList API:", error);
            return [];
        }
    };

    const searchOnNguonc = async (englishName, romajiName) => {
        const keyword = englishName || romajiName;
        if (!keyword) return alert('Không tìm thấy tên anime để tìm kiếm.');

        try {
            const response = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}`);
            const data = await response.json();

            if (data?.items?.length) {
                window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
            } else if (englishName && romajiName) {
                console.log(`Không tìm thấy "${englishName}", thử lại với "${romajiName}"`);
                searchOnNguonc(romajiName, '');
            } else {
                alert('Anime có thể chưa có trên trang hoặc có tên khác. Hãy thử tìm lại với từ khóa đơn giản hơn.');
            }
        } catch {
            alert('Lỗi kết nối, vui lòng thử lại.');
        }
    };

    const displayAnime = async (animeList) => {
        elements.filmContainer.innerHTML = '<h1 class="not-found">Đang tải...</h1>';

        if (!animeList.length) {
            elements.filmContainer.innerHTML = '<h1 class="not-found">Không tìm thấy anime nào.</h1>';
            return;
        }

        const fragment = document.createDocumentFragment();

        animeList.forEach(anime => {
            const card = document.createElement("div");
            card.className = "film-card";
            card.innerHTML = `
                <a class="details-link">
                    <img src="${anime.coverImage.large}" alt="${anime.title.romaji}" class="film-image" loading="lazy">
                    <h2>${anime.title.english || anime.title.romaji}</h2>
                    <p><strong>Tổng số tập:</strong> ${anime.episodes || 'Chưa rõ'}</p>
                    <p><strong>Điểm đánh giá:</strong> ⭐ ${anime.averageScore || 'Chưa đánh giá'}/100</p>
                    <div class="film-overview">${anime.description || 'Không có mô tả.'}</div>
                </a>
                <button class="search-nguonc-button">Tìm kiếm</button>
            `;

            card.querySelector(".search-nguonc-button").addEventListener("click", () => 
                searchOnNguonc(anime.title.english, anime.title.romaji));

            const overview = card.querySelector(".film-overview");
            overview.style.display = "-webkit-box";
            overview.style.webkitBoxOrient = "vertical";
            overview.style.webkitLineClamp = "19";
            overview.style.overflow = "hidden";

            fragment.appendChild(card);
        });

        elements.filmContainer.innerHTML = "";
        elements.filmContainer.appendChild(fragment);
    };

    const updatePaginationControls = (filmCount) => {
        elements.prevBtns.forEach(btn => btn.disabled = currentPage === 1);
        elements.nextBtns.forEach(btn => btn.disabled = filmCount < 12);
        elements.pageInputs.forEach(input => input.value = currentPage);
    };

    const handlePagination = async (action) => {
        if (action === 'next') currentPage++;
        else if (action === 'prev' && currentPage > 1) currentPage--;
        else if (action === 'goTo') {
            const targetPage = parseInt(elements.pageInputs[0].value);
            if (!isNaN(targetPage) && targetPage >= 1) currentPage = targetPage;
            else return alert('⚠️ Vui lòng nhập số trang hợp lệ!');
        }
        await loadTrending();
    };

    const loadTrending = async () => {
        const trendingAnime = await fetchAniListTrending(currentPage);
        await displayAnime(trendingAnime);
        updatePaginationControls(trendingAnime.length);
    };

    elements.prevBtns.forEach(btn => btn.addEventListener("click", () => handlePagination("prev")));
    elements.nextBtns.forEach(btn => btn.addEventListener("click", () => handlePagination("next")));
    elements.goToPageBtns.forEach(btn => btn.addEventListener("click", () => handlePagination("goTo")));

    await loadTrending();
});
