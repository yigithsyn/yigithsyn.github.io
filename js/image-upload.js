const $ = window.jQuery;

// Sayfa API sunucusundan farklı bir kaynaktan açılırsa (file:, Live Server vb.) sunucu adresine git.
const API = location.port === '3000' ? '' : 'http://localhost:3000';

function toast(message, isError) {
    const el = $('<div class="upload-toast" role="status"></div>').text(message).toggleClass('error', !!isError);
    $('body').append(el);
    setTimeout(() => el.remove(), 3000);
}

const formatSize = (bytes) => bytes < 1048576 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';

async function loadList() {
    const $list = $('#upload-list').empty();
    try {
        const res = await fetch(API + '/api/uploads');
        if (!res.ok) throw new Error();
        const rows = await res.json();
        $('#upload-empty').prop('hidden', rows.length > 0);
        rows.forEach(row => {
            const $item = $('<li><img loading="lazy" alt=""><small class="name"></small><small class="meta text-muted"></small></li>');
            $item.find('img').attr({ src: API + '/' + row.path, alt: row.original_name });
            $item.find('.name').text(row.original_name).attr('title', row.original_name);
            $item.find('.meta').text(formatSize(row.size) + ' · ' + new Date(row.uploaded_at).toLocaleString());
            $list.append($item);
        });
    } catch {
        $('#upload-empty').prop('hidden', true);
        toast('Liste alınamadı.', true);
    }
}

async function uploadFile(file) {
    const body = new FormData();
    // Alanlar dosyadan önce gelmeli ki sunucu dosyayı işlerken erişebilsin.
    body.append('lastModified', file.lastModified);
    body.append('image', file);
    const res = await fetch(API + '/api/upload', { method: 'POST', body });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Yükleme başarısız.');
    }
}

export function initializeImageUpload() {
    const dialog = document.getElementById('upload-dialog');
    const input = document.getElementById('upload-input');

    $('#upload-add').on('click', () => input.click());
    $('#upload-show').on('click', () => {
        dialog.showModal();
        loadList();
    });
    $('#upload-close').on('click', () => dialog.close());
    $(dialog).on('click', (e) => { if (e.target === dialog) dialog.close(); });

    $(input).on('change', async () => {
        const files = [...input.files];
        input.value = '';
        let ok = 0;
        for (const file of files) {
            try {
                await uploadFile(file);
                ok++;
            } catch (err) {
                toast(`${file.name}: ${err.message === 'Failed to fetch' ? 'Sunucuya ulaşılamadı.' : err.message}`, true);
            }
        }
        if (ok) toast(ok + ' görsel yüklendi.');
        if (dialog.open) loadList();
    });
}
