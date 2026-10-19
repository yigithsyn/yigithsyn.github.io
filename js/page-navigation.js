const $ = window.jQuery;

export function initializePageNavigation() {
    const barH = () => $('#toolbar').outerHeight();

    function currentPage() {
        const pages = $('#pages .page').toArray();
        // Araç çubuğunun altındaki görünür ilk sayfayı geçerli sayfa kabul et.
        const i = pages.findIndex(p => p.getBoundingClientRect().bottom > barH() + 50);
        return i === -1 ? 0 : i;
    }

    function restorePage() {
        // En son görüntülenen sayfayı, sabit araç çubuğunun altında kalmayacak şekilde aç.
        const page = $('#pages .page')[+localStorage.getItem('current-page') || 0];
        if (page) window.scrollTo({ top: page.getBoundingClientRect().top + scrollY - barH() - 10 });
    }

    function updateNav() {
        const total = $('#pages .page').length;
        const cur = currentPage();
        $('#page-counter').text((cur + 1) + ' / ' + total);
        $('#page-prev').prop('disabled', cur === 0);
        $('#page-next').prop('disabled', cur >= total - 1);
    }

    function goPage(dir) {
        const pages = $('#pages .page').toArray();
        if (!pages.length) return;
        const toolbarHeight = barH();
        const tops = pages.map(page => page.getBoundingClientRect().top - toolbarHeight);
        // Kısmen görünür sayfayı hesaba katarak komşu sayfanın üst hizasına kaydır.
        let cur = tops.findIndex(top => top > -5);
        if (cur === -1) cur = pages.length - 1;
        let target = dir > 0 ? (tops[cur] > 15 ? cur : cur + 1) : cur - 1;
        if (dir < 0 && tops[cur] < -5) target = cur;
        target = Math.max(0, Math.min(pages.length - 1, target));
        window.scrollBy({ top: tops[target] - 10, behavior: 'smooth' });
    }

    // Tarayıcının otomatik kaydırma geri yüklemesiyle kayıtlı sayfa konumu çakışmasın.
    history.scrollRestoration = 'manual';
    $('#page-prev').on('click', () => goPage(-1));
    $('#page-next').on('click', () => goPage(1));
    $('#page-size, #page-orientation').on('change', updateNav);
    $(window).on('scroll', () => {
        updateNav();
        clearTimeout(saveTimer);
        // Hızlı kaydırmalarda her piksel değişiminde yazmayı önlemek için kaydı geciktir.
        saveTimer = setTimeout(() => localStorage.setItem('current-page', currentPage()), 150);
    });

    let saveTimer;
    return {
        restorePage,
        updateNav
    };
}
