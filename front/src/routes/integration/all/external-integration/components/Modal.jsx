import style from './modal.css';

const Modal = ({ children, title, onClose, large }) => (
  <div class={style.modalOverlay}>
    <div class={`${style.modalDialog} ${large ? style.modalDialogLarge : ''}`.trim()}>
      <div class="card mb-0">
        <div class="card-header">
          <h3 class="card-title">{title}</h3>
          <div class="card-options">
            <button type="button" class="btn btn-secondary btn-sm" onClick={onClose}>
              <i class="fe fe-x" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default Modal;
