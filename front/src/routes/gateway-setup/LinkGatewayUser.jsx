import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';
import AuthLayout from '../../components/auth/AuthLayout';

const LinkGatewayUser = ({ children, ...props }) => (
  <AuthLayout size="medium">
    <div class="card">
      <div class="card-header">
        <h2 class="page-title">
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
              <div>
                <h4>
                  <Text id="gatewayLinkUser.noInstanceFoundTitle" />
                </h4>
                <p>
                  <Text id="gatewayLinkUser.noInstanceFoundIntro" />
                </p>
                <ol class="pl-4">
                  <li class="mb-2">
                    <MarkupText id="gatewayLinkUser.noInstanceFoundStepOpenLocalInstance" />
                  </li>
                  <li class="mb-2">
                    <MarkupText id="gatewayLinkUser.noInstanceFoundStepGoToSettings" />
                  </li>
                  <li class="mb-2">
                    <MarkupText id="gatewayLinkUser.noInstanceFoundStepLogin" />
                  </li>
                  <li class="mb-2">
                    <MarkupText id="gatewayLinkUser.noInstanceFoundStepAcceptUser" />
                  </li>
                  <li class="mb-2">
                    <Text id="gatewayLinkUser.noInstanceFoundStepComeBack" />
                  </li>
                </ol>
                <div class="form-group">
                  <button onClick={props.retry} class="btn btn-primary">
                    <i class="fe fe-refresh-cw" /> <Text id="gatewayLinkUser.noInstanceFoundRetryButton" />
                  </button>
                </div>
                <p>
                  <MarkupText id="gatewayLinkUser.noInstanceFoundTutorialLink" />
                </p>
                <p class="text-muted small mb-0">
                  <MarkupText id="gatewayLinkUser.noInstanceFoundNote" />
                </p>
              </div>
            )}
            {props.error && (
              <div class="alert alert-danger">
                <Text id="gatewayLinkUser.error" />
              </div>
            )}
            {props.errorNotAcceptedLocally && (
              <div class="alert alert-danger">
                <Text id="gatewayLinkUser.errorNotAcceptedLocally" />
              </div>
            )}
            {props.usersGetStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="httpErrors.unknownError" />
              </div>
            )}
            {props.usersGetStatus !== RequestStatus.GatewayNoInstanceFound && (
              <>
                <p>
                  <Text id="gatewayLinkUser.description" />
                </p>
                <div class="form-group">
                  <label>
                    <Text id="gatewayLinkUser.label" />
                  </label>
                  <select class="form-control" onChange={props.selectUser}>
                    <option>
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.users &&
                      props.users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstname}
                        </option>
                      ))}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    <div class="text-center mt-3 small">
      <a href="#" onClick={props.openStripeBilling}>
        <Text id="gatewayLinkUser.manageBillingLink" />
      </a>
      <span class="mx-2">·</span>
      <a href="#" onClick={props.logout}>
        <Text id="gatewayLinkUser.logoutButton" />
      </a>
    </div>
  </AuthLayout>
);

export default LinkGatewayUser;
