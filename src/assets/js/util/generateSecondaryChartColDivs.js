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