import { describe, it, expect } from 'vitest';
import { createBasket, addItem } from './basket';

describe('createBasket', () => {
    it('returns an empty array', () => {
        const basket = createBasket();
        expect(basket).toEqual([]);
    });
});

describe('addItem', () => {
    it('adds a new item to an empty basket', () => {
        const basket = addItem(createBasket(), 'Baked Beans');
        expect(basket).toEqual([{ itemName: 'Baked Beans', quantity: 1 }]);
    });

    it('adds a new item with a specified quantity', () => {
        const basket = addItem(createBasket(), 'Biscuits', 3);
        expect(basket).toEqual([{ itemName: 'Biscuits', quantity: 3 }]);
    });

    it('increments quantity when the same item is added again', () => {
        let basket = addItem(createBasket(), 'Sardines', 2);
        basket = addItem(basket, 'Sardines', 1);
        expect(basket).toEqual([{ itemName: 'Sardines', quantity: 3 }]);
    });

    it('does not mutate the original basket', () => {
        const original = addItem(createBasket(), 'Baked Beans', 1);
        const updated = addItem(original, 'Baked Beans', 2);
        expect(original).toEqual([{ itemName: 'Baked Beans', quantity: 1 }]);
        expect(updated).toEqual([{ itemName: 'Baked Beans', quantity: 3 }]);
    });

    it('adds a second distinct item alongside an existing item', () => {
        let basket = addItem(createBasket(), 'Baked Beans', 2);
        basket = addItem(basket, 'Biscuits', 1);
        expect(basket).toEqual([
            { itemName: 'Baked Beans', quantity: 2 },
            { itemName: 'Biscuits', quantity: 1 },
        ]);
    });

    it('increments only the matching item when basket has multiple items', () => {
        let basket = addItem(createBasket(), 'Baked Beans', 2);
        basket = addItem(basket, 'Biscuits', 1);
        basket = addItem(basket, 'Baked Beans', 1);
        expect(basket).toEqual([
            { itemName: 'Baked Beans', quantity: 3 },
            { itemName: 'Biscuits', quantity: 1 },
        ]);
    });

    it('throws an error when quantity is 0', () => {
        expect(() => addItem(createBasket(), 'Baked Beans', 0)).toThrow(
            'Quantity must be greater than 0, received: 0'
        );
    });

    it('throws an error when quantity is negative', () => {
        expect(() => addItem(createBasket(), 'Baked Beans', -1)).toThrow(
            'Quantity must be greater than 0, received: -1'
        );
    });
});
