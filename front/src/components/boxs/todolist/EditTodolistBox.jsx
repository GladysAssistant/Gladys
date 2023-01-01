import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import BaseEditBox from '../baseEditBox';

const EditTodolistBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.todolist">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.todolist.editNameLabel" />
      </label>
      <input type="text" onChange={props.updateName} class="form-control" value={props.name} />
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
            <option selected={todolist.id === String(props.box.todolist_id)} value={todolist.id}>
              {todolist.name}
            </option>
          ))}
      </select>
    </div>
  </BaseEditBox>
);

@connect('httpClient')
class EditTodolistBoxComponent extends Component {
  updateTodolist = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      todolist_id: e.target.value ? String(e.target.value) : undefined
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
      loading: true
    });
    try {
      const todolist = await this.props.httpClient.get('/api/v1/todolist');
      this.setState({
        todolist,
        loading: false
      });
    } catch (e) {
      await this.setState({
        loading: true
      });
    }
  }

  render(props, { todolist }) {
    return (
      <EditTodolistBox
        {...props}
        name={this.props.box.name}
        todolist={todolist}
        updateName={this.updateName}
        updateTodolist={this.updateTodolist}
      />
    );
  }
}

export default EditTodolistBoxComponent;
