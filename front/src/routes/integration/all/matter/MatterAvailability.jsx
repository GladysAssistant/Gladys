import { Text, Localizer } from 'preact-i18n';

import { MobilePill } from '../../../../components/mobile';
import { UNAVAILABLE_REASONS } from './matterUtils';

const getIcon = reason => (reason === UNAVAILABLE_REASONS.BRIDGED_UNREACHABLE ? 'fe-link-2' : 'fe-wifi-off');

// Why a Matter device is unavailable, in words (docs/specs/matter.md)
export const UnavailableReason = ({ reason }) => <Text id={`integration.matter.device.unavailableReason.${reason}`} />;

// The desktop tag of an unavailable device, its reason as a tooltip
export const UnavailableTag = ({ availability }) =>
  availability && availability.available === false ? (
    <div class="page-options d-flex">
      <Localizer>
        <div
          class="tag tag-danger"
          data-cy="matter-device-unavailable"
          title={<Text id={`integration.matter.device.unavailableReason.${availability.reason}`} />}
        >
          <Text id="integration.matter.device.unavailable" />
          <span class="tag-addon">
            <i class={`fe ${getIcon(availability.reason)}`} />
          </span>
        </div>
      </Localizer>
    </div>
  ) : null;

// The pill of an unavailable device on a phone: a word, never a color alone
export const UnavailablePill = ({ availability }) =>
  availability && availability.available === false ? (
    <MobilePill tone="danger" data-cy="matter-device-unavailable">
      <i class={`fe ${getIcon(availability.reason)}`} aria-hidden="true" />
      <Text id="integration.matter.device.unavailable" />
    </MobilePill>
  ) : null;
