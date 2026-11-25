# Goodreads Reading Stats Dashboard

A working web version of the Reading Stats dashboard concept from the GIXD501 Figma file (Hi-fi, Option G). It's plain HTML, CSS and JavaScript, with no framework and no build step.

## Run it

Open `index.html` (the Goodreads-style start page) in a browser, or serve the folder (recommended, so every browser loads the covers):

```sh
cd goodreads-dashboard
python3 -m http.server 8000
# then open http://localhost:8000 and choose Reading Stats
# (or go straight to http://localhost:8000/reading-stats.html)
```

To publish it, any static host works, including GitHub Pages (Settings > Pages > deploy from the main branch, root folder).

## Update the data

1. Export your library from Goodreads (My Books > Import and export > Export library).
2. Replace `data/goodreads_library_export.csv` with the new file.
3. Run `python3 scripts/build_data.py`. This rewrites `js/data.js`.

Covers live in `covers/` and are matched to titles automatically by file name (for example `dungeon-crawler-carl.jpg`). Books without a matching cover show a title placeholder.

Content that isn't in the export lives in `js/content.js`: genre groupings and insights, recommendations, format counts, listening hours by time of day, and community ratings for books in progress. Edit it directly.

## What works

- **Light and dark mode.** Follows your device by default. Override it in the avatar menu under Appearance (saved in the browser).
- **Time range dropdown.** Filters the hero stats (books, pages, average rating) and the ratings chart by date read.
- **Reading challenge.** Ring and pace come from the export. Edit goal opens a dialog and saves the new goal.
- **Currently Reading.** Format chips filter the list. Update progress validates the page number, saves it and updates the bar.
- **Books Per Year.** Click a year to load that year's books into the carousel.
- **Carousels.** Swipe, drag with a mouse, use the pills, arrow keys, or the Prev and Next buttons on phones.
- **Top Genres.** Tabs switch the panel. "Go deeper" and "Try something adjacent" jump to recommendations and filter them.
- **Section rail.** On screens 1280 px and wider, jump between sections. The current section's square grows as you scroll.
- **Responsive.** Breakpoints at 1399, 1023 and 599 px match the Figma layout grid.

Goal and progress changes are stored only in your browser (localStorage). Nothing is sent anywhere. Header links, search, and the footer are visual only.

## Privacy note

`data/goodreads_library_export.csv` and `js/data.js` contain your full reading history, including ratings and dates. If the repository is public, that data is public too. To keep the CSV out of git, uncomment its line in `.gitignore`. The page only needs `js/data.js`.

## Files

```
index.html               start page (Goodreads home), links to Reading Stats
reading-stats.html       the dashboard
css/tokens.css           colors, type and spacing from the Figma variables
css/styles.css           layout and components
js/data.js               generated from your export (don't edit)
js/content.js            hand-written content
js/shell.js              shared header menus, theme and footer switch
js/app.js                dashboard rendering and interactions
scripts/build_data.py    CSV -> js/data.js
covers/                  book covers (480 px tall JPEGs)
```
