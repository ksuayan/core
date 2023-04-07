import he from 'he';

export const DECIMAL_PLACES = 4;

export const isInt = (n) => {
  return Number(n) === n && n % 1 === 0;
};

export const isFloat = (n) => {
  return Number(n) === n && n % 1 !== 0;
};

export const toFixed = (n, decimalPlaces) => {
  if (n) return n.toFixed(decimalPlaces);
  return 0;
};

export const undefToNull = (key, value) =>
  typeof value === 'undefined' ? null : value;

export const isArrayMapEmpty = (arrayMap) => {
  if (!Object.entries(arrayMap).length) return true;
  for (const [key, list] of Object.entries(arrayMap)) {
    if (Array.isArray(list) && list.length > 0) {
      return false;
    }
  }
  return true;
};

export const promptRequired = function (fieldName, objectName) {
  return `Please provide a ${fieldName} for ${objectName}.`;
};

export const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const encodeStr = (str) => {
  return encodeURI(he.encode(str));
};

export const decodeStr = (str) => {
  return he.decode(decodeURI(str));
};

/**
 * Simple dedupe.
 * @param {*} arr
 * @returns
 */
export const dedupe = (arr) => {
  return Array.from(new Set(arr)).sort();
};

/**
 * A slug is a URL-friendly version of a title.
 * @param {*} str
 * @returns
 */
export const toSlug = (str) => {
  if (!str) return str;
  return (
    str &&
    str
      .trim()
      .replace(/\?/g, '_')
      .replace(/\'/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/\//g, '-')
      .toLowerCase()
  );
};

/**
 * Generate a title from a string
 * @param {*} str - string to parse
 * @param {*} regEx - regex to remove from string
 */
export const toTitle = (str, regEx) => {
  const s = str.split('/');
  return s[s.length - 1].replace(regEx, '');
};

/**
 * generate a list of folders from a path
 * @param {*} str - path to parse
 * @returns - array of folders
 */
export const toFolders = (str) => {
  const s = str.split('/');
  return s.slice(0, s.length - 1).filter((item) => !!item);
};

export const mergeList = (a, b) => {
  const aList = Array.isArray(a) ? a : [];
  const bList = Array.isArray(b) ? b : [];
  return Array.from(new Set([...aList, ...bList])).filter((item) => !!item);
};

export const lowercase = (list) => {
  if (!list) return list;
  return list.map((i) => {
    return typeof i == 'string' ? i.toLowerCase() : '';
  });
};

const utils = {
  DECIMAL_PLACES,
  isInt,
  isFloat,
  toFixed,
  undefToNull,
  isArrayMapEmpty,
  promptRequired,
  isJsonString,
  encodeStr,
  decodeStr,
  dedupe,
  toSlug,
  toTitle,
  toFolders,
  mergeList,
  lowercase,
};

export default utils;
