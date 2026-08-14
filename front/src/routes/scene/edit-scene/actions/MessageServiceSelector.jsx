import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

const ALL_SERVICES_VALUE = '__all__';

// a channel only delivers when its service is running: an external
// integration whose container is gone is reported DEGRADED, a core service
// that failed to start is STOPPED
const RUNNING_STATUS = 'RUNNING';

/**
 * A core service has no manifest, so the server falls back to its technical
 * name ("nextcloud-talk"). The human readable name lives in the front i18n
 * dictionary under integration.<camelCaseName>.title.
 */
const toI18nKey = name => name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());

/**
 * Channel selector of the "send message" scene actions.
 *
 * An action without a `service` property keeps the historical behaviour:
 * the message is broadcast to every messaging channel the user configured.
 * That case is represented by the first option, so an existing scene opened
 * in the editor shows "All configured services" without being rewritten.
 */
class MessageServiceSelector extends Component {
  buildLabel = service => {
    // an external integration ships its own name in its manifest; a core
    // service is translated from the front dictionary, falling back to the
    // technical name when no translation exists
    const translated = get(this.props.intl.dictionary, `integration.${toI18nKey(service.name)}.title`);
    const name = service.manifest_name || translated || service.name;
    if (service.status === RUNNING_STATUS) {
      return name;
    }
    // a stopped or degraded channel stays selectable — a scene can legitimately
    // target a service that is temporarily down — but the user must see it
    const unavailable = get(this.props.intl.dictionary, 'editScene.actionsCard.messageSend.serviceUnavailable', {
      default: 'unavailable'
    });
    return `${name} (${unavailable})`;
  };
  getOptions = async () => {
    try {
      const services = await this.props.httpClient.get('/api/v1/service/message');
      const serviceOptions = services.map(service => ({
        label: this.buildLabel(service),
        value: service.name
      }));
      this.setState({ serviceOptions });
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOption => {
    const value = selectedOption && selectedOption.value !== ALL_SERVICES_VALUE ? selectedOption.value : null;
    // keep a local copy: the parent rebuilds the action object on every
    // update, and a re-render arriving before the new action prop is
    // propagated must not make the select fall back to "all services"
    this.setState({ selectedService: value });
    this.props.updateActionProperty(this.props.path, 'service', value);
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      serviceOptions: [],
      selectedService: props.action.service || null
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    // the action being edited changed under us (scene reloaded, card moved):
    // follow it, but ignore the transient re-renders where the parent has
    // not applied our own update yet
    if (nextProps.action.service !== this.props.action.service) {
      this.setState({ selectedService: nextProps.action.service || null });
    }
  }
  render({ action }, { serviceOptions, selectedService }) {
    const currentService = action.service || selectedService;
    const allServicesOption = {
      label: <Text id="editScene.actionsCard.messageSend.allServicesLabel" />,
      value: ALL_SERVICES_VALUE
    };
    const options = [allServicesOption, ...serviceOptions];
    const selectedOption = currentService
      ? // a channel saved in the scene but no longer listed (service removed
        // or uninstalled) still needs to be readable: translate what we can
        // and mark it unavailable, rather than showing a raw technical name
        serviceOptions.find(option => option.value === currentService) || {
          label: this.buildLabel({ name: currentService, status: null }),
          value: currentService
        }
      : allServicesOption;
    return (
      <div class="form-group">
        <label class="form-label">
          <Text id="editScene.actionsCard.messageSend.serviceLabel" />
        </label>
        <Select
          styles={{
            // Fixes the overlapping problem of the component
            menu: provided => ({ ...provided, zIndex: 2 })
          }}
          options={options}
          value={selectedOption}
          onChange={this.handleChange}
          className="react-select-container"
          classNamePrefix="react-select"
        />
        <div class="mt-1 small text-muted">
          <Text id="editScene.actionsCard.messageSend.serviceExplanation" />
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(MessageServiceSelector));
