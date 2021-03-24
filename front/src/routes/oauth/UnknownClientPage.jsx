import { Text } from 'preact-i18n';

const UnknownClientPage = props => {
  return (
    <div class="card">
      <div class="card-body p-6">
        <div class="card-title">
          <Text id="authorize.unknownClientTitle" fields={{ client: props.client_id }} />
        </div>
      </div>
    </div>
  );
};

export default UnknownClientPage;
