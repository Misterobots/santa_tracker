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

    // Configuration
    const API_ENDPOINT = '/api/santa/info?client=web&language=en&fingerprint=&routeOffset=0&streamOffset=0';
    const REFRESH_RATE = 10000;

    // Detect User Timezone
    try {
        const userTimezoneDisplay = document.getElementById('user-timezone');
        if (userTimezoneDisplay) {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            userTimezoneDisplay.textContent = `Local Base Time: ${tz}`;
        }
    } catch (e) {
        // ignore
    }

    // Data Fetching Logic
    async function fetchSantaData() {
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            updateDashboard(data);
        } catch (error) {
            console.error('Error fetching Santa data:', error);
            if (dom.location && (dom.location.textContent.includes('Acquiring') || dom.location.textContent.includes('Loading'))) {
                dom.location.textContent = 'Radar Scanning...';
                dom.region.textContent = 'Establishing Link';
            }
        }
    }

    function updateDashboard(data) {
        const numFmt = new Intl.NumberFormat();

        if (dom.location) {
            if (data.location) {
                dom.location.textContent = data.location;
                dom.region.textContent = data.country || data.region || 'Unknown Region';
            } else {
                dom.location.textContent = 'North Pole';
                dom.region.textContent = 'Operations Center';
            }
        }

        if (dom.nextStop) {
            if (data.next) {
                dom.nextStop.textContent = data.next.city || data.next.region || 'Unknown';
                if (data.next.arrival) {
                    const arrivalDate = new Date(data.next.arrival);
                    const now = new Date();
                    if (arrivalDate < now) {
                        dom.arrivalTime.textContent = "Landed";
                    } else {
                        dom.arrivalTime.textContent = "ETA: " + arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                }
            } else {
                dom.nextStop.textContent = "--";
                dom.arrivalTime.textContent = "ETA: --:--";
            }
        }

        // Stats
        let presentsCount = 0;
        if (data.presentsDelivered) {
            presentsCount = parseInt(data.presentsDelivered);
        }

        if (dom.presents) animateValue(dom.presents, presentsCount);

        const cookiesCount = Math.floor(presentsCount / 1600);
        if (dom.cookies) animateValue(dom.cookies, cookiesCount);

        const milkLiters = Math.floor(cookiesCount * 0.2);
        if (dom.milk) animateValue(dom.milk, milkLiters);

        const carrotsCount = Math.floor(presentsCount / 1200);
        if (dom.carrots) animateValue(dom.carrots, carrotsCount);

        if (dom.distance && data.distance) {
            dom.distance.textContent = numFmt.format(Math.floor(data.distance / 1000)) + " km";
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

    fetchSantaData();
    setInterval(fetchSantaData, REFRESH_RATE);
});
