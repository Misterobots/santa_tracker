document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim().toLowerCase();
    const parentCode = document.getElementById('password').value.trim().toLowerCase();

    const messageArea = document.getElementById('login-message');
    const overlay = document.getElementById('warp-overlay');
    const panel = document.querySelector('.login-panel');

    messageArea.textContent = "VERIFYING PARENTAL MAGIC...";
    messageArea.style.color = "var(--gold-glow)";

    // --- NAUGHTY OR NICE LOGIC (Parent Code determines ROLE) ---
    // Default to 'hero' (Nice)
    let determinedRoleType = 'hero';

    const naughtyCodes = ['naughty', 'bad', 'coal', 'grinch', 'villain', 'sad', 'angry'];
    const niceCodes = ['nice', 'good', 'santa', 'love', 'magic', 'elf', 'present', 'gift', 'christmas'];

    if (naughtyCodes.some(code => parentCode.includes(code))) {
        determinedRoleType = 'villain';
    }
    // Note: We default to 'hero' if nothing specific is entered, or if a 'nice' code is entered.

    // --- IDENTITY LOGIC (Username determines THEME) ---
    // Check if the user is a specific known character
    let specificTheme = null;
    let welcomeMsg = "";
    let msgColor = "#00d26a"; // Default Green

    // 1. Look for Character Match
    const easterEggs = [
        { keywords: ['santa', 'claus'], role: 'santa', msg: "WELCOME, BIG BOSS!" },
        { keywords: ['mrs. claus', 'jessica'], role: 'mrsclaus', msg: "COCOA DISPENSERS ACTIVATED." },
        { keywords: ['buddy'], role: 'buddy', msg: "SANTA! I KNOW HIM!" },
        { keywords: ['rudolph', 'reindeer'], role: 'rudolph', msg: "NOSE LIGHT: 100% BRIGHTNESS." },
        { keywords: ['grinch'], role: 'grinch', msg: "YOU'RE A MEAN ONE..." },
        { keywords: ['clark', 'griswold'], role: 'clark', msg: "DRUMROLL PLEASE..." },
        { keywords: ['cindy'], role: 'cindy', msg: "CHRISTMAS IS HERE." },
        { keywords: ['jack', 'skellington'], role: 'jack', msg: "WHAT'S THIS?" },
        { keywords: ['kevin', 'mccallister'], role: 'kevin', msg: "KEVIN!" },
        { keywords: ['ralphie'], role: 'ralphie', msg: "YOU'LL SHOOT YOUR EYE OUT!" },
        { keywords: ['frosty'], role: 'frosty', msg: "HAPPY BIRTHDAY!" },
        { keywords: ['turbo'], role: 'turbo', msg: "IT'S TURBO TIME!" },
        { keywords: ['hans', 'gruber'], role: 'hans', msg: "WELCOME TO THE PARTY, PAL." },
        { keywords: ['scrooge', 'ebenezer'], role: 'scrooge', msg: "BAH, HUMBUG!" },
        { keywords: ['krampus'], role: 'krampus', msg: "GREETINGS, UNGRATEFUL CHILD." },
        { keywords: ['wet', 'bandits'], role: 'wetbandits', msg: "CROWBARS UP." }
    ];

    const matchedCharacter = easterEggs.find(egg => egg.keywords.some(k => username.includes(k)));

    if (matchedCharacter) {
        specificTheme = matchedCharacter.role;
        welcomeMsg = matchedCharacter.msg;
    } else {
        // Generic Child
        specificTheme = determinedRoleType === 'villain' ? 'staff' : 'staff';
        welcomeMsg = determinedRoleType === 'villain'
            ? "ACCESS GRANTED. WATCH YOUR STEP."
            : `WELCOME, ${username.toUpperCase()}! YOU MADE THE LIST!`;
    }

    // Role Override for specific characters? 
    // Grinch is ALWAYS villain? No, user said "depending on whether parent enters good or bad".
    // So if parent enters "good" for Grinch, he gets Hero access? 
    // "Make it Name, and Parent Code... depending on code menu theme will be naughty or nice".
    // So Code overrides Character alignment for the *permissions* (CCTV), 
    // but the Theme (Visuals) should probably still look like the character if possible.
    // Let's stick to the Code driving the 'type' (hero/villain capabilities).

    setTimeout(() => {
        panel.style.transform = "none";

        // Display Message
        messageArea.textContent = welcomeMsg;
        if (determinedRoleType === 'villain') {
            messageArea.style.color = "#ef4444"; // Red
        } else {
            messageArea.style.color = "#00d26a"; // Green
        }

        // Store Session
        localStorage.setItem('hqRole', determinedRoleType); // 'hero' or 'villain'
        localStorage.setItem('hqTheme', specificTheme || 'staff');
        localStorage.setItem('hqUser', username);

        // Delay for reading
        setTimeout(() => {
            triggerAnimationAndRedirect(specificTheme, determinedRoleType);
        }, 2500);

    }, 1000);

    function triggerAnimationAndRedirect(role, type) {
        // Remove existing classes
        overlay.className = 'warp-overlay';

        if (role === 'clark') {
            overlay.classList.add('clark-active'); // Blinding Flash
            playThemeAudio('spark.mp3');
        } else if (role === 'cindy') {
            overlay.classList.add('cindy-active'); // Pink Bubbles
        } else if (role === 'jack') {
            overlay.classList.add('jack-active'); // Spooky
        } else if (role === 'kevin') {
            overlay.classList.add('kevin-active'); // Blueprint/Flash
        } else if (role === 'grinch') {
            overlay.classList.add('villain-active');
            playThemeAudio('grinch.mp3');
        } else if (type === 'hero' || role === 'santa') {
            // Generic Hero Celebration
            createConfetti();
            overlay.classList.add('hero-active');
            playThemeAudio('hohoho.mp3');
        } else if (type === 'villain') {
            // Villain Warning
            overlay.classList.add('villain-active');
            playThemeAudio('denied.mp3');
        } else {
            // Staff/Normal
            overlay.classList.add('warp-active');
        }

        overlay.style.opacity = '1';

        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 3000); // Give time for audio/animation
    }

    function playThemeAudio(filename) {
        const audio = new Audio('media/' + filename);
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play failed (user interaction needed or file missing):", e));
    }

    function createConfetti() {
        for (let i = 0; i < 50; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + 'vw';
            c.style.animationDuration = (Math.random() * 2 + 1) + 's';
            c.style.backgroundColor = ['#f00', '#0f0', '#gold', '#fff'][Math.floor(Math.random() * 4)];
            document.body.appendChild(c);
        }
    }
});
