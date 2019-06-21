# Lodash Integration

The Skypager Runtime instance provides the lodash library to anyone who needs it.

Each helper also includes a reference to lodash, so you can take advantage of its many functions.

Lodash works really well with a google spreadsheet, especially its chaining API and composability.

```javascript
export const sheetId = 'unique-sheet-id'

export function getProductsBySku() {
  return this.chain
    .get('data.products', [])
    .keyBy('sku')
    .value()
}

export function getLastTenSales() {
  return this.chain
    .get('data.transactions', [])
    .sortBy('saleDate')
    .reverse()
    .slice(0, 10)
    .map((sale) => ({ ...sale, product: this.productsBySku[sale.sku]}))
    .value()
}
```

If you don't like the chaining API, you can use individual lodash functions

```javascript
export const sheetId = 'unique-sheet-id'

export function getProductsBySku() {
  const { get, keyBy } = this.lodash
  return keyBy(
    get(this, 'data.products', []),
    'sku'
  )
}

export function getLastTenSales() {
  const { get, sortBy } = this.lodash
  const { productsbySku } = this
  const sales = sortBy(get(this, 'data.transactions', []), 'saleDate').reverse().slice(0, 10)

  return sales.map((sale) => ({
    ...sale,
    product: productsBySku[sale.sku]
  }))
}
```

The main idea behind this is these lodash functions easily save to disk and are cached as modules.

When you combine them with the state of the spreadsheet at the current time, this becomes a great way of representing that data and working with it in JavaScript