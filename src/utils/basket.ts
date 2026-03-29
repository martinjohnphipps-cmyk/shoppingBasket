import type { BasketItem } from '../types/items';

/**
 * Creates an empty basket
 * @returns An empty basket array
 */
export function createBasket(): BasketItem[] {
    return [];
}

/**
 * Adds an item to a basket. If the item already exists, its quantity is incremented by the given amount.
 * Returns a new basket array, leaving the original unchanged (immutable / copy-on-write pattern).
 * This satisfies the requirement that a basket is mutable in the sense that items can be added to it,
 * while keeping the function pure and safe for use in React state.
 * @param basket - The current basket array
 * @param itemName - The name of the item to add
 * @param quantity - The number of units to add (defaults to 1)
 * @returns A new basket array with the item added or updated
 */
export function addItem(basket: BasketItem[], itemName: string, quantity: number = 1): BasketItem[] {
    if (quantity <= 0) {
        throw new Error(`Quantity must be greater than 0, received: ${quantity}`);
    }
    const existingItem = basket.find(item => item.itemName === itemName);
    if (existingItem) {
        return basket.map(item =>
            item.itemName === itemName
                ? { ...item, quantity: item.quantity + quantity }
                : item
        );
    }
    return [...basket, { itemName, quantity }];
}
