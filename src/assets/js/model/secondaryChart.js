(function(d3, fc, sc) {
    'use strict';

    sc.model.secondaryChart = function(initialProduct) {
        return {
            data: [],
            viewDomain: [],
            padding: 24 * 60 * 60 / 2,
            trackingLatest: true,
            product: initialProduct
        };
    };

})(d3, fc, sc);
