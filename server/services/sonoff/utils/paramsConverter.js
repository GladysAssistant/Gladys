const paramsConverter = (tasmotaModule) => {
  const params = [];
  switch (tasmotaModule) {
    case 6: {
      params.push({
        name: 'model',
        value: 's26',
      });
      break;
    }
    case 1: {
      params.push({
        name: 'model',
        value: 'basic',
      });
      break;
    }
    case 8: {
      params.push({
        name: 'model',
        value: 'pow',
      });
      break;
    }
    default:
  }
  return params;
};

module.exports = {
  paramsConverter,
};
