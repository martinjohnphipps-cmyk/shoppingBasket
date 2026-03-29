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
 */
export function basketPricer({basket, catalogue, offers}: BasketPricerProps) {
    let subtotal = 0;
    let discount = 0;
    let total = 0;

    for(const item of basket) {
        const itemPrice = catalogue.get(item.itemName);
        if(itemPrice === undefined)
        {
            throw new Error(`Item ${item.itemName} not found in catalogue`);
        }
        subtotal += itemPrice * item.quantity;

        const applicableOffers = offers.filter(offer => offer.itemNames.includes(item.itemName));
        for (const offer of applicableOffers) {
            discount += calculateOfferDiscount(item, itemPrice, offer);
        }
    }

    total = subtotal - discount;

    return {
        subtotal,
        discount,
        total
    }
}

function calculateOfferDiscount(item: BasketItem, itemPrice: number, offer: Offer): number {
    let offerDiscount = 0;

    switch (offer.offerType) {
        case 'Percentage': 
            if(offer.discount === undefined) {
                throw new Error(`Offer of type 'Percentage' must have a discount value`);
            }
            offerDiscount = (offer.discount / 100) * itemPrice * item.quantity;
            break;
        case 'Numeric':
            if(offer.discount === undefined) {
                throw new Error(`Offer of type 'Numeric' must have a discount value`);
            }
            offerDiscount = offer.discount * item.quantity;
            break;
        case 'Ratio': {
            if(offer.ratio === undefined) {
                throw new Error(`Offer of type 'Ratio' must have a ratio value`);
            }
            if(offer.ratio.required <= 0 || offer.ratio.paid <= 0) {
                throw new Error(`Offer of type 'Ratio' must have a ratio value with required and paid greater than 0`);
            }
            const setsOfOfferApplicable = Math.floor(item.quantity / offer.ratio.required);
            offerDiscount = setsOfOfferApplicable * (offer.ratio.required - offer.ratio.paid) * itemPrice;
            break;
        }
        default:
            throw new Error(`Unknown offer type: ${offer.offerType}`);
    }

    return offerDiscount;
}