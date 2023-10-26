import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import mainActions from '../../actions/main';
import style from './style.css';

class SetTabletMode extends Component {
  getHouses = async () => {
    try {
      const houses = await this.props.httpClient.get('/api/v1/house');
      await this.setState({
        houses
      });
    } catch (e) {
      console.error(e);
    }
  };

  getTabletMode = async () => {
    try {
      const currentSession = await this.props.httpClient.get('/api/v1/session/tablet_mode');
      let selectedHouse = null;
      if (this.state.houses && currentSession.current_house_id) {
        const houseFound = this.state.houses.find(h => h.id === currentSession.current_house_id);
        selectedHouse = houseFound ? houseFound.selector : null;
      }
      await this.setState({
        currentSession,
        selectedHouse,
        selectedTabletMode: currentSession.tablet_mode
      });
    } catch (e) {
      console.error(e);
    }
  };

  saveTabletMode = async () => {
    await this.setState({
      loading: true
    });
    try {
      await this.props.httpClient.post('/api/v1/session/tablet_mode', {
        tablet_mode: this.state.selectedHouse !== null,
        house: this.state.selectedHouse
      });
      await this.props.refreshTabletMode();
      this.props.session.setTabletModeCurrentHouseSelector(this.state.selectedHouse);
      this.props.toggleDefineTabletMode();
    } catch (e) {
      console.error(e);
    }
    await this.setState({
      loading: false
    });
  };

  refreshData = async () => {
    await this.setState({
      loading: true
    });
    await this.getHouses();
    await this.getTabletMode();
    await this.setState({
      loading: false
    });
  };

  onHouseChange = e => {
    this.setState({ selectedHouse: e.target.value || null });
  };

  constructor(props) {
    super(props);
    this.state = {
      houses: []
    };
  }

  componentDidMount() {
    this.refreshData();
  }

  render({ defineTabletModeOpened }, { houses, selectedHouse, loading }) {
    return (
      <div
        class={cx(style.tabletModeDiv, {
          [style.tabletModeDivOpen]: defineTabletModeOpened
        })}
      >
        <div class="card">
          <div class="card-body">
            <div class={loading ? 'dimmer active' : 'dimmer'}>
              <div class="loader" />
              <div class="dimmer-content">
                <p>
                  <Text id="dashboard.tabletMode.description" />
                </p>
                <div className="form-group">
                  <div className="form-label">
                    <Text id="dashboard.tabletMode.houseLabel" />
                  </div>
                  <select onChange={this.onHouseChange} className="form-control">
                    <option value="">
                      <Text id="dashboard.tabletMode.tabletModeDisabled" />
                    </option>
                    {houses &&
                      houses.map(house => (
                        <option selected={house.selector === selectedHouse} value={house.selector}>
                          {house.name}
                        </option>
                      ))}
                  </select>
                </div>
                <p>
                  <MarkupText id="dashboard.tabletMode.fullScreenForce" />
                </p>
                <div className="form-group">
                  <button class="btn btn-success" onClick={this.saveTabletMode}>
                    <Text id="global.save" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user,session', mainActions)(SetTabletMode);
