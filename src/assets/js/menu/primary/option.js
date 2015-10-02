(function(d3, fc, sc) {
    'use strict';
    sc.menu.primary.option = function(option, extentAccessor, lineIdentifier) {
        var primaryOption = {
            displayString: option.displayString,
            valueString: option.valueString,
            option: option.option
        };
        primaryOption.option.extentAccessor = extentAccessor;
        primaryOption.option.lineIdentifier = lineIdentifier;

        return primaryOption;
    };
})(d3, fc, sc);