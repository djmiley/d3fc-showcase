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

        it('should return a single latest data point in an array if it is unique', function() {
            var latestDatum = sc.util.latestData(data);

            expect(latestDatum.length).toBe(1);
            expect(latestDatum[0].date).toEqual(friday);

            var shuffledLatestDatum = sc.util.latestData(shuffledData);

            expect(shuffledLatestDatum.length).toBe(1);
            expect(shuffledLatestDatum[0].date).toEqual(friday);
        });

        it('should return the multiple latest data points in an array if there are more than one', function() {
            // Set obj(friday) to obj(thursday) so there are multiple latest datums
            data[4] = obj(thursday);

            var latestDatum = sc.util.latestData(data);

            expect(latestDatum.length).toBe(2);
            expect(latestDatum[0].date).toEqual(thursday);
            expect(latestDatum[1].date).toEqual(thursday);

            // Set obj(friday) to obj(thursday) so there are multiple latest datums
            shuffledData[3] = obj(thursday);

            var shuffledLatestDatum = sc.util.latestData(shuffledData);

            expect(shuffledLatestDatum.length).toBe(2);
            expect(shuffledLatestDatum[0].date).toEqual(thursday);
            expect(shuffledLatestDatum[1].date).toEqual(thursday);
        });

        it('should return an empty array if nothing is passed into the function', function() {
            var emptyArray = sc.util.latestData([]);

            expect(emptyArray.length).toBe(0);
            expect(emptyArray).toEqual([]);
        });

    });
})(d3, fc, sc);