export type BasketItem = {
    itemName: string;
    quantity: number;
};

/**
 * A type describing offers product(s) are eligible for
 * 
 * offerType 'Ratio' means that the discount is applied to the cheapest item in the offer, this is represented by
 * a ratio property of the items required to be bought, and the amount that it costs.
 * For example where 2 items are required and 1 is paid means that if you buy 2 items you only pay for 1
 * (aka buy one get one free), where this is applied to multiple different items the cheapest items applicable
 * will be discounted
 * 
 * offerType 'Percentage' means it is a percentage discount, discount field represents the percentage discount
 * to be applied, for example a discount value of 25 means that a 25% discount is applied to the item price
 * 
 * offerType 'Numeric' means it is a fixed amount discount per item, discount field represents the amount to be
 * discounted per item, for example a discount value of 0.5 means that 50p is discounted from the price of each item
 */
export type Offer = {
    itemNames: string[];
    offerType: 'Ratio' | 'Percentage' | 'Numeric';
    discount?: number;
    ratio?: { required: number; paid: number };
}