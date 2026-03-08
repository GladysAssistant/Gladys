import { Text, MarkupText } from 'preact-i18n';
import { connect } from 'unistore/preact';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';

const AlexaWelcomePage = ({ user }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.alexa.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <DeviceConfigurationLink
                    user={user}
                    configurationKey="integrations"
                    documentKey="alexa"
                    linkClass="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-book-open" />
                    </span>
                    <Text id="integration.alexa.documentation" />
                  </DeviceConfigurationLink>
                </div>
              </div>
            </div>

            <div class="col-lg-9">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.alexa.title" />
                  </h1>
                </div>
                <div class="card-body">
                  <MarkupText id="integration.alexa.longDescription" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default connect('user', {})(AlexaWelcomePage);
