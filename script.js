document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const scrollTop = document.getElementById('scrollTop');

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
