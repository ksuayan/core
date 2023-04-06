import fs from 'fs';
import path from 'path';
import musicmetadata from 'musicmetadata';
import { toSlug, toFolders } from './utils.js';
import { ASSET_TYPES } from './constants.js';
import { scanDirectory, AUDIO_TYPE } from './scan.js';

const getAudioMetadata = async (filepath) => {
  const metadata = await new Promise((resolve, reject) => {
    musicmetadata(
      fs.createReadStream(filepath),
      { duration: true },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
  return metadata;
};

/**
 * Process an audio file and return its metadata.
 * @param {*} file
 * @param {*} sourceDir
 */
export const readAudioMetadata = async (file, sourceDir) => {
  const resolvedPath = path.resolve(file);
  const origFile = file.replace(sourceDir, '');
  let metadata;
  try {
    metadata = await getAudioMetadata(resolvedPath);
    metadata.type = ASSET_TYPES.AUDIO;
    metadata.origFile = encodeURI(origFile);
    metadata.folders = toFolders(origFile);
    metadata.slug = toSlug(metadata.title);

    // metadata.fname = toTitle(origFile, path.extname(origFile));
  } catch (err) {
    console.log(`Error: ${err}`);
  }
  console.log(`Metadata: ${JSON.stringify(metadata, null, 2)}`);
  return metadata;
};

/**
 * Read ID3 tags from audio files.
 * @param {*} sourceDir -- directory to scan
 */
export const processAudioFiles = async (sourceDir) => {
  const audioFiles = scanDirectory(sourceDir, AUDIO_TYPE);
  // aggregate asynchronous calls, return an array of metadata
  return await Promise.all(
    audioFiles.map(async (file) => {
      let metadata = await readAudioMetadata(file, sourceDir);
      return metadata;
    })
  );
};

const audio = {
  readAudioMetadata,
  processAudioFiles,
};

export default audio;
