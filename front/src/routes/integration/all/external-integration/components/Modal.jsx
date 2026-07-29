import { Component } from 'preact';
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

  handleOverlayClick = e => {
    // Close only when the backdrop itself is clicked, not a click bubbling up
    // from inside the dialog.
    if (e.target === e.currentTarget && this.props.onClose) {
      this.props.onClose();
    }
  };

  render({ children, title, onClose, large }) {
    return (
      <div class={style.modalOverlay} onClick={this.handleOverlayClick}>
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
  }
}

export default Modal;
