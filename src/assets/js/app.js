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
