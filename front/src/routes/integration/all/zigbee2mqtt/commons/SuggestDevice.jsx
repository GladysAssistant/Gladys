import { Text } from 'preact-i18n';
import get from 'get-value';

import { getForumUrl } from '../utils/support';
import { BigButton } from '../../../../../components/mobile';

const S = 'integration.zigbee2mqtt.support';

/**
 * @description The URL of a prefilled topic of the Gladys forum, for a model Zigbee2mqtt knows and of which Gladys
 * only uses secondary features, or none (docs/specs/zigbee2mqtt-pairing.md, E.4 b).
 * @param {object} device - A device of GET /discovered, with its `zigbee2mqtt_info`.
 * @param {object} dictionary - The dictionary of the language of the user.
 * @returns {string} The URL.
 */
export const getSuggestUrl = (device, dictionary) => {
  const info = device.zigbee2mqtt_info || {};
  const definition = info.definition || {};
  const model = [definition.vendor, definition.model || device.model].filter(Boolean).join(' ');
  const title = (get(dictionary, `${S}.forumTitle`) || '').replace('{{model}}', model);
  return getForumUrl(device, title, get(dictionary, `${S}.forumCut`) || '');
};

// "Suggest this device": a new tab on the forum, a big button on a phone
const SuggestDevice = ({ device, dictionary, isMobile }) => {
  const link = {
    href: getSuggestUrl(device, dictionary),
    target: '_blank',
    rel: 'noopener noreferrer',
    'data-cy': 'z2m-discovered-suggest'
  };
  return isMobile ? (
    <BigButton icon="message-circle" {...link}>
      <Text id="integration.zigbee2mqtt.discover.suggestDevice" />
    </BigButton>
  ) : (
    <a class="btn btn-outline-primary btn-sm mb-2" {...link}>
      <i class="fe fe-message-circle mr-1" aria-hidden="true" />
      <Text id="integration.zigbee2mqtt.discover.suggestDevice" />
    </a>
  );
};

export default SuggestDevice;
