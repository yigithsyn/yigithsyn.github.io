const $ = window.jQuery;

export const PAGE_SIZES = { A4: [210, 297], A5: [148, 210], A6: [105, 148] };

function newPage($pages) {
    const $content = $('<div class="page-content"></div>');
    const $page = $('<div class="page"></div>').append($content);
    $pages.append($page);
    return $content;
}

export function paginate() {
    let [w, h] = PAGE_SIZES[$('#page-size').val()].map(size => size + 'mm');
    if ($('#page-orientation').val() === 'landscape') [w, h] = [h, w];
    $('#page-style').remove();
    $('<style id="page-style"></style>').text('@page { size: ' + w + ' ' + h + '; margin: 0; }').appendTo('head');
    document.documentElement.style.setProperty('--page-w', w);
    document.documentElement.style.setProperty('--page-h', h);

    const $pages = $('#pages').empty();
    let $content = newPage($pages);

    const overflows = () => $content[0].scrollHeight > $content[0].clientHeight;

    $('#source > section').each(function () {
        const $section = $(this).clone();
        const children = $section.children().toArray();
        const blocks = [];

        for (let i = 0; i < children.length;) {
            const block = [children[i++]];
            if (/^H[1-6]$/.test(block[0].tagName)) {
                while (i < children.length && /^H[1-6]$/.test(children[i].tagName)) {
                    block.push(children[i++]);
                }
                if (i < children.length) block.push(children[i++]);
            }
            blocks.push(block);
        }

        let $shell = null;
        let shellChildren = 0;

        blocks.forEach(block => {
            if (!$shell) {
                $shell = $section.clone().empty();
                $content.append($shell);
            }

            block.forEach(child => $shell.append(child));
            shellChildren += block.length;

            if (overflows()) {
                block.forEach(child => $(child).detach());
                shellChildren -= block.length;

                if (shellChildren === 0) $shell.remove();
                $content = newPage($pages);
                $shell = $section.clone().empty().appendTo($content);
                block.forEach(child => $shell.append(child));
                shellChildren = block.length;
            }
        });

        if (blocks.length === 0) $content.append($section);
    });

    $pages.children('.page').each(function (i) {
        $(this).append('<div class="page-number">' + (i + 1) + '</div>');
    });
}
