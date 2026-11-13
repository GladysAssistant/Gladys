import { useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Text } from 'preact-i18n';

import createBackdropDismiss from '../../../utils/backdropDismiss';
import style from './style.css';

// "Leave without saving?" — asked by the editor (requestNavigation) before
// any way out while changes are pending. Staying is the safe, focused
// default; Escape and a tap on the backdrop stay too.
// Rendered in <body>: inside the editor container it would share that
// container's stacking context, below the mobile menu drawer, and a link
// tapped in the open menu would ask from underneath it.
const LeaveConfirmDialog = ({ onConfirm, onCancel }) => {
  const dialogRef = useRef(null);
  const stayRef = useRef(null);
  const backdropDismiss = useRef(createBackdropDismiss(() => onCancel()));

  useEffect(() => {
    if (stayRef.current) {
      stayRef.current.focus();
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }
      // aria-modal: Tab cycles between the dialog's two buttons
      if (event.key === 'Tab' && dialogRef.current) {
        const buttons = dialogRef.current.querySelectorAll('button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        const active = document.activeElement;
        if (!dialogRef.current.contains(active)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return createPortal(
    <div class={style.dialogBackdrop} {...backdropDismiss.current} data-editor-dialog data-cy="leave-confirm">
      <div
        class={style.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-confirm-title"
        aria-describedby="leave-confirm-text"
        ref={dialogRef}
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
    </div>,
    document.body
  );
};

export default LeaveConfirmDialog;
