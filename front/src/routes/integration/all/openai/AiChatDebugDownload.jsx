import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class AiChatDebugDownload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      downloading: false,
      error: false
    };
  }

  downloadDebugContext = async () => {
    this.setState({ downloading: true, error: false });
    try {
      const context = await this.props.httpClient.get('/api/v1/gateway/aichat/debug-context');
      const dataStr = JSON.stringify(context, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);

      const now = new Date();
      const datetime = now
        .toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        .replace(/[/,:]/g, '-')
        .replace(/\s/g, '_');

      const link = document.createElement('a');
      link.href = url;
      link.download = `gladys-ai-chat-debug-context-${datetime}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
    this.setState({ downloading: false });
  };

  render({}, { downloading, error }) {
    return (
      <div class="card mt-4">
        <div class="card-header">
          <h4 class="card-title mb-0">
            <Text id="integration.openai.debugContext.title" />
          </h4>
        </div>
        <div class="card-body">
          <p class="text-muted mb-3">
            <Text id="integration.openai.debugContext.description" />
          </p>
          {error && (
            <div class="alert alert-danger mb-3" role="alert">
              <Text id="integration.openai.debugContext.error" />
            </div>
          )}
          <button
            type="button"
            class="btn btn-outline-secondary"
            onClick={this.downloadDebugContext}
            disabled={downloading}
          >
            <Text id="integration.openai.debugContext.downloadButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(AiChatDebugDownload);
