(function(d3, fc, sc) {
    'use strict';

    sc.behavior.zoom = function() {

        var dispatch = d3.dispatch('zoom');

        var zoomBehavior = d3.behavior.zoom();
        var scale;

        var allowPan = true;
        var allowZoom = true;
        var minimumViewableTime = 0;
        var trackingLatest = true;

        function controlPan(zoomExtent) {
            // Don't pan off sides
            if (zoomExtent[0] >= 0) {
                return -zoomExtent[0];
            } else if (zoomExtent[1] <= 0) {
                return -zoomExtent[1];
            }
            return 0;
        }

        function controlZoom(zoomExtent) {
            // If zooming, and about to pan off screen, do nothing
            return (zoomExtent[0] > 0 && zoomExtent[1] < 0);
        }

        function translateXZoom(translation) {
            var tx = zoomBehavior.translate()[0];
            tx += translation;
            zoomBehavior.translate([tx, 0]);
        }

        function zoom(selection) {

            var xExtent = fc.util.extent(selection.datum().data, ['date']);
            var width = selection.attr('width') || parseInt(selection.style('width'), 10);

            var domain;

            zoomBehavior.x(scale)
                .on('zoomstart', function() {
                    domain = scale.domain();
                })
                .on('zoom', function() {
                    var min = scale(xExtent[0]);
                    var max = scale(xExtent[1]);

                    var maxDomainViewed = controlZoom([min, max - width]);
                    var panningRestriction = controlPan([min, max - width]);
                    translateXZoom(panningRestriction);

                    if (sc.util.timeExtent(scale.domain()) > minimumViewableTime) {
                        domain = scale.domain();
                    }

                    var panned = (zoomBehavior.scale() === 1);
                    var zoomed = (zoomBehavior.scale() !== 1);

                    if (maxDomainViewed) {
                        domain = xExtent;
                    } else if (zoomed && trackingLatest) {
                        domain = sc.util.domain.moveToLatest(domain, selection.datum().data);
                    }
                    if ((panned && allowPan) || (zoomed && allowZoom)) {
                        dispatch.zoom(domain);
                    }
                });

            selection.call(zoomBehavior);
        }

        zoom.allowPan = function(x) {
            if (!arguments.length) {
                return allowPan;
            }
            allowPan = x;
            return zoom;
        };

        zoom.allowZoom = function(x) {
            if (!arguments.length) {
                return allowZoom;
            }
            allowZoom = x;
            return zoom;
        };

        zoom.trackingLatest = function(x) {
            if (!arguments.length) {
                return trackingLatest;
            }
            trackingLatest = x;
            return zoom;
        };

        zoom.minimumViewableTime = function(x) {
            if (!arguments.length) {
                return minimumViewableTime;
            }
            minimumViewableTime = x;
            return zoom;
        };

        zoom.scale = function(x) {
            if (!arguments.length) {
                return scale;
            }
            scale = x;
            return zoom;
        };

        d3.rebind(zoom, dispatch, 'on');

        return zoom;
    };
})(d3, fc, sc);