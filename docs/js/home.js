// Home Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Quick Booking Form Handler
    const quickBookingForm = document.getElementById('quickBookingForm');
    
    if (quickBookingForm) {
        // Set minimum date to tomorrow
        const dateInput = document.getElementById('quickDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().split('T')[0];
        }
        
        quickBookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const location = document.getElementById('quickLocation').value;
            const date = document.getElementById('quickDate').value;
            const adults = document.getElementById('quickAdults').value;
            const children = document.getElementById('quickChildren').value;
            
            // Validate
            if (!location || !date || !adults) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Store in sessionStorage for booking page
            // Map 'location' to 'serviceState' to match booking.js expectations
            const bookingData = {
                serviceState: location,
                eventDate: date,
                numAdults: parseInt(adults),
                numChildren: parseInt(children) || 0
            };
            
            sessionStorage.setItem('quickBookingData', JSON.stringify(bookingData));
            
            // Redirect to booking page
            window.location.href = 'pages/booking.html';
        });
        
        // Real-time party size validation
        const adultsInput = document.getElementById('quickAdults');
        const childrenInput = document.getElementById('quickChildren');
        
        function validatePartySize() {
            const adults = parseInt(adultsInput.value) || 0;
            const children = parseInt(childrenInput.value) || 0;
            
            // Basic validation: at least 1 adult
            // Minimum spend validation happens in booking funnel Step 2
            if (adults < 1) {
                adultsInput.setCustomValidity('At least 1 adult required');
            } else {
                adultsInput.setCustomValidity('');
            }
        }
        
        if (adultsInput) {
            adultsInput.addEventListener('input', validatePartySize);
        }
        
        if (childrenInput) {
            childrenInput.addEventListener('input', validatePartySize);
        }
    }
    
    // Animate "How It Works" steps on scroll
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    const steps = document.querySelectorAll('.how-it-works__step');
    steps.forEach((step, index) => {
        // Initial state
        step.style.opacity = '0';
        step.style.transform = 'translateY(30px)';
        step.style.transition = `all 0.6s ease ${index * 0.2}s`;
        
        observer.observe(step);
    });

    // Initialize Video Showcase
    initVideoShowcase();
});

function initVideoShowcase() {
    const container = document.getElementById('videoShowcase');
    if (!container) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observerSupported = 'IntersectionObserver' in window;

    const loadVideo = async () => {
        const config = await fetchVideoConfig(container);
        if (!config || !config.videoUrl) {
            renderVideoPlaceholder(container, {
                title: 'ChefWeb Experience',
                message: 'Video coming soon.'
            });
            return;
        }

        renderVideoPlayer(container, config);
        attachVideoHandlers(container, config, prefersReducedMotion);
    };

    if (observerSupported) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    loadVideo();
                }
            });
        }, { threshold: 0.2, rootMargin: '100px' });

        observer.observe(container);
    } else {
        loadVideo();
    }
}

async function fetchVideoConfig(container) {
    const fallback = {
        videoUrl: container.dataset.videoSrc || '',
        posterUrl: container.dataset.videoPoster || '',
        title: container.dataset.videoTitle || 'ChefWeb Experience',
        videoId: container.dataset.videoId || 'homepage_video'
    };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);

        const response = await fetch('/api/videos/homepage', { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            return fallback;
        }

        const data = await response.json();
        return {
            videoUrl: data.videoUrl || fallback.videoUrl,
            posterUrl: data.thumbnailUrl || fallback.posterUrl,
            title: data.title || fallback.title,
            videoId: data.videoId || fallback.videoId
        };
    } catch (error) {
        return fallback;
    }
}

function renderVideoPlaceholder(container, { title, message }) {
    container.innerHTML = `
        <div class="video-player video-player--placeholder" role="group" aria-label="${title}">
            <div class="video-player__frame">
                <div class="video-player__placeholder">
                    <span class="video-player__placeholder-icon" aria-hidden="true">▶</span>
                    <p class="video-player__placeholder-title">${title}</p>
                    <p class="video-player__placeholder-text">${message}</p>
                </div>
            </div>
        </div>
    `;
}

function renderVideoPlayer(container, config) {
    container.innerHTML = `
        <div class="video-player" data-video-id="${config.videoId}">
            <div class="video-player__frame">
                <video class="video-player__media" preload="metadata" playsinline controls poster="${config.posterUrl}" aria-label="${config.title}">
                    <source src="${config.videoUrl}" type="video/mp4">
                    Your browser does not support HTML5 video.
                </video>
                <button class="video-player__overlay" type="button" aria-label="Play video">
                    <span class="video-player__play-button" aria-hidden="true">
                        <span class="video-player__play-icon"></span>
                    </span>
                </button>
                <div class="video-player__loading hidden" aria-hidden="true">
                    <span class="video-player__spinner"></span>
                </div>
                <div class="video-player__error hidden" role="alert">
                    <p class="video-player__error-title">We couldn’t load the video.</p>
                    <p class="video-player__error-text">Please refresh or try again later.</p>
                </div>
            </div>
        </div>
    `;
}

function attachVideoHandlers(container, config, prefersReducedMotion) {
    const player = container.querySelector('.video-player');
    const video = container.querySelector('.video-player__media');
    const overlay = container.querySelector('.video-player__overlay');
    const loading = container.querySelector('.video-player__loading');
    const error = container.querySelector('.video-player__error');

    if (!video || !overlay) return;

    const milestones = { 25: false, 50: false, 75: false, 100: false };

    const showLoading = () => loading && loading.classList.remove('hidden');
    const hideLoading = () => loading && loading.classList.add('hidden');
    const showError = () => error && error.classList.remove('hidden');

    overlay.addEventListener('click', () => {
        if (video.paused) {
            video.play().catch(() => {
                showError();
                trackVideoEvent('video_error', config, { reason: 'play_failed' });
            });
        } else {
            video.pause();
        }
    });

    video.addEventListener('play', () => {
        player.classList.add('video-player--playing');
        overlay.setAttribute('aria-label', 'Pause video');
        trackVideoEvent('video_view_start', config);
    });

    video.addEventListener('pause', () => {
        player.classList.remove('video-player--playing');
        overlay.setAttribute('aria-label', 'Play video');
    });

    video.addEventListener('ended', () => {
        player.classList.remove('video-player--playing');
        overlay.setAttribute('aria-label', 'Play video');
        milestones[100] = true;
        trackVideoEvent('video_complete', config);
    });

    video.addEventListener('waiting', () => showLoading());
    video.addEventListener('canplay', () => hideLoading());

    video.addEventListener('error', () => {
        hideLoading();
        showError();
        trackVideoEvent('video_error', config, { reason: 'media_error' });
    });

    video.addEventListener('timeupdate', () => {
        if (!video.duration) return;
        const progress = (video.currentTime / video.duration) * 100;
        [25, 50, 75].forEach(mark => {
            if (progress >= mark && !milestones[mark]) {
                milestones[mark] = true;
                trackVideoEvent(`video_${mark}_percent`, config);
            }
        });
    });

    if (!prefersReducedMotion) {
        player.classList.add('video-player--animate');
    }
}

function trackVideoEvent(eventName, config, details = {}) {
    const payload = {
        event: eventName,
        videoId: config.videoId || 'homepage_video',
        timestamp: new Date().toISOString(),
        ...details
    };

    if (typeof gtag === 'function') {
        gtag('event', eventName, payload);
    }

    if (navigator.onLine) {
        fetch('/api/analytics/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    if (typeof Utils !== 'undefined' && Utils.announceToScreenReader && eventName === 'video_view_start') {
        Utils.announceToScreenReader('Video playback started.');
    }
}

// Calculate quick estimate (for display purposes)
function calculateQuickEstimate(adults, children) {
    const adultPrice = 75; // Base price per adult
    const childPrice = 50; // Base price per child
    const minimumSpend = 500;
    
    const subtotal = (adults * adultPrice) + (children * childPrice);
    const total = Math.max(subtotal, minimumSpend);
    
    return {
        adults,
        children,
        adultPrice,
        childPrice,
        subtotal,
        minimumSpend,
        total,
        meetsMinimum: subtotal >= minimumSpend
    };
}
