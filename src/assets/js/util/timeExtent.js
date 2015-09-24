(function(d3, fc, sc) {
    'use strict';

    sc.util.timeExtent = function(domain) {
        return (domain[1].getTime() - domain[0].getTime()) / 1000;
    };
})(d3, fc, sc);