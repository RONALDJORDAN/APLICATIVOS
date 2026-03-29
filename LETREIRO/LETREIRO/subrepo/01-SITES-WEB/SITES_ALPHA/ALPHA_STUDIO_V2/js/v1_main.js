
// Canvas BG Logic
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

window.initBG = () => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    particles = [];
    let particleCount = window.innerWidth < 768 ? 25 : 45;
    for (let i = 0; i < particleCount; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: 1.5 + Math.random() * 3, len: 10 + Math.random() * 60, opacity: 0.1 + Math.random() * 0.4 });
    }
};

window.animateBG = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#CCFF00';
    particles.forEach(p => {
        ctx.globalAlpha = p.opacity; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.len); ctx.stroke();
        p.y += p.speed; if (p.y > canvas.height) p.y = -p.len;
    });
    requestAnimationFrame(animateBG);
};
window.addEventListener('resize', initBG);

// Cursor Logic
const cursor = document.getElementById('custom-cursor');
document.addEventListener('mousemove', (e) => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; });

window.updateCursorEvents = () => {
        document.querySelectorAll('a, .gallery-card, button, .social-item, .close-lightbox, .featured-card, #lgpd-check').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%, -50%) scale(3)');
        el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%, -50%) scale(1)');
    });
};

// Navigation Logic
window.switchPage = (pageId) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active-link'));
    
    const targetPage = document.getElementById(pageId);
    if(targetPage) {
        targetPage.classList.add('active');
        const link = document.getElementById('nav-' + (pageId === 'contact-overlay' ? 'contact-overlay' : pageId));
        if(link) link.classList.add('active-link');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Init
window.addEventListener('load', () => {
    initBG();
    animateBG();
    updateCursorEvents();
    
    // Default active page
    if(document.querySelector('.page-content')) {
        document.querySelector('.page-content').classList.add('active');
    }
});
