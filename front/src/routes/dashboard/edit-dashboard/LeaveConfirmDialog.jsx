import { useEffect, useRef } from 'preact/hooks';
import { Text } from 'preact-i18n';

import createBackdropDismiss from '../../../utils/backdropDismiss';
import style from './style.css';

// "Leave without saving?" — asked by the editor (requestNavigation) before
// any way out while changes are pending. Staying is the safe, focused
// default; Escape and a tap on the backdrop stay too.
const LeaveConfirmDialog = ({ onConfirm, onCancel }) => {
  const stayRef = useRef(null);
  const backdropDismiss = useRef(createBackdropDismiss(() => onCancel()));

  useEffect(() => {
    if (stayRef.current) {
      stayRef.current.focus();
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div class={style.dialogBackdrop} {...backdropDismiss.current} data-editor-dialog data-cy="leave-confirm">
      <div
        class={style.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-confirm-title"
        aria-describedby="leave-confirm-text"
      >
        <h3 class={style.dialogTitle} id="leave-confirm-title">
          <Text id="dashboard.leaveConfirmTitle" />
        </h3>
        <p class={style.dialogText} id="leave-confirm-text">
          <Text id="dashboard.leaveConfirmText" />
        </p>
        <button type="button" class={style.dialogDanger} onClick={onConfirm} data-cy="leave-confirm-leave">
          <Text id="dashboard.leaveConfirmLeave" />
        </button>
        <button
          type="button"
          class={style.dialogSecondary}
          onClick={onCancel}
          ref={stayRef}
          data-cy="leave-confirm-stay"
        >
          <Text id="dashboard.leaveConfirmStay" />
        </button>
      </div>
    </div>
  );
};

export default LeaveConfirmDialog;
