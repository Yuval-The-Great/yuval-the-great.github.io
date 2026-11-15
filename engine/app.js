// app.js: the engine of the photo site.
// It does four jobs, in order:
//   1. Load your settings (data/site.json)
//   2. Load your theme (a CSS file)
//   3. Load your photo list (data/photos.json) and draw the gallery
//   4. Make the lightbox (big photo view) work

// ---------- Job 1: loading data ----------

// fetch() asks for a file. It takes time, so we use "async/await":
// "await" means "wait here until the file has arrived".
async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("Could not load " + path);
  }
  return response.json(); // turns the text into a JavaScript object
}

// ---------- Job 2: loading a theme ----------

// We look for your own theme in data/themes/ first.
// If it isn't there, we use a built-in one from engine/themes/.
function loadTheme(themeName) {
  const myPath = siteBasePath + "data/themes/" + themeName + "/theme.css";
  const builtInPath = siteBasePath + "engine/themes/" + themeName + "/theme.css";

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = myPath;
  // onerror runs if the file wasn't found: try the built-in theme instead.
  link.onerror = function () {
    link.onerror = null;
    link.href = builtInPath;
  };
  document.head.appendChild(link);
}

// ---------- Job 3: drawing the gallery ----------

function showSiteInfo(site) {
  document.title = site.title;
  document.getElementById("site-title").textContent = site.title;
  document.getElementById("site-subtitle").textContent = site.subtitle || "";
  document.getElementById("site-footer").textContent = site.footer || "";
}

// Makes one photo "card": a picture with its caption under it.
function makePhotoCard(photo) {
  const figure = document.createElement("figure");
  figure.className = "photo-card";

  const img = document.createElement("img");
  const extensionIndex = photo.file.lastIndexOf(".");
  const thumbnailFile = photo.file.slice(0, extensionIndex) +
    "_thumbnail" + photo.file.slice(extensionIndex);
  img.src = siteBasePath + "data/images/thumbs/" + thumbnailFile;
  img.alt = photo.title || photo.file;
  img.loading = "lazy"; // only download when scrolled near

  const caption = document.createElement("figcaption");
  // "caption" is the short text. If you didn't write one, we use the title.
  caption.textContent = photo.caption || photo.title || "";

  figure.appendChild(img);
  figure.appendChild(caption);

  // When the card is clicked, open the lightbox.
  figure.addEventListener("click", function () {
    navigateToPhoto(photo);
  });
  return figure;
}

function showGallery(photos) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";
  for (const photo of photos) {
    gallery.appendChild(makePhotoCard(photo));
  }
}

// ---------- Job 4: the lightbox ----------

const lightbox = document.getElementById("lightbox");
let siteBasePath = "/";
let activePhotoFile = null;
let currentPhotos = [];

async function openLightbox(photo) {
  activePhotoFile = photo.file;
  document.getElementById("lightbox-image").src = siteBasePath + "data/images/" + photo.file;
  document.getElementById("lightbox-image").alt = photo.title || photo.file;
  // textContent (not innerHTML) keeps text safe: it can never run as code.
  document.getElementById("lightbox-title").textContent = photo.title || "";
  document.getElementById("lightbox-caption").textContent = photo.caption || "";
  document.getElementById("lightbox-description").textContent = photo.description || "";
  const exifLine = document.getElementById("lightbox-exif");
  exifLine.textContent = "";
  lightbox.hidden = false;

  // Camera info is a bonus. Turn it off for a photo with "exif": false.
  if (photo.exif === false) return;
  // Anything you type in "exif" in photos.json wins over what the file says.
  // This is how scanned photos can have camera info too.
  const typedExif = typeof photo.exif === "object" ? photo.exif : {};
  const fileExif = await getFileExif(photo.file);
  // If the user already opened a different photo while we waited, stop.
  if (lightbox.hidden || activePhotoFile !== photo.file) return;
  exifLine.textContent = formatExif(Object.assign({}, fileExif, typedExif));
}

function photoUrl(file) {
  return siteBasePath + "photo/" + encodeURIComponent(file);
}

function navigateToPhoto(photo) {
  const nextUrl = photoUrl(photo.file);
  if (location.pathname !== nextUrl) {
    history.pushState({ photoGallery: true }, "", nextUrl);
  }
  openLightbox(photo);
}

function showRoute(photos) {
  const routePrefix = siteBasePath + "photo/";
  if (!location.pathname.startsWith(routePrefix)) {
    hideLightbox();
    return;
  }

  let file;
  try {
    file = decodeURIComponent(location.pathname.slice(routePrefix.length));
  } catch (error) {
    hideLightbox();
    return;
  }
  const photo = photos.find(function (item) {
    return item.file === file;
  });
  if (photo) openLightbox(photo);
  else hideLightbox();
}

function hideLightbox() {
  activePhotoFile = null;
  lightbox.hidden = true;
}

// Reads EXIF from the image file. Remembers results so each file is read once.
const exifCache = {};
async function getFileExif(file) {
  if (!(file in exifCache)) {
    try {
      const response = await fetch(siteBasePath + "data/images/" + file);
      exifCache[file] = readExif(await response.arrayBuffer());
    } catch (error) {
      exifCache[file] = {}; // couldn't read it: no problem
    }
  }
  return exifCache[file];
}

function closeLightbox() {
  if (location.pathname.startsWith(siteBasePath + "photo/")) {
    if (history.state && history.state.photoGallery) {
      history.back();
      return;
    }
    history.replaceState(null, "", siteBasePath);
  }
  hideLightbox();
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
// Clicking the dark background (not the photo) also closes it.
lightbox.addEventListener("click", function (event) {
  if (event.target === lightbox) closeLightbox();
});
window.addEventListener("popstate", function () {
  showRoute(currentPhotos);
});
// Pressing the Escape key closes it too.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeLightbox();
});

// ---------- Start everything ----------

async function start() {
  try {
    const routeIndex = location.pathname.lastIndexOf("/photo/");
    if (routeIndex !== -1) {
      siteBasePath = location.pathname.slice(0, routeIndex + 1);
    } else {
      siteBasePath = location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1);
    }
    const site = await loadJson(siteBasePath + "data/site.json");
    loadTheme(site.theme || "classic");
    showSiteInfo(site);
    currentPhotos = await loadJson(siteBasePath + "data/photos.json");
    showGallery(currentPhotos);
    showRoute(currentPhotos);
  } catch (error) {
    // If something goes wrong, show the message so it's easy to debug.
    document.getElementById("gallery").textContent = "Oops: " + error.message;
  }
}

start();
