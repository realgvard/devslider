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
            methods = {},
            publickMethods;

        // Add a reverse reference to the DOM object
        $.data(slider, shortNamespace + 'slider', slider);


        /*------------------------------------*\
          - PRIVATE METHODS -
        \*------------------------------------*/
        methods = {
            init: function() {

                // Get current slide and make sure it is a number
                slider.currentSlide = parseInt(slider.options.startAt ? slider.options.startAt : 0, 10);
                slider.prevItem = slider.currentSlide;

                slider.$slides = $(slider.options.slideSelector, slider);
                slider.count = slider.$slides.length;
                slider.lastItem = slider.count - 1;

                // Bool setting ..
                slider.autoTimeout = null;
                slider.animating = false;

                slider.isPaused = false;
                slider.isStopped = false;
                slider.isPlaying = false;


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

                // Shuffle:
                if (slider.options.shuffle) {
                    slider.$slides.sort(function() { return (Math.round(Math.random()) - 0.5) });
                    slider.empty().append(slider.$slides);
                }

                // Start build shell slider
                methods.shell.wrapup();

                // DirectionNav:
                if (slider.options.directionNav) methods.directionNav.setup();

                // ControlNav:
                if (slider.options.paginationNav) methods.paginationNav.setup();

                // Ken Burn:
                if (slider.options.kenBurn) methods.kenBurn.setup();

                // Append collection build items
                slider.before( slider.$wrapper );
                // Append slider to collection
                slider.$viewport.prepend( slider );
                // End build shell slider

                methods.shell.setup();
                // Set active slide
                slider.setActive();

                // After build slider
                if (slider.options.auto) {
                    methods.autoPlay.start();
                }

                if (slider.options.auto && slider.options.pauseOnHover) {
                    slider.hover(function onMouseEnter() {
                        if (!slider.animating && !slider.isPaused && !slider.isStopped) slider.pause();
                    }, function onMouseLeave() {
                        if (!slider.animating && slider.isPaused && !slider.isStopped) slider.play();
                    });
                }

                console.log(slider);

                slider.$viewport.addClass(shortNamespace + 'slider-initialised');

                // API: After init - Callback
                slider.options.devAfterInit();
            },

            shell: {
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

            autoPlay: {
                spendTime: null,

                startTime: null,

                start: function() {
                    methods.autoPlay.startTime = Date.now();
                    methods.autoPlay.run();
                },

                run: function() {
                    methods.autoPlay.spendTime = Date.now() - methods.autoPlay.startTime;

                    if (slider.options.kenBurn) {
                        methods.kenBurn.update();
                    }

                    if (!slider.isPaused && !slider.isStopped) {
                        if (methods.autoPlay.spendTime <= slider.options.autoDelay) {
                            slider.autoTimeout = requestAnimationFrame(methods.autoPlay.run);
                        } else {
                            slider.animateSlides();
                        }
                    }
                },

                setLastDate: function() {
                    methods.autoPlay.startTime = Date.now() - methods.autoPlay.spendTime;
                    methods.autoPlay.run();
                }
            },

            kenBurn: {
                progress: 0,

                setup: function() {
                    var $elementWrapper = $('<div class="ken-burn-wrapper">' +
                            '<div class="ken-burn-progress"></div>' +
                        '</div>');

                    slider.$kenBurn = $elementWrapper.find('.ken-burn-progress');
                    methods.kenBurn.reset();
                    slider.$viewport.prepend( $elementWrapper );
                },

                update: function() {
                    var maxSize = 100,
                        percent = (methods.autoPlay.spendTime / slider.options.autoDelay) * maxSize;

                    methods.kenBurn.progress = percent.toFixed(2) * 1;
                    slider.$kenBurn.css('width', methods.kenBurn.progress + '%');
                },

                reset: function() {
                    if (methods.kenBurn.progress !== 0) {
                        methods.kenBurn.progress = 0;
                    }
                    slider.$kenBurn.width(0);
                },

                destroy: function() {}
            }
        };

        publickMethods = {
            nextSlide: function() {
                var target = slider.getIndexCalcDir('next');
                slider.animationStore.doAnimation({ currentSlide: target });
            },

            prevSlide: function() {
                var target = slider.getIndexCalcDir('prev');
                slider.animationStore.doAnimation({ currentSlide: target });
            },

            pause: function() {
                slider.isStopped = true;
                slider.pause();

                // API: On stop click - Callback
                slider.options.devOnPause();
            },

            play: function() {
                slider.isStopped = false;
                slider.play();

                // API: On play click - Callback
                slider.options.devOnPlay();
            },

            goToNextSlide: function( index ) {
                if (index !== slider.currentSlide) {
                    slider.animationStore.doAnimation({ currentSlide: index * 1 });
                }
            }
        };

        /*------------------------------------*\
          - PUBLIC METHODS -
        \*------------------------------------*/

        // Group animations in one object
        slider.animationStore = {
            slideSingleItem: function( currentSlide ) {
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
                            slider.off(transitionEnd);

                            slider.animationStore.onEndAnimate();
                        });
                    } else {
                        slider.animate({ 'marginLeft': origin }, slider.options.speed, slider.options.easing, function animationEnd() {
                            slider.animationStore.onEndAnimate();
                        });
                    }
                }
            },

            onEndAnimate: function() {
                slider.animating = false;
                slider.setActive();

                if (slider.options.auto) {
                    methods.autoPlay.start();
                }

                // API: After slide - Callback
                slider.options.devAfterSlide();
            },

            fadeSingleItem: function () {

            },

            // Dispatcher animationLibrary ..
            doAnimation: function(args) {
                if (slider.options.auto) {
                    methods.autoPlay.startTime = null;
                    methods.autoPlay.spendTime = null;
                    cancelAnimationFrame(slider.autoTimeout);
                }

                if (slider.options.kenBurn) {
                    methods.kenBurn.reset();
                }

                if(slider.options.animation === 'slide') {
                    this.slideSingleItem(args.currentSlide);
                } else if (slider.options.animation === 'fade') {
                    this.fadeSingleItem(args.currentSlide);
                }
            }
        };

        slider.setActive = function () {
            methods.shell.setActive();

            if (slider.options.paginationNav) {
                methods.paginationNav.setActive();
            }
        };

        slider.animateSlides = function() {
            var target = slider.getIndexCalcDir('next');
            slider.animationStore.doAnimation({ currentSlide: target });
        };

        slider.pause = function() {
            slider.isPaused = true;

            if (slider.options.auto) {
                cancelAnimationFrame(slider.autoTimeout);
            }

            // console.log('dev: slider.isPaused()');
        };

        slider.play = function() {
            slider.isPaused = false;

            if (slider.options.auto) {
                methods.autoPlay.setLastDate();
            }

            // console.log('dev: slider.play()');
        };

        slider.getIndexCalcDir = function(dir) {
          slider.direction = dir;
          if (dir === 'next') {
            return (slider.currentSlide === slider.lastItem) ? 0 : slider.currentSlide + 1;
          } else {
            return (slider.currentSlide === 0) ? slider.lastItem : slider.currentSlide - 1;
          }
        };

        // Run initializer
        methods.init();

        // Return methods which available user
        return publickMethods;
    }

    $.fn.deviora = function( options ) {
        return this.each(function () {
            if (!$.hasData(this, 'devSliderInit')) {
                $.data(this, {
                    'devSliderInit': true,
                    'devioraSlider': new $.deviora(this, options)
                });
            }
        });
    };

    $.fn.deviora.defaults = {

        // Main dependency
        namespace: 'dev-',                // String, Integer:
        slideSelector: '> li',            // String:
        animation: 'slide',               // String [slide, fade, pretty]:
        easing: 'ease',                   // String:
        speed: 600,                       // Integer [0...]:
        startAt: 0,                       // Integer [0...]:

        // Usability features
        touch: true,                      // Bool: ..
        auto: true,                       // Bool: ..
        kenBurn: false,                   // Bool: Dependency auto()
        autoDelay: 5000,                  // Integer [0...]: ..
        pauseOnHover: false,              // Bool: ..
        shuffle: false,                   // Bool: ..

        // Primary Controls
        directionNav: true,               // Bool: ..
        paginationNav: true,              // Bool: ..
        navigationText: ['Prev', 'Next'], // Array, Bool [false]: ..

        // Callback API
        devBeforeSlide: function() {},    // API: Callback on ..
        devAfterSlide: function() {},     // API: Callback on ..
        devBeforeInit: function() {},     // API: Callback on ..
        devAfterInit: function() {},      // API: Callback on ..
        devOnPause: function() {},        // API: Callback on ..
        devOnPlay: function() {}          // API: Callback on ..
    };

})(jQuery, window, document, undefined);


var slider = $('.my-slider').deviora({
    auto: true,
    kenBurn: true,
    shuffle: false,
    autoDelay: 3500,
    pauseOnHover: true,
    startAt: 0,
    directionNav: true,
    paginationNav: true,
    navigationText: ['prev', 'next'],

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
        console.log('dev: devOnPause() - Callback');
    },

    devOnPlay: function() {
        console.log('dev: devOnPlay() - Callback');
    },

    devAfterInit: function() {
        // console.log('dev: devAfterInit' - Callback);
    }

}).data('devioraSlider');




// API
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

