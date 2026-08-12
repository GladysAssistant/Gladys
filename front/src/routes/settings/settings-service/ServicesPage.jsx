import { Text } from 'preact-i18n';

import SettingsLayout from '../SettingsLayout';
import ServiceItem from './ServiceItem';

const ServicesPage = ({ services, integrations, actionOnService }) => (
  <SettingsLayout>
    <div class="card">
      <div>
        <div class="table-responsive">
          <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
            <thead>
              <tr>
                <th>
                  <Text id="servicesSettings.title" />
                </th>
                <th class="w-1">
                  <Text id="servicesSettings.status.title" />
                </th>
                <th class="w-1">
                  <Text id="servicesSettings.action" />
                </th>
                <th class="w-1" />
              </tr>
            </thead>
            <tbody>
              {services &&
                services.map(service => (
                  <ServiceItem service={service} integrations={integrations} actionOnService={actionOnService} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </SettingsLayout>
);

export default ServicesPage;
