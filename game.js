/*<![CDATA[*/
(function() {
    // --- HỆ THỐNG NGÔN NGỮ ---
    const i18n = {
        vi: {
            title: "MÁY BAY SINH TỒN V16",
            enterFs: "VÀO TOÀN MÀN HÌNH",
            rotateHint: "Nên xoay ngang điện thoại để trải nghiệm tốt nhất",
            ready: "BẮT ĐẦU NGAY",
            flyHint: "Chạm và giữ để bay lên!",
            bestLabel: "KỶ LỤC",
            warning: "⚠️ PHÁT HIỆN RADAR!",
            failTitle: "NHIỆM VỤ THẤT BẠI",
            retry: "CHƠI LẠI",
            exit: "THOÁT"
        },
        en: {
            title: "SURVIVAL PLANE V16",
            enterFs: "ENTER FULLSCREEN",
            rotateHint: "Rotate landscape for the best experience",
            ready: "START NOW",
            flyHint: "Tap and hold to fly up!",
            bestLabel: "BEST",
            warning: "⚠️ RADAR DETECTED!",
            failTitle: "MISSION FAILED",
            retry: "RETRY",
            exit: "EXIT"
        }
    };

    let currentLang = 'vi';

    function updateUI(lang) {
    currentLang = lang;
    const t = i18n[lang];
    document.getElementById('main-title').innerText = t.title;
    document.getElementById('enter-fs-btn').innerText = t.enterFs;
    document.getElementById('rotate-hint').innerText = t.rotateHint;
    document.getElementById('ready-btn').innerText = t.ready;
    document.getElementById('fly-hint').innerText = t.flyHint;
    document.getElementById('best-label').innerText = t.bestLabel;
    document.getElementById('warning-text').innerText = t.warning;
    document.getElementById('fail-title').innerText = t.failTitle;
    document.getElementById('retry-btn').innerText = t.retry;
    document.getElementById('exit-btn').innerText = t.exit;

    // Hiệu ứng cho nút lá cờ
    const btnVi = document.getElementById('lang-vi');
    const btnEn = document.getElementById('lang-en');

    if (lang === 'vi') {
        btnVi.style.opacity = '1';
        btnVi.style.borderColor = '#3b82f6';
        btnEn.style.opacity = '0.5';
        btnEn.style.borderColor = 'transparent';
    } else {
        btnEn.style.opacity = '1';
        btnEn.style.borderColor = '#3b82f6';
        btnVi.style.opacity = '0.5';
        btnVi.style.borderColor = 'transparent';
    }
}

    const planeImg = new Image();
    planeImg.src = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiOfPfl4ybPe5pEqDtNc2jS6hW7FG6cDxx7Rud49W1Kb090XI6KcBflI0A5U7ErO0wiZ6xqp8vw68iwfh3_zypHqv6DhrWn4Ku2NzMof3rdfqui_3oP2CvEid-u-hSHyOmloY5evl0Vn4Ly9g6jQlxSTO9VB9swuHL-bLBoFGdFFHymvOttFnuc8tzht48/w400-h168/m%C3%A1y%20bay%20Chinook.png";
    const URL_BG = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiYSguR7m9c37lVC8puRqP1zNvDGn8uIwg4GiR6-Oq6EMjf7YkYMo_ti2xtCXEtU8XKUtaQgIlc1iijc01AoXjJAZqpIY8xFF3YQioSnxiy3_G-01pR091EeXQaeac3dFTYMgZt5ic5NQW1CLPsjZ5OUUEln7vsiY7FK3uFRtlziKQHS5flcWkTt2T2rPs/w640-h427/n%E1%BB%81n%205.jfif"; 
    
    const mountainTex = new Image();
    mountainTex.src = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi79IfVgmrPO0fxhyphenhyphenMB9fsdljeMiRR5AJz6gwRxZoR8udnmN9JpK2t8FeXWqD2KlR_OBsNTdINVQk9AUrJ-7IkbW-02jfbZ0tib4rLKH4U5WBlhSIr0whwKB3Dp_YqNapiLHHdoobkpbtYl7QH4xDtyuSObt_uoYM8HLNlUAitzuPtojfTEMrpNOl3cUZI/w640-h640/Texture%20c%C3%A2y%2031%20JG.jpg";

    const sndEngine = new Audio("https://files.catbox.moe/rbfgv4.mp3");
    sndEngine.loop = true;
    sndEngine.volume = 0.4;
    const sndExplode = new Audio("https://files.catbox.moe/jwfmi6.mp3");
    sndExplode.volume = 0.4;
    const sndWarning = new Audio("https://files.catbox.moe/a7kk52.mp3");
    sndWarning.loop = true;

    function primeAudioIOS() {
        [sndEngine, sndExplode, sndWarning].forEach(s => {
            s.muted = true;
            s.play().then(() => { s.pause(); s.muted = false; s.currentTime = 0; }).catch(() => {});
        });
    }

    const container = document.getElementById('hoang-manh-land-game');
    const canvas = document.getElementById('skyGame');
    const ctx = canvas.getContext('2d');
    const entryScreen = document.getElementById('entry-screen');
    const startScreen = document.getElementById('start-screen');
    const overScreen = document.getElementById('over-screen');
    const scoreVal = document.getElementById('score-val');
    const bestVal = document.getElementById('best-val');

    let animationId = null, gameActive = false, isRunning = false;
    let score = 0, bestScore = localStorage.getItem('planeBest') || 0;
    let bgImg = new Image(); bgImg.src = URL_BG;
    let bgX = 0, terrains = [], heightMap = [], currentRadarY = -1000;
    let plane = { x: 100, y: 200, v: 0, w: 90, h: 40 }; 
    let isPressing = false, rotorAngle = 0, targetRadarY = -1000;
    let radarHits = 0;

    const cfg = { g: 0.25, lift: -0.55, speed: 8.5, penalty: 0.0, unitScale: 450, gap: 200 }; 

    function forceResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (canvas.width > 800) {
            cfg.gap = 150; plane.w = 95; plane.h = 42;
        } else {
            cfg.gap = 140; plane.w = 80; plane.h = 35;
        }
        plane.x = canvas.width / 5;
        heightMap = new Array(Math.floor(canvas.width) + 150).fill(canvas.height);
        currentRadarY = -1000;
    }

    window.addEventListener('resize', () => { setTimeout(forceResize, 150); });
    window.addEventListener('orientationchange', () => { setTimeout(forceResize, 300); });

    function drawRotor(x, y, angle) {
        ctx.save();
        let rotorW = Math.abs(Math.cos(angle)) * (plane.w * 0.85); 
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; 
        ctx.fillRect(x - rotorW/2, y - 2, rotorW, 4); 
        ctx.restore();
    }

    function f(x, m) { return x + 2 * Math.sin(6 * x + 2) - m * Math.pow(x, 4) + 4; }
    function df(x, m) { return 1 + 12 * Math.cos(6 * x + 2) - 4 * m * Math.pow(x, 3); }
    function solveMountainRoot(m, guess) {
        let x = guess;
        for (let i = 0; i < 15; i++) {
            let fx = f(x, m); let dfx = df(x, m);
            if (Math.abs(dfx) < 0.001) break;
            x = x - fx / dfx;
        }
        return x;
    }

    function createTerrain(startX, isFirst = false) {
        let pts = []; const groundBase = canvas.height - (canvas.height * 0.15); 
        if (isFirst) {
            pts.push({x: startX, y: groundBase}, {x: startX + 2500, y: groundBase});
            return { type: 'sea', points: pts, width: 2500, startX: startX };
        }
        const maxH = canvas.height * 0.55;
        const repeatCount = 4;
        let currentXPos = startX;
        for (let r = 0; r < repeatCount; r++) {
            const m = Math.random() * 4 + 0.3; 
            const xL = solveMountainRoot(m, -1.5); const xR = solveMountainRoot(m, 2.0);
            const frameW = (xR - xL) * cfg.unitScale;
            const sH = (18 + Math.random() * 12) * (canvas.height / 550); 
            for (let i = 0; i <= 30; i++) {
                let t = i / 30;
                let yOff = Math.abs(f(xL + t * (xR - xL), m)) * sH;
                if (yOff > maxH) yOff = maxH;
                pts.push({ x: currentXPos + t * frameW, y: groundBase - yOff });
            }
            currentXPos += frameW;
        }
        return { type: 'math-mountain', points: pts, width: currentXPos - startX, startX: startX };
    }

    function loop() {
        if (!gameActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bgX = (bgX - (isRunning ? 2.5 : 0.5)) % canvas.width;
        ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);

        if (isRunning) {
            plane.v += isPressing ? cfg.lift : cfg.g;
            plane.v *= 0.98; plane.y += plane.v;
            if (plane.y < 5) { plane.y = 5; plane.v = 0; }
            score += 0.08; 
            rotorAngle += 0.45; 
            sndEngine.volume = isPressing ? 0.6 : 0.35;
        } else {
            rotorAngle += 0.3; 
        }

        heightMap.fill(canvas.height);
        let screenMinY = canvas.height; 
        for (let t of terrains) {
            if (isRunning) t.startX -= cfg.speed;
            ctx.save();
            ctx.beginPath();
            if (t.type === 'math-mountain') {
                if (mountainTex.complete) {
                    let pattern = ctx.createPattern(mountainTex, 'repeat');
                    let matrix = new DOMMatrix().translate(t.startX, 0);
                    pattern.setTransform(matrix);
                    ctx.fillStyle = pattern;
                    ctx.strokeStyle = "#064e3b";
                } else { ctx.fillStyle = '#064e3b'; }
            } else { ctx.fillStyle = '#0c4a6e'; }
            ctx.moveTo(t.startX, canvas.height);
            for(let p of t.points) {
                if (isRunning) p.x -= cfg.speed;
                ctx.lineTo(p.x, p.y);
                if (p.x >= -50 && p.x <= canvas.width + 50) {
                    let xIdx = Math.floor(p.x);
                    if (xIdx >= 0 && xIdx < heightMap.length) heightMap[xIdx] = p.y;
                    if (p.y < screenMinY) screenMinY = p.y;
                }
            }
            ctx.lineTo(t.startX + t.width, canvas.height);
            ctx.fill();
            if(t.type === 'math-mountain') { ctx.lineWidth = 2; ctx.stroke(); }
            ctx.restore();
        }

        if (score > 25) {
            targetRadarY = screenMinY - cfg.gap;
            if (targetRadarY < 35) targetRadarY = 35;
            currentRadarY += (targetRadarY - currentRadarY) * 0.05;
        }

        if (currentRadarY > -250) {
            ctx.save();
            let grd = ctx.createLinearGradient(0, currentRadarY, 0, currentRadarY - 100);
            grd.addColorStop(0, "rgba(34, 211, 238, 0.3)"); grd.addColorStop(1, "rgba(34, 211, 238, 0)"); 
            ctx.fillStyle = grd; ctx.fillRect(0, 0, canvas.width, currentRadarY);
            ctx.strokeStyle = "rgba(34, 211, 238, 0.6)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, Math.floor(currentRadarY)); ctx.lineTo(canvas.width, Math.floor(currentRadarY)); ctx.stroke();
            ctx.restore();
        }

        if (isRunning) {
            let startX = Math.floor(plane.x), endX = Math.floor(plane.x + plane.w);
            for (let x = startX; x <= endX; x++) {
                if ((heightMap[x] || canvas.height) < plane.y + plane.h - 5) { endGame(); return; }
            }
            if (plane.y > canvas.height + 40) endGame();

            if (currentRadarY > 0 && plane.y < currentRadarY) {
                document.getElementById('warning-text').style.display = 'block';
                if (sndWarning.paused) sndWarning.play().catch(() => {});
                score -= cfg.penalty; 
                radarHits += 1; 
                if (radarHits > 180) { endGame(); return; }
            } else { 
                document.getElementById('warning-text').style.display = 'none'; 
                if (!sndWarning.paused) { sndWarning.pause(); sndWarning.currentTime = 0; }
            }
        }

        if (planeImg.complete) {
            drawRotor(plane.x + (plane.w * 0.25), plane.y + 2, rotorAngle);
            drawRotor(plane.x + (plane.w * 0.75), plane.y + 6, rotorAngle + 0.6);
            ctx.drawImage(planeImg, plane.x, plane.y, plane.w, plane.h);
        }

        if (terrains[0].startX + terrains[0].width < 0) {
            let last = terrains[terrains.length - 1];
            terrains.shift(); terrains.push(createTerrain(last.startX + last.width));
        }

        if(scoreVal) scoreVal.innerText = Math.floor(score) + "m";
        if(bestVal) bestVal.innerText = Math.floor(bestScore) + "m";

		if (isRunning && score > bestScore && bestScore > 0) {
    	const ingameMsg = document.getElementById('ingame-best-msg');
    	if (ingameMsg && ingameMsg.style.display === 'none') {
        ingameMsg.style.display = 'block';
        ingameMsg.innerText = currentLang === 'vi' ? "🎉 KỶ LỤC MỚI! 🎉" : "🎉 NEW RECORD! 🎉";
        
        // Tùy chọn: Đổi màu số điểm sang xanh lá khi đã vượt kỷ lục
        if(scoreVal) scoreVal.style.color = "#22c55e"; 
    		}
		}

        animationId = requestAnimationFrame(loop);
    }

    function initGame() { 
        forceResize(); score = 0; radarHits = 0;
        plane.y = canvas.height/2; plane.v = 0; 
        currentRadarY = -1000; terrains = [createTerrain(0, true), createTerrain(2500)]; 
        gameActive = true; isRunning = false; 
        startScreen.style.display = 'flex'; overScreen.style.display = 'none'; 
        if(animationId) cancelAnimationFrame(animationId); loop(); 

		document.getElementById('ingame-best-msg').style.display = 'none';
		if(scoreVal) scoreVal.style.color = "#facc15"; // Trả về màu vàng mặc định
    }

    function endGame() { 
        if (!isRunning) return;
        isRunning = false; 
        sndEngine.pause(); 
        sndWarning.pause();
        sndExplode.currentTime = 0;
        sndExplode.play().catch(() => {});

        if (score > bestScore) { bestScore = score; localStorage.setItem('planeBest', Math.floor(bestScore)); } 
        document.getElementById('final-score').innerText = Math.floor(score) + "m"; 
        overScreen.style.display = 'flex'; 
    }

    // Sự kiện chuyển đổi ngôn ngữ
    document.getElementById('lang-vi').onclick = () => updateUI('vi');
    document.getElementById('lang-en').onclick = () => updateUI('en');

    document.getElementById('enter-fs-btn').onclick = (e) => {
        primeAudioIOS();
        if (container.requestFullscreen) container.requestFullscreen();
        else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
        window.scrollTo(0, 1);
        entryScreen.style.display = 'none';
        setTimeout(initGame, 400);
    };

    document.getElementById('ready-btn').onclick = () => {
        sndEngine.play().catch(() => {});
        isRunning = true; startScreen.style.display = 'none'; 
    };

    document.getElementById('retry-btn').onclick = () => {
        primeAudioIOS();
        initGame();
    };
    
    document.getElementById('exit-btn').onclick = () => location.reload();

    const flyStart = (e) => { if(isRunning) isPressing = true; };
    const flyEnd = () => { isPressing = false; };
    container.onmousedown = flyStart;
    container.ontouchstart = (e) => { if(isRunning) { flyStart(); e.preventDefault(); } };
    window.onmouseup = window.ontouchend = flyEnd;

    // Khởi tạo ngôn ngữ mặc định
    updateUI('vi');
})();
/*]]>*/ 
