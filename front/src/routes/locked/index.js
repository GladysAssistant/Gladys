import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { route } from 'preact-router';
import style from './style.css';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';

const BUTTON_ARRAY = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

const KeyPadComponent = ({ currentCode, typeLetter, clearPreviousLetter }) => (
  <div>
    <div class="input-group mb-3">
      <Localizer>
        <input
          type="password"
          class="form-control"
          value={currentCode}
          placeholder={<Text id="locked.codePlaceholder" />}
        />
      </Localizer>
      <div class="input-group-append">
        <button class="btn btn-outline-secondary" onClick={clearPreviousLetter}>
          <i class="fe fe-delete" />
        </button>
      </div>
    </div>
    {BUTTON_ARRAY.map(row => (
      <div class="row">
        {row.map(cell => (
          <div class="col mt-4">
            <button onClick={e => typeLetter(e, cell)} class={cx('btn btn-secondary btn-block')}>
              {cell}
            </button>
          </div>
        ))}
      </div>
    ))}
  </div>
);

class Locked extends Component {
  clearPreviousLetter = e => {
    e.preventDefault();
    if (this.state.currentCode.length > 0) {
      this.setState(prevState => {
        return { ...prevState, currentCode: prevState.currentCode.slice(0, -1) };
      });
    }
  };
  typeLetter = (e, letter) => {
    e.preventDefault();
    this.setState(prevState => {
      return { ...prevState, currentCode: prevState.currentCode + letter };
    });
  };
  init = async () => {
    try {
      // We make a dumb request just to verify if our token is valid
      const result = await this.props.httpClient.post('/api/v1/access_token', {
        refresh_token: this.props.session.getRefreshToken(),
        scope: ['dashboard:write']
      });
      console.log(result);
      // if this resolves, we redirect to dashboard
      route('/dashboard');
    } catch (e) {
      console.log(e);
      this.props.httpClient.setApiScopes(['alarm:write']);
      this.props.httpClient.refreshAccessToken();
    }
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      currentCode: ''
    };
  }
  disarmed = async event => {
    try {
      const houseSelector = this.props.session.getTabletModeCurrentHouseSelector();
      // If the same house was disarmed, redirect to dashboard
      if (event.house === houseSelector) {
        this.props.httpClient.resetApiScopes();
        await this.props.httpClient.refreshAccessToken();
        route('/dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };
  validateCode = async e => {
    e.preventDefault();
    try {
      const houseSelector = this.props.session.getTabletModeCurrentHouseSelector();
      await this.props.httpClient.post(`/api/v1/house/${houseSelector}/disarm_with_code`, {
        code: this.state.currentCode
      });
    } catch (e) {
      console.error(e);
    }
  };
  componentDidMount() {
    this.init();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED, this.disarmed);
  }
  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED, this.disarmed);
  }
  render({}, { currentCode }) {
    return (
      <div class={cx('container', style.lockedContainer)}>
        <div class="row">
          <div class="col col-login mx-auto">
            <div class="text-center mb-6">
              <h2>
                <Localizer>
                  <img
                    src="/assets/icons/favicon-96x96.png"
                    class="header-brand-img"
                    alt={<Text id="global.logoAlt" />}
                  />
                </Localizer>
                <Text id="login.title" />
              </h2>
            </div>

            <form class="card">
              <div class="card-body p-6">
                <div class={cx('card-title mb-2', style.cardTitle)}>
                  <Text id="locked.cardTitle" />
                </div>
                <p>
                  <Text id="locked.description" />
                </p>
                <div>
                  <KeyPadComponent
                    currentCode={currentCode}
                    typeLetter={this.typeLetter}
                    clearPreviousLetter={this.clearPreviousLetter}
                  />
                  <button class="mt-4 btn btn-block btn-outline-success" onClick={this.validateCode}>
                    Valider
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(Locked);
