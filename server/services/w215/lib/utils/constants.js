const W215_FEATURE_TYPES = {
    SWITCH: {
      BINARY: 'binary',
      POWER: 'power',
      TEMPERATURE: 'temperature'
    }
  };
  
  const W215_FEATURE_CATEGORIES = {
    SWITCH: 'switch'
  };

  // Paramètre de device
  const W215_PIN_CODE = 'PIN_CODE';
  
  // Préfixe de l'external ID
  const W215_EXTERNAL_ID_BASE = 'w215';

  const createList = (obj) => {
    const list = [];
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'object') {
        Object.keys(obj[key]).forEach((secondKey) => {
          list.push(obj[key][secondKey]);
        });
      } else {
        list.push(obj[key]);
      }
    });
    return list;
  };

  // build lists from object
const W215_FEATURE_CATEGORIES_LIST = createList(W215_FEATURE_CATEGORIES);
const W215_FEATURE_TYPES_LIST = createList(W215_FEATURE_TYPES);


module.exports.W215_FEATURE_CATEGORIES = W215_FEATURE_CATEGORIES;
module.exports.W215_FEATURE_TYPES = W215_FEATURE_TYPES;

module.exports.W215_PIN_CODE = W215_PIN_CODE;

module.exports.W215_EXTERNAL_ID_BASE = W215_EXTERNAL_ID_BASE;

module.exports.W215_FEATURE_CATEGORIES_LIST = W215_FEATURE_CATEGORIES_LIST;
module.exports.W215_FEATURE_TYPES_LIST = W215_FEATURE_TYPES_LIST;