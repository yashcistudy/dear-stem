# dear stem · the shop

dear stem is a concept florist and café in Portland. The shop is fictional, and its product and owner photos were made with AI image tools.

This site is a static copy of the dear stem Shopify theme. Every page was rendered from the theme's own Liquid files, so the site and the Shopify store look and work the same. The theme itself, the products CSV and the setup guide are delivered separately.

## Pages

- `/` the shop at the door: drag to look around, tap the owner to ask the counter, tap a dot to walk to the cooler or the wrap station
- `/collections/ready-bouquets/` the cooler, with filters and sorting
- `/products/<handle>/` a bouquet with real sizes, a hand for scale, a vase that fits and a card
- `/pages/build-your-own/` the builder: lay stems on the paper, she wraps it, then drag the standing bouquet round
- `/cart/` the bag
- `/pages/visit/`, `/pages/contact/`, `/search/`, `/collections/vases/`, `/collections/stems/`
- `/build/` the old builder address, now sends you to `/pages/build-your-own/`

## What's different from Shopify

Shopify keeps the bag on its servers. Here it's kept in your browser (`assets/static-cart.js`), and the same Liquid files render it with [liquidjs](https://liquidjs.com). Filters, sorting and search run in the browser too. Checkout and the contact form stop with a short note, because those are Shopify's servers.

## Folders

- `assets/` the theme's assets as they ship in the Shopify theme, plus `static-cart.js`, `static-kit.js` and `liquid.browser.umd.js` for this copy
- `img/` and `build/img/` the photos the Shopify products CSV loads (bouquets, vases, stems, cones)
- `brand-guidelines.pdf` the dear stem brand guidelines

Built with [three.js](https://threejs.org) 0.170. The earlier 3D room and standpoint versions are in the git history (commit e56ebcf and before).
