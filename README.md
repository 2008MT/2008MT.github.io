# maeltok — personal website

Plain HTML, CSS and JavaScript. No build step: edit a file on GitHub, save, and the site updates in about a minute.

## Put it online (once)

1. On GitHub, create a **public** repository named exactly `2008MT.github.io`.
2. Click **Add file → Upload files** and drag in everything from this folder (keep the `assets` and `files` folders). Click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
4. After a minute the site is live at **https://2008mt.github.io**. Your existing pages (`/aru-garch-var/`, `/efficient-frontier-3d/`) keep working.

## Edit something

Open the file on GitHub, click the pencil icon, change the text, then **Commit changes**.

| To change… | Edit |
|---|---|
| Any text (about, experience, research, highlights, personal, contact) | `index.html`: each section starts with a comment like `<!-- ===== EXPERIENCE ===== -->` |
| Places on the map and timeline | `assets/main.js`: the `PLACES` list at the very top |
| The essay | `essay.html` |
| Your CV | upload a new `files/Mael_Tok_CV.pdf` with the **same name** (this public version has no phone number) |
| Colours or fonts | `assets/style.css`: the variables at the top (`--accent` is the bordeaux) |

### Add a photo

1. Resize it to about 1400 px on the long side (a JPG under ~300 KB) and upload it to `assets/img/`.
2. Copy an existing `<figure>…</figure>` block in `index.html` and change the file name, the `alt` text and the caption.

Tip: photos straight from a phone can contain GPS location data. Export or resize them before uploading, which removes it.

### Add a new place

Add a line to `PLACES` in `assets/main.js`, for example:

```js
{ city: "London", country: "United Kingdom", flags: ["gb"], years: "2028", lat: 51.507, lon: -0.128 },
```

Then add the flag file (`gb.svg`) to `assets/flags/`. Flags come from the free `flag-icons` set (4x3 versions).
