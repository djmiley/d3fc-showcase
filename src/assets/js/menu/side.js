(function(d3, fc, sc) {
    'use strict';

    sc.menu.side = function() {

        var dispatch = d3.dispatch('primaryChartSeriesChange',
            'primaryChartYValueAccessorChange',
            'primaryChartIndicatorChange',
            'bollingerBandsWindowSizeChange',
            'movingAverageWindowSizeChange',
            'secondaryChartChange');

        var primaryChartSeriesOptions = sc.menu.primary.series()
            .on('primaryChartSeriesChange', function(series) {
                dispatch.primaryChartSeriesChange(series);
            });

        var primaryChartYValueAccessorOptions = sc.menu.primary.yValueAccessor()
            .on('primaryChartYValueAccessorChange', function(yValueAccessor) {
                dispatch.primaryChartYValueAccessorChange(yValueAccessor);
            });

        var primaryChartIndicatorOptions = sc.menu.primary.indicators()
            .on('primaryChartIndicatorChange', function(toggledIndicator) {
                dispatch.primaryChartIndicatorChange(toggledIndicator);
            });

        var bollingerBandsWindowSizeInput = sc.menu.primary.indicator.bollingerBandsWindowSize()
            .on('bollingerBandsWindowSizeChange', function(bollingerBandsWindowSize) {
                dispatch.bollingerBandsWindowSizeChange(bollingerBandsWindowSize);
            });

        var movingAverageWindowSizeInput = sc.menu.primary.indicator.movingAverageWindowSize()
            .on('movingAverageWindowSizeChange', function(movingAverageWindowSize) {
                dispatch.movingAverageWindowSizeChange(movingAverageWindowSize);
            });

        var secondaryChartOptions = sc.menu.secondary.chart()
            .on('secondaryChartChange', function(toggledChart) {
                dispatch.secondaryChartChange(toggledChart);
            });

        var side = function(selection) {
            selection.each(function() {
                var selection = d3.select(this);
                selection.select('#series-buttons')
                    .call(primaryChartSeriesOptions);
                selection.select('#y-value-accessor-buttons')
                    .call(primaryChartYValueAccessorOptions);
                selection.select('#indicator-buttons')
                    .call(primaryChartIndicatorOptions);
                selection.select('#bollinger-bands-window-size-input')
                    .call(bollingerBandsWindowSizeInput);
                selection.select('#moving-average-window-size-input')
                    .call(movingAverageWindowSizeInput);
                selection.select('#secondary-chart-buttons')
                    .call(secondaryChartOptions);
            });
        };

        return d3.rebind(side, dispatch, 'on');
    };
})(d3, fc, sc);