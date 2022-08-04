import { Text, MarkupText } from 'preact-i18n';

const AlexaWelcomePage = ({}) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">
                    <Text id="integration.googleHome.title" />
                  </h3>
                </div>
                <div class="card-body">
                  <MarkupText id="integration.googleHome.longDescription" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AlexaWelcomePage;
