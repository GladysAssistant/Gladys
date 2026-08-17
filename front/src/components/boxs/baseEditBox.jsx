import { Text, Localizer } from 'preact-i18n';
import { useRef, useState } from 'preact/hooks';
import { useDrag, useDrop } from 'react-dnd';
import cx from 'classnames';
import get from 'get-value';

import { wrapEmojisJSX } from '../../utils/emojiWrapper';

const DASHBOARD_EDIT_BOX_TYPE = 'DASHBOARD_EDIT_BOX';

const BaseEditBox = ({ children, ...props }) => {
  const { x, y } = props;
  const ref = useRef(null);
  const [moveToDashboardOpened, setMoveToDashboardOpened] = useState(false);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: DASHBOARD_EDIT_BOX_TYPE,
    item: () => {
      return { x, y };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    accept: DASHBOARD_EDIT_BOX_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.moveCard(item.x, item.y, x, y);
    }
  });
  preview(drop(ref));
  const removeBox = () => {
    props.removeBox(x, y);
  };
  const currentDashboardSelector = get(props, 'homeDashboard.selector');
  const otherDashboards = (props.dashboards || []).filter(dashboard => dashboard.selector !== currentDashboardSelector);
  // A box can only be moved to another dashboard if it's configured, and if another dashboard exists
  const displayMoveToDashboard =
    !props.isMobileReordering &&
    typeof props.moveBoxToDashboard === 'function' &&
    get(props, 'box.type') !== undefined &&
    otherDashboards.length > 0;
  const toggleMoveToDashboard = () => {
    setMoveToDashboardOpened(!moveToDashboardOpened);
  };
  const moveBoxToDashboard = dashboardSelector => {
    setMoveToDashboardOpened(false);
    props.moveBoxToDashboard(x, y, dashboardSelector);
  };
  const moveToDashboardMenuId = `move-box-to-dashboard-menu-${x}-${y}`;
  if (props.isMobileReordering) {
    return (
      <div
        ref={ref}
        class="card"
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: 'pointer',
          backgroundColor: isActive ? '#ecf0f1' : undefined,
          userSelect: 'none'
        }}
      >
        <div ref={drag} style={{ minHeight: '2.5rem', padding: '1rem 1.5rem' }}>
          <div class="d-flex bd-highlight justify-content-between">
            <div>
              <i style={{ cursor: 'move' }} class="fe fe-list mr-4" />
            </div>
            <div class="flex-fill">
              <Text id={props.titleKey} />
            </div>
            <div class="flex-fill text-right">{props.titleValue && <small>{props.titleValue}</small>}</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={ref}
      class="card mb-2"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'pointer',
        backgroundColor: isActive ? '#ecf0f1' : undefined
      }}
    >
      <div class="card-header">
        <h3 class="card-title">
          {props.isMobileReordering && <i style={{ cursor: 'move' }} class="fe fe-list mr-4" />}
          {props.titleKey && <Text id={props.titleKey} />}
        </h3>
        <div class="card-options">
          <a class="card-options-remove">
            <i ref={drag} style={{ cursor: 'move' }} class="fe fe-move mr-2 d-none d-lg-inline" />
          </a>
          {displayMoveToDashboard && (
            <div class="dropdown">
              <Localizer>
                <button
                  type="button"
                  onClick={toggleMoveToDashboard}
                  class="card-options-remove"
                  aria-label={<Text id="dashboard.moveBoxToDashboard.title" />}
                  aria-haspopup="true"
                  aria-expanded={moveToDashboardOpened ? 'true' : 'false'}
                  aria-controls={moveToDashboardMenuId}
                  // .card-options only styles anchors, so a native button needs the same look
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    marginLeft: '0.5rem',
                    minWidth: '1rem',
                    fontSize: '1rem',
                    color: '#9aa0ac',
                    cursor: 'pointer'
                  }}
                >
                  <i style={{ verticalAlign: 'middle' }} class="fe fe-corner-up-right mr-2" />
                </button>
              </Localizer>
              <div
                id={moveToDashboardMenuId}
                class={cx('dropdown-menu', 'dropdown-menu-right', {
                  show: moveToDashboardOpened
                })}
              >
                <span class="dropdown-header">
                  <Text id="dashboard.moveBoxToDashboard.title" />
                </span>
                {otherDashboards.map(dashboard => (
                  <button
                    key={dashboard.selector}
                    type="button"
                    class="dropdown-item"
                    onClick={() => moveBoxToDashboard(dashboard.selector)}
                  >
                    {wrapEmojisJSX(dashboard.name)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!props.isMobileReordering && (
            <a onClick={removeBox} class="card-options-remove">
              <i class="fe fe-x" />
            </a>
          )}
        </div>
      </div>
      <div class="card-body">{children}</div>
    </div>
  );
};

export default BaseEditBox;
