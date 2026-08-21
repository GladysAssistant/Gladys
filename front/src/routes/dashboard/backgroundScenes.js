import { DASHBOARD_BACKGROUND_SCENE } from '../../../../server/utils/constants';
import style from './style.css';

// CSS class of each built-in background scene; the default Horizon scene
// keeps its historical .glassScene class
export const BACKGROUND_SCENE_CLASSES = {
  [DASHBOARD_BACKGROUND_SCENE.HORIZON]: style.glassScene,
  [DASHBOARD_BACKGROUND_SCENE.AURORA]: style.sceneAurora,
  [DASHBOARD_BACKGROUND_SCENE.DUSK]: style.sceneDusk,
  [DASHBOARD_BACKGROUND_SCENE.FOREST]: style.sceneForest,
  [DASHBOARD_BACKGROUND_SCENE.LAGOON]: style.sceneLagoon,
  [DASHBOARD_BACKGROUND_SCENE.SAND]: style.sceneSand,
  [DASHBOARD_BACKGROUND_SCENE.LAVENDER]: style.sceneLavender,
  [DASHBOARD_BACKGROUND_SCENE.MIST]: style.sceneMist
};

// an unknown or unset scene falls back to the default: a dashboard saved by
// a newer version never renders on a bare background here
export const getBackgroundSceneClass = scene =>
  BACKGROUND_SCENE_CLASSES[scene] || BACKGROUND_SCENE_CLASSES[DASHBOARD_BACKGROUND_SCENE.HORIZON];
