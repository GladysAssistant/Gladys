import { Text } from 'preact-i18n';

const margin = {
  marginTop: '5rem'
};

const EmptySearch = ({}) => (
  <div style={margin} class="text-center">
    <Text id="housesSettings.noHouseFound" />
  </div>
);

export default EmptySearch;
