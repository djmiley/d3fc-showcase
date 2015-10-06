(function(d3, fc, sc) {
    'use strict';

    sc.menu.indicatorConfig = function() {

        var dispatch = d3.dispatch('configureIndicator');

        var open = sc.menu.option('Open', 'open', function(d) { return d.open; });
        var high = sc.menu.option('High', 'high', function(d) { return d.high; });
        var low = sc.menu.option('Low', 'low', function(d) { return d.low; });
        var close = sc.menu.option('Close', 'close', function(d) { return d.close; });

        var dataJoin = fc.util.dataJoin()
            .selector('div')
            .element('div');

        var indicatorConfig = function(selection) {
            selection.each(function() {
                var indicator = selection.datum();

                if (indicator.option.config.yValueAccessor) {
                    var yValueAccessorConfig = sc.menu.group()
                        .option(open, high, low, close)
                        .generator(sc.menu.generator.dropdownGroup())
                        .selectedOption(indicator.option.config.yValueAccessor)
                        .on('optionChange', function(yValueAccessor) {
                            indicator.option.config.yValueAccessor = yValueAccessor;
                            dispatch.configureIndicator(indicator);
                        });
                    dataJoin(selection, [indicator.option.config.yValueAccessor])
                        .attr('id', 'y-value-accessor')
                        .call(yValueAccessorConfig);
                }
            });
        };

        return d3.rebind(indicatorConfig, dispatch, 'on');
    };
})(d3, fc, sc);