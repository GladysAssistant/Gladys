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

    this.setState({
      gradiumGetSettingsStatus: RequestStatus.Getting,
      gradiumVoices,
      gradiumVoiceId
    });

    try {
      const { value: voiceId } = await this.props.httpClient.get(
        '/api/v1/service/gradium/variable/GRADIUM_VOICE_ID'
      );
      gradiumVoiceId = voiceId;
    } catch (e) {}

    try {
      const voices = await this.props.httpClient.get(
        '/api/v1/service/gradium/voices'
      );
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

  updateVoice = async (event) => {
    const voiceId = event.currentTarget.getAttribute('data-voice-id');
    await this.props.httpClient.post('/api/v1/service/gradium/variable/GRADIUM_VOICE_ID', {
        value: voiceId
      });

    this.setState({
      gradiumVoiceId: voiceId
    });
  }

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
          updateVoice={this.updateVoice}
          loading={loading}
        />
      </GradiumPage>
    );
  }
}

export default withIntlAsProp(connect('user,httpClient')(VoicePage));
