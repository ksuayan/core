import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

export const daysAgo = (date) => {
  return dayjs().to(dayjs(date));
};

export const niceDate = (date) => {
  return dayjs(date).format('dddd, MMMM Do YYYY');
};

export const niceShortDate = (date) => {
  return dayjs(date).format('MMM D, YYYY');
};

export const niceTime = (date) => {
  return dayjs(date).format('h:mma');
};

/**
 * @param {*} ms - epoch date in ms
 * @returns
 */
export const msToDate = (ms) => {
  return new Date(0).setUTCMilliseconds(ms);
};

const dates = {
  daysAgo,
  niceDate,
  niceShortDate,
  niceTime,
  msToDate
};

export default dates;
