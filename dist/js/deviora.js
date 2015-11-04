/**
 * Deviora slider
 */


;(function ($, window, document, undefined) {

    $.fn.deviora = function( options ) {

        options = $.extend( {}, $.fn.deviora.options, options );

        return this.each(function () {
            var $this = $(this);
            initSlider($this, options);
        });
    };

    function initSlider( container, settings ) {
        var slider = $(container);

        // Deviora: default settings
        var version = '1.0.0',
            shortNamespace = settings.namespace.replace(/[-|\s]+$/g, '');
            methods = {};

        // Store a reference to the slider object
        $.data(slider, shortNamespace + 'slider', slider);

        // Default collections methods slider.
        methods = {
            init: function( options ) {

                // Get current slide and make sure it is a number
                slider.currentSlide = parseInt((settings.startAt ? settings.startAt : 0), 10);

                // slider.containerSelector = settings.slideSelector.substr(0, settings.slideSelector.search(' '));
                // slider.container = $(slider);
                slider.slides = $(settings.slideSelector, slider);
                slider.count = slider.slides.length;


                // API: Before init - Callback
                settings.devBeforeInit();


                wrapUp.setup();

                // DirectionNav:
                if (settings.directionNav) {
                    directionNav.setup();
                }

                // ControlNav:
                if (settings.paginationNav) {
                    paginationNav.setup();
                }

                slider.before( slider.wrapper );
                slider.viewport.append( slider );

                slider.setup();
                slider.setActive();


                slider.viewport.addClass(shortNamespace + 'slider-initialised');
                // API: After init - Callback
                settings.devAfterInit();

                // console.log(
                //     slider.wrapper,
                //     slider.viewport,
                //     slider.directionNav,
                //     slider.paginationNav
                //     );

                // console.log(settings);
            },
            next: function() {},
            prev: function() {},
            update: function() {}
        };

        /*------------------------------------*\
          - MODULES -
        \*------------------------------------*/
        slider.setup = function() {
            $(settings.slideSelector, slider)
                .css({
                    'float': 'left',
                    'width': slider.width(),
                    // 'height': '100%',
                    'display': 'block'
                });

            slider.css('width', (100 * slider.count) + '%');
        };

        slider.setActive = function() {
            this.startAt

        };

        // Build our slider with HTML
        var wrapUp = {
            setup: function() {
                slider.wrapper =
                    $('<div class="' + settings.namespace + 'wrapper"></div>');
                slider.viewport =
                    $('<div class="' + settings.namespace + 'viewport"></div>');

                // Set private context
                // slider.wrapper.add(slider.viewport).css({
                slider.viewport.css({
                                "overflow": "hidden",
                                "position": "relative"
                            });

                slider.wrapper.append( slider.viewport );
            },

            update: function() {

            }
        };

        var directionNav = {
            setup: function() {
                slider.directionNav = $('<ul class="' + settings.namespace + 'direction-nav">' +
                                          '<li>' +
                                              '<a class="' + settings.namespace + 'nav-prev" href="#">' +
                                                  settings.prevText +
                                              '</a>' +
                                          '</li>' +
                                          '<li>' +
                                              '<a class="' + settings.namespace + 'nav-next" href="#">' +
                                                  settings.nextText +
                                              '</a>' +
                                          '</li>' +
                                      '</ul>');

                $(slider.directionNav).on('click', function( event ) {
                    event.preventDefault();

                    console.log('hola');

                });

                slider.wrapper.append( slider.directionNav );
            },

            update: function() {


            }
        };

        var paginationNav = {
            setup: function() {
                var fragment = document.createDocumentFragment(),
                    $list = $('<ol class="' + settings.namespace + 'pagination-nav"></ol>');

                if (slider.count > 1) {
                    for (var i = 0, len = slider.count; i < len; i++) {
                        var newItem = $('<li><a href="#">' + i + '</a></li>').get(0);
                        fragment.appendChild(newItem);
                    }
                }

                // Append all items
                $list[0].appendChild(fragment);

                slider.paginationNav = $list;
                slider.wrapper.append( slider.paginationNav );
            },
            update: function() {}
        };

        methods.init();
    }

    $.fn.deviora.options = {
        namespace: 'dev-',
        delay: 5000,
        startAt: 0,
        slideSelector: '> li',
        directionNav: true,
        paginationNav: true,
        prevText: 'Prev',
        nextText: 'Next',
        devAfterSlide: function() {},
        devBeforeSlide: function() {},
        devBeforeInit: function() {},
        devAfterInit: function() {}
    };

})( jQuery, window, document, undefined );


$('.my-slider').deviora({
  delay: 8000,
  startAt: 1,
  directionNav: true,
  paginationNav: true,

  devBeforeSlide: function() {
    console.info('devBeforeSlide');
  },

  devAfterInit: function() {
    console.info('devAfterInit');
  }
});

