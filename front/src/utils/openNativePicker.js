// Native date and time pickers on a touch screen.
//
// Chrome on Android opens the picker of a native date or time input from its
// icon only: a tap on the value selects a segment and brings up neither the
// picker nor a keyboard. Bound to the input's click, this opens the picker from
// anywhere on the field — for a finger or a pen only, so a mouse keeps typing
// the value in.
//
// The gesture is read from the click itself. `(pointer: coarse)` describes the
// primary pointer only: a touchscreen laptop reports it fine while being tapped,
// and so does a phone with a mouse paired. A click that carries no pointer type
// — dispatched by a label, or from a browser that does not report one — falls
// back on whether any pointer is coarse.
//
// A click made with the keyboard (Enter or Space on the field) carries no
// pointer type either, so on a touchscreen laptop it opens the picker too.
// Accepted: the picker takes the keyboard as well, and telling that click from a
// label's would mean recording every pointerdown on the field.

const isTouchClick = e => {
  if (e.pointerType) {
    return e.pointerType === 'touch' || e.pointerType === 'pen';
  }
  return typeof window.matchMedia === 'function' && window.matchMedia('(any-pointer: coarse)').matches;
};

export const openNativePicker = e => {
  const input = e.currentTarget;
  if (!input || typeof input.showPicker !== 'function' || !isTouchClick(e)) {
    return;
  }
  try {
    input.showPicker();
  } catch (err) {
    // Already open, or refused by the browser: its icon still opens it.
  }
};
