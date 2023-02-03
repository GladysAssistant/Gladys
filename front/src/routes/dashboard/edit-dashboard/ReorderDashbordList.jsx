import { useRef } from 'preact/hooks';
import { Component } from 'preact';
import cx from 'classnames';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DASHBOARD_LIST_ITEM_TYPE = 'DASHBOARD_LIST_ITEM';

const DashboardListItem = ({ children, ...props }) => {
  const { index } = props;
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: DASHBOARD_LIST_ITEM_TYPE,
    item: () => {
      return { index };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));
  const [{ isActive }, drop] = useDrop({
    accept: DASHBOARD_LIST_ITEM_TYPE,
    collect: monitor => ({
      isActive: monitor.canDrop() && monitor.isOver()
    }),
    drop(item) {
      if (!ref.current) {
        return;
      }
      props.insertAtPosition(item.index, index);
    }
  });
  const openEditPage = () => {
    route(`/dashboard/${props.selector}/edit`);
  };
  preview(drop(ref));

  return (
    <li
      ref={ref}
      onClick={openEditPage}
      class={cx('list-group-item', {
        active: props.isSelected
      })}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'pointer',
        backgroundColor: isActive ? '#ecf0f1' : undefined
      }}
    >
      <i ref={drag} style={{ cursor: 'move' }} class="fe fe-list mr-2" /> {props.name}
    </li>
  );
};

class RedorderDashboardList extends Component {
  isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

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
      <DndProvider backend={this.isTouchDevice ? TouchBackend : HTML5Backend}>
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
      </DndProvider>
    );
  }
}

export default RedorderDashboardList;
