(function() {
    'use strict';

    // Crazyness to get a strict mode compliant reference to the global object
    var global = null;
    /* jshint ignore:start */
    global = (1, eval)('this');
    /* jshint ignore:end */

    global.sc = {
        chart: {},
        data: {
            feed: {
                coinbase: {}
            }
        },
        menu: {
            generator: {},
            primaryChart: {},
            secondaryChart: {}
        },
        series: {},
        util: {}
    };
})();
(function(d3, fc, sc) {
    'use strict';

    sc.chart.macdChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var macdAlgorithm = fc.indicator.algorithm.macd();

        var macd = fc.indicator.renderer.macd();

        function macdChart(selection) {
            var data = selection.datum().data;
            var viewDomain = selection.datum().viewDomain;

            macdAlgorithm(data);

            var maxYExtent = d3.max(data, function(d) {
                return Math.abs(d.macd.macd);
            });

            macd.xScale()
                .domain(viewDomain)
                .range([0, parseInt(selection.style('width'), 10)]);
            macd.yScale()
                .domain([-maxYExtent, maxYExtent])
                .range([parseInt(selection.style('height'), 10), 0]);


            var zoom = d3.behavior.zoom();
            zoom.x(macd.xScale())
                .on('zoom', function() {
                    sc.util.zoomControl(zoom, selection, data, macd.xScale());
                    dispatch.viewChange(macd.xScale().domain());
                });

            selection.call(zoom);
            selection.datum(data)
                .call(macd);
        }

        d3.rebind(macdChart, dispatch, 'on');

        return macdChart;
    };

})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.chart.navChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var navTimeSeries = fc.chart.linearTimeSeries()
            .yTicks(0)
            .yOrient('right');

        var area = fc.series.area()
            .yValue(function(d) { return d.open; });

        var line = fc.series.line()
            .yValue(function(d) { return d.open; });

        var brush = d3.svg.brush();

        var navMulti = fc.series.multi().series([area, line, brush]);

        var viewScale = fc.scale.dateTime();

        function navChart(selection) {
            var data = selection.datum().data;
            var viewDomain = selection.datum().viewDomain;

            viewScale.domain(viewDomain)
                .range([0, parseInt(selection.style('width'), 10)]);

            var yExtent = fc.util.extent(sc.util.filterDataInDateRange(data,
                fc.util.extent(data, 'date')), ['low', 'high']);

            navTimeSeries.xDomain(fc.util.extent(data, 'date'))
                .yDomain(yExtent);

            brush.on('brush', function() {
                if (brush.extent()[0][0] - brush.extent()[1][0] !== 0) {
                    // Control the shared view scale's domain
                    dispatch.viewChange([brush.extent()[0][0], brush.extent()[1][0]]);
                }
            });

            // Allow to zoom using mouse, but disable panning
            var zoom = d3.behavior.zoom();
            zoom.x(viewScale)
                .on('zoom', function() {
                    if (zoom.scale() === 1) {
                        zoom.translate([0, 0]);
                    } else {
                        // Usual behavior
                        sc.util.zoomControl(zoom, selection, data, viewScale);
                        dispatch.viewChange(viewScale.domain());
                    }
                });
            selection.call(zoom);


            navMulti.mapping(function(series) {
                if (series === brush) {
                    brush.extent([
                        [viewScale.domain()[0], navTimeSeries.yDomain()[0]],
                        [viewScale.domain()[1], navTimeSeries.yDomain()[1]]
                    ]);
                }
                return data;
            });

            navTimeSeries.plotArea(navMulti);
            selection.call(navTimeSeries);
        }

        d3.rebind(navChart, dispatch, 'on');

        return navChart;
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

    sc.chart.primaryChart = function() {
        var yAxisWidth = 45;

        var dispatch = d3.dispatch('viewChange');

        var priceFormat = d3.format('.2f');

        var timeSeries = fc.chart.linearTimeSeries()
            .xAxisHeight(0)
            .yAxisWidth(yAxisWidth)
            .yOrient('right')
            .yTickFormat(priceFormat);

        var gridlines = fc.annotation.gridline()
            .yTicks(5)
            .xTicks(0);

        var currentSeries = sc.series.candlestick();
        var currentIndicator;

        // Create and apply the Moving Average
        var movingAverage = fc.indicator.algorithm.movingAverage();

        var bollingerAlgorithm = fc.indicator.algorithm.bollingerBands();

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
            .series([gridlines, currentSeries, closeLine]);

        function updateMultiSeries() {
            if (currentIndicator) {
                multi.series([gridlines, currentSeries, closeLine, currentIndicator]);
            } else {
                multi.series([gridlines, currentSeries, closeLine]);
            }
        }

        function primaryChart(selection) {
            var data = selection.datum().data;
            var viewDomain = selection.datum().viewDomain;

            timeSeries.xDomain(viewDomain);

            // Scale y axis
            var yExtent = fc.util.extent(sc.util.filterDataInDateRange(data, timeSeries.xDomain()), ['low', 'high']);
            // Add 10% either side of extreme high/lows
            var variance = yExtent[1] - yExtent[0];
            yExtent[0] -= variance * 0.1;
            yExtent[1] += variance * 0.1;
            timeSeries.yDomain(yExtent);

            // Find current tick values and add close price to this list, then set it explicitly below
            var closePrice = data[data.length - 1].close;
            var tickValues = produceAnnotatedTickValues(timeSeries.yScale(), [closePrice]);

            timeSeries.yTickValues(tickValues)
                .yDecorate(function(s) {
                    s.classed('closeLine', function(d) {
                            return d === closePrice;
                        })
                        .select('path').attr('d', function(d) {
                            if (d === closePrice) {
                                return d3.svg.area()(calculateCloseAxisTagPath(yAxisWidth, 14));
                            }
                        });
                });

            movingAverage(data);
            bollingerAlgorithm(data);

            updateMultiSeries();

            multi.mapping(function(series) {
                switch (series) {
                    case closeLine:
                        return [data[data.length - 1]];
                    default:
                        return data;
                }
            });

            // Redraw
            timeSeries.plotArea(multi);
            selection.call(timeSeries);

            // Behaves oddly if not reinitialized every render
            var zoom = d3.behavior.zoom();
            zoom.x(timeSeries.xScale())
                .on('zoom', function() {
                    sc.util.zoomControl(zoom, selection.select('.plot-area'), data, timeSeries.xScale());
                    dispatch.viewChange(timeSeries.xDomain());
                });

            selection.call(zoom);
        }

        d3.rebind(primaryChart, dispatch, 'on');

        primaryChart.yAxisWidth = function() { return timeSeries.yAxisWidth; };

        primaryChart.changeSeries = function(series) {
            currentSeries = series;
            updateMultiSeries();
            return primaryChart;
        };

        primaryChart.changeIndicator = function(indicator) {
            currentIndicator = indicator;
            updateMultiSeries();
            return primaryChart;
        };

        return primaryChart;
    };
})(d3, fc, sc);

(function(d3, fc, sc) {
    'use strict';

    sc.chart.rsiChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var rsiScale = d3.scale.linear()
            .domain([0, 100]);

        var rsiAlgorithm = fc.indicator.algorithm.relativeStrengthIndex();

        var rsi = fc.indicator.renderer.relativeStrengthIndex()
            .yScale(rsiScale);

        function rsiChart(selection) {
            var data = selection.datum().data;
            var viewDomain = selection.datum().viewDomain;

            rsi.xScale()
                .domain(viewDomain)
                .range([0, parseInt(selection.style('width'), 10)]);
            rsi.yScale().range([parseInt(selection.style('height'), 10), 0]);

            rsiAlgorithm(data);

            var zoom = d3.behavior.zoom();
            zoom.x(rsi.xScale())
                .on('zoom', function() {
                    sc.util.zoomControl(zoom, selection, data, rsi.xScale());
                    dispatch.viewChange(rsi.xScale().domain());
                });

            selection.call(zoom);
            selection.datum(data)
                .call(rsi);
        }

        d3.rebind(rsiChart, dispatch, 'on');

        return rsiChart;
    };

})(d3, fc, sc);
(function(sc) {
    'use strict';

    sc.chart.xAxis = function() {
        var dispatch = d3.dispatch('viewChange');

        var xAxisHeight = 20;
        var xScale = fc.scale.dateTime();
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(6);

        function xAxisChart(selection) {
            var data = selection.datum().data;
            var viewDomain = selection.datum().viewDomain;

            var zoom = d3.behavior.zoom();

            // Redraw
            var xAxisContainer = selection.selectAll('g.x-axis')
                .data([data]);
            xAxisContainer.enter()
                .append('g')
                .attr('class', 'axis x-axis')
                .layout({
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    right: 0,
                    height: xAxisHeight
                });

            selection.layout();

            xScale.range([0, xAxisContainer.layout('width')])
                .domain(viewDomain);

            xAxisContainer.call(xAxis);

            // Behaves oddly if not reinitialized every render
            zoom.x(xScale)
                .on('zoom', function() {
                    sc.util.zoomControl(zoom, selection, data, xScale);
                    dispatch.viewChange(xScale.domain());
                });

            selection.call(zoom);
        }

        d3.rebind(xAxisChart, dispatch, 'on');

        return xAxisChart;
    };
})(sc);
(function(d3, fc) {
    'use strict';

    sc.menu.generator.buttonGroup = function() {
        var dispatch = d3.dispatch('optionChange');

        function layoutButtons(sel) {
            sel.selectAll('label')
                .data(sel.datum())
                .enter()
                .append('label')
                .classed('btn btn-default', true)
                .classed('active', function(d, i) { return (i === 0); })
                .text(function(d, i) { return d.displayString; })
                .insert('input')
                .attr({
                    type: 'radio',
                    name: 'options',
                    value: function(d, i) { return d.valueString; }
                })
                .property('checked', function(d, i) { return (i === 0); });
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

})(d3, fc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.main = function() {

        var dispatch = d3.dispatch('primaryChartSeriesChange',
            'primaryChartIndicatorChange',
            'secondaryChartChange',
            'dataTypeChange',
            'periodChange');

        function setPeriodChangeVisibility(visible) {
            var visibility = visible ? 'visible' : 'hidden';
            d3.select('#period-selection')
                .style('visibility', visibility);
        }

        setPeriodChangeVisibility(false);

        var primaryChartSeriesOptions = sc.menu.primaryChart.series()
            .on('primaryChartSeriesChange', function(series) {
                dispatch.primaryChartSeriesChange(series);
            });

        var primaryChartIndicatorOptions = sc.menu.primaryChart.indicators()
            .on('primaryChartIndicatorChange', function(indicator) {
                dispatch.primaryChartIndicatorChange(indicator);
            });

        var secondaryChartOptions = sc.menu.secondaryChart.chart()
            .on('secondaryChartChange', function(chart) {
                dispatch.secondaryChartChange(chart);
            });

        var dataTypeChangeOptions = function(selection) {
            selection.on('change', function() {
                if (this.value === 'bitcoin') {
                    setPeriodChangeVisibility(true);
                } else {
                    setPeriodChangeVisibility(false);
                }
                dispatch.dataTypeChange(this.value);
            });
        };

        var periodChangeOptions = function(selection) {
            selection.on('change', function() {
                dispatch.periodChange(this.value);
            });
        };

        var main = function(selection) {
            selection.each(function() {
                var selection = d3.select(this);
                selection.select('#type-selection')
                    .call(dataTypeChangeOptions);
                selection.select('#period-selection')
                    .call(periodChangeOptions);
                selection.select('#series-buttons')
                    .call(primaryChartSeriesOptions);
                selection.select('#indicator-buttons')
                    .call(primaryChartIndicatorOptions);
                selection.select('#secondary-chart-buttons')
                    .call(secondaryChartOptions);
            });
        };

        return d3.rebind(main, dispatch, 'on');
    };
})(d3, fc, sc);
(function(d3, fc) {
    'use strict';
    sc.menu.option = function(displayString, valueString, option) {
        return {
            displayString: displayString,
            valueString: valueString,
            option: option
        };
    };

})(d3, fc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.primaryChart.indicators = function() {

        var dispatch = d3.dispatch('primaryChartIndicatorChange');

        var movingAverage = fc.series.line()
            .decorate(function(select) {
                select.enter()
                    .classed('movingAverage', true);
            })
            .yValue(function(d) { return d.movingAverage; });

        var noIndicator = sc.menu.option('None', 'no-indicator', null);
        var movingAverageIndicator = sc.menu.option('Moving Average', 'movingAverage', movingAverage);
        var bollingerIndicator = sc.menu.option('Bollinger Bands', 'bollinger', fc.indicator.renderer.bollingerBands());

        var options = sc.menu.generator.buttonGroup()
            .on('optionChange', function(indicator) {
                dispatch.primaryChartIndicatorChange(indicator);
            });

        var primaryChartSeriesMenu = function(selection) {
            selection.each(function() {
                var selection = d3.select(this)
                    .datum([noIndicator, movingAverageIndicator, bollingerIndicator]);
                selection.call(options);
            });
        };

        return d3.rebind(primaryChartSeriesMenu, dispatch, 'on');
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.primaryChart.series = function() {

        var dispatch = d3.dispatch('primaryChartSeriesChange');

        var candlestick = sc.menu.option('Candlestick', 'candlestick', fc.series.candlestick());
        var ohlc = sc.menu.option('OHLC', 'ohlc', fc.series.ohlc());
        var line = sc.menu.option('Line', 'line', fc.series.line());
        line.option.isLine = true;
        var point = sc.menu.option('Point', 'point', fc.series.point());
        var area = sc.menu.option('Area', 'area', fc.series.area());

        var options = sc.menu.generator.buttonGroup()
            .on('optionChange', function(series) {
                dispatch.primaryChartSeriesChange(series);
            });

        var primaryChartSeriesMenu = function(selection) {
            selection.each(function() {
                var selection = d3.select(this)
                    .datum([candlestick, ohlc, line, point, area]);
                selection.call(options);
            });
        };

        return d3.rebind(primaryChartSeriesMenu, dispatch, 'on');
    };

})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.menu.secondaryChart.chart = function() {

        var dispatch = d3.dispatch('secondaryChartChange');

        var noChart = sc.menu.option('None', 'no-chart', null);
        var rsiChart = sc.menu.option('RSI', 'rsi', sc.chart.rsiChart());
        var macdChart = sc.menu.option('MACD', 'macd', sc.chart.macdChart());

        var options = sc.menu.generator.buttonGroup()
            .on('optionChange', function(chart) {
                dispatch.secondaryChartChange(chart);
            });

        var secondaryChartMenu = function(selection) {
            selection.each(function() {
                var selection = d3.select(this)
                    .datum([noChart, rsiChart, macdChart]);
                selection.call(options);
            });
        };

        return d3.rebind(secondaryChartMenu, dispatch, 'on');
    };
})(d3, fc, sc);
(function(d3, fc) {
    'use strict';

    sc.util.calculateDimensions = function(container, secondaryChartShown) {
        var headRowHeight = parseInt(container.select('#head-row').style('height'), 10) +
            parseInt(container.select('#head-row').style('padding-top'), 10) +
            parseInt(container.select('#head-row').style('padding-bottom'), 10);
        var navHeight = parseInt(container.select('#nav-row').style('height'), 10);
        var xAxisHeight = parseInt(container.select('#x-axis-row').style('height'), 10);

        var useableScreenHeight = window.innerHeight - headRowHeight - xAxisHeight - navHeight;

        var primaryHeightRatio = secondaryChartShown ? 2 : 1;
        var secondaryHeightRatio = secondaryChartShown ? 1 : 0;

        var totalHeightRatio = primaryHeightRatio + secondaryHeightRatio;

        container.select('#primary-row')
            .style('height', primaryHeightRatio * useableScreenHeight / totalHeightRatio + 'px');
        container.select('#secondary-row')
            .style('height', secondaryHeightRatio * useableScreenHeight / totalHeightRatio + 'px');
    };

})(d3, fc);
(function(sc) {
    'use strict';

    sc.util.callbackInvalidator = function() {
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

})(sc);
(function(d3, fc, sc) {
    'use strict';

    sc.util.filterDataInDateRange = function(data, dateExtent) {
        // Calculate visible data, given [startDate, endDate]
        var bisector = d3.bisector(function(d) { return d.date; });
        var filteredData = data.slice(
            // Pad and clamp the bisector values to ensure extents can be calculated
            Math.max(0, bisector.left(data, dateExtent[0]) - 1),
            Math.min(bisector.right(data, dateExtent[1]) + 1, data.length)
        );
        return filteredData;
    };

})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.util.zoomControl = function(zoom, selection, data, scale) {
        var tx = zoom.translate()[0];
        var ty = zoom.translate()[1];

        var xExtent = fc.util.extent(data, ['date']);
        var min = scale(xExtent[0]);
        var max = scale(xExtent[1]);

        // Don't pan off sides
        var width = selection.attr('width') || parseInt(selection.style('width'), 10);
        if (min > 0) {
            tx -= min;
        } else if (max - width < 0) {
            tx -= (max - width);
        }
        // If zooming, and about to pan off screen, do nothing
        if (zoom.scale() !== 1) {
            if ((min >= 0) && (max - width) <= 0) {
                scale.domain(xExtent);
                zoom.x(scale);
                tx = scale(xExtent[0]);
            }
        }

        zoom.translate([tx, ty]);
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    sc.data.dataInterface = function() {
        var historicFeed = fc.data.feed.coinbase();
        var callbackGenerator = sc.util.callbackInvalidator();
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
(function(sc) {
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
})(sc);

(function(sc) {
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

})(sc);

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

        var candlestickSvg = fc.svg.candlestick()
            .x(function(d) { return xScale(d.date); })
            .open(function(d) { return yScale(d.open); })
            .high(function(d) { return yScale(d.high); })
            .low(function(d) { return yScale(d.low); })
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

        return candlestick;
    };
})(d3, fc, sc);
(function(d3, fc, sc) {
    'use strict';

    // Set SVGs & column padding
    var container = d3.select('#app-container');

    var svgPrimary = container.select('svg.primary');
    var svgSecondary = container.select('svg.secondary');
    var svgXAxis = container.select('svg.x-axis');
    var svgNav = container.select('svg.nav');

    var dataModel = {
        data: [],
        period: 60 * 60 * 24,
        viewDomain: []
    };

    var primaryChart = sc.chart.primaryChart();
    var secondaryChart = null;
    var xAxis = sc.chart.xAxis();
    var navChart = sc.chart.navChart();

    function render() {
        svgPrimary.datum(dataModel)
            .call(primaryChart);

        if (secondaryChart) {
            svgSecondary.datum(dataModel)
                .call(secondaryChart);
        }

        svgXAxis.datum(dataModel)
            .call(xAxis);

        svgNav.datum(dataModel)
            .call(navChart);
    }

    function resize() {
        sc.util.calculateDimensions(container, secondaryChart);
        render();
    }

    function onViewChanged(domain) {
        dataModel.viewDomain = [domain[0], domain[1]];
        render();
    }

    function resetToLive() {
        var data = dataModel.data;
        var extent = fc.util.extent(data, 'date');
        var timeExtent = (extent[1].getTime() - extent[0].getTime()) / 1000;
        var navTimeExtent = timeExtent / 5;
        var latest = data[data.length - 1].date;
        var navTimeDomain = [d3.time.second.offset(latest, -navTimeExtent), latest];
        onViewChanged(navTimeDomain);
    }

    primaryChart.on('viewChange', onViewChanged);
    xAxis.on('viewChange', onViewChanged);
    navChart.on('viewChange', onViewChanged);

    var dataInterface = sc.data.dataInterface()
        .on('messageReceived', function(socketEvent, data) {
            if (socketEvent.type === 'error' ||
                (socketEvent.type === 'close' && socketEvent.code !== 1000)) {
                console.log('Error loading data from coinbase websocket: ' +
                socketEvent.type + ' ' + socketEvent.code);
            } else if (socketEvent.type === 'message') {
                dataModel.data = data;
            }
            render();
        })
        .on('dataLoaded', function(err, data) {
            if (err) {
                console.log('Error getting historic data: ' + err);
            } else {
                dataModel.data = data;
                resetToLive();
                render();
            }
        });

    var mainMenu = sc.menu.main()
        .on('primaryChartSeriesChange', function(series) {
            primaryChart.changeSeries(series.option);
            /* Elements are drawn in the order they appear in the HTML - at this minute,
            D3FC doesn't maintain the ordering of elements, so it's easiest to just
            remove them and re-write them to the DOM in the correct order. */
            svgPrimary.selectAll('.multi')
                .remove();
            render();
        })
        .on('primaryChartIndicatorChange', function(indicator) {
            primaryChart.changeIndicator(indicator.option);
            svgPrimary.selectAll('.multi')
                .remove();
            render();
        })
        .on('secondaryChartChange', function(chart) {
            secondaryChart = chart.option;
            svgSecondary.selectAll('*')
                .remove();
            if (secondaryChart) {
                secondaryChart.on('viewChange', onViewChanged);
            }
            resize();
        })
        .on('dataTypeChange', function(type) {
            if (type === 'bitcoin') {
                dataModel.period = container.select('#period-selection').property('value');
                dataInterface(dataModel.period);
            } else if (type === 'generated') {
                dataInterface.generateData();
                dataModel.period = 60 * 60 * 24;
            }
        })
        .on('periodChange', function(period) {
            dataModel.period = period;
            dataInterface(dataModel.period);
        });

    container.select('.menu')
        .call(mainMenu);

    container.select('#reset-button').on('click', resetToLive);

    d3.select(window).on('resize', resize);

    dataInterface.generateData();
    sc.util.calculateDimensions(container, secondaryChart);
    resetToLive();
})(d3, fc, sc);
