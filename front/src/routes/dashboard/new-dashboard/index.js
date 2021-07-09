import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router';
import cx from 'classnames';
import { DASHBOARD_TYPE } from '../../../../../server/utils/constants';
import style from './style.css';
import { RequestStatus } from '../../../utils/consts';

const NewDashboardPage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <Link href="/dashboard" class="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </Link>
    <div class="row">
      <div class="col col-login mx-auto">
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
                {props.createSceneStatus === RequestStatus.ConflictError && (
                  <div class="alert alert-danger">
                    <Text id="newDashboard.dashboardAlreadyExist" />
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
                        'is-invalid': props.dashboardNameError
                      })}
                      placeholder={<Text id="newDashboard.nameLabel" />}
                      value={props.name}
                      onInput={props.updateName}
                    />
                  </Localizer>
                  <div class="invalid-feedback">
                    <Text id="newDashboard.invalidName" />
                  </div>
                </div>

                <div class="form-footer">
                  <button
                    onClick={props.createDashboard}
                    class="btn btn-primary btn-block"
                    disabled={props.createDashboardStatus === RequestStatus.Getting}
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
);

@connect('user,httpClient', {})
class Dashboard extends Component {
  updateName = e => {
    this.setState({ name: e.target.value });
  };
  createDashboard = async e => {
    e.preventDefault();
    await this.setState({ loading: true });
    try {
      const newDashboard = {
        name: this.state.name,
        type: DASHBOARD_TYPE.MAIN,
        boxes: [[], [], []]
      };
      const createDashboard = await this.props.httpClient.post('/api/v1/dashboard', newDashboard);
      this.setState({ loading: false });
      route(`/dashboard/${createDashboard.selector}`);
    } catch (e) {
      this.setState({ loading: false });
      console.error(e);
    }
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      name: '',
      loading: false
    };
  }
  render(props, { name, loading }) {
    return (
      <NewDashboardPage
        name={name}
        loading={loading}
        updateName={this.updateName}
        createDashboard={this.createDashboard}
      />
    );
  }
}

export default Dashboard;
