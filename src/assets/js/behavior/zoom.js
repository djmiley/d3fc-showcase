(function(d3, fc, sc) {
    'use strict';

    sc.behavior.zoom = function(width) {

        var dispatch = d3.dispatch('zoom');

        var zoomBehavior = d3.behavior.zoom();
        var scale;

        var allowPan = true;
        var allowZoom = true;
        var padding = 0;
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

        function resetBehaviour() {
            zoomBehavior.translate([0, 0]);
            zoomBehavior.scale(1);
        }

        function zoom(selection) {

            zoomBehavior.x(scale)
                .on('zoom', function() {
                    var xExtent = fc.util.extent()
                        .fields('date')(selection.datum().data);
                    var paddedXExtent = padding ? sc.util.domain.padTimeExtent(xExtent,
                        selection.datum().data, padding) : xExtent;

                    var width = selection.attr('layout-width');

                    var min = scale(paddedXExtent[0]);
                    var max = scale(paddedXExtent[1]);

                    var maxDomainViewed = controlZoom([min, max - width]);
                    var panningRestriction = controlPan([min, max - width]);
                    translateXZoom(panningRestriction);

                    var panned = (zoomBehavior.scale() === 1);
                    var zoomed = (zoomBehavior.scale() !== 1);

                    if ((panned && allowPan) || (zoomed && allowZoom)) {
                        var unpaddedDomain = padding ? sc.util.domain.padTimeExtent(scale.domain(),
                            selection.datum().data, -padding) : scale.domain();
                        if (maxDomainViewed) {
                            unpaddedDomain = fc.util.extent()
                                .fields('date')(selection.datum().data);
                        } else if (zoomed && trackingLatest) {
                            unpaddedDomain = sc.util.domain.moveToLatest(unpaddedDomain, selection.datum().data);
                        }

                        if (unpaddedDomain[0].getTime() !== unpaddedDomain[1].getTime()) {
                            dispatch.zoom(unpaddedDomain);
                        } else {
                            // Ensure the user can't zoom-in infinitely, causing the chart to fail to render
                            // #168, #411
                            resetBehaviour();
                        }
                    } else {
                        resetBehaviour();
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

        zoom.padding = function(x) {
            if (!arguments.length) {
                return padding;
            }
            padding = x;
            return zoom;
        };

        zoom.trackingLatest = function(x) {
            if (!arguments.length) {
                return trackingLatest;
            }
            trackingLatest = x;
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
