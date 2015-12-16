export default function(initialPeriod) {
    return {
        viewDomain: [],
        padding: 1000 * initialPeriod.seconds / 2,
        period: initialPeriod
    };
}
