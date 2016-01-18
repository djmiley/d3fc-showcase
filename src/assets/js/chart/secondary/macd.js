import d3 from 'd3';
import fc from 'd3fc';
import util from '../../util/util';
import event from '../../event';
import base from './base';

export default function() {
    var dispatch = d3.dispatch(event.viewChange);
    var zeroLine = fc.annotation.line()
      .value(0)
      .label('');
    var renderer = fc.indicator.renderer.macd();
    var algorithm = fc.indicator.algorithm.macd();

    var chart = base()
      .series([zeroLine, renderer])
      .yTicks(5)
      .mapping(function(series) {
          return series === zeroLine ? [0] : this;
      })
      .decorate(function(g) {
          g.enter()
            .attr('class', function(d, i) {
                return ['multi zero', 'multi'][i];
            });
      })
      .on(event.viewChange, function(domain) {
          dispatch[event.viewChange](domain);
      });

    function macd(selection) {
        var model = selection.datum();
        algorithm(model.data);


        var paddedDomain = fc.util.extent()
            .fields(fc.util.fn.identity)
            .padUnit('domain')
            .pad(model.padding)(model.viewDomain);
        var paddedYExtent = fc.util.extent()
            .fields('macd')
            .symmetricalAbout(0)
            .pad(0.08)(model.data.map(function(d) { return d.macd; }));
        chart.trackingLatest(model.trackingLatest)
          .padding(model.padding)
          .xDomain(paddedDomain)
          .yDomain(paddedYExtent);

        selection.datum(model.data)
          .call(chart);
    }

    d3.rebind(macd, dispatch, 'on');

    macd.dimensionChanged = function(container) {
        chart.dimensionChanged(container);
    };

    return macd;
}
