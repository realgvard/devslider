var slider = $('.my-slider').deviora({
    auto: false,
    kenBurn: true,
    animation: 'slide',
    kenBurnType: 'bar',
    // easing: 'ease',
    shuffle: false,
    autoDelay: 3500,
    speed: 1000,
    pauseOnHover: true,

    fullScreen: true,
    responsive: true,
    minFullScreenHeight: 350,
    fullScreenOffsetY: $('.my-header'),

    smoothHeight: false,
    smoothHeightSpeed: 400,
    // startHeight: 400,

    startAt: 0,
    directionNav: true,
    paginationNav: true,
    preloadImages: 'visible',
    navigationText: ['Prev', 'Next'],

    devBeforeSlide: function () {
        //console.log('dev: devBeforeSlide() - Callback');
    },

    devAfterSlide: function () {
        //console.log('dev: devAfterSlide() - Callback');
    },

    devBeforeInit: function() {
        // console.log('dev: devBeforeSlide() - Callback');
    },

    devOnPause: function() {
        // console.log('dev: devOnPause() - Callback');
    },

    devOnPlay: function() {
        // console.log('dev: devOnPlay() - Callback');
    },

    devAfterInit: function() {
        // console.log('dev: devAfterInit' - Callback);
    }

}).data('devioraSlider');



/*------------------------------------*\
    # API
\*------------------------------------*/

$('#nextTo').click(function () {
    slider.nextSlide();
    return false;
});

$('#prevTo').click(function () {
    slider.prevSlide();
    return false;
});

$('#pause').click(function () {
    slider.pause();
    // console.log(slider.getCurrentIndex());
    // console.log(slider.getSlidesCount());
    return false;
});

$('#play').click(function () {
    slider.play();
    return false;
});

$('#goToSlide').click(function () {
    var val = $('#valueGoToSlide').val();
    slider.goToNextSlide(val);
    return false;
});