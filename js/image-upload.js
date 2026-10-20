// Sayfa API sunucusundan farklı bir kaynaktan açılırsa (file:, Live Server vb.) sunucu adresine git.
const API = location.port === '3000' ? '' : 'http://localhost:3000';
const MAX_IMAGE_SIZE = 30 * 1024 * 1024;

function toast(message, isError) {
    const el = document.createElement('div');
    el.className = 'upload-toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    el.classList.toggle('error', !!isError);
    document.body.append(el);
    setTimeout(() => el.remove(), 3000);
}

const formatSize = (bytes) => bytes < 1048576 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';

async function loadList() {
    const list = document.getElementById('upload-list');
    list.replaceChildren();
    try {
        const res = await fetch(API + '/api/uploads');
        if (!res.ok) throw new Error();
        const rows = await res.json();
        document.getElementById('upload-empty').hidden = rows.length > 0;
        const preview = document.querySelector('#upload-preview img');
        preview.hidden = true;
        const select = (item, row) => {
            list.querySelectorAll('.selected').forEach(selected => selected.classList.remove('selected'));
            item.classList.add('selected');
            preview.src = API + '/' + row.path;
            preview.alt = row.original_name;
            preview.hidden = false;
        };
        rows.forEach(row => {
            const item = document.createElement('li');
            item.tabIndex = 0;
            item.innerHTML = '<span class="info"><span class="name"></span><small class="meta text-muted"></small></span>' +
                '<span class="actions"><button type="button" class="btn-outline btn-sm theme-secondary copy-path" title="Yolu kopyala" aria-label="Yolu kopyala">⧉</button>' +
                '<button type="button" class="btn-outline btn-sm theme-secondary delete-row" title="Kaydı sil" aria-label="Kaydı sil"><i class="bi bi-trash3" aria-hidden="true"></i></button></span>';
            const name = item.querySelector('.name');
            name.textContent = row.original_name;
            name.title = row.original_name;
            item.querySelector('.meta').textContent = formatSize(row.size) + ' · ' + new Date(row.uploaded_at).toLocaleString();
            const selectItem = (event) => {
                if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
                if (event.target.closest('.actions')) return;
                if (event.type === 'keydown') event.preventDefault();
                select(item, row);
            };
            item.addEventListener('click', selectItem);
            item.addEventListener('keydown', selectItem);
            item.querySelector('.copy-path').addEventListener('click', async () => {
                const path = (API || location.origin) + '/' + row.path;
                try {
                    await navigator.clipboard.writeText(path);
                    toast('Yol kopyalandı: ' + path);
                } catch {
                    toast('Kopyalanamadı.', true);
                }
            });
            item.querySelector('.delete-row').addEventListener('click', async () => {
                if (!confirm(`"${row.original_name}" kaydı silinsin mi? Dosya diskte kalacak.`)) return;
                try {
                    const res = await fetch(API + '/api/uploads/' + encodeURIComponent(row.id), { method: 'DELETE' });
                    if (!res.ok && res.status !== 404) throw new Error();
                    await loadList();
                } catch {
                    toast('Kayıt silinemedi.', true);
                }
            });
            list.append(item);
        });
        if (rows.length) select(list.firstElementChild, rows[0]);
    } catch {
        document.getElementById('upload-empty').hidden = true;
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

    document.getElementById('upload-add').addEventListener('click', () => input.click());
    document.getElementById('upload-show').addEventListener('click', () => {
        dialog.showModal();
        loadList();
    });
    document.getElementById('upload-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

    input.addEventListener('change', async () => {
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
