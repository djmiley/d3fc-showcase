(function(d3, fc, sc) {
    'use strict';

    describe('sc.util.latestData', function() {

        function obj(val, price) {
            return {
                date: val
            };
        }

        var data;
        var shuffledData;

        var monday = new Date(2015, 7, 17);
        var tuesday = new Date(2015, 7, 18);
        var wednesday = new Date(2015, 7, 19);
        var thursday = new Date(2015, 7, 20);
        var friday = new Date(2015, 7, 21);

        beforeEach(function() {
            data = [obj(monday), obj(tuesday), obj(wednesday), obj(thursday), obj(friday)];
            shuffledData = [obj(thursday), obj(wednesday), obj(monday), obj(friday), obj(tuesday)];
        });

        it('should return a single latest data point in an array', function() {
            var latestDatum = sc.util.latestData(data);

            expect(latestDatum.date).toEqual(friday);

            var shuffledLatestDatum = sc.util.latestData(shuffledData);

            expect(shuffledLatestDatum.date).toEqual(friday);
        });

        it('should return undefined if nothing is passed into the function', function() {
            expect(sc.util.latestData([])).toBe(undefined);
        });

    });
})(d3, fc, sc);