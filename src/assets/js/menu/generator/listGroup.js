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