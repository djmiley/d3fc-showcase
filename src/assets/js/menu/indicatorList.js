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

        var dataJoin = fc.util.dataJoin()
            .selector('div.list-element')
            .element('div')
            .attr('class', 'list-element');

        var indicatorList = function(selection) {
            selection.each(function() {
                var indicators = selection.datum();
                removeIndicatorList.option(indicators);

                selection.call(removeIndicatorList);

                var listElements = dataJoin(selection, indicators);
                listElements.select('.btn')
                    .text('Remove');
                listElements.append('div')
                    .attr('class', 'config')
                    .each(function(d, i) {
                        d3.select(this)
                            .call(config);
                    });
            });
        };

        return d3.rebind(indicatorList, dispatch, 'on');
    };
})(d3, fc, sc);