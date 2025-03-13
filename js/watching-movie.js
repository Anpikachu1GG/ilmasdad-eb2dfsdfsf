document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const embedURL = params.get('embed');
    const episodeName = params.get('name');
    const movieSlug = params.get('slug');

    if (!movieSlug) {
        console.error("Không tìm thấy slug trong URL");
        return;
    }

    async function fetchMovieDetails(slug) {
        try {
            const response = await fetch(`https://phim.nguonc.com/api/film/${slug}`);
            const data = await response.json();
            return {
                movieTitle: data.movie?.name || "Không rõ",
                episodes: data.movie?.episodes?.[0]?.items.map(ep => ({
                    name: ep.name.trim(),
                    embed: ep.embed
                })) || []
            };
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu phim:", error);
            return { movieTitle: "Không rõ", episodes: [] };
        }
    }

    const { movieTitle, episodes } = await fetchMovieDetails(movieSlug);

    if (movieTitle) {
        document.title = `${movieTitle} - Tập ${episodeName}`;
    }

    if (!embedURL || !episodeName || !movieTitle) {
        document.getElementById('video-player-container').innerHTML = '<h1 class="not-found">Không tìm thấy thông tin video.</h1>';
        return;
    }

    // Lưu tập đang xem vào localStorage
    const currentEpisode = {
        slug: movieSlug,
        episodeName: episodeName,
        movieTitle: movieTitle,
        timestamp: new Date().toISOString()
    };

    let watchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];

    // Kiểm tra xem phim đã có trong lịch sử chưa
    const existingMovieIndex = watchHistory.findIndex(item => item.slug === movieSlug);

    if (existingMovieIndex !== -1) {
        // Nếu phim đã có, chỉ cập nhật tập đang xem
        watchHistory[existingMovieIndex].episodeName = episodeName;
        watchHistory[existingMovieIndex].timestamp = currentEpisode.timestamp; // Cập nhật thời gian xem
    } else {
        // Nếu chưa có, thêm mới vào danh sách
        watchHistory.unshift(currentEpisode);
    }

    // Lưu lại danh sách vào localStorage
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));


    const currentIndex = episodes.findIndex(ep => ep.name === episodeName);
    const prevEpisode = episodes[currentIndex - 1] || null;
    const nextEpisode = episodes[currentIndex + 1] || null;

    document.getElementById('video-player-container').innerHTML = `
        <div class="VideoPlayer">
            <a href="film-details.html?slug=${movieSlug}" class="details-link">
                <h5>${movieTitle}</h5>
            </a>
            <h1>Đang phát: Tập ${episodeName}</h1>
            <div id="VideoOption01" class="Video on">
                <iframe width="100%" height="100%" src="${embedURL}" frameborder="0" scrolling="no" allowfullscreen allow="autoplay"></iframe>
            </div>
            <div class="episode-navigation">
                ${prevEpisode ? `<a href="watching-movie.html?embed=${encodeURIComponent(prevEpisode.embed)}&name=${encodeURIComponent(prevEpisode.name)}&slug=${movieSlug}" class="prev-episode">⬅ Tập trước</a>` : ''}
                ${nextEpisode ? `<a href="watching-movie.html?embed=${encodeURIComponent(nextEpisode.embed)}&name=${encodeURIComponent(nextEpisode.name)}&slug=${movieSlug}" class="next-episode">Tập tiếp theo ➡</a>` : ''}
            </div>
        </div>
        <div class="episode-list-container">
            <h3>Danh sách tập:</h3>
            <ul class="episode-list">
                ${episodes.map(ep => `
                    <li>
                        <a href="watching-movie.html?embed=${encodeURIComponent(ep.embed)}&name=${encodeURIComponent(ep.name)}&slug=${movieSlug}" class="${ep.name === episodeName ? 'disabled-episode' : ''}">
                            Tập ${ep.name}
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    // Nút cuộn lên đầu trang
    window.addEventListener('scroll', () => {
        const backToTopButton = document.getElementById('back-to-top');
        if (backToTopButton) {
            backToTopButton.style.display = window.scrollY > 100 ? 'block' : 'none';
        }
    });

    document.getElementById('back-to-top')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
