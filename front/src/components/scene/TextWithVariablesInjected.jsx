import { Component } from 'preact';
import Tagify from '@yaireo/tagify';
import '@yaireo/tagify/dist/tagify.css';
import get from 'get-value';

const OPENING_VARIABLE = '{{';
const CLOSING_VARIABLE = '}}';

class TextWithVariablesInjected extends Component {
  setRef = dom => (this.tagifyInputRef = dom);
  initTagify = () => {
    if (this.tagify) {
      this.tagify.destroy();
    }
    this.tagify = new Tagify(this.tagifyInputRef, {
      mode: 'mix',
      pattern: new RegExp(OPENING_VARIABLE),
      duplicates: true,
      enforceWhitelist: true,
      tagTextProp: 'text',
      dropdown: {
        enabled: 1,
        position: 'text',
        mapValueTo: 'title',
        maxItems: 200
      },
      whitelist: this.state.variableWhileList,
      mixTagsInterpolator: [OPENING_VARIABLE, CLOSING_VARIABLE]
    });
    const text = this.props.text || '';
    this.tagify.loadOriginalValues(text);
    this.tagify.on('input add remove change', () => {
      const text = get(this.tagify, 'DOM.input.innerText', '');
      this.parseText(text);
    });
  };
  refreshVariables = async nextProps => {
    const variableWhileList = [];
    let variablesKey = '';
    let variableReady = null;
    // Action variables
    nextProps.actionsGroupsBefore.forEach((actionGroup, groupIndex) => {
      actionGroup.forEach((action, index) => {
        if (nextProps.variables[groupIndex][index]) {
          nextProps.variables[groupIndex][index].forEach(option => {
            if (option.ready && variableReady === null) {
              variableReady = true;
            }
            if (!option.ready) {
              variableReady = false;
            }
            // we create a "variablesKey" string to quickly compare the variables displayed
            // instead of having to loop through 2 arrays. It's quicker :)
            variablesKey += `${groupIndex}.${index}.${option.name}.${option.label}.${option.ready}`;
            variableWhileList.push({
              id: `${groupIndex}.${index}.${option.name}`,
              text: `${groupIndex + 1}. ${index + 1}. ${option.label}`,
              title: `${groupIndex + 1}. ${index + 1}. ${option.label}`,
              value: `${groupIndex}.${index}.${option.name}`
            });
          });
        }
      });
    });
    // Triggers variables
    nextProps.triggersVariables.forEach((triggerVariables, index) => {
      triggerVariables.forEach(triggerVariable => {
        if (triggerVariable.ready && variableReady === null) {
          variableReady = true;
        }
        if (!triggerVariable.ready) {
          variableReady = false;
        }
        // we create a "variablesKey" string to quickly compare the variables displayed
        // instead of having to loop through 2 arrays. It's quicker :)
        variablesKey += `trigger.${index}.${triggerVariable.name}.${triggerVariable.label}.${triggerVariable.ready}`;
        variableWhileList.push({
          id: `triggerEvent.${triggerVariable.name}`,
          text: `${index + 1}. ${triggerVariable.label}`,
          title: `${index + 1}. ${triggerVariable.label}`,
          value: `triggerEvent.${triggerVariable.name}`
        });
      });
    });
    const previousVariablesKey = this.state.variablesKey;
    await this.setState({ variableWhileList, variableReady, variablesKey });
    // we compare here the previous variables key
    // and the new one, and we compare if they are the same
    if (variablesKey !== previousVariablesKey) {
      this.initTagify();
    }
  };
  parseText = async textContent => {
    let text = textContent ? textContent : '';
    const variableWhileListSorted = this.state.variableWhileList.sort((a, b) => b.id.length - a.id.length);
    variableWhileListSorted.forEach(variable => {
      text = text.replaceAll(variable.text, `${OPENING_VARIABLE}${variable.id}${CLOSING_VARIABLE}`);
    });
    text = text.replaceAll(`\n${OPENING_VARIABLE}`, OPENING_VARIABLE);
    text = text.replaceAll(`${CLOSING_VARIABLE}\n`, CLOSING_VARIABLE);
    text = text.trim();
    await this.setState({ text });
    this.props.updateText(text);
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      variableWhileList: [],
      text: this.props.text
    };

    this.refreshVariables(this.props);
  }

  componentDidMount() {
    this.initTagify();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshVariables(nextProps);
    // If the text is refreshed from the outside
    if (nextProps.text !== this.state.text) {
      this.tagify.loadOriginalValues(nextProps.text);
      this.setState({ text: nextProps.text });
    }
  }
  componentWillUnmount() {
    if (this.tagify) {
      this.tagify.destroy();
    }
  }

  render({ singleLineInput = false, placeholder }, {}) {
    if (singleLineInput) {
      return (
        <input
          type="text"
          ref={this.setRef}
          placeholder={placeholder}
          class={`form-control ${this.props.class ? this.props.class : ''}`}
        />
      );
    }
    return (
      <textarea
        ref={this.setRef}
        placeholder={placeholder}
        class={`form-control ${this.props.class ? this.props.class : ''}`}
      />
    );
  }
}

export default TextWithVariablesInjected;
