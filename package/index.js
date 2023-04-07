import audio from './audio.js';
import axios from './axios.js';
import dayjs from './dayjs.js';
import db from './db.js';
import fs from './fs.js';
import image from './image.js';
import keywords from './keywords.js';
import markdown from './markdown.js';
import scan from './scan.js';
import utils from './utils.js';

const core = {
  utils,
  db,
  fs,
  scan,
  image,
  audio,
  dayjs,
  axios,
  keywords,
  markdown,
};

export default core;
