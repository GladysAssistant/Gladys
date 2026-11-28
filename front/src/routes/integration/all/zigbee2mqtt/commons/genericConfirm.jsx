import { Text } from 'preact-i18n';
import get from 'get-value';

const S = 'integration.zigbee2mqtt.support';

/**
 * @description The confirmation of a device added with the features Zigbee2mqtt generated
 * (docs/specs/zigbee2mqtt-pairing.md, E.3), shared by the Discover tab and the pairing window.
 * @param {object} dictionary - The dictionary of the language of the user.
 * @returns {object} The title, text and label of the confirming button.
 * @example
 * getGenericConfirm(dictionary);
 */
export const getGenericConfirm = dictionary => ({
  title: get(dictionary, `${S}.confirmTitle`),
  text: <Text id={`${S}.confirmText`} />,
  confirmLabel: <Text id={`${S}.confirmAdd`} />
});

export default getGenericConfirm;
