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
      await this.props.setTabletMode(this.state.selectedHouse);
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
    this.setState({ selectedHouse: e.target.value || null, tabletModeUrlCopied: false });
  };

  // The ready-to-use URL for a wall tablet: opens this dashboard already in
  // tablet mode for the selected house, and forced full-screen. The value is
  // the house selector (a URL-safe slug), so no encoding or name typing is
  // needed - this is what frees the user from ever knowing what a selector is.
  tabletModeUrl = () =>
    `${window.location.origin}/dashboard?tablet_mode_house=${this.state.selectedHouse}&fullscreen=force`;

  copyTabletModeUrl = async () => {
    try {
      // A local Gladys is often served over plain http on the LAN, which is not
      // a secure context: navigator.clipboard may then be undefined and this
      // throws. That is fine - the URL field stays selectable for a manual copy.
      await navigator.clipboard.writeText(this.tabletModeUrl());
      this.setState({ tabletModeUrlCopied: true });
    } catch (e) {
      console.error(e);
    }
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

  // The menu stays mounted at all times (its open/close is only a CSS slide),
  // so its data is fetched once on mount - before anything else can change the
  // session's tablet mode, e.g. the ?tablet_mode_house= URL param handled in
  // routes/dashboard/index.js, which runs after this child has mounted.
  // Re-fetch each time the menu opens so the select always reflects the real
  // session state, and a Save never silently turns a URL-forced tablet mode
  // back off.
  componentDidUpdate(prevProps) {
    if (!prevProps.defineTabletModeOpened && this.props.defineTabletModeOpened) {
      this.refreshData();
    }
  }

  render({ defineTabletModeOpened }, { houses, selectedHouse, loading, tabletModeUrlCopied }) {
    const copyUrlLabel = tabletModeUrlCopied ? 'dashboard.tabletMode.urlCopied' : 'dashboard.tabletMode.copyUrl';
    return (
      <div
        class={cx(style.tabletModeDiv, {
          [style.tabletModeDivOpen]: defineTabletModeOpened
        })}
      >
        <div class={style.tabletModeDivContent}>
          <div class="card">
            <div class="card-body">
              <div class={loading ? 'dimmer active' : 'dimmer'}>
                <div class="loader" />
                <div class="dimmer-content">
                  <p>
                    <Text id="dashboard.tabletMode.description" />
                  </p>
                  <div class="alert alert-info">
                    <MarkupText id="dashboard.tabletMode.currentBrowserOnly" />
                  </div>
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
                    <Text id="dashboard.tabletMode.howToDisable" />
                  </p>
                  <p>
                    <MarkupText id="dashboard.tabletMode.fullScreenForce" />
                  </p>
                  {selectedHouse && (
                    <div className="form-group">
                      <p>
                        <Text id="dashboard.tabletMode.tabletModeForce" />
                      </p>
                      <div className="input-group">
                        <input
                          type="text"
                          readOnly
                          className="form-control"
                          value={this.tabletModeUrl()}
                          onFocus={e => e.target.select()}
                        />
                        <button class="btn btn-secondary" type="button" onClick={this.copyTabletModeUrl}>
                          <Text id={copyUrlLabel} />
                        </button>
                      </div>
                    </div>
                  )}
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
      </div>
    );
  }
}

export default connect('httpClient,user,session', mainActions)(SetTabletMode);
