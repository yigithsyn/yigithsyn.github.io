const $ = window.jQuery;

export function initializePageSettings(paginate) {
    const $pageOrientation = $('#page-orientation');
    const orientationStorageKey = 'auto-page-orientation-ratio';

    $('#page-size, #page-orientation').each(function () {
        const saved = localStorage.getItem(this.id);
        if (saved) $(this).val(saved);
    }).on('change', function () {
        localStorage.setItem(this.id, $(this).val());
        paginate();
    });

    let viewportOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    const savedViewportOrientation = localStorage.getItem(orientationStorageKey);
    if (savedViewportOrientation !== viewportOrientation || localStorage.getItem('page-orientation') === null) {
        $pageOrientation.val(viewportOrientation);
        localStorage.setItem('page-orientation', viewportOrientation);
    }
    localStorage.setItem(orientationStorageKey, viewportOrientation);

    $(window).on('resize', () => {
        const nextViewportOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        if (nextViewportOrientation === viewportOrientation) return;

        viewportOrientation = nextViewportOrientation;
        localStorage.setItem(orientationStorageKey, viewportOrientation);
        $pageOrientation.val(viewportOrientation).trigger('change');
    });

    $('#print').on('click', () => window.print());
}
