import { useRef } from 'preact/hooks';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import update from 'immutability-helper';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DASHBOARD_LIST_ITEM_TYPE = 'DASHBOARD_LIST_ITEM';

const DashboardListItem = ({ children, ...props }) => {
  const { index } = props;
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag(() => ({
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
  drag(drop(ref));

  return (
    <li
      ref={ref}
      class="list-group-item"
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isActive ? '#ecf0f1' : 'white'
      }}
    >
      <i class="fe fe-list mr-2" /> {props.name}
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

  render({ dashboards }, {}) {
    return (
      <DndProvider backend={HTML5Backend}>
        <label class="form-label">
          <Text id="dashboard.reorderDashboardsLabel" />
        </label>
        <ul class="list-group">
          {dashboards &&
            dashboards.map((dashboard, index) => (
              <DashboardListItem
                index={index}
                id={dashboard.id}
                name={dashboard.name}
                insertAtPosition={this.insertAtPosition}
              />
            ))}
        </ul>
      </DndProvider>
    );
  }
}

export default RedorderDashboardList;
