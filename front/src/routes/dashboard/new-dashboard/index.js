import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import IconSelector from '../../../components/scene/IconSelector';
import { DASHBOARD_TYPE, DASHBOARD_VISIBILITY_LIST } from '../../../../../server/utils/constants';
import style from './style.css';
import dashboardStyle from '../style.css';

// Same Horizon glass scene as the dashboard and its editor — this page is
// only reached from the empty state, creation from the editor happens in
// the edit panel.
const NewDashboardPage = ({ children, ...props }) => (
  <div class="page">
    <div class={cx('page-main', 'glass-theme', dashboardStyle.dashboardBackground, dashboardStyle.glassScene)}>
      <div class={cx('container', style.containerWithMargin)}>
        <div class="row">
          <div class={cx('col', 'mx-auto', style.backButtonDiv)}>
            {props.prev && (
              <Link href={`/dashboard/${props.prev}/edit`} class="btn btn-secondary btn-sm">
                <Text id="global.backButton" />
              </Link>
            )}
            {!props.prev && (
              <Link href="/dashboard" class="btn btn-secondary btn-sm">
                <Text id="global.backButton" />
              </Link>
            )}
          </div>
        </div>
        <div class="row">
          <div class={cx('col', 'mx-auto', style.formCol)}>
            <form onSubmit={props.createScene} class="card">
              <div class={props.loading ? 'dimmer active' : 'dimmer'}>
                <div class="loader" />
                <div class="dimmer-content">
                  <div class="card-body p-6">
                    <div class="card-title">
                      <h3>
                        <Text id="newDashboard.cardTitle" />
                      </h3>
                    </div>
                    <p>
                      <Text id="newDashboard.description" />
                    </p>
                    {props.dashboardAlreadyExistError && (
                      <div class="alert alert-danger">
                        <Text id="newDashboard.dashboardAlreadyExist" />
                      </div>
                    )}
                    {props.unknownError && (
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
                            'is-invalid': props.dashboardAlreadyExistError || props.unknownError
                          })}
                          placeholder={<Text id="newDashboard.nameLabel" />}
                          value={props.name}
                          onInput={props.updateName}
                        />
                      </Localizer>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="dashboard.editDashboardVisibility" />
                      </label>
                      <small>
                        <Text id="dashboard.editDashboardVisibilityDescription" />
                      </small>
                      <Localizer>
                        <select value={props.visibility} onChange={props.updateVisibility} class="form-control">
                          {DASHBOARD_VISIBILITY_LIST.map(dashboardVisibility => (
                            <option value={dashboardVisibility}>
                              <Text id={`dashboard.visibilities.${dashboardVisibility}`} />
                            </option>
                          ))}
                        </select>
                      </Localizer>
                    </div>

                    <div class="form-group">
                      <label class="form-label">
                        <Text id="newDashboard.iconLabel" />
                      </label>
                      <small class="d-block mb-2">
                        <Text id="newDashboard.iconDescription" />
                      </small>
                      <IconSelector value={props.icon} onChange={props.updateIcon} />
                    </div>
                    <div class="form-footer">
                      <button
                        onClick={props.createDashboard}
                        class="btn btn-primary btn-block"
                        disabled={props.loading || !props.name || !props.icon}
                      >
                        <Text id="newDashboard.createDashboardButton" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);

class Dashboard extends Component {
  updateName = e => {
    this.setState({ name: e.target.value });
  };
  updateVisibility = e => {
    this.setState({ visibility: e.target.value });
  };
  updateIcon = e => {
    this.setState({ icon: e.target.value });
  };
  goBack = () => {
    this.props.history.go(-1);
  };
  createDashboard = async e => {
    e.preventDefault();
    // The create button is disabled without a name and an icon, but Enter in
    // the name input can still submit the form: same guard on the handler.
    if (!this.state.name || !this.state.icon) {
      return;
    }
    await this.setState({
      loading: true,
      dashboardAlreadyExistError: false,
      unknownError: false
    });
    try {
      const newDashboard = {
        name: this.state.name,
        visibility: this.state.visibility,
        icon: this.state.icon,
        type: DASHBOARD_TYPE.MAIN,
        boxes: [{ columns: [[], [], []] }]
      };
      const createDashboard = await this.props.httpClient.post('/api/v1/dashboard', newDashboard);
      this.setState({ loading: false, dashboardAlreadyExistError: false, unknownError: false });
      route(`/dashboard/${createDashboard.selector}/edit`);
    } catch (e) {
      if (e.response && e.response.status === 409) {
        this.setState({ dashboardAlreadyExistError: true });
      } else {
        this.setState({ unknownError: true });
      }
      this.setState({ loading: false });
      console.error(e);
    }
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      name: '',
      visibility: 'private',
      icon: null,
      loading: false
    };
  }
  render(props, { name, visibility, icon, loading, dashboardAlreadyExistError, unknownError }) {
    return (
      <NewDashboardPage
        name={name}
        visibility={visibility}
        icon={icon}
        loading={loading}
        dashboardAlreadyExistError={dashboardAlreadyExistError}
        unknownError={unknownError}
        updateName={this.updateName}
        updateVisibility={this.updateVisibility}
        updateIcon={this.updateIcon}
        createDashboard={this.createDashboard}
        goBack={this.goBack}
        prev={props.prev}
      />
    );
  }
}

export default connect('user,httpClient', {})(Dashboard);
