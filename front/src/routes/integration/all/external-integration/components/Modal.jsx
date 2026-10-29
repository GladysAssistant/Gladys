import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import cx from 'classnames';
import createBackdropDismiss from '../../../../../utils/backdropDismiss';
import style from './modal.css';

class Modal extends Component {
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = e => {
    if (e.key === 'Escape' && this.props.onClose) {
      this.props.onClose();
    }
  };

  // Close only when the backdrop itself is pressed, not on a click bubbling up
  // from inside the dialog, nor on the release of a drag that started in it.
  backdropDismiss = createBackdropDismiss(() => {
    if (this.props.onClose) {
      this.props.onClose();
    }
  });

  render({ children, title, onClose, large }) {
    // The modal is rendered on <body>: it opens from inside a glass card, whose
    // backdrop filter would otherwise trap this fixed overlay in the card's own
    // stacking context (same reason the light control panel is portaled).
    // glass-theme keeps the dialog on the theme's glass surface out there.
    return createPortal(
      <div class={cx('glass-theme', style.modalOverlay)} {...this.backdropDismiss}>
        <div class={cx(style.modalDialog, { [style.modalDialogLarge]: large })}>
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
      </div>,
      document.body
    );
  }
}

export default Modal;
