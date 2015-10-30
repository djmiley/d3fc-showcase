(function(d3, fc, sc) {
    'use strict';

    function domainBeforeStartOfData(domain, data) {
        var earliestViewedTime = domain[0].getTime();
        var earliestDatumTime = data[0].date.getTime();
        return earliestViewedTime <= earliestDatumTime;
    }

    function domainAfterEndOfData(domain, data) {
        var latestViewedTime = domain[1].getTime();
        var lastDatumTime = data[data.length - 1].date.getTime();
        return latestViewedTime >= lastDatumTime;
    }

    sc.util.domain.padTimeExtent = function(domain, data, padding) {
        // Adds a padding of period to ends of domain
        var paddedDomain = domain;

        if (domainBeforeStartOfData(domain, data)) {
            paddedDomain[0] = d3.time.second.offset(new Date(domain[0]), -padding);
        }
        if (domainAfterEndOfData(domain, data)) {
            paddedDomain[1] = d3.time.second.offset(new Date(domain[1]), +padding);
        }

        return paddedDomain;
    };
})(d3, fc, sc);