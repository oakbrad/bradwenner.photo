/**
 * Portfolio Dual View - Carousel + Grid mode
 * Handles view switching, URL hash, and navigation between views
 */
(function() {
    'use strict';

    // Only run on dual-view portfolio pages
    var container = document.querySelector('.portfolio-dual-container');
    if (!container) return;

    // DOM elements
    var carousel = container.querySelector('#portfolio-carousel');
    var grid = container.querySelector('#portfolio-grid');
    var closeBtn = container.querySelector('.portfolio-close-btn');
    var slides = carousel.querySelectorAll('.kg-image-card');

    // State
    var currentView = 'carousel';
    var totalSlides = slides.length;
    var masonryInstance = null;

    // Track if this is the initial load (for fade-in behavior)
    var isInitialLoad = true;

    /**
     * Initialize dual-view functionality
     */
    function init() {
        if (totalSlides === 0) return;

        // Build grid from carousel images
        buildGrid();

        // Initialize Masonry for grid layout
        initMasonry();

        // Determine initial view based on hash (without updating URL)
        if (window.location.hash === '#grid') {
            showGridInitial();
        } else {
            showCarouselInitial();
        }

        // Double rAF ensures browser has painted the hidden state before we reveal
        // This allows the CSS transition to actually animate
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                container.classList.add('view-visible');
                isInitialLoad = false;

                // If starting in grid view, refresh Masonry after visible
                if (currentView === 'grid') {
                    refreshMasonry();
                }
            });
        });

        // Bind events
        bindEvents();
    }

    /**
     * Initial carousel show - no URL manipulation, no scrollIntoView delay
     */
    function showCarouselInitial() {
        currentView = 'carousel';
        container.classList.add('view-carousel');
        carousel.setAttribute('aria-hidden', 'false');
        grid.setAttribute('aria-hidden', 'true');

        // Scroll to first image immediately (no delay needed on initial load)
        var firstSlide = slides[0];
        if (firstSlide) {
            firstSlide.scrollIntoView({
                behavior: 'instant',
                block: 'nearest',
                inline: 'center'
            });
        }
    }

    /**
     * Initial grid show - no URL manipulation
     */
    function showGridInitial() {
        currentView = 'grid';
        container.classList.add('view-grid');
        carousel.setAttribute('aria-hidden', 'true');
        grid.setAttribute('aria-hidden', 'false');
    }

    /**
     * Build grid view by cloning carousel images (no captions)
     */
    function buildGrid() {
        // Add grid sizer for Masonry column width calculation
        var gridSizer = document.createElement('div');
        gridSizer.className = 'portfolio-grid-sizer';
        grid.appendChild(gridSizer);

        slides.forEach(function(slide, index) {
            var img = slide.querySelector('img');

            if (!img) return;

            // Create grid item
            var gridItem = document.createElement('div');
            gridItem.className = 'portfolio-grid-item';
            gridItem.setAttribute('data-index', index);
            gridItem.setAttribute('role', 'button');
            gridItem.setAttribute('tabindex', '0');
            gridItem.setAttribute('aria-label', 'View image ' + (index + 1) + ' of ' + totalSlides + ' in carousel');

            // Clone image - larger sizes for 1-3 column grid
            var thumbImg = document.createElement('img');
            thumbImg.src = img.src;
            thumbImg.alt = img.alt || '';
            thumbImg.loading = 'lazy';

            // Use srcset if available, browser will pick appropriate size for grid
            if (img.srcset) {
                thumbImg.srcset = img.srcset;
            }
            // Larger sizes for 1-3 column grid layout
            thumbImg.sizes = '(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw';

            gridItem.appendChild(thumbImg);
            grid.appendChild(gridItem);
        });
    }

    /**
     * Initialize Masonry layout for grid view
     * Uses horizontalOrder to maintain left-to-right sequence
     */
    function initMasonry() {
        if (typeof Masonry === 'undefined') {
            console.warn('Masonry.js not loaded');
            return;
        }

        // Wait for images to load before initializing Masonry
        if (typeof imagesLoaded !== 'undefined') {
            imagesLoaded(grid, function() {
                createMasonryInstance();
            });
        } else {
            // Fallback if imagesLoaded not available
            createMasonryInstance();
        }
    }

    /**
     * Create the Masonry instance
     */
    function createMasonryInstance() {
        masonryInstance = new Masonry(grid, {
            itemSelector: '.portfolio-grid-item',
            columnWidth: '.portfolio-grid-sizer',
            percentPosition: true,
            horizontalOrder: true,  // Prioritize left-to-right ordering
            gutter: 24,
            resize: true,  // Let Masonry handle resize natively
            transitionDuration: '0.6s',  // Smooth repositioning on resize
            stagger: '0.3s'  // Staggered animation for items
        });
    }

    /**
     * Refresh Masonry layout (call after view switch)
     */
    function refreshMasonry() {
        if (!masonryInstance) return;

        // Need to re-layout after display changes
        masonryInstance.layout();
    }

    // Transition duration in ms (matches CSS)
    var FADE_DURATION = 300;

    /**
     * Switch to carousel view at specific index
     */
    function showCarousel(index) {
        index = typeof index === 'number' ? index : 0;
        index = Math.max(0, Math.min(index, totalSlides - 1));

        currentView = 'carousel';

        // Fade out current view
        container.classList.remove('view-visible');

        // After fade out completes, switch view and fade in
        setTimeout(function() {
            // Switch view classes
            container.classList.remove('view-grid');
            container.classList.add('view-carousel');

            // Update ARIA
            carousel.setAttribute('aria-hidden', 'false');
            grid.setAttribute('aria-hidden', 'true');

            // Position carousel to target image (instant, while hidden)
            var targetSlide = slides[index];
            if (targetSlide) {
                targetSlide.scrollIntoView({
                    behavior: 'instant',
                    block: 'nearest',
                    inline: 'center'
                });
            }

            // Update URL hash (remove #grid)
            if (window.location.hash === '#grid') {
                history.pushState(null, '', window.location.pathname);
            }

            // Fade in new view
            requestAnimationFrame(function() {
                container.classList.add('view-visible');
            });

            // Notify portfolio.js of view change
            window.dispatchEvent(new CustomEvent('portfolio:viewchange', {
                detail: { view: 'carousel', index: index }
            }));
        }, FADE_DURATION);
    }

    /**
     * Get current carousel index from scroll position
     */
    function getCurrentCarouselIndex() {
        var carouselRect = carousel.getBoundingClientRect();
        var centerX = carouselRect.left + carouselRect.width / 2;

        for (var i = 0; i < totalSlides; i++) {
            var slideRect = slides[i].getBoundingClientRect();
            if (slideRect.left <= centerX && slideRect.right >= centerX) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Switch to grid view, centering on current carousel image
     */
    function showGrid() {
        // Get current carousel position before switching
        var currentIndex = getCurrentCarouselIndex();

        currentView = 'grid';

        // Fade out current view
        container.classList.remove('view-visible');

        // After fade out completes, switch view and fade in
        setTimeout(function() {
            // Switch view classes
            container.classList.remove('view-carousel');
            container.classList.add('view-grid');

            // Update ARIA
            carousel.setAttribute('aria-hidden', 'true');
            grid.setAttribute('aria-hidden', 'false');

            // Update URL hash
            if (window.location.hash !== '#grid') {
                history.pushState(null, '', window.location.pathname + '#grid');
            }

            // Refresh Masonry layout, then position and fade in
            refreshMasonry();

            // Position grid to target image BEFORE fading in
            var gridItems = grid.querySelectorAll('.portfolio-grid-item');
            var targetGridItem = gridItems[currentIndex];
            if (targetGridItem) {
                targetGridItem.scrollIntoView({
                    behavior: 'instant',
                    block: 'center'
                });
            }

            // Fade in new view
            requestAnimationFrame(function() {
                container.classList.add('view-visible');
            });

            // Notify portfolio.js of view change
            window.dispatchEvent(new CustomEvent('portfolio:viewchange', {
                detail: { view: 'grid' }
            }));
        }, FADE_DURATION);
    }

    /**
     * Handle URL hash changes (back/forward buttons only, not initial load)
     */
    function handleHashChange() {
        // Skip if this is somehow called during initial load
        if (isInitialLoad) return;

        if (window.location.hash === '#grid') {
            showGrid();
        } else {
            showCarousel(0);
        }
    }

    /**
     * Handle grid item click - open carousel to that image
     */
    function handleGridClick(e) {
        var gridItem = e.target.closest('.portfolio-grid-item');
        if (!gridItem) return;

        var index = parseInt(gridItem.getAttribute('data-index'), 10);
        showCarousel(index);
    }

    /**
     * Handle close button click
     */
    function handleCloseClick() {
        showGrid();
    }

    /**
     * Handle keyboard events
     */
    function handleKeydown(e) {
        // Escape key closes carousel, goes to grid
        if (e.key === 'Escape' && currentView === 'carousel') {
            e.preventDefault();
            showGrid();
            return;
        }

        // Enter/Space on grid item opens carousel
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('portfolio-grid-item')) {
            e.preventDefault();
            var index = parseInt(e.target.getAttribute('data-index'), 10);
            showCarousel(index);
        }
    }

    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Hash change (back/forward buttons)
        window.addEventListener('hashchange', handleHashChange);

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', handleCloseClick);
        }

        // Grid item clicks
        grid.addEventListener('click', handleGridClick);

        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
