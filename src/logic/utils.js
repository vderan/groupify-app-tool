/**
 * Returns a copy of the object with the value at the specified path transformed by the update function.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {Function} updater
 * @returns {Object}
 */
export const updateIn = (object, [property, ...properyChain], updater) =>
  properyChain.length === 0
    ? { ...object, [property]: updater(object[property]) }
    : { ...object, [property]: updateIn(object[property], properyChain, updater) };

/**
 * Returns a copy of the object with the value at the specified path set to the given one.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {*} value
 * @returns {Object}
 */
export const setIn = (object, properyChain, value) =>
  updateIn(object, properyChain, () => value);

/**
 * Returns a copy of the object with the value at the specified path merged with the given one.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {Object} newValue
 * @returns {Object}
 */
export const mergeIn = (object, properyChain, newValue) =>
  updateIn(object, properyChain, currentValue => ({ ...currentValue, ...newValue }));


/**
 * Returns object's value at the specified path or the default value if it doesn't exist.
 *
 * @param {Object} object
 * @param {Array} propertyChain
 * @param {*} defaultValue
 * @returns {*}
 */
export const getIn = (object, [property, ...propertyChain], defaultValue = null) =>
  object ? (
    propertyChain.length === 0
      ? (object.hasOwnProperty(property) ? object[property] : defaultValue)
      : getIn(object[property], propertyChain, defaultValue)
  ) : defaultValue;

/**
 * Checks if the given value is an object.
 *
 * @param {*} value
 * @returns {boolean}
 */
const isObject = obj => obj === Object(obj);

/**
 * When given an object, deeply checks if it doesn't contain null values.
 * Otherwise, checks if the given value is not null.
 *
 * @param {*} value
 * @returns {boolean}
 */
export const isPresentDeep = value =>
  isObject(value)
    ? Object.values(value).every(isPresentDeep)
    : value != null;

/**
 * Pluralizes a word according to the given number.
 * When no plural form given, uses singular form with an 's' appended.
 *
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : (plural || singular + 's')}`

/**
 * Returns a new array with items summing up to 1, preserving elements proportionality.
 * When the given array is empty, returns an empty array.
 *
 * @param {Array} arr
 * @returns {Array}
 */
export const scaleToOne = arr => {
  if (arr.length === 0) return [];
  const sum = arr.reduce((x, y) => x + y, 0);
  return arr.map(x => sum !== 0 ? x / sum : 1 / arr.length);
};

export const flatMap = (arr, fn) =>
  arr.reduce((xs, x) => xs.concat(fn(x)), []);

export const zip = (...arrs) =>
  arrs[0].map((_, i) => arrs.map(arr => arr[i]));