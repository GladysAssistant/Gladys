import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GradiumPage from '../Gradium';
import VoiceTab from './VoiceTab';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class VoicePage extends Component {
  getGradiumSetting = async () => {
    let gradiumVoices = [];
    let gradiumVoiceId = '';
    let languageFilter = this.props.user.language || 'en';

    this.setState({
      gradiumGetSettingsStatus: RequestStatus.Getting,
      gradiumVoices,
      gradiumVoiceId,
      languageFilter
    });

    try {
      const { value: voiceId } = await this.props.httpClient.get('/api/v1/service/gradium/variable/GRADIUM_VOICE_ID');
      gradiumVoiceId = voiceId;
    } catch (e) {}

    try {
      const voices = await this.props.httpClient.get('/api/v1/service/gradium/voices');
      gradiumVoices = voices;

      this.setState({
        gradiumGetSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        gradiumGetSettingsStatus: RequestStatus.Error
      });
    }

    this.setState({
      gradiumVoices,
      gradiumVoiceId
    });
  };

  updateVoice = async event => {
    const voiceId = event.currentTarget.getAttribute('data-voice-id');
    this.setState({
      gradiumSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/gradium/variable/GRADIUM_VOICE_ID', {
        value: voiceId
      });

      this.setState({
        gradiumVoiceId: voiceId,
        gradiumSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        gradiumSaveSettingsStatus: RequestStatus.Error
      });
    }
  };

  sortVoices = (a, b) => {
    if (a.id === this.state.gradiumVoiceId) {
      return -1;
    }

    if (b.id === this.state.gradiumVoiceId) {
      return 1;
    }

    if (a.name < b.name) {
      return -1;
    }

    return 1;
  };

  updateFilterLanguage = async event => {
    const languageFilter = event.currentTarget.value;
    await this.setState({
      languageFilter
    });
  };

  filterVoices = voice => {
    if (voice.id === this.state.gradiumVoiceId) {
      return true;
    }

    return voice.language === this.state.languageFilter;
  };

  componentWillMount() {
    this.getGradiumSetting();
  }

  render(props, state) {
    const loading = state.gradiumGetSettingsStatus === RequestStatus.Getting;
    return (
      <GradiumPage user={props.user}>
        <VoiceTab
          gradiumVoices={state.gradiumVoices}
          gradiumVoiceId={state.gradiumVoiceId}
          gradiumGetSettingsStatus={state.gradiumGetSettingsStatus}
          gradiumSaveSettingsStatus={state.gradiumSaveSettingsStatus}
          languageFilter={state.languageFilter}
          updateVoice={this.updateVoice}
          sortVoices={this.sortVoices}
          filterVoices={this.filterVoices}
          updateFilterLanguage={this.updateFilterLanguage}
          loading={loading}
        />
      </GradiumPage>
    );
  }
}

export default withIntlAsProp(connect('user,httpClient')(VoicePage));
