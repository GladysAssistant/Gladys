const { expect } = require('chai');
const EventEmitter = require('events');
const SceneManager = require('../../../lib/scene');

const event = new EventEmitter();

describe('SceneManager.get', () => {
  it('should get scenes', async () => {
    const sceneManager = new SceneManager({}, event);
    const scenes = await sceneManager.get();
    expect(scenes).to.be.instanceOf(Array);
    scenes.forEach((oneScene) => {
      expect(oneScene).to.have.property('name');
      expect(oneScene).to.have.property('selector');
      expect(oneScene).to.have.property('active');
      expect(oneScene).not.to.have.property('actions');
      expect(oneScene).to.have.property('updated_at');
      expect(oneScene).to.have.property('tags');
      expect(oneScene).to.have.property('last_executed');
    });
  });
  it('should search scene, even in lowercase', async () => {
    const sceneManager = new SceneManager({}, event);
    const scenes = await sceneManager.get({
      search: 'test',
    });
    expect(scenes).to.be.instanceOf(Array);
    expect(scenes).to.deep.equal([
      {
        id: '3a30636c-b3f0-4251-a347-90787f0fe940',
        name: 'Test scene',
        icon: 'fe fe-bell',
        active: true,
        description: null,
        selector: 'test-scene',
        tags: [],
        last_executed: null,
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
  it('should search scene by tag', async () => {
    const sceneManager = new SceneManager({}, event);
    const scenes = await sceneManager.get({
      searchTags: 'tag 1',
    });
    expect(scenes).to.be.instanceOf(Array);
    expect(scenes).to.deep.equal([
      {
        id: '956794d8-a9cb-49bf-a677-57e820288b5a',
        name: 'Scene with tags',
        icon: 'fe fe-bell',
        active: true,
        description: null,
        selector: 'scene-with-tag',
        tags: [
          {
            name: 'tag 1',
          },
          {
            name: 'tag 2',
          },
        ],
        last_executed: null,
        updated_at: new Date('2022-04-15T07:49:07.556Z'),
      },
    ]);
  });

  it('should return 0 result in search', async () => {
    const sceneManager = new SceneManager({}, event);
    const scenes = await sceneManager.get({
      search: 'UNKNOWN SCENE',
    });
    expect(scenes).to.be.instanceOf(Array);
    expect(scenes).to.deep.equal([]);
  });
  it('should return 0 scenes (take=0)', async () => {
    const sceneManager = new SceneManager({}, event);
    const scenes = await sceneManager.get({
      take: 0,
    });
    expect(scenes).to.be.instanceOf(Array);
    expect(scenes).to.deep.equal([]);
  });

  it('should filter by selector', async () => {
    const sceneManager = new SceneManager({}, event);
    const scenes = await sceneManager.get({
      selectors: 'test-scene',
    });
    expect(scenes).to.be.instanceOf(Array);
    expect(scenes).to.deep.equal([
      {
        id: '3a30636c-b3f0-4251-a347-90787f0fe940',
        name: 'Test scene',
        icon: 'fe fe-bell',
        active: true,
        description: null,
        selector: 'test-scene',
        tags: [],
        last_executed: null,
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
});
