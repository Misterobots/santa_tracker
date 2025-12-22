document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('cctv-player');
    const camIdDisplay = document.getElementById('cam-id');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    // Configuration
    const CONFIG_ENDPOINT = 'config.json';
    const MEDIA_FOLDER = 'media/';

    // State
    let primaryStream = null; // YouTube ID or Stream URL
    let fallbackPlaylist = ['a1.mp4', 'a2.mp4', 'a3.mp4'];
    let currentPlaylist = [];
    let playlistIndex = 0;
    let isFallbackMode = false;
    let cycleTimer = null;

    // YouTube Player State
    let ytPlayer = null;
    let ytReady = false;

    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = function () {
        ytPlayer = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: '', // Will load later
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'modestbranding': 1,
                'rel': 0,
                'autoplay': 1,
                'mute': 1,
                'origin': window.location.origin
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    };

    function onPlayerReady(event) {
        ytReady = true;
        console.log("YouTube Player Ready");
        if (primaryStream && !isFallbackMode) {
            playPrimary();
        }
    }

    function onPlayerStateChange(event) {
        // If ended, maybe loop or switch? For live stream, it shouldn't end.
        if (event.data === YT.PlayerState.ENDED) {
            console.log("YouTube Stream Ended. Switching to fallback.");
            startFallbackMode();
        }
    }

    function onPlayerError(event) {
        console.warn("YouTube Player Error:", event.data);
        startFallbackMode();
    }

    // Initialize Video System
    async function initVideoSystem() {
        try {
            // Force bypass cache
            const response = await fetch(CONFIG_ENDPOINT + '?t=' + new Date().getTime());
            if (response.ok) {
                const config = await response.json();
                if (config.files && Array.isArray(config.files) && config.files.length > 0) {
                    processConfig(config.files);
                }
            }
        } catch (e) {
            console.warn("Could not load config.json, using default playlist.", e);
            startFallbackMode();
        }
    }

    function processConfig(files) {
        console.log("Processing Config Files:", files);
        // Separate Primary (YouTube) from Fallback (MP4s)
        const ytItem = files.find(f => f.includes('youtube.com') || f.includes('youtu.be'));
        const mp4Items = files.filter(f => !f.includes('youtube.com') && !f.includes('youtu.be'));

        if (ytItem) {
            // Extract ID
            if (ytItem.includes('v=')) {
                primaryStream = ytItem.split('v=')[1].split('&')[0];
            } else if (ytItem.includes('youtu.be/')) {
                primaryStream = ytItem.split('youtu.be/')[1].split('?')[0];
            }
        }

        if (mp4Items.length > 0) {
            fallbackPlaylist = mp4Items;
        }

        console.log("Primary Stream:", primaryStream);
        console.log("Fallback Playlist:", fallbackPlaylist);

        if (primaryStream) {
            // Try to play primary
            if (ytReady) {
                playPrimary();
            } else {
                // Wait a bit, if not ready, retry or fallback? 
                // onPlayerReady will trigger playPrimary logic.
                // Set a safety timeout
                setTimeout(() => {
                    if (!ytReady) startFallbackMode();
                }, 3000);
            }
        } else {
            startFallbackMode();
        }
    }

    function playPrimary() {
        console.log("Attempting to play Primary Stream (YouTube)...");
        isFallbackMode = false;

        // UI Updates
        updateCamLabel("LIVE");
        togglePlayers('youtube');

        // Show LIVE badge
        const liveBadge = document.getElementById('live-badge');
        if (liveBadge) liveBadge.style.display = 'flex';

        if (ytPlayer && ytPlayer.loadVideoById) {
            ytPlayer.loadVideoById(primaryStream);
            ytPlayer.mute(); // Auto-play policies
            ytPlayer.playVideo();
        }
    }

    function startFallbackMode() {
        if (isFallbackMode) return; // Already in fallback
        console.log("Engaging Fallback Mode (Local Playlist)...");

        isFallbackMode = true;
        currentPlaylist = [...fallbackPlaylist]; // Clone
        shufflePlaylist(currentPlaylist);

        // Hide LIVE badge
        const liveBadge = document.getElementById('live-badge');
        if (liveBadge) liveBadge.style.display = 'none';

        // Stop YT
        if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();

        playlistIndex = 0;
        playLocalVideo(0);
    }

    function shufflePlaylist(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
    }

    function playLocalVideo(index) {
        if (!isFallbackMode) return;

        // Wrap index
        if (index >= currentPlaylist.length) playlistIndex = 0;
        else if (index < 0) playlistIndex = currentPlaylist.length - 1;
        else playlistIndex = index;

        const filename = currentPlaylist[playlistIndex];
        const mediaSrc = `${MEDIA_FOLDER}${filename}`;

        console.log("Playing Fallback:", mediaSrc);
        updateCamLabel((playlistIndex + 1).toString().padStart(2, '0'));
        triggerGlitch();
        togglePlayers('local');

        videoPlayer.src = mediaSrc;
        videoPlayer.play().catch(e => console.error("Autoplay failed:", e));
    }

    // Helper: Update Cam Label
    function updateCamLabel(text) {
        if (camIdDisplay) camIdDisplay.textContent = text;
    }

    // Helper: Glitch Effect
    function triggerGlitch() {
        const overlay = document.querySelector('.static-overlay');
        if (overlay) {
            overlay.style.opacity = '0.8';
            setTimeout(() => overlay.style.opacity = '0.05', 300);
        }
    }

    // Helper: Toggle Players
    function togglePlayers(mode) {
        const ytDiv = document.getElementById('youtube-player');
        const imgDiv = document.getElementById('cctv-image');
        const controls = document.querySelector('.controls-overlay');

        if (mode === 'youtube') {
            videoPlayer.style.display = 'none';
            if (imgDiv) imgDiv.style.display = 'none';
            if (ytDiv) ytDiv.style.display = 'block';
            if (controls) controls.style.display = 'none'; // Hide controls for YT
        } else {
            if (ytDiv) ytDiv.style.display = 'none';
            videoPlayer.style.display = 'block';
            if (controls) controls.style.display = 'flex'; // Show controls for local
            // We aren't using images anymore for fallback, purely MP4s
        }
    }

    // Button Handlers require logic check
    function manualChange(delta) {
        // If in Primary mode, buttons could switch to Fallback?
        // Or if in Fallback, cycle fallback?
        if (!isFallbackMode) {
            // Maybe force fallback mode if user clicks next?
            startFallbackMode();
        } else {
            if (cycleTimer) clearTimeout(cycleTimer);
            playLocalVideo(playlistIndex + delta);
        }
    }

    if (btnNext) btnNext.addEventListener('click', () => manualChange(1));
    if (btnPrev) btnPrev.addEventListener('click', () => manualChange(-1));

    // Auto-cycle for Local
    videoPlayer.addEventListener('ended', () => {
        if (isFallbackMode) {
            playLocalVideo(playlistIndex + 1);
        }
    });

    videoPlayer.addEventListener('error', (e) => {
        if (isFallbackMode) {
            console.warn("Media failed, skipping...", e);
            setTimeout(() => playLocalVideo(playlistIndex + 1), 1000);
        }
    });

    // Start System
    initVideoSystem();
});
