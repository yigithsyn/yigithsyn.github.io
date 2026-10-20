const $ = window.jQuery;

// Sayfa API sunucusundan farklı bir kaynaktan açılırsa (file:, Live Server vb.) sunucu adresine git.
const API = location.port === '3000' ? '' : 'http://localhost:3000';
const MAX_IMAGE_SIZE = 30 * 1024 * 1024;

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
        const $preview = $('#upload-preview img').prop('hidden', true);
        const select = ($item, row) => {
            $list.children().removeClass('selected');
            $item.addClass('selected');
            $preview.attr({ src: API + '/' + row.path, alt: row.original_name }).prop('hidden', false);
        };
        rows.forEach(row => {
            const $item = $('<li tabindex="0"><span class="info"><span class="name"></span><small class="meta text-muted"></small></span>' +
                '<span class="actions"><button type="button" class="btn-outline btn-sm theme-secondary copy-path" title="Yolu kopyala" aria-label="Yolu kopyala">⧉</button>' +
                '<button type="button" class="btn-outline btn-sm theme-secondary delete-row" title="Kaydı sil" aria-label="Kaydı sil">🗑</button></span></li>');
            $item.find('.name').text(row.original_name).attr('title', row.original_name);
            $item.find('.meta').text(formatSize(row.size) + ' · ' + new Date(row.uploaded_at).toLocaleString());
            $item.on('click keydown', (e) => {
                if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
                if ($(e.target).closest('.actions').length) return;
                e.preventDefault();
                select($item, row);
            });
            $item.find('.copy-path').on('click', async () => {
                const path = (API || location.origin) + '/' + row.path;
                try {
                    await navigator.clipboard.writeText(path);
                    toast('Yol kopyalandı: ' + path);
                } catch {
                    toast('Kopyalanamadı.', true);
                }
            });
            $item.find('.delete-row').on('click', async () => {
                if (!confirm(`"${row.original_name}" kaydı silinsin mi? Dosya diskte kalacak.`)) return;
                try {
                    const res = await fetch(API + '/api/uploads/' + encodeURIComponent(row.id), { method: 'DELETE' });
                    if (!res.ok && res.status !== 404) throw new Error();
                    loadList();
                } catch {
                    toast('Kayıt silinemedi.', true);
                }
            });
            $list.append($item);
        });
        if (rows.length) select($list.children().first(), rows[0]);
    } catch {
        $('#upload-empty').prop('hidden', true);
        toast('Liste alınamadı.', true);
    }
}

async function uploadFile(file) {
    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error('Dosya boyutu 30 MB sınırını aşıyor.');
    }

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
