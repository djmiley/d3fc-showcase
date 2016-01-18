import d3 from 'd3';
import fc from 'd3fc';
import event from '../../event';
import base from './base';

export default function() {
    var dispatch = d3.dispatch(event.viewChange);
    var renderer = fc.indicator.renderer.relativeStrengthIndex();
    var algorithm = fc.indicator.algorithm.relativeStrengthIndex();
    var tickValues = [renderer.lowerValue(), 50, renderer.upperValue()];

    var chart = base()
      .series([renderer])
      .yTickValues(tickValues)
      .on(event.viewChange, function(domain) {
          dispatch[event.viewChange](domain);
      });

    function rsi(selection) {
        var model = selection.datum();
        algorithm(model.data);

        var paddedDomain = fc.util.extent()
            .fields(fc.util.fn.identity)
            .padUnit('domain')
            .pad(model.padding)(model.viewDomain);
        chart.trackingLatest(model.trackingLatest)
          .padding(model.padding)
          .xDomain(paddedDomain)
          .yDomain([0, 100]);

        selection.datum(model.data)
          .call(chart);
    }

    d3.rebind(rsi, dispatch, 'on');

    rsi.dimensionChanged = function(container) {
        chart.dimensionChanged(container);
    };

    return rsi;
}
