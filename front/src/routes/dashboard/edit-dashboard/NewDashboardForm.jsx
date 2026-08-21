import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import cx from 'classnames';

import { DASHBOARD_TYPE, DASHBOARD_VISIBILITY_LIST } from '../../../../../server/utils/constants';

// Dashboard creation, hosted in the edit panel so the user never leaves
// the editor: on success we route to the new dashboard's edit page and
// the editor reloads on the URL change.
class NewDashboardForm extends Component {
  updateName = e => {
    this.setState({ name: e.target.value });
  };

  updateVisibility = e => {
    this.setState({ visibility: e.target.value });
  };

  createDashboard = async e => {
    e.preventDefault();
    this.setState({ loading: true, dashboardAlreadyExistError: false, unknownError: false });
    try {
      const createdDashboard = await this.props.httpClient.post('/api/v1/dashboard', {
        name: this.state.name,
        visibility: this.state.visibility,
        type: DASHBOARD_TYPE.MAIN,
        boxes: [{ columns: [[], [], []] }]
      });
      this.setState({ loading: false });
      this.props.closeEditPanel();
      route(`/dashboard/${createdDashboard.selector}/edit`);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        this.setState({ loading: false, dashboardAlreadyExistError: true });
      } else {
        this.setState({ loading: false, unknownError: true });
        console.error(error);
      }
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      name: '',
      visibility: 'private',
      loading: false,
      dashboardAlreadyExistError: false,
      unknownError: false
    };
  }

  render(props, { name, visibility, loading, dashboardAlreadyExistError, unknownError }) {
    return (
      <form onSubmit={this.createDashboard}>
        <p>
          <Text id="newDashboard.description" />
        </p>
        {dashboardAlreadyExistError && (
          <div class="alert alert-danger">
            <Text id="newDashboard.dashboardAlreadyExist" />
          </div>
        )}
        {unknownError && (
          <div class="alert alert-danger">
            <Text id="newDashboard.unknownError" />
          </div>
        )}
        <div class="form-group">
          <label class="form-label">
            <Text id="newDashboard.nameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class={cx('form-control', {
                'is-invalid': dashboardAlreadyExistError || unknownError
              })}
              placeholder={<Text id="newDashboard.nameLabel" />}
              value={name}
              onInput={this.updateName}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.editDashboardVisibility" />
          </label>
          <small class="d-block mb-2">
            <Text id="dashboard.editDashboardVisibilityDescription" />
          </small>
          <select value={visibility} onChange={this.updateVisibility} class="form-control">
            {DASHBOARD_VISIBILITY_LIST.map(dashboardVisibility => (
              <option value={dashboardVisibility}>
                <Text id={`dashboard.visibilities.${dashboardVisibility}`} />
              </option>
            ))}
          </select>
        </div>
        <div class="form-footer">
          <button type="submit" class="btn btn-primary btn-block" disabled={loading || !name}>
            <Text id="newDashboard.createDashboardButton" />
          </button>
        </div>
      </form>
    );
  }
}

export default connect('httpClient', {})(NewDashboardForm);
