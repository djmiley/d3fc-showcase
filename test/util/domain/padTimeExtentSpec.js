(function(d3, fc, sc) {
    'use strict';

    describe('sc.util.domain.padTimeExtent', function() {

        var domain;
        var reversedDomain;

        beforeEach(function() {
            domain = [new Date(100000), new Date(150000)];
            reversedDomain = [new Date(150000), new Date(100000)];
        });

        it('should pad the time domain by a positive time value', function() {
            expect(sc.util.domain.padTimeExtent(domain, 5)).toEqual([new Date(95000), new Date(155000)]);
            expect(sc.util.domain.padTimeExtent(reversedDomain, 5)).toEqual([new Date(155000), new Date(95000)]);
        });

        it('should pad the time domain by a negative time value', function() {
            expect(sc.util.domain.padTimeExtent(domain, -5)).toEqual([new Date(105000), new Date(145000)]);
            expect(sc.util.domain.padTimeExtent(reversedDomain, -5)).toEqual([new Date(145000), new Date(105000)]);
        });

        it('should pad the time domain by nothing when the padding is zero', function() {
            expect(sc.util.domain.padTimeExtent(domain, 0)).toEqual([new Date(100000), new Date(150000)]);
            expect(sc.util.domain.padTimeExtent(reversedDomain, 0)).toEqual([new Date(150000), new Date(100000)]);
        });

        it('should pad the time domain by nothing when padding is not defined', function() {
            expect(sc.util.domain.padTimeExtent(domain)).toEqual([new Date(100000), new Date(150000)]);
            expect(sc.util.domain.padTimeExtent(reversedDomain)).toEqual([new Date(150000), new Date(100000)]);
        });

        it('should return the original time domain if the two times are equal', function() {
            var equalDomain = [new Date(100000), new Date(100000)];
            expect(sc.util.domain.padTimeExtent(equalDomain, 5)).toEqual([new Date(100000), new Date(100000)]);
            expect(sc.util.domain.padTimeExtent(equalDomain, -5)).toEqual([new Date(100000), new Date(100000)]);
        });

    });
})(d3, fc, sc);