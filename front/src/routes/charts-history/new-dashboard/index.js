import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import { DASHBOARD_TYPE, DASHBOARD_VISIBILITY_LIST } from '../../../../../server/utils/constants';
import style from './style.css';

const NewChartsHistoryPage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <div class="row">
      <div class={cx('col', 'mx-auto', style.backButtonDiv)}>
        {props.prev && (
          <Link href={`/dashboard/charts-history/${props.prev}/edit`} class="btn btn-secondary btn-sm">
            <Text id="global.backButton" />
          </Link>
        )}
        {!props.prev && (
          <Link href="/dashboard/charts-history" class="btn btn-secondary btn-sm">
            <Text id="global.backButton" />
          </Link>
        )}
      </div>
    </div>
    <div class="row">
      <div class="col col-login mx-auto">
        <form onSubmit={props.createDashboard} class="card">
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body p-6">
                <div class="card-title">
                  <h3>
                    <Text id="charts-history.newChartsHistory.cardTitle" />
                  </h3>
                </div>
                <p>
                  <Text id="charts-history.newChartsHistory.description" />
                </p>
                {props.dashboardAlreadyExistError && (
                  <div class="alert alert-danger">
                    <Text id="charts-history.newChartsHistory.chartsHistoryAlreadyExist" />
                  </div>
                )}
                {props.unknownError && (
                  <div class="alert alert-danger">
                    <Text id="charts-history.newChartsHistory.unknownError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label">
                    <Text id="charts-history.newChartsHistory.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      class={cx('form-control', {
                        'is-invalid': props.dashboardAlreadyExistError || props.unknownError
                      })}
                      placeholder={<Text id="charts-history.newChartsHistory.nameLabel" />}
                      value={props.name}
                      onInput={props.updateName}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="charts-history.editChartsHistoryVisibility" />
                  </label>
                  <small>
                    <Text id="charts-history.editChartsHistoryVisibilityDescription" />
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

                <div class="form-footer">
                  <button onClick={props.createDashboard} class="btn btn-primary btn-block">
                    <Text id="charts-history.newChartsHistory.createChartsHistoryButton" />
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

class ChartsHistory extends Component {
  updateName = e => {
    this.setState({ name: e.target.value });
  };
  updateVisibility = e => {
    this.setState({ visibility: e.target.value });
  };
  goBack = () => {
    this.props.history.go(-1);
  };
  createDashboard = async e => {
    e.preventDefault();
    await this.setState({
      loading: true,
      dashboardAlreadyExistError: false,
      unknownError: false
    });
    try {
      const newDashboardChartsHistory = {
        name: this.state.name,
        visibility: this.state.visibility,
        type: DASHBOARD_TYPE.CHARTS_HISTORY,
        boxes: [[]] //TODO: laisser le choix entre [[], []] ou [[], [], []] également ?
      };
      const createDashboardChartsHistory = await this.props.httpClient.post(
        '/api/v1/dashboard',
        newDashboardChartsHistory
      );
      this.setState({ loading: false, dashboardAlreadyExistError: false, unknownError: false });
      route(`/dashboard/charts-history/${createDashboardChartsHistory.selector}/edit`);
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
      loading: false
    };
  }
  render(props, { name, visibility, loading, dashboardAlreadyExistError, unknownError }) {
    return (
      <NewChartsHistoryPage
        name={name}
        visibility={visibility}
        loading={loading}
        dashboardAlreadyExistError={dashboardAlreadyExistError}
        unknownError={unknownError}
        updateName={this.updateName}
        updateVisibility={this.updateVisibility}
        createDashboard={this.createDashboard}
        goBack={this.goBack}
        prev={props.prev}
      />
    );
  }
}

export default connect('user,httpClient', {})(ChartsHistory);
