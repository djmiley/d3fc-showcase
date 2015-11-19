(function(d3, fc, sc) {
    'use strict';

    sc.util.domain.padTimeExtent = function(domain, padding) {
        if (!padding) {
            padding = 0;
        }
        var paddedDomain = domain;
        if (domain[1].getTime() > domain[0].getTime()) {
            paddedDomain[0] = d3.time.second.offset(new Date(domain[0]), -padding);
            paddedDomain[1] = d3.time.second.offset(new Date(domain[1]), +padding);
        } else if (domain[0].getTime() > domain[1].getTime()) {
            paddedDomain[0] = d3.time.second.offset(new Date(domain[0]), +padding);
            paddedDomain[1] = d3.time.second.offset(new Date(domain[1]), -padding);
        }

        return paddedDomain;
    };
})(d3, fc, sc);