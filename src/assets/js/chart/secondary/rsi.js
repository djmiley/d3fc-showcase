(function(d3, fc, sc) {
    'use strict';

    sc.chart.secondary.rsi = function() {
        var dispatch = d3.dispatch(sc.event.viewChange);
        var renderer = fc.indicator.renderer.relativeStrengthIndex();
        var algorithm = fc.indicator.algorithm.relativeStrengthIndex();
        var tickValues = [renderer.lowerValue(), 50, renderer.upperValue()];

        var chart = sc.chart.secondary.base()
            .series([renderer])
            .yTickValues(tickValues)
            .on(sc.event.viewChange, function(domain) {
                dispatch[sc.event.viewChange](domain);
            });

        function rsi(selection) {
            var model = selection.datum();
            algorithm(model.data);

            chart.trackingLatest(model.trackingLatest)
                .padding(model.padding)
                .xDomain(model.viewDomain)
                .yDomain([0, 100]);

            selection.datum(model.data)
                .call(chart);
        }

        d3.rebind(rsi, dispatch, 'on');

        rsi.dimensionChanged = function(container) {
            chart.dimensionChanged(container);
        };

        return rsi;
    };
})(d3, fc, sc);
