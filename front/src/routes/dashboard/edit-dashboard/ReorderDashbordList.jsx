import { useRef } from 'preact/hooks';
import { Component } from 'preact';
import cx from 'classnames';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { wrapEmojisJSX } from '../../../utils/emojiWrapper';
import { startPointerDrag } from '../../../utils/pointerDrag';
import { computeInsertionIndex, insertionLineRect } from './widgetDropPlacement';
import style from './style.css';

// Horizon dashboard list: glass pill rows with an always-visible grab
// handle. Reordering runs on the pointer-events engine with the same
// placement model as the widget canvas — an insertion indicator line in the
// exact gap where the row would land, computed from the pointer position
// (no per-row drop targets, no layout shift).
const resolveListPlacement = (target, point) => {
  const list = target.hasAttribute('data-dashboard-list') ? target : target.closest('[data-dashboard-list]');
  if (!list) {
    return null;
  }
  const rows = Array.from(list.querySelectorAll('[data-dashboard-list-drop]'));
  return { list, rows, index: computeInsertionIndex(rows, point.y) };
};

const isNoopListInsertion = (index, sourceIndex) => index === sourceIndex || index === sourceIndex + 1;

const DashboardListItem = ({ children, ...props }) => {
  const { index } = props;
  const ref = useRef(null);

  const onHandlePointerDown = event => {
    startPointerDrag(event, {
      source: ref.current,
      draggingClass: 'gladys-drag-source-dim',
      dropSelector: '[data-dashboard-list-drop], [data-dashboard-list]',
      ghostClass: style.dragLayerPill,
      ghostIconClass: 'fe fe-menu',
      ghostLabel: props.name,
      bodyClass: 'gladys-list-dragging',
      indicatorClass: style.dropIndicator,
      resolveHover: (target, point) => {
        const placement = resolveListPlacement(target, point);
        if (!placement) {
          return null;
        }
        const showLine = !isNoopListInsertion(placement.index, index);
        return {
          area: null,
          indicator: showLine
            ? insertionLineRect(placement.list.getBoundingClientRect(), placement.rows, placement.index)
            : null
        };
      },
      onDrop: (target, point) => {
        const placement = resolveListPlacement(target, point);
        if (!placement || isNoopListInsertion(placement.index, index)) {
          return;
        }
        // removal shifts the indices below the source before re-insertion
        const destination = placement.index > index ? placement.index - 1 : placement.index;
        props.insertAtPosition(index, destination);
      }
    });
  };

  const openEditPage = () => {
    route(`/dashboard/${props.selector}/edit`);
  };

  return (
    <li
      ref={ref}
      onClick={openEditPage}
      data-dashboard-list-drop
      data-drop-index={index}
      class={cx(style.dashboardListItem, {
        [style.dashboardListItemActive]: props.isSelected
      })}
    >
      <span class={style.listDragHandle} data-cy={`reorder-dashboard-${index}`} onPointerDown={onHandlePointerDown}>
        <i class="fe fe-menu" />
      </span>
      <span class={style.dashboardListItemName}>{wrapEmojisJSX(props.name)}</span>
    </li>
  );
};

class RedorderDashboardList extends Component {
  insertAtPosition = (sourceIndex, destinationIndex) => {
    const { dashboards } = this.props;
    const element = dashboards[sourceIndex];
    const newDashboards = update(dashboards, {
      $splice: [
        [sourceIndex, 1],
        [destinationIndex, 0, element]
      ]
    });
    this.props.updateDashboardList(newDashboards);
  };

  render({ dashboards, currentDashboard }, {}) {
    return (
      <ul class={style.dashboardList} data-dashboard-list>
        {dashboards &&
          dashboards.map((dashboard, index) => (
            <DashboardListItem
              index={index}
              id={dashboard.id}
              name={dashboard.name}
              selector={dashboard.selector}
              isSelected={dashboard.id === currentDashboard.id}
              insertAtPosition={this.insertAtPosition}
            />
          ))}
      </ul>
    );
  }
}

export default RedorderDashboardList;
