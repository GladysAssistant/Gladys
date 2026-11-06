import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import Select from '../../../../components/form/Select';
import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

class SetUserLocation extends Component {
  state = { users: [] };

  getUsers = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user');
      this.setState({
        users: users.map(user => ({
          label: users.some(other => other.selector !== user.selector && other.firstname === user.firstname)
            ? `${user.firstname} (${user.selector})`
            : user.firstname,
          value: user.selector
        }))
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getUsers();
  }

  render(props, { users }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.setUserLocation.description" />
        </p>
        <div class="form-group">
          <label class="form-label" for={`location-user-${props.path}`}>
            <Text id="editScene.actionsCard.userPresence.userLabel" />
          </label>
          <Select
            inputId={`location-user-${props.path}`}
            options={users}
            value={users.find(user => user.value === props.action.user) || null}
            onChange={option => props.updateActionProperty(props.path, 'user', option ? option.value : undefined)}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        {['latitude', 'longitude'].map(field => (
          <fieldset class="form-group" key={field} data-cy={`location-${field}`}>
            <legend class="form-label">
              <Text id={`editScene.actionsCard.setUserLocation.${field}`} />
            </legend>
            <Localizer>
              <TextWithVariablesInjected
                singleLineInput
                text={props.action[field] === undefined ? '' : String(props.action[field])}
                triggersVariables={props.triggersVariables}
                actionsGroupsBefore={props.actionsGroupsBefore}
                variables={props.variables}
                path={props.path}
                updateText={text => props.updateActionProperty(props.path, field, text)}
                placeholder={<Text id={`editScene.actionsCard.setUserLocation.${field}Placeholder`} />}
              />
            </Localizer>
          </fieldset>
        ))}
        <small class="text-muted">
          <Text id="editScene.actionsCard.setUserLocation.variablesHint" />
        </small>
      </div>
    );
  }
}

export default connect('httpClient', {})(SetUserLocation);
