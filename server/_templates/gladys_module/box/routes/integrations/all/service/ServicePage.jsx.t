---
to: ../front/src/routes/integration/all/<%= module %>/<%= className %>Page.js
---
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const <%= className %>Page = ({ children }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-3">
              <h3 class="page-title mb-5">
                <Text id="integration.<%= attributeName %>.title" />
              </h3>
              <div>
                <div class="list-group list-group-transparent mb-0">
                  <Link
                    href="/dashboard/integration/device/<%= module %>/setup"
                    activeClassName="active"
                    class="list-group-item list-group-item-action d-flex align-items-center"
                  >
                    <span class="icon mr-3">
                      <i class="fe fe-sliders" />
                    </span>
                    <Text id="integration.<%= attributeName %>.setupTab" />
                  </Link>
                </div>
              </div>
            </div>

            <div class="col-lg-9">{children}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default <%= className %>Page;