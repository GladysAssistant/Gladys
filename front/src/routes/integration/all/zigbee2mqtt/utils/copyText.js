/**
 * Copy a text to the clipboard: by the Clipboard API, which only exists in a secure context (HTTPS), else by the
 * selection of a hidden field (`document.execCommand('copy')`), the only way on the plain-HTTP local address of Gladys.
 * @param {string} text - Text to copy.
 * @returns {Promise<boolean>} Whether the browser copied it.
 */
export default async function copyText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Refused by the browser: the selection below may still copy it
    }
  }
  if (typeof document === 'undefined' || !document.body) {
    return false;
  }
  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.setAttribute('aria-hidden', 'true');
  // Out of sight, and at 16 px so that a phone does not zoom on it
  field.style.position = 'fixed';
  field.style.top = '0';
  field.style.left = '0';
  field.style.opacity = '0';
  field.style.fontSize = '16px';
  document.body.appendChild(field);
  try {
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch (e) {
    return false;
  } finally {
    document.body.removeChild(field);
    // Back to the button that copied, for the keyboard and the screen readers
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }
}
