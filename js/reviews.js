/**
 * Reviews Page Logic
 * - Filtering (rating, package, photos)
 * - Sorting (recent, rating, helpful)
 * - Pagination
 * - Review submission form with star rating
 */

// Sample review data (in production this would come from backend)
const allReviews = [
    {
        id: 1,
        name: "Sarah Johnson",
        initials: "SJ",
        rating: 5,
        date: "2025-12-28",
        package: "premium",
        title: "Best birthday party ever!",
        text: "We hired ChefWeb for my husband's 40th birthday and it exceeded all expectations. Chef Michael was incredible - not only was the food amazing but the entertainment was top-notch. He had all 25 guests laughing and engaged throughout the cooking. The wagyu beef and lobster tail were cooked to perfection. Worth every penny!",
        photos: [
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1559847844-5315695dadae?w=300&h=200&fit=crop"
        ],
        helpful: 24,
        verified: true
    },
    {
        id: 2,
        name: "Michael Lee",
        initials: "ML",
        rating: 5,
        date: "2025-12-22",
        package: "signature",
        title: "Perfect for corporate events",
        text: "Booked ChefWeb for our company holiday party (18 people). The booking process was seamless, pricing was transparent with no hidden fees, and Chef Lisa was phenomenal. She accommodated all dietary restrictions (we had 3 vegetarians and 1 gluten-free) without any issues. Highly recommend the Signature package - great value!",
        photos: [],
        helpful: 18,
        verified: true
    },
    {
        id: 3,
        name: "Rachel Patel",
        initials: "RP",
        rating: 5,
        date: "2025-12-15",
        package: "essential",
        title: "Great family dinner experience",
        text: "Had 12 family members over for a reunion and decided to try ChefWeb. Even the Essential package was impressive! Chef David was patient with our kids (ages 5-10) and taught them some cooking tricks. Food was delicious and the cleanup was seamless. Already planning to book again for Thanksgiving!",
        photos: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop"],
        helpful: 15,
        verified: true
    },
    {
        id: 4,
        name: "James Chen",
        initials: "JC",
        rating: 4,
        date: "2025-12-10",
        package: "signature",
        title: "Good experience, minor timing issue",
        text: "Overall great service and food quality was excellent. Chef arrived 15 minutes late which pushed our dinner schedule back, but he made up for it with extra tricks and stayed a bit longer. Would definitely book again but maybe build in some buffer time for your event schedule.",
        photos: [],
        helpful: 12,
        verified: true
    },
    {
        id: 5,
        name: "Emily Wilson",
        initials: "EW",
        rating: 5,
        date: "2025-12-05",
        package: "premium",
        title: "Wedding rehearsal dinner perfection",
        text: "Used ChefWeb for our wedding rehearsal dinner (22 guests) and it was absolutely perfect. The personalized menu cards were a beautiful touch, and the chef's formal presentation matched our upscale event. Several guests asked for ChefWeb's contact info for their own events. Can't recommend highly enough!",
        photos: [],
        helpful: 31,
        verified: true
    },
    {
        id: 6,
        name: "David Martinez",
        initials: "DM",
        rating: 5,
        date: "2025-11-28",
        package: "signature",
        title: "Anniversary celebration success",
        text: "Celebrated our 10th anniversary with ChefWeb and it was magical. The chef created an intimate dining experience for just the two of us (plus our 2 kids). The filet mignon and shrimp combo was restaurant-quality. Such a unique way to celebrate at home. Thank you!",
        photos: [
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=300&h=200&fit=crop"
        ],
        helpful: 22,
        verified: true
    }
];

// State
let currentFilters = {
    rating: 'all',
    package: 'all',
    photosOnly: false
};
let currentSort = 'recent';
let currentPage = 1;
const itemsPerPage = 6;
let filteredReviews = [...allReviews];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initPagination();
    initReviewModal();
    renderReviews();
});

// Filter initialization
function initFilters() {
    const ratingFilter = document.getElementById('ratingFilter');
    const packageFilter = document.getElementById('packageFilter');
    const photoFilter = document.getElementById('photoFilter');
    const sortSelect = document.getElementById('sortSelect');

    if (ratingFilter) {
        ratingFilter.addEventListener('change', (e) => {
            currentFilters.rating = e.target.value;
            applyFilters();
        });
    }

    if (packageFilter) {
        packageFilter.addEventListener('change', (e) => {
            currentFilters.package = e.target.value;
            applyFilters();
        });
    }

    if (photoFilter) {
        photoFilter.addEventListener('change', (e) => {
            currentFilters.photosOnly = e.target.checked;
            applyFilters();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
        });
    }
}

// Apply filters and sort
function applyFilters() {
    // Start with all reviews
    filteredReviews = [...allReviews];

    // Filter by rating
    if (currentFilters.rating !== 'all') {
        const minRating = parseInt(currentFilters.rating);
        filteredReviews = filteredReviews.filter(r => r.rating >= minRating);
    }

    // Filter by package
    if (currentFilters.package !== 'all') {
        filteredReviews = filteredReviews.filter(r => r.package === currentFilters.package);
    }

    // Filter by photos
    if (currentFilters.photosOnly) {
        filteredReviews = filteredReviews.filter(r => r.photos && r.photos.length > 0);
    }

    // Sort
    switch (currentSort) {
        case 'recent':
            filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'rating-high':
            filteredReviews.sort((a, b) => b.rating - a.rating);
            break;
        case 'rating-low':
            filteredReviews.sort((a, b) => a.rating - b.rating);
            break;
        case 'helpful':
            filteredReviews.sort((a, b) => b.helpful - a.helpful);
            break;
    }

    // Reset to page 1
    currentPage = 1;
    renderReviews();
    updatePagination();
}

// Render reviews
function renderReviews() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageReviews = filteredReviews.slice(startIndex, endIndex);

    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = filteredReviews.length;
    }

    // Clear grid
    grid.innerHTML = '';

    // Show empty state if no results
    if (filteredReviews.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-3xl);">
                <div class="empty-state__icon">⭐</div>
                <h3 class="empty-state__title">No reviews match your filters</h3>
                <p class="empty-state__description">Try adjusting your filter criteria or <button onclick="resetReviewFilters()" style="color: var(--color-primary); text-decoration: underline; background: none; border: none; cursor: pointer; font-size: inherit; font-family: inherit;">reset all filters</button> to see all reviews.</p>
            </div>
        `;
        return;
    }

    // Render each review
    pageReviews.forEach(review => {
        const card = createReviewCard(review);
        grid.appendChild(card);
    });

    // Scroll to top of reviews
    const section = document.querySelector('.reviews-grid');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Helper function to reset all filters
window.resetReviewFilters = function() {
    // Reset filter values
    document.getElementById('ratingFilter').value = 'all';
    document.getElementById('packageFilter').value = 'all';
    document.getElementById('sortFilter').value = 'recent';
    const photosCheckbox = document.getElementById('photosOnlyFilter');
    if (photosCheckbox) photosCheckbox.checked = false;
    
    // Apply filters (will show all reviews)
    applyFilters();
};

// Create review card element
function createReviewCard(review) {
    const article = document.createElement('article');
    article.className = 'review-card-full';
    article.innerHTML = `
        <div class="review-card-full__header">
            <div class="review-card-full__avatar">
                <span>${review.initials}</span>
            </div>
            <div class="review-card-full__author">
                <h3 class="review-card-full__name">${review.name}</h3>
                <div class="review-card-full__meta">
                    <span class="review-card-full__stars">${getStars(review.rating)}</span>
                    <span class="review-card-full__date">${formatDate(review.date)}</span>
                    ${review.verified ? '<span class="badge badge--success badge--sm">✓ Verified</span>' : ''}
                </div>
                <div class="review-card-full__package">
                    <span class="badge badge--secondary badge--sm">${capitalizePackage(review.package)} Package</span>
                </div>
            </div>
        </div>
        <div class="review-card-full__content">
            <h4 class="review-card-full__title">${review.title}</h4>
            <p class="review-card-full__text">${review.text}</p>
            ${review.photos && review.photos.length > 0 ? createPhotosHTML(review.photos) : ''}
        </div>
        <div class="review-card-full__footer">
            <button class="review-card-full__helpful">👍 Helpful (${review.helpful})</button>
        </div>
    `;
    return article;
}

// Helper: Create photos HTML
function createPhotosHTML(photos) {
    return `
        <div class="review-card-full__photos">
            ${photos.map(photo => `<img src="${photo}" alt="Review photo" loading="lazy">`).join('')}
        </div>
    `;
}

// Helper: Get star string
function getStars(rating) {
    const fullStars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);
    return fullStars + emptyStars;
}

// Helper: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper: Capitalize package name
function capitalizePackage(pkg) {
    return pkg.charAt(0).toUpperCase() + pkg.slice(1);
}

// Pagination
function initPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderReviews();
                updatePagination();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderReviews();
                updatePagination();
            }
        });
    }

    updatePagination();
}

function updatePagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pagesContainer = document.getElementById('paginationPages');
    
    if (!prevBtn || !nextBtn || !pagesContainer) return;

    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

    // Update prev button
    if (currentPage === 1) {
        prevBtn.disabled = true;
        prevBtn.classList.add('pagination__btn--disabled');
    } else {
        prevBtn.disabled = false;
        prevBtn.classList.remove('pagination__btn--disabled');
    }

    // Update next button
    if (currentPage === totalPages) {
        nextBtn.disabled = true;
        nextBtn.classList.add('pagination__btn--disabled');
    } else {
        nextBtn.disabled = false;
        nextBtn.classList.remove('pagination__btn--disabled');
    }

    // Render page buttons
    pagesContainer.innerHTML = '';
    
    // Show first page
    if (currentPage > 2) {
        const btn = createPageButton(1);
        pagesContainer.appendChild(btn);
        
        if (currentPage > 3) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination__ellipsis';
            ellipsis.textContent = '...';
            pagesContainer.appendChild(ellipsis);
        }
    }

    // Show current page and neighbors
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        const btn = createPageButton(i);
        if (i === currentPage) {
            btn.classList.add('pagination__page--active');
        }
        pagesContainer.appendChild(btn);
    }

    // Show last page
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination__ellipsis';
            ellipsis.textContent = '...';
            pagesContainer.appendChild(ellipsis);
        }
        
        const btn = createPageButton(totalPages);
        pagesContainer.appendChild(btn);
    }
}

function createPageButton(pageNum) {
    const btn = document.createElement('button');
    btn.className = 'pagination__page';
    btn.textContent = pageNum;
    btn.addEventListener('click', () => {
        currentPage = pageNum;
        renderReviews();
        updatePagination();
    });
    return btn;
}

// Review submission modal
function initReviewModal() {
    const openBtn = document.getElementById('openReviewFormBtn');
    const cancelBtn = document.getElementById('cancelReviewBtn');
    const modal = document.getElementById('reviewModal');
    const form = document.getElementById('reviewForm');
    const starRating = document.getElementById('starRating');
    const ratingInput = document.getElementById('reviewRating');
    const modalId = 'review_submission_modal';

    // Open modal
    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('modal--active');
            
            // Use modal stack manager
            if (typeof ModalStack !== 'undefined') {
                ModalStack.push(modalId);
            } else {
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Close modal
    function closeModal() {
        if (modal) {
            modal.classList.remove('modal--active');
            
            // Use modal stack manager
            if (typeof ModalStack !== 'undefined') {
                ModalStack.pop(modalId);
            } else {
                document.body.style.overflow = '';
            }
            
            if (form) form.reset();
            resetStars();
        }
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    const closeButton = modal?.querySelector('.modal__close');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    const overlay = modal?.querySelector('.modal__overlay');
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    // Star rating interaction
    if (starRating) {
        const stars = starRating.querySelectorAll('.star-rating__star');
        stars.forEach((star, index) => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                const rating = parseInt(star.dataset.rating);
                if (ratingInput) ratingInput.value = rating;
                updateStars(rating);
            });

            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                highlightStars(rating);
            });
        });

        starRating.addEventListener('mouseleave', () => {
            const currentRating = ratingInput ? parseInt(ratingInput.value) : 0;
            highlightStars(currentRating);
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate rating
            if (!ratingInput || !ratingInput.value) {
                alert('Please select a rating');
                return;
            }

            // Validate review length
            const reviewText = document.getElementById('reviewText');
            if (reviewText && reviewText.value.length < 50) {
                alert('Review must be at least 50 characters');
                return;
            }

            // In production, this would submit to backend
            console.log('Review submitted:', {
                name: document.getElementById('reviewName')?.value,
                email: document.getElementById('reviewEmail')?.value,
                package: document.getElementById('reviewPackage')?.value,
                rating: ratingInput.value,
                title: document.getElementById('reviewTitle')?.value,
                text: reviewText?.value,
                photos: document.getElementById('reviewPhotos')?.files
            });

            // Show success message
            alert('Thank you for your review! It will be published after verification.');
            closeModal();
        });
    }
}

function updateStars(rating) {
    const stars = document.querySelectorAll('.star-rating__star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('star-rating__star--active');
        } else {
            star.textContent = '☆';
            star.classList.remove('star-rating__star--active');
        }
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-rating__star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
        } else {
            star.textContent = '☆';
        }
    });
}

function resetStars() {
    const stars = document.querySelectorAll('.star-rating__star');
    stars.forEach(star => {
        star.textContent = '☆';
        star.classList.remove('star-rating__star--active');
    });
    const ratingInput = document.getElementById('reviewRating');
    if (ratingInput) ratingInput.value = '';
}
