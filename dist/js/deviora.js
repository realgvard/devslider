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
            pfxCSS3 = null;
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


                methods.checkBrowser();


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

                if (slider.options.keyboardNavigation) {
                    methods.setupKeyboardNavigation();
                }

                // TODO: Need check all cases with hover of different components.
                slider.$viewport.hover(function onMouseEnter() {
                    if (slider.options.auto && slider.options.pauseOnHover) {
                        if (!slider.animating && !slider.isPaused && !slider.isStopped) slider.pause();
                    }
                    slider.addClass(namespace + 'hovered');
                }, function onMouseLeave() {
                    if (slider.options.auto && slider.options.pauseOnHover) {
                        if (!slider.animating && slider.isPaused && !slider.isStopped) slider.play();
                    }
                    slider.removeClass(namespace + 'hovered');
                });

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

                // define load images
                if(!!slider.options.preloadImages) {
                    methods.loadElements(preloadElements, methods.start);
                } else {
                    methods.start();
                }
            },

            start: function() {
                // Remove preloader
                if(!!slider.options.preloadImages) {
                    slider.$preloader.remove();
                }

                // After build slider
                if (slider.options.auto) {
                    methods.autoPlay.start();
                }

                slider.initialized = true;
                slider.$viewport.addClass(shortNamespace + 'slider-initialised');

                // API: After init - Callback
                slider.options.devAfterInit();

                console.log(slider);
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


                // TODO: Collect all possible props in one object.
                slider.browser = {
                    isTouch: isTouch,
                    transitions: supportTransitions
                };
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

            getRotate: function( deg ) {
                var sender = {},
                    prop = pfxCSS3 + 'transform';

                sender[prop] = 'rotate(' + deg + 'deg)';

                return sender;
            },

            doEmptyTransition: function() {
                slider.css( methods.getEmptyTransition() );
            },

            doTransition: function( value ) {
                slider.css( methods.getTransition(value) );
            },

            doTranslate: function( posX ) {
                slider.css(methods.getTranslate( parseFloat(posX) ));
            },

            doCss2move : function( posX ) {
                slider.css('marginLeft', posX);
            },

            setupResponsive: function() {
                var startWidth = slider.sliderWidth,
                    startHeight = slider.$wrapper.height();

                $(window).resize(function() {
                    var width = this.innerWidth,
                        different = slider.sliderWidth / startWidth,
                        newHeight = startHeight * different;

                    slider.sliderWidth = width;

                    methods.shell.updateWidth( slider.sliderWidth );
                    if (newHeight <= startHeight) {
                        if (newHeight >= slider.options.minFullScreenHeight) {
                            methods.shell.updateHeight( newHeight );
                        } else {
                            methods.shell.updateHeight( slider.options.minFullScreenHeight );
                        }
                    }

                    methods.shell.setStartOnSlideAnimation( slider.currentSlide );
                });
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

                    // prod.
                    // var types = [
                    //     'touchstart.dev',
                    //     'touchmove.dev',
                    //     'touchend.dev'
                    // ];

                    // test
                    var types = [
                        'mousedown.dev',
                        'mousemove.dev',
                        'mouseup.dev'
                    ];

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

                    // TODO: Make event types on variables, it's make possible keep cross-browser.
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

                        // block drag img element, TODO: need disable
                        e.preventDefault();

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

                            // TODO: Make callback
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
                            $(document).off('touchmove.dev');
                        }

                        minSwipe = function() {
                            return slider.gesturesData.newRelativeX / 5;
                        };

                        maxSwipe = function() {
                            return slider.gesturesData.maximum + slider.gesturesData.newRelativeX / 5;
                        };

                        // base.newPosX = Math.max(Math.min(base.newPosX, minSwipe()), maxSwipe());
                        slider.gesturesData.newPosX = Math.max(Math.min(slider.gesturesData.newPosX, minSwipe()), maxSwipe());
                            // console.log(
                            //     ' newPosX: ' + slider.gesturesData.newPosX + '\n',
                            //     'minSwipe(): ' + minSwipe() + '\n',
                            //     'maxSwipe(): ' + maxSwipe() + '\n',
                            //     'newRelativeX: ' + slider.gesturesData.newRelativeX + '\n',
                            //     slider.gesturesData.maximum
                            //     );

                        if (slider.options.animation === 'slide') {
                        //     if (slider.browser.transition === true) {
                                methods.doTranslate(slider.gesturesData.newPosX);
                        //     } else {
                        //         methods.doCss2move(slider.gesturesData.newPosX);
                        //     }
                        }
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
                            slider.animationStore.execute({ currentSlide: target });
                        }

                        swapEvents('off');
                    }

                    slider.$viewport.on(slider.events.start, onTouchStart);
                }
            },

            shell: {
                // Setup default styles
                setup: function() {
                    if (slider.options.startHeight != 0) {
                        var startHeight = slider.options.startHeight.length != null ? slider.options.startHeight.height() : slider.options.startHeight;
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
                    // if (slider.options.fullScreen === true && slider.options.animation == 'fade') {
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

                    if (slider.options.animation === 'slide') {
                        slider.append( slider.$slides.first().clone(true).addClass('clone').attr('aria-hidden', 'true') )
                            .prepend( slider.$slides.last().clone(true).addClass('clone').attr('aria-hidden', 'true') );

                        if (slider.options.fullScreen === true) {
                            slider.sliderWidth = $(window).width();
                        } else {
                            slider.sliderWidth = slider.width();
                        }

                        methods.shell.updateWidth( slider.sliderWidth );
                        $(slider.options.slideSelector, slider)
                            .css({
                                'float': 'left',
                                // 'height': '100%',
                                'display': 'block'
                            });

                        slider.css({
                            'width': (100 * (slider.count + slider.cloneCount)) + '%'
                        });
                    } else if (slider.options.animation === 'fade') {
                        var maxHeight = Math.max.apply(Math, $(slider.$slides).map(function() {
                            return $(this).height();
                        }));

                        if (slider.options.fullScreen === false) {
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
                            'display': 'block',
                            'overflow': 'hidden',
                            'visibility': 'visible',
                            'left': 0,
                            'top': 0,
                            'z-index': 1,
                            'opacity': 0
                        });
                    }
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

                setStartOnSlideAnimation: function( index ) {
                    if(slider.options.animation === 'slide') {
                        var origin = -(slider.sliderWidth * (index + (slider.cloneCount / 2))) + 'px';

                        if (slider.browser.transitions) {
                            methods.doEmptyTransition();
                            methods.doTranslate( origin );
                        } else {
                            methods.doCss2move( origin );
                        }
                    }
                },

                setStartSlide: function( index ) {
                    methods.shell.setStartOnSlideAnimation(index);

                    if(slider.options.animation === 'fade') {
                        slider.$slides.eq(slider.currentSlide).css({ 'z-index': 2, 'opacity': 1 });
                    }
                },

                setActive: function() {
                    if (slider.prevItem !== slider.currentSlide) {
                        $(slider.options.slideSelector, slider).eq(slider.prevItem + slider.cloneCount / 2).removeClass(namespace + 'active-slide');
                    }
                    $(slider.options.slideSelector, slider).eq(slider.currentSlide + slider.cloneCount / 2).addClass(namespace + 'active-slide');
                },

                updateWidth: function( value ) {
                    $(slider.options.slideSelector, slider)
                        .css({
                            'width': value
                        });
                },

                // TODO: Improvement updateHeight() on resize, and init
                updateHeight: function( value ) {
                    // if (value >= slider.options.minFullScreenHeight) {
                        slider.$wrapper.height( value );
                    // } else {
                        // slider.$wrapper.height( slider.options.minFullScreenHeight );
                    // }
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

                        slider.animationStore.execute({ currentSlide: target });
                    });
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
                            slider.animationStore.execute({ currentSlide: target });
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
                            cancelAnimationFrame(slider.autoTimeout);
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
                    var $kenBurnContainer;

                    if (slider.options.kenBurnType === 'bar') {
                        $kenBurnContainer = $('<div class="' + namespace + 'ken-burn-wrapper">' +
                                                '<div class="' + namespace + 'ken-burn-progress"></div>' +
                                            '</div>');
                        slider.$kenBurn = $kenBurnContainer.find('.' + namespace + 'ken-burn-progress');
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

                        slider.$kenBurn = $kenBurnContainer.find('.' + namespace + 'ct-rotate');
                    }

                    methods.kenBurn.reset();
                    slider.$viewport.prepend( $kenBurnContainer );
                },

                update: function() {
                    var maxSize = 100,
                        percent = (methods.autoPlay.spendTime / slider.options.autoDelay) * maxSize;

                    methods.kenBurn.progress = percent.toFixed(2) * 1;

                    if (slider.options.kenBurnType === 'bar') {
                        slider.$kenBurn.css('width', methods.kenBurn.progress + '%');
                    }

                    if (slider.options.kenBurnType === 'circle') {
                        var valueInDeg = 360 * methods.kenBurn.progress / 100,
                            halfValue = 360 / 2;

                        if (valueInDeg >= halfValue) {
                            slider.$kenBurn.eq(0).css(methods.getRotate( -(halfValue - valueInDeg) ));
                        } else {
                            slider.$kenBurn.eq(1).css(methods.getRotate( valueInDeg ));
                        }
                    }
                },

                reset: function() {
                    if (methods.kenBurn.progress !== 0) {
                        methods.kenBurn.progress = 0;
                    }

                    if (slider.options.kenBurnType === 'bar') {
                        slider.$kenBurn.width(0);
                    }

                    if (slider.options.kenBurnType === 'circle') {
                        slider.$kenBurn.eq(0).css(methods.getRotate(0));
                        slider.$kenBurn.eq(1).css(methods.getRotate(0));
                    }

                }
            },

            setupKeyboardNavigation: function() {
                $(document).keydown(function(e) {
                    if (!slider.animating && slider.initialized) {

                        // Left -> prev()
                        if (e.keyCode == 37) {
                            publickMethods.prevSlide();
                        }

                        // Right -> next()
                        if (e.keyCode == 39) {
                            publickMethods.nextSlide();
                        }
                    }
                });
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

                    if (!!target.closest('.' + namespace + 'viewport')                &&
                        posibleNodeNames.toUpperCase().indexOf(target.nodeName) != -1) {
                        count += 1;

                        if (slider.options.preloadImages === 'visible') {
                            window.removeEventListener('error', onErrorEvent, true);
                            callback();
                        }
                    }
                }
            }
        };

        /*------------------------------------*\
          - PUBLIC METHODS -
        \*------------------------------------*/
        // TODO: refactor animate prop, on object call. like " var CSS3Transition = 'transition' "
        // Group animations in one object
        slider.animationStore = {
            slideSingleItem: function( params ) {
                if (slider.animating === false) {
                    var currentSlide = params.currentSlide,
                        origin;


                    // API: Before slide - Callback
                    slider.options.devBeforeSlide();

                    // catch animation first and last slide
                    if (slider.direction === 'next' && params.currentSlide === 0) {
                        origin = -(slider.sliderWidth * (slider.count + slider.cloneCount / 2)) + 'px';
                    } else if (slider.direction === 'prev' && params.currentSlide === slider.count - 1) {
                        origin = -(slider.sliderWidth * (slider.cloneCount / 2 - 1)) + 'px';
                    } else {
                        origin = -(slider.sliderWidth * (currentSlide + slider.cloneCount / 2)) + 'px';
                    }

                    slider.prevItem = slider.currentSlide;
                    slider.currentSlide = currentSlide;
                    slider.animating = true;

                    if (slider.browser.transitions) {
                        var transitionEnd = (slider.pfx) ? slider.pfx + 'TransitionEnd' : 'transitionend';

                        slider.animationStore.onStartAnimate();

                        methods.doTransition('transform ' + slider.options.speed + 'ms');
                        methods.doTranslate(origin);

                        slider.on(transitionEnd, function() {
                            slider.off(transitionEnd);
                            slider.animationStore.onEndAnimate();
                        });
                    } else {
                        slider.animationStore.onStartAnimate();

                        slider.animate({ 'marginLeft': origin }, {
                            duration: slider.options.speed,
                            specialEasing: {
                                'marginLeft': slider.options.easing
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

                    slider.prevItem = slider.currentSlide;
                    slider.currentSlide = currentSlide;
                    slider.animating = true;

                    if (slider.browser.transitions) {
                        var transitionEnd = (slider.pfx) ? slider.pfx + 'TransitionEnd' : 'transitionend';

                        slider.animationStore.onStartAnimate();
                        $currentItem.css(methods.getTransition('opacity ' + slider.options.speed + 'ms'));
                        $prevItem.css(methods.getTransition('opacity ' + slider.options.speed + 'ms'));

                        $prevItem.css({ 'opacity': 0, 'zIndex': 1 });
                        $currentItem.css({ 'opacity': 1, 'zIndex': 2 });

                        $currentItem.on(transitionEnd, function() {
                            slider.off(transitionEnd);
                            slider.animationStore.onEndAnimate();
                        });
                    } else {
                        slider.animationStore.onStartAnimate();
                        $prevItem.css('zIndex', 1).animate({ 'opacity': 0 }, slider.options.speed, slider.options.easing);

                        $currentItem.css('zIndex', 2)
                                    .animate({ 'opacity': 1 }, {
                                        duration: slider.options.speed,
                                        specialEasing: {
                                            'opacity': slider.options.easing
                                        },
                                        complete: function() {
                                            slider.animationStore.onEndAnimate();
                                        }
                                    });
                    }
                }
            },

            // TODO: Make getter setter on active / deactive elements
            onStartAnimate: function() {
                if (slider.options.smoothHeight) {
                    slider.setSmoothHeight();
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
                } else {
                    slider.$slides.eq(slider.prevItem).css( methods.getEmptyTransition() );
                    slider.$slides.eq(slider.currentSlide).css( methods.getEmptyTransition() );
                }

                // API: After slide - Callback
                slider.options.devAfterSlide();
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

        slider.setSmoothHeight = function() {
            slider.$viewport.animate({
                'height': slider.$slides.eq(slider.currentSlide).height()
            }, {
                duration: (slider.options.smoothHeightSpeed == 0) ? slider.options.speed : slider.options.smoothHeightSpeed,
                specialEasing: {
                    'height': slider.options.easing
                }
            });
        };

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
        animation: 'slide',               // String [slide, fade]:
        easing: 'swing',                  // String:
        speed: 600,                       // Integer: [0...]:
        preloadImages: 'visible',         // String: visible, all, false

        // Mouse events
        touch: true,                      // Bool: ..

        // Full screen
        fullScreen: false,                // Bool: ..
        fullScreenOffsetY: 0,             // [jQuery Obj, Int, String]: ..
        minFullScreenHeight: 0,           // [Int, String]: ..

        // Keyboard navigation
        keyboardControl: true,

        // Auto play
        auto: true,                       // Bool: ..
        autoDelay: 5000,                  // Integer [0...]: ..
        pauseOnHover: false,              // Bool: ..

        // Pagination
        directionNav: true,               // Bool: ..

        // Navigation
        paginationNav: true,              // Bool: ..
        navigationText: ['Prev', 'Next'], // Array, Bool [false]: ..

        // Keyboard
        keyboardNavigation: true,         // Bool: ..

        // kenBurn
        kenBurn: false,                   // Bool: Dependency auto()
        kenBurnType: 'bar',               // String: bar, circle

        // Usability features
        shuffle: false,                   // Bool: ..
        startAt: 0,                       // Integer [0...]:
        smoothHeight: false,              // Bool: ..
        smoothHeightSpeed: 0,             // [Bool, Int]: ..
        startHeight: 0,                   // [jQuery Obj, Int, String]: ..
        responsive: false,                // Bool: ..


        // Callbacks API
        devBeforeInit:  function( element ) {},  // API: Callback on ..
        devAfterInit:   function( element ) {},  // API: Callback on ..
        devBeforeSlide: function( data )    {},  // API: Callback on ..
        devAfterSlide:  function( data )    {},  // API: Callback on ..
        devOnPause:     function( data )    {},  // API: Callback on ..
        devOnPlay:      function( data )    {}   // API: Callback on ..
    };

})(jQuery, window, document, undefined);


var slider = $('.my-slider').deviora({
    auto: true,
    kenBurn: true,
    animation: 'fade',
    kenBurnType: 'circle',
    shuffle: false,
    autoDelay: 3500,
    speed: 1500,
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


// Do not go on about their desires, develop willpower.