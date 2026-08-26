import { Text, MarkupText, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import { USER_ROLE } from '../../../../../../server/utils/constants';
import cx from 'classnames';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import DeprecationWarning from '../../../../components/integration/DeprecationWarning';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const TelegramPage = ({ children, ...props }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.telegram.title" />}
    tabs={
      <DeviceConfigurationLink
        user={props.user}
        configurationKey="integrations"
        documentKey="telegram"
        linkClass="hz-tab-link"
      >
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.telegram.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <DeprecationWarning />
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.telegram.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.loading
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {props.user && props.user.role === USER_ROLE.ADMIN && (
              <p>
                <MarkupText id="integration.telegram.introduction" />
              </p>
            )}
            {props.telegramSaveApiKeyStatus === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.telegram.configurationError" />
              </div>
            )}
            {props.user && props.user.role === USER_ROLE.ADMIN && (
              <form onSubmit={props.saveTelegramApiKey}>
                <div class="form-group">
                  <div class="form-label">
                    <Text id="integration.telegram.apiKey" />
                  </div>
                  <div class="input-group">
                    <Localizer>
                      <input
                        type="text"
                        class="form-control"
                        placeholder={<Text id="integration.telegram.apiKey" />}
                        onInput={props.updateTelegramApiKey}
                        value={props.telegramApiKey}
                      />
                    </Localizer>
                    <span class="input-group-append">
                      <button type="submit" class="btn btn-primary">
                        <Text id="integration.telegram.saveButton" />
                      </button>
                    </span>
                  </div>
                </div>
              </form>
            )}
            {props.telegramCustomLink && (
              <div>
                <p>
                  <MarkupText
                    id="integration.telegram.link"
                    fields={{
                      link: props.telegramCustomLink
                    }}
                  />
                </p>
                <p>
                  <Text id="integration.telegram.note" />
                </p>
              </div>
            )}
            {props.telegramDisableStatus === RequestStatus.Success && (
              <div class="alert alert-success">
                <Text id="integration.telegram.disable.success" />
              </div>
            )}
            {props.user && props.user.role === USER_ROLE.ADMIN && props.telegramApiKey && (
              <div>
                <hr />
                <h4>
                  <Text id="integration.telegram.disable.title" />
                </h4>
                {props.telegramDisableStatus === RequestStatus.Error && (
                  <div class="alert alert-danger">
                    <Text id="integration.telegram.disable.error" />
                  </div>
                )}
                <p>
                  <Text id="integration.telegram.disable.description" />
                </p>
                {!props.telegramDisableConfirmation && (
                  <button class="btn btn-danger" onClick={props.showTelegramDisableConfirmation}>
                    <Text id="integration.telegram.disable.button" />
                  </button>
                )}
                {props.telegramDisableConfirmation && (
                  <div class="alert alert-danger">
                    <p>
                      <Text id="integration.telegram.disable.confirmation" />
                    </p>
                    <button class="btn btn-danger mr-2" onClick={props.disableTelegram}>
                      <Text id="integration.telegram.disable.confirmButton" />
                    </button>
                    <button class="btn btn-secondary" onClick={props.hideTelegramDisableConfirmation}>
                      <Text id="integration.telegram.disable.cancelButton" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default TelegramPage;
