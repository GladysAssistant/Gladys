import { useState } from 'preact/hooks';
import { Text, Localizer } from 'preact-i18n';

import style from './style.css';

const STORAGE_KEY = 'gladys-editor-explanation-dismissed';

const readDismissed = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (e) {
    return false;
  }
};

// The editor's how-to: useful once, then 3–4 lines of every phone screen.
// Dismissed for good on this browser (a convenience: if the storage is
// unavailable the text simply stays).
const EditorExplanation = () => {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) {
    return null;
  }
  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {} // eslint-disable-line no-empty
  };
  return (
    <div class={style.editorExplanation} data-cy="editor-explanation">
      <p class={style.editorExplanationText}>
        <Text id="dashboard.editDashboardExplanation" />
      </p>
      <Localizer>
        <button
          type="button"
          class={style.editorExplanationClose}
          onClick={dismiss}
          aria-label={<Text id="dashboard.editorExplanationDismiss" />}
          data-cy="editor-explanation-dismiss"
        >
          <i class="fe fe-x" />
        </button>
      </Localizer>
    </div>
  );
};

export default EditorExplanation;
