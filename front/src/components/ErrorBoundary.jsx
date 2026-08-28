import { Component } from 'preact';
import { Text } from 'preact-i18n';

// Contains a render/lifecycle exception instead of letting it kill the whole
// app.
//
// Without a boundary, Preact rethrows an uncaught render error out of its
// `process()` loop (preact/src/component.js). That loop only resets
// `process._rerenderCount` on its LAST line, so a throw leaves the counter
// above zero — and `enqueueRender` then believes a flush is already
// scheduled and never schedules another one. The app stays painted exactly
// as it was and silently stops reacting to every later setState: buttons
// take focus, nothing happens, and only a reload brings it back (see the
// mobile dashboard editor report where the widget picker froze on screen).
//
// One misconfigured widget, one unexpected API payload, must never cost the
// user their whole session, so this renders a small recoverable message
// instead. `resetKey` clears the error when the surrounding context changes
// (a route change, another widget) so the user is not stuck with it either.
class ErrorBoundary extends Component {
  state = { error: null, resetKey: undefined };

  static getDerivedStateFromError(error) {
    return { error };
  }

  // A new resetKey means a different context (another route, another widget
  // type): the previous failure says nothing about it, so drop it and try to
  // render again
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey === state.resetKey) {
      return null;
    }
    return { error: null, resetKey: props.resetKey };
  }

  componentDidCatch(error) {
    // getDerivedStateFromError already stored it; keep the trace visible for
    // whoever debugs the report
    console.error(error);
  }

  render({ children, compact }, { error }) {
    if (!error) {
      return children;
    }
    return (
      <div class={compact ? 'alert alert-warning mb-0' : 'alert alert-danger'} role="alert">
        <Text id="errorBoundary.message" />
      </div>
    );
  }
}

export default ErrorBoundary;
