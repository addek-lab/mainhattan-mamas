// Icons für dynamische Meldungen (werden beim Build aus icons/ eingesetzt)
const ICONS = {};

// Sticky Header
const header = document.querySelector('.header');
if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Global Hamburger Menu Logic
const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('nav-overlay');
if (hamburger && navOverlay) {
    hamburger.addEventListener('click', () => {
        const isOpen = !navOverlay.classList.contains('open');
        navOverlay.classList.toggle('open', isOpen);
        document.body.classList.toggle('nav-open', isOpen);
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close overlay when clicking a normal link (not accordion toggles)
    navOverlay.querySelectorAll('a:not(.accordion-toggle)').forEach(link => {
        link.addEventListener('click', () => {
            navOverlay.classList.remove('open');
            document.body.classList.remove('nav-open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
}

// Mobile Accordion Logic
const accordions = document.querySelectorAll('.accordion-toggle');
accordions.forEach(acc => {
    acc.addEventListener('click', (e) => {
        e.preventDefault();
        const content = acc.nextElementSibling;
        const isOpen = content.classList.contains('open');
        
        // Close all others
        document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
        document.querySelectorAll('.accordion-toggle').forEach(t => t.classList.remove('active'));
        
        if (!isOpen) {
            content.classList.add('open');
            acc.classList.add('active');
        }
    });
});

// Mitmachen Rollen Accordion – Single-Open (Exclusive) Pattern
document.querySelectorAll('.mm-acc__header').forEach(btn => {
    btn.addEventListener('click', () => {
        const body = btn.nextElementSibling;
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        // Close all other accordions first
        document.querySelectorAll('.mm-acc__header').forEach(otherBtn => {
            if (otherBtn !== btn) {
                otherBtn.setAttribute('aria-expanded', 'false');
                otherBtn.nextElementSibling.hidden = true;
            }
        });

        // Toggle the clicked one
        if (isExpanded) {
            btn.setAttribute('aria-expanded', 'false');
            body.hidden = true;
        } else {
            btn.setAttribute('aria-expanded', 'true');
            body.hidden = false;
        }
    });
});

// Desktop Dropdown Keyboard Accessibility
const dropdownToggles = document.querySelectorAll('.nav-dropdown > a');
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const parent = toggle.parentElement;
            parent.classList.toggle('open');
        }
    });
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
    }
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
    }
});

// Contact Form Submission (works on any page that has the form)
const form = document.getElementById('contactForm');
if (form) {
    const formSuccess = document.getElementById('formSuccess');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn.innerHTML;
    let hideTimer;

    const showMessage = (ok, text) => {
        formSuccess.innerHTML = (ok ? ICONS['check-circle-2'] : ICONS['alert-circle']) || '';
        formSuccess.append(' ' + text);
        formSuccess.style.color = ok ? '#2E7D32' : '#c62828';
        formSuccess.style.backgroundColor = ok ? '#E8F5E9' : '#ffebee';
        formSuccess.classList.remove('hidden');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => formSuccess.classList.add('hidden'), 8000);
    };

    const resetButton = () => {
        submitBtn.innerHTML = submitLabel;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
        submitBtn.style.cursor = '';
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = (ICONS.loader ? ICONS.loader.replace('class="', 'class="spin ') : '') + ' Wird gesendet...';
        submitBtn.style.opacity = '0.8';
        submitBtn.style.cursor = 'not-allowed';

        // Collect all form data dynamically
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Collect checked checkboxes specifically for array-like values (e.g. interests)
        const checkboxes = form.querySelectorAll('input[type="checkbox"][name="interests[]"]:checked');
        if (checkboxes.length > 0) {
            data.interests = Array.from(checkboxes).map(cb => cb.value);
        }

        fetch('contact.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json().catch(() => ({ status: 'error' })))
        .then(responseData => {
            resetButton();
            if (responseData.status === 'success') {
                form.reset();
                showMessage(true, 'Vielen Dank! Wir melden uns bei dir.');
            } else {
                showMessage(false, responseData.message || 'Beim Senden ist etwas schiefgelaufen. Bitte versuche es später noch einmal oder schreib uns an hallo@mainhattan-mamas.de.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            resetButton();
            showMessage(false, 'Die Nachricht konnte nicht gesendet werden. Bitte prüfe deine Internetverbindung oder schreib uns an hallo@mainhattan-mamas.de.');
        });
    });

    // Handle URL parameters for pre-selecting checkboxes
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const thema = urlParams.get('thema');
    
    if (thema === 'mitglied' || type === 'mitglied') {
        const checkbox = document.getElementById('chk-mitglied');
        if (checkbox) {
            checkbox.checked = true;
            setTimeout(() => {
                const sectionTitle = checkbox.closest('.checkbox-group').previousElementSibling;
                if (sectionTitle) sectionTitle.scrollIntoView({behavior: 'smooth', block: 'center'});
            }, 100);
        }
    }
    
    // Projekt vorauswählen, z. B. kontakt.html?projekt=kuchen
    const projektCheckboxen = {
        kuchen: 'Projekt Kuchen für alle',
        lichterfest: 'Projekt Lichterfest der Generationen'
    };
    const projekt = urlParams.get('projekt');
    if (projekt && projektCheckboxen[projekt]) {
        const checkbox = form.querySelector(`input[type="checkbox"][value="${projektCheckboxen[projekt]}"]`);
        if (checkbox) {
            checkbox.checked = true;
            setTimeout(() => checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    }

    if (type) {
        let valueToCheck = '';
        if (type === 'spenden' || type === 'foerdern' || type === 'kooperation') {
            valueToCheck = 'Interesse an Spenden, Sponsoring oder Förderpartnerschaft';
        }
        
        if (valueToCheck) {
            const checkbox = form.querySelector(`input[type="checkbox"][value="${valueToCheck}"]`);
            if (checkbox) {
                checkbox.checked = true;
                // scroll to the form section
                setTimeout(() => {
                    const sectionTitle = checkbox.closest('.checkbox-group').previousElementSibling;
                    if (sectionTitle) sectionTitle.scrollIntoView({behavior: 'smooth', block: 'center'});
                }, 100);
            }
        }
    }
}

// Eingebettete Fremdinhalte (z. B. easyVerein-Mitgliedsantrag) erst nach Klick laden
document.querySelectorAll('.embed-consent').forEach(box => {
    const button = box.querySelector('.embed-consent__button');
    if (!button) return;
    button.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = box.dataset.embedSrc;
        iframe.title = box.dataset.embedTitle || '';
        iframe.className = 'embed-frame';
        box.replaceWith(iframe);
        iframe.focus();
    });
});

// Flyer teilen: Handy -> Teilen-Menü mit PDF (z. B. WhatsApp), sonst Link teilen, sonst WhatsApp Web
document.querySelectorAll('[data-share-file]').forEach(button => {
    button.addEventListener('click', async () => {
        const fileUrl = new URL(button.dataset.shareFile, location.href).href;
        const title = button.dataset.shareTitle || document.title;
        const text = button.dataset.shareText || '';
        try {
            if (navigator.canShare) {
                const blob = await (await fetch(fileUrl)).blob();
                const file = new File([blob], fileUrl.split('/').pop(), { type: 'application/pdf' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title, text });
                    return;
                }
            }
            if (navigator.share) {
                await navigator.share({ title, text, url: fileUrl });
                return;
            }
        } catch (err) {
            if (err.name === 'AbortError') return; // Teilen abgebrochen
        }
        window.open('https://wa.me/?text=' + encodeURIComponent(text + '\nFlyer: ' + fileUrl), '_blank', 'noopener');
    });
});

// Link zum Formular auf derselben Seite: passendes Interesse gleich ankreuzen (data-interesse="<value>")
document.querySelectorAll('a[data-interesse]').forEach(link => {
    link.addEventListener('click', () => {
        const checkbox = document.querySelector(`#contactForm input[type="checkbox"][value="${link.dataset.interesse}"]`);
        if (checkbox) checkbox.checked = true;
    });
});
