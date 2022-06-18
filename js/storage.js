/**
 * Retrieve and parse a JSON string from local storage.
 *
 * @param {string} key The localStorage key
 * @returns {(object|array|null)} the stored object or array
 */
export const loadObject = (key) => {
  try {
    const strData = window.localStorage.getItem(key);
    return JSON.parse(strData);
  } catch (err) {
    console.error(err.message);
    console.error('Failed to load object.');
    return null;
  }
};

/**
 * Stringifies an object or array and saves it to local storage.
 *
 * @param {string} key The localStorage key
 * @param {(object|array)} obj The object or array to stringify.
 */
export const saveObject = (key, obj) => {
  try {
    const strData = JSON.stringify(obj);
    window.localStorage.setItem(key, strData);
  } catch (err) {
    console.error(err.message);
    console.error('Failed to save object.');
  }
};
