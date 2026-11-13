import { Component } from 'preact';

import style from '../../mobile.css';

// A help text longer than this is folded on two lines
const FOLD_FROM_CHARACTERS = 120;
// the explanations of the forms: paragraphs, small prints, and the gray "secondary" boxes (the
// colored alerts are warnings to read: never folded)
const HELP_SELECTOR = 'p:not([class]), small, .small, .form-text, .alert-secondary, .alert-secondary > div';
const WARNING_SELECTOR = '.alert:not(.alert-secondary)';
// a text holding a control is a part of the form, and so is the text of a control
const NOT_A_HELP_TEXT = 'input, select, textarea, button, a, label, details';
const CONTROL_SELECTOR = 'button, a, label, summary';

/**
 * @description The card of a sheet that holds the parameter form of a step or a trigger
 * (docs/specs/scene-editor-mobile.md, E.11). The forms are the ones of the desktop cards; their
 * controls are dressed for a thumb by the styles of this card (mobile.css, "sheet forms"), and
 * their long explanations are folded on two lines, opened by a tap: on a phone the fields come
 * first. The forms are not edited for that: the card marks their help texts as it finds them
 * (data-help-fold), which no render of a form undoes, and watches for the ones a form adds later.
 */
class SheetForm extends Component {
  componentDidMount() {
    this.scan();
    if (typeof MutationObserver === 'function' && this.base) {
      this.observer = new MutationObserver(this.scheduleScan);
      this.observer.observe(this.base, { childList: true, subtree: true });
    }
  }

  componentWillUnmount() {
    clearTimeout(this.scanTimer);
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  scheduleScan = () => {
    clearTimeout(this.scanTimer);
    this.scanTimer = setTimeout(this.scan, 50);
  };

  scan = () => {
    if (!this.base) {
      return;
    }
    this.base.querySelectorAll(HELP_SELECTOR).forEach(element => {
      if (
        element.hasAttribute('data-help-fold') ||
        element.closest(WARNING_SELECTOR) ||
        element.closest(CONTROL_SELECTOR) ||
        (element.parentElement && element.parentElement.closest('[data-help-fold]')) ||
        element.querySelector(NOT_A_HELP_TEXT) ||
        element.textContent.trim().length < FOLD_FROM_CHARACTERS
      ) {
        return;
      }
      element.setAttribute('data-help-fold', '');
      // unfolding a help text is not an edit of the scene (spec C.2)
      element.setAttribute('data-not-an-edit', '');
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      element.setAttribute('aria-expanded', 'false');
    });
  };

  toggle = element => {
    const open = !element.hasAttribute('data-help-open');
    if (open) {
      element.setAttribute('data-help-open', '');
    } else {
      element.removeAttribute('data-help-open');
    }
    element.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  getHelp = event => {
    const help = event.target && event.target.closest ? event.target.closest('[data-help-fold]') : null;
    return help && this.base.contains(help) ? help : null;
  };

  onClick = event => {
    const help = this.getHelp(event);
    if (help) {
      this.toggle(help);
    }
  };

  onKeyDown = event => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    const help = this.getHelp(event);
    if (help && help === event.target) {
      event.preventDefault();
      this.toggle(help);
    }
  };

  render({ children }) {
    return (
      // the card only relays the taps on the help texts it folded, which are focusable buttons
      <div class={style.sheetForm} onClick={this.onClick} onKeyDown={this.onKeyDown}>
        {children}
      </div>
    );
  }
}

export default SheetForm;
