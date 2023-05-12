/**
 * We want to cache some data in RAM.
 */
class Cache {
  constructor() {
    this.clear();
  }

  set(key, value) {
    this.store[key] = value;
  }

  get(key) {
    return this.store[key];
  }

  del(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

module.exports = {
  Cache,
};
