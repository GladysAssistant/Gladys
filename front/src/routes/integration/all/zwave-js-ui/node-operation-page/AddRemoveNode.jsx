import { Text } from 'preact-i18n';

const AddNode = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">
        {props.action === 'remove' ? (
          <Text id="integration.zwavejsui.nodeOperation.removeNodeTitle" />
        ) : (
          <Text id="integration.zwavejsui.nodeOperation.addNodeTitle" />
        )}
      </h2>
      <div class="card-options">
        <button class="btn btn-danger" onClick={props.cancel}>
          <Text id="integration.zwavejsui.nodeOperation.cancelButton" />
        </button>
      </div>
    </div>
    <div class="card-body">
      {!props.nodeAdded && (
        <div class="text-center">
          <h1>
            {props.remainingTimeInSeconds} <Text id="integration.zwavejsui.nodeOperation.seconds" />
          </h1>
          <p>
            {props.action === 'remove' ? (
              <Text id="integration.zwavejsui.nodeOperation.removeNodeInstructions" />
            ) : (
              <Text id="integration.zwavejsui.nodeOperation.addNodeInstructions" />
            )}
          </p>
        </div>
      )}
      {props.nodeAdded && (
        <div class="text-center">
          <h1>
            <Text id="integration.zwavejsui.nodeOperation.nodeAddedTitle" />
          </h1>
          <p>
            <Text id="integration.zwavejsui.nodeOperation.nodeAddedDescription" />
          </p>
        </div>
      )}
    </div>
  </div>
);

export default AddNode;
