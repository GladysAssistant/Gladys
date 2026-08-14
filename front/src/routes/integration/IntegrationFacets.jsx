import { Text } from 'preact-i18n';

// the facets are technical attributes (native/community, local/cloud, Gladys
// Plus), orthogonal to the browse categories of the sidebar: cumulative
// filter chips, one active value per group, clicking the active chip
// releases it. The labels are the ones already worn by the card tags.
const FacetChip = ({ active, onClick, icon, labelKey }) => (
  <button
    type="button"
    class={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'} mr-2 mb-2`}
    onClick={onClick}
  >
    <i class={`fe fe-${icon} mr-1`} />
    <Text id={labelKey} />
  </button>
);

const IntegrationFacets = ({
  origin,
  transports = [],
  gladysPlus,
  setOriginFacet,
  setTransportFacet,
  toggleGladysPlusFacet
}) => (
  <div class="d-flex flex-wrap align-items-center mb-2">
    <FacetChip
      active={origin === 'native'}
      onClick={() => setOriginFacet('native')}
      icon="check-circle"
      labelKey="integration.tags.native"
    />
    <FacetChip
      active={origin === 'community'}
      onClick={() => setOriginFacet('community')}
      icon="package"
      labelKey="integration.tags.external"
    />
    {/* multi-valued: both transport chips together mean "local OR cloud" */}
    <FacetChip
      active={transports.includes('local')}
      onClick={() => setTransportFacet('local')}
      icon="home"
      labelKey="integration.tags.local"
    />
    <FacetChip
      active={transports.includes('cloud')}
      onClick={() => setTransportFacet('cloud')}
      icon="cloud"
      labelKey="integration.tags.cloud"
    />
    <FacetChip active={gladysPlus} onClick={toggleGladysPlusFacet} icon="plus" labelKey="integration.tags.gladysPlus" />
  </div>
);

export default IntegrationFacets;
