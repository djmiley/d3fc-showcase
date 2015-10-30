(function(d3, fc, sc) {
    'use strict';

    sc.model.nav = function() {
        return {
            data: [],
            viewDomain: [],
            padding: 24 * 60 * 60 / 2,
            trackingLatest: true
        };
    };

})(d3, fc, sc);
