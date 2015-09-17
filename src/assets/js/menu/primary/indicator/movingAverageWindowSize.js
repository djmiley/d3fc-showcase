(function(d3, fc, sc) {
    'use strict';

    sc.menu.primary.indicator.movingAverageWindowSize = function() {

        var dispatch = d3.dispatch('movingAverageWindowSizeChange');

        var movingAverageWindowSize = sc.menu.option('Moving Average Window Size ', 'movingAverageWindowSize', 10);

        var input = sc.menu.generator.inputBox(2, 100)
            .on('optionChange', function(indicatorWindowSize) {
                movingAverageWindowSize = sc.menu.option('Moving Average Window Size ',
                    'movingAverageWindowSize', indicatorWindowSize);
                dispatch.movingAverageWindowSizeChange(movingAverageWindowSize);
            });

        var movingAverageWindowSizeMenu = function(selection) {
            selection.each(function() {
                var selection = d3.select(this)
                    .datum([movingAverageWindowSize]);
                selection.call(input);
            });
        };

        return d3.rebind(movingAverageWindowSizeMenu, dispatch, 'on');
    };

})(d3, fc, sc);