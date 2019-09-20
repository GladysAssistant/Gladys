import { Text } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';

const SignupLayout = ({ children, ...props }) => (
  <div class="page">
    <div
      class="page-single"
      style={{
        marginTop: '10px'
      }}
    >
      <div class="container">
        <div class="row">
          <div
            class="col mx-auto"
            style={{
              maxWidth: '60rem'
            }}
          >
            <div class="text-center mb-6">
              <h2>
                <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt="Gladys logo" />
                <Text id="login.title" />
              </h2>
            </div>
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">
                  <Text id="gatewayLinkUser.title" />
                </h2>
              </div>
              <div class="card-body">
                <div
                  class={cx('dimmer', {
                    active: props.loading
                  })}
                >
                  <div class="loader" />
                  <div class="dimmer-content">
                    {props.usersGetStatus === RequestStatus.GatewayNoInstanceFound && (
                      <div class="alert alert-danger">
                        <Text id="gatewayLinkUser.noInstanceFound" />
                      </div>
                    )}
                    {props.error && (
                      <div class="alert alert-danger">
                        <Text id="gatewayLinkUser.error" />
                      </div>
                    )}
                    {props.usersGetStatus === RequestStatus.Error && (
                      <div class="alert alert-danger">
                        <Text id="httpErrors.unknownError" />
                      </div>
                    )}
                    <div class="form-group">
                      <label>
                        <Text id="gatewayLinkUser.label" />
                      </label>
                      <select class="form-control" onChange={props.selectUser}>
                        <option>--------</option>
                        {props.users && props.users.map(user => <option value={user.id}>{user.firstname}</option>)}
                      </select>
                    </div>
                    <div class="form-group">
                      <button
                        onClick={props.saveUser}
                        disabled={props.usersGetStatus !== RequestStatus.Success}
                        class="btn btn-success"
                      >
                        <Text id="gatewayLinkUser.saveButton" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SignupLayout;
