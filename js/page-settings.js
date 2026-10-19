const $ = window.jQuery;

export function initializePageSettings(paginate) {
    $('#page-size, #page-orientation').each(function () {
        const saved = localStorage.getItem(this.id);
        if (saved) $(this).val(saved);
    }).on('change', function () {
        localStorage.setItem(this.id, $(this).val());
        paginate();
    });
    $('#print').on('click', () => window.print());
}
