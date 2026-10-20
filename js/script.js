import { initializeImageUpload } from './image-upload.js';

const API = location.port === '3000' ? '' : 'http://localhost:3000';
let selectionRequest = 0;
let workspaceZoom = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadContentFiles();
    initializeImageUpload();
    document.getElementById('print').addEventListener('click', () => window.print());
    document.getElementById('workspace-zoom-out').addEventListener('click', () => setWorkspaceZoom(workspaceZoom - 0.1));
    document.getElementById('workspace-zoom-in').addEventListener('click', () => setWorkspaceZoom(workspaceZoom + 0.1));
    document.getElementById('workspace-zoom-reset').addEventListener('click', () => setWorkspaceZoom(1));
    document.getElementById('drawer-toggle').addEventListener('click', (event) => {
        const isExpanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
        setDrawerOpen(!isExpanded);
    });
    setWorkspaceZoom(Number(readStore('zoom')) || 1);
    setDrawerOpen(readStore('drawerOpen') !== 'false', false);
});

function readStore(key) {
    try { return localStorage.getItem('defter.' + key); } catch { return null; }
}

function writeStore(key, value) {
    try { localStorage.setItem('defter.' + key, String(value)); } catch { /* ignore */ }
}

function setDrawerOpen(open, persist = true) {
    const button = document.getElementById('drawer-toggle');
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('span').textContent = open ? 'Menüyü gizle' : 'Menüyü göster';
    document.getElementById('drawer').hidden = !open;
    document.getElementById('workspace-layout').classList.toggle('drawer-closed', !open);
    if (persist) writeStore('drawerOpen', open);
}

function setWorkspaceZoom(zoom) {
    workspaceZoom = Math.min(2, Math.max(0.5, Math.round(zoom * 10) / 10));
    writeStore('zoom', workspaceZoom);
    document.getElementById('workspace-layout').style.zoom = String(workspaceZoom);
    document.getElementById('workspace-zoom-level').textContent = `${Math.round(workspaceZoom * 100)}%`;
    document.getElementById('workspace-zoom-out').disabled = workspaceZoom <= 0.5;
    document.getElementById('workspace-zoom-in').disabled = workspaceZoom >= 2;
    document.getElementById('workspace-zoom-reset').disabled = workspaceZoom === 1;
}

async function loadContentFiles() {
    const list = document.getElementById('content-list');
    const status = document.getElementById('drawer-status');
    list.replaceChildren();
    status.hidden = false;
    status.textContent = 'Dosyalar yükleniyor...';

    try {
        const response = await fetch(API + '/api/content');
        if (!response.ok) throw new Error('Dosya listesi sunucudan alınamadı.');
        const files = await response.json();
        if (!Array.isArray(files) || !files.every(file =>
            typeof file.filename === 'string' && typeof file.titleHtml === 'string')) {
            throw new Error('Sunucudan geçersiz dosya listesi alındı.');
        }

        if (!files.length) {
            status.textContent = 'Content klasöründe HTML dosyası bulunamadı.';
            return;
        }

        status.replaceChildren();
        status.hidden = true;
        const savedFilename = readStore('file');
        const initialIndex = Math.max(0, files.findIndex(file => file.filename === savedFilename));
        files.forEach((file, index) => {
            const { filename } = file;
            const title = new DOMParser()
                .parseFromString(file.titleHtml, 'text/html')
                .body.textContent.trim() || filename;
            const item = document.createElement('li');
            item.className = 'nav-item';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'drawer-file nav-link';
            button.title = title;
            button.innerHTML = '<i class="bi bi-file-earmark-text" aria-hidden="true"></i><span></span>';
            button.querySelector('span').textContent = title;
            button.addEventListener('click', () => loadContentFile(filename, button));
            item.append(button);
            list.append(item);
            if (index === initialIndex) loadContentFile(filename, button);
        });
    } catch (error) {
        status.textContent = error.message === 'Failed to fetch'
            ? 'Sunucuya ulaşılamadı. Sunucunun çalıştığını kontrol edin.'
            : error.message;
    }
}

async function loadContentFile(filename, button) {
    const request = ++selectionRequest;
    writeStore('file', filename);
    document.querySelectorAll('#content-list .drawer-file').forEach(fileButton => fileButton.removeAttribute('aria-current'));
    button.setAttribute('aria-current', 'page');
    const content = document.getElementById('content');
    content.replaceChildren();
    content.setAttribute('aria-busy', 'true');

    try {
        const response = await fetch(API + '/api/content/' + encodeURIComponent(filename));
        if (!response.ok) throw new Error('Dosya sunucudan yüklenemedi.');
        const file = await response.json();
        if (typeof file.content !== 'string') throw new Error('Sunucudan geçersiz dosya içeriği alındı.');
        if (request !== selectionRequest) return;
        content.innerHTML = file.content;
    } catch (error) {
        if (request !== selectionRequest) return;
        content.textContent = error.message === 'Failed to fetch'
            ? 'Sunucuya ulaşılamadı. Sunucunun çalıştığını kontrol edin.'
            : error.message;
    } finally {
        if (request === selectionRequest) content.removeAttribute('aria-busy');
    }
}
