import { useRef } from 'preact/hooks';
import { Component } from 'preact';
import cx from 'classnames';
import update from 'immutability-helper';
import { route } from 'preact-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { wrapEmojisJSX } from '../../../utils/emojiWrapper';
import { getDragAndDropBackend } from '../../../utils/dragAndDropBackend';

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
      <i ref={drag} style={{ cursor: 'move' }} class="fe fe-list mr-2" /> {wrapEmojisJSX(props.name)}
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
    const { backend, options } = getDragAndDropBackend();
    return (
      <DndProvider backend={backend} options={options}>
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
