/**
 * Deviora slider
 */


;(function ( $, window, document, undefined ) {
    function slider( container, settings ) {
        var slider = $(container);

        // Deviora: default settings
        var version = '1.0.0',
            namespace = settings.namespace,
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
                slider.currentItem = parseInt(settings.startAt ? settings.startAt : 0, 10);
                slider.prevItem = slider.currentItem;

                // slider.containerSelector = settings.slideSelector.substr(0, settings.slideSelector.search(' '));
                slider.$slides = $(settings.slideSelector, slider);
                slider.count = slider.$slides.length;
                slider.lastItem = slider.count - 1;
                slider.startTimeout = null;
                slider.speed = settings.speed;
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
                        slider.css2 = 'marginLeft';
                        return false;
                    }
                })();
                // slider.animationEnd = (slider.pfx) ? slider.pfx + 'AnimationEnd' : 'animationend';

                console.log(slider, $.data('devslider'));
                // API: Before init - Callback
                settings.devBeforeInit();

                slider.wrapup.setup();

                // DirectionNav:
                if (settings.directionNav) methods.directionNav.setup();

                // ControlNav:
                if (settings.paginationNav) methods.paginationNav.setup();

                slider.before( slider.$wrapper );
                slider.$viewport.append( slider );

                slider.setup();
                slider.setActive();


                slider.$viewport.addClass(shortNamespace + 'slider-initialised');
                // API: After init - Callback
                settings.devAfterInit();
            },

            directionNav: {
                setup: function() {
                    var directionNavScaffold =
                        $('<ul class="' + namespace + 'direction-nav">' +
                            '<li class="' + namespace + 'nav-prev">' +
                                '<a class="' + namespace + 'prev" href="#">' +
                                    (settings.navigationText[0] || '') +
                                '</a>' +
                            '</li>' +
                            '<li class="' + namespace + 'nav-next">' +
                                '<a class="' + namespace + 'next" href="#">' +
                                    (settings.navigationText[1] || '') +
                                '</a>' +
                            '</li>' +
                        '</ul>');

                    slider.$wrapper.append( directionNavScaffold );
                    slider.$directionNav = $('.' + namespace + 'direction-nav li a', slider.$wrapper);

                    $(slider.$directionNav).on(eventType, function( event ) {
                        event.preventDefault();
                        var target;

                        target = ( $(this).hasClass(namespace + 'prev') ) ? slider.getIndexCalcDir('prev') : slider.getIndexCalcDir('next');

                        slider.animationStore.doAnimation({currentItem: target});


                    });


                },
                update: function() {


                }
            },

            paginationNav: {
                setup: function() {
                    var fragment = document.createDocumentFragment(),
                        $list = $('<ol class="' + namespace + 'pagination-nav"></ol>');

                    if (slider.count > 1) {
                        for (var i = 0, len = slider.count; i < len; i++) {
                            var newItem = $('<li><a href="#">' + i + '</a></li>').get(0);
                            fragment.appendChild(newItem);
                        }
                    }

                    // Append all items
                    $list[0].appendChild(fragment);

                    slider.$paginationNav = $list;
                    slider.$wrapper.append( slider.$paginationNav );
                },
                update: function() {}
            },

            next: function() {},
            prev: function() {},
            update: function() {}
        };

        /*------------------------------------*\
          - METHODS -
        \*------------------------------------*/
        slider.setup = function() {
            slider.addClass(namespace + 'slides');

            $(settings.slideSelector, slider)
                .css({
                    'float': 'left',
                    'width': slider.width(),
                    'display': 'block'
                });

            slider.css({
                'width': (100 * slider.count) + '%'
            });
        };

        // Build our slider with HTML
        slider.wrapup = {
            setup: function() {
                slider.$wrapper =
                    $('<div class="' + namespace + 'wrapper"></div>');
                slider.$viewport =
                    $('<div class="' + namespace + 'viewport"></div>');

                // Set private context
                slider.$viewport.css({
                                "overflow": "hidden",
                                "position": "relative"
                            });

                slider.$wrapper.append( slider.$viewport );
            },

            update: function() {

            }
        };

        // Group type animation in on object
        slider.animationStore = {
            slideSingleItem: function(currentItem) {
                var widthViewport = slider.width() / slider.count,
                    origin = -(widthViewport * currentItem) + 'px';

                if (slider.animating == false) {
                    slider.prevItem = slider.currentItem;
                    slider.currentItem = currentItem;
                    slider.animating = true;

                    if (slider.transitions) {
                        var pfxCSS3 = (slider.pfx) ? '-' + slider.pfx.toLowerCase() + '-' : '',
                            CSS3Transition = 'transition',
                            CSS3Transform = pfxCSS3 + 'transform',
                            transitionEnd = (slider.pfx) ? slider.pfx + 'TransitionEnd' : 'transitionend';

                        slider.css(CSS3Transition, 'transform ' + slider.speed + 'ms');
                        slider.css(CSS3Transform, 'translate3d(' + origin + ', 0, 0)');

                        slider.on(transitionEnd, function() {
                            console.log('end');
                            slider.setActive();
                            slider.animating = false;
                            slider.off(transitionEnd);
                        });
                    } else {
                        slider.animate({ 'marginLeft': origin }, slider.speed, slider.easing, function animationEnd() {
                            console.log('end');
                            slider.setActive();
                            slider.animating = false;
                        });
                    }
                }
            },

            fadeSingleItem: function () {

            },

            // Dispatcher animationLibrary ..
            doAnimation: function(args) {
                this.slideSingleItem(args.currentItem);
            }
        };

        slider.getIndexCalcDir = function(dir) {
          slider.direction = dir;
          if (dir === 'next') {
            return (slider.currentItem === slider.lastItem) ? 0 : slider.currentItem + 1;
          } else {
            return (slider.currentItem === 0) ? slider.lastItem : slider.currentItem - 1;
          }
        };

        slider.setActive = function () {
            if (slider.prevItem != slider.currentItem) {
                $(settings.slideSelector, slider).eq(slider.prevItem).removeClass(namespace + 'active-slide');
            }
            $(settings.slideSelector, slider).eq(slider.currentItem).addClass(namespace + 'active-slide');
            console.log('active');
        };

        // Run initializer
        methods.init();
    }

    $.fn.deviora = function( options ) {
        options = $.extend( {}, $.fn.deviora.options, options );

        return this.each(function () {
            slider(this, options);
        });
    };

    $.fn.deviora.options = {
        namespace: 'dev-',                // Support type: String, Integer
        delay: 5000,                      // Support type: Integer [0...]
        speed: 600,                       // Support type: Integer [0...]
        animation: 'slide',               // Support type: String [slide, fade, pretty]
        easing: 'ease',                   // Support type: String
        startAt: 0,                       // Support type: Integer [0...]
        slideSelector: '> li',            // Support type: String
        directionNav: true,               // Support type: Bool [true, false]
        paginationNav: true,              // Support type: Bool [true, false]
        touch: true,                      // Support type: Bool [true, false]
        navigationText: ['Prev', 'Next'], // Support type: Array
        devAfterSlide: function() {},     // API: Callback
        devBeforeSlide: function() {},    // API: Callback
        devBeforeInit: function() {},     // API: Callback
        devAfterInit: function() {}       // API: Callback
    };

})(jQuery, window, document, undefined);


var sliders = $('.my-slider').deviora({
  delay: 8000,
  startAt: 0,
  directionNav: true,
  paginationNav: true,

  devBeforeSlide: function() {
    // console.info('devBeforeSlide');
  },

  devAfterInit: function() {
    // console.info('devAfterInit');
  }
});

// console.log(sliders.data('devslider'));