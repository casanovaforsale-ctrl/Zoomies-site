# zoomies.casanovanjpa.com

The Zephyr Zoomie Zone: dog gear sold through TikTok Shop.

- `src/` holds the page bodies and `_layout.html` (header, footer, SEO tags and store structured data).
- `static/` holds CSS, JavaScript, images, self-hosted fonts, `CNAME` and `robots.txt`.
- `products.json` is the shop list: TikTok product id, title, price, stock and image alt text, one entry per live listing. Product photos sit at `static/assets/img/shop/<id>.webp` (600x600). The build turns the list into the cards and the search-engine product data, and links each card to `https://www.tiktok.com/shop/pdp/<id>` (the older `shop.tiktok.com/view/product/<id>` links land on a TikTok security-check puzzle). A product with `"hidden": true` stays in the file but off the page; one with 25 or fewer in stock shows "Only N left".
- Run `python3 tools/build.py`. It writes `docs/`, which GitHub Pages serves (Settings → Pages → Deploy from a branch → `main` / `/docs`), and `preview/` (git-ignored) for opening from disk.
- `formspreeId` in `static/assets/js/site.js`: paste a Formspree form ID to have the contact form email you. While empty, the form opens the visitor's email app.
- DNS: CNAME `zoomies` → `casanovaforsale-ctrl.github.io`.
