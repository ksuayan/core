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

const utils = {
  dedupe,
  toSlug,
  toTitle,
  toFolders,
};

export default utils;
