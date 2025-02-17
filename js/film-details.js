document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const movieTitle = sessionStorage.getItem('movieTitle'); // Lấy tên phim từ sessionStorage
    const slug = params.get('slug');
    const container = document.getElementById('film-details-container');

    if (!slug) {
        container.innerHTML = '<p>Không tìm thấy phim.</p>';
        return;
    }
    if (movieTitle) {
        document.title = `${movieTitle}`;
    }

    try {
        const { data } = await axios.get(`https://phim.nguonc.com/api/film/${slug}`);
        const film = data.movie;
        const tmdbRating = await getTmdbRating(film.original_name || film.name);

        const genres = film.category?.['2']?.list?.map(item => ({
            slug: toSlug(item.name),
            name: item.name
        })) || [];

        sessionStorage.setItem('genres', JSON.stringify(genres));
        sessionStorage.setItem('movieTitle', film.name);
        sessionStorage.setItem('movieSlug', film.slug);
        document.title = `${film.name}`;

        container.innerHTML = `
            <img src="${film.thumb_url}" alt="Poster ${film.name}" class="film-image">
            <div class="film-info">
                <h1>${film.name} __ <span class="original-name">${film.original_name || ''}</span></h1>
                <p><strong>Mô tả:</strong> ${film.description || 'Đang cập nhật'}</p>
                <p><strong>Điểm TMDB:</strong> ⭐ ${tmdbRating}/10</p>
                ${film.total_episodes ? `<p><strong>Tổng số tập:</strong> ${film.total_episodes}</p>` : ''}
                ${film.current_episode ? `<p><strong>Tập hiện tại:</strong> ${film.current_episode}</p>` : ''}
                ${film.casts ? `<p><strong>Diễn viên:</strong> ${film.casts}</p>` : ''}
                <p><strong>Thể loại:</strong> 
                    ${genres.map(g => `<a href="genres.html?slug=${g.slug}">${g.name}</a>`).join(', ') || 'Đang cập nhật'}
                </p>
                <h3>Danh sách tập:</h3>
                <ul class="episode-list">
                    ${film.episodes?.[0]?.items.length > 0
                        ? film.episodes[0].items.map(episode => `
                            <li>
                                <a href="watching-movie.html?embed=${encodeURIComponent(episode.embed)}&name=${encodeURIComponent(episode.name)}&slug=${film.slug}">
                                    Tập ${episode.name}
                                </a>
                            </li>
                        `).join('')
                        : '<li>Không có tập nào.</li>'
                    }
                    ${film.episodes?.[0]?.items.length > 30
                        ? `<button id="show-more-episodes" class="show-more-btn">Xem thêm</button>`
                        : ''}
                </ul>
                <h3>Phim có cùng thể loại:</h3>
                <div id="related-films" class="related-films"></div>
            </div>
        `;

        const showMoreButton = document.getElementById('show-more-episodes');
        if (showMoreButton) {
            showMoreButton.addEventListener('click', () => {
                document.querySelector('.episode-list').innerHTML = film.episodes[0].items.map(episode => `
                    <li>
                        <a href="watching-movie.html?embed=${encodeURIComponent(episode.embed)}&name=${encodeURIComponent(episode.name)}&slug=${film.slug}">
                            Tập ${episode.name}
                        </a>
                    </li>
                `).join('');
                showMoreButton.style.display = 'none';
                window.location.href = `watching-movie.html?embed=${encodeURIComponent(film.episodes[0].items[0].embed)}&name=${encodeURIComponent(film.episodes[0].items[0].name)}&slug=${film.slug}`;
            });
        }
        if (film.episodes?.[0]?.items) {
            sessionStorage.setItem('episodes', JSON.stringify(film.episodes[0].items));
        }

        loadRelatedFilms(genres.map(g => g.slug));
    } catch (error) {
        console.error('❌ Lỗi khi tải phim:', error);
        container.innerHTML = '<p>Không thể tải thông tin phim. Vui lòng thử lại sau.</p>';
    }
});

async function getTmdbRating(originalName) {
    if (!originalName) return 'N/A';
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=fe149ef5184995f0ce33134201fb0c3d&query=${encodeURIComponent(originalName)}`);
        return data.results.length ? data.results[0].vote_average.toFixed(1) : 'Chưa có đánh giá';
    } catch (error) {
        console.error('❌ Lỗi lấy điểm TMDB:', error);
        return 'N/A';
    }
}

async function loadRelatedFilms(categorySlugs) {
    const relatedContainer = document.getElementById('related-films');
    relatedContainer.innerHTML = '<p>Đang tải phim liên quan...</p>';
    
    if (!categorySlugs.length) {
        relatedContainer.innerHTML = '<p>Không có phim liên quan.</p>';
        return;
    }

    try {
        const responses = await Promise.all(categorySlugs.map(slug => 
            axios.get(`https://phim.nguonc.com/api/films/the-loai/${slug}?page=${Math.floor(Math.random() * 18) + 1}`)
        ));

        const relatedFilms = [...new Map(responses.flatMap(res => res.data.items).map(film => [film.slug, film])).values()].slice(0, 6);
        const ratings = await getTmdbRatings(relatedFilms);

        relatedContainer.innerHTML = relatedFilms.map(film => `
            <div class="related-film-card">
                <a href="film-details.html?slug=${film.slug}">
                    <img src="${film.thumb_url}" alt="${film.name}" class="film-related-image">  
                    <h4>${film.name}</h4>
                    <div class="film-rating"><h4>Điểm TMDB: ⭐ ${ratings[film.slug] || 'N/A'}/10</h4></div>
                </a>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ Lỗi lấy phim liên quan:', error);
        relatedContainer.innerHTML = '<p>Không thể tải phim liên quan.</p>';
    }
}

async function getTmdbRatings(films) {
    const ratings = {};
    await Promise.all(films.map(async (film) => {
        try {
            const { data } = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=fe149ef5184995f0ce33134201fb0c3d&query=${encodeURIComponent(film.name)}`);
            ratings[film.slug] = data.results.length ? data.results[0].vote_average.toFixed(1) : 'Chưa có';
        } catch (error) {
            console.error(`❌ Lỗi lấy điểm TMDB: ${film.name}`, error);
            ratings[film.slug] = 'N/A';
        }
    }));
    return ratings;
}

function toSlug(name) {
    return name.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}
