import { Text } from 'preact-i18n';
import cx from 'classnames';

import BottomSheet from '../../../components/sheet/BottomSheet';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import style from '../mobile.css';
import get from 'get-value';

// Leaving the editor with unsaved changes (docs/specs/scene-editor-mobile.md, C.2): a bottom
// sheet on a phone, a centered dialog from 576px
const LeaveConfirmSheet = ({ open, sceneName, saving, onSaveAndLeave, onLeaveWithoutSaving, onCancel, intl }) => (
  <BottomSheet
    open={open}
    title={get(intl.dictionary, 'editScene.mobile.leaveTitle')}
    onClose={onCancel}
    dataCy="scene-leave-confirm"
  >
    <p class={style.sheetText}>
      <Text id="editScene.mobile.leaveText" fields={{ name: sceneName }} />
    </p>
    <div class={style.sheetButtons}>
      <button
        type="button"
        class={cx(style.bigButton, style.bigButtonPrimary)}
        onClick={onSaveAndLeave}
        disabled={saving}
        data-cy="scene-leave-save"
      >
        <Text id="editScene.mobile.saveAndLeave" />
      </button>
      <button
        type="button"
        class={cx(style.bigButton, style.bigButtonDangerSoft)}
        onClick={onLeaveWithoutSaving}
        data-cy="scene-leave-discard"
      >
        <Text id="editScene.mobile.leaveWithoutSaving" />
      </button>
      <button type="button" class={cx(style.bigButton, style.bigButtonGhost)} onClick={onCancel}>
        <Text id="editScene.mobile.keepEditing" />
      </button>
    </div>
  </BottomSheet>
);

export default withIntlAsProp(LeaveConfirmSheet);
