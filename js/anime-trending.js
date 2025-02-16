document.addEventListener('DOMContentLoaded', async () => {
    let currentPage = 1;
    const elements = {
        filmContainer: document.getElementById('trending-animes'),
        prevBtns: document.querySelectorAll('#previous, #previous-bottom'),
        nextBtns: document.querySelectorAll('#next, #next-bottom'),
        goToPageBtns: document.querySelectorAll('#goToPage, #goToPage-bottom'),
        pageInput: document.getElementById('pageInput'),
    };

    const fetchAniListTrending = async (page = 1) => {
        const query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(sort: TRENDING_DESC, type: ANIME) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                        }
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
            return data.data.Page.media;
        } catch (error) {
            console.error("Lỗi khi lấy danh sách trending từ AniList API:", error);
            return [];
        }
    };

    const searchOnNguonc = async (englishName, vietnameseName) => {
        const keyword = englishName || vietnameseName;
        if (!keyword) return alert('Không tìm thấy tên anime để tìm kiếm.');

        const data = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}`)
            .then(res => res.json())
            .catch(() => null);

        if (data?.items?.length) {
            window.location.href = `search.html?keyword=${encodeURIComponent(keyword)}`;
        } else if (englishName && vietnameseName) {
            console.log(`Không tìm thấy anime "${englishName}", thử lại với "${vietnameseName}"`);
            searchOnNguonc(vietnameseName, '');
        } else {
            alert('Anime có thể chưa có trên trang hoặc có tên khác, hãy thử tìm lại bằng tên khác trên thanh tìm kiếm, bạn hãy thử bỏ số phần đi, ví dụ thay vì Shangri-La Frontier 2nd Season, thì hãy thử Shangri-La Frontier.');
        }
    };

    const displayAnime = async (animeList) => {
        elements.filmContainer.innerHTML = animeList.length ? '' : '<p>Không tìm thấy anime nào.</p>';
        
        animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'film-card';
            animeCard.innerHTML = `
                <a class='details-link'>
                    <img src='${anime.coverImage.large}' alt='${anime.title.romaji}' class='film-image'>
                    <h2>${anime.title.romaji}</h2>
                    <p><strong>Tổng số tập:</strong> ${anime.episodes || 'Chưa rõ'}</p>
                    <p><strong>Điểm đánh giá:</strong> ⭐ ${anime.averageScore || 'N/A'}/100</p>
                    <div class='film-overview'>${anime.description || 'Không có mô tả.'}</div>
                </a>
                <button class='search-nguonc-button'>Tìm kiếm</button>
            `;

            animeCard.querySelector('.search-nguonc-button').addEventListener('click', () => 
                searchOnNguonc(anime.title.english, anime.title.romaji));

            const overview = animeCard.querySelector('.film-overview');
            overview.style.display = '-webkit-box';
            overview.style.webkitBoxOrient = 'vertical';
            overview.style.webkitLineClamp = '19';
            overview.style.overflow = 'hidden';

            elements.filmContainer.appendChild(animeCard);
        });
    };

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

    const loadTrending = async () => {
        const trendingAnime = await fetchAniListTrending(currentPage);
        await displayAnime(trendingAnime);
    };

    elements.prevBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('prev')));
    elements.nextBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('next')));
    elements.goToPageBtns.forEach(btn => btn.addEventListener('click', () => handlePagination('goTo')));

    await loadTrending();
});
