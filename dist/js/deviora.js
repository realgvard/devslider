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
            // msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
            // touch = (( "ontouchstart" in window ) || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && slider.vars.touch,
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
                slider.cloneCount = 0;

                if (slider.options.animation === 'slide') {
                    slider.cloneCount = 2;  // Add clone childs
                }

                if(!!slider.options.preloadImages) {
                    slider.$preloader = $('<div class="' + namespace + 'preloader"></div>');
                }

                // Bool setting ..
                slider.initialized = false;
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

                var preloadElements;
                if(!!slider.options.preloadImages) {
                    if (slider.options.preloadImages === 'visible') {
                        preloadElements = slider.$slides.eq(slider.currentSlide);
                    }
                    if (slider.options.preloadImages === 'all') {
                        preloadElements = slider.$slides;

                    }
                }

                // Append collection build items
                slider.before( slider.$wrapper );
                // Append slider to collection
                slider.$viewport.prepend( slider );
                // End build shell slider

                methods.shell.setup();
                // Set active slide
                slider.setActive();
                methods.shell.setStartSlide( slider.currentSlide );

                // define load images
                if(!!slider.options.preloadImages) {
                    methods.loadElements(preloadElements, methods.start);
                } else {
                    methods.start();
                    console.log('yes');
                }
            },

            start: function() {
                if(!!slider.options.preloadImages) {
                    slider.$preloader.remove();
                }

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

                slider.$viewport.addClass(shortNamespace + 'slider-initialised');

                // API: After init - Callback
                slider.options.devAfterInit();
                slider.initialized = true;
            },

            shell: {
                // Setup default styles
                setup: function() {
                    if (slider.options.animation === 'slide') {
                        slider.append( slider.$slides.first().clone(true).addClass('clone').attr('aria-hidden', 'true') )
                            .prepend( slider.$slides.last().clone(true).addClass('clone').attr('aria-hidden', 'true') );
                    }

                    $(slider.options.slideSelector, slider)
                        .css({
                            'float': 'left',
                            'width': slider.$wrapper.width(),
                            'display': 'block'
                        });

                    slider.css({
                        'width': (100 * (slider.count + slider.cloneCount)) + '%'
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

                    // Append preloader
                    if(!!slider.options.preloadImages) {
                        slider.$viewport.append( slider.$preloader );
                    }

                    slider.$wrapper.append( slider.$viewport );
                },

                setStartSlide: function( index ) {
                    var widthViewport = slider.width() / (slider.count + slider.cloneCount),
                        origin = -(widthViewport * (index + (slider.cloneCount / 2))) + 'px';

                    if (slider.transitions) {
                        var pfxCSS3 = (slider.pfx) ? '-' + slider.pfx.toLowerCase() + '-' : '',
                            CSS3Transition = 'transition',
                            CSS3Transform = pfxCSS3 + 'transform';

                        slider.css(CSS3Transition, '');
                        slider.css(CSS3Transform, 'translate3d(' + origin + ', 0, 0)');
                    } else {
                        slider.css('marginLeft', origin);
                    }
                },

                setActive: function() {
                    if (slider.prevItem != slider.currentSlide) {
                        $(slider.options.slideSelector, slider).eq(slider.prevItem + slider.cloneCount / 2).removeClass(namespace + 'active-slide');
                    }
                    $(slider.options.slideSelector, slider).eq(slider.currentSlide + slider.cloneCount / 2).addClass(namespace + 'active-slide');
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

                        slider.animationStore.execute({currentSlide: target});
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
                            slider.direction = null;
                            slider.animationStore.execute({currentSlide: target});
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
                    var $elementWrapper = $('<div class="' + namespace + 'ken-burn-wrapper">' +
                            '<div class="' + namespace + 'ken-burn-progress"></div>' +
                        '</div>');

                    slider.$kenBurn = $elementWrapper.find('.' + namespace + 'ken-burn-progress');
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
            },

            loadElements: function(elements, callback){
                var total = slider.find(elements).length,
                    count = 0;

                if (total === 0){
                    callback();
                    return;
                }

                window.addEventListener('error', onErrorEvent, true);

                elements.find('img, ifram').each(function() {
                    $(this).one('load', function() {
                        count += 1;

                        if(count === total) {
                            window.removeEventListener('error', onErrorEvent, true);
                            callback();
                        }
                    }).each(function() {
                        if(this.complete) {
                            $(this).load();
                        }
                    });
                });

                function onErrorEvent(e) {
                    var target = e.target,
                        posibleNodeNames = 'img iframe';

                    if (!!target.closest('.' + namespace + 'viewport') &&
                        posibleNodeNames.toUpperCase().indexOf(target.nodeName) != -1 &&
                        slider.options.preloadImages != 'visible') {
                        count += 1;
                    }
                }
            }
        };

        /*------------------------------------*\
          - PUBLIC METHODS -
        \*------------------------------------*/
        // Group animations in one object
        slider.animationStore = {
            slideSingleItem: function( params ) {
                var widthViewport = slider.width() / (slider.count + slider.cloneCount),
                    currentSlide = params.currentSlide,
                    origin;


                if (slider.animating === false) {
                    // API: Before slide - Callback
                    slider.options.devBeforeSlide();


                    // catch animation first and last slide
                    if (slider.direction === 'next' && params.currentSlide === 0) {
                        origin = -(widthViewport * (slider.count + slider.cloneCount / 2)) + 'px';
                    } else if (slider.direction === 'prev' && params.currentSlide === slider.count - 1) {
                        origin = -(widthViewport * (slider.cloneCount / 2 - 1)) + 'px';
                    } else {
                        origin = -(widthViewport * (currentSlide + slider.cloneCount / 2)) + 'px';
                    }

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

                // Set index to default position
                if(slider.options.animation === 'slide') {
                    if (slider.direction === 'next' && slider.currentSlide === 0) {
                        methods.shell.setStartSlide(0);
                    } else if (slider.direction === 'prev' && slider.currentSlide === slider.count - 1) {
                        methods.shell.setStartSlide(slider.count - 1);
                    }
                }

                // API: After slide - Callback
                slider.options.devAfterSlide();
            },

            fadeSingleItem: function () {

            },

            /**
             * Description: call objects which encapsulate actions and parameters.
             * @type Command
             */
            execute: function( command ) {
                if (!slider.isPaused && !slider.isStopped && slider.initialized) {
                    if (slider.options.auto) {
                        methods.autoPlay.startTime = null;
                        methods.autoPlay.spendTime = null;
                        cancelAnimationFrame(slider.autoTimeout);
                    }

                    if (slider.options.kenBurn) {
                        methods.kenBurn.reset();
                    }

                    if(slider.options.animation === 'slide') {
                        this.slideSingleItem(command);
                    } else if (slider.options.animation === 'fade') {
                        this.fadeSingleItem(command);
                    }
                }
            }
        };

        slider.setActive = function() {
            methods.shell.setActive();

            if (slider.options.paginationNav) {
                methods.paginationNav.setActive();
            }
        };

        slider.animateSlides = function() {
            var target = slider.getIndexCalcDir('next');
            slider.animationStore.execute({ currentSlide: target });
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

        // slider.destroy = function() {
        //     if (slider.initialized) {

        //     }
        // };

        slider.getIndexCalcDir = function(dir) {
          slider.direction = dir;
          if (dir === 'next') {
            return (slider.currentSlide === slider.lastItem) ? 0 : slider.currentSlide + 1;
          } else {
            return (slider.currentSlide === 0) ? slider.lastItem : slider.currentSlide - 1;
          }
        };


        publickMethods = {
            nextSlide: function() {
                var target = slider.getIndexCalcDir('next');
                slider.animationStore.execute({ currentSlide: target });
            },

            prevSlide: function() {
                var target = slider.getIndexCalcDir('prev');
                slider.animationStore.execute({ currentSlide: target });
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

            destroy: function() {
                slider.destroy();

                // API: On play click - Callback
                slider.options.devOnDestroy();
            },

            goToNextSlide: function( index ) {
                if (index !== slider.currentSlide) {
                    slider.direction = null;
                    slider.animationStore.execute({ currentSlide: index * 1 });
                }
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

        // Most important dev features
        namespace: 'dev-',                // String, Integer:
        slideSelector: '> li',            // String:
        animation: 'slide',               // String [slide, fade, bitches]:
        easing: 'ease',                   // String:
        speed: 600,                       // Integer [0...]:
        preloadImages: 'visible',         // String visible, all, false

        // Mouse Events
        // touch: true,                      // Bool: ..

        // Usability features
        kenBurn: false,                   // Bool: Dependency auto()
        shuffle: false,                   // Bool: ..
        startAt: 0,                       // Integer [0...]:

        // Keyboard navigation
        keyboardControl: true,

        // Autoplay
        auto: true,                       // Bool: ..
        autoDelay: 5000,                  // Integer [0...]: ..
        pauseOnHover: false,              // Bool: ..

        // Pagination
        directionNav: true,               // Bool: ..

        // Navigation
        paginationNav: true,              // Bool: ..
        navigationText: ['Prev', 'Next'], // Array, Bool [false]: ..

        // Callbacks API
        devBeforeSlide: function( data )    {}, // API: Callback on ..
        devAfterSlide:  function( data )    {}, // API: Callback on ..
        devBeforeInit:  function( element ) {}, // API: Callback on ..
        devAfterInit:   function( element ) {}, // API: Callback on ..
        devOnDestroy:   function( data )    {}, // API: Callback on ..
        devOnPause:     function( data )    {}, // API: Callback on ..
        devOnPlay:      function( data )    {}  // API: Callback on ..
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
    preloadImages: 'visible',
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

    devOnDestroy: function() {
        console.log('dev: devOnDestroy() - Callback', arguments);
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

// $('#destroy').click(function () {
//     slider.destroy();
//     return false;
// });



// Do not go on about their desires, develop willpower.

