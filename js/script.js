import { initializeImageUpload } from './image-upload.js';

const $ = window.jQuery;

$(function () {
    $('#content').load('content/source.html', function (_response, status) {
        if (status === 'error') console.error('content/source.html yüklenemedi.');
    });
    initializeImageUpload();
    $('#print').on('click', () => window.print());
});
