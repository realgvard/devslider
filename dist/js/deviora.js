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
    }

    function initSlider( container, settings ) {
        var slider = $(container);

        // Deviora: default settings
        var namespace = settings.namespace,
        version = '1.0.0',
        methods = {};

        // Store a reference to the slider object
        // $.data($(this), "devslider", slider);

        // console.log(settings);

        // Default collections methods slider.
        methods = {
            init: function( options ) {

                // Get current slide and make sure it is a number
                slider.currentSlide = parseInt((settings.startAt ? settings.startAt : 0), 10);

                slider.containerSelector = settings.selector.substr(0,settings.selector.search(' '));
                slider.container = $(slider);
                slider.slides = $(settings.selector, slider);
                slider.count = slider.slides.length;
                console.dir(sliderFactory);

                sliderFactory.init.makeWrapper(slider);

            },
            next: function() {

            },
            prev: function() {

            },
            update: function() {

            },
        }

        slider.play = function() {

        }

        methods.init();
    }

    /*------------------------------------*\
      - MODULES -
    \*------------------------------------*/
    // Build our slider with HTML
    var sliderFactory = function( container ) {
        'use strict';
        var makeWrapper, makeBullets, makeArrows;


        makeWrapper = function() {
            container.wrapper =
            $('<div class="' + namespace + 'wrapper"></div>')

            // Set private context
            .css({
                "overflow": "hidden",
                "position": "relative"
            });

            container.wrap( container.wrapper );
        };

        makeBullets = function() {

        };

        makeArrows = function() {

        };

        var sliderFactory = {
            init: {
                makeWrapper: function() {
                    return makeWrapper();
                },
                makeBullets: function() {
                    return makeBullets();
                },
                makeArrows: function() {
                    return makeArrow();
                }
            }
        };

        return sliderFactory;
    };


    $.fn.deviora.options = {
        namespace: 'devslider-',
        delay: 5000,
        startAt: 0,
        selector: 'ul > li',
        prevText: 'Prev',
        nextText: 'Next',
        afterInit: function() {},
        beforeInit: function() {},
        init: function() {}
    }

})( jQuery, window, document );


$('.my-slider').deviora({
  delay: 8000,
  startAt: 1
});

