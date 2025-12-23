document.addEventListener('DOMContentLoaded', () => {
    // Stats Elements
    const dom = {
        location: document.getElementById('location'),
        region: document.getElementById('region'),
        nextStop: document.getElementById('next-stop'),
        arrivalTime: document.getElementById('arrival-time'),
        presents: document.getElementById('presents'),
        distance: document.getElementById('distance'),
        cookies: document.getElementById('cookies'),
        milk: document.getElementById('milk'),
        carrots: document.getElementById('carrots')
    };

    // Configuration - now using local API!
    const SANTA_API = '/api/santa/info';
    const STATS_API = '/api/stats';
    const REFRESH_RATE = 3000; // 3 seconds for smoother updates

    // Detect User Timezone
    try {
        const userTimezoneDisplay = document.getElementById('user-timezone');
        if (userTimezoneDisplay) {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            userTimezoneDisplay.textContent = `Local Time: ${tz}`;
        }
    } catch (e) {
        // ignore
    }

    // Fetch both Santa location and stats
    async function fetchAllData() {
        try {
            const [santaRes, statsRes] = await Promise.all([
                fetch(SANTA_API),
                fetch(STATS_API)
            ]);

            if (!santaRes.ok || !statsRes.ok) throw new Error('API Error');

            const santaData = await santaRes.json();
            const statsData = await statsRes.json();

            updateDashboard(santaData, statsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            showOfflineState();
        }
    }

    function showOfflineState() {
        if (dom.location) {
            dom.location.textContent = 'Radar Scanning...';
            dom.region.textContent = 'Establishing Link';
        }
    }

    function updateDashboard(santaData, statsData) {
        const numFmt = new Intl.NumberFormat();
        const phase = statsData.phase || 'production';
        const isSantaFlying = statsData.isSantaFlying;

        // === LOCATION DATA ===
        if (dom.location) {
            dom.location.textContent = santaData.location || 'North Pole';
            dom.region.textContent = santaData.country || santaData.region || 'Workshop';

            // Add status indicator
            if (santaData.status === 'FLYING') {
                dom.region.innerHTML = `<span style="color: #4ade80;">🛷 ${santaData.country}</span>`;
                if (santaData.speed) {
                    dom.region.innerHTML += `<br><small style="color: #fcd34d;">${santaData.speed}</small>`;
                }
            } else if (santaData.status === 'MISSION COMPLETE') {
                dom.region.innerHTML = `<span style="color: #4ade80;">✅ ${santaData.country}</span>`;
            } else if (santaData.message) {
                dom.region.innerHTML = `<span style="color: #fcd34d;">${santaData.message}</span>`;
            }
        }

        // === NEXT STOP ===
        if (dom.nextStop) {
            if (santaData.next && santaData.next.city) {
                dom.nextStop.textContent = santaData.next.city;
                if (santaData.next.arrival) {
                    const arrivalDate = new Date(santaData.next.arrival);
                    const now = new Date();
                    if (arrivalDate > now) {
                        const mins = Math.round((arrivalDate - now) / 60000);
                        dom.arrivalTime.textContent = `ETA: ${mins} min`;
                    } else {
                        dom.arrivalTime.textContent = "Arriving Now!";
                    }
                } else {
                    dom.arrivalTime.textContent = `via ${santaData.next.region || 'air'}`;
                }
            } else if (phase === 'christmas_day' || phase === 'post_christmas') {
                dom.nextStop.textContent = "Home!";
                dom.arrivalTime.textContent = "Mission Complete";
            } else {
                // Pre-flight: show countdown
                const days = statsData.daysUntilChristmas || 0;
                const hours = statsData.hoursUntilChristmas % 24 || 0;
                if (days > 0) {
                    dom.nextStop.textContent = `${days}d ${hours}h`;
                    dom.arrivalTime.textContent = "Until Liftoff";
                } else if (hours > 0) {
                    dom.nextStop.textContent = `${hours}h`;
                    dom.arrivalTime.textContent = "Until Departure";
                } else {
                    dom.nextStop.textContent = "Soon!";
                    dom.arrivalTime.textContent = "Standby...";
                }
            }
        }

        // === PRESENTS DELIVERED ===
        let presentsCount = 0;
        if (isSantaFlying || phase === 'christmas_day' || phase === 'post_christmas') {
            presentsCount = santaData.presentsDelivered || statsData.presentsDelivered || 0;
        }
        if (dom.presents) animateValue(dom.presents, presentsCount);

        // === DISTANCE FLOWN ===
        if (dom.distance) {
            let distanceKm = 0;
            if (santaData.distance) {
                distanceKm = Math.floor(santaData.distance / 1000);
            } else if (statsData.distanceFlown) {
                distanceKm = statsData.distanceFlown;
            }

            if (distanceKm > 0) {
                dom.distance.textContent = numFmt.format(distanceKm) + " km";
            } else if (phase === 'final_prep') {
                dom.distance.textContent = "Ready";
            } else {
                dom.distance.textContent = "0 km";
            }
        }

        // === COOKIES, MILK, CARROTS ===
        // These stats are meaningful during/after delivery
        let cookiesCount = 0;
        let milkLiters = 0;
        let carrotsCount = 0;

        if (isSantaFlying || phase === 'christmas_day' || phase === 'post_christmas') {
            // Use actual stats from server
            cookiesCount = statsData.cookiesEaten || 0;
            milkLiters = statsData.milkDrunk || 0;
            carrotsCount = statsData.carrotsEaten || 0;
        } else if (phase === 'final_prep') {
            // Show "prepared" amounts waiting to be consumed
            cookiesCount = statsData.cookiesPrepared || 0;
            // Display as "prepared" not "eaten"
            if (document.querySelector('.cookies h3')) {
                document.querySelector('.cookies h3').textContent = 'Cookies Prepared';
            }
        }

        if (dom.cookies) animateValue(dom.cookies, cookiesCount);
        if (dom.milk) animateValue(dom.milk, milkLiters);
        if (dom.carrots) animateValue(dom.carrots, carrotsCount);

        // Update card labels based on phase
        updateCardLabels(phase);
    }

    function updateCardLabels(phase) {
        const isDelivering = phase === 'delivering' || phase === 'christmas_day' || phase === 'post_christmas';

        // Update cookie card label
        const cookieLabel = document.querySelector('.cookies h3');
        if (cookieLabel) {
            cookieLabel.textContent = isDelivering ? 'Cookies Consumed' : 'Cookies Prepared';
        }

        // Update presents card label
        const presentsCard = document.querySelector('.presents-card h3');
        if (presentsCard) {
            presentsCard.textContent = isDelivering ? 'Gifts Delivered' : 'Gifts Ready';
        }

        // Update distance card detail
        const distanceDetail = document.querySelector('.distance-card .stat-detail');
        if (distanceDetail) {
            if (phase === 'delivering') {
                distanceDetail.textContent = 'Supersonic!';
            } else if (phase === 'christmas_day') {
                distanceDetail.textContent = 'Trip Complete';
            } else {
                distanceDetail.textContent = 'Standing By';
            }
        }
    }

    function animateValue(obj, end, duration = 1500) {
        if (!obj) return;
        const startStr = obj.textContent.replace(/,/g, '');
        let start = parseInt(startStr);
        if (isNaN(start)) start = 0;

        if (start === end) return;

        const range = end - start;
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const current = Math.floor(easeProgress * range + start);
            obj.textContent = new Intl.NumberFormat().format(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Add visual flair for Santa flying
    function addFlyingIndicator() {
        const header = document.querySelector('.app-header h1');
        if (header && !header.querySelector('.flying-badge')) {
            const badge = document.createElement('span');
            badge.className = 'flying-badge';
            badge.style.cssText = `
                background: linear-gradient(90deg, #ef4444, #fbbf24);
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.5em;
                margin-left: 15px;
                animation: pulse 1s infinite;
                display: inline-block;
            `;
            badge.textContent = '🎅 LIVE';
            header.appendChild(badge);
        }
    }

    // Initial fetch and interval
    fetchAllData();
    setInterval(fetchAllData, REFRESH_RATE);
});
