/**!
 * deviora.js
 * https://github.com/realgvard/devslider
 * (c) Alexander Polischuck; License
 * Created by: Alexander Polischuck
 * Uses jquery.js
 */

(function() {
    var requestAnimationFrame =
        window.requestAnimationFrame       ||
        window.mozRequestAnimationFrame    ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;

    window.requestAnimationFrame = requestAnimationFrame;
})();


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
            pfxCSS3 = null;
            preloadElements = null,
            possibleAnimations = ['slide', 'fade'],
            currentAnimation = '',
            preloader = null,
            methods = {},
            publickMethods = {};

        // Add a reverse reference to the DOM object
        $.data(slider, shortNamespace + 'slider', slider);


        /*------------------------------------*\
          - PRIVATE METHODS -
        \*------------------------------------*/
        methods = {
            init: function() {

                // Get current slide and make sure it is a number
                slider.currentSlide = parseInt(slider.options.startAt ? slider.options.startAt : 0, 10);
                slider.prevSlide = slider.currentSlide;
                slider.$slides = $(slider.options.slideSelector, slider);
                slider.count = slider.$slides.length;
                slider.lastItem = slider.count - 1;
                slider.control = {};

                if (slider.options.animation === 'random') {
                    currentAnimation = possibleAnimations[methods.getRandom(0, possibleAnimations.length - 1)];
                } else {
                    currentAnimation = slider.options.animation;
                }

                // Bool setting ..
                slider.initialized = false;
                slider.autoTimeout = null;
                slider.animating = false;
                slider.isPaused = false;
                slider.isStopped = false;
                slider.isPlaying = false;


                // API: Before init - Callback
                slider.options.devBeforeInit();

                methods.checkBrowser();

                // Shuffle:
                if (slider.options.shuffle) {
                    slider.$slides.sort(function() { return (Math.round(Math.random()) - 0.5) });
                    slider.empty().append(slider.$slides);
                }

                // Start build shell slider
                methods.shell.wrapupShell();

                // Direction Nav:
                if (slider.options.directionNav) methods.directionNav.setup();

                // Control Nav:
                if (slider.options.paginationNav) methods.paginationNav.setup();

                // Auto Controls:
                if (slider.options.auto && slider.options.autoControls) methods.autoControls.setup();

                // Ken Burn:
                if (slider.options.auto && slider.options.kenBurn) methods.kenBurn.setup();

                if(!!slider.options.preloadImages) {
                    if (slider.options.preloadImages === 'visible') {
                        preloadElements = slider.$slides.eq(slider.currentSlide);
                    }
                    if (slider.options.preloadImages === 'all') {
                        preloadElements = slider.$slides;
                    }
                }

                if (slider.options.keyboardNavigation) {
                    methods.setupKeyboardNavigation();
                }

                // Append collection build items
                slider.before( slider.$wrapper );
                // Append slider to collection
                slider.$viewport.prepend( slider );
                // End build shell slider

                // Set to slider default props
                methods.shell.setup();
                // Set active slide
                slider.setActive();
                methods.shell.setStartSlide( slider.currentSlide );

                if(slider.options.touch) {
                    slider.gesturesData = {
                        newPosX: null,
                        newRelativeX: null,
                        maximum: (slider.count * slider.sliderWidth) * -1
                    };
                    methods.gestures.setupEvents();
                }

                if (slider.options.responsive) {
                    methods.setupResponsive();
                }

                slider.$wrapper.hover(function onSliderMouseEnter( e ) {
                    if (slider.options.auto && slider.options.pauseOnHover) {
                        if (!slider.animating && !slider.isPaused && !slider.isStopped) slider.pause();
                    }

                    methods.shell.onMouseEnter();
                }, function onSliderMouseLeave() {
                    if (slider.options.auto && slider.options.pauseOnHover) {
                        if (!slider.animating && slider.isPaused && !slider.isStopped) slider.play();
                    }

                    methods.shell.onMouseLeave();
                });

                // define load images
                if(!!slider.options.preloadImages) {
                    methods.loadElements(preloadElements, methods.start);
                } else {
                    methods.start();
                }
            },

            start: function() {
                methods.shell.wrapupMainImages();

                // Remove preloader
                if(!!slider.options.preloadImages && preloader !== null) {
                    preloader.fadeOut(500, function() {
                        $(this).remove();
                        preloader = null;
                    });
                }

                // After build slider
                if (slider.options.auto) {
                    methods.autoPlay.start();
                }

                slider.initialized = true;
                slider.$viewport.addClass(shortNamespace + 'slider-initialised');

                // API: After init - Callback
                slider.options.devAfterInit();
            },

            shell: {
                // Setup default styles
                setup: function() {
                    // Set basic CSS class
                    slider.addClass(namespace + 'slider');

                    if (slider.options.startHeight !== 0) {
                        var startHeight = slider.options.startHeight.length !== null ? slider.options.startHeight.height() : slider.options.startHeight;
                        if (slider.options.fullScreen === true) {
                            if (slider.options.startHeight > slider.options.minFullScreenHeight) {
                                slider.$wrapper.height( startHeight );
                            } else {
                                slider.$wrapper.height( slider.options.minFullScreenHeight );
                            }
                        } else {
                            slider.$wrapper.height( startHeight );
                        }
                    }

                    if (slider.options.fullScreen === true) {
                        var $window = $(window),
                            heightWindow = $window.height(),
                            offsetY = slider.options.fullScreenOffsetY.length != null ? slider.options.fullScreenOffsetY.height() : slider.options.fullScreenOffsetY;

                        slider.$slides.width( $window.width() );

                        if (slider.options.startHeight === 0) {
                            if (slider.options.minFullScreenHeight <= heightWindow) {
                                slider.$wrapper.height( heightWindow - offsetY );
                            } else {
                                slider.$wrapper.height( slider.options.minFullScreenHeight - offsetY );
                            }
                        }

                        $window.resize(function(){
                            if (!slider.animating) {
                                var height = $window.height();

                                if (slider.options.minFullScreenHeight <= height) {
                                    slider.$wrapper.height( height - offsetY );
                                } else {
                                    slider.$wrapper.height( slider.options.minFullScreenHeight - offsetY );
                                }
                            }
                        });
                    }

                    if (slider.options.fullScreen === true) {
                        slider.sliderWidth = $(window).width();
                    } else {
                        slider.sliderWidth = slider.width();
                    }

                    slider.css({
                        width: '100%',
                        height: '100%'
                    });

                    if (slider.options.fullScreen === false) {
                        var maxHeight = Math.max.apply(Math, $(slider.$slides).map(function() {
                            return $(this).height();
                        }));

                        slider.css({
                            'height': maxHeight + 'px'
                        });
                    }

                    if(!slider.options.smoothHeight) {
                        slider.$slides.css('height', '100%');
                    }

                    slider.$slides.css({
                        'width': '100%',
                        // 'height': '100%',
                        'position': 'absolute',
                        'display': 'none',
                        'overflow': 'hidden',
                        // 'visibility': 'visible',
                        'left': 0,
                        'top': 0,
                        'z-index': 1
                    }).eq(slider.currentSlide).show();

                    if (currentAnimation === 'fade') {
                        slider.$slides.css('opacity', 0);
                    }
                },

                // Build our slider with HTML
                wrapupShell: function() {
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

                wrapupMainImages: function() {
                    slider.$slides.find('> img').each(function() {
                        var $img       = $(this),
                            bgposition = $img.data('bgposition'),
                            bgrepeat   = $img.data('bgrepeat'),
                            bgfit      = $img.data('bgfit'),
                            src        = $img.attr('src');


                        // Wrap each image in div
                        $img.wrap('<div class="slotholder" style="position: absolute; top: 0; left: 0; z-index: 1; width:100%; height:100%;"'+
                                  'data-bgposition="' + $img.data("bgposition") + '"'+
                                  'data-bgrepeat="'   + $img.data("bgrepeat") + '"'+
                                  'data-bgfit="'      + $img.data("bgfit") + '"'+
                                  '></div>');

                        if (bgposition === undefined) bgposition = 'center center';
                        if (bgrepeat === undefined) bgrepeat     = 'no-repeat';
                        if (bgfit === undefined) bgfit           = 'cover';

                        // Replace img at div
                        $img.replaceWith(
                            '<div class="' + namespace + 'defaultImg ' + $img.attr('class') + '"' +
                                'data-bgfit="'       + bgfit +  ';"' +
                                'data-bgposition="'  + bgposition + ';" ' +
                                'data-bgrepeat="'    + bgrepeat + ';"' +
                                'data-src="'         + src + ';"' +
                                'style="background-color:'     + $img.css("backgroundColor") + ';' +
                                      'background-repeat:'     + bgrepeat + ';' +
                                      'background-image: url(' + src + ');' +
                                      'background-size:'       + bgfit + ';' +
                                      'background-position:'   + bgposition + ';' +
                                      'width: 100%;' +
                                      'height: 100%;">' +
                            '</div>');
                    });
                },

                setStartSlide: function( index ) {
                    if (currentAnimation === 'slide') {
                        slider.$slides.eq(slider.currentSlide).css({ 'z-index': 2 });
                    } else if (currentAnimation === 'fade') {
                        slider.$slides.eq(slider.currentSlide).css({ 'z-index': 2, 'opacity': 1 });
                    }
                },

                setActive: function() {
                    if (slider.prevSlide !== slider.currentSlide) {
                        $(slider.options.slideSelector, slider).eq(slider.prevSlide).removeClass(namespace + 'active-slide');
                    }
                    $(slider.options.slideSelector, slider).eq(slider.currentSlide).addClass(namespace + 'active-slide');
                },

                updateWidth: function( value ) {
                    $(slider.options.slideSelector, slider)
                        .css({
                            'width': value
                        });
                },

                // TODO: Improvement updateHeight() on resize, and init.
                updateHeight: function( value ) {
                    // if (value >= slider.options.minFullScreenHeight) {
                        slider.$wrapper.height( value );
                    // } else {
                        // slider.$wrapper.height( slider.options.minFullScreenHeight );
                    // }
                },

                onMouseEnter: function() {
                    slider.addClass(namespace + 'hovered');
                    slider.control.$directionNav.stop(true).fadeIn(300);
                },

                onMouseLeave: function() {
                    slider.removeClass(namespace + 'hovered');
                    slider.control.$directionNav.stop(true).fadeOut(300);
                }
            },

            directionNav: {
                setup: function() {
                    var $directionNavScaffold =
                        $('<div class="' + namespace + 'direction-nav-block">' +
                            '<div class="' + namespace + 'direction-item ' + namespace + 'direction-prev">' +
                                (slider.options.navigationText[0] || '') +
                            '</div>' +
                            '<div class="' + namespace + 'direction-item ' + namespace + 'direction-next">' +
                                (slider.options.navigationText[1] || '') +
                            '</div>' +
                        '</div>');

                    slider.$wrapper.append( $directionNavScaffold );
                    slider.control.$directionNav = $('.' + namespace + 'direction-nav-block .' + namespace + 'direction-item', slider.$wrapper).hide();

                    slider.control.$directionNav.on(eventType, function( event ) {
                        event.preventDefault();
                        var target;

                        target = ( $(this).hasClass(namespace + 'direction-prev') ) ? slider.getIndexCalcDir('prev') : slider.getIndexCalcDir('next');

                        slider.animationStore.forceUpdate = true;
                        slider.animationStore.execute({ currentSlide: target });
                    });
                }
            },

            paginationNav: {
                setup: function() {
                    var $controlPagScaffold = $('<div class="' + namespace + 'pagination-nav-block"></div>');

                    if (slider.count > 1) {
                        for (var i = 0, len = slider.count; i < len; i++) {
                            var $pagItem =
                                $('<div class="' + namespace + 'bullet"></div>').data(namespace + 'bullet', i);

                            $controlPagScaffold.append( $pagItem );
                        }
                    }

                    // Append all items
                    slider.control.$paginationNav = $controlPagScaffold;

                    slider.control.$paginationNav.on(eventType, '.' + namespace + 'bullet', function( event ) {
                        event.preventDefault();
                        var $this = $(this),
                            target = $this.data(namespace + 'bullet');

                        if (target > slider.currentSlide) {
                            slider.direction = 'next';
                        } else if (target < slider.currentSlide) {
                            slider.direction = 'prev';
                        }

                        if(target !== slider.currentSlide) {
                            slider.animationStore.forceUpdate = true;
                            slider.animationStore.execute({ currentSlide: target });
                        }
                    });

                    slider.$wrapper.append( slider.control.$paginationNav );
                },

                setActive: function() {
                    if (slider.prevSlide !== slider.currentSlide) {
                        slider.control.$paginationNav.children('.' + namespace + 'bullet').eq(slider.prevSlide).removeClass(namespace + 'active');
                    }
                    slider.control.$paginationNav.children('.' + namespace + 'bullet').eq(slider.currentSlide).addClass(namespace + 'active');
                }
            },

            autoControls: {
                setup: function() {
                    slider.control.$start =
                        $('<div class="' + namespace + 'auto-control-item ' + namespace + 'auto-control-start"></div>');
                    slider.control.$stop =
                        $('<div class="' + namespace + 'auto-control-item ' + namespace + 'auto-control-stop"></div>');

                    if (!slider.options.paginationNav) {
                        var $directionNavScaffold =
                            $('<div class="' + namespace + 'auto-control-block"></div>');
                        $directionNavScaffold.append([slider.control.$start, slider.control.$stop])
                    }


                    slider.control.$start.on('click', function() {
                        slider.play();
                    });

                    slider.control.$stop.on('click', function() {
                        publickMethods.pause();
                    });

                    methods.switchStateStartAndPause();

                    if (!slider.options.paginationNav) {
                        slider.$wrapper.append( $directionNavScaffold );
                    } else {
                        slider.control.$paginationNav.prepend(slider.control.$start);
                        slider.control.$paginationNav.append(slider.control.$stop);
                    }
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
                            cancelAnimationFrame(slider.autoTimeout);
                            slider.animateToNextSlide();
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
                    var $kenBurnContainer;

                    if (slider.options.kenBurnType === 'bar') {
                        $kenBurnContainer = $('<div class="' + namespace + 'ken-burn-wrapper">' +
                                                '<div class="' + namespace + 'ken-burn-progress"></div>' +
                                            '</div>');
                        slider.control.$kenBurn = $kenBurnContainer.find('.' + namespace + 'ken-burn-progress');
                    }

                    if (slider.options.kenBurnType === 'circle') {
                        $kenBurnContainer = $('<div class="' + namespace + 'circle-timer"> ' +
                                                '<div class="' + namespace + 'ct-left"> ' +
                                                    '<div class="' + namespace + 'ct-rotate"> ' +
                                                        '<div class="' + namespace + 'ct-hider"> ' +
                                                            '<div class="' + namespace + 'ct-half"></div> ' +
                                                        '</div>' +
                                                    '</div>' +
                                                '</div>' +
                                                '<div class="' + namespace + 'ct-right"> ' +
                                                    '<div class="' + namespace + 'ct-rotate"> ' +
                                                        '<div class="' + namespace + 'ct-hider"> ' +
                                                            '<div class="' + namespace + 'ct-half"></div> ' +
                                                        '</div>' +
                                                    '</div>' +
                                                '</div>' +
                                                '<div class="' + namespace + 'ct-center"></div> ' +
                                            '</div>');

                        slider.control.$kenBurn = $kenBurnContainer.find('.' + namespace + 'ct-rotate');
                    }

                    slider.control.$kenBurnContainer = $kenBurnContainer;

                    methods.kenBurn.reset();
                    slider.$viewport.prepend( $kenBurnContainer );
                },

                update: function() {
                    var maxSize = 100,
                        percent = (methods.autoPlay.spendTime / slider.options.autoDelay) * maxSize;

                    methods.kenBurn.progress = percent.toFixed(2) * 1;

                    if (slider.options.kenBurnType === 'bar') {
                        slider.control.$kenBurn.css('width', methods.kenBurn.progress + '%');
                    }

                    if (slider.options.kenBurnType === 'circle') {
                        var valueInDeg = 360 * methods.kenBurn.progress / 100,
                            halfValueInDeg = 360 / 2;

                        if (valueInDeg >= halfValueInDeg) {
                            slider.control.$kenBurn.eq(0).css(methods.getRotate( -(halfValueInDeg - valueInDeg) ));
                        } else {
                            slider.control.$kenBurn.eq(1).css(methods.getRotate( valueInDeg ));
                        }
                    }
                },

                reset: function() {
                    if (methods.kenBurn.progress !== 0) {
                        methods.kenBurn.progress = 0;
                    }

                    if (slider.options.kenBurnType === 'bar') {
                        slider.control.$kenBurn.width(0);
                    }

                    if (slider.options.kenBurnType === 'circle') {
                        slider.control.$kenBurn.eq(0).css(methods.getRotate(0));
                        slider.control.$kenBurn.eq(1).css(methods.getRotate(0));
                    }
                }
            },

            checkBrowser: function() {
                var isTouch = 'ontouchstart' in window || window.navigator.msMaxTouchPoints;

                // Touch / UseCSS:
                var supportTransitions =
                    (function() {
                        var supportedProp,
                            div = document.createElement('div'),
                            prop = 'Transition',
                            prefixes = ['Moz', 'Webkit', 'o', 'MS'];

                        if (prop.toLowerCase() in div.style) {
                            pfxCSS3 = '';
                            return true;
                        }

                        for ( var i = 0; i < prefixes.length; i++ ) {
                            if ((prefixes[i] + prop) in div.style) {
                                slider.pfx = prefixes[i];
                                supportedProp = prop;
                                pfxCSS3 = '-' + slider.pfx.toLowerCase() + '-';

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
                    }());

                slider.browser = {
                    isTouch: isTouch,
                    transitions: supportTransitions
                };
            },

            gestures: {
                setupEvents: function() {
                    var locals = {
                        offsetX       : 0,
                        offsetY       : 0,
                        baseElWidth   : 0,
                        relativePos   : 0,
                        position      : null,
                        minSwipe      : null,
                        maxSwipe      : null,
                        sliding       : null,
                        dargging      : null,
                        targetElement : null
                    };

                    // prod
                    var types = [
                        'touchstart.dev',
                        'touchmove.dev',
                        'touchend.dev'
                    ];

                    // test
                    // var types = [
                    //     'mousedown.dev',
                    //     'mousemove.dev',
                    //     'mouseup.dev'
                    // ];

                    slider.events = {}
                    slider.events.start = types[0];
                    slider.events.move  = types[1];
                    slider.events.end   = types[2];

                    function getTouches( event ) {
                        if (event.touches !== undefined) {
                            return {
                                x: event.touches[0].pageX,
                                y: event.touches[0].pageY
                            }
                        }
                        if (event.touches === undefined) {
                            if (event.pageX !== undefined) {
                                return {
                                    x: event.pageX,
                                    y: event.pageY
                                };
                            }
                            if (event.pageX === undefined) {
                                return {
                                    x: event.clientX,
                                    y: event.clientY
                                };
                            }
                        }
                    };

                    function swapEvents( prop ) {
                        if (prop === 'on') {
                            $(document).on(slider.events.move, onTouchMove);
                            $(document).on(slider.events.end, onTouchEnd);
                        } else if (prop === 'off') {
                            $(document).off(slider.events.move);
                            $(document).off(slider.events.end);
                        }
                    }

                    function onTouchStart( event ) {
                        var e = event.originalEvent || event || window.event,
                            position;

                        if (slider.animating) {
                            return false;
                        }

                        if (e.which === 2 || e.which === 3) {
                            return false;
                        }

                        if (slider.options.auto !== false) {
                            slider.pause();
                        }

                        slider.gesturesData.newPosX = 0;
                        slider.gesturesData.newRelativeX = 0;

                        slider.css( methods.getEmptyTransition() );

                        position = slider.position();

                        locals.relativePos = position.left;
                        locals.offsetX = getTouches(e).x - position.left;
                        locals.offsetY = getTouches(e).y - position.top;

                        swapEvents('on');

                        locals.sliding = false;
                        locals.targetElement = e.target || e.srcElement;
                    }

                    function onTouchMove( event ) {
                        var e = event.originalEvent || event || window.event,
                            minSwipe,
                            maxSwipe;

                        slider.gesturesData.newPosX = getTouches(e).x - locals.offsetX;
                        slider.gesturesData.newPosY = getTouches(e).y - locals.offsetY;
                        slider.gesturesData.newRelativeX = slider.gesturesData.newPosX - locals.relativePos;

                        if (locals.dragging !== true && slider.gesturesData.newRelativeX !== 0) {
                            locals.dragging = true;
                            // TODO: Make callback. or not
                        }

                        // TODO: check on mobile ! (Only for mobile)
                        if ((slider.gesturesData.newRelativeX > 8 || slider.gesturesData.newRelativeX < -8) && (slider.browser.isTouch === true)) {
                            if (e.preventDefault !== undefined) {
                                e.preventDefault();
                            } else {
                                e.returnValue = false;
                            }
                            locals.sliding = true;
                        }

                        if ((slider.newPosY > 10 || slider.newPosY < -10) && locals.sliding === false) {
                            $(document).off(slider.events.move);
                        }

                        minSwipe = function() {
                            return slider.gesturesData.newRelativeX / 5;
                        };

                        maxSwipe = function() {
                            return slider.gesturesData.maximum + slider.gesturesData.newRelativeX / 5;
                        };

                        slider.gesturesData.newPosX = Math.max(Math.min(slider.gesturesData.newPosX, minSwipe()), maxSwipe());
                        // debug
                            // console.log(
                            //     ' newPosX: ' + slider.gesturesData.newPosX + '\n',
                            //     'minSwipe(): ' + minSwipe() + '\n',
                            //     'maxSwipe(): ' + maxSwipe() + '\n',
                            //     'newRelativeX: ' + slider.gesturesData.newRelativeX + '\n',
                            //     slider.gesturesData.maximum
                            //     );
                    }

                    function onTouchEnd( event ) {
                        var e = event.originalEvent || event || window.event,
                            newPosition,
                            handlers,
                            target;

                        e.target = e.target || e.srcElement;

                        if (slider.gesturesData.newRelativeX < 0) {
                            target = slider.getIndexCalcDir('next');
                            slider.gesturesData.dragDirection = slider.direction = 'next';
                        } else {
                            target = slider.getIndexCalcDir('prev');
                            slider.gesturesData.dragDirection = slider.direction = 'prev';
                        }

                        if (slider.gesturesData.newRelativeX !== 0) {
                            slider.animationStore.forceUpdate = true;
                            slider.animationStore.execute({ currentSlide: target });
                        }

                        swapEvents('off');
                    }

                    slider.$viewport.on(slider.events.start, onTouchStart);
                }
            },

            setupResponsive: function() {
                var startWidth = slider.sliderWidth,
                    startHeight = slider.$wrapper.height();

                // $(window).resize(function() {
                //     var width = $(this).width(),
                //         // height = $(this).height(),
                //         different = slider.sliderWidth / startWidth * 1.1,
                //         newHeight = startHeight * different;

                //     slider.sliderWidth = width;

                //     if (newHeight <= startHeight) {
                //         if (newHeight >= slider.options.minFullScreenHeight) {
                //             methods.shell.updateHeight( newHeight );
                //         } else {
                //             methods.shell.updateHeight( slider.options.minFullScreenHeight );
                //         }
                //     }
                // });
            },

            setupKeyboardNavigation: function() {
                $(document).keydown(function(e) {
                    if (!slider.animating && slider.initialized) {

                        // Left -> prevSlide()
                        if (e.keyCode === 37) {
                            publickMethods.prevSlide();
                        }

                        // Right -> nextSlide()
                        if (e.keyCode === 39) {
                            publickMethods.nextSlide();
                        }
                    }
                });
            },

            switchStateStartAndPause: function() {
                if (slider.isPaused) {
                    slider.control.$start.removeClass(namespace + 'auto-control-start-active');
                    slider.control.$stop.addClass(namespace + 'auto-control-stop-active');
                } else {
                    slider.control.$start.addClass(namespace + 'auto-control-start-active');
                    slider.control.$stop.removeClass(namespace + 'auto-control-stop-active');
                }
            },

            loadElements: function( elements, callback ) {
                var total = slider.find(elements).length,
                    count = 0,
                    timer;

                // Append preloader
                if(!!slider.options.preloadImages) {
                    timer = setTimeout(function() {
                        preloader = slider.options.preloader || $('<div class="' + namespace + 'preloader"></div>');
                        slider.$viewport.append( preloader ).hide().fadeIn(350);
                    }, 100);
                }

                if (total === 0) {
                    callback();
                    return;
                }

                window.addEventListener('error', onErrorEvent, true);

                elements.find('img, iframe').each(function() {
                    $(this).one('load', function() {
                        count += 1;

                        if(count === total) {
                            window.removeEventListener('error', onErrorEvent, true);
                            preloadElements = null;
                            clearTimeout(timer);
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

                    if (!!target.closest('.' + namespace + 'viewport')                &&
                        posibleNodeNames.toUpperCase().indexOf(target.nodeName) !== -1) {
                        count += 1;

                        if (slider.options.preloadImages === 'visible') {
                            window.removeEventListener('error', onErrorEvent, true);
                            callback();
                        }
                    }
                }
            },

            getRandom: function( min, max ) {
                return Math.floor( Math.random() * (max - min + 1) + min );
            },

            getEmptyTransition: function() {
                var sender = {},
                    prop = pfxCSS3 + 'transition';

                sender[prop] = '';

                return sender;
            },

            getTransition: function( value ) {
                var sender = {},
                    prop = pfxCSS3 + 'transition';

                sender[prop] = value;

                return sender;
            },

            getTranslate: function( posX ) {
                var sender = {},
                    prop = pfxCSS3 + 'transform';

                sender[prop] = 'translate3d(' + posX + 'px, 0px, 0px)';

                return sender;
            },

            getEmptyTranslate: function( posX ) {
                var sender = {},
                    prop = pfxCSS3 + 'transform';

                sender[prop] = '';

                return sender;
            },

            getRotate: function( deg ) {
                var sender = {},
                    prop = pfxCSS3 + 'transform';

                sender[prop] = 'rotate(' + deg + 'deg)';

                return sender;
            }
        };

        /*------------------------------------*\
          - PUBLIC METHODS -
        \*------------------------------------*/

        /**
         * Group animations in one object
         *
         * @todo Remake this method such as Decorator.
         * @type {Object}
         */
        slider.animationStore = {
            forceUpdate: false,

            slideSingleItem: function( params ) {
                if (slider.animating === false) {
                    var currentSlide = params.currentSlide,
                        $currentItem = slider.$slides.eq(currentSlide),
                        $prevItem = slider.$slides.eq(slider.currentSlide),
                        origin = slider.sliderWidth;


                    // API: Before slide - Callback
                    slider.options.devBeforeSlide();

                    slider.prevSlide = slider.currentSlide;
                    slider.currentSlide = currentSlide;
                    slider.animating = true;

                    // Change direction depending rules.
                    if (currentSlide === 0 && slider.direction === 'next') {
                        slider.direction = 'prev';
                    }
                    if (currentSlide === slider.count - 1 && slider.direction === 'prev') {
                        slider.direction = 'next';
                    }


                    if (slider.direction === 'prev') {
                        origin *= -1;
                    }

                    slider.animationStore.onStartAnimate();
                    if (slider.browser.transitions) {
                        var transitionEnd = (slider.pfx) ? slider.pfx + 'TransitionEnd' : 'transitionend';

                        $currentItem.css(methods.getTranslate( origin ));
                        setTimeout(function() {
                            $prevItem.css({ 'zIndex': 2 });
                            $currentItem.css({ 'zIndex': 3 });
                            $currentItem.css(methods.getTransition('transform ' + slider.options.speed + 'ms ' + slider.options.css3easing));
                            $currentItem.css(methods.getTranslate(0));

                            $currentItem.on(transitionEnd, function onEndTransition() {
                                slider.off(transitionEnd);
                                slider.animationStore.onEndAnimate();
                            });
                        }, 20);

                    } else {
                        $currentItem.css('left', origin).animate({ 'left': 0 }, {
                            duration: slider.options.speed,
                            specialEasing: {
                                'left': 'swing'
                            },
                            complete: function() {
                                slider.animationStore.onEndAnimate();
                            }
                        });
                    }
                }
            },

            fadeSingleItem: function ( params ) {
                if (slider.animating === false) {
                    var currentSlide = params.currentSlide,
                        $currentItem = slider.$slides.eq(currentSlide),
                        $prevItem = slider.$slides.eq(slider.currentSlide);


                    // API: Before slide - Callback
                    slider.options.devBeforeSlide();

                    slider.prevSlide = slider.currentSlide;
                    slider.currentSlide = currentSlide;
                    slider.animating = true;

                    slider.animationStore.onStartAnimate();
                    if (slider.browser.transitions) {
                        var transitionEnd = (slider.pfx) ? slider.pfx + 'TransitionEnd' : 'transitionend';

                        setTimeout(function() {
                            $currentItem.css(methods.getTransition('opacity ' + slider.options.speed + 'ms ' + slider.options.css3easing));
                            $prevItem.css(methods.getTransition('opacity ' + slider.options.speed + 'ms ' + slider.options.css3easing));

                            $prevItem.css({ 'opacity': 0, 'zIndex': 1 });
                            $currentItem.css({ 'opacity': 1, 'zIndex': 2 });
                        }, 20);

                        $currentItem.on(transitionEnd, function onEndTransition() {
                            slider.off(transitionEnd);
                            slider.animationStore.onEndAnimate();
                        });
                    } else {
                        $prevItem.css('zIndex', 1).animate({ 'opacity': 0 }, slider.options.speed, 'swing');
                        $currentItem.css('zIndex', 2)
                                    .animate({ 'opacity': 1 }, {
                                        duration: slider.options.speed,
                                        specialEasing: {
                                            'opacity': 'swing'
                                        },
                                        complete: function() {
                                            slider.animationStore.onEndAnimate();
                                        }
                                    });
                    }
                }
            },

            onStartAnimate: function() {
                if (slider.options.smoothHeight) {
                    slider.setSmoothHeight();
                }

                slider.$slides.eq(slider.currentSlide).show();

                if (slider.options.auto && slider.options.kenBurn && slider.options.kenBurnType === 'circle') {
                    slider.control.$kenBurnContainer.stop(true).fadeOut(250, function() {
                        methods.kenBurn.reset();
                    });
                }
            },

            onEndAnimate: function() {
                slider.animationStore.forceUpdate = false;
                slider.animating = false;
                slider.setActive();

                slider.$slides.eq(slider.prevSlide).hide();

                if (slider.options.auto) {
                    methods.autoPlay.start();
                }

                if (currentAnimation === 'slide') {
                    slider.$slides.eq(slider.currentSlide).css( methods.getEmptyTranslate() );
                    slider.$slides.eq(slider.prevSlide).css({ 'zIndex': 1 });
                    slider.$slides.eq(slider.currentSlide).css({ 'zIndex': 2 });
                }

                slider.$slides.eq(slider.prevSlide).css( methods.getEmptyTransition() );
                slider.$slides.eq(slider.currentSlide).css( methods.getEmptyTransition() );

                if (slider.options.auto && slider.options.kenBurn && slider.options.kenBurnType === 'circle') {
                    slider.control.$kenBurnContainer.stop(true).fadeIn(350);
                }

                // API: After slide - Callback
                slider.options.devAfterSlide();
            },


            /**
             * Call objects which encapsulate actions and parameters.
             *
             * @pattern - commander
             */
            execute: function( command ) {
                if (slider.isPaused && slider.initialized && slider.animationStore.forceUpdate ||
                    !slider.isPaused && !slider.isStopped && slider.initialized) {
                    if (slider.options.auto) {
                        methods.autoPlay.startTime = null;
                        methods.autoPlay.spendTime = null;
                        cancelAnimationFrame(slider.autoTimeout);
                    }

                    // kenBurn
                    if (slider.options.auto && slider.options.kenBurn && slider.options.kenBurnType === 'bar') {
                        methods.kenBurn.reset();
                    }

                    if (currentAnimation === 'slide') {
                        this.slideSingleItem(command);
                    } else if (currentAnimation === 'fade') {
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

        slider.animateToNextSlide = function() {
            var target = slider.getIndexCalcDir('next');
            slider.animationStore.execute({ currentSlide: target });
        };

        slider.pause = function() {
            slider.isPaused = true;

            if (slider.options.auto) {
                cancelAnimationFrame(slider.autoTimeout);
            }

            methods.switchStateStartAndPause();
        };

        slider.play = function() {
            slider.isPaused = false;
            slider.isStopped = false;

            if (slider.options.auto) {
                methods.autoPlay.setLastDate();
            }

            methods.switchStateStartAndPause();
        };

        /**
         * Setup smooth change height for current slide.
         */
        slider.setSmoothHeight = function() {
            slider.$viewport.animate({
                'height': slider.$slides.eq(slider.currentSlide).height()
            }, {
                duration: (slider.options.smoothHeightSpeed === 0) ? slider.options.speed : slider.options.smoothHeightSpeed,
                specialEasing: {
                    'height': 'swing'
                }
            });
        };

        /**
         * Iterator slides
         *
         * @param {String} dir - string value, 'prev' or 'next'.
         * @return {Number} - get current index.
         */
        slider.getIndexCalcDir = function( dir ) {
            slider.direction = dir;
            if (dir === 'next') {
                return (slider.currentSlide === slider.lastItem) ? 0 : slider.currentSlide + 1;
            } else {
                return (slider.currentSlide === 0) ? slider.lastItem : slider.currentSlide - 1;
            }
        };

        // It's method can be use in inside own slider.
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

            getCurrentIndex: function() {
                return slider.currentSlide;
            },

            getSlidesCount: function() {
                return slider.count;
            },

            goTo: function( index ) {
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
                    'deviora': new $.deviora(this, options)
                });
            }
        });
    };

    $.fn.deviora.defaults = {

        // Most important dev features
        namespace: 'dev-',                // String, Number - Namespace slider.
        slideSelector: '> li',            // String -
        animation: 'slide',               // String(slide, fade, random) - ..
        css3easing: 'ease',               // String - ..
        speed: 600,                       // Number - ..
        preloadImages: 'visible',         // String(visible, all, false) - ..

        // Mouse Events
        touch: true,                      // Bool - ..

        // Full Screen
        fullScreen: true,                 // Bool - ..
        fullScreenOffsetY: 0,             // jQuery selector, Number, String - ..
        minFullScreenHeight: 0,           // Number, String - ..

        // Keyboard Navigation
        keyboardControl: true,            // Bool - Navigate your slider using left and right keys.

        // Auto Play
        auto: true,                       // Bool - ..
        autoControls: true,               // Bool - ..
        autoDelay: 5000,                  // Number - ..
        pauseOnHover: false,              // Bool - ..

        // Pagination
        directionNav: true,               // Bool - ..

        // Navigation
        paginationNav: true,              // Bool - ..
        navigationText: ['Prev', 'Next'], // Array, Bool(false) - ..

        // Keyboard
        keyboardNavigation: true,         // Bool - ..

        // Ken Burn
        kenBurn: true,                    // Bool - Dependency auto()
        kenBurnType: 'bar',               // String(bar, circle) -

        // Usability Features
        shuffle: false,                   // Bool - ..
        startAt: 0,                       // Number - Integer 0...
        smoothHeight: false,              // Bool - ..
        smoothHeightSpeed: 0,             // Bool, Number - ..
        startHeight: 0,                   // jQuery selector, Number, String - ..

        // TODO: make works, at this time disabled.
        responsive: false,                // Bool - ..

        // Preloader
        preloader: null,                  // jQuery Obj, null - ..


        // Callbacks API
        devBeforeInit:  function( element ) {},  // API: Before initialization callback.
        devAfterInit:   function( element ) {},  // API: After initialization callback.
        devBeforeSlide: function( data )    {},  // API: Before move callback.
        devAfterSlide:  function( data )    {},  // API: After move callback.
        devOnPause:     function( data )    {},  // API: Call this function while pressed pause.
        devOnPlay:      function( data )    {}   // API: Call this function while pressed play.
    };

})(jQuery, window, document, undefined);


// Do not go on about their desires, develop willpower.