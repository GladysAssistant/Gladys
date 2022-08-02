import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router';
import get from 'get-value';

import { RequestStatus } from '../../../utils/consts';
import { SERVICE_STATUS } from '../../../../../server/utils/constants';

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

  render({ service, integrations = [] }, { changeStatus }) {
    const started = STARTED_STATUS.includes(service.status);
    const displayAction = !HIDDEN_ACTION_STATUS.includes(service.status);
    const integrationPage = integrations.find(
      integration => get(integration, 'link', { default: integration.key }).toLowerCase() === service.selector
    );
    const integrationLink =
      integrationPage &&
      `/dashboard/integration/${integrationPage.type}/${(integrationPage.link || integrationPage.key).toLowerCase()}`;
    const integrationKey = integrationPage && integrationPage.key;

    const changingStatus = changeStatus === RequestStatus.Getting;

    return (
      <tr>
        <td>
          <div style="max-width: 400px; overflow: hidden">
            <Text id={`integration.${integrationKey}.title`}>{service.name}</Text>
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
          {integrationPage && (
            <Localizer>
              <Link
                href={integrationLink}
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
