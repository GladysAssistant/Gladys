const models = [];
models.push(require('./AduroSmart').AduroSmart);
models.push(require('./Airam').Airam);
models.push(require('./Anchor').Anchor);
models.push(require('./Belkin').Belkin);
models.push(require('./Bitron').Bitron);
models.push(require('./Blaupunkt').Blaupunkt);
models.push(require('./Bosch').Bosch);
models.push(require('./Calex').Calex);
models.push(require('./Centralite').Centralite);
models.push(require('./Climax').Climax);
models.push(require('./CommercialElectric').CommercialElectric);
models.push(require('./Danalock').Danalock);
models.push(require('./DresdenElektronik').DresdenElektronik);
models.push(require('./EDP').EDP);
models.push(require('./ELKO').ELKO);
models.push(require('./EcoSmart').EcoSmart);
models.push(require('./Eurotronic').Eurotronic);
models.push(require('./GE').GE);
models.push(require('./GMYSmartBulb').GMYSmartBulb);
models.push(require('./Gira').Gira);
models.push(require('./Gledopto').Gledopto);
models.push(require('./HEIMAN').HEIMAN);
models.push(require('./HamptonBay').HamptonBay);
models.push(require('./Hive').Hive);
models.push(require('./Honyar').Honyar);
models.push(require('./IKEA').IKEA);
models.push(require('./Iluminize').Iluminize);
models.push(require('./Immax').Immax);
models.push(require('./Innr').Innr);
models.push(require('./Iris').Iris);
models.push(require('./JIAWEN').JIAWEN);
models.push(require('./KeenHome').KeenHome);
models.push(require('./KsentryElectronics').KsentryElectronics);
models.push(require('./Leedarson').Leedarson);
models.push(require('./LivingWise').LivingWise);
models.push(require('./Livolo').Livolo);
models.push(require('./Lupus').Lupus);
models.push(require('./Meazon').Meazon);
models.push(require('./MullerLicht').MullerLicht);
models.push(require('./NET2GRID').NET2GRID);
models.push(require('./Nanoleaf').Nanoleaf);
models.push(require('./Netvox').Netvox);
models.push(require('./NinjaBlocks').NinjaBlocks);
models.push(require('./Nue_3A').Nue3A);
models.push(require('./Nyce').Nyce);
models.push(require('./OSRAM').OSRAM);
models.push(require('./Oujiabao').Oujiabao);
models.push(require('./PaulNeuhaus').PaulNeuhaus);
models.push(require('./Paulmann').Paulmann);
models.push(require('./Philips').Philips);
models.push(require('./RGBGenie').RGBGenie);
models.push(require('./ROBB').ROBB);
models.push(require('./Salus').Salus);
models.push(require('./Securifi').Securifi);
models.push(require('./Sengled').Sengled);
models.push(require('./Sercomm').Sercomm);
models.push(require('./ShenzhenHoma').ShenzhenHoma);
models.push(require('./SmartHomePty').SmartHomePty);
models.push(require('./SmartThings').SmartThings);
models.push(require('./Stelpro').Stelpro);
models.push(require('./Sunricher').Sunricher);
models.push(require('./Swann').Swann);
models.push(require('./Sylvania').Sylvania);
models.push(require('./TUYATEC').TUYATEC);
models.push(require('./ThirdReality').ThirdReality);
models.push(require('./Trust').Trust);
models.push(require('./Visonic').Visonic);
models.push(require('./Xiaomi').Xiaomi);
models.push(require('./Yale').Yale);
models.push(require('./eCosy').eCosy);
models.push(require('./iCasa').iCasa);
models.push(require('./ilux').ilux);

/**
 * @description Get features by model name.
 * @param {string} modelName - Model name to find.
 * @returns {Array} Related features.
 * @example
 * getFeaturesByModel('1TST-EU');
 */
function getFeaturesByModel(modelName) {
  const model = models.find((m) => {
    return m.models[modelName];
  });

  if (model) {
    return model.models[modelName];
  }

  return [];
}

module.exports = {
  getFeaturesByModel,
};
