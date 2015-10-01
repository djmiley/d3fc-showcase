(function(d3, fc, sc) {
    'use strict';

    sc.util.isDateWithinExtent = function(dateExtent, date) {
        return (dateExtent[1].getTime() >= date.getTime()) && (dateExtent[0].getTime() <= date.getTime());
    };
})(d3, fc, sc);