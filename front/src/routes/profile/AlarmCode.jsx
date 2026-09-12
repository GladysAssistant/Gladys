import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

// The code is never readable, not even by its holder: all the server tells us is whether one is
// set, so this card either offers to create one or to replace it.
class AlarmCode extends Component {
  getStatus = async () => {
    try {
      const { defined } = await this.props.httpClient.get('/api/v1/me/alarm_code');
      this.setState({ defined });
    } catch (e) {
      this.setState({ error: 'generic' });
    }
  };

  updateCode = e => this.setState({ code: e.target.value, error: null, saved: false });

  saveCode = async () => {
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
    this.state = {
      code: '',
      defined: false,
      loading: false,
      saved: false,
      error: null
    };
  }

  componentDidMount() {
    this.getStatus();
  }

  render(props, { code, defined, loading, saved, error }) {
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
                <Localizer>
                  <input
                    type="password"
                    class={cx('form-control', { 'is-invalid': error === 'invalid' })}
                    value={code}
                    onInput={this.updateCode}
                    placeholder={<Text id="profile.alarmCode.placeholder" />}
                  />
                </Localizer>
                <div class="invalid-feedback">
                  <Text id="profile.alarmCode.error.invalid" />
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
