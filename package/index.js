import audio from './audio.js';
import axios from './axios.js';
import assets from './assets.js';
import dayjs from './dayjs.js';
import db from './db.js';
import fs from './fs.js';
import image from './image.js';
import keywords from './keywords.js';
import markdown from './markdown.js';
import scan from './scan.js';
import utils from './utils.js';

const core = {
  utils: utils,
  db: db,
  fs: fs,
  scan: scan,
  image: image,
  audio: audio,
  dayjs: dayjs,
  axios: axios,
  keywords: keywords,
  markdown: markdown,
  assets: assets
};

export default core;
