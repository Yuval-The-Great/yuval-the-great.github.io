# PhotoSiteStarter

A lightweight, free alternative to Adobe Portfolio. It is plain **HTML, CSS and JavaScript** (no frameworks) and is hosted for free with **GitHub Pages**. GitHub Actions creates smaller image thumbnails and deploys the site. The code is written with lots of comments so students (around 7th grade) can read it, learn from it, and change it.

## How the system works

The repo is split into two parts so you can **update the engine without losing your work**:

| Folder / file | Whose is it? | What it does |
|---|---|---|
| `index.html`, `engine/` | The engine (main repo) | Draws the site. Gets updated. **Don't edit your photos here.** |
| `data/` | **You** | Your settings, photo list, images and custom themes. |

```
index.html            page skeleton
engine/
  exif.js             reads camera info from JPEGs (optional)
  app.js              the code (heavily commented)
  base.css            layout
  themes/classic/     built-in theme
  themes/dark/        built-in theme
data/
  site.json           title, subtitle, footer, chosen theme
  photos.json         list of your photos
  images/             your image files
  themes/             your own themes
```

## Getting started

1. **Fork** this repo on GitHub.
2. In your fork go to **Settings → Pages** and set the source under **Build and deployment** to **GitHub Actions**.
3. Put your pictures in `data/images/`.
4. List them in `data/photos.json`:
   ```json
   [
     { "file": "sunset.jpg", "title": "Sunset", "description": "Taken at the beach." }
   ]
   ```
   Only `file` is required. Other fields (all optional):
   - `title`: the photo's name (shown in the big view)
   - `caption`: short text under the thumbnail (falls back to the title)
   - `description`: longer text shown in the big view
   - `exif`: camera info is read automatically from JPEG files and shown in the big view. For scanned photos with no camera data, type your own, e.g. `"exif": { "make": "Canon", "model": "AE-1", "fNumber": 8, "exposureTime": 0.004, "iso": 400, "dateTaken": "1985:06:01" }`. Use `"exif": false` to hide it.
5. Every push to `main` runs GitHub Actions, which creates maximum-800-pixel `_thumbnail` copies in `data/images/thumbs/` and deploys the site. This generated folder is ignored by Git; the workflow creates it from your original photos. To build thumbnails locally for preview, run `npm install` once and then `npm run build`. The gallery loads thumbnails, while clicking one opens the original image.
6. Edit `data/site.json` for your title, subtitle and footer.
7. Visit `https://YOUR-USERNAME.github.io/PhotoSiteStarter/`.

Clicking a photo opens a shareable URL such as
`https://YOUR-USERNAME.github.io/PhotoSiteStarter/photo/sunset.jpg`.
The browser's Back and Forward buttons move between the gallery and photos
without reloading the page. GitHub Pages uses `404.html` to load direct photo
links into the app.

To preview on your computer, run `python3 -m http.server` in the repo folder and open http://localhost:8000 (opening the file directly won't work because browsers block `fetch` on `file://`).

## Themes

Set the theme in `data/site.json`: `"theme": "dark"`. Built-in themes: `classic`, `dark`.

### Make your own theme
1. Copy `data/themes/example` to `data/themes/mytheme`.
2. Edit `theme.css` (colors, fonts, spacing, hover effects). The page elements you can style are `body`, `#site-title`, `#site-subtitle`, `#gallery`, `.photo-card`, `.photo-card img`, `#lightbox`, `#lightbox-close`, `#site-footer`. The `--gap` variable sets the space between photos.
3. Set `"theme": "mytheme"` in `data/site.json`.

Themes in `data/themes/` win over built-in themes with the same name, and they are never overwritten by engine updates.

## Getting engine updates

Add the main repo as `upstream` and merge it. Because your changes live only in `data/`, there should be no conflicts:

```
git remote add upstream https://github.com/EastsidePreparatorySchool/PhotoSiteStarter.git
git fetch upstream
git merge upstream/main
```
(On GitHub you can also use the **Sync fork** button.)

## Contributing to the engine

Keep code simple and explain it with comments written for 7th graders: prefer clear names and small functions over clever tricks.
