import get from 'get-value';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../../../actions/dashboard/boxes/todolist';
import { DASHBOARD_BOX_DATA_KEY, DASHBOARD_BOX_STATUS_KEY, RequestStatus } from '../../../utils/consts';
import style from './style.css';
import dayjs from 'dayjs';

const BOX_REFRESH_INTERVAL_MS = 1 * 60 * 1000;

const Task = ({ task, onClick }) => {
  const icon = task.pending ? 'check-circle' : 'circle';
  const textStyle = {
    textDecoration: task.pending ? 'line-through' : undefined
  };

  return (
    <div class={style.todolistTask}>
      <div class="container">
        <div class="row">
          <span>
            <i class={`fe fe-${icon} mr-2 cursor-pointer`} onClick={onClick} />
            <span style={textStyle}>{task.content}</span>
          </span>
        </div>
        {task.due && (
          <div class="row">
            <span style={{ opacity: '50%', fontSize: '0.80rem' }}>
              <i class={`fe fe-calendar mr-3 ml-1`} />
              <span>{dayjs(task.due.date).format('D MMM')}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const TodolistBox = ({ children, ...props }) => {
  const onTaskClick = task => () => {
    props.onTaskClick(task);
  };
  return (
    <div class="card">
      <div className="card-header">
        <h3 class="card-title">
          <i class="fe fe-list" />
          <span class="m-1">{props.name || <Text id="dashboard.boxTitle.todolist" />}</span>
        </h3>
      </div>
      <div>
        {props.boxStatus === RequestStatus.ServiceNotConfigured && (
          <div class="card-body">
            <p class="alert alert-danger">
              <i class="fe fe-bell" />
              <span class="pl-2">
                <Text id="dashboard.boxes.todolist.serviceNotConfigured" />
              </span>
            </p>
          </div>
        )}
        {props.boxStatus === RequestStatus.Error && (
          <div class="card-body">
            <p class="alert alert-danger">
              <i class="fe fe-bell" />
              <span class="pl-2">
                <Text id="dashboard.boxes.todolist.unknownError" />
              </span>
            </p>
          </div>
        )}
        {props.boxStatus === RequestStatus.Getting && !props.tasks && (
          <div>
            <div class="card-body">
              <div class="dimmer active">
                <div class="loader" />
                <div class="dimmer-content p-1" />
              </div>
            </div>
          </div>
        )}
        {props.tasks && (
          <div class="card-block o-auto p-4">
            <div>
              {props.tasks.map(task => (
                <Task key={task.id} task={task} onClick={onTaskClick(task)} />
              ))}
              {!props.tasks.length && (
                <i>
                  <Text id="dashboard.boxes.todolist.emptyTasks" />
                </i>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

@connect('DashboardBoxDataTodolist,DashboardBoxStatusTodolist', actions)
class TodolistBoxComponent extends Component {
  closeTaskUnbound(task) {
    this.props.closeTask(task.id, this.props.x, this.props.y);
  }

  constructor(props) {
    super(props);
    this.closeTask = this.closeTaskUnbound.bind(this);
  }

  componentDidMount() {
    const { todolist_id: todolistId } = this.props.box;

    // get tasks
    this.props.getTasks(todolistId, this.props.x, this.props.y);

    // refresh tasks every interval
    this.refreshInterval = setInterval(
      () => this.props.getTasks(todolistId, this.props.x, this.props.y),
      BOX_REFRESH_INTERVAL_MS
    );
  }

  componentWillUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Todolist.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Todolist.${props.x}_${props.y}`);
    const tasks = get(boxData, 'tasks');

    return (
      <TodolistBox
        {...props}
        tasks={tasks}
        name={this.props.box.name}
        boxStatus={boxStatus}
        onTaskClick={this.closeTask}
      />
    );
  }
}

export default TodolistBoxComponent;
