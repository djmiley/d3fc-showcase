(function(d3, fc, sc) {
    'use strict';

    sc.chart.secondary.base = function() {
        var dispatch = d3.dispatch(sc.event.viewChange);
        var xScale = fc.scale.dateTime();
        var yScale = d3.scale.linear();
        var padding = 0;
        var trackingLatest = true;
        var yAxisWidth = 60;

        var multi = fc.series.multi();
        var chart = fc.chart.cartesian(xScale, yScale)
            .plotArea(multi)
            .xTicks(0)
            .yOrient('right')
            .margin({
                top: 0,
                left: 0,
                bottom: 0,
                right: yAxisWidth
            });
        var zoomWidth;

        function secondary(selection) {
            selection.each(function(data) {
                var container = d3.select(this)
                    .call(chart);

                var zoom = sc.behavior.zoom(zoomWidth)
                    .scale(xScale)
                    .padding(padding)
                    .trackingLatest(trackingLatest)
                    .on('zoom', function(domain) {
                        dispatch[sc.event.viewChange](domain);
                    });

                container.select('.plot-area-container')
                    .datum({data: selection.datum()})
                    .call(zoom);
            });
        }

        secondary.padding = function(x) {
            if (!arguments.length) {
                return padding;
            }
            padding = x;
            return secondary;
        };

        secondary.trackingLatest = function(x) {
            if (!arguments.length) {
                return trackingLatest;
            }
            trackingLatest = x;
            return secondary;
        };

        d3.rebind(secondary, dispatch, 'on');
        d3.rebind(secondary, multi, 'series', 'mapping', 'decorate');
        d3.rebind(secondary, chart, 'yTickValues', 'yTickFormat', 'yTicks', 'xDomain', 'yDomain');

        secondary.dimensionChanged = function(container) {
            zoomWidth = parseInt(container.style('width')) - yAxisWidth;
        };

        return secondary;
    };
})(d3, fc, sc);
