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

    function findTotalYExtent(visibleData, currentSeries, currentIndicators) {
        var extentAccessor;
        switch (currentSeries.valueString) {
            case 'candlestick':
            case 'ohlc':
                extentAccessor = [currentSeries.option.yLowValue(), currentSeries.option.yHighValue()];
                break;
            case 'line':
            case 'point':
                extentAccessor = currentSeries.option.yValue();
                break;
            case 'area' :
                extentAccessor = currentSeries.option.y1Value();
                break;
            default:
                throw new Error('Main series given to chart does not have expected interface');
        }
        var extent = fc.util.extent(visibleData, extentAccessor);

        if (currentIndicators.length) {
            var indicators = currentIndicators.map(function(indicator) { return indicator.valueString; });
            var movingAverageShown = (indicators.indexOf('moving-average') !== -1);
            var bollingerBandsShown = (indicators.indexOf('bollinger') !== -1);
            if (bollingerBandsShown) {
                var bollingerBandsVisibleDataObject = visibleData.map(function(d) { return d.bollingerBands; });
                var bollingerBandsExtent = fc.util.extent(bollingerBandsVisibleDataObject, ['lower', 'upper']);
                extent[0] = d3.min([bollingerBandsExtent[0], extent[0]]);
                extent[1] = d3.max([bollingerBandsExtent[1], extent[1]]);
            }
            if (movingAverageShown) {
                var movingAverageExtent = fc.util.extent(visibleData, 'movingAverage');
                extent[0] = d3.min([movingAverageExtent[0], extent[0]]);
                extent[1] = d3.max([movingAverageExtent[1], extent[1]]);
            }
            if (!(movingAverageShown || bollingerBandsShown)) {
                throw new Error('Unexpected indicator type');
            }
        }
        return extent;
    }

    sc.chart.primary = function() {
        var yAxisWidth = 45;

        var dispatch = d3.dispatch('viewChange');

        var currentSeries = sc.menu.option('Candlestick', 'candlestick', sc.series.candlestick());
        var currentIndicators = [];

        var gridlines = fc.annotation.gridline()
            .yTicks(5)
            .xTicks(0);
        var closeLine = fc.annotation.line()
            .orient('horizontal')
            .value(function(d) { return d.close; })
            .label('');

        var multi = fc.series.multi()
            .key(function(series, index) {
                if (series.isLine) {
                    return index;
                }
                return series;
            })
            .series([gridlines, currentSeries.option, closeLine])
            .mapping(function(series) {
                switch (series) {
                    case closeLine:
                        return [this.data[this.data.length - 1]];
                    default:
                        return this.data;
                }
            });

        var priceFormat = d3.format('.2f');

        var xScale = fc.scale.dateTime();
        var yScale = d3.scale.linear();

        var primaryChart = fc.chart.cartesianChart(xScale, yScale)
            .xTicks(0)
            .yOrient('right')
            .yTickFormat(priceFormat)
            .margin({
                top: 0,
                left: 0,
                bottom: 0,
                right: yAxisWidth
            });

        var createForeground = sc.chart.foreground()
            .rightMargin(yAxisWidth);

        // Create and apply the Moving Average
        var movingAverageAlgorithm = fc.indicator.algorithm.movingAverage();
        var bollingerAlgorithm = fc.indicator.algorithm.bollingerBands();

        function updatePrimaryModel(model) {
            currentSeries = model.primary.series;
            currentIndicators = model.indicators.filter(function(indicator) { return !indicator.option.isChart; });
            updateIndicators(currentIndicators);
            movingAverageAlgorithm(model.data);
            bollingerAlgorithm(model.data);
        }

        function updateIndicators(indicators) {
            var keyedIndicators = indicators.map(function(indicator) { return indicator.valueString; });
            if (keyedIndicators.indexOf('moving-average') !== -1) {
                updateMovingAverageConfig(indicators[keyedIndicators.indexOf('moving-average')]
                    .option.config);
            }
            if (keyedIndicators.indexOf('bollinger') !== -1) {
                updateBollingerBandsConfig(indicators[keyedIndicators.indexOf('bollinger')]
                    .option.config);
            }
        }

        function updateMovingAverageConfig(config) {
            movingAverageAlgorithm.value(config.yValueAccessor.option);
        }

        function updateBollingerBandsConfig(config) {
            bollingerAlgorithm.value(config.yValueAccessor.option);
        }

        function updatedMultiSeries() {
            var baseChart = [gridlines, currentSeries.option, closeLine];
            var indicators = currentIndicators.map(function(indicator) { return indicator.option; });
            var multiSeries = baseChart.concat(indicators);
            return multiSeries;
        }

        function primary(selection) {
            var model = selection.datum();
            updatePrimaryModel(model);
            multi.series(updatedMultiSeries());

            primaryChart.xDomain(model.viewDomain);

            // Scale y axis
            var visibleData = sc.util.domain.filterDataInDateRange(primaryChart.xDomain(), model.data);
            var yExtent = findTotalYExtent(visibleData, currentSeries, currentIndicators);
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

            selection.call(createForeground);
            var foreground = selection.select('rect.foreground');

            var zoom = sc.behavior.zoom()
                .scale(xScale)
                .trackingLatest(selection.datum().trackingLatest)
                .on('zoom', function(domain) {
                    dispatch.viewChange(domain);
                });

            foreground.call(zoom);
        }

        d3.rebind(primary, dispatch, 'on');

        return primary;
    };
})(d3, fc, sc);