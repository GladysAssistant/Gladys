import { Component, Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../../../actions/dashboard/edit-boxes/editTodoist';
import BaseEditBox from '../baseEditBox';

const ProjectOption = ({ project, todoist_project_id, depth = 0 }) => {
  const prefix = depth === 0 ? '' : new Array(depth).join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') + '&map; ';
  return (
    <Fragment>
      <option selected={project.id === todoist_project_id} value={project.id} dangerouslySetInnerHTML={{ __html: prefix + project.name}}>
      </option>
      {project.children && project.children.map(child => (<ProjectOption project={child} todoist_project_id={todoist_project_id} depth={depth + 1}/>))}
    </Fragment>
  )
}


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
            <ProjectOption project={project} todoist_project_id={props.box.todoist_project_id} />
          ))}
      </select>
    </div>
  </BaseEditBox>
);

@connect('projects', actions)
class EditTodoistBoxComponent extends Component {
  updateProject = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      todoist_project_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
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
    return <EditTodoistBox {...props} name={this.props.box.name} updateName={this.updateName} updateProject={this.updateProject} />;
  }
}

export default EditTodoistBoxComponent;
