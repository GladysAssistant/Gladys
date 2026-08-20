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

// SERVICE_TYPES.EXTERNAL server side
const EXTERNAL_SERVICE_TYPE = 'external';

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
  buildName = service => {
    // an external integration ships its own name in its manifest; a core
    // service is translated from the front dictionary, falling back to the
    // technical name when no translation exists
    const translated = get(this.props.intl.dictionary, `integration.${toI18nKey(service.name)}.title`);
    return service.manifest_name || translated || service.name;
  };
  buildLabel = (service, suffixes = []) => {
    const parts = [...suffixes];
    if (service.status !== RUNNING_STATUS) {
      // a stopped or degraded channel stays selectable — a scene can legitimately
      // target a service that is temporarily down — but the user must see it
      parts.push(
        get(this.props.intl.dictionary, 'editScene.actionsCard.messageSend.serviceUnavailable', {
          default: 'unavailable'
        })
      );
    }
    const name = this.buildName(service);
    return parts.length === 0 ? name : `${name} (${parts.join(', ')})`;
  };
  getOptions = async () => {
    try {
      const services = await this.props.httpClient.get('/api/v1/service/message');
      // a core service and an external integration can display the exact same
      // name (a native Telegram alongside a Telegram integration from the
      // store): tell them apart, but only when the ambiguity is real
      const countByName = {};
      services.forEach(service => {
        const name = this.buildName(service);
        countByName[name] = (countByName[name] || 0) + 1;
      });
      const serviceOptions = services.map(service => {
        const ambiguous = countByName[this.buildName(service)] > 1;
        const suffixes = ambiguous
          ? [
              get(
                this.props.intl.dictionary,
                service.type === EXTERNAL_SERVICE_TYPE
                  ? 'editScene.actionsCard.messageSend.serviceIntegrationExternal'
                  : 'editScene.actionsCard.messageSend.serviceIntegrationInternal',
                { default: service.type === EXTERNAL_SERVICE_TYPE ? 'external integration' : 'built-in integration' }
              )
            ]
          : [];
        return {
          label: this.buildLabel(service, suffixes),
          value: service.name
        };
      });
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
