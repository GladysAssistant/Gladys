import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import {
  FocusPage,
  MobileNavBar,
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileRowButton,
  MobileNotice,
  MobileField,
  MobilePasswordField,
  MobileBottomBar,
  MobileToast,
  BigButton,
  DirtyLabel,
  ConfirmSheet,
  SystemBackGuard,
  fieldClass,
  kitStyle
} from '../../../../../../components/mobile';
import BottomSheet from '../../../../../../components/sheet/BottomSheet';
import withIntlAsProp from '../../../../../../utils/withIntlAsProp';
import { RequestStatus } from '../../../../../../utils/consts';
import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard';
const MQTT_T = 'integration.zigbee2mqtt.setup.modes.local.externalMqtt';
const DEFAULT_MQTT_URL = 'mqtt://localhost:1884';
const DEFAULT_MQTT_USERNAME = 'gladys';

const ComponentRow = ({ name, ok, okText, koText }) => (
  <MobileRow
    title={<Text id={`${T}.advanced.components.${name}`} />}
    trailing={
      <MobilePill tone={ok ? 'success' : 'danger'}>
        <Text id={`${T}.advanced.components.${ok ? okText : koText}`} />
      </MobilePill>
    }
    dataCy={`z2m-dashboard-component-${name}`}
  />
);

const BROKER_FIELDS = [
  { field: 'mqttUrl', label: 'integration.mqtt.setup.urlLabel', type: 'url', placeholder: 'mqtt://192.168.1.10:1883' },
  { field: 'mqttUsername', label: 'integration.mqtt.setup.userLabel', type: 'text', autocomplete: 'username' },
  {
    field: 'z2mFrontendUrl',
    label: 'integration.zigbee2mqtt.setup.z2mFrontendUrlLabel',
    type: 'url',
    placeholder: 'http://192.168.1.10:8080'
  }
];

// The access to the MQTT broker of Gladys for other applications: each value copied in one tap, the password revealed
// for 5 s
class MqttAccess extends Component {
  copy = async value => {
    await navigator.clipboard.writeText(value);
    this.setState(prevState => ({ copiedKey: (prevState.copiedKey || 0) + 1 }));
  };

  toggleReveal = () => {
    clearTimeout(this.revealTimer);
    const revealed = !this.state.revealed;
    this.setState({ revealed });
    if (revealed) {
      this.revealTimer = setTimeout(() => this.setState({ revealed: false }), 5000);
    }
  };

  closeToast = () => this.setState({ copiedKey: null });

  componentWillUnmount() {
    clearTimeout(this.revealTimer);
  }

  render({ configuration, mqttRunning, dictionary }, { revealed, copiedKey }) {
    if (!configuration.mqttPassword) {
      return (
        <p class={kitStyle.footnote} data-cy="z2m-mqtt-external-credentials-pending">
          <Text id={`${MQTT_T}.credentialsPending`} />
        </p>
      );
    }
    const canCopy = typeof window !== 'undefined' && window.isSecureContext && Boolean(navigator.clipboard);
    const rows = [
      { key: 'url', label: 'integration.mqtt.setup.urlLabel', value: configuration.mqttUrl || DEFAULT_MQTT_URL },
      {
        key: 'username',
        label: 'integration.mqtt.setup.userLabel',
        value: configuration.mqttUsername || DEFAULT_MQTT_USERNAME
      },
      {
        key: 'password',
        label: 'integration.mqtt.setup.passwordLabel',
        value: configuration.mqttPassword,
        secret: true
      }
    ];
    return (
      <div data-cy="z2m-mqtt-external-credentials">
        <p class={kitStyle.footnote}>
          <Text id={`${MQTT_T}.description`} />
        </p>
        {!mqttRunning && (
          <MobileNotice tone="warning" icon="alert-triangle">
            <Text id={`${MQTT_T}.brokerNotRunning`} />
          </MobileNotice>
        )}
        <MobileGroup>
          {rows.map(row => (
            <MobileRow
              key={row.key}
              title={<Text id={row.label} />}
              subtitle={
                <code class={style.mobileCode} data-cy={`z2m-dashboard-mqtt-${row.key}`}>
                  {row.secret && !revealed ? '••••••••••••' : row.value}
                </code>
              }
              trailing={
                <span class={style.mobileRowButtons}>
                  {row.secret && (
                    <MobileRowButton
                      icon={revealed ? 'eye-off' : 'eye'}
                      label={get(dictionary, 'mobileKit.togglePassword')}
                      aria-pressed={revealed ? 'true' : 'false'}
                      onClick={this.toggleReveal}
                      data-cy="z2m-dashboard-mqtt-reveal"
                    />
                  )}
                  {canCopy && (
                    <MobileRowButton
                      icon="copy"
                      label={get(dictionary, `${T}.mobile.copy`)}
                      onClick={() => this.copy(row.value)}
                      data-cy={`z2m-dashboard-mqtt-copy-${row.key}`}
                    />
                  )}
                </span>
              }
            />
          ))}
        </MobileGroup>
        <MobileToast
          message={copiedKey ? get(dictionary, `${MQTT_T}.copied`) : null}
          toastKey={copiedKey}
          onClose={this.closeToast}
          dataCy="z2m-dashboard-mqtt-copied"
        />
      </div>
    );
  }
}

/**
 * @description The advanced settings on a phone (docs/specs/zigbee2mqtt-installation.md, N.5): a focus page, the port
 * of the interface or the broker of an external Zigbee2mqtt saved from the bottom bar, the state of each component, the
 * MQTT access, and the reset confirmed in a sheet. The state and the handlers are those of AdvancedSettings.
 */
const AdvancedSettingsMobile = ({ view, actions, form, intl }) => {
  const { configuration, status, z2mUrl, saving, resetZigbee2mqttStatus } = view;
  const dictionary = get(intl, 'dictionary');
  const { external, dirty } = form;
  return (
    <FocusPage>
      <div class={kitStyle.page} data-cy="z2m-dashboard-advanced">
        <MobileNavBar
          title={<Text id={`${T}.advanced.title`} />}
          onBack={form.back}
          backLabel={<Text id="integration.zigbee2mqtt.setupTab" />}
        />
        <div class={cx(kitStyle.content, { [kitStyle.contentWithBottomBar]: dirty || form.saveError })}>
          {!external && (
            <div data-cy="z2m-dashboard-port">
              <MobileSectionHeader title={<Text id={`${T}.advanced.interface.title`} />} />
              <MobileField
                label={<Text id={`${T}.advanced.interface.port`} />}
                help={<Text id={`${T}.advanced.interface.help`} />}
                htmlFor="z2mDashboardPortMobile"
              >
                <input
                  id="z2mDashboardPortMobile"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  autocomplete="off"
                  class={cx(fieldClass.input, { [fieldClass.invalid]: !form.validPort })}
                  value={form.port}
                  onInput={form.updatePort}
                  disabled={saving || view.installing || view.serviceNotStarted}
                  data-cy="z2m-dashboard-port-input"
                />
              </MobileField>
              {z2mUrl && (
                <MobileGroup>
                  <a
                    href={z2mUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class={kitStyle.row}
                    data-cy="z2m-dashboard-open-interface"
                  >
                    <span class={cx(kitStyle.rowTile, kitStyle['rowTile-neutral'])} aria-hidden="true">
                      <i class="fe fe-monitor" />
                    </span>
                    <span class={kitStyle.rowText}>
                      <span class={kitStyle.rowTitle}>
                        <Text id={`${T}.advanced.interface.open`} />
                      </span>
                    </span>
                    <i class={cx('fe', 'fe-external-link', kitStyle.rowChevron)} aria-hidden="true" />
                  </a>
                </MobileGroup>
              )}
            </div>
          )}

          {external && (
            <div data-cy="z2m-dashboard-broker">
              <MobileSectionHeader title={<Text id={`${T}.advanced.broker.title`} />} />
              {BROKER_FIELDS.slice(0, 2).map(({ field, label, type, placeholder, autocomplete }) => (
                <MobileField key={field} label={<Text id={label} />} htmlFor={`z2mDashboard-${field}`}>
                  <input
                    id={`z2mDashboard-${field}`}
                    type={type}
                    inputmode={type === 'url' ? 'url' : undefined}
                    autocapitalize="off"
                    autocomplete={autocomplete || 'off'}
                    class={fieldClass.input}
                    placeholder={placeholder}
                    value={form.broker[field] || ''}
                    onInput={e => form.updateBroker(field, e.target.value)}
                    disabled={saving || view.installing || view.serviceNotStarted}
                    data-cy={`z2m-dashboard-broker-${field}`}
                  />
                </MobileField>
              ))}
              <MobilePasswordField
                id="z2mDashboard-mqttPassword"
                label={<Text id="integration.mqtt.setup.passwordLabel" />}
                value={form.broker.mqttPassword}
                onInput={e => form.updateBroker('mqttPassword', e.target.value)}
                autocomplete="new-password"
                disabled={saving || view.installing || view.serviceNotStarted}
                dataCy="z2m-dashboard-broker-mqttPassword"
              />
              {BROKER_FIELDS.slice(2).map(({ field, label, type, placeholder }) => (
                <MobileField key={field} label={<Text id={label} />} htmlFor={`z2mDashboard-${field}`}>
                  <input
                    id={`z2mDashboard-${field}`}
                    type={type}
                    inputmode="url"
                    autocapitalize="off"
                    autocomplete="off"
                    class={fieldClass.input}
                    placeholder={placeholder}
                    value={form.broker[field] || ''}
                    onInput={e => form.updateBroker(field, e.target.value)}
                    disabled={saving || view.installing || view.serviceNotStarted}
                    data-cy={`z2m-dashboard-broker-${field}`}
                  />
                </MobileField>
              ))}
            </div>
          )}

          <MobileSectionHeader title={<Text id={`${T}.advanced.components.title`} />} />
          <MobileGroup data-cy="z2m-dashboard-components">
            <ComponentRow name="gladys" ok={status.gladysConnected} okText="connected" koText="disconnected" />
            {!external && <ComponentRow name="broker" ok={status.mqttRunning} okText="running" koText="stopped" />}
            <ComponentRow name="zigbee2mqtt" ok={status.zigbee2mqttConnected} okText="answers" koText="silent" />
          </MobileGroup>

          {!external && (
            <div data-cy="z2m-dashboard-mqtt-access">
              <MobileSectionHeader title={<Text id={`${MQTT_T}.title`} />} />
              <MqttAccess configuration={configuration} mqttRunning={status.mqttRunning} dictionary={dictionary} />
            </div>
          )}

          <div data-cy="z2m-dashboard-reset">
            <MobileSectionHeader title={<Text id={`${T}.advanced.reset.title`} />} />
            {resetZigbee2mqttStatus === RequestStatus.Error && (
              <MobileNotice tone="danger" icon="alert-triangle" data-cy="z2m-reset-error">
                <Text id="integration.zigbee2mqtt.setup.reset.error" />
              </MobileNotice>
            )}
            {resetZigbee2mqttStatus === RequestStatus.ConflictError && (
              <MobileNotice tone="warning" icon="alert-circle" data-cy="z2m-reset-conflict">
                <Text id="integration.zigbee2mqtt.setup.installation.busy" />
              </MobileNotice>
            )}
            <MobileGroup>
              <MobileRow
                icon="trash-2"
                iconTone="danger"
                tone="danger"
                title={<Text id="integration.zigbee2mqtt.setup.reset.button" />}
                subtitle={<Text id={external ? `${T}.advanced.reset.textExternal` : `${T}.advanced.reset.text`} />}
                onClick={form.showConfirmReset}
                disabled={view.installing}
                dataCy="z2m-reset-button"
              />
            </MobileGroup>
          </div>
        </div>

        {(dirty || form.saveError) && (
          <MobileBottomBar error={form.saveError} onCloseError={form.closeSaveError} dataCy="z2m-dashboard-bottom-bar">
            {dirty && <DirtyLabel />}
            {dirty && (
              <BigButton
                variant="primary"
                fit
                onClick={form.save}
                disabled={!form.canSave}
                loading={saving}
                data-cy="z2m-dashboard-save"
              >
                <Text id="global.save" />
              </BigButton>
            )}
          </MobileBottomBar>
        )}

        <SystemBackGuard dirty={dirty} onBack={form.openLeave} />

        <ConfirmSheet
          open={form.confirmReset}
          title={get(dictionary, `${T}.advanced.reset.title`)}
          text={
            <Text
              id={
                external ? `${T}.advanced.reset.confirmExternal` : 'integration.zigbee2mqtt.setup.reset.confirmMessage'
              }
            />
          }
          confirmLabel={<Text id="integration.zigbee2mqtt.setup.reset.confirmButton" />}
          destructive
          loading={resetZigbee2mqttStatus === RequestStatus.Getting}
          onConfirm={actions.reset}
          onCancel={form.cancelReset}
          dataCy="z2m-dashboard-confirm-reset"
        />

        <BottomSheet
          open={form.leaveOpen}
          title={get(dictionary, 'mobileKit.leaveTitle')}
          onClose={form.closeLeave}
          dataCy="z2m-dashboard-leave-confirm"
        >
          <p class={kitStyle.sheetText}>
            <Text id="mobileKit.leaveText" />
          </p>
          <div class={kitStyle.buttons}>
            <BigButton
              variant="primary"
              onClick={form.saveAndLeave}
              disabled={!form.canSave}
              data-cy="z2m-dashboard-leave-save"
            >
              <Text id="mobileKit.saveAndLeave" />
            </BigButton>
            <BigButton variant="dangerSoft" onClick={form.leaveWithoutSaving} data-cy="z2m-dashboard-leave-discard">
              <Text id="mobileKit.leaveWithoutSaving" />
            </BigButton>
            <BigButton variant="ghost" onClick={form.closeLeave} data-cy="z2m-dashboard-leave-keep-editing">
              <Text id="mobileKit.keepEditing" />
            </BigButton>
          </div>
        </BottomSheet>
      </div>
    </FocusPage>
  );
};

export default withIntlAsProp(AdvancedSettingsMobile);
