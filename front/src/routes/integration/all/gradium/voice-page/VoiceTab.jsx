import { Text } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

import style from './VoiceTab.css';
import VoiceBox from './VoiceBox';

const languages = ['en', 'fr', 'de', 'es', 'pt'];

const VoiceTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.gradium.voiceTab" />
      </h1>
      <select
        onChange={props.updateFilterLanguage}
        className={cx('page-options d-flex form-control custom-select w-auto', style['language-select'])}
      >
        {languages.map(language => (
          <option value={language} selected={props.languageFilter === language}>
            <Text id={`integration.gradium.language.${language}`} />
          </option>
        ))}
      </select>
    </div>
    <div class="card-body">
      <div
        class={cx('dimmer', {
          active: props.loading
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <p>
            <Text id="integration.gradium.voiceIntroduction" />
          </p>
          <div class="row">
            {props.gradiumVoices
              .sort(props.sortVoices)
              .filter(props.filterVoices)
              .map((voice, index) => (
                <VoiceBox
                  key={index}
                  voice={voice}
                  voiceSelected={voice.id === props.gradiumVoiceId}
                  updateVoice={props.updateVoice}
                />
              ))}
          </div>
          {props.gradiumSaveSettingsStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="integration.gradium.configurationError" />
            </div>
          )}
          {props.gradiumSaveSettingsStatus === RequestStatus.Success && (
            <p class="alert alert-info">
              <Text id="integration.gradium.configurationSuccess" />
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default VoiceTab;
