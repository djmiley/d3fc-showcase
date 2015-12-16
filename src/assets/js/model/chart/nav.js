export default function(initialPeriod) {
    return {
        data: [],
        viewDomain: [],
        padding: 1000 * initialPeriod.seconds / 2,
        trackingLatest: true
    };
}
