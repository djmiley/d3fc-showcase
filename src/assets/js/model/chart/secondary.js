export default function(initialProduct, initialPeriod) {
    return {
        data: [],
        viewDomain: [],
        trackingLatest: true,
        padding: 1000 * initialPeriod.seconds / 2,
        product: initialProduct
    };
}
