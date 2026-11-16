import { Component } from 'preact';

import { setLeaveGuard, clearLeaveGuard, leaveGuardChanged } from '../sheet/sheetHistory';

/**
 * @description Makes the system "back" (the Android button, the iOS edge swipe, the browser
 * button) go through the leave guard of an edit page (docs/specs/mobile-pages/README.md, C.4):
 * while `dirty`, a "back" calls `onBack` — the handler that opens the leave sheet — instead of
 * leaving the page. It shares the history entry of the sheets (sheetHistory.js): a "back" closes
 * the sheet on top first. Rendered by the phone layout of the page; renders nothing.
 *
 * The page leaves with `route(url, isSheetEntryOnTop())`, as it does from a sheet: the navigation
 * replaces the entry of the guard.
 */
class SystemBackGuard extends Component {
  guard = {
    isDirty: () => Boolean(this.props.dirty),
    onBack: () => this.props.onBack()
  };

  componentDidMount() {
    setLeaveGuard(this.guard);
  }

  componentDidUpdate(prevProps) {
    if (Boolean(prevProps.dirty) !== Boolean(this.props.dirty)) {
      leaveGuardChanged();
    }
  }

  componentWillUnmount() {
    clearLeaveGuard(this.guard);
  }

  render() {
    return null;
  }
}

export default SystemBackGuard;
