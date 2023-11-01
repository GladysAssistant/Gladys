---
to: ../front/src/components/boxs/<%= module %>/Edit<%= className %>Box.jsx
---
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

const Edit<%= className %>Box = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.<%= module %>">
    <div class={props.loading ? 'dimmer active' : 'dimmer'}>
      <div class="loader" />

      <div class="form-group">
        <label>
          <Text id="dashboard.boxes.<%= module %>.editBoxNameLabel" />
        </label>
        <Localizer>
          <input
            type="text"
            value={props.box.title}
            onInput={props.updateBoxTitle}
            class="form-control"
            placeholder={<Text id="dashboard.boxes.<%= module %>.editBoxNamePlaceholder" />}
          />
        </Localizer>
      </div>
    </div>
  </BaseEditBox>
);

class Edit<%= className %>BoxComponent extends Component {
  updateBoxTitle = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { title: e.target.value });
  };



  componentDidMount() {
    console.log('Edit<%= className %>box : call componentDidMount');
  }

  render(props, { loading }) {
    return (
      <Edit<%= className %>Box
        {...props}
        loading={loading}
        updateBoxTitle={this.updateBoxTitle}
      />
    );
  }
}

export default connect('httpClient', actions)(Edit<%= className %>BoxComponent);