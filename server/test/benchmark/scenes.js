const Promise = require('bluebird');
const { ACTIONS } = require('../../utils/constants');
const logger = require('../../utils/logger');
const SceneManager = require('../../lib/scene');

const light = {
  turnOn: () => Promise.resolve(),
};

const stateManager = {
  get: () => light,
};

const sceneManager = new SceneManager(stateManager);

const NUMBER_OF_SCENE_TO_REGISTER = 1000;
const NUMBER_OF_ACTIONS_PER_SCENE = 1000;

const displayNumberOfEventProcessedBySeconds = (time) => {
  const seconds = process.hrtime(time)[0];
  const elapsed = seconds + process.hrtime(time)[1] / 1000000 / 1000;
  const perSecond = (NUMBER_OF_SCENE_TO_REGISTER * NUMBER_OF_ACTIONS_PER_SCENE) / elapsed;
  const millionsEventProcessedPerSecond = perSecond / 1000000;
  const millionsEventProcessedPerSecondBeautiful = Math.round(millionsEventProcessedPerSecond * 100) / 100;
  logger.info(
    `Executed 1 million actions in ${elapsed} s, so ${millionsEventProcessedPerSecondBeautiful}M actions/per second`,
  );
};

const scenes = [];

for (let i = 0; i < NUMBER_OF_SCENE_TO_REGISTER; i += 1) {
  const scene = {
    id: i,
    selector: i,
    actions: [[]],
  };
  for (let j = 0; j < NUMBER_OF_ACTIONS_PER_SCENE; j += 1) {
    scene.actions[0].push({
      type: ACTIONS.LIGHT.TURN_ON,
    });
  }
  sceneManager.addScene(scene);
  scenes.push(i);
}

const bench = async () => {
  const start = process.hrtime();
  for (let i = 0; i < NUMBER_OF_SCENE_TO_REGISTER; i += 1) {
    sceneManager.execute(String(i));
  }
  sceneManager.queue.start(() => {
    displayNumberOfEventProcessedBySeconds(start);
    bench();
  });
};

bench();
