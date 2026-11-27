import { Component } from 'preact';
import { Text } from 'preact-i18n';

import DiscoveredBox from './DiscoveredBox';
import { MobileGroup, MobileRow } from '../../../../../components/mobile';
import { integrationMobileStyle } from '../../../../../components/integration/mobile';

const S = 'integration.zigbee2mqtt.support';

/**
 * @description The devices Zigbee2mqtt does not support, after the list of the Discover tab, folded by default
 * (docs/specs/zigbee2mqtt-pairing.md, E.5): generic ones to add after a confirmation, the others to report. Each keeps
 * its index in the list of the page, which the actions of its card use.
 */
class UnsupportedSection extends Component {
  toggle = () => this.setState(state => ({ open: !state.open }));

  render({ entries, isMobile, boxProps }, { open }) {
    const title = <Text id={`${S}.sectionTitle`} fields={{ count: entries.length }} />;
    const chevron = <i class={`fe fe-chevron-${open ? 'down' : 'right'}`} aria-hidden="true" />;
    if (isMobile) {
      return (
        <div class={integrationMobileStyle.block} data-cy="z2m-discover-unsupported">
          <MobileGroup>
            <MobileRow
              icon="help-circle"
              title={title}
              subtitle={<Text id={`${S}.sectionText`} />}
              trailing={chevron}
              onClick={this.toggle}
              aria-expanded={open ? 'true' : 'false'}
              dataCy="z2m-discover-unsupported-toggle"
            />
          </MobileGroup>
          {open && (
            <MobileGroup>
              {entries.map(({ device, index }) => (
                <DiscoveredBox key={device.external_id} {...boxProps} isMobile device={device} deviceIndex={index} />
              ))}
            </MobileGroup>
          )}
        </div>
      );
    }
    return (
      <div class="mt-4" data-cy="z2m-discover-unsupported">
        <button
          type="button"
          class="btn btn-link px-0"
          onClick={this.toggle}
          aria-expanded={open ? 'true' : 'false'}
          data-cy="z2m-discover-unsupported-toggle"
        >
          {chevron} {title}
        </button>
        <p class="text-muted small">
          <Text id={`${S}.sectionText`} />
        </p>
        {open && (
          <div class="row">
            {entries.map(({ device, index }) => (
              <DiscoveredBox key={device.external_id} {...boxProps} device={device} deviceIndex={index} />
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default UnsupportedSection;
