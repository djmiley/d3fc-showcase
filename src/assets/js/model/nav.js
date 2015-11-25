(function(d3, fc, sc) {
    'use strict';

    sc.model.nav = function(initialPeriod) {
        return {
            data: [],
            viewDomain: [],
            padding: initialPeriod.seconds / 2,
            trackingLatest: true
        };
    };

})(d3, fc, sc);
