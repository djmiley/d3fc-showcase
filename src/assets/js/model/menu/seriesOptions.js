(function(d3, fc, sc) {
    'use strict';

    sc.model.menu.seriesOptions = function() {

        var candlestick = sc.series.candlestick();
        candlestick.isPadded = true;
        var candlestickOption = sc.menu.option('Candlestick', 'candlestick', candlestick);
        candlestickOption.isSelected = true;

        var ohlc = fc.series.ohlc();
        ohlc.isPadded = true;

        // TODO: Could 'isLine' go on primary chart series model instead?
        var line = fc.series.line();
        line.isLine = true;

        var point = fc.series.point();
        point.isPadded = true;

        return [
            candlestickOption,
            sc.menu.option('OHLC', 'ohlc', ohlc),
            sc.menu.option('Line', 'line', line),
            sc.menu.option('Point', 'point', point),
            sc.menu.option('Area', 'area', fc.series.area())
        ];
    };

})(d3, fc, sc);
