// The local draft of a scene being edited (docs/specs/scene-editor-mobile.md, C.2): while the
// editor holds unsaved changes, they are written to localStorage, so that leaving the editor in a
// way no guard can catch (the iOS swipe-back gesture, the app killed in the background, the
// global navigation) never loses them. Storage may be unavailable (private mode, quota, blocked
// site data): every access is guarded, and the editor then simply works without drafts.

const DRAFT_VERSION = 1;
const DRAFT_KEY_PREFIX = 'gladys-scene-draft:';

const getDraftKey = sceneSelector => `${DRAFT_KEY_PREFIX}${sceneSelector}`;

const getStorage = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (e) {
    return null;
  }
};

// base: the version the server acknowledged when the draft was written (savedSceneSnapshot),
// scene: the edited scene
const writeSceneDraft = (sceneSelector, base, scene) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(
      getDraftKey(sceneSelector),
      JSON.stringify({ version: DRAFT_VERSION, base, scene, saved_at: new Date().toISOString() })
    );
  } catch (e) {
    // quota exceeded or storage blocked: the draft is a safety net, not a requirement
  }
};

const readSceneDraft = sceneSelector => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(getDraftKey(sceneSelector));
    if (!raw) {
      return null;
    }
    const draft = JSON.parse(raw);
    if (!draft || draft.version !== DRAFT_VERSION || typeof draft.base !== 'string' || !draft.scene) {
      return null;
    }
    return draft;
  } catch (e) {
    return null;
  }
};

const removeSceneDraft = sceneSelector => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(getDraftKey(sceneSelector));
  } catch (e) {
    // nothing to do: the draft will be ignored on the next load if its base is outdated
  }
};

export { writeSceneDraft, readSceneDraft, removeSceneDraft };
