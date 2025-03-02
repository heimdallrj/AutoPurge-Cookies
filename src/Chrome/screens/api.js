const __browser__ = chrome;
const __storage__ = __browser__.storage.local;

const Storage = {
  get: async (key) => {
    const result = await __storage__.get(key);
    return result[key];
  },
  set: async (key, val) => {
    const dataSet = {};
    dataSet[key] = val;
    return await __storage__.set(dataSet);
  }
};
