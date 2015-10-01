(function(d3, fc, sc) {
    'use strict';

    sc.chart.nav = function() {
        var dispatch = d3.dispatch('viewChange');

        var viewScale = fc.scale.dateTime();

        var area = fc.series.area()
            .yValue(function(d) { return d.open; });
        var line = fc.series.line()
            .yValue(function(d) { return d.open; });
        var brush = d3.svg.brush();
        var navMulti = fc.series.multi().series([area, line, brush])
            .mapping(function(series) {
                if (series === brush) {
                    brush.extent([
                        [viewScale.domain()[0], navTimeSeries.yDomain()[0]],
                        [viewScale.domain()[1], navTimeSeries.yDomain()[1]]
                    ]);
                }
                return this.data;
            });

        var navTimeSeries = fc.chart.linearTimeSeries()
            .yTicks(0)
            .yOrient('right');

        function nav(selection) {
            var model = selection.datum();

            viewScale.domain(model.viewDomain)
                .range([0, fc.util.innerDimensions(selection.node()).width]);

            var yExtent = fc.util.extent(
                sc.util.domain.filterDataInDateRange(fc.util.extent(model.data, 'date'), model.data),
                ['low', 'high']);

            navTimeSeries.xDomain(fc.util.extent(model.data, 'date'))
                .yDomain(yExtent);

            // Allow to zoom using mouse, but disable panning
            var zoom = sc.behavior.zoom()
                .scale(viewScale)
                .minimumViewableTime(5 * model.period)
                .trackingLatest(model.trackingLatest)
                .allowPan(false)
                .on('zoom', function(domain) {
                    dispatch.viewChange(domain);
                });

            brush.on('brush', function() {
                dispatch.viewChange([brush.extent()[0][0], brush.extent()[1][0]]);
            })
            .on('brushend', function() {
                var minimumViewableTime = zoom.minimumViewableTime();
                var brushTimeExtent = sc.util.timeExtent([brush.extent()[0][0], brush.extent()[1][0]]);
                if (brushTimeExtent === 0) {
                    dispatch.viewChange(sc.util.domain.centerOnDate(viewScale.domain(),
                        model.data, brush.extent()[0][0]));
                } else if (brushTimeExtent < minimumViewableTime) {
                    var centeredDate = new Date((brush.extent()[1][0].getTime() +
                        brush.extent()[0][0].getTime()) / 2);
                    var centeredDomain = [d3.time.second.offset(centeredDate, -minimumViewableTime / 2),
                        d3.time.second.offset(centeredDate, +minimumViewableTime / 2)];
                    dispatch.viewChange(sc.util.domain.centerOnDate(centeredDomain, model.data, centeredDate));               
                }
            });

            navTimeSeries.plotArea(navMulti);
            selection.call(navTimeSeries);

            selection.call(zoom);
        }

        d3.rebind(nav, dispatch, 'on');

        return nav;
    };
})(d3, fc, sc);