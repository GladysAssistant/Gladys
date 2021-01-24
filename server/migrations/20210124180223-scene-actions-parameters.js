const Promise = require('bluebird');
const db = require('../models');

module.exports = {
  up: async () => {
    const scenes = await db.Scene.findAll({ attributes: ['id', 'actions'] });
    const formattedScenes = scenes.map(({ id, actions }) => ({
      id,
      actions: actions.map(action => action.map(a => ({
        type: a.type,
        device_feature: a.device_feature,
        device_features: a.device_features,
        device: a.device,
        devices: a.devices,
        user: a.user,
        parameters: {
          ...(a.unit ? { unit: a.unit} : {}),
          ...(a.value ? { value: a.value } : {}),
          ...(a.text ? { text: a.text } : {}),
        },
        conditions: a.conditions,
      })))
    }));
    await Promise.mapSeries(formattedScenes, scene =>
      db.Scene.update({ actions: scene.actions }, { where: { id: scene.id }})
    );
  },
};
