/**
 * Gallery Page Logic
 * - Masonry grid layout with responsive columns
 * - Category filtering (event type and dish type)
 * - Lightbox for full-size viewing with prev/next navigation
 * - Lazy loading with Intersection Observer
 * - UGC submission form with file preview
 */

// Gallery data (in production this would come from backend)
const galleryImages = [
    { src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=800&fit=crop', alt: 'Birthday party hibachi setup', event: 'birthday', dish: 'entrees' },
    { src: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&h=400&fit=crop', alt: 'Wedding rehearsal dinner', event: 'wedding', dish: 'seafood' },
    { src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=600&fit=crop', alt: 'Corporate event dining', event: 'corporate', dish: 'steak' },
    { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=700&fit=crop', alt: 'Seafood hibachi preparation', event: 'birthday', dish: 'seafood' },
    { src: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600&h=500&fit=crop', alt: 'Family dinner hibachi grill', event: 'family', dish: 'entrees' },
    { src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=800&fit=crop', alt: 'Anniversary steak dinner', event: 'anniversary', dish: 'steak' },
    { src: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=450&fit=crop', alt: 'Hibachi appetizers', event: 'birthday', dish: 'appetizers' },
    { src: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=650&fit=crop', alt: 'Wedding dinner service', event: 'wedding', dish: 'entrees' },
    { src: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&h=550&fit=crop', alt: 'Corporate team dinner', event: 'corporate', dish: 'entrees' },
    { src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=700&fit=crop', alt: 'Fresh seafood selection', event: 'family', dish: 'seafood' },
    { src: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=500&fit=crop', alt: 'Birthday dessert', event: 'birthday', dish: 'desserts' },
    { src: 'https://images.unsplash.com/photo-1580959375944-57c216f1fb5a?w=600&h=800&fit=crop', alt: 'Premium lobster tail', event: 'anniversary', dish: 'seafood' }
];

// State
let currentFilters = {
    event: 'all',
    dish: 'all'
};
let filteredImages = [...galleryImages];
let currentLightboxIndex = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initLightbox();
    initLazyLoading();
    initUgcModal();
    renderGallery();
});

// Filter initialization
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-chip');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            const type = button.dataset.type;
            
            // Update active state within the same type group
            const siblings = button.parentElement.querySelectorAll('.filter-chip');
            siblings.forEach(btn => btn.classList.remove('filter-chip--active'));
            button.classList.add('filter-chip--active');
            
            // Update filter state
            currentFilters[type] = category;
            
            // Apply filters
            applyFilters();
        });
    });
}

// Apply filters
function applyFilters() {
    filteredImages = galleryImages.filter(image => {
        const eventMatch = currentFilters.event === 'all' || image.event === currentFilters.event;
        const dishMatch = currentFilters.dish === 'all' || image.dish === currentFilters.dish;
        return eventMatch && dishMatch;
    });
    
    renderGallery();
}

// Render gallery
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const countSpan = document.getElementById('galleryCount');
    
    if (!grid) return;
    
    // Update count
    if (countSpan) {
        countSpan.textContent = filteredImages.length;
    }
    
    // Clear grid
    grid.innerHTML = '';
    
    // Show empty state if no results
    if (filteredImages.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-3xl); color: var(--color-text-secondary);">
                <p style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-md);">📷 No photos match your filters</p>
                <p>Try selecting different categories or <button onclick="resetAllFilters()" style="color: var(--color-primary); text-decoration: underline; background: none; border: none; cursor: pointer; font-size: inherit; font-family: inherit;">reset filters</button></p>
            </div>
        `;
        return;
    }
    
    // Render filtered images
    filteredImages.forEach((image, index) => {
        const item = createGalleryItem(image, index);
        grid.appendChild(item);
    });
    
    // Reinitialize lazy loading for new images
    initLazyLoading();
}

// Helper to reset all filters
window.resetAllFilters = function() {
    currentFilters = { event: 'all', dish: 'all' };
    
    // Reset UI
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('filter-chip--active');
        if (chip.dataset.type === 'all') {
            chip.classList.add('filter-chip--active');
        }
    });
    
    applyFilters();
};

// Create gallery item
function createGalleryItem(image, index) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.dataset.event = image.event;
    div.dataset.dish = image.dish;
    
    div.innerHTML = `
        <img src="${image.src}" alt="${image.alt}" loading="lazy" data-index="${index}">
        <div class="gallery-item__overlay">
            <span class="gallery-item__badge">${getBadgeIcon(image.event)} ${capitalizeFirst(image.event)}</span>
        </div>
    `;
    
    // Add click handler for lightbox
    const img = div.querySelector('img');
    if (img) {
        img.addEventListener('click', () => {
            openLightbox(index);
        });
    }
    
    return div;
}

// Helper: Get badge icon
function getBadgeIcon(eventType) {
    const icons = {
        birthday: '🎂',
        wedding: '💍',
        corporate: '💼',
        anniversary: '🥂',
        family: '👨‍👩‍👧‍👦'
    };
    return icons[eventType] || '📷';
}

// Helper: Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Lightbox functionality
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox?.querySelector('.lightbox__close');
    const prevBtn = lightbox?.querySelector('.lightbox__prev');
    const nextBtn = lightbox?.querySelector('.lightbox__next');
    const overlay = lightbox?.querySelector('.lightbox__overlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeLightbox);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', showPrevImage);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', showNextImage);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox?.classList.contains('lightbox--active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            showPrevImage();
        } else if (e.key === 'ArrowRight') {
            showNextImage();
        }
    });
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');
    
    if (!lightbox || !image) return;
    
    currentLightboxIndex = index;
    const imageData = filteredImages[index];
    
    if (imageData) {
        image.src = imageData.src;
        image.alt = imageData.alt;
        
        if (caption) {
            caption.textContent = imageData.alt;
        }
        
        if (counter) {
            counter.textContent = `${index + 1} / ${filteredImages.length}`;
        }
    }
    
    lightbox.classList.add('lightbox--active');
    
    // Use modal stack manager
    if (typeof ModalStack !== 'undefined') {
        ModalStack.push('gallery_lightbox');
    } else {
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('lightbox--active');
        
        // Use modal stack manager
        if (typeof ModalStack !== 'undefined') {
            ModalStack.pop('gallery_lightbox');
        } else {
            document.body.style.overflow = '';
        }
    }
}

function showPrevImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + filteredImages.length) % filteredImages.length;
    updateLightboxImage();
}

function showNextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % filteredImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');
    
    const imageData = filteredImages[currentLightboxIndex];
    
    if (image && imageData) {
        image.src = imageData.src;
        image.alt = imageData.alt;
    }
    
    if (caption && imageData) {
        caption.textContent = imageData.alt;
    }
    
    if (counter) {
        counter.textContent = `${currentLightboxIndex + 1} / ${filteredImages.length}`;
    }
}

// Lazy loading with Intersection Observer
function initLazyLoading() {
    const images = document.querySelectorAll('.gallery-item img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // Image will load automatically due to loading="lazy" attribute
                    // This observer is mainly for potential future enhancements
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before entering viewport
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// UGC Modal
function initUgcModal() {
    const openBtn = document.getElementById('openUgcFormBtn');
    const cancelBtn = document.getElementById('cancelUgcBtn');
    const modal = document.getElementById('ugcModal');
    const form = document.getElementById('ugcForm');
    const fileInput = document.getElementById('ugcFiles');
    const filePreview = document.getElementById('filePreview');
    const modalId = 'ugc_submission_modal';
    
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
            if (filePreview) filePreview.innerHTML = '';
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
    
    // File preview
    if (fileInput && filePreview) {
        fileInput.addEventListener('change', (e) => {
            filePreview.innerHTML = '';
            const files = Array.from(e.target.files || []);
            
            if (files.length > 10) {
                alert('Maximum 10 files allowed');
                fileInput.value = '';
                return;
            }
            
            files.forEach((file, index) => {
                // Check file size (20MB = 20 * 1024 * 1024 bytes)
                if (file.size > 20 * 1024 * 1024) {
                    alert(`File ${file.name} exceeds 20MB limit`);
                    return;
                }
                
                // Create preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.createElement('div');
                    preview.className = 'file-preview-item';
                    
                    if (file.type.startsWith('image/')) {
                        preview.innerHTML = `
                            <img src="${e.target?.result}" alt="Preview">
                            <button type="button" class="file-preview-item__remove" data-index="${index}">×</button>
                        `;
                    } else if (file.type.startsWith('video/')) {
                        preview.innerHTML = `
                            <video src="${e.target?.result}"></video>
                            <span class="file-preview-item__icon">🎥</span>
                            <button type="button" class="file-preview-item__remove" data-index="${index}">×</button>
                        `;
                    }
                    
                    filePreview.appendChild(preview);
                    
                    // Remove button handler
                    const removeBtn = preview.querySelector('.file-preview-item__remove');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            preview.remove();
                            // Note: Can't actually remove from FileList, would need to track separately
                        });
                    }
                };
                
                reader.readAsDataURL(file);
            });
        });
    }
    
    // Form submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate files
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                alert('Please select at least one photo or video');
                return;
            }
            
            // In production, this would upload to backend
            console.log('UGC submission:', {
                name: document.getElementById('ugcName')?.value,
                email: document.getElementById('ugcEmail')?.value,
                eventType: document.getElementById('ugcEventType')?.value,
                eventDate: document.getElementById('ugcEventDate')?.value,
                caption: document.getElementById('ugcCaption')?.value,
                files: fileInput.files,
                consent: document.getElementById('ugcConsent')?.checked
            });
            
            // Show success message
            alert('Thank you for sharing! Your photos will be reviewed and added to our gallery soon.');
            closeModal();
        });
    }
}
