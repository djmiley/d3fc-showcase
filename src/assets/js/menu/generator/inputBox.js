(function(d3, fc, sc) {
    'use strict';

    sc.menu.generator.inputBox = function(min, max) {

        var dispatch = d3.dispatch('optionChange');

        function layoutLabel(sel) {
            sel.selectAll('label')
                .data(sel.datum())
                .enter()
                .append('label')
                .classed('btn btn-default', true)
                .text(function(d) { return d.displayString; })
                .append('input')
                .attr({
                    type: 'number',
                    min: min,
                    max: max,
                    value: function(d) { return d.option;}
                })
                .property('value', function(d) { return d.option; });
        }

        function optionGenerator(selection) {
            selection.call(layoutLabel);

            selection.selectAll('input')
                .on('input', function() {
                    var windowValue = this.value;
                    dispatch.optionChange(windowValue);
                });
        }

        d3.rebind(optionGenerator, dispatch, 'on');

        return optionGenerator;
    };

})(d3, fc, sc);