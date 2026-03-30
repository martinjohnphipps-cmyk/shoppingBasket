# shoppingBasket
Shopping basket pricing library — a TypeScript implementation of a supermarket basket-pricer component.

## Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm (bundled with Node.js)

## Setup
```bash
npm install
```

## Running the tests
```bash
npm test
```
This runs Vitest in single-pass mode and produces a coverage report in the `coverage/` directory.

To run tests in watch mode during development:
```bash
npx vitest
```

## Usage
The library exposes a single `basketPricer` function from `src/utils/basketPricer.ts`.

```ts
import { basketPricer } from './src/utils/basketPricer';

const catalogue = new Map<string, number>([
    ['Baked Beans', 0.99],
    ['Biscuits', 1.20],
    ['Sardines', 1.89],
]);

const offers = [
    { itemNames: ['Baked Beans'], offerType: 'Ratio', ratio: { required: 3, paid: 2 } },
    { itemNames: ['Sardines'], offerType: 'Percentage', discount: 25 },
];

try {
    const { subtotal, discount, total } = basketPricer({
        basket: [
            { itemName: 'Baked Beans', quantity: 4 },
            { itemName: 'Biscuits', quantity: 1 },
        ],
        catalogue,
        offers,
    });

    console.log(subtotal); // 5.16
    console.log(discount); // 0.99
    console.log(total);    // 4.17
} catch (error) {
    // Inspect error.message to determine the cause — see Error handling section below
    console.error('Basket pricing failed:', error.message);
}
```

### Offer types
| `offerType`   | Description | Required fields |
|---------------|-------------|-----------------|
| `Ratio`       | Buy `required` items, pay for `paid` (cheapest free). Works across multiple products. | `ratio: { required, paid }` |
| `Percentage`  | Percentage discount off the item price. | `discount` (0–100) |
| `Numeric`     | Fixed amount off per item. | `discount` |
## Error handling

`basketPricer` throws an `Error` in the situations listed below. As shown in the usage example above, wrap every call in a `try/catch` to handle errors gracefully.

### Conditions that cause an error to be thrown

| Condition | Example message |
|-----------|----------------|
| A basket item has a **negative** quantity | `Item Baked Beans must have a non-negative quantity` |
| A basket item is **not found** in the catalogue | `Item Baked Beans not found in catalogue` |
| A `Percentage` offer is missing its `discount` field | `Offer of type 'Percentage' must have a discount value` |
| A `Percentage` offer `discount` is outside 0–100 | `Offer of type 'Percentage' must have a discount value between 0 and 100` |
| A `Numeric` offer is missing its `discount` field | `Offer of type 'Numeric' must have a discount value` |
| A `Numeric` offer `discount` is **negative** | `Offer of type 'Numeric' must have a non-negative discount value` |
| A `Numeric` offer `discount` exceeds the item price | `Offer of type 'Numeric' cannot have a discount value greater than the item price` |
| A `Ratio` offer is missing its `ratio` field | `Offer of type 'Ratio' must have a ratio value` |
| A `Ratio` offer has `required` or `paid` ≤ 0 | `Offer of type 'Ratio' must have a ratio value with required and paid greater than 0` |
| A `Ratio` offer has `paid` ≥ `required` | `Offer of type 'Ratio' must have a paid value less than required` |
| An offer has an unrecognised `offerType` | `Unknown offer type: X` |

> **Note:** A basket item with a quantity of `0` is silently skipped — no error is thrown and it contributes nothing to the subtotal or discount.