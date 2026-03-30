import { type BasketItem, type Offer } from "../types/items";

type BasketPricerProps = {
    basket: BasketItem[];
    catalogue: Map<string, number>;
    offers: Offer[];
}

/**
 * A function to calculate the prices of items in a shopping basket based on their quantities, provided catalogue
 * of prices and applicable offers
 * @param basket - An array of items in the shopping basket, each with a name and quantity
 * @param catalogue - A map of item names to their non discounted prices
 * @param offers - An array of offers that can be applied to the items in the basket
 * @returns The subtotal, discount and total prices of the basket calculated
 * 
 * Errors are returned if any item in the basket is not found in the catalogue, or if any offer is missing
 * required fields (e.g. discount value for 'Percentage' and 'Numeric' offer types, ratio value for 'Ratio'
 * offer type or if an offer has an unknown offer type)
 * 
 * For Ratio offers covering multiple product names, the cheapest item per application of the offer is given
 * free, and the discount is calculated to give the maximum possible discount across all applicable products.
 */
export function basketPricer({basket, catalogue, offers}: BasketPricerProps): { subtotal: number, discount: number, total: number } {

    const { applicableBasketOffers, subtotal } = calculateSubtotalAndApplicableOffers(basket, catalogue, offers);

    const discount = calculateBasketDiscount(basket, catalogue, applicableBasketOffers);

    const total = subtotal - discount;

    return {
        subtotal,
        discount,
        total
    }
}

/**
 * Calculates the subtotal price of the basket and identifies the offers that are applicable to the items in the basket
 * @param basket - An array of items in the shopping basket, each with a name and quantity
 * @param catalogue - A map of item names to their non discounted prices
 * @param offers - An array of offers that can be applied to the items in the basket
 * @returns An object containing the subtotal and the applicable offers for the basket
 */
function calculateSubtotalAndApplicableOffers(basket: BasketItem[], catalogue: Map<string, number>, offers: Offer[]): { subtotal: number, applicableBasketOffers: Offer[] } {
    let subtotal = 0;
    const applicableBasketOffers: Offer[] = [];
    
    for (const item of basket) {
        if (item.quantity < 0) {
            throw new Error(`Item ${item.itemName} must have a non-negative quantity`);
        }
        if (item.quantity === 0) {
            continue;
        }
        const itemPrice = catalogue.get(item.itemName);
        if (itemPrice === undefined) {
            throw new Error(`Item ${item.itemName} not found in catalogue`);
        }
        subtotal += itemPrice * item.quantity;

        const applicableOffers = offers.filter(offer => offer.itemNames.includes(item.itemName));
        for (const offer of applicableOffers) {
            if (!applicableBasketOffers.includes(offer)) {
                applicableBasketOffers.push(offer);
            }
        }
    }

    return {
        applicableBasketOffers,
        subtotal
    }
}

/**
 * Calculates the total discount for the basket based on the applicable offers
 * @param basket - An array of items in the shopping basket, each with a name and quantity
 * @param catalogue - A map of item names to their non discounted prices
 * @param applicableBasketOffers - An array of offers that are applicable to the items in the basket
 * @returns The total discount for the basket
 */
function calculateBasketDiscount(basket: BasketItem[], catalogue: Map<string, number>, applicableBasketOffers: Offer[]): number {
    let discount = 0;
    for (const offer of applicableBasketOffers) {
        const offerItems = basket.filter(item => offer.itemNames.includes(item.itemName));
        discount += calculateOfferDiscount(offerItems, catalogue, offer);
    }
    return discount;
}

/**
 * Calculates the discount for a given offer based on the items in the basket that are applicable to the offer,
 * the catalogue of item prices and the offer details (e.g. offer type, discount value or ratio value)
 * @param basket - An array of items in the shopping basket, each with a name and quantity
 * @param catalogue - A map of item names to their non discounted prices
 * @param offer - An offer that can be applied to the items in the basket
 * @returns The discount amount for the given offer
 */
function calculateOfferDiscount(basket: BasketItem[], catalogue: Map<string, number>, offer: Offer): number {
    switch (offer.offerType) {
        case 'Percentage':
            return percentageDiscount(basket, catalogue, offer);
        case 'Numeric':
            return numericDiscount(basket, catalogue, offer);
        case 'Ratio':
            return ratioDiscount(basket, catalogue, offer);
        default:
            throw new Error(`Unknown offer type: ${offer.offerType}`);
    }
}

/**
 * Calculates the discount for a given offer of type 'Percentage' based on the items in the basket that are applicable to the offer,
 * the catalogue of item prices and the offer details (e.g. discount value)
 * @param basket - An array of items in the shopping basket, each with a name and quantity
 * @param catalogue - A map of item names to their non discounted prices
 * @param offer - An offer of type 'Percentage' that can be applied to the items in the basket
 * @returns The discount amount for the given offer
 */
function percentageDiscount(basket: BasketItem[], catalogue: Map<string, number>, offer: Offer): number {
    if (offer.discount === undefined) {
        throw new Error(`Offer of type 'Percentage' must have a discount value`);
    }
    if (offer.discount < 0 || offer.discount > 100) {
        throw new Error(`Offer of type 'Percentage' must have a discount value between 0 and 100: received ${offer.discount},` +
                        ` for offer with items ${offer.itemNames.join(', ')}`);
    }
    let offerDiscount = 0;
    for (const item of basket) {
        const itemPrice = catalogue.get(item.itemName)!;
        offerDiscount += Math.round((offer.discount / 100) * itemPrice * item.quantity * 100) / 100;
    }
    return offerDiscount;
}

/**
 * Calculates the discount for a given offer of type 'Numeric' based on the items in the basket that are applicable to the offer,
 * the catalogue of item prices and the offer details (e.g. discount value)
 * @param basket - An array of items in the shopping basket, each with a name and quantity
 * @param catalogue - A map of item names to their non discounted prices
 * @param offer - An offer of type 'Numeric' that can be applied to the items in the basket
 * @returns The discount amount for the given offer
 */
function numericDiscount(basket: BasketItem[], catalogue: Map<string, number>, offer: Offer): number {
    if (offer.discount === undefined) {
        throw new Error(`Offer of type 'Numeric' must have a discount value`);
    }
    if (offer.discount < 0) {
        throw new Error(`Offer of type 'Numeric' must have a non-negative discount value`);
    }
    let offerDiscount = 0;
    for (const item of basket) {
        const itemPrice = catalogue.get(item.itemName)!;
        if (offer.discount > itemPrice) {
            throw new Error(`Offer of type 'Numeric' cannot have a discount value greater than the item price: item ${item.itemName}` +
                            ` has price ${itemPrice} but offer discount is ${offer.discount}`);
        }
        offerDiscount += offer.discount * item.quantity;
    }
    return offerDiscount;
}

/**
 * Calculates the discount for a given offer of type 'Ratio' based on the items in the basket that are applicable to the offer,
 * the catalogue of item prices and the offer details (e.g. ratio values)
 * @param basket - An array of items in the shopping basket, each with a name and quantity
 * @param catalogue - A map of item names to their non discounted prices
 * @param offer - An offer of type 'Ratio' that can be applied to the items in the basket
 * @returns The discount amount for the given offer
 */
function ratioDiscount(basket: BasketItem[], catalogue: Map<string, number>, offer: Offer): number {
    if (offer.ratio === undefined) {
        throw new Error(`Offer of type 'Ratio' must have a ratio value`);
    }
    if (offer.ratio.required <= 0 || offer.ratio.paid <= 0) {
        throw new Error(`Offer of type 'Ratio' must have a ratio value with required and paid greater than 0`);
    }
    if (offer.ratio.paid >= offer.ratio.required) {
        throw new Error(`Offer of type 'Ratio' must have a paid value less than required`);
    }
    // Expand all applicable items into individual unit prices and sort descending.
    // Grouping the most expensive items together maximises the discount by making
    // the cheapest item in each group of `required` as expensive as possible.
    const unitPrices: number[] = [];
    for (const item of basket) {
        const itemPrice = catalogue.get(item.itemName)!;
        for (let i = 0; i < item.quantity; i++) {
            unitPrices.push(itemPrice);
        }
    }
    unitPrices.sort((a, b) => b - a);

    const { required, paid } = offer.ratio;
    const freePerGroup = required - paid;
    const numGroups = Math.floor(unitPrices.length / required);
    let offerDiscount = 0;
    for (let g = 0; g < numGroups; g++) {
        // The cheapest `freePerGroup` items within each group are at the end of the group
        for (let f = 0; f < freePerGroup; f++) {
            offerDiscount += unitPrices[g * required + (required - 1 - f)];
        }
    }
    return offerDiscount;
}