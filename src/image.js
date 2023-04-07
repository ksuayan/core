import fs from 'fs';
import exifr from 'exifr';
import sharp from 'sharp';
import path from 'path';
import { getSubDir, getDateDir, getFilename, createImageDir } from './fs.js';
import { STATUS, ORIENTATION } from './constants.js';

/**
 *
 * Implement a version that replaces GraphicsMagick with sharp NPM.
 * Preload IPTC information from exifr's parse() method early on.
 *
 */
const JSON_INDENT = 0,
  REGEX_SQUARE_THUMB = /^s(\d+)/,
  REGEX_BY_WIDTH = /^w(\d+)/;

const EXIFR_OPTIONS = {
  xmp: true,
  iptc: true,
  exif: true,
  gps: true,
  jfif: true,
  tiff: true,
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
};

export const showSharpInfo = () => {
  console.log('sharp globals');
  console.log(`formats ${JSON.stringify(sharp.format, null, 2)}`);
  console.log(`interpolators ${JSON.stringify(sharp.interpolators, null, 2)}`);
  console.log(`versions ${JSON.stringify(sharp.versions, null, 2)}`);
  console.log(`cache ${JSON.stringify(sharp.cache(), null, 2)}`);
  console.log(`vendor ${JSON.stringify(sharp.vendor, null, 2)}`);
  console.log(`concurrency ${JSON.stringify(sharp.concurrency(), null, 2)}`);
};
/**
 *
 * Construct a cleaned up IPTC hierarchy only for stuff we're interested in.
 *
 * @param {*} metadata
 * @returns
 */
export const toIPTCDataObject = (metadata) => {
  const {
    Artist,
    Software,
    Location,
    Sublocation,
    City,
    State,
    CountryCode,
    Country,
    latitude,
    longitude,
    Keywords,
    Rating,
    subject,
    creator,
    Make,
    Model,
    Lens,
    LensModel,
    RawFileName,
    ISO,
    MeteringMode,
    ExposureProgram,
    ExposureMode,
    ExposureTime,
    Flash,
    FocalLength,
    FocalLengthIn35mmFormat,
    FNumber,
    ShutterSpeedValue,
    ApertureValue,
    OriginalDocumentID,
    CreateDate,
    DateTimeOriginal,
    hierarchicalSubject,
  } = metadata;
  // remap attributes ...
  let iptcObj = {
    creator: creator || '',
    cameraMake: Make,
    cameraModel: Model,
    lens: Lens,
    lensModel: LensModel,
    rawfile: RawFileName,
    iso: ISO,
    meteringMode: MeteringMode,
    shutterSpeed: ShutterSpeedValue,
    aperture: ApertureValue,
    fNumber: FNumber,
    exposureTime: ExposureTime,
    exposureProgram: ExposureProgram,
    exposureMode: ExposureMode,
    flash: Flash,
    focalLength: FocalLength,
    focalLength35mm: FocalLengthIn35mmFormat,
    origDocID: OriginalDocumentID,
    origDate: DateTimeOriginal
      ? DateTimeOriginal
      : CreateDate
      ? CreateDate
      : null,
    software: Software,
    location: Location ? Location : null,
    sublocation: Sublocation ? Sublocation : null,
    city: City ? City : null,
    state: State ? State : null,
    countryCode: CountryCode ? CountryCode : null,
    country: Country,
    latitude: latitude ? latitude : null,
    longitude: longitude ? longitude : null,
  };
  // console.log(iptcObj);
  if (Keywords) iptcObj.keywords = Keywords;
  if (Rating) iptcObj.rating = Rating;
  if (subject) iptcObj.subject = subject;
  if (hierarchicalSubject) iptcObj.tags = hierarchicalSubject;
  if (Artist) iptcObj.artist = Artist;
  if (latitude && longitude) iptcObj.gpsLatLong = [latitude, longitude];
  return iptcObj;
};

/**
 * Use exifr to asynchronously read an image's EXIF metadata.
 *
 * @param {*} imagePath
 * @returns
 */
const parseExifR = async (imagePath) => {
  return new Promise((resolve, reject) => {
    exifr
      .parse(imagePath, EXIFR_OPTIONS)
      .then((meta) => {
        resolve(meta);
      })
      .catch((err) => {
        console.log(`Error in exifr.parse(): ${err.message}`);
        reject(err);
      });
  });
};

/**
 * Read an image's metadata information given a sourcePath.
 * Pass in the imageDir so that we can generate subpaths of the image itself.
 *
 * Set its .origPath, .origDir, and .origFile fields from the resolvedPath.
 * Set its time stamp (ts).
 * Set its EXIF data.
 *
 * @param {*} sourceImage
 * @returns {
 *   origPath, -- the original fullpath location of the source image
 *   origFile, -- subDir + fileName
 *   subDir,
 *   ts,
 *   orientation,
 *   exif,
 *   iptc
 * }
 */
export const readExifMetadata = async (sourceImage, sourceDir) => {
  const resolvedPath = path.resolve(sourceImage),
    origPath = resolvedPath,
    origFile = resolvedPath.replace(sourceDir, ''),
    subDir = getSubDir(origFile),
    ts = new Date().valueOf().toString();

  let exif = await parseExifR(sourceImage);
  const iptc = toIPTCDataObject(exif);

  return new Promise((resolve, reject) => {
    sharp(resolvedPath)
      .metadata()
      .then((sharpOutput) => {
        const { width, height } = sharpOutput;
        const orientation =
          height > width ? ORIENTATION.PORTRAIT : ORIENTATION.LANDSCAPE;
        iptc.size = { width, height };

        // Note dtCreated is the date this file
        // was created in the system, e.g.
        // exported from Adobe Lightroom or Apple Photos
        // it is NOT the date the image was taken.

        let bytes, dtCreated;
        const stats = fs.statSync(resolvedPath);
        if (stats.isFile()) {
          bytes = stats.size;
          dtCreated = stats.birthtime;
        }

        const fullMetadata = {
          origPath,
          origFile,
          subDir,
          ts,
          orientation,
          exif,
          iptc,
          size: { width, height },
          bytes,
          dtCreated,
        };

        resolve(fullMetadata);
      })
      .catch((err) => {
        console.log(`Error in sharp.readExifMetadata: ${err.message}`);
        reject(err);
      });
  });
};

/**
 * Resize an image based on image width.
 * @param {*} metadata - json object
 * @param {*} render - render target
 * @param {*} outputFile - destination file
 */
export const resizeByWidth = (metadata, render, outputFile) => {
  const {
    name,
    file,
    size: renderSize,
    quality: renderQuality,
    format,
  } = render;
  const { origPath } = metadata;
  return new Promise((resolve, reject) => {
    const successHandler = (data) => {
      console.log(
        `saved resizeByWidth(${name}): ${JSON.stringify(
          data,
          null,
          JSON_INDENT
        )}`
      );
      data.status = STATUS.SUCCESS;
      resolve(data);
    };
    const errorHandler = (writeErr) => {
      const message = `Error in resizeByWidth(${renderSize}): ${writeErr}`;
      console.error(message);
      reject({
        status: STATUS.ERROR,
        name,
        file,
        message,
        error: writeErr,
      });
    };

    if (format === '.webp') {
      sharp(origPath)
        .resize({ width: renderSize, fit: sharp.fit.inside })
        .webp({ quality: renderQuality })
        .toFile(outputFile)
        .then(successHandler)
        .catch(errorHandler);
    } else {
      sharp(origPath)
        .resize({ width: renderSize, fit: sharp.fit.inside })
        .jpeg({ quality: renderQuality, mozjpeg: true })
        .toFile(outputFile)
        .then(successHandler)
        .catch(errorHandler);
    }
  });
};

/**
 * Crop an image to cover the target aspect ratio,
 * while maintaining pixel proportions of the original
 * before scaling to the target size.
 *
 * Emulate 'object-cover' in tailwindcss.
 *
 * @param {*} metadata
 * @param {*} render
 * @param {*} outputFile
 * @returns
 */
export const resizeToCover = (metadata, render, outputFile) => {
  const {
    name,
    file,
    width: targetWidth,
    height: targetHeight,
    quality: renderQuality,
    format,
  } = render;
  const { origPath } = metadata;
  return new Promise((resolve, reject) => {
    const successHandler = (data) => {
      console.log(
        `saved resizeToCover(${name} ${targetWidth}x${targetHeight}): ${JSON.stringify(
          data,
          null,
          JSON_INDENT
        )}`
      );
      data.status = STATUS.SUCCESS;
      resolve(data);
    };
    const errorHandler = (writeErr) => {
      const message = `Error in resizeToCover(${targetWidth}x${targetHeight}): ${writeErr}`;
      console.error(message);
      reject({
        status: STATUS.ERROR,
        name,
        file,
        message,
        error: writeErr,
      });
    };

    if (format === '.webp') {
      sharp(origPath)
        .resize({
          width: targetWidth,
          height: targetHeight,
          fit: sharp.fit.cover,
        })
        .webp({ quality: renderQuality })
        .toFile(outputFile)
        .then(successHandler)
        .catch(errorHandler);
    } else {
      sharp(origPath)
        .resize({
          width: targetWidth,
          height: targetHeight,
          fit: sharp.fit.cover,
        })
        .jpeg({ quality: renderQuality, mozjpeg: true })
        .toFile(outputFile)
        .then(successHandler)
        .catch(errorHandler);
    }
  });
};

/**
 * Create a square thumbnail based for a given renderTarget
 * @param {*} metadata
 * @param {*} render
 * @param {*} outputFile
 */
export const squareThumbnail = (metadata, render, outputFile) => {
  const {
    name,
    file,
    size: renderSize,
    quality: renderQuality,
    format,
  } = render;
  const { origPath } = metadata;
  // console.log(`thumbnail from ${origPath} (${exifWidth}x${exifHeight})`);
  // console.log(`to ${outputFile} at q=${renderQuality}, size=${renderSize}`);
  return new Promise((resolve, reject) => {
    const successHandler = (data) => {
      console.log(
        `saved squareThumbnail(${name}): ${JSON.stringify(
          data,
          null,
          JSON_INDENT
        )}`
      );
      data.status = STATUS.SUCCESS;
      resolve(data);
    };
    const errorHandler = (writeErr) => {
      const message = `Error in squareThumbnail(): ${writeErr}`;
      console.error(message);
      reject({
        status: STATUS.ERROR,
        name,
        file,
        message,
        error: writeErr,
      });
    };

    if (format === '.webp') {
      sharp(origPath)
        .resize({ width: renderSize, height: renderSize, fit: sharp.fit.cover })
        .webp({ quality: renderQuality })
        .toFile(outputFile)
        .then(successHandler)
        .catch(errorHandler);
    } else {
      sharp(origPath)
        .resize({ width: renderSize, height: renderSize, fit: sharp.fit.cover })
        .jpeg({ quality: renderQuality, mozjpeg: true })
        .toFile(outputFile)
        .then(successHandler)
        .catch(errorHandler);
    }
  });
};

/**
 * Data generator.
 *
 * Get the rendition targets (data structure) for a single source image.
 * createReditions() will perform actual file creation.
 *
 * - Figure out its date directory.
 * - Get its rendition targets based on the image's
 *   actual size (resolution).
 * - Only create renditions smaller than the image itself.
 *
 * @param {*} metadata
 * @param {*} renditionProfiles
 * @returns
 */
export const getRenditionTargets = (metadata, renditionProfiles) => {
  let targets = {};
  const exifSize = metadata.size;
  const dateDir = getDateDir(metadata);

  renditionProfiles.forEach((rendition) => {
    const { name, size, width, height, quality, format } = rendition;
    let file = getFilename(metadata, rendition);
    file = file.replace(/(\s+)/gi, '');
    // Only generate a rendition if the rendition's width
    // is smaller than the source image's width.

    const isRequiredRendition =
      !REGEX_SQUARE_THUMB.test(name) && !REGEX_BY_WIDTH.test(name);
    if (isRequiredRendition) {
      console.log(`required rendition for ${name} ${isRequiredRendition}`);
    }

    const isResizable = size ? size <= exifSize.width : false;
    if (isResizable) {
      console.log(
        `resizable: target is ${size}px and image is ${exifSize.width}px wide`
      );
    }
    if (isResizable || isRequiredRendition) {
      targets[name] = {
        name,
        file,
        quality,
        format,
        dateDir,
      };
      // only attach if defined
      if (size) targets[name].size = size;
      if (width) targets[name].width = width;
      if (height) targets[name].height = height;
    } else {
      console.log(
        `Skipping rendition for ${file} because target is (${size}px) > source is (${exifSize.width}px) or ${name} is not a required rendition.`
      );
    }
  });
  return targets;
};

/**
 * For a given source image defined by metadata,
 * use graphicsmagick to create renditions of photos for
 * the various renditionTargets under the rendersDir directory.
 *
 * @param {*} rendersDir -- top level renders directory
 * @param {*} renditionTargets -- rendition object {file,quality,format,dateDir}
 * @param {*} metadata -- metadata object hierarchy
 *   {
 *      origPath,
 *      origDir,
 *      origFile,
 *      ts,
 *      orientation,
 *      exif,
 *      renditions,
 *      iptc
 *    }
 */
export const createRenditions = async (rendersDir, metadata) => {
  const { renditions } = metadata;
  for (const rendition in renditions) {
    const target = renditions[rendition];
    const { name, dateDir, file } = target;
    const outputFile = `${rendersDir}${path.sep}${dateDir}${path.sep}${file}`;
    createImageDir(rendersDir, target.dateDir);

    let result;
    if (REGEX_SQUARE_THUMB.test(target.name)) {
      result = await squareThumbnail(metadata, target, outputFile);
    } else if (REGEX_BY_WIDTH.test(target.name)) {
      result = await resizeByWidth(metadata, target, outputFile);
    } else {
      result = await resizeToCover(metadata, target, outputFile);
    }
    // save the operation status under
    // the renditions field of metadata
    if (result.status === STATUS.SUCCESS) {
      metadata.renditions[name].status = result.status;
      metadata.renditions[name].fileSize = result.size;
      metadata.renditions[name].width = result.width;
      metadata.renditions[name].height = result.height;
    }
  }
  metadata.rendersDir = rendersDir;
  return metadata;
};

const image = {
  showSharpInfo,
  toIPTCDataObject,
  readExifMetadata,
  resizeByWidth,
  resizeToCover,
  squareThumbnail,
  getRenditionTargets,
  createRenditions,
};

export default image;
