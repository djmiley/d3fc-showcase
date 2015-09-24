(function(d3, fc, sc) {
    'use strict';

    sc.util.domain.moveToLatest = function(domain, data, ratio) {
        if (arguments.length < 3) {
            ratio = 1;
        }
        var dataExtent = fc.util.extent(data, 'date');
        var dataTimeExtent = sc.util.timeExtent(dataExtent);
        var domainTimeExtent = ratio * sc.util.timeExtent(domain);
        var latest = data[data.length - 1].date;
        var scaledLiveDataDomain = domainTimeExtent < dataTimeExtent ?
            [d3.time.second.offset(latest, -domainTimeExtent), latest] : dataExtent;
        return scaledLiveDataDomain;
    };
})(d3, fc, sc);