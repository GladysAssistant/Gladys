import { Text } from 'preact-i18n';

import { getLocalizedText } from '../utils';

// The scene triggers and actions declared by the manifest, shown on the
// install screen next to the other declarations: an information, not a
// permission — an integration already triggers scenes through its device
// states, a declared trigger only reaches the scenes whose author binds it.
const SceneDeclarationsSummary = ({ sceneTriggers, sceneActions, language }) => {
  const triggers = sceneTriggers || [];
  const actions = sceneActions || [];
  if (triggers.length === 0 && actions.length === 0) {
    return null;
  }
  return (
    <div class="mb-4">
      <h4>
        <i class="fe fe-box mr-1" />
        <Text id="integration.externalIntegration.install.sceneDeclarationsTitle" />
      </h4>
      <p class="text-muted small">
        <Text
          id="integration.externalIntegration.install.sceneDeclarationsText"
          fields={{ triggers: triggers.length, actions: actions.length }}
        />
      </p>
      <ul class="mb-0">
        {triggers.map(trigger => (
          <li>
            <Text id="integration.externalIntegration.install.sceneTriggerPrefix" />{' '}
            {getLocalizedText(trigger.label, language) || trigger.key}
          </li>
        ))}
        {actions.map(action => (
          <li>
            <Text id="integration.externalIntegration.install.sceneActionPrefix" />{' '}
            {getLocalizedText(action.label, language) || action.key}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SceneDeclarationsSummary;
