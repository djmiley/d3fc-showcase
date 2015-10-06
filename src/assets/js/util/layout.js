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