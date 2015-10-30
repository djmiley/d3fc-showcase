(function(d3, fc, sc) {
    'use strict';

    sc.model.xAxis = function(initialPeriod) {
        return {
            viewDomain: [],
            padding: 24 * 60 * 60 / 2,
            period: initialPeriod
        };
    };

})(d3, fc, sc);
