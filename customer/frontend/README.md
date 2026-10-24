# Iyalvi customer storefront

Design-first React + TypeScript storefront for Iyalvi, a Tamil Nadu saree and kurti boutique. All product data is typed mock data; cart persistence uses local storage. No backend or API calls are used.

## Development

Requires Node 20+ and npm. Run `npm ci`, `npm run dev`, `npm run build`, `npm run lint`, and `npm test`.

`npm run images` creates 480, 960 and 1600 pixel WebP derivatives beside source images under `public/images` only.

## Routes

- `/` Home
- `/sarees` Saree collection
- `/kurtis` Kurti collection
- `/product/:slug` Product details

Instagram reel embeds are loaded only for the selected diary card. The demo display names are placeholders and should be replaced with consented names.
