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
    { src: 'https://via.placeholder.com/600x800/ff6b35/ffffff?text=Birthday+Hibachi', alt: 'Birthday party hibachi setup with chef performing', event: 'birthday', dish: 'entrees' },
    { src: 'https://via.placeholder.com/600x400/ff6b35/ffffff?text=Wedding+Dinner', alt: 'Wedding rehearsal dinner with hibachi chef', event: 'wedding', dish: 'seafood' },
    { src: 'https://via.placeholder.com/600x600/ff6b35/ffffff?text=Corporate+Event', alt: 'Corporate event hibachi dining experience', event: 'corporate', dish: 'steak' },
    { src: 'https://via.placeholder.com/600x700/ff6b35/ffffff?text=Seafood+Hibachi', alt: 'Seafood hibachi preparation by private chef', event: 'birthday', dish: 'seafood' },
    { src: 'https://via.placeholder.com/600x500/ff6b35/ffffff?text=Family+Dinner', alt: 'Family dinner with hibachi grill at home', event: 'family', dish: 'entrees' },
    { src: 'https://via.placeholder.com/600x800/ff6b35/ffffff?text=Anniversary+Steak', alt: 'Anniversary steak dinner with private chef', event: 'anniversary', dish: 'steak' },
    { src: 'https://via.placeholder.com/600x450/ff6b35/ffffff?text=Hibachi+Appetizers', alt: 'Hibachi appetizers prepared at home', event: 'birthday', dish: 'appetizers' },
    { src: 'https://via.placeholder.com/600x650/ff6b35/ffffff?text=Wedding+Service', alt: 'Wedding dinner service with hibachi chef', event: 'wedding', dish: 'entrees' },
    { src: 'https://via.placeholder.com/600x550/ff6b35/ffffff?text=Team+Dinner', alt: 'Corporate team dinner hibachi experience', event: 'corporate', dish: 'entrees' },
    { src: 'https://via.placeholder.com/600x700/ff6b35/ffffff?text=Fresh+Seafood', alt: 'Fresh seafood selection for private chef service', event: 'family', dish: 'seafood' },
    { src: 'https://via.placeholder.com/600x500/ff6b35/ffffff?text=Birthday+Dessert', alt: 'Birthday dessert with hibachi chef', event: 'birthday', dish: 'desserts' },
    { src: 'https://via.placeholder.com/600x800/ff6b35/ffffff?text=Premium+Lobster', alt: 'Premium lobster tail hibachi preparation', event: 'anniversary', dish: 'seafood' }
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
    console.log('🎬 Gallery.js - DOMContentLoaded fired');
    console.log('📊 Gallery images count:', galleryImages.length);
    
    const grid = document.getElementById('galleryGrid');
    console.log('🎯 Gallery grid element:', grid);
    
    if (!grid) {
        console.error('❌ CRITICAL: galleryGrid element not found!');
        return;
    }
    
    initFilters();
    initLightbox();
    initLazyLoading();
    initUgcModal();
    renderGallery();
    
    console.log('✅ Gallery initialization complete');
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
    console.log('🎨 renderGallery() called');
    const grid = document.getElementById('galleryGrid');
    const countSpan = document.getElementById('galleryCount');
    
    console.log('📍 Grid element:', grid);
    console.log('📊 Filtered images:', filteredImages.length);
    
    if (!grid) {
        console.error('❌ Cannot render - grid element not found');
        return;
    }
    
    // Update count
    if (countSpan) {
        countSpan.textContent = filteredImages.length;
    }
    
    // Clear grid
    grid.innerHTML = '';
    console.log('🧹 Grid cleared');
    
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
    console.log('🔄 Starting to render', filteredImages.length, 'images');
    filteredImages.forEach((image, index) => {
        const item = createGalleryItem(image, index);
        grid.appendChild(item);
        console.log(`✅ Added image ${index + 1}:`, image.src.substring(0, 50));
    });
    
    console.log('✨ All images appended to grid');
    
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
    console.log(`🏗️ Creating gallery item ${index}:`, image.src.substring(0, 60));
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.dataset.event = image.event;
    div.dataset.dish = image.dish;
    div.style.height = '320px';
    div.style.minHeight = '320px';
    
    div.innerHTML = `
        <img src="${image.src}" alt="${image.alt}" data-index="${index}" style="width:100%;height:100%;object-fit:cover;" onerror="console.error('❌ Image failed to load:', this.src); this.style.background='#f0f0f0';">
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
        
        // Ensure image loads and handles errors
        img.addEventListener('load', () => {
            console.log(`✅ Image ${index} loaded successfully`);
        });
        
        img.addEventListener('error', () => {
            console.error('❌ Failed to load image:', image.src);
            img.style.background = '#f0f0f0';
            div.style.background = '#f0f0f0';
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
    const images = document.querySelectorAll('.gallery-item img');
    console.log('🔍 Lazy loading: Found', images.length, 'images to observe');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // Images load immediately now (no lazy attribute)
                    console.log('👁️ Image in viewport:', img.src.substring(0, 50));
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before entering viewport
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        console.log('⚠️ IntersectionObserver not supported');
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
