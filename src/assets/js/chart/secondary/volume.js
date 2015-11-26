(function(d3, fc, sc) {
    'use strict';

    sc.chart.secondary.volume = function() {
        var dispatch = d3.dispatch(sc.event.viewChange);
        var volumeBar = fc.series.bar()
            .yValue(function(d) { return d.volume; });

        var chart = sc.chart.secondary.base()
            .series([volumeBar])
            .yTicks(4)
            .on(sc.event.viewChange, function(domain) {
                dispatch[sc.event.viewChange](domain);
            });

        function volume(selection) {
            selection.each(function(model) {
                var maxYExtent = d3.max(model.data, function(d) { return d3.max([d.volume]); });
                var minYExtent = d3.min(model.data, function(d) { return d3.min([d.volume]); });
                var paddedYExtent = sc.util.domain.padYDomain([minYExtent, maxYExtent], 0.04);
                chart.yTickFormat(model.product.volumeFormat)
                    .trackingLatest(model.trackingLatest)
                    .padding(model.padding)
                    .xDomain(model.viewDomain)
                    .yDomain(paddedYExtent);

                selection.datum(model.data)
                    .call(chart);
            });
        }

        d3.rebind(volume, dispatch, 'on');

        volume.dimensionChanged = function(container) {
            chart.dimensionChanged(container);
        };

        return volume;
    };
})(d3, fc, sc);
