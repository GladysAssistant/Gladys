const { expect } = require('chai');
const SceneManager = require('../../../lib/scene');

describe('SceneManager.get', () => {
  it('should get scenes', async () => {
    const sceneManager = new SceneManager();
    const scenes = await sceneManager.get();
    expect(scenes).to.be.instanceOf(Array);
    scenes.forEach((oneScene) => {
      expect(oneScene).to.have.property('name');
      expect(oneScene).to.have.property('selector');
      expect(oneScene).not.to.have.property('actions');
      expect(oneScene).to.have.property('updated_at');
      expect(oneScene).to.have.property('last_executed');
    });
  });
  it('should search scene, even in lowercase', async () => {
    const sceneManager = new SceneManager();
    const scenes = await sceneManager.get({
      search: 'test',
    });
    expect(scenes).to.be.instanceOf(Array);
    expect(scenes).to.deep.equal([
      {
        id: '3a30636c-b3f0-4251-a347-90787f0fe940',
        name: 'Test scene',
        icon: 'fe fe-bell',
        selector: 'test-scene',
        last_executed: null,
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
  it('should return 0 result in search', async () => {
    const sceneManager = new SceneManager();
    const scenes = await sceneManager.get({
      search: 'UNKNOWN SCENE',
    });
    expect(scenes).to.be.instanceOf(Array);
    expect(scenes).to.deep.equal([]);
  });
});
