import path from 'path';
import mkdirp from 'mkdirp';
import jetpack from 'fs-jetpack';

/**
 * Return the subDir of an image by removing the filename portion of the path.
 * We typically use subDir to link an initially imported album
 * with images under it.
 *
 * @param {*} origFile - subDir + fileName
 * @returns
 */
export const getSubDir = (origFile) => {
  return path.parse(origFile).dir;
};

/**
 * Generate: yyyy/yyyy-mm/yyyy-mm-dd subpath from today's current date.
 */
export const getCurrentDatePath = () => {
  const dt = new Date();
  const dd = dt.getDate() < 10 ? `0${dt.getDate()}` : `${dt.getDate()}`;
  const mm =
    dt.getMonth() < 9 ? `0${dt.getMonth() + 1}` : `${dt.getMonth() + 1}`;
  const yyyy = `${dt.getFullYear()}`;
  return `${yyyy}${path.sep}${yyyy}-${mm}${path.sep}${yyyy}-${mm}-${dd}`;
};

/**
 * Either get the datePath from the image's EXIF date
 * or use today's date (maybe use metadata.ts?).
 *
 * @param {*} metadata
 * @returns
 */
export const getDateDir = (metadata) => {
  const exifDate =
    metadata && metadata.exif && metadata.exif.DateTimeOriginal
      ? metadata.exif.DateTimeOriginal
      : '';
  const dateDir = exifDate ? parseExifDatePath(exifDate) : getCurrentDatePath();
  // console.log(`metadata.exif.DateTimeOriginal`, metadata.exif.DateTimeOriginal);
  // console.log(`dateDir: ${dateDir}`);
  return dateDir;
};

/**
 * Generate the subpath based on an image's metadata and a
 * provided render configuration.
 *
 * @param {*} metadata
 * @param {*} render
 * @returns
 */
export const getFilename = (metadata, render) => {
  const pathDetails = path.parse(metadata.origPath);
  return `${pathDetails.name}.${render.name}.${'q' + render.quality}${
    render.format
  }`;
};

/**
 * Generate: yyyy/yyyy-mm/yyyy-mm-dd subpath from a date string
 * (format from exif in gm library).
 *
 * @param {*} dateStr
 */
export const parseExifDatePath = (dateStr) => {
  if (!dateStr) {
    return null;
  }
  const dateObj = new Date(dateStr);
  const dt = dateObj.toISOString().toString().split('T')[0];
  // console.log(`>>> dataObj.toISOString()`, dateObj.toISOString(), dt);
  if (dt) {
    const [yyyy, mm, dd] = dt.split('-');
    const formatted = `${yyyy}${path.sep}${yyyy}-${mm}${path.sep}${yyyy}-${mm}-${dd}`;
    // console.log(`formatted: ${formatted}`);
    return formatted;
  }
  return null;
};

/**
 * Create an image's directory based on
 * the provided rendersDir and dateDir
 * @param {*} rendersDir -- top level renders directory
 * @param {*} dateDir -- multilevel folder hierarchy
 */
export const createImageDir = (rendersDir, dateDir) => {
  const targetDir = `${rendersDir}${path.sep}${dateDir}`;
  if (!jetpack.exists(targetDir)) {
    console.log(`creating ${targetDir} ...`);
    mkdirp.sync(targetDir);
  }
};

export const readJson = async (filepath) => {
  return await jetpack.readAsync(filepath, 'json');
};

const fs = {
  getSubDir,
  getCurrentDatePath,
  getDateDir,
  getFilename,
  parseExifDatePath,
  createImageDir,
  readJson,
};

export default fs;
