const RadioBrowser = require('radio-browser');

/**
 * @description Return list of available radio country.
 * @returns {Array} List of available radio country.
 * @example
 * getAvailableCountry();
 */
async function getAvailableCountry() {
  if (this.availableCountry.length === 0) {
    const category = await RadioBrowser.getCategory('states');
    await category.forEach((element) => {
      if (!this.availableCountry.includes(element.country)) {
        this.availableCountry.push(element.country);
      }
    });
    this.availableCountry.sort();
  }

  return this.availableCountry;
}

module.exports = {
  getAvailableCountry,
};
