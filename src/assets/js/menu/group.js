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