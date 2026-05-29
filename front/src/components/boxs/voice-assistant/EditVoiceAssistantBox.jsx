import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';

import GladysPlusUpsell from '../../gateway/GladysPlusUpsell';
import BaseEditBox from '../baseEditBox';

const VOICE_ASSISTANT_UPSELL_PROPS = {
  compact: true,
  icon: 'fe-mic',
  utmCampaign: 'dashboard_voice_assistant_edit',
  titleKey: 'gladysPlusUpsell.voiceAssistant.title',
  descriptionKey: 'gladysPlusUpsell.voiceAssistant.compactDescription'
};

const EditVoiceAssistantBox = props => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.voice-assistant">
    <GladysPlusUpsell httpClient={props.httpClient} {...VOICE_ASSISTANT_UPSELL_PROPS} />
    <p class="text-muted small mb-0">
      <Text id="dashboard.boxes.voice-assistant.configDescription" />
    </p>
  </BaseEditBox>
);

export default connect('httpClient', {})(EditVoiceAssistantBox);
