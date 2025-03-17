import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

class SendSms extends Component {
  updateText = text => {
    this.props.updateActionProperty(this.props.path, 'text', text);
  };

  render(props, {}) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.smsSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div class="mb-1 small">
            <Text id="editScene.actionsCard.smsSend.explanationText" />
          </div>
          <Localizer>
            <TextWithVariablesInjected
              text={props.action.text}
              path={props.path}
              triggersVariables={props.triggersVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              variables={props.variables}
              updateText={this.updateText}
              placeholder={<Text id="editScene.actionsCard.smsSend.messagePlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(SendSms);
