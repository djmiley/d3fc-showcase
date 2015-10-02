(function(d3, fc, sc) {
    'use strict';

    function calculateCloseAxisTagPath(width, height) {
        var h2 = height / 2;
        return [
            [0, 0],
            [h2, -h2],
            [width, -h2],
            [width, h2],
            [h2, h2],
            [0, 0]
        ];
    }

    function produceAnnotatedTickValues(scale, annotation) {
        var annotatedTickValues = scale.ticks.apply(scale, []);

        var extent = scale.domain();
        for (var i = 0; i < annotation.length; i++) {
            if (annotation[i] > extent[0] && annotation[i] < extent[1]) {
                annotatedTickValues.push(annotation[i]);
            }
        }
        return annotatedTickValues;
    }

    function findTotalYExtent(visibleData, multiSeries) {
        var extent = [];

        for (var i = 0; i < multiSeries.length; i++) {
            var indicatorExtentAccessor = multiSeries[i].extentAccessor;
            var indicatorExtent = fc.util.extent(visibleData, indicatorExtentAccessor);
            extent[0] = d3.min([indicatorExtent[0], extent[0]]);
            extent[1] = d3.max([indicatorExtent[1], extent[1]]);
        }
        return extent;
    }

    function formatPrice(x) { return sc.model.selectedProduct.priceFormat(x); }

    sc.chart.primary = function() {

        var yAxisWidth = 45;
        var dispatch = d3.dispatch('viewChange', 'crosshairChange');

        var currentSeries = sc.menu.primary.option(sc.menu.option('Candlestick', 'candlestick',
            sc.series.candlestick()),
            [function(d) { return d.low; },
            function(d) { return d.high; }]);
        var currentIndicatorYValueAccessor = function(d) { return d.close; };
        var currentIndicators = [];


        var crosshairData = [];
        var crosshair = fc.tool.crosshair()
             .xLabel('')
             .yLabel('');

        var gridlines = fc.annotation.gridline()
            .yTicks(5)
            .xTicks(0);
        var closeLine = fc.annotation.line()
            .orient('horizontal')
            .value(function(d) { return d.close; })
            .label('');

        var multi = fc.series.multi()
            .key(function(series, index) {
                if (series.lineIdentifier) {
                    return series.lineIdentifier;
                }
                return series;
            })
            .series([gridlines, currentSeries.option, closeLine, crosshair])
            .mapping(function(series) {
                switch (series) {
                    case closeLine:
                        return [this.data[this.data.length - 1]];
                    case crosshair:
                        return crosshairData;
                    default:
                        return this.data;
                }
            });

        var xScale = fc.scale.dateTime();
        var yScale = d3.scale.linear();

        var primaryChart = fc.chart.cartesianChart(xScale, yScale)
            .xTicks(0)
            .yOrient('right')
            .yTickFormat(formatPrice)
            .margin({
                top: 0,
                left: 0,
                bottom: 0,
                right: yAxisWidth
            });

        // Create and apply the Moving Average
        var movingAverage = fc.indicator.algorithm.movingAverage();
        var exponentialMovingAverage = fc.indicator.algorithm.exponentialMovingAverage();
        var bollingerAlgorithm = fc.indicator.algorithm.bollingerBands();

        function updateMultiSeries(series) {
            var baseChart = [gridlines, currentSeries.option, closeLine];
            var indicators = currentIndicators.map(function(indicator) { return indicator.option; });
            series(baseChart.concat(indicators));
            // add crosshair last to have it on top
            series(series().concat(crosshair));
        }

        function updateIndicatorYValueAccessorUsed() {
            movingAverage.value(currentIndicatorYValueAccessor);
            exponentialMovingAverage.value(currentIndicatorYValueAccessor);
            bollingerAlgorithm.value(currentIndicatorYValueAccessor);
        }

        function setCrosshairSnap(series, data) {
            crosshair.snap(fc.util.seriesPointSnapXOnly(series, data))
                .on('trackingmove', function(crosshairData) {
                    dispatch.crosshairChange(crosshairData[0].datum);
                })
                .on('trackingend', function() {
                    dispatch.crosshairChange(undefined);
                });
        }

        function primary(selection) {
            var model = selection.datum();

            primaryChart.xDomain(model.viewDomain);

            updateIndicatorYValueAccessorUsed();
            updateMultiSeries(multi.series);
            setCrosshairSnap(currentSeries.option, model.data);

            movingAverage(model.data);
            exponentialMovingAverage(model.data);
            bollingerAlgorithm(model.data);

            // Scale y axis
            var visibleData = sc.util.domain.filterDataInDateRange(primaryChart.xDomain(), model.data);
            var yExtent = findTotalYExtent(visibleData, multi.series());
            // Add percentage padding either side of extreme high/lows
            var paddedYExtent = sc.util.domain.padYDomain(yExtent, 0.04);
            primaryChart.yDomain(paddedYExtent);

            // Find current tick values and add close price to this list, then set it explicitly below
            var latestPrice = model.data[model.data.length - 1].close;
            var tickValues = produceAnnotatedTickValues(yScale, [latestPrice]);
            primaryChart.yTickValues(tickValues)
                .yDecorate(function(s) {
                    s.selectAll('.tick')
                        .filter(function(d) { return d === latestPrice; })
                        .classed('closeLine', true)
                        .select('path')
                        .attr('d', function(d) {
                            return d3.svg.area()(calculateCloseAxisTagPath(yAxisWidth, 14));
                        });
                });

            // Redraw
            primaryChart.plotArea(multi);
            selection.call(primaryChart);

            var zoom = sc.behavior.zoom()
                .scale(xScale)
                .trackingLatest(selection.datum().trackingLatest)
                .on('zoom', function(domain) {
                    dispatch.viewChange(domain);
                });
            selection.select('.plot-area')
                .call(zoom);
        }

        d3.rebind(primary, dispatch, 'on');

        primary.changeSeries = function(series) {
            currentSeries = series;
            return primary;
        };

        primary.changeYValueAccessor = function(yValueAccessor) {
            currentIndicatorYValueAccessor = yValueAccessor.option;
            return primary;
        };

        primary.toggleIndicator = function(indicator) {
            if (currentIndicators.indexOf(indicator.option) !== -1 && !indicator.toggled) {
                currentIndicators.splice(currentIndicators.indexOf(indicator.option), 1);
            } else if (indicator.toggled) {
                currentIndicators.push(indicator.option);
            }
            return primary;
        };

        return primary;
    };
})(d3, fc, sc);
