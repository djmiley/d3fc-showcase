(function(d3, fc, sc) {
    'use strict';

    sc.menu.primary.indicator.bollingerBandsWindowSize = function() {

        var dispatch = d3.dispatch('bollingerBandsWindowSizeChange');

        var bollingerBandsWindowSize = sc.menu.option('Bollinger Bands Window Size ', 'bollingerBandsWindowSize', 10);

        var input = sc.menu.generator.inputBox(2, 100)
            .on('optionChange', function(indicatorWindowSize) {
                bollingerBandsWindowSize = sc.menu.option('Bollinger Bands Window Size ',
                    'bollingerBandsWindowSize', indicatorWindowSize);
                dispatch.bollingerBandsWindowSizeChange(bollingerBandsWindowSize);
            });

        var bollingerBandsWindowSizeMenu = function(selection) {
            selection.each(function() {
                var selection = d3.select(this)
                    .datum([bollingerBandsWindowSize]);
                selection.call(input);
            });
        };

        return d3.rebind(bollingerBandsWindowSizeMenu, dispatch, 'on');
    };

})(d3, fc, sc);