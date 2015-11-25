(function(d3, fc, sc) {
    'use strict';

    sc.model.secondaryChart = function(initialProduct, initialPeriod) {
        return {
            data: [],
            viewDomain: [],
            padding: initialPeriod.seconds / 2,
            trackingLatest: true,
            product: initialProduct
        };
    };

})(d3, fc, sc);
