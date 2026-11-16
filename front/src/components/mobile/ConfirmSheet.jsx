import { Text } from 'preact-i18n';

import BottomSheet from '../sheet/BottomSheet';
import { BigButton } from './MobileBottomBar';
import style from './kit.css';

/**
 * @description A confirmation (docs/specs/mobile-pages/README.md, C.5): a bottom sheet on a
 * phone, a centered dialog from 576px. Nothing destructive happens without it, or without an
 * undo.
 *
 * title: a string (it also names the dialog). text: what will happen. confirmLabel: the label of
 * the confirming button, `destructive` paints it red. `loading` while the action runs.
 */
const ConfirmSheet = ({
  open,
  title,
  text,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
  dataCy,
  depth,
  children
}) => (
  <BottomSheet open={open} title={title} onClose={onCancel} dataCy={dataCy} depth={depth}>
    {text && <p class={style.sheetText}>{text}</p>}
    {children}
    <div class={style.buttons}>
      <BigButton
        variant={destructive ? 'danger' : 'primary'}
        onClick={onConfirm}
        loading={loading}
        data-cy="confirm-sheet-confirm"
      >
        {confirmLabel}
      </BigButton>
      <BigButton variant="ghost" onClick={onCancel} data-cy="confirm-sheet-cancel">
        {cancelLabel || <Text id="global.cancel" />}
      </BigButton>
    </div>
  </BottomSheet>
);

export default ConfirmSheet;
