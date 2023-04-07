import jetpack from 'fs-jetpack';
import path from 'path';

export const IMAGES_TYPE = {
  matching: '*(*.jpg|*.JPG|*.jpeg|*.JPEG|*.png|*.PNG)',
  files: true,
  recursive: true,
};

export const AUDIO_TYPE = {
  matching: '*(*.mp3|*.MP3|*.m4a|*.mp4|*.ogg|*.flac)',
  files: true,
  recursive: true,
};

export const ALBUM_JSON = 'album.json';

export const ALBUM_TYPE = {
  matching: `*(${ALBUM_JSON})`,
  files: true,
  recursive: true,
};

export const MARKDOWN_TYPE = {
  matching: '*(*.md)',
  files: true,
  recursive: true,
};

export const scanDirectory = (sourcepath, query) => {
  let files = [];
  try {
    files = jetpack.find(sourcepath, query);
    files = files.map((f) => {
      return path.resolve(f);
    });
  } catch (err) {
    console.log('Error: ', err);
  }
  return files;
};

const scan = {
  IMAGES_TYPE,
  AUDIO_TYPE,
  ALBUM_JSON,
  ALBUM_TYPE,
  MARKDOWN_TYPE,
  scanDirectory,
};

export default scan;
