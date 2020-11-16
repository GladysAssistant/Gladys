import get from 'get-value';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../../../actions/dashboard/boxes/todoist';
import { DASHBOARD_BOX_DATA_KEY, DASHBOARD_BOX_STATUS_KEY, RequestStatus } from '../../../utils/consts';
import style from './style.css';

const padding = {
  paddingLeft: '25px',
  paddingRight: '25px',
  paddingTop: '10px',
  paddingBottom: '10px'
};

const BOX_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const Task = ({ task, onclick }) => {
  const icon = task.pending ? 'check-circle' : 'circle';
  const textStyle = {
    verticalAlign: 'text-bottom',
    textDecoration: task.pending ? 'line-through' : undefined
  };
  return (
    <div class={style.todoistTask} onclick={onclick}>
      <i className={`fe fe-${icon}`} style={{ marginRight: '10px' }} />
      <span style={textStyle}>{task.content}</span>
    </div>
  );
};

const TodoistBox = ({ children, ...props }) => {
  const onTaskClick = task => () => props.onTaskClick(task);

  return (
    <div class="card">
      <div>
        <h4 class="card-header">{props.name || <Text id="dashboard.boxTitle.todoist" />}</h4>
        {props.boxStatus === RequestStatus.Error && (
          <div class="card-body">
            <p class="alert alert-danger">
              <i class="fe fe-bell" />
              <span class="pl-2">
                <Text id="dashboard.boxes.todoist.unknownError" />
              </span>
            </p>
          </div>
        )}
        {props.boxStatus === RequestStatus.Getting && !props.tasks && (
          <div>
            <div class="card-body">
              <div class="dimmer active">
                <div class="loader" />
                <div class="dimmer-content" style={padding} />
              </div>
            </div>
          </div>
        )}
        {props.tasks && (
          <div style={padding} class="card-block px-30 py-10">
            <div class="row">
              <div class="col-12">
                {props.tasks.map(task => (
                  <Task key={task.id} task={task} onclick={onTaskClick(task)} />
                ))}
                {!props.tasks.length && (
                  <i>
                    <Text id="dashboard.boxes.todoist.emptyTasks" />
                  </i>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

@connect('DashboardBoxDataTodoist,DashboardBoxStatusTodoist', actions)
class TodoistBoxComponent extends Component {
  completeTaskUnbound(task) {
    this.props.completeTask(task.id, this.props.x, this.props.y);
  }

  constructor(props) {
    super(props);
    this.completeTask = this.completeTaskUnbound.bind(this);
  }

  componentDidMount() {
    const { todoist_project_id: todoistProjectId } = this.props.box;
    // get tasks
    this.props.getTasks(todoistProjectId, this.props.x, this.props.y);
    // refresh tasks every interval
    this.refreshInterval = setInterval(
      () => this.props.getTasks(todoistProjectId, this.props.x, this.props.y),
      BOX_REFRESH_INTERVAL_MS
    );
  }

  componentWillUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Todoist.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Todoist.${props.x}_${props.y}`);
    const tasks = get(boxData, 'tasks');
    return (
      <TodoistBox
        {...props}
        tasks={tasks}
        name={this.props.box.name}
        boxStatus={boxStatus}
        onTaskClick={this.completeTask}
      />
    );
  }
}

export default TodoistBoxComponent;
