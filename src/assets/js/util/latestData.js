(function(d3, fc, sc) {
    'use strict';

    sc.util.latestData = function(data) {
        var latestDataTime = fc.util.extent(data, 'date')[1];
        return data.filter(function(d) { return d.date.getTime() === latestDataTime.getTime(); });
    };
})(d3, fc, sc);