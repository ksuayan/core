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
  NOTECARDS: 'notecards'
};

export const Entities = {
  ALBUM: 'Album',
  ARTICLE: 'Article',
  TAG: 'Tag',
  NOTECARD: 'Notecard',
  IMAGE: 'Image',
  PAGE: 'Page'
};

export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error'
};

export const ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape'
};

export const ASSET_TYPES = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  MARKDOWN: 'markdown'
};

export const SORT = {
  IMAGE_DATE_ASCENDING: { 'iptc.origDate': 1 },
  IMAGE_DATE_DESCENDING: { 'iptc.origDate': -1 },
  DATE_CREATED_ASCENDING: { dtCreated: 1 },
  DATE_CREATED_DESCENDING: { dtCreated: -1 },
  DATE_UPDATED_ASCENDING: { dtUpdated: 1 },
  DATE_UPDATED_DESCENDING: { dtUpdated: -1 }
};

export const HTTP = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  AUTH_REQUIRED: 403,
  UNAVAILABLE: 503
};

