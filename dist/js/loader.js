var slider = $('.fullSizeSlider').deviora({

    // Most important dev features
    namespace: 'dev-',                // String, Integer:
    slideSelector: '> li',            // String:
    animation: 'random',               // String: [slide, fade, random]: ..
    // TODO: Make CSS3 ease with callback css2.
    css3easing: 'ease',                  // String:
    speed: 600,                       // Integer: [0...]:
    preloadImages: 'visible',         // String: visible, all, false

    // Mouse Events
    touch: true,                      // Bool: ..

    // Full Screen
    fullScreen: true,                // Bool: ..
    fullScreenOffsetY: $('.ui-header-block'),             // [jQuery Obj, Int, String]: ..
    minFullScreenHeight: 0,           // [Int, String]: ..

    // Keyboard Navigation
    keyboardControl: true,

    // Auto Play
    auto: true,                       // Bool: ..
    autoControls: true,               // Bool: ..
    autoDelay: 5000,                  // Integer [0...]: ..
    pauseOnHover: true,              // Bool: ..

    // Pagination
    directionNav: true,               // Bool: ..

    // Navigation
    paginationNav: true,              // Bool: ..
    navigationText: ['Prev', 'Next'], // Array, Bool [false]: ..

    // Keyboard
    keyboardNavigation: true,         // Bool: ..

    // Ken Burn
    kenBurn: true,                   // Bool: Dependency auto()
    kenBurnType: 'bar',               // String: [bar, circle]

    // Usability Features
    shuffle: false,                   // Bool: ..
    startAt: 0,                       // Integer [0...]:
    smoothHeight: false,              // Bool: ..
    smoothHeightSpeed: 0,             // [Bool, Int]: ..
    startHeight: 0,                   // [jQuery Obj, Int, String]: ..
    responsive: true,                // Bool: ..

    // Preloader
    preloader: null,                  // [jQuery Obj, null]

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
    console.log(slider.getCurrentIndex());
    console.log(slider.getSlidesCount());
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