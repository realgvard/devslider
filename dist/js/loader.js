

var slider = $('.fullSizeSlider').deviora({
    fullScreenOffsetY: $('.ui-header-block'),
    devBeforeInit: function() {
        $('.fullSizeSlider').css('opacity', 0);
    },
    devAfterInit: function() {
        $('.fullSizeSlider').animate({ 'opacity': 1 }, 1200);
    }
});
