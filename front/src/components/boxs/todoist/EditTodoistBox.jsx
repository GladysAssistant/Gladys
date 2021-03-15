import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../../../actions/dashboard/edit-boxes/editTodoist';
import BaseEditBox from '../baseEditBox';

const EditTodoistBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.todoist">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.todoist.editNameLabel" />
      </label>
      <input type="text" onChange={props.updateName} class="form-control" value={props.name} />
    </div>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.todoist.editProjectLabel" />
      </label>
      <select onChange={props.updateProject} class="form-control">
        <option>
          <Text id="global.emptySelectOption" />
        </option>
        {props.projects &&
          props.projects.map(project => (
            <option selected={project.id === props.box.todoist_project_id} value={project.id}>
              {project.name}
            </option>
          ))}
      </select>
    </div>
  </BaseEditBox>
);

@connect('projects', actions)
class EditTodoistBoxComponent extends Component {
  updateProject = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      todoist_project_id: e.target.value ? parseInt(e.target.value, 10) : undefined
    });
  };
  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };
  componentDidMount() {
    this.props.getProjects();
  }

  render(props, {}) {
    return (
      <EditTodoistBox
        {...props}
        name={this.props.box.name}
        updateName={this.updateName}
        updateProject={this.updateProject}
      />
    );
  }
}

export default EditTodoistBoxComponent;
