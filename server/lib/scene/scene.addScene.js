/**
 * @description Add a scene to the scene manager.
 * @param {Object} scene - Scene object from DB.
 * @example
 * addScene({
 *  selector: 'test'
 * });
 */
async function addScene(scene) {
  this.scenes[scene.selector] = scene;
}

module.exports = {
  addScene,
};
