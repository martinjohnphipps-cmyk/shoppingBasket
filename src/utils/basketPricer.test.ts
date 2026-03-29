import { describe, it, expect } from 'vitest';
import { basketPricer } from './basketPricer';
import type { Offer } from '../types/items';

const catalogue = new Map<string, number>([
    ['Baked Beans', 0.99],
    ['Biscuits', 1.20],
    ['Sardines', 1.89],
    ['Shampoo (Small)', 2.00],
    ['Shampoo (Medium)', 2.50],
    ['Shampoo (Large)', 3.50],
]);

const offers: Offer[] = [
    {
        itemNames: ['Baked Beans'],
        offerType: 'Ratio',
        ratio: { required: 3, paid: 2 },
    },
    {
        itemNames: ['Sardines'],
        offerType: 'Percentage',
        discount: 25,
    },
];

describe('basketPricer', () => {
    describe('Basket 1: Baked Beans x4, Biscuits x1', () => {
        const { subtotal, discount, total } = basketPricer({
            basket: [
                { itemName: 'Baked Beans', quantity: 4 },
                { itemName: 'Biscuits', quantity: 1 },
            ],
            catalogue,
            offers,
        });

        it('calculates the correct sub-total of £5.16', () => {
            expect(subtotal).toBeCloseTo(5.16, 2);
        });

        it('calculates the correct discount of £0.99 (1 free Baked Bean from buy-2-get-1-free)', () => {
            expect(discount).toBeCloseTo(0.99, 2);
        });

        it('calculates the correct total of £4.17', () => {
            expect(total).toBeCloseTo(4.17, 2);
        });
    });

    describe('Basket 2: Baked Beans x2, Biscuits x1, Sardines x2', () => {
        const { subtotal, discount, total } = basketPricer({
            basket: [
                { itemName: 'Baked Beans', quantity: 2 },
                { itemName: 'Biscuits', quantity: 1 },
                { itemName: 'Sardines', quantity: 2 },
            ],
            catalogue,
            offers,
        });

        it('calculates the correct sub-total of £6.96', () => {
            expect(subtotal).toBeCloseTo(6.96, 2);
        });

        it('calculates the correct discount of £0.95 (25% off 2 Sardines, no Baked Beans offer threshold reached)', () => {
            // 25% of £1.89 x2 = £0.945, displayed as £0.95
            expect(discount).toBeCloseTo(0.95, 2);
        });

        it('calculates the correct total of £6.01', () => {
            expect(total).toBeCloseTo(6.01, 2);
        });
    });

    it('throws an error when a basket item is not found in the catalogue', () => {
        expect(() =>
            basketPricer({
                basket: [{ itemName: 'Unknown Item', quantity: 1 }],
                catalogue,
                offers,
            })
        ).toThrow('Item Unknown Item not found in catalogue');
    });

    it('returns zero subtotal, discount and total for an empty basket', () => {
        const { subtotal, discount, total } = basketPricer({ basket: [], catalogue, offers });
        expect(subtotal).toBe(0);
        expect(discount).toBe(0);
        expect(total).toBe(0);
    });

    it('applies no discount when no offers match basket items', () => {
        const { subtotal, discount, total } = basketPricer({
            basket: [{ itemName: 'Biscuits', quantity: 3 }],
            catalogue,
            offers,
        });
        expect(subtotal).toBeCloseTo(3.60, 2);
        expect(discount).toBe(0);
        expect(total).toBeCloseTo(3.60, 2);
    });

    describe('Basket 3: Shampoo (Large) x3, Shampoo (Medium) x1, Shampoo (Small) x2 with buy-3-get-cheapest-free offer', () => {
        const shampooOffer: Offer = {
            itemNames: ['Shampoo (Large)', 'Shampoo (Medium)', 'Shampoo (Small)'],
            offerType: 'Ratio',
            ratio: { required: 3, paid: 2 },
        };

        const { subtotal, discount, total } = basketPricer({
            basket: [
                { itemName: 'Shampoo (Large)', quantity: 3 },
                { itemName: 'Shampoo (Medium)', quantity: 1 },
                { itemName: 'Shampoo (Small)', quantity: 2 },
            ],
            catalogue,
            offers: [shampooOffer],
        });

        it('calculates the correct sub-total of £17.00', () => {
            // 3×£3.50 + 1×£2.50 + 2×£2.00 = £17.00
            expect(subtotal).toBeCloseTo(17.00, 2);
        });

        it('calculates the correct discount of £5.50 (1 Large and 1 Small free)', () => {
            // Units sorted desc: [3.50, 3.50, 3.50, 2.50, 2.00, 2.00]
            // Group 1: cheapest = £3.50 free; Group 2: cheapest = £2.00 free
            expect(discount).toBeCloseTo(5.50, 2);
        });

        it('calculates the correct total of £11.50', () => {
            expect(total).toBeCloseTo(11.50, 2);
        });
    });

    describe('Numeric offer', () => {
        it('applies a per-item fixed discount correctly', () => {
            const { subtotal, discount, total } = basketPricer({
                basket: [{ itemName: 'Biscuits', quantity: 3 }],
                catalogue,
                offers: [{ itemNames: ['Biscuits'], offerType: 'Numeric', discount: 0.50 }],
            });
            // 3 × £1.20 = £3.60; 3 × £0.50 off = £1.50 discount
            expect(subtotal).toBeCloseTo(3.60, 2);
            expect(discount).toBeCloseTo(1.50, 2);
            expect(total).toBeCloseTo(2.10, 2);
        });

        it('throws when a Numeric offer has no discount value', () => {
            const offer: Offer = { itemNames: ['Biscuits'], offerType: 'Numeric' };
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Biscuits', quantity: 1 }],
                    catalogue,
                    offers: [offer],
                })
            ).toThrow("Offer of type 'Numeric' must have a discount value");
        });

        it('throws when a Numeric offer discount exceeds the item price', () => {
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Biscuits', quantity: 1 }],
                    catalogue,
                    offers: [{ itemNames: ['Biscuits'], offerType: 'Numeric', discount: 5.00 }],
                })
            ).toThrow("Offer of type 'Numeric' cannot have a discount value greater than the item price");
        });
    });

    describe('Percentage offer error cases', () => {
        it('throws when a Percentage offer has no discount value', () => {
            const offer: Offer = { itemNames: ['Sardines'], offerType: 'Percentage' };
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Sardines', quantity: 1 }],
                    catalogue,
                    offers: [offer],
                })
            ).toThrow("Offer of type 'Percentage' must have a discount value");
        });

        it('throws when a Percentage offer discount is greater than 100', () => {
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Sardines', quantity: 1 }],
                    catalogue,
                    offers: [{ itemNames: ['Sardines'], offerType: 'Percentage', discount: 150 }],
                })
            ).toThrow("Offer of type 'Percentage' must have a discount value between 0 and 100");
        });

        it('throws when a Percentage offer discount is negative', () => {
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Sardines', quantity: 1 }],
                    catalogue,
                    offers: [{ itemNames: ['Sardines'], offerType: 'Percentage', discount: -10 }],
                })
            ).toThrow("Offer of type 'Percentage' must have a discount value between 0 and 100");
        });
    });

    describe('Ratio offer error cases', () => {
        it('throws when a Ratio offer has no ratio value', () => {
            const offer: Offer = { itemNames: ['Baked Beans'], offerType: 'Ratio' };
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Baked Beans', quantity: 3 }],
                    catalogue,
                    offers: [offer],
                })
            ).toThrow("Offer of type 'Ratio' must have a ratio value");
        });

        it('throws when a Ratio offer has a required value of 0', () => {
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Baked Beans', quantity: 3 }],
                    catalogue,
                    offers: [{ itemNames: ['Baked Beans'], offerType: 'Ratio', ratio: { required: 0, paid: 1 } }],
                })
            ).toThrow("Offer of type 'Ratio' must have a ratio value with required and paid greater than 0");
        });

        it('throws when a Ratio offer has a paid value of 0', () => {
            expect(() =>
                basketPricer({
                    basket: [{ itemName: 'Baked Beans', quantity: 3 }],
                    catalogue,
                    offers: [{ itemNames: ['Baked Beans'], offerType: 'Ratio', ratio: { required: 3, paid: 0 } }],
                })
            ).toThrow("Offer of type 'Ratio' must have a ratio value with required and paid greater than 0");
        });
    });

    it('throws when an offer has an unknown offer type', () => {
        const offer = { itemNames: ['Biscuits'], offerType: 'Unknown' } as unknown as Offer;
        expect(() =>
            basketPricer({
                basket: [{ itemName: 'Biscuits', quantity: 1 }],
                catalogue,
                offers: [offer],
            })
        ).toThrow('Unknown offer type: Unknown');
    });
});
