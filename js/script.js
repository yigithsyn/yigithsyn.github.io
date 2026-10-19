import { paginate } from './pagination.js';
import { initializePageNavigation } from './page-navigation.js';
import { initializePageSettings } from './page-settings.js';

const $ = window.jQuery;

$(function () {
    initializePageSettings(paginate);
    const navigation = initializePageNavigation();

    paginate();
    navigation.restorePage();
    navigation.updateNav();
    $(window).on('load', () => {
        navigation.restorePage();
        navigation.updateNav();
    });
});
