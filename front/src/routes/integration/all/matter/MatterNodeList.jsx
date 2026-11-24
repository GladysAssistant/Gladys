import { Text } from 'preact-i18n';

import { MobileGroup, MobileRow, MobilePill } from '../../../../components/mobile';
import { getNodeStatusDisplay, getNetworkIcon } from './matterUtils';

export const NodeStatusPill = ({ node }) => {
  const { key, tone } = getNodeStatusDisplay(node);
  return (
    <MobilePill tone={tone} data-cy="matter-node-status">
      <Text id={`integration.matter.node.status.${key}`} />
    </MobilePill>
  );
};

/**
 * @description The nodes, as the user knows them (docs/specs/matter.md): a row per node with its
 * name, its product, its firmware and its status; the row opens the sheet of the node.
 */
const MatterNodeList = ({ nodes, getNodeName, onOpenNode }) => (
  <MobileGroup data-cy="matter-node-list">
    {nodes.map(node => {
      const { tone } = getNodeStatusDisplay(node);
      const information = node.node_information || {};
      const product = [information.vendor_name, information.product_name].filter(Boolean).join(' · ');
      const linkedDevicesCount = (node.gladys_devices || []).length;
      return (
        <MobileRow
          key={node.node_id}
          icon={getNetworkIcon(node.network_type)}
          iconTone={tone}
          title={getNodeName(node)}
          subtitle={product}
          meta={
            <span>
              {information.software_version && (
                <span>
                  <Text id="integration.matter.node.firmwareShort" fields={{ version: information.software_version }} />
                  {' · '}
                </span>
              )}
              <Text
                id="integration.matter.node.linkedDevicesCount"
                plural={linkedDevicesCount}
                fields={{ count: linkedDevicesCount }}
              />
            </span>
          }
          trailing={<NodeStatusPill node={node} />}
          chevron
          onClick={() => onOpenNode(node.node_id)}
          dataCy="matter-node-row"
        />
      );
    })}
  </MobileGroup>
);

export default MatterNodeList;
