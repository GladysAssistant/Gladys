import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

const EditVacbotBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.vacbot">
    <div class={props.loading ? 'dimmer active' : 'dimmer'}>
      <div class="loader" />

      <div class="form-group">
        <label>
          <Text id="dashboard.boxes.vacbot.editVacbotLabel" />
        </label>
        <select onChange={props.updateBoxVacbot} class="form-control">
          <option>
            <Text id="global.emptySelectOption" />
          </option>
          {props.vacbots &&
            props.vacbots.map(vacbot => (
              <option selected={vacbot.selector === props.box.device_feature} value={vacbot.selector}>
                {vacbot.name}
              </option>
            ))}
        </select>
      </div>

      <div class="form-group">
        <label>
          <Text id="dashboard.boxes.vacbot.editBoxNameLabel" />
        </label>
        <Localizer>
          <input
            type="text"
            value={props.box.title}
            onInput={props.updateBoxTitle}
            class="form-control"
            placeholder={<Text id="dashboard.boxes.vacbot.editBoxNamePlaceholder" />}
          />
        </Localizer>
      </div>
    </div>
  </BaseEditBox>
);

class EditVacbotBoxComponent extends Component {
  updateBoxVacbot = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_feature: e.target.value
    });
  };
  updateBoxTitle = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { title: e.target.value });
  };

  getVacbots = async () => {
    await this.setState({
      loading: true
    });
    try {
      await this.setState({
        error: false,
        pending: true
      });
      const vacbots = await this.props.httpClient.get('/api/v1/service/ecovacs/vacbots');
      this.setState({
        vacbots,
        pending: false,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true,
        pending: false,
        loading: false
      });
    }
  };

  componentDidMount() {
    this.getVacbots();
  }

  render(props, { loading, vacbots }) {
    return (
      <EditVacbotBox
        {...props}
        vacbots={vacbots}
        loading={loading}
        updateBoxVacbot={this.updateBoxVacbot}
        updateBoxTitle={this.updateBoxTitle}
      />
    );
  }
}

export default connect('httpClient', actions)(EditVacbotBoxComponent);
