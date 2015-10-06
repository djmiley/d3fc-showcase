(function(d3, fc, sc) {
    'use strict';

    sc.menu.side = function() {

        var dispatch = d3.dispatch('primaryChartSeriesChange',
            'addIndicator',
            'configureIndicator',
            'removeIndicator');

        var candlestick = sc.menu.option('Candlestick', 'candlestick', sc.series.candlestick());
        var ohlc = sc.menu.option('OHLC', 'ohlc', fc.series.ohlc());
        var line = sc.menu.option('Line', 'line', fc.series.line());
        line.option.isLine = true;
        var point = sc.menu.option('Point', 'point', fc.series.point());
        var area = sc.menu.option('Area', 'area', fc.series.area());

        var primaryChartSeriesOptions = sc.menu.group()
            .option(candlestick, ohlc, line, point, area)
            .generator(sc.menu.generator.buttonGroup())
            .on('optionChange', function(series) {
                dispatch.primaryChartSeriesChange(series);
            });

        var indicatorMenu = sc.menu.indicator()
            .on('addIndicator', function(indicator) {
                dispatch.addIndicator(indicator);
            })
            .on('configureIndicator', function(indicator) {
                dispatch.configureIndicator(indicator);
            })
            .on('removeIndicator', function(indicator) {
                dispatch.removeIndicator(indicator);
            });

        var side = function(selection) {
            selection.each(function() {
                var model = selection.datum();
                primaryChartSeriesOptions.selectedOption(model.primary.series);
                selection.select('#series-buttons')
                    .call(primaryChartSeriesOptions);
                selection.select('#indicator-menu')
                    .datum(model)
                    .call(indicatorMenu);
            });
        };

        return d3.rebind(side, dispatch, 'on');
    };
})(d3, fc, sc);