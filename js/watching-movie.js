document.addEventListener('DOMContentLoaded', async () => {
            const params = new URLSearchParams(window.location.search);
            const embedURL = params.get('embed');
            const episodeName = params.get('name');
            const movieSlug = params.get('slug');
            const slug = params.get('slug');

            if (!movieSlug) {
                console.error("Không tìm thấy slug trong URL");
                return;
            }


            // Hàm lấy dữ liệu phim từ film-details.html
            async function fetchMovieDetails(slug) {
                try {
                    // Gửi yêu cầu lấy thông tin phim từ API
                    const response = await fetch(`https://phim.nguonc.com/api/film/${slug}`);
                    const data = await response.json();
                    const film = data.movie;
            
                    // Lấy tên phim
                    const movieTitle = film.name || "Không rõ";
            
                    // Lấy danh sách tập
                    const episodes = film.episodes?.[0]?.items.map(episode => ({
                        name: episode.name.trim(),
                        embed: episode.embed
                    })) || [];
            
                    // Lưu vào sessionStorage để dùng lại
                    sessionStorage.setItem('movieTitle', movieTitle);
                    sessionStorage.setItem('movieSlug', slug);
                    sessionStorage.setItem('episodes', JSON.stringify(episodes));
            
                    return { movieTitle, episodes };
                } catch (error) {
                    console.error("Lỗi khi lấy dữ liệu phim:", error);
                    return { movieTitle: "Không rõ", episodes: [] };
                }
            }
            

            // Kiểm tra nếu dữ liệu chưa có trong sessionStorage
            let movieTitle = sessionStorage.getItem('movieTitle');
            let episodes = JSON.parse(sessionStorage.getItem('episodes')) || [];

            if (!movieTitle || episodes.length === 0) {
                localStorage.removeItem('movieTitle');
                localStorage.removeItem('movieSlug');
                localStorage.removeItem('episodes');

                sessionStorage.removeItem('movieTitle');
                sessionStorage.removeItem('movieSlug');
                sessionStorage.removeItem('episodes');
                const data = await fetchMovieDetails(movieSlug);
                movieTitle = data.movieTitle;
                episodes = data.episodes;
            }            

            if (movieTitle) {
                document.title = `${movieTitle} - Tập ${episodeName}`;
            }

            if (!embedURL || !episodeName || !movieTitle) {
                document.getElementById('video-player-container').innerHTML = '<p>Không tìm thấy thông tin video.</p>';
                return;
            }

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
                    <iframe width="100%" height="100%" 
                        src="${embedURL}" 
                        frameborder="0" scrolling="no" allowfullscreen allow="autoplay">
                    </iframe>
                </div>
                <div class="episode-navigation">
                    ${prevEpisode ? `<a href="watching-movie.html?embed=${encodeURIComponent(prevEpisode.embed)}&name=${encodeURIComponent(prevEpisode.name)}&slug=${movieSlug}" class="prev-episode">⬅ Tập trước</a>` : ''}
                    ${nextEpisode ? `<a href="watching-movie.html?embed=${encodeURIComponent(nextEpisode.embed)}&name=${encodeURIComponent(nextEpisode.name)}&slug=${movieSlug}" class="next-episode">Tập tiếp theo ➡</a>` : ''}
                </div>
                <span class="BtnLight AAIco-lightbulb_outline lgtbx-lnk"></span>
                <span class="lgtbx"></span>
                <div class="navepi tagcloud"></div>
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

            // Lưu lịch sử xem vào sessionStorage
            function saveWatchHistory(embedURL, episodeName) {
                const watchHistory = JSON.parse(sessionStorage.getItem('watchHistory')) || [];
                const newEntry = { embed: embedURL, name: episodeName };

                if (!watchHistory.some(entry => entry.embed === embedURL)) {
                    if (watchHistory.length >= 100) watchHistory.shift();
                    watchHistory.push(newEntry);
                    sessionStorage.setItem('watchHistory', JSON.stringify(watchHistory));
                }
            }

            saveWatchHistory(embedURL, episodeName);

            // Chế độ sáng/tối
            const toggleBtn = document.getElementById('toggle-theme-btn');
            const body = document.body;

            if (sessionStorage.getItem('theme') === 'light') {
                body.classList.add('light-theme');
                toggleBtn.textContent = '🌞';
            }

            toggleBtn.addEventListener('click', () => {
                body.classList.toggle('light-theme');
                if (body.classList.contains('light-theme')) {
                    toggleBtn.textContent = '🌞';
                    sessionStorage.setItem('theme', 'light');
                } else {
                    toggleBtn.textContent = '🌙';
                    sessionStorage.setItem('theme', 'dark');
                }
            });

            // Nút cuộn lên đầu trang
            window.addEventListener('scroll', () => {
                const backToTopButton = document.getElementById('back-to-top');
                backToTopButton.style.display = window.scrollY > 100 ? 'block' : 'none';
            });

            document.getElementById('back-to-top')?.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

        });