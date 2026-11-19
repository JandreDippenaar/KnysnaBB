document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const scrollTop = document.getElementById('scrollTop');
    const mobileCta = document.getElementById('mobileCta');
    const hero = document.getElementById('home');
    const contact = document.getElementById('contact');

    // Mobile navigation
    function setMenu(open) {
        navMenu.classList.toggle('active', open);
        navbar.classList.toggle('menu-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    navToggle.addEventListener('click', function() {
        setMenu(!navMenu.classList.contains('active'));
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('click', function(e) {
        if (!navbar.contains(e.target)) setMenu(false);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') setMenu(false);
    });

    // Navbar background and scroll-to-top button
    function onScroll() {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        scrollTop.classList.toggle('visible', window.scrollY > 600);

        // Show the booking bar once the hero buttons are off screen, but not over the contact section
        const pastHero = hero.getBoundingClientRect().bottom < 0;
        const atContact = contact.getBoundingClientRect().top < window.innerHeight;
        mobileCta.classList.toggle('visible', pastHero && !atContact);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Reveal elements as they scroll into view
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('in-view'));
    }

    // Room photo carousels: native swipe via scroll snapping, plus arrow buttons and position dots
    document.querySelectorAll('.room-carousel').forEach(carousel => {
        const track = carousel.querySelector('.room-track');
        const slides = track.querySelectorAll('img');
        const prev = carousel.querySelector('.room-prev');
        const next = carousel.querySelector('.room-next');
        const dotsWrap = carousel.querySelector('.room-dots');

        if (slides.length < 2) {
            prev.remove();
            next.remove();
            dotsWrap.remove();
            return;
        }

        const dots = Array.from(slides, () => dotsWrap.appendChild(document.createElement('span')));
        const current = () => Math.round(track.scrollLeft / track.clientWidth);
        const goTo = i => track.scrollTo({ left: i * track.clientWidth });

        function update() {
            const i = current();
            dots.forEach((d, n) => d.classList.toggle('active', n === i));
            prev.disabled = i === 0;
            next.disabled = i === slides.length - 1;
        }

        prev.addEventListener('click', () => goTo(current() - 1));
        next.addEventListener('click', () => goTo(current() + 1));
        track.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
        });
        track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
        update();
    });

    // Full screen photo viewer: tap or click a room photo to open it
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Room photos');
    lightbox.innerHTML = `
        <div class="lightbox-header">
            <p class="lightbox-title"><span class="lightbox-name"></span><span class="lightbox-count"></span></p>
            <button type="button" class="lightbox-close" aria-label="Close photos"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="lightbox-track"></div>
        <button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous photo"><i class="fas fa-chevron-left"></i></button>
        <button type="button" class="lightbox-nav lightbox-next" aria-label="Next photo"><i class="fas fa-chevron-right"></i></button>`;
    document.body.appendChild(lightbox);

    const lbTrack = lightbox.querySelector('.lightbox-track');
    const lbName = lightbox.querySelector('.lightbox-name');
    const lbCount = lightbox.querySelector('.lightbox-count');
    const lbPrev = lightbox.querySelector('.lightbox-prev');
    const lbNext = lightbox.querySelector('.lightbox-next');
    const lbClose = lightbox.querySelector('.lightbox-close');
    let lbOpener = null;
    let lbIndex = 0;

    const lbCurrent = () => Math.round(lbTrack.scrollLeft / lbTrack.clientWidth);
    const lbGoTo = (i, smooth = true) => lbTrack.scrollTo({ left: i * lbTrack.clientWidth, behavior: smooth ? 'smooth' : 'auto' });

    function lbUpdate() {
        const total = lbTrack.children.length;
        const i = lbIndex = lbCurrent();
        lbCount.textContent = total > 1 ? `${i + 1} / ${total}` : '';
        lbPrev.disabled = i === 0;
        lbNext.disabled = i >= total - 1;
    }

    function openLightbox(card, index, opener) {
        const slides = card.querySelectorAll('.room-track img');
        lbTrack.replaceChildren(...Array.from(slides, img => {
            const big = document.createElement('img');
            big.src = img.currentSrc || img.src;
            big.alt = img.alt;
            return big;
        }));
        const roomNumber = card.querySelector('.room-number');
        lbName.textContent = card.querySelector('h3').textContent + (roomNumber ? ` · ${roomNumber.textContent}` : '');
        lbOpener = opener;
        lightbox.classList.add('open');
        document.body.classList.add('lightbox-open');
        lbGoTo(index, false);
        lbUpdate();
        lbClose.focus();
    }

    function closeLightbox() {
        if (!lightbox.classList.contains('open')) return;
        lightbox.classList.remove('open');
        document.body.classList.remove('lightbox-open');
        if (lbOpener) lbOpener.focus();
    }

    document.querySelectorAll('.room-card').forEach(card => {
        const track = card.querySelector('.room-track');
        if (!track) return;
        const slides = Array.from(track.querySelectorAll('img'));
        slides.forEach((img, i) => img.addEventListener('click', () => openLightbox(card, i, track)));
        track.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(card, Math.round(track.scrollLeft / track.clientWidth), track);
            }
        });
    });

    lbPrev.addEventListener('click', () => lbGoTo(lbCurrent() - 1));
    lbNext.addEventListener('click', () => lbGoTo(lbCurrent() + 1));
    lbClose.addEventListener('click', closeLightbox);
    lbTrack.addEventListener('scroll', () => requestAnimationFrame(lbUpdate), { passive: true });
    // Clicking the dark background around a photo closes the viewer
    lbTrack.addEventListener('click', e => { if (e.target === lbTrack) closeLightbox(); });
    window.addEventListener('resize', () => { if (lightbox.classList.contains('open')) lbGoTo(lbIndex, false); });

    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lbGoTo(lbCurrent() - 1);
        if (e.key === 'ArrowRight') lbGoTo(lbCurrent() + 1);
        if (e.key === 'Tab') {
            // Keep keyboard focus inside the viewer while it is open
            const focusable = [lbClose, lbPrev, lbNext].filter(b => !b.disabled);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    // Contact form: there is no backend, so compose an email in the visitor's mail app
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const name = (formData.get('name') || '').trim();
            const email = (formData.get('email') || '').trim();
            const message = (formData.get('message') || '').trim();

            if (!name || !email || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            const subject = `Enquiry from ${name}`;
            const body = `${message}\n\n${name}\n${email}`;
            window.location.href = `mailto:knysnabb@telkomsa.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            showNotification('Your email app should open with your message. Just hit send!', 'success');
        });
    }

    document.getElementById('year').textContent = new Date().getFullYear();
});

// Utility functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'status');
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => notification.classList.add('show'));

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}
