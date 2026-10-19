import { PAGE_SIZES } from './pagination.js';

const $ = window.jQuery;

export function initializePageSettings(paginate) {
    const $pageOrientation = $('#page-orientation');
    const orientationStorageKey = 'auto-page-orientation-ratio';
    const manualSizeKey = 'manual-page-size';
    const manualWidthKey = 'manual-page-size-width';
    const manualHeightKey = 'manual-page-size-height';
    let manualPageSize = localStorage.getItem(manualSizeKey) === 'true'
        && localStorage.getItem(manualWidthKey) === String(window.innerWidth)
        && localStorage.getItem(manualHeightKey) === String(window.innerHeight);

    if (!manualPageSize) {
        localStorage.removeItem(manualSizeKey);
        localStorage.removeItem(manualWidthKey);
        localStorage.removeItem(manualHeightKey);
    }

    function setPageSizeForViewport() {
        const sizes = Object.keys(PAGE_SIZES);
        const nextSize = sizes.find(size => {
            let [width, height] = PAGE_SIZES[size];
            if ($pageOrientation.val() === 'landscape') [width, height] = [height, width];
            return window.innerWidth >= width * 96 / 25.4 && window.innerHeight >= height * 96 / 25.4;
        }) || sizes[sizes.length - 1];

        if (nextSize === $('#page-size').val()) return false;
        $('#page-size').val(nextSize);
        localStorage.setItem('page-size', nextSize);
        return true;
    }

    $('#page-size, #page-orientation').each(function () {
        const saved = localStorage.getItem(this.id);
        if (saved) $(this).val(saved);
    }).on('change', function (event) {
        if (this.id === 'page-size' && event.originalEvent) {
            manualPageSize = true;
            localStorage.setItem(manualSizeKey, 'true');
            localStorage.setItem(manualWidthKey, String(window.innerWidth));
            localStorage.setItem(manualHeightKey, String(window.innerHeight));
        }
        if (!manualPageSize) setPageSizeForViewport();
        localStorage.setItem(this.id, $(this).val());
        localStorage.setItem('page-size', $('#page-size').val());
        paginate();
    });

    let viewportOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    const savedViewportOrientation = localStorage.getItem(orientationStorageKey);
    if (savedViewportOrientation !== viewportOrientation || localStorage.getItem('page-orientation') === null) {
        $pageOrientation.val(viewportOrientation);
        localStorage.setItem('page-orientation', viewportOrientation);
    }
    localStorage.setItem(orientationStorageKey, viewportOrientation);
    if (!manualPageSize) setPageSizeForViewport();

    function refreshPageLayout() {
        const nextViewportOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        if (nextViewportOrientation !== viewportOrientation) {
            viewportOrientation = nextViewportOrientation;
            localStorage.setItem(orientationStorageKey, viewportOrientation);
            $pageOrientation.val(viewportOrientation);
            localStorage.setItem('page-orientation', viewportOrientation);
        }
        if (!manualPageSize) setPageSizeForViewport();
        paginate();
    }

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    $(window).on('resize', () => {
        if (window.innerWidth === viewportWidth && window.innerHeight === viewportHeight) return;
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;
        manualPageSize = false;
        localStorage.removeItem(manualSizeKey);
        localStorage.removeItem(manualWidthKey);
        localStorage.removeItem(manualHeightKey);

        const nextViewportOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        if (nextViewportOrientation !== viewportOrientation) {
            viewportOrientation = nextViewportOrientation;
            localStorage.setItem(orientationStorageKey, viewportOrientation);
            $pageOrientation.val(viewportOrientation).trigger('change');
        } else if (setPageSizeForViewport()) {
            paginate();
        }
    });

    $('#print').on('click', () => window.print());

    return refreshPageLayout;
}
