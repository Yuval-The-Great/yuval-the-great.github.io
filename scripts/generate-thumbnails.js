const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const projectDirectory = path.resolve(__dirname, "..");
const imagesDirectory = path.join(projectDirectory, "data", "images");
const thumbnailsDirectory = path.join(imagesDirectory, "thumbs");
const photosPath = path.join(projectDirectory, "data", "photos.json");

function isInsideDirectory(directory, filePath) {
  const relativePath = path.relative(directory, filePath);
  return relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(".." + path.sep) &&
    !path.isAbsolute(relativePath);
}

async function buildThumbnails() {
  const photos = JSON.parse(await fs.readFile(photosPath, "utf8"));
  if (!Array.isArray(photos)) {
    throw new Error("data/photos.json must contain a list of photos.");
  }

  await fs.mkdir(thumbnailsDirectory, { recursive: true });

  for (const [index, photo] of photos.entries()) {
    if (!photo || typeof photo.file !== "string" || !photo.file.trim()) {
      throw new Error(`Photo ${index + 1} must have a file name.`);
    }

    const sourcePath = path.resolve(imagesDirectory, photo.file);
    if (!isInsideDirectory(imagesDirectory, sourcePath)) {
      throw new Error(`Photo ${index + 1} must refer to a file inside data/images.`);
    }

    const extension = path.extname(sourcePath);
    if (!extension) {
      throw new Error(`Photo ${index + 1} must have a file extension.`);
    }

    const thumbnailPath = path.join(
      thumbnailsDirectory,
      path.basename(sourcePath, extension) + "_thumbnail" + extension
    );

    await sharp(sourcePath)
      .rotate()
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true
      })
      .toFile(thumbnailPath);

    console.log(`Created ${path.relative(projectDirectory, thumbnailPath)}`);
  }
}

buildThumbnails().catch(function (error) {
  console.error("Could not build photo thumbnails:", error.message);
  process.exitCode = 1;
});
