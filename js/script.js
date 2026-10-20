// Sayfa oluşturma, gezinme ve kullanıcı ayarlarını kendi modüllerinden al.
import { paginate } from './pagination.js';
import { initializePageNavigation } from './page-navigation.js';
import { initializePageSettings } from './page-settings.js';
import { initializeImageUpload } from './image-upload.js';

const $ = window.jQuery;

$(function () {
    // Sayfalama kaynak içeriği gerektirdiğinden önce içeriği yükle.
    $('#source').load('content/source.html', function (_response, status) {
        if (status === 'error') console.error('content/source.html yüklenemedi.');
        initializeApp();
    });
});

function initializeApp() {
    // İçerik hazır olduğunda ayar ve gezinme olaylarını bağla.
    const refreshPageLayout = initializePageSettings(paginate);
    const navigation = initializePageNavigation();
    initializeImageUpload();

    // Önce sayfaları oluştur; kaydedilmiş konuma dönüş mevcut sayfa elemanlarını gerektirir.
    paginate();
    navigation.restorePage();
    navigation.updateNav();
    const onLoaded = () => {
        // Görseller gibi kaynaklar geç yüklenip ölçüleri değiştirebileceğinden düzeni ve konumu yenile.
        refreshPageLayout();
        navigation.restorePage();
        navigation.updateNav();
    };
    // İçerik pencere load olayından sonra gelmiş olabilir.
    if (document.readyState === 'complete') onLoaded();
    else $(window).on('load', onLoaded);
}
