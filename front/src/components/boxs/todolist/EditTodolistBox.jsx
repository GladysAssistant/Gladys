import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import BaseEditBox from '../baseEditBox';
import { RequestStatus } from '../../../utils/consts';

const EditTodolistBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.todolist">
    <div>
      {props.status === RequestStatus.ServiceNotConfigured && (
        <>
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.todolist.serviceNotConfigured" />
            </span>
          </p>
        </>
      )}
      {props.status === RequestStatus.Error && (
        <>
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.todolist.unknownError" />
            </span>
          </p>
        </>
      )}
      {props.status === RequestStatus.Getting && !props.todolist && (
        <div style="backgroundColor: #FF00FF" class="dimmer active">
          <div class="loader" />
          <div class="dimmer-content p-1" />
        </div>
      )}
      {props.todolist && (
        <>
          <div class="form-group">
            <label>
              <Text id="dashboard.boxes.todolist.editNameLabel" />
            </label>
            <input type="text" onChange={props.updateName} className="form-control" value={props.name} />
          </div>
          <div class="form-group">
            <label>
              <Text id="dashboard.boxes.todolist.editProjectLabel" />
            </label>
            <select onChange={props.updateTodolist} class="form-control">
              <option>
                <Text id="global.emptySelectOption" />
              </option>
              {props.todolist &&
                props.todolist.map(todolist => (
                  <option selected={todolist.id === props.box.todolist_id} value={todolist.id}>
                    {todolist.name}
                  </option>
                ))}
            </select>
          </div>
        </>
      )}
    </div>
  </BaseEditBox>
);

@connect('httpClient')
class EditTodolistBoxComponent extends Component {
  updateTodolist = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      todolist_id: e.target.value ? e.target.value : undefined
    });
  };
  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };
  componentDidMount() {
    this.getTodolist();
  }

  async getTodolist() {
    await this.setState({
      status: RequestStatus.Getting
    });
    try {
      const todolist = await this.props.httpClient.get('/api/v1/todolist');
      this.setState({
        todolist,
        status: RequestStatus.Success
      });
    } catch (e) {
      await this.setState({
        status: RequestStatus.Error
      });
    }
  }

  render(props, { todolist, status }) {
    return (
      <EditTodolistBox
        {...props}
        name={this.props.box.name}
        todolist={todolist}
        status={status}
        updateName={this.updateName}
        updateTodolist={this.updateTodolist}
      />
    );
  }
}

export default EditTodolistBoxComponent;
