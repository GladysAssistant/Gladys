import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';
import AuthLayout from '../../components/auth/AuthLayout';
import style from './style.css';

const NOT_ACCEPTED_LOCALLY_TEXTS = {
  // the user was authorized with other keys: they reset their Gladys Plus password
  KEYS_CHANGED: { title: 'keysChangedTitle', intro: 'keysChangedIntro' },
  // never authorized, or revoked by an admin of the instance
  NOT_ACCEPTED: { title: 'notAcceptedTitle', intro: 'notAcceptedIntro' },
  // instances older than the reason sent with the error: both cases are possible
  UNKNOWN: { title: 'notAcceptedTitle', intro: 'notAcceptedUnknownReasonIntro' }
};

const UserNotAcceptedLocally = props => {
  const texts = NOT_ACCEPTED_LOCALLY_TEXTS[props.notAcceptedLocallyReason] || NOT_ACCEPTED_LOCALLY_TEXTS.UNKNOWN;
  return (
    <div>
      <h4>
        <Text id={`gatewayLinkUser.${texts.title}`} />
      </h4>
      <p>
        <Text id={`gatewayLinkUser.${texts.intro}`} />
      </p>
      {!props.isGatewayAdmin && (
        <div class="alert alert-info">
          <Text id="gatewayLinkUser.notAcceptedAskAdmin" />
        </div>
      )}
      <ol class="pl-4">
        <li class="mb-2">
          <MarkupText id="gatewayLinkUser.noInstanceFoundStepOpenLocalInstance" />
        </li>
        <li class="mb-2">
          <MarkupText id="gatewayLinkUser.noInstanceFoundStepGoToSettings" />
        </li>
        <li class="mb-2">
          <MarkupText id="gatewayLinkUser.notAcceptedStepAcceptUser" />
        </li>
        <li class="mb-2">
          <Text id="gatewayLinkUser.noInstanceFoundStepComeBack" />
        </li>
      </ol>
      {props.keysFingerprints && (
        <div class="mb-4 small">
          <div class="text-muted mb-1">
            <Text id="gatewayLinkUser.notAcceptedFingerprintsLabel" />
          </div>
          <div>
            <Text id="gatewayLinkUser.rsaKeyFingerprint" />{' '}
            <code class={style.fingerprint}>{props.keysFingerprints.rsaPublicKey}</code>
          </div>
          <div>
            <Text id="gatewayLinkUser.ecdsaKeyFingerprint" />{' '}
            <code class={style.fingerprint}>{props.keysFingerprints.ecdsaPublicKey}</code>
          </div>
        </div>
      )}
      {props.stillNotAcceptedLocally && (
        <div class="alert alert-warning">
          <Text id="gatewayLinkUser.stillNotAccepted" />
        </div>
      )}
      <div class="form-group">
        <button onClick={props.retry} class="btn btn-primary">
          <i class="fe fe-refresh-cw" /> <Text id="gatewayLinkUser.notAcceptedRetryButton" />
        </button>
      </div>
      <p class="mb-0">
        <MarkupText id="gatewayLinkUser.noInstanceFoundTutorialLink" />
      </p>
    </div>
  );
};

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
            {props.errorNotAcceptedLocally && props.usersGetStatus !== RequestStatus.GatewayNoInstanceFound && (
              <UserNotAcceptedLocally {...props} />
            )}
            {props.usersGetStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="httpErrors.unknownError" />
              </div>
            )}
            {props.usersGetStatus !== RequestStatus.GatewayNoInstanceFound && !props.errorNotAcceptedLocally && (
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
