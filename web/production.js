document.addEventListener('DOMContentLoaded', () => {
    initProductionTracker();
});

const toys = [
    { name: "Vintage Train Set", img: "assets/toy_train.png" },
    { name: "Cuddly Teddy Bear", img: "assets/toy_bear.png" },
    { name: "Retro Robot", img: "assets/toy_robot.png" },
    { name: "Mystery Gift", img: "assets/toy_gift.png" },
    { name: "Elf Action Figure", img: "assets/elf_worker.png" },
    { name: "Speedster Race Car", img: "assets/toy_car.png" },
    { name: "Stitch Ragdoll", img: "assets/toy_doll.png" },
    { name: "Handheld Console", img: "assets/toy_console.png" },
    { name: "Champion Soccer Ball", img: "assets/toy_ball.png" },
    { name: "Galactic Rocket Ship", img: "assets/toy_rocket.png" },
    { name: "Rainbow Unicorn", img: "assets/toy_unicorn.png" },
    { name: "Acoustic Guitar", img: "assets/toy_guitar.png" },
    { name: "Street Skateboard", img: "assets/toy_skateboard.png" }
];

const kids = [
    "Timmy from Ohio", "Sarah from London", "Juan from Madrid", "Aiko from Tokyo",
    "Lukas from Berlin", "Chloe from Paris", "Noa from Tel Aviv", "Arjun from Mumbai",
    "Liam from Dublin", "Sofia from Rome", "Wei from Beijing", "Zoe from Cape Town",
    "Mateo from Santiago", "Yara from Cairo", "Sven from Oslo", "Priya from Toronto",
    "Elena from Moscow", "Kwame from Accra", "Hannah from Sydney", "Diego from Buenos Aires"
];

const steps = [
    "Scanning Wishlist Content...",
    "Calibrating Cuteness...",
    "Applying Non-Toxic Glitter...",
    "Tightening Screws...",
    "Stuffing with Fluff...",
    "Wrapping in Magic...",
    "Elf Quality Check...",
    "Adding Christmas Spirit..."
];

function initProductionTracker() {
    const container = document.getElementById('tracker-content');
    if (!container) return;

    startProductionCycle(container);
}

function startProductionCycle(container) {
    // 0. Reset UI
    container.innerHTML = `
        <div class="tracker-idle">
            <div class="radar-scan"></div>
            <div class="idle-text">WAITING FOR NEXT ORDER...</div>
        </div>
    `;

    setTimeout(() => {
        // 1. Pick Data
        const toy = toys[Math.floor(Math.random() * toys.length)];
        const kid = kids[Math.floor(Math.random() * kids.length)];

        // 2. Initializing State
        container.innerHTML = `
            <div class="tracker-init">
                <div class="order-alert">🔔 NEW ORDER RECEIVED</div>
                <div class="order-details">
                    <div class="kid-name">${kid}</div>
                    <div class="toy-target">Target: ${toy.name}</div>
                </div>
            </div>
        `;

        // 3. Start Production (after 1.5s delay)
        setTimeout(() => {
            runProduction(container, toy);
        }, 1500);

    }, 2000);
}

function runProduction(container, toy) {
    // Render Frame
    container.innerHTML = `
        <div class="tracker-production">
            <div class="toy-preview">
                <img src="${toy.img}" class="toy-silhouette" id="active-toy">
            </div>
            
            <div class="production-status">
                <div class="status-text" id="status-text">Initializing...</div>
                <div class="progress-container">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
            </div>
        </div>
    `;

    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    const activeToy = document.getElementById('active-toy');

    let progress = 0;
    const duration = 4000; // 4s to build
    const interval = 50;
    const stepIncrement = 100 / (duration / interval);

    // Status text cycler
    let msgInterval = setInterval(() => {
        statusText.textContent = steps[Math.floor(Math.random() * steps.length)];
    }, 800);

    let buildInterval = setInterval(() => {
        progress += stepIncrement;
        if (progress > 100) progress = 100;

        progressBar.style.width = `${progress}%`;

        // Pulse the silhouette faster as we get closer
        if (progress > 80) {
            // Keep it mostly blurry but pulse size
            activeToy.style.filter = `brightness(0) blur(10px)`;
            activeToy.style.transform = `scale(${1 + Math.random() * 0.1})`;
        }

        if (progress >= 100) {
            clearInterval(buildInterval);
            clearInterval(msgInterval);
            triggerSuccess(container, toy);
        }
    }, interval);
}

function triggerSuccess(container, toy) {
    const activeToy = document.getElementById('active-toy');
    const statusText = document.getElementById('status-text');

    // REVEAL!
    activeToy.classList.remove('toy-silhouette');
    activeToy.classList.add('toy-reveal');
    // Explicitly remove all filters
    activeToy.style.filter = "none";
    activeToy.style.transform = "scale(1.5)";

    statusText.textContent = "BUILD COMPLETE!";
    statusText.style.color = "#00d26a";
    statusText.style.fontWeight = "bold";

    // Add Confetti
    for (let i = 0; i < 30; i++) {
        createConfetti(container);
    }

    // Play sound effect hook? (Optional)

    // Wait and Restart
    setTimeout(() => {
        startProductionCycle(container);
    }, 4000);
}

function createConfetti(container) {
    const bit = document.createElement('div');
    bit.className = 'confetti';
    bit.style.left = Math.random() * 100 + '%';
    bit.style.background = ['#ff3344', '#00d26a', '#fbbf24', '#fff'][Math.floor(Math.random() * 4)];
    bit.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
    container.appendChild(bit);

    // Auto cleanup
    setTimeout(() => bit.remove(), 2000);
}
