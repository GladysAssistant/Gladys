import { useRef } from 'preact/hooks';
import { Component } from 'preact';
import cx from 'classnames';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { wrapEmojisJSX } from '../../../utils/emojiWrapper';
import { startPointerDrag } from '../../../utils/pointerDrag';
import style from './style.css';

// Reordering runs on the pointer-events engine (utils/pointerDrag.js), like
// the widget canvas: same feedback everywhere, no native drag, no react-dnd.
const DashboardListItem = ({ children, ...props }) => {
  const { index } = props;
  const ref = useRef(null);

  const onHandlePointerDown = event => {
    startPointerDrag(event, {
      source: ref.current,
      draggingClass: 'gladys-drag-source-dim',
      dropSelector: '[data-dashboard-list-drop]',
      ghostClass: style.dragLayerPill,
      ghostIconClass: 'fe fe-list',
      ghostLabel: props.name,
      bodyClass: 'gladys-list-dragging',
      onDrop: target => props.insertAtPosition(index, Number(target.getAttribute('data-drop-index')))
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
      data-drop-active-class="gladys-list-drop-active"
      class={cx('list-group-item', {
        active: props.isSelected
      })}
      style={{ cursor: 'pointer' }}
    >
      <i
        class={cx('fe fe-list mr-2', style.listDragHandle)}
        data-cy={`reorder-dashboard-${index}`}
        onPointerDown={onHandlePointerDown}
      />{' '}
      {wrapEmojisJSX(props.name)}
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
      <ul class="list-group">
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
