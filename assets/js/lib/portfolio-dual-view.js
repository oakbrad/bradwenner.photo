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

    /**
     * Initialize dual-view functionality
     */
    function init() {
        if (totalSlides === 0) return;

        // Build grid from carousel images
        buildGrid();

        // Check initial hash
        handleHashChange();

        // Bind events
        bindEvents();
    }

    /**
     * Build grid view by cloning carousel images (no captions)
     */
    function buildGrid() {
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
     * Switch to carousel view at specific index
     */
    function showCarousel(index) {
        index = typeof index === 'number' ? index : 0;
        index = Math.max(0, Math.min(index, totalSlides - 1));

        currentView = 'carousel';

        // Update classes
        container.classList.remove('view-grid');
        container.classList.add('view-carousel');

        // Update ARIA
        carousel.setAttribute('aria-hidden', 'false');
        grid.setAttribute('aria-hidden', 'true');

        // Update URL hash (remove #grid)
        if (window.location.hash === '#grid') {
            history.pushState(null, '', window.location.pathname);
        }

        // Scroll to specific image
        var targetSlide = slides[index];
        if (targetSlide) {
            // Small delay to allow view transition to complete
            setTimeout(function() {
                targetSlide.scrollIntoView({
                    behavior: 'instant',
                    block: 'nearest',
                    inline: 'center'
                });
            }, 50);
        }

        // Notify portfolio.js of view change
        window.dispatchEvent(new CustomEvent('portfolio:viewchange', {
            detail: { view: 'carousel', index: index }
        }));
    }

    /**
     * Switch to grid view
     */
    function showGrid() {
        currentView = 'grid';

        // Update classes
        container.classList.remove('view-carousel');
        container.classList.add('view-grid');

        // Update ARIA
        carousel.setAttribute('aria-hidden', 'true');
        grid.setAttribute('aria-hidden', 'false');

        // Update URL hash
        if (window.location.hash !== '#grid') {
            history.pushState(null, '', window.location.pathname + '#grid');
        }

        // Scroll to top of grid
        window.scrollTo(0, 0);

        // Notify portfolio.js of view change
        window.dispatchEvent(new CustomEvent('portfolio:viewchange', {
            detail: { view: 'grid' }
        }));
    }

    /**
     * Handle URL hash changes (back/forward buttons)
     */
    function handleHashChange() {
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
