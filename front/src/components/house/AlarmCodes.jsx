import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../utils/consts';

const dateDisplayOptions = { year: 'numeric', month: 'long', day: 'numeric' };

// A code is never readable, so the table shows who holds one, not what it is.
const formatDate = (date, language) => new Date(date).toLocaleDateString(language, dateDisplayOptions);

class AlarmCodes extends Component {
  getCodes = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const codes = await this.props.httpClient.get('/api/v1/alarm_code');
      this.setState({ codes, status: RequestStatus.Success });
    } catch (e) {
      this.setState({ status: RequestStatus.Error });
    }
  };

  updateNewCodeName = e => this.setState({ newCodeName: e.target.value, error: null });

  updateNewCode = e => this.setState({ newCode: e.target.value, error: null });

  updateNewValidUntil = e => this.setState({ newValidUntil: e.target.value, error: null });

  toggleNewCodeVisibility = () => this.setState(prevState => ({ showNewCode: !prevState.showNewCode }));

  createCode = async () => {
    const { newCodeName, newCode, newValidUntil } = this.state;
    try {
      await this.props.httpClient.post('/api/v1/alarm_code', {
        name: newCodeName,
        code: newCode,
        valid_until: newValidUntil === '' ? null : new Date(newValidUntil)
      });
      this.setState({ newCodeName: '', newCode: '', newValidUntil: '', error: null });
      await this.getCodes();
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 409) {
        this.setState({ error: 'alreadyUsed' });
      } else if (status === 400) {
        this.setState({ error: 'invalid' });
      } else {
        this.setState({ error: 'generic' });
      }
    }
  };

  revokeCode = async id => {
    try {
      await this.props.httpClient.delete(`/api/v1/alarm_code/${id}`);
      await this.getCodes();
    } catch (e) {
      this.setState({ error: 'generic' });
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      codes: [],
      newCodeName: '',
      newCode: '',
      newValidUntil: '',
      showNewCode: false,
      error: null,
      status: null
    };
  }

  componentDidMount() {
    this.getCodes();
  }

  render({ user }, { codes, newCodeName, newCode, newValidUntil, showNewCode, error, status }) {
    const language = get(user, 'language') || 'en';
    return (
      <div class="form-group">
        <label class="form-label">
          <Text id="housesSettings.alarmCodes.label" />
        </label>
        <p class="text-muted small">
          <Text id="housesSettings.alarmCodes.description" />
        </p>
        {error && (
          <div class="alert alert-danger">
            <Text id={`housesSettings.alarmCodes.error.${error}`} />
          </div>
        )}
        {status === RequestStatus.Error && (
          <div class="alert alert-danger">
            <Text id="housesSettings.alarmCodes.error.generic" />
          </div>
        )}
        <div class="table-responsive">
          <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
            <thead>
              <tr>
                <th>
                  <Text id="housesSettings.alarmCodes.holder" />
                </th>
                <th>
                  <Text id="housesSettings.alarmCodes.validUntil" />
                </th>
                <th class="w-1">
                  <Text id="housesSettings.alarmCodes.revoke" />
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 && (
                <tr>
                  <td colSpan="3" class="text-muted">
                    <Text id="housesSettings.alarmCodes.noCodes" />
                  </td>
                </tr>
              )}
              {codes.map(code => {
                const expired = code.valid_until !== null && new Date(code.valid_until) < new Date();
                return (
                  <tr key={code.id}>
                    <td>
                      <div>{code.user ? `${code.user.firstname} ${code.user.lastname}` : code.name}</div>
                      {!code.user && (
                        <div class="small text-muted">
                          <Text id="housesSettings.alarmCodes.guest" />
                        </div>
                      )}
                    </td>
                    <td>
                      {code.valid_until === null ? (
                        <Text id="housesSettings.alarmCodes.noExpiry" />
                      ) : (
                        <span class={cx({ 'text-danger': expired })}>
                          {formatDate(code.valid_until, language)}
                          {expired && (
                            <span class="ml-1">
                              <Text id="housesSettings.alarmCodes.expired" />
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      <i style={{ cursor: 'pointer' }} onClick={() => this.revokeCode(code.id)} class="fe fe-trash-2" />
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td>
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      value={newCodeName}
                      onInput={this.updateNewCodeName}
                      placeholder={<Text id="housesSettings.alarmCodes.namePlaceholder" />}
                    />
                  </Localizer>
                  <div class="input-icon mt-2">
                    <Localizer>
                      <input
                        type={showNewCode ? 'text' : 'password'}
                        class="form-control"
                        value={newCode}
                        onInput={this.updateNewCode}
                        placeholder={<Text id="housesSettings.alarmCodes.codePlaceholder" />}
                      />
                    </Localizer>
                    <Localizer>
                      <button
                        type="button"
                        class="input-icon-addon cursor-pointer"
                        onClick={this.toggleNewCodeVisibility}
                        aria-pressed={showNewCode}
                        aria-label={<Text id="housesSettings.alarmCodes.toggleVisibility" />}
                      >
                        <i class={cx('fe', { 'fe-eye': !showNewCode, 'fe-eye-off': showNewCode })} />
                      </button>
                    </Localizer>
                  </div>
                </td>
                <td>
                  <input type="date" class="form-control" value={newValidUntil} onInput={this.updateNewValidUntil} />
                  <div class="small text-muted mt-1">
                    <Text id="housesSettings.alarmCodes.validUntilHelp" />
                  </div>
                </td>
                <td>
                  <button
                    class="btn btn-primary"
                    onClick={this.createCode}
                    disabled={newCodeName === '' || newCode === ''}
                  >
                    <Text id="housesSettings.alarmCodes.addButton" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(AlarmCodes);
