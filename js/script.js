import { initializeImageUpload } from './image-upload.js';

const $ = window.jQuery;
const API = location.port === '3000' ? '' : 'http://localhost:3000';
let selectionRequest = 0;
let workspaceZoom = 1;

$(function () {
    loadContentFiles();
    initializeImageUpload();
    $('#print').on('click', () => window.print());
    $('#workspace-zoom-out').on('click', () => setWorkspaceZoom(workspaceZoom - 0.1));
    $('#workspace-zoom-in').on('click', () => setWorkspaceZoom(workspaceZoom + 0.1));
    $('#workspace-zoom-reset').on('click', () => setWorkspaceZoom(1));
    $('#drawer-toggle').on('click', function () {
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        $(this).attr('aria-expanded', String(!isExpanded));
        $(this).find('span').text(isExpanded ? 'Menüyü göster' : 'Menüyü gizle');
        $('#drawer').prop('hidden', isExpanded);
        $('#workspace-layout').toggleClass('drawer-closed', isExpanded);
    });
});

function setWorkspaceZoom(zoom) {
    workspaceZoom = Math.min(2, Math.max(0.5, Math.round(zoom * 10) / 10));
    document.getElementById('workspace-layout').style.zoom = String(workspaceZoom);
    $('#workspace-zoom-level').text(`${Math.round(workspaceZoom * 100)}%`);
    $('#workspace-zoom-out').prop('disabled', workspaceZoom <= 0.5);
    $('#workspace-zoom-in').prop('disabled', workspaceZoom >= 2);
    $('#workspace-zoom-reset').prop('disabled', workspaceZoom === 1);
}

async function loadContentFiles() {
    const $list = $('#content-list').empty();
    const $status = $('#drawer-status').prop('hidden', false).text('Dosyalar yükleniyor...');

    try {
        const response = await fetch(API + '/api/content');
        if (!response.ok) throw new Error('Dosya listesi sunucudan alınamadı.');
        const files = await response.json();
        if (!Array.isArray(files) || !files.every(file =>
            typeof file.filename === 'string' && typeof file.titleHtml === 'string')) {
            throw new Error('Sunucudan geçersiz dosya listesi alındı.');
        }

        if (!files.length) {
            $status.text('Content klasöründe HTML dosyası bulunamadı.');
            return;
        }

        $status.empty().prop('hidden', true);
        files.forEach((file, index) => {
            const { filename } = file;
            const title = new DOMParser()
                .parseFromString(file.titleHtml, 'text/html')
                .body.textContent.trim() || filename;
            const $button = $('<button type="button" class="drawer-file nav-link"><i class="bi bi-file-earmark-text" aria-hidden="true"></i><span></span></button>');
            $button.find('span').text(title);
            $button.attr('title', title);
            $button.on('click', () => loadContentFile(filename, $button));
            $list.append($('<li class="nav-item"></li>').append($button));
            if (index === 0) loadContentFile(filename, $button);
        });
    } catch (error) {
        $status.text(error.message === 'Failed to fetch'
            ? 'Sunucuya ulaşılamadı. Sunucunun çalıştığını kontrol edin.'
            : error.message);
    }
}

async function loadContentFile(filename, $button) {
    const request = ++selectionRequest;
    $('#content-list .drawer-file').removeAttr('aria-current');
    $button.attr('aria-current', 'page');
    $('#content').empty().attr('aria-busy', 'true');

    try {
        const response = await fetch(API + '/api/content/' + encodeURIComponent(filename));
        if (!response.ok) throw new Error('Dosya sunucudan yüklenemedi.');
        const file = await response.json();
        if (typeof file.content !== 'string') throw new Error('Sunucudan geçersiz dosya içeriği alındı.');
        if (request !== selectionRequest) return;
        $('#content').html(file.content);
    } catch (error) {
        if (request !== selectionRequest) return;
        $('#content').text(error.message === 'Failed to fetch'
            ? 'Sunucuya ulaşılamadı. Sunucunun çalıştığını kontrol edin.'
            : error.message);
    } finally {
        if (request === selectionRequest) $('#content').removeAttr('aria-busy');
    }
}
