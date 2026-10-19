// Sayfa oluşturma, gezinme ve kullanıcı ayarlarını kendi modüllerinden al.
import { paginate } from './pagination.js';
import { initializePageNavigation } from './page-navigation.js';
import { initializePageSettings } from './page-settings.js';

const $ = window.jQuery;

$(function () {
    // DOM hazır olduğunda ayar ve gezinme olaylarını bağla.
    const refreshPageLayout = initializePageSettings(paginate);
    const navigation = initializePageNavigation();

    // Önce sayfaları oluştur; kaydedilmiş konuma dönüş mevcut sayfa elemanlarını gerektirir.
    paginate();
    navigation.restorePage();
    navigation.updateNav();
    $(window).on('load', () => {
        // Görseller gibi kaynaklar geç yüklenip ölçüleri değiştirebileceğinden düzeni ve konumu yenile.
        refreshPageLayout();
        navigation.restorePage();
        navigation.updateNav();
    });
});
