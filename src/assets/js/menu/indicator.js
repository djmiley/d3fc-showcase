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

        var buttonDataJoin = fc.util.dataJoin()
            .selector('button')
            .element('button')
            .attr({
                type: 'button',
                class: 'btn btn-default'
            });

        var containerDataJoin = fc.util.dataJoin()
            .selector('div')
            .element('div');

        var indicator = function(selection) {
            selection.each(function() {
                var model = selection.datum();
                initialiseIndicatorAdditiveDropdown(model.selectedIndicator);

                containerDataJoin(selection, [model])
                    .html('<div id="indicator-add">' +
                    '<div id="indicator-dropdown"></div>' +
                    '</div>' +
                    '<div class="list-indicator"></div>');

                selection.select('#indicator-dropdown')
                    .call(indicatorAdditiveDropdown);
                buttonDataJoin(selection.select('#indicator-add'), [model])
                    .attr('id', 'add-indicator-button')
                    .text('Add Indicator')
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