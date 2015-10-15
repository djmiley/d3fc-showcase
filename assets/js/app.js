(function() {
    'use strict';

    // Crazyness to get a strict mode compliant reference to the global object
    var global = null;
    /* jshint ignore:start */
    global = (1, eval)('this');
    /* jshint ignore:end */

    global.sc = {
        behavior: {},
        chart: {},
        data: {
            feed: {
                coinbase: {}
            }
        },
        menu: {
            data: {},
            generator: {},
            primary: {},
            secondary: {}
        },
        series: {},
        util: {
            domain: {}
        }
    };
})();
(function(d3, fc, sc) {
    'use strict';

    sc.chart.foreground = function() {
        var topMargin = 0,
            rightMargin = 0,
            bottomMargin = 0,
            leftMargin = 0;

        var dataJoin = fc.util.dataJoin()
            .selector('rect.foreground')
            .element('rect')
            .attr('class', 'foreground');

        function foreground(selection) {
            dataJoin(selection, [selection.datum()])
                .layout({
                    position: 'absolute',
                    top: topMargin,
                    right: rightMargin,
                    bottom: bottomMargin,
                    left: leftMargin
                });

            selection.layout();
        }

        foreground.topMargin = function(x) {
            if (!arguments.length) {
                return topMargin;
            }
            topMargin = x;
            return foreground;
        };

        foreground.rightMargin = function(x) {
            if (!arguments.length) {
                return rightMargin;
            }
            rightMargin = x;
            return foreground;
        };

        foreground.bottomMargin = function(x) {
            if (!arguments.length) {
                return bottomMargin;
            }
            bottomMargin = x;
            return foreground;
        };

        foreground.leftMargin = function(x) {
            if (!arguments.length) {
                return leftMargin;
            }
            leftMargin = x;
            return foreground;
        };

        return foreground;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.chart.macd = function() {
        var yAxisWidth = 45;

        var dispatch = d3.dispatch('viewChange');

        var xScale = fc.scale.dateTime();

        var macdChart = fc.chart.cartesianChart(xScale, d3.scale.linear())
            .xTicks(0)
            .yOrient('right')
            .margin({
                top: 0,
                left: 0,
                bottom: 0,
                right: yAxisWidth
            });

        var zero = fc.annotation.line()
            .value(0)
            .label('');
        var macdRenderer = fc.indicator.renderer.macd();
        var multi = fc.series.multi()
            .series([zero, macdRenderer])
            .mapping(function(series) {
                if (series === zero) {
                    return [0];
                }
                return this.data;
            })
            .decorate(function(g) {
                g.enter()
                    .attr('class', function(d, i) {
                        return ['multi zero', 'multi'][i];
                    });
            });

        var createForeground = sc.chart.foreground()
            .rightMargin(yAxisWidth);

        var macdAlgorithm = fc.indicator.algorithm.macd();

        function macd(selection) {
            var model = selection.datum();

            macdAlgorithm(model.data);

            macdChart.xDomain(model.viewDomain);

            // Add percentage padding either side of extreme high/lows
            var maxYExtent = d3.max(model.data, function(d) {
                return Math.abs(d.macd.macd);
            });
            var paddedYExtent = sc.util.domain.padYDomain([-maxYExtent, maxYExtent], 0.04);
            macdChart.yDomain(paddedYExtent);

            // Redraw
            macdChart.plotArea(multi);
            selection.call(macdChart);

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

        d3.rebind(macd, dispatch, 'on');

        return macd;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.chart.nav = function() {
        var dispatch = d3.dispatch('viewChange');

        var navChart = fc.chart.cartesianChart(fc.scale.dateTime(), d3.scale.linear())
            .yTicks(0)
            .margin({
                top: 0,
                left: 0,
                bottom: 20,
                right: 0
            });

        var viewScale = fc.scale.dateTime();

        var area = fc.series.area()
            .yValue(function(d) { return d.close; });
        var line = fc.series.line()
            .yValue(function(d) { return d.close; });
        var brush = d3.svg.brush();
        var navMulti = fc.series.multi().series([area, line, brush])
            .mapping(function(series) {
                if (series === brush) {
                    brush.extent([
                        [viewScale.domain()[0], navChart.yDomain()[0]],
                        [viewScale.domain()[1], navChart.yDomain()[1]]
                    ]);
                }
                return this.data;
            });

        function nav(selection) {
            var model = selection.datum();

            viewScale.domain(model.viewDomain)
                .range([0, fc.util.innerDimensions(selection.node()).width]);

            var yExtent = fc.util.extent(
                sc.util.domain.filterDataInDateRange(fc.util.extent(model.data, 'date'), model.data),
                ['low', 'high']);

            navChart.xDomain(fc.util.extent(model.data, 'date'))
                .yDomain(yExtent);

            brush.on('brush', function() {
                if (brush.extent()[0][0] - brush.extent()[1][0] !== 0) {
                    dispatch.viewChange([brush.extent()[0][0], brush.extent()[1][0]]);
                }
            })
            .on('brushend', function() {
                if (brush.extent()[0][0] - brush.extent()[1][0] === 0) {
                    dispatch.viewChange(sc.util.domain.centerOnDate(viewScale.domain(),
                        model.data, brush.extent()[0][0]));
                }
            });

            navChart.plotArea(navMulti);
            selection.call(navChart);

            // Allow to zoom using mouse, but disable panning
            var zoom = sc.behavior.zoom()
                .scale(viewScale)
                .trackingLatest(selection.datum().trackingLatest)
                .allowPan(false)
                .on('zoom', function(domain) {
                    dispatch.viewChange(domain);
                });

            selection.call(zoom);
        }

        d3.rebind(nav, dispatch, 'on');

        return nav;
    };
})(d3, fc, sc);
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
(function(d3, fc, sc) {
    'use strict';

    sc.chart.rsi = function() {
        var yAxisWidth = 45;

        var dispatch = d3.dispatch('viewChange');

        var rsiRenderer = fc.indicator.renderer.relativeStrengthIndex();
        var multi = fc.series.multi()
            .series([rsiRenderer])
            .mapping(function() { return this.data; });

        var tickValues = [rsiRenderer.lowerValue(), 50, rsiRenderer.upperValue()];

        var xScale = fc.scale.dateTime();

        var rsiChart = fc.chart.cartesianChart(xScale, d3.scale.linear())
            .xTicks(0)
            .yOrient('right')
            .yTickValues(tickValues)
            .margin({
                top: 0,
                left: 0,
                bottom: 0,
                right: yAxisWidth
            });

        var createForeground = sc.chart.foreground()
            .rightMargin(yAxisWidth);

        var rsiAlgorithm = fc.indicator.algorithm.relativeStrengthIndex();

        function rsi(selection) {
            var model = selection.datum();

            rsiAlgorithm(model.data);

            rsiChart.xDomain(model.viewDomain)
                .yDomain([0, 100]);

            // Redraw
            rsiChart.plotArea(multi);
            selection.call(rsiChart);

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

        d3.rebind(rsi, dispatch, 'on');

        return rsi;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.chart.volume = function() {
        var yAxisWidth = 45;

        var dispatch = d3.dispatch('viewChange');

        var xScale = fc.scale.dateTime();

        var volumeChart = fc.chart.cartesianChart(xScale, d3.scale.linear())
            .xTicks(0)
            .yOrient('right')
            .margin({
                top: 0,
                left: 0,
                bottom: 0,
                right: yAxisWidth
            });

        var volumeBar = fc.series.bar()
            .yValue(function(d) { return d.volume; });
        var multi = fc.series.multi()
            .series([volumeBar])
            .mapping(function(series) {
                return this.data;
            });

        var createForeground = sc.chart.foreground()
            .rightMargin(yAxisWidth);

        function volume(selection) {
            var model = selection.datum();

            volumeChart.xDomain(model.viewDomain);

            // Add percentage padding either side of extreme high/lows
            var maxYExtent = d3.max(model.data, function(d) {
                return d3.max([d.volume]);
            });
            var minYExtent = d3.min(model.data, function(d) {
                return d3.min([d.volume]);
            });
            var paddedYExtent = sc.util.domain.padYDomain([minYExtent, maxYExtent], 0.04);
            volumeChart.yDomain(paddedYExtent);

            // Redraw
            volumeChart.plotArea(multi);
            selection.call(volumeChart);

            selection.call(createForeground);
            var foreground = selection.select('rect.foreground');

            // Behaves oddly if not reinitialized every render
            var zoom = sc.behavior.zoom()
                .scale(xScale)
                .trackingLatest(selection.datum().trackingLatest)
                .on('zoom', function(domain) {
                    dispatch.viewChange(domain);
                });

            foreground.call(zoom);
        }

        d3.rebind(volume, dispatch, 'on');

        return volume;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.chart.xAxis = function() {

        var xAxisHeight = 20;
        var xScale = fc.scale.dateTime();
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(6);

        var dataJoin = fc.util.dataJoin()
            .selector('g.x-axis')
            .element('g')
            .attr('class', 'x-axis');

        function xAxisChart(selection) {
            var xAxisContainer = dataJoin(selection, [selection.datum()])
                .layout({
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    right: 0,
                    height: xAxisHeight
                });

            selection.layout();

            xScale.range([0, xAxisContainer.layout('width')])
                .domain(selection.datum().viewDomain);

            xAxisContainer.call(xAxis);
        }

        return xAxisChart;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.generator.buttonGroup = function(defaultValue) {
        if (!arguments.length) {
            defaultValue = 0;
        }

        var dispatch = d3.dispatch('optionChange');

        var dataJoin = fc.util.dataJoin()
            .selector('label.btn btn-default')
            .element('label')
            .attr('class', 'btn btn-default');

        function layoutButtons(sel) {
            var options = sel.datum().option.map(function(d) { return d.valueString; });
            var activeValue = sel.datum().selectedOption ?
                options.indexOf(sel.datum().selectedOption.valueString) : 0;

            var btnGroupDiv = sel.append('div')
                .attr('class', 'btn-group')
                .attr('data-toggle', 'buttons');

            dataJoin(btnGroupDiv, sel.datum().option)
                .classed('active', function(d, i) { return (i === activeValue); })
                .text(function(d) { return d.displayString; })
                .insert('input')
                .attr({
                    type: 'radio',
                    name: 'options',
                    value: function(d) { return d.valueString; }
                })
                .property('checked', function(d, i) { return (i === activeValue); });
        }

        function optionGenerator(selection) {
            selection.call(layoutButtons);

            selection.selectAll('.btn')
                .on('click', function() {
                    var selectedOption = d3.select(this)
                        .datum();
                    dispatch.optionChange(selectedOption);
                });
        }

        d3.rebind(optionGenerator, dispatch, 'on');

        return optionGenerator;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.generator.dropdownGroup = function() {

        var dispatch = d3.dispatch('optionChange');

        var dataJoin = fc.util.dataJoin()
            .selector('option')
            .element('option');

        function layoutDropdown(sel) {
            var options = sel.datum().option.map(function(d) { return d.valueString; });
            var activeValue = sel.datum().selectedOption ?
                options.indexOf(sel.datum().selectedOption.valueString) : 0;

            var formControlDiv = sel.append('select')
                .attr('class', 'form-control');

            dataJoin(formControlDiv, sel.datum().option)
                .text(function(d) { return d.displayString; })
                .attr({
                    value: function(d) { return d.valueString; }
                })
                .property('selected', function(d, i) { return (i === activeValue); });
        }

        function optionGenerator(selection) {
            selection.call(layoutDropdown);

            selection.on('change', function() {
                    var dropdown = selection.select('.form-control');
                    var selectedOption = dropdown.selectAll('option')[0][dropdown[0][0].selectedIndex].__data__;
                    dispatch.optionChange(selectedOption);
                });
        }

        d3.rebind(optionGenerator, dispatch, 'on');

        return optionGenerator;
    };

})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.generator.listGroup = function() {
        var dispatch = d3.dispatch('optionChange');

        var dataJoin = fc.util.dataJoin()
            .selector('div')
            .element('div');

        function layoutList(sel) {
            var div = dataJoin(sel, sel.datum().option)
                .attr('class', function(d) { return 'list-element list-element-' + d.valueString; })
                .text(function(d) { return d.displayString; });
            div.append('button')
                .classed('btn btn-default', true);
        }

        function optionGenerator(selection) {
            selection.call(layoutList);

            selection.selectAll('.btn')
                .on('click', function() {
                    var selectedOption = d3.select(this)
                        .datum();
                    dispatch.optionChange(selectedOption);
                });
        }

        d3.rebind(optionGenerator, dispatch, 'on');

        return optionGenerator;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.group = function() {

        var dispatch = d3.dispatch('optionChange');

        var option;
        var selectedOption;
        var generator;

        function group(selection) {
            var optionGenerator = generator.on('optionChange', function(option) {
                    dispatch.optionChange(option);
                });
            var model = {
                selectedOption: selectedOption,
                option: option
            };

            selection.each(function() {
                selection.datum(model)
                    .html('');
                selection.call(optionGenerator);
            });
        }

        group.option = function() {
            if (!arguments.length) {
                return option;
            }
            if (Array.isArray(arguments[0])) {
                option = arguments[0];
                return group;
            }
            option = [];
            for (var i = 0; i < arguments.length; i++) {
                option.push(arguments[i]);
            }
            return group;
        };

        group.selectedOption = function(x) {
            if (!arguments.length) {
                return selectedOption;
            }
            selectedOption = x;
            return group;
        };

        group.generator = function(x) {
            if (!arguments.length) {
                return generator;
            }
            generator = x;
            return group;
        };

        d3.rebind(group, dispatch, 'on');

        return group;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.head = function() {

        var dispatch = d3.dispatch('resetToLive',
            'toggleSlideout',
            'dataProductChange',
            'dataPeriodChange');

        function setPeriodChangeVisibility(visible) {
            var visibility = visible ? 'visible' : 'hidden';
            d3.select('#period-dropdown')
                .style('visibility', visibility);
        }

        setPeriodChangeVisibility(false);

        var generated = sc.menu.option('Data Generator', 'generated', 'generated');
        var bitcoin = sc.menu.option('Bitcoin Data', 'bitcoin', 'bitcoin');

        var dataProductDropdown = sc.menu.group()
            .option(generated, bitcoin)
            .generator(sc.menu.generator.dropdownGroup())
            .on('optionChange', function(product) {
                if (product.option === 'bitcoin') {
                    setPeriodChangeVisibility(true);
                } else {
                    setPeriodChangeVisibility(false);
                }
                dispatch.dataProductChange(product);
            });

        var hourPeriod = sc.menu.option('1 hr', '3600', 3600);
        var fiveMinutePeriod = sc.menu.option('5 min', '300', 300);
        var oneMinutePeriod = sc.menu.option('1 min', '60', 60);

        var dataPeriodDropdown = sc.menu.group()
            .option(hourPeriod, fiveMinutePeriod, oneMinutePeriod)
            .generator(sc.menu.generator.dropdownGroup())
            .on('optionChange', function(period) {
                dispatch.dataPeriodChange(period);
            });

        var head = function(selection) {
            selection.each(function() {
                var model = selection.datum();
                dataProductDropdown.selectedOption(model.product);
                dataPeriodDropdown.selectedOption(model.period);
                selection.select('#product-dropdown')
                    .call(dataProductDropdown);
                selection.select('#period-dropdown')
                    .call(dataPeriodDropdown);
                selection.select('#reset-button')
                    .on('click', function() {
                        dispatch.resetToLive();
                    });
                selection.select('#toggle-button')
                    .on('click', function() {
                        dispatch.toggleSlideout();
                    });
            });
        };

        return d3.rebind(head, dispatch, 'on');
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.indicator = function() {

        var dispatch = d3.dispatch('addIndicator',
            'configureIndicator',
            'removeIndicator');

        var selectedIndicator;

        var movingAverage = fc.series.line()
            .decorate(function(select) {
                select.enter()
                    .classed('movingAverage', true);
            })
            .yValue(function(d) { return d.movingAverage; });

        var movingAverageIndicator = sc.menu.option('Moving Average', 'moving-average', movingAverage);
        movingAverageIndicator.option.isChart = false;
        movingAverageIndicator.option.config = {
            yValueAccessor: sc.menu.option('Close', 'close', function(d) { return d.close; })
        };
        var bollingerIndicator = sc.menu.option('Bollinger Bands', 'bollinger', fc.indicator.renderer.bollingerBands());
        bollingerIndicator.option.isChart = false;
        bollingerIndicator.option.config = {
            yValueAccessor: sc.menu.option('Close', 'close', function(d) { return d.close; })
        };
        var rsi = sc.menu.option('RSI', 'secondary-rsi', sc.chart.rsi());
        rsi.option.isChart = true;
        rsi.option.config = {};
        var macd = sc.menu.option('MACD', 'secondary-macd', sc.chart.macd());
        macd.option.isChart = true;
        macd.option.config = {};
        var volume = sc.menu.option('Volume', 'secondary-volume', sc.chart.volume());
        volume.option.isChart = true;
        volume.option.config = {};

        var indicatorAdditiveDropdown = sc.menu.group()
            .option(movingAverageIndicator, bollingerIndicator, rsi, macd, volume)
            .generator(sc.menu.generator.dropdownGroup())
            .on('optionChange', function(indicator) {
                selectedIndicator = indicator;
            });

        var indicatorList = sc.menu.indicatorList()
            .on('configureIndicator', function(indicator) {
                dispatch.configureIndicator(indicator);
            })
            .on('removeIndicator', function(indicator) {
                dispatch.removeIndicator(indicator);
            });

        function initialiseIndicatorAdditiveDropdown(selectedOption) {
            selectedIndicator = selectedOption || movingAverageIndicator;
            indicatorAdditiveDropdown.selectedOption(selectedIndicator);
        }

        var indicator = function(selection) {
            selection.html('<div id="indicator-add">' +
                '<div id="indicator-dropdown"></div>' +
                '</div>' +
                '<div class="list-indicator"></div>');
            selection.select('#indicator-add').append('button')
                .attr({
                    type: 'button',
                    id: 'add-indicator-button',
                    class: 'btn btn-default'
                })
                .text('Add Indicator');

            selection.each(function() {
                var model = selection.datum();
                initialiseIndicatorAdditiveDropdown(model.selectedIndicator);

                selection.select('#indicator-dropdown')
                    .call(indicatorAdditiveDropdown);
                selection.select('#add-indicator-button')
                    .on('click', function() {
                        dispatch.addIndicator(selectedIndicator);
                    });
                selection.select('.list-indicator')
                    .datum(model.indicators)
                    .call(indicatorList);
            });
        };

        return d3.rebind(indicator, dispatch, 'on');
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.indicatorConfig = function() {

        var dispatch = d3.dispatch('configureIndicator');

        var open = sc.menu.option('Open', 'open', function(d) { return d.open; });
        var high = sc.menu.option('High', 'high', function(d) { return d.high; });
        var low = sc.menu.option('Low', 'low', function(d) { return d.low; });
        var close = sc.menu.option('Close', 'close', function(d) { return d.close; });

        // var dataJoin = fc.util.dataJoin()
        //     .selector('div')
        //     .element('div');

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
                    /*dataJoin(selection, indicator)
                        .attr('id', 'y-value-accessor')
                        .call(yValueAccessorConfig);*/
                    selection.selectAll('div')
                        .data([])
                        .enter()
                        .append('div')
                        .attr('id', 'y-value-accessor')
                        .call(yValueAccessorConfig);
                    // selection.append('div')
                    //     .attr('id', 'y-value-accessor')
                    //     .call(yValueAccessorConfig);
                }
            });
        };

        return d3.rebind(indicatorConfig, dispatch, 'on');
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.indicatorList = function() {

        var dispatch = d3.dispatch('configureIndicator',
            'removeIndicator');

        var removeIndicatorList = sc.menu.group()
            .generator(sc.menu.generator.listGroup())
            .on('optionChange', function(indicator) {
                dispatch.removeIndicator(indicator);
            });

        var config = sc.menu.indicatorConfig()
            .on('configureIndicator', function(indicator) {
                dispatch.configureIndicator(indicator);
            });

        var indicatorList = function(selection) {
            selection.each(function() {
                var indicators = selection.datum();
                removeIndicatorList.option(indicators);

                selection.call(removeIndicatorList);

                var listElements = selection.selectAll('div.list-element');
                listElements.select('.btn')
                    .text('Remove');
                var configListDiv = listElements.append('div')
                    .attr('class', 'config');
                configListDiv.data(indicators)
                    .each(function(d, i) {
                        d3.select(this)
                            .call(config);
                    });
            });
        };

        return d3.rebind(indicatorList, dispatch, 'on');
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';
    sc.menu.option = function(displayString, valueString, option) {
        return {
            displayString: displayString,
            valueString: valueString,
            option: option
        };
    };
})(d3, fc, sc);
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
(function(d3, fc, sc) {
    'use strict';

    sc.util.domain.centerOnDate = function(domain, data, centerDate) {
        var dataExtent = fc.util.extent(data, 'date');
        var domainTimes = domain.map(function(d) { return d.getTime(); });
        var domainTimeDifference = (d3.max(domainTimes) - d3.min(domainTimes)) / 1000;

        if (centerDate.getTime() < dataExtent[0] || centerDate.getTime() > dataExtent[1]) {
            return [new Date(d3.min(domainTimes)), new Date(d3.max(domainTimes))];
        }

        var centeredDataDomain = [d3.time.second.offset(centerDate, -domainTimeDifference / 2),
            d3.time.second.offset(centerDate, domainTimeDifference / 2)];
        var timeShift = 0;
        if (centeredDataDomain[1].getTime() > dataExtent[1].getTime()) {
            timeShift = (dataExtent[1].getTime() - centeredDataDomain[1].getTime()) / 1000;
        } else if (centeredDataDomain[0].getTime() < dataExtent[0].getTime()) {
            timeShift = (dataExtent[0].getTime() - centeredDataDomain[0].getTime()) / 1000;
        }

        return [d3.time.second.offset(centeredDataDomain[0], timeShift),
            d3.time.second.offset(centeredDataDomain[1], timeShift)];
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.util.domain.filterDataInDateRange = function(domain, data) {
        var startDate = d3.min(domain, function(d) { return d.getTime(); });
        var endDate = d3.max(domain, function(d) { return d.getTime(); });

        var dataSortedByDate = data.sort(function(a, b) {
            return a.date - b.date;
        });

        var bisector = d3.bisector(function(d) { return d.date; });
        var filteredData = data.slice(
            // Pad and clamp the bisector values to ensure extents can be calculated
            Math.max(0, bisector.left(dataSortedByDate, startDate) - 1),
            Math.min(bisector.right(dataSortedByDate, endDate) + 1, dataSortedByDate.length)
        );
        return filteredData;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.util.domain.moveToLatest = function(domain, data, ratio) {
        if (arguments.length < 3) {
            ratio = 1;
        }
        var dataExtent = fc.util.extent(data, 'date');
        var dataTimeExtent = (dataExtent[1].getTime() - dataExtent[0].getTime()) / 1000;
        var domainTimes = domain.map(function(d) { return d.getTime(); });
        var scaledDomainTimeDifference = ratio * (d3.max(domainTimes) - d3.min(domainTimes)) / 1000;
        var scaledLiveDataDomain = scaledDomainTimeDifference < dataTimeExtent ?
            [d3.time.second.offset(dataExtent[1], -scaledDomainTimeDifference), dataExtent[1]] : dataExtent;
        return scaledLiveDataDomain;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';
    sc.util.domain.padYDomain = function(yExtent, paddingPercentage) {
        var paddingArray = Array.isArray(paddingPercentage) ?
            paddingPercentage : [paddingPercentage, paddingPercentage];
        var orderedYExtentDifference = yExtent[1] - yExtent[0];

        return [yExtent[0] - orderedYExtentDifference * paddingArray[0],
            yExtent[1] + orderedYExtentDifference * paddingArray[1]];
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.util.domain.trackingLatestData = function(domain, data) {
        var latestViewedTime = d3.max(domain, function(d) { return d.getTime(); });
        var latestDatumTime = d3.max(data, function(d) { return d.date.getTime(); });
        return latestViewedTime === latestDatumTime;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.util.generateSecondaryChartColDivs = function() {

        var inactiveSecondaryChartColHTML = '<div class="row row-offcanvas-right secondary-row">' +
                '<div class="col-xs-12 col-sm-12 col-md-9 col-chart">' +
                    '<svg class="chart secondary"></svg>' +
                '</div>' +
            '</div>';

        var activeSecondaryChartColHTML = '<div class="row row-offcanvas-right secondary-row active">' +
                '<div class="col-xs-12 col-sm-12 col-md-9 col-chart">' +
                    '<svg class="chart secondary"></svg>' +
                '</div>' +
            '</div>';

        var clearHTML = false;
        var active = false;
        var numberofSecondaryCharts;

        function generateSecondaryChartColDivs(selection) {
            var savedHTML = clearHTML ? '' : selection.html();
            var colgeneratorHTML = active ? activeSecondaryChartColHTML : inactiveSecondaryChartColHTML;

            var generatedHTML = '';
            for (var i = 0; i < numberofSecondaryCharts; i++) {
                generatedHTML += colgeneratorHTML;
            }

            selection.html(savedHTML + generatedHTML);
        }

        generateSecondaryChartColDivs.clearHTML = function(x) {
            if (!arguments.length) {
                return clearHTML;
            }
            clearHTML = x;
            return generateSecondaryChartColDivs;
        };

        generateSecondaryChartColDivs.active = function(x) {
            if (!arguments.length) {
                return active;
            }
            active = x;
            return generateSecondaryChartColDivs;
        };


        generateSecondaryChartColDivs.numberofSecondaryCharts = function(x) {
            if (!arguments.length) {
                return numberofSecondaryCharts;
            }
            numberofSecondaryCharts = x;
            return generateSecondaryChartColDivs;
        };

        return generateSecondaryChartColDivs;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.util.layout = function(container) {
        var headRowHeight = parseInt(container.select('.head-row').style('height'), 10) +
            parseInt(container.select('.head-row').style('padding-top'), 10) +
            parseInt(container.select('.head-row').style('padding-bottom'), 10);
        var navHeight = parseInt(container.select('.nav-row').style('height'), 10);
        var xAxisHeight = parseInt(container.select('.x-axis-row').style('height'), 10);

        var useableScreenHeight = window.innerHeight - headRowHeight - xAxisHeight - navHeight;

        var numberofSecondaryCharts = container.selectAll('.secondary-row')[0].length;

        var primaryHeightRatio = 1 + numberofSecondaryCharts;
        var secondaryHeightRatio = numberofSecondaryCharts ? 1 : 0;
        var totalHeightRatio = 1 + 2 * numberofSecondaryCharts;

        container.select('.primary-row')
            .style('height', primaryHeightRatio * useableScreenHeight / totalHeightRatio + 'px');
        container.selectAll('.secondary-row')
            .style('display', 'block')
            .style('height', secondaryHeightRatio * useableScreenHeight / totalHeightRatio + 'px');
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.data.callbackInvalidator = function() {
        var n = 0;

        function callbackInvalidator(callback) {
            var id = ++n;
            return function(err, data) {
                if (id < n) { return; }
                callback(err, data);
            };
        }

        callbackInvalidator.invalidateCallback = function() {
            n++;
            return callbackInvalidator;
        };

        return callbackInvalidator;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.data.dataInterface = function() {
        var historicFeed = fc.data.feed.coinbase();
        var callbackGenerator = sc.data.callbackInvalidator();
        var ohlcConverter = sc.data.feed.coinbase.ohlcWebSocketAdaptor();
        var dataGenerator = fc.data.random.financial();
        var dispatch = d3.dispatch('messageReceived', 'dataLoaded');
        var candlesOfData = 200;

        function updateHistoricFeedDateRangeToPresent(period) {
            var currDate = new Date();
            var startDate = d3.time.second.offset(currDate, -candlesOfData * period);
            historicFeed.start(startDate)
                .end(currDate);
        }

        function newBasketReceived(basket, data) {
            if (data[data.length - 1].date.getTime() !== basket.date.getTime()) {
                data.push(basket);
            } else {
                data[data.length - 1] = basket;
            }
        }

        function liveCallback(data) {
            return function(socketEvent, latestBasket) {
                if (socketEvent.type === 'message' && latestBasket) {
                    newBasketReceived(latestBasket, data);
                }
                dispatch.messageReceived(socketEvent, data);
            };
        }

        function dataInterface(period) {
            dataInterface.invalidate();
            historicFeed.granularity(period);
            ohlcConverter.period(period);
            updateHistoricFeedDateRangeToPresent(period);
            var currentData = [];
            historicFeed(callbackGenerator(function(err, data) {
                if (!err) {
                    currentData = data.reverse();
                    ohlcConverter(liveCallback(currentData), currentData[currentData.length - 1]);
                }
                dispatch.dataLoaded(err, currentData);
            }));
        }

        dataInterface.generateData = function() {
            dataInterface.invalidate();
            dispatch.dataLoaded(null, dataGenerator(candlesOfData));
            return dataInterface;
        };

        dataInterface.invalidate = function() {
            ohlcConverter.close();
            callbackGenerator.invalidateCallback();
            return dataInterface;
        };

        d3.rebind(dataInterface, dispatch, 'on');

        return dataInterface;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';
    sc.data.feed.coinbase.ohlcWebSocketAdaptor = function() {
        // Expects transactions with a price, volume and date and organizes them into candles of given periods
        // Re-call OHLC whenever you want to start collecting for a new period/product
        // In seconds
        var period = 60 * 60 * 24;
        var liveFeed = sc.data.feed.coinbase.webSocket();

        function createNewBasket(datum, time) {
            return {
                date: time,
                open: datum.price,
                close: datum.price,
                low: datum.price,
                high: datum.price,
                volume: datum.volume
            };
        }

        function updateBasket(basket, datum) {
            if (basket == null) {
                basket = createNewBasket(datum, datum.date);
            }
            var latestTime = datum.date.getTime();
            var startTime = basket.date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
                var timeIntoCurrentPeriod = (latestTime - startTime) % msPeriod;
                var newTime = latestTime - timeIntoCurrentPeriod;
                basket = createNewBasket(datum, new Date(newTime));
            } else {
                // Update current basket
                basket.high = Math.max(basket.high, datum.price);
                basket.low = Math.min(basket.low, datum.price);
                basket.volume += datum.volume;
                basket.close = datum.price;
            }
            return basket;
        }

        function ohlcWebSocketAdaptor(cb, initialBasket) {
            var basket = initialBasket;
            liveFeed(function(err, datum) {
                if (datum) {
                    basket = updateBasket(basket, datum);
                }
                cb(err, basket);
            });
        }

        ohlcWebSocketAdaptor.period = function(x) {
            if (!arguments.length) {
                return period;
            }
            period = x;
            return ohlcWebSocketAdaptor;
        };

        d3.rebind(ohlcWebSocketAdaptor, liveFeed, 'product', 'messageType', 'close');

        return ohlcWebSocketAdaptor;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';
    sc.data.feed.coinbase.webSocket = function() {
        var product = 'BTC-USD';
        var msgType = 'match';
        var coinbaseSocket = null;

        function webSocket(cb) {
            webSocket.close();
            coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            var msg = {
                type: 'subscribe',
                'product_id': product
            };

            coinbaseSocket.onopen = function(event) {
                coinbaseSocket.send(JSON.stringify(msg));
                cb(event, null);
            };

            coinbaseSocket.onmessage = function(event) {
                var messageData = JSON.parse(event.data);
                if (messageData.type === msgType) {
                    var datum = {};
                    datum.date = new Date(messageData.time);
                    datum.price = parseFloat(messageData.price);
                    datum.volume = parseFloat(messageData.size);
                    cb(event, datum);
                }
            };

            coinbaseSocket.onerror = function(event) {
                cb(event, null);
            };

            coinbaseSocket.onclose = function(event) {
                cb(event, null);
            };

        }

        webSocket.close = function() {
            if (coinbaseSocket) {
                coinbaseSocket.close();
            }
            return webSocket;
        };

        webSocket.messageType = function(x) {
            if (!arguments.length) {
                return msgType;
            }
            msgType = x;
            return webSocket;
        };

        webSocket.product = function(x) {
            if (!arguments.length) {
                return product;
            }
            product = x;
            return webSocket;
        };

        return webSocket;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.behavior.zoom = function() {

        var dispatch = d3.dispatch('zoom');

        var zoomBehavior = d3.behavior.zoom();
        var scale;

        var allowPan = true;
        var allowZoom = true;
        var trackingLatest = true;

        function controlPan(zoomExtent) {
            // Don't pan off sides
            if (zoomExtent[0] >= 0) {
                return -zoomExtent[0];
            } else if (zoomExtent[1] <= 0) {
                return -zoomExtent[1];
            }
            return 0;
        }

        function controlZoom(zoomExtent) {
            // If zooming, and about to pan off screen, do nothing
            return (zoomExtent[0] > 0 && zoomExtent[1] < 0);
        }

        function translateXZoom(translation) {
            var tx = zoomBehavior.translate()[0];
            tx += translation;
            zoomBehavior.translate([tx, 0]);
        }

        function zoom(selection) {

            var xExtent = fc.util.extent(selection.datum().data, ['date']);
            var width = selection.attr('width') || parseInt(selection.style('width'), 10);

            zoomBehavior.x(scale)
                .on('zoom', function() {
                    var min = scale(xExtent[0]);
                    var max = scale(xExtent[1]);

                    var maxDomainViewed = controlZoom([min, max - width]);
                    var panningRestriction = controlPan([min, max - width]);
                    translateXZoom(panningRestriction);

                    var panned = (zoomBehavior.scale() === 1);
                    var zoomed = (zoomBehavior.scale() !== 1);

                    if ((panned && allowPan) || (zoomed && allowZoom)) {
                        var domain = scale.domain();
                        if (maxDomainViewed) {
                            domain = xExtent;
                        } else if (zoomed && trackingLatest) {
                            domain = sc.util.domain.moveToLatest(domain, selection.datum().data);
                        }
                        dispatch.zoom(domain);
                    } else {
                        // Resets zoomBehaviour
                        zoomBehavior.translate([0, 0]);
                        zoomBehavior.scale(1);
                    }
                });

            selection.call(zoomBehavior);
        }

        zoom.allowPan = function(x) {
            if (!arguments.length) {
                return allowPan;
            }
            allowPan = x;
            return zoom;
        };

        zoom.allowZoom = function(x) {
            if (!arguments.length) {
                return allowZoom;
            }
            allowZoom = x;
            return zoom;
        };

        zoom.trackingLatest = function(x) {
            if (!arguments.length) {
                return trackingLatest;
            }
            trackingLatest = x;
            return zoom;
        };

        zoom.scale = function(x) {
            if (!arguments.length) {
                return scale;
            }
            scale = x;
            return zoom;
        };

        d3.rebind(zoom, dispatch, 'on');

        return zoom;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';
    /* Credit to Chris Price for this optimisation
    http://blog.scottlogic.com/2015/08/06/an-adventure-in-svg-filter-land.html
    */
    sc.series.candlestick = function() {
        var xScale = fc.scale.dateTime();
        var yScale = d3.scale.linear();
        var barWidth = fc.util.fractionalBarWidth(0.75);
        var xValue = function(d, i) { return d.date; };
        var xValueScaled = function(d, i) { return xScale(xValue(d, i)); };
        var yLowValue = function(d) { return d.low; };
        var yHighValue = function(d) { return d.high; };

        var candlestickSvg = fc.svg.candlestick()
            .x(function(d) { return xScale(d.date); })
            .open(function(d) { return yScale(d.open); })
            .high(function(d) { return yScale(yHighValue(d)); })
            .low(function(d) { return yScale(yLowValue(d)); })
            .close(function(d) { return yScale(d.close); });

        var upDataJoin = fc.util.dataJoin()
            .selector('path.up')
            .element('path')
            .attr('class', 'up');

        var downDataJoin = fc.util.dataJoin()
            .selector('path.down')
            .element('path')
            .attr('class', 'down');

        var candlestick = function(selection) {
            selection.each(function(data) {
                candlestickSvg.width(barWidth(data.map(xValueScaled)));

                var upData = data.filter(function(d) { return d.open < d.close; });
                var downData = data.filter(function(d) { return d.open >= d.close; });

                upDataJoin(this, [upData])
                    .attr('d', candlestickSvg);

                downDataJoin(this, [downData])
                    .attr('d', candlestickSvg);
            });
        };

        candlestick.xScale = function(x) {
            if (!arguments.length) {
                return xScale;
            }
            xScale = x;
            return candlestick;
        };

        candlestick.yScale = function(x) {
            if (!arguments.length) {
                return yScale;
            }
            yScale = x;
            return candlestick;
        };

        candlestick.yLowValue = function(x) {
            if (!arguments.length) {
                return yLowValue;
            }
            yLowValue = x;
            return candlestick;
        };

        candlestick.yHighValue = function(x) {
            if (!arguments.length) {
                return yHighValue;
            }
            yHighValue = x;
            return candlestick;
        };

        return candlestick;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.app = function() {

        var app = {};

        var container = d3.select('#app-container');
        var svgPrimary = container.select('svg.primary');
        var secondaryChartsContainer = container.select('#secondary-charts-container');
        var svgXAxis = container.select('svg.x-axis');
        var svgNav = container.select('svg.nav');

        var headMenuDiv = container.select('.head-menu');
        var sideMenuDiv = container.select('.sidebar-menu');

        var model = {
            data: [],
            indicators: [],
            period: sc.menu.option('Daily', '86400', 86400),
            product: sc.menu.option('Data Generator', 'generated', 'generated'),
            primary: {
                series: sc.menu.option('Candlestick', 'candlestick', sc.series.candlestick())
            },
            selectedIndicator: undefined,
            trackingLatest: true,
            viewDomain: []
        };

        var primaryChart = sc.chart.primary();
        var xAxis = sc.chart.xAxis();
        var nav = sc.chart.nav();

        function initialiseChartEventHandlers() {
            primaryChart.on('viewChange', onViewChanged);
            nav.on('viewChange', onViewChanged);
        }

        function initialiseDataInterface() {
            var dataInterface = sc.data.dataInterface()
                .on('messageReceived', function(socketEvent, data) {
                    if (socketEvent.type === 'error' ||
                        (socketEvent.type === 'close' && socketEvent.code !== 1000)) {
                        console.log('Error loading data from coinbase websocket: ' +
                        socketEvent.type + ' ' + socketEvent.code);
                    } else if (socketEvent.type === 'message') {
                        model.data = data;
                        if (model.trackingLatest) {
                            var newDomain = sc.util.domain.moveToLatest(model.viewDomain, model.data);
                            onViewChanged(newDomain);
                        }
                    }
                })
                .on('dataLoaded', function(err, data) {
                    if (err) {
                        console.log('Error getting historic data: ' + err);
                    } else {
                        model.data = data;
                        resetToLive();
                    }
                });
            return dataInterface;
        }

        function initialiseHeadMenu() {
            var headMenu = sc.menu.head()
                .on('dataProductChange', function(product) {
                    model.product = product;
                    if (product.option === 'bitcoin') {
                        var periodDropdown = container.select('#period-dropdown').select('.form-control');
                        model.period = periodDropdown.selectAll('option')[0]
                            [periodDropdown[0][0].selectedIndex].__data__;
                        dataInterface(model.period.option);
                    } else if (product.option === 'generated') {
                        dataInterface.generateData();
                        model.period = sc.menu.option('Daily', '86400', 86400);
                    }
                })
                .on('dataPeriodChange', function(period) {
                    model.period = period;
                    dataInterface(model.period.option);
                })
                .on('resetToLive', resetToLive)
                .on('toggleSlideout', function() {
                    container.selectAll('.row-offcanvas-right').classed('active',
                        !container.selectAll('.row-offcanvas-right').classed('active'));
                });

            return headMenu;
        }

        function initialiseSideMenu() {
            var sideMenu = sc.menu.side()
                .on('primaryChartSeriesChange', function(series) {
                    model.primary.series = series;
                    render();
                })
                .on('addIndicator', function(indicator) {
                    model.selectedIndicator = indicator;
                    if (model.indicators.indexOf(indicator) === -1) {
                        model.indicators.push(indicator);
                        if (indicator.option.isChart) {
                            indicator.option.on('viewChange', onViewChanged);
                        }
                        initialiseSecondaryChartContainerLayout();
                        updateLayout();
                        render();
                    }
                })
                .on('configureIndicator', function(configuredIndicator) {
                    var keyedIndicators = model.indicators.map(function(indicator) { return indicator.valueString; });
                    var index = keyedIndicators.indexOf(configuredIndicator.valueString);
                    model.indicators[index] = configuredIndicator;
                    render();
                })
                .on('removeIndicator', function(indicator) {
                    if (model.indicators.indexOf(indicator) !== -1) {
                        model.indicators.splice(model.indicators.indexOf(indicator), 1);
                        initialiseSecondaryChartContainerLayout();
                        updateLayout();
                        render();
                    }
                });

            return sideMenu;
        }

        var dataInterface = initialiseDataInterface();
        var headMenu = initialiseHeadMenu(dataInterface);
        var sideMenu = initialiseSideMenu();

        function initialiseSecondaryChartContainerLayout() {
            var secondaryCharts = model.indicators.filter(function(d) { return d.option.isChart; });
            var htmlGenerator = sc.util.generateSecondaryChartColDivs()
                .clearHTML(true)
                .active(container.selectAll('.row-offcanvas-right').classed('active'))
                .numberofSecondaryCharts(secondaryCharts.length);
            secondaryChartsContainer.call(htmlGenerator);
        }

        function updateLayout() {
            sc.util.layout(container);
        }

        function renderMenus() {
            headMenuDiv.datum(model)
                .call(headMenu);

            sideMenuDiv.datum(model)
                .call(sideMenu);
        }

        function renderCharts() {
            svgPrimary.datum(model)
                .call(primaryChart);

            var secondaryCharts = model.indicators.filter(function(d) { return d.option.isChart; });
            secondaryChartsContainer
                .selectAll('svg.secondary')
                .datum(model)
                .each(function(d, i) {
                    d3.select(this)
                        .attr('class', 'chart secondary ' + secondaryCharts[i].valueString)
                        .call(secondaryCharts[i].option);
                });

            svgXAxis.datum(model)
                .call(xAxis);

            svgNav.datum(model)
                .call(nav);
        }

        function render() {
            renderMenus();
            renderCharts();
        }

        function initialiseResize() {
            d3.select(window).on('resize', function() {
                updateLayout();
                render();
            });
        }

        function onViewChanged(domain) {
            model.viewDomain = [domain[0], domain[1]];
            model.trackingLatest = sc.util.domain.trackingLatestData(model.viewDomain, model.data);
            render();
        }

        function resetToLive() {
            var data = model.data;
            var dataDomain = fc.util.extent(data, 'date');
            var navTimeDomain = sc.util.domain.moveToLatest(dataDomain, data, 0.2);
            onViewChanged(navTimeDomain);
        }

        app.run = function() {
            initialiseChartEventHandlers();
            initialiseResize();
            renderMenus();
            updateLayout();
            dataInterface.generateData();
        };

        return app;
    };
})(d3, fc, sc);

(function(d3, fc, sc) {
    'use strict';

    sc.app().run();

})(d3, fc, sc);
