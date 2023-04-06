const ASSETS_DIR = process.env.ASSETS_DIR
  ? process.env.ASSETS_DIR
  : '/Volumes/DATA';

export const IMAGES_DIR = ASSETS_DIR + '/images/source';
export const RENDERS_DIR = ASSETS_DIR + '/images/render';
export const MARKDOWN_DIR = ASSETS_DIR + '/markdown';
export const ARTICLES_DIR = ASSETS_DIR + '/articles';
export const AUDIO_DIR = ASSETS_DIR + '/audio';

// mongodb settings
export const DB_NAME = 'demo';

export const DB_COLLECTION = {
  ARTICLES: 'articles',
  ASSETS: 'assets',
  IMAGES: 'images',
  ALBUMS: 'albums',
  MARKDOWN: 'markdown',
  PAGES: 'pages',
  ARCHIVE: 'archive',
};

export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
};

export const ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

export const ASSET_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  MARKDOWN: 'markdown',
};
