import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router';

import { RequestStatus } from '../../../utils/consts';
import { SERVICE_STATUS } from '../../../../../server/utils/constants';
import style from './style.css';

const STARTED_STATUS = [SERVICE_STATUS.RUNNING];
const HIDDEN_ACTION_STATUS = [SERVICE_STATUS.UNKNOWN, SERVICE_STATUS.DISABLED];

class ServiceItem extends Component {
  changeState = async () => {
    this.setState({
      changeStatus: RequestStatus.Getting
    });

    try {
      // change service state
      const action = STARTED_STATUS.includes(this.props.service.status) ? 'stop' : 'start';
      this.props.actionOnService(this.props.service.selector, action);

      this.setState({
        changeStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        changeStatus: RequestStatus.Error
      });
    }
  };

  render({ service, integration }, { changeStatus }) {
    const started = STARTED_STATUS.includes(service.status);
    const displayAction = !HIDDEN_ACTION_STATUS.includes(service.status);

    const changingStatus = changeStatus === RequestStatus.Getting;

    return (
      <tr>
        <td>
          <div class={style.serviceName}>
            {integration.i18nKey ? <Text id={integration.i18nKey}>{integration.name}</Text> : integration.name}
            {integration.external && (
              // same tag as in the integration catalog: the list mixes both
              // families, and a community integration can be named like a
              // built-in one
              <span class="badge badge-secondary">
                <Text id="integration.tags.external" />
              </span>
            )}
          </div>
          <div class="small text-muted">
            <Text id="servicesSettings.selector" fields={{ key: service.selector }} />
          </div>
        </td>
        <td>
          <Localizer>
            <div title={<Text id={`servicesSettings.status.${service.status}.detail`} />}>
              <Text id={`servicesSettings.status.${service.status}.title`} />
            </div>
          </Localizer>
        </td>
        <td>
          {displayAction && changingStatus && <div class="btn-secondary btn-loading border-0 disabled mr-3" />}
          {displayAction && !changingStatus && (
            <label class="custom-switch mt-1">
              <input
                type="radio"
                name={service.id}
                disabled={changingStatus}
                class="custom-switch-input"
                checked={started}
                onClick={this.changeState}
              />
              <span class="custom-switch-indicator" />
            </label>
          )}
        </td>
        <td>
          {integration.url && (
            <Localizer>
              <Link
                href={integration.url}
                class="btn btn-outline-secondary border-0"
                title={<Text id="servicesSettings.integrationLinkTitle" />}
              >
                <big>
                  <i class="fe fe-arrow-right-circle" />
                </big>
              </Link>
            </Localizer>
          )}
        </td>
      </tr>
    );
  }
}

export default ServiceItem;
