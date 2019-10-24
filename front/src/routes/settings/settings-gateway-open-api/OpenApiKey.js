import { Text } from 'preact-i18n';

const dateDisplayOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

const OpenApiKey = ({ children, ...props }) => {
  let revokeOpenApiKey = e => {
    e.preventDefault();
    props.revokeOpenApiKey(props.apiKey.id, props.index);
  };

  let createdAt = new Date(props.apiKey.created_at).toLocaleDateString('en-US', dateDisplayOptions);
  let lastUsed =
    props.apiKey.last_used === null
      ? 'never'
      : new Date(props.apiKey.last_used).toLocaleDateString('en-US', dateDisplayOptions);

  return (
    <tr>
      <td>
        <div style="max-width: 400px; overflow: hidden">{props.apiKey.name}</div>
        {props.apiKey.api_key && (
          <div class="small">
            <Text id="gatewayOpenApi.keyName" />: {props.apiKey.api_key}
          </div>
        )}
        <div class="small text-muted">
          <Text id="gatewayOpenApi.registered" />: {createdAt}
        </div>
      </td>
      <td>
        <div class="small text-muted">
          <Text id="gatewayOpenApi.keyLastUsed" />
        </div>
        <div>{lastUsed}</div>
      </td>
      <td>
        <i style={{ cursor: 'pointer' }} onClick={revokeOpenApiKey} class="fe fe-trash-2" />
      </td>
    </tr>
  );
};

export default OpenApiKey;
