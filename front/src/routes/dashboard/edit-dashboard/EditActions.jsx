import { useLayoutEffect, useRef } from 'preact/hooks';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';

// Fixed action bar of the editor. Its height is published as a CSS variable
// because the edit panel (a bottom sheet on mobile) must sit exactly on top
// of it: the bar grows to two rows when the labels don't fit on one line, and
// a hardcoded offset would then leave the sheet hidden behind it.
const useFooterHeight = () => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const publish = () => {
      document.documentElement.style.setProperty('--gl-editor-footer-height', `${element.offsetHeight}px`);
    };
    publish();
    // ResizeObserver is not everywhere (old wall tablets): the initial
    // measure above already covers the common case, the observer only keeps
    // it honest across rotations and label changes
    let observer;
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(publish);
      observer.observe(element);
    }
    window.addEventListener('resize', publish);
    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener('resize', publish);
      document.documentElement.style.removeProperty('--gl-editor-footer-height');
    };
  }, []);
  return ref;
};

const EditActions = props => {
  const footerRef = useFooterHeight();
  return (
    <div class={cx('fixed-bottom footer', style.editActionsFooter)} ref={footerRef}>
      <div class="container">
        {/* the actions are one wrapping, right-aligned row: on a narrow phone
            the three labels of a verbose language (fr: Annuler / Supprimer /
            Sauvegarder) are wider than the screen, and a single non-wrapping
            row overflowed off the LEFT edge — "Annuler" ended up half out of
            the viewport, out of reach */}
        <div class={style.editActionsRow}>
          {!props.askDeleteDashboard && (
            <>
              {/* cancel only makes sense while there is something to discard */}
              {props.hasUnsavedChanges && (
                <button onClick={props.cancelDashboardEdit} className="btn btn-outline-secondary btn-sm">
                  <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
                </button>
              )}
              <button onClick={props.askDeleteCurrentDashboard} className="btn btn-outline-danger btn-sm">
                <Text id="dashboard.editDashboardDeleteButton" /> <i class="fe fe-trash" />
              </button>
              {/* saving keeps the user in the editor (chain editing): the
                  confirmation is a transient label that never blocks anything —
                  the moment everything is saved, leaving is available */}
              {props.justSaved && (
                <span className="text-success" data-cy="dashboard-saved-label">
                  <Text id="dashboard.editDashboardSavedButton" /> <i class="fe fe-check" />
                </span>
              )}
              {props.hasUnsavedChanges && (
                <button onClick={props.saveDashboard} className="btn btn-outline-primary btn-sm">
                  <Text id="dashboard.editDashboardSaveButton" /> <i class="fe fe-check" />
                </button>
              )}
              {!props.hasUnsavedChanges && (
                <button onClick={props.cancelDashboardEdit} className="btn btn-outline-primary btn-sm">
                  <Text id="dashboard.editDashboardDoneButton" /> <i class="fe fe-check" />
                </button>
              )}
            </>
          )}

          {props.askDeleteDashboard && (
            <>
              <span class={style.editActionsQuestion}>
                <Text id="dashboard.editDashboardDeleteText" />
              </span>
              <button onClick={props.deleteCurrentDashboard} className="btn btn-outline-danger btn-sm">
                <Text id="dashboard.editDashboardDeleteButton" /> <i class="fe fe-trash" />
              </button>
              <button onClick={props.cancelDeleteCurrentDashboard} className="btn btn-outline-secondary btn-sm">
                <Text id="dashboard.editDashboardCancelButton" /> <i class="fe fe-slash" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditActions;
