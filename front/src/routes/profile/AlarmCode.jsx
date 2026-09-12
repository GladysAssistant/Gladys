import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

// The code is never readable, not even by its holder: all the server tells us is whether one is
// set, so this card either offers to create one or to replace it.
class AlarmCode extends Component {
  getStatus = async () => {
    const generation = this.mutations;
    try {
      const { defined } = await this.props.httpClient.get('/api/v1/me/alarm_code');
      // A save or a delete may have landed while this was in flight: what it wrote is fresher
      if (generation === this.mutations) {
        this.setState({ defined });
      }
    } catch (e) {
      // and a status request that failed after a write must not report that write as failed
      if (generation === this.mutations) {
        this.setState({ error: 'generic' });
      }
    }
  };

  updateCode = e => this.setState({ code: e.target.value, error: null, saved: false });

  toggleCodeVisibility = () => this.setState(prevState => ({ showCode: !prevState.showCode }));

  saveCode = async () => {
    this.mutations += 1;
    this.setState({ loading: true, error: null, saved: false });
    try {
      await this.props.httpClient.patch('/api/v1/me/alarm_code', { code: this.state.code });
      this.setState({ loading: false, code: '', saved: true, defined: true });
    } catch (e) {
      const status = get(e, 'response.status');
      let error = 'generic';
      if (status === 400) {
        error = 'invalid';
      } else if (status === 409) {
        error = 'alreadyUsed';
      } else if (status === 429) {
        error = 'tooManyWrites';
      }
      this.setState({ loading: false, error });
    }
  };

  deleteCode = async () => {
    this.mutations += 1;
    this.setState({ loading: true, error: null, saved: false });
    try {
      await this.props.httpClient.delete('/api/v1/me/alarm_code');
      this.setState({ loading: false, defined: false, code: '' });
    } catch (e) {
      this.setState({ loading: false, error: 'generic' });
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    // Counts the writes this card has made, so a status response started before one of them cannot
    // land after it and report the previous state.
    this.mutations = 0;
    this.state = {
      code: '',
      defined: false,
      loading: false,
      saved: false,
      showCode: false,
      error: null
    };
  }

  componentDidMount() {
    this.getStatus();
  }

  render(props, { code, defined, loading, saved, showCode, error }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="profile.alarmCode.title" />
          </h3>
        </div>
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              <p>
                <Text id="profile.alarmCode.description" />
              </p>
              {error && (
                <div class="alert alert-danger">
                  <Text id={`profile.alarmCode.error.${error}`} />
                </div>
              )}
              {saved && (
                <div class="alert alert-success">
                  <Text id="profile.alarmCode.saved" />
                </div>
              )}
              <div class="form-group">
                <label class="form-label">
                  <Text id={defined ? 'profile.alarmCode.replaceLabel' : 'profile.alarmCode.label'} />
                </label>
                <div class="input-icon">
                  <Localizer>
                    <input
                      type={showCode ? 'text' : 'password'}
                      class={cx('form-control', { 'is-invalid': error === 'invalid' })}
                      autocomplete="new-password"
                      value={code}
                      onInput={this.updateCode}
                      placeholder={<Text id="profile.alarmCode.placeholder" />}
                    />
                  </Localizer>
                  <Localizer>
                    <button
                      type="button"
                      class="input-icon-addon cursor-pointer"
                      onClick={this.toggleCodeVisibility}
                      aria-pressed={showCode}
                      aria-label={<Text id="profile.alarmCode.toggleVisibility" />}
                    >
                      <i class={cx('fe', { 'fe-eye': !showCode, 'fe-eye-off': showCode })} />
                    </button>
                  </Localizer>
                </div>
              </div>
              <div class="form-group">
                <button onClick={this.saveCode} class="btn btn-success" disabled={code === ''}>
                  <Text id="profile.alarmCode.saveButton" />
                </button>
                {defined && (
                  <button onClick={this.deleteCode} class="btn btn-outline-danger ml-2">
                    <Text id="profile.alarmCode.deleteButton" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(AlarmCode);
