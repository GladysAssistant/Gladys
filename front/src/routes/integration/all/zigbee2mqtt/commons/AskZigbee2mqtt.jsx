import { Component } from 'preact';
import { Text } from 'preact-i18n';

import copyText from '../utils/copyText';
import { Z2M_SUPPORT_NEW_DEVICES_URL, getZigbee2mqttReport } from '../utils/support';
import { BigButton } from '../../../../../components/mobile';

const T = 'integration.zigbee2mqtt.support';

/**
 * @description For a model Zigbee2mqtt does not know (docs/specs/zigbee2mqtt-pairing.md, E.4 a): the page of
 * Zigbee2mqtt that tells how to ask for it, and the information to paste there. A copy the browser refuses shows the
 * text, to select by hand. Without `zigbee2mqtt_info` (the device not known by Gladys yet), the link only.
 */
class AskZigbee2mqtt extends Component {
  copy = async () => {
    clearTimeout(this.copiedTimer);
    const text = getZigbee2mqttReport(this.props.device);
    const copied = await copyText(text);
    if (this.unmounted) {
      return;
    }
    this.setState({ copied, refusedText: copied ? null : text });
    if (copied) {
      this.copiedTimer = setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  componentWillUnmount() {
    this.unmounted = true;
    clearTimeout(this.copiedTimer);
  }

  render({ device, isMobile }, { copied, refusedText }) {
    const canCopy = Boolean(device && device.zigbee2mqtt_info);
    const link = { href: Z2M_SUPPORT_NEW_DEVICES_URL, target: '_blank', rel: 'noopener noreferrer' };
    return (
      <div data-cy="z2m-support-ask-z2m">
        {isMobile ? (
          [
            <BigButton key="link" icon="external-link" {...link} data-cy="z2m-support-ask-z2m-link">
              <Text id={`${T}.askZigbee2mqtt`} />
            </BigButton>,
            canCopy && (
              <BigButton key="copy" icon="copy" onClick={this.copy} data-cy="z2m-support-copy">
                <Text id={`${T}.copyInformation`} />
              </BigButton>
            )
          ]
        ) : (
          <div class="d-flex flex-wrap">
            <a class="btn btn-outline-primary btn-sm mr-2 mb-2" {...link} data-cy="z2m-support-ask-z2m-link">
              <i class="fe fe-external-link mr-1" aria-hidden="true" />
              <Text id={`${T}.askZigbee2mqtt`} />
            </a>
            {canCopy && (
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm mb-2"
                onClick={this.copy}
                data-cy="z2m-support-copy"
              >
                <i class="fe fe-copy mr-1" aria-hidden="true" />
                <Text id={`${T}.copyInformation`} />
              </button>
            )}
          </div>
        )}
        <span class="small text-success" aria-live="polite" data-cy="z2m-support-copied">
          {copied && <Text id={`${T}.copied`} />}
        </span>
        {refusedText && (
          <div class="mt-2" data-cy="z2m-support-copy-refused">
            <p class="small text-muted mb-1">
              <Text id={`${T}.copyRefused`} />
            </p>
            <textarea class="form-control text-monospace small" rows="6" readonly value={refusedText} />
          </div>
        )}
      </div>
    );
  }
}

export default AskZigbee2mqtt;
