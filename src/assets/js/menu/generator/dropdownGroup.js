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