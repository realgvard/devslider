/**
 * Deviora slider
 */


;(function ( $, window, document, undefined ) {
    $.deviora = function( element, options ) {
        var slider = $(element);

        // Make public options
        slider.options =  $.extend( {}, $.fn.deviora.defaults, options );
        slider.userOptions = options;

        // Deviora: default slider.options
        var version = '1.0.0',
            namespace = slider.options.namespace,
            shortNamespace = namespace.replace(/[-|\s]+$/g, ''),
            eventType = "click touchend MSPointerUp keyup",
            msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
            touch = (( "ontouchstart" in window ) || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && slider.vars.touch,
            methods = {};

        // Add a reverse reference to the DOM object
        $.data(slider, shortNamespace + 'slider', slider);

        // Default collections methods slider.
        methods = {
            init: function() {

                // Get current slide and make sure it is a number
                slider.currentSlide = parseInt(slider.options.startAt ? slider.options.startAt : 0, 10);
                if ( isNaN( slider.currentSlide ) ) { slider.currentSlide = 0; }
                slider.prevItem = slider.currentSlide;

                // slider.containerSelector = slider.options.slideSelector.substr(0, slider.options.slideSelector.search(' '));
                slider.$slides = $(slider.options.slideSelector, slider);
                slider.count = slider.$slides.length;
                slider.lastItem = slider.count - 1;
                slider.startTimeout = null;
                slider.animating = false;


                // Touch / UseCSS:
                slider.transitions = (function() {
                    var supportedProp,
                        div = document.createElement('div'),
                        prop = 'Transition',
                        prefixes = ['Moz', 'Webkit', 'o', 'MS'];

                    if (prop.toLowerCase() in div.style) {
                        return true;
                    }

                    for ( var i = 0; i < prefixes.length; i++ ) {
                        if ((prefixes[i] + prop) in div.style) {
                            // slider.pfx = '-' + prefixes[i].toLowerCase() + '-';
                            slider.pfx = prefixes[i];
                            supportedProp = prop;

                            break;
                        }
                    }

                    // Avoid memory leak in IE
                    div = null;

                    if (supportedProp) {
                        return true;
                    } else {
                        return false;
                    }
                })();

                // API: Before init - Callback
                slider.options.devBeforeInit();

                // Start build shell slider
                slider.shell.wrapup();

                // DirectionNav:
                if (slider.options.directionNav) methods.directionNav.setup();

                // ControlNav:
                if (slider.options.paginationNav) methods.paginationNav.setup();

                // Append collection build items
                slider.before( slider.$wrapper );
                // Append slider to collection
                slider.$viewport.append( slider );
                // End build shell slider

                slider.shell.setup();
                // Set active slide
                slider.setActive();

                console.log(slider);

                slider.$viewport.addClass(shortNamespace + 'slider-initialised');

                // API: After init - Callback
                slider.options.devAfterInit();
            },

            directionNav: {
                setup: function() {
                    var $directionNavScaffold =
                        $('<ul class="' + namespace + 'direction-nav">' +
                            '<li class="' + namespace + 'nav-prev">' +
                                '<a class="' + namespace + 'prev" href="#">' +
                                    (slider.options.navigationText[0] || '') +
                                '</a>' +
                            '</li>' +
                            '<li class="' + namespace + 'nav-next">' +
                                '<a class="' + namespace + 'next" href="#">' +
                                    (slider.options.navigationText[1] || '') +
                                '</a>' +
                            '</li>' +
                        '</ul>');

                    slider.$wrapper.append( $directionNavScaffold );
                    slider.$directionNav = $('.' + namespace + 'direction-nav li a', slider.$wrapper);

                    slider.$directionNav.on(eventType, function( event ) {
                        event.preventDefault();
                        var target;

                        target = ( $(this).hasClass(namespace + 'prev') ) ? slider.getIndexCalcDir('prev') : slider.getIndexCalcDir('next');

                        slider.animationStore.doAnimation({currentSlide: target});
                    });


                },
                update: function() {


                }
            },

            paginationNav: {
                setup: function() {
                    var $controlPagScaffold = $('<ol class="' + namespace + 'pagination-nav"></ol>');

                    if (slider.count > 1) {
                        for (var i = 0, len = slider.count; i < len; i++) {
                            var $pagItem = $('<li>', {
                                'class': namespace + 'bullet',
                                'html': function() {
                                    var $pagButton = $('<a href="#">' + i + '</a>');
                                    $pagButton.data(namespace + 'bullet', i);
                                    return $pagButton;
                                }
                            });

                            $controlPagScaffold.append( $pagItem );
                        }
                    }

                    // Append all items
                    slider.$paginationNav = $controlPagScaffold;

                    slider.$paginationNav.on(eventType, 'a', function( event ) {
                        event.preventDefault();
                        var $this = $(this),
                            target = $this.data(namespace + 'bullet');

                        if(target != slider.currentSlide) {
                            slider.animationStore.doAnimation({currentSlide: target});
                        }
                    });

                    slider.$wrapper.append( slider.$paginationNav );
                },

                update: function() {
                    for (var i = 0, len = slider.count; i < len; i++) {
                        $('.' + namespace + 'pagination-nav li a', slider.$wrapper).data(namespace + 'bullet', i);
                    }
                },

                setActive: function() {
                    if (slider.prevItem != slider.currentSlide) {
                        slider.$paginationNav.children().eq(slider.prevItem).removeClass(namespace + 'active');
                    }
                    slider.$paginationNav.children().eq(slider.currentSlide).addClass(namespace + 'active');
                }
            },

            next: function() {},
            prev: function() {},
            update: function() {}
        };

        /*------------------------------------*\
          - METHODS -
        \*------------------------------------*/
        slider.shell = {
            // Setup default styles
            setup: function() {
                //slider.addClass(namespace + 'slides');

                $(slider.options.slideSelector, slider)
                    .css({
                        'float': 'left',
                        'width': slider.width(),
                        'display': 'block'
                    });

                slider.css({
                    'width': (100 * slider.count) + '%'
                });
            },

            // Build our slider with HTML
            wrapup: function() {
                slider.$wrapper =
                    $('<div class="' + namespace + 'wrapper"></div>');
                slider.$viewport =
                    $('<div class="' + namespace + 'viewport"></div>');

                // Set private context
                slider.$viewport.css({
                    'overflow': 'hidden',
                    'position': 'relative'
                });

                slider.$wrapper.append( slider.$viewport );
            },

            setActive: function () {
                if (slider.prevItem != slider.currentSlide) {
                    $(slider.options.slideSelector, slider).eq(slider.prevItem).removeClass(namespace + 'active-slide');
                }
                $(slider.options.slideSelector, slider).eq(slider.currentSlide).addClass(namespace + 'active-slide');
            }
        };

        // Group animations in one object
        slider.animationStore = {
            slideSingleItem: function(currentSlide) {
                var widthViewport = slider.width() / slider.count,
                    origin = -(widthViewport * currentSlide) + 'px';

                if (slider.animating === false) {
                    // API: Before slide - Callback
                    slider.options.devBeforeSlide();

                    slider.prevItem = slider.currentSlide;
                    slider.currentSlide = currentSlide;
                    slider.animating = true;

                    if (slider.transitions) {
                        var pfxCSS3 = (slider.pfx) ? '-' + slider.pfx.toLowerCase() + '-' : '',
                            CSS3Transition = 'transition',
                            CSS3Transform = pfxCSS3 + 'transform',
                            transitionEnd = (slider.pfx) ? slider.pfx + 'TransitionEnd' : 'transitionend';

                        slider.css(CSS3Transition, 'transform ' + slider.options.speed + 'ms');
                        slider.css(CSS3Transform, 'translate3d(' + origin + ', 0, 0)');

                        slider.on(transitionEnd, function() {
                            //console.log('end');
                            slider.setActive();
                            slider.animating = false;
                            slider.off(transitionEnd);

                            // API: After slide - Callback
                            slider.options.devAfterSlide();
                        });
                    } else {
                        slider.animate({ 'marginLeft': origin }, slider.options.speed, slider.easing, function animationEnd() {
                            //console.log('end');
                            slider.setActive();
                            slider.animating = false;

                            // API: After slide - Callback
                            slider.options.devAfterSlide();
                        });
                    }
                }
            },

            fadeSingleItem: function () {

            },

            // Dispatcher animationLibrary ..
            doAnimation: function(args) {
                if(slider.options.animation === 'slide') {
                    this.slideSingleItem(args.currentSlide);
                } else if (slider.options.animation === 'fade') {
                    this.fadeSingleItem(args.currentSlide);
                }
            }
        };

        slider.getIndexCalcDir = function(dir) {
          slider.direction = dir;
          if (dir === 'next') {
            return (slider.currentSlide === slider.lastItem) ? 0 : slider.currentSlide + 1;
          } else {
            return (slider.currentSlide === 0) ? slider.lastItem : slider.currentSlide - 1;
          }
        };

        slider.setActive = function () {
            slider.shell.setActive();

            if (slider.options.paginationNav) {
                methods.paginationNav.setActive();
            }
        };

        slider.publickMethods = {
            nextSlide: function() {
                var target = slider.getIndexCalcDir('next');
                slider.animationStore.doAnimation({currentSlide: target});
            },
            prevSlide: function() {
                var target = slider.getIndexCalcDir('prev');
                slider.animationStore.doAnimation({currentSlide: target});
            }
        };

        // Run initializer
        methods.init();

        // Return methods which available user
        return slider.publickMethods;
    }

    $.fn.deviora = function( options ) {
        return this.each(function () {
            if (!$.hasData(this, "dev-slider-init")) {
                $.data(this, 'dev-slider-init', true);

                $.data(this, "devioraSlider", new $.deviora(this, options));
            }
        });
    };

    $.fn.deviora.defaults = {
        namespace: 'dev-',                // Support type: String, Integer
        slideSelector: '> li',            // Support type: String
        animation: 'slide',               // Support type: String [slide, fade, pretty]
        easing: 'ease',                   // Support type: String
        delay: 5000,                      // Support type: Integer [0...]
        speed: 600,                       // Support type: Integer [0...]
        startAt: 0,                       // Support type: Integer [0...]

        // Usability features
        touch: true,                      // Support type: Bool [true, false]

        // Primary Controls
        directionNav: true,               // Support type: Bool [true, false]
        paginationNav: true,              // Support type: Bool [true, false]
        navigationText: ['Prev', 'Next'], // Support type: Array, Bool [false]

        // Callback API
        devBeforeSlide: function() {},    // API: Callback
        devAfterSlide: function() {},     // API: Callback
        devBeforeInit: function() {},     // API: Callback
        devAfterInit: function() {}       // API: Callback
    };

})(jQuery, window, document, undefined);


var slider = $('.my-slider').deviora({
    delay: 8000,
    startAt: 0,
    directionNav: true,
    paginationNav: true,
    navigationText: ['prev', 'next'],

    devBeforeSlide: function () {
        //console.info('devBeforeSlide');
    },

    devAfterSlide: function () {
        //console.info('devAfterSlide');
    },

    devBeforeInit: function() {
        // console.info('devBeforeSlide');
    },

    devAfterInit: function() {
        // console.info('devAfterInit');
    }
}).data('devioraSlider');

console.log( slider );

$('#nextTo').click(function () {
    slider.nextSlide();
    return false;
})

$('#prevTo').click(function () {
    slider.prevSlide();
    return false;
})