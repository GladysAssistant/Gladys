// The system "back" (the Android button, the iOS edge swipe, the browser button) closes the sheet
// on top instead of leaving the page (docs/specs/scene-editor-mobile.md, E.4).
//
// While at least one sheet is open, ONE entry of the same URL sits on top of the history: going
// back pops it, and the sheet on top closes. If sheets remain open, an entry is pushed again, so
// each "back" closes one sheet.
//
// The entry is never popped by the code when the last sheet closes another way (OK, the backdrop,
// a drag): a history.back() is asynchronous, and a navigation started right after the close would
// be undone by it. The entry stays instead, and is reused by the next sheet. A "back" that leaves
// such a leftover entry closes nothing: it is passed on at once, so the user leaves the page with
// one press, as if the entry was not there. And a navigation started while the entry is on top
// replaces it (isSheetEntryOnTop).
//
// The history is synchronized after the sheets settle, not on each open / close: a sheet replacing
// another one (the menu, then the settings) keeps the same entry.
//
// The same entry guards an edit page (docs/specs/mobile-pages/README.md, C.4): while a page that
// registered a leave guard has unsaved changes, the entry is kept on top even with no sheet open,
// and a "back" that pops it asks the page — which opens its leave sheet — instead of being passed
// on. One entry for both: a "back" closes the sheet on top first, then asks the guard, and no
// second entry is left behind to cost a press.
const ENTRY_KEY = 'gladysSheet';
const BASE_KEY = 'gladysSheetBase';

let getOpenSheets = () => [];
// the leave guard of the page on screen: { isDirty(): boolean, onBack(): void }, or null
let leaveGuard = null;
let syncTimer = null;
// the id of the sheet entry the history is on, null on any other entry: what a "popstate" cannot
// tell by itself, the entry that was just left
let currentEntryId = null;

const hasHistory = () =>
  typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function';

const readEntryId = () => (hasHistory() && window.history.state && window.history.state[ENTRY_KEY]) || null;

// True while the entry on top of the history is the one of the sheets, open or leftover. A
// navigation started from there must REPLACE it (route(url, true)): "back" from the next page then
// lands on this page once, not twice.
const isSheetEntryOnTop = () => readEntryId() !== null;

const hasUnsavedChanges = () => Boolean(leaveGuard) && Boolean(leaveGuard.isDirty());

const sync = () => {
  syncTimer = null;
  if (!hasHistory() || (getOpenSheets().length === 0 && !hasUnsavedChanges()) || isSheetEntryOnTop()) {
    return;
  }
  // the page entry is marked with the id of the entry pushed above it: a "back" from one to the
  // other is told apart from any other move in the history
  const id = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  window.history.replaceState({ ...(window.history.state || {}), [BASE_KEY]: id }, '');
  window.history.pushState({ [ENTRY_KEY]: id }, '');
};

const scheduleSync = () => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(sync, 0);
};

const onPopState = () => {
  const leftEntryId = currentEntryId;
  currentEntryId = readEntryId();
  const wentBackToThePage =
    leftEntryId !== null && Boolean(window.history.state) && window.history.state[BASE_KEY] === leftEntryId;
  if (!wentBackToThePage) {
    return;
  }
  const openSheets = getOpenSheets();
  if (openSheets.length > 0) {
    openSheets[openSheets.length - 1].props.onClose();
    // sheets still open get their entry back
    scheduleSync();
  } else if (hasUnsavedChanges()) {
    // the page has unsaved changes: it asks (its leave sheet), and the entry comes back so the
    // next "back" is caught too
    leaveGuard.onBack();
    scheduleSync();
  } else {
    // the entry was a leftover: the user asked to leave the page
    window.history.back();
  }
};

// Called by the sheets each time one opens or closes
const sheetsChanged = openSheetsGetter => {
  getOpenSheets = openSheetsGetter;
  scheduleSync();
};

// Called by an edit page while it is shown: `guard.isDirty()` tells whether leaving would lose
// something, `guard.onBack()` is called on a system "back" that would. One page at a time.
const setLeaveGuard = guard => {
  leaveGuard = guard;
  scheduleSync();
};

// Called with the guard that was set: a page that unmounts after the next one mounted must not
// remove the guard of that next page
const clearLeaveGuard = guard => {
  if (leaveGuard === guard) {
    leaveGuard = null;
  }
};

// Called when the unsaved state of the page may have changed: the entry is pushed as soon as
// there is something to lose
const leaveGuardChanged = () => scheduleSync();

if (hasHistory()) {
  currentEntryId = readEntryId();
  window.addEventListener('popstate', onPopState);
  // a navigation of the router (pushState / replaceState) leaves the sheet entry without any
  // event: the entry the history is on is read again after each of them. Without this, coming
  // back from a page that replaced the sheet entry would be taken for leaving a leftover entry.
  ['pushState', 'replaceState'].forEach(method => {
    const original = window.history[method];
    window.history[method] = function trackSheetEntry(...args) {
      const result = original.apply(this, args);
      currentEntryId = readEntryId();
      return result;
    };
  });
}

export { isSheetEntryOnTop, sheetsChanged, setLeaveGuard, clearLeaveGuard, leaveGuardChanged };
