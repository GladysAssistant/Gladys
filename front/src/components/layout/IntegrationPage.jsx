import { Link } from 'preact-router/match';

const IntegrationPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">
              <Link href="/dashboard/integration/device" class="btn btn-secondary btn-sm btn-block">
                ◀️️ Back
              </Link>
            </h1>
          </div>

          <div class="row">
            <div class="col-lg-3">
              <div class="card">
                <Link href={`${props.currentUrl}/${props.integration.key}`}>
                  <img class="card-img-top" src={props.integration.img} alt={props.integration.name} />
                </Link>
                <div class="card-body d-flex flex-column">
                  <h4>
                    <Link href="#">{props.integration.name}</Link>
                  </h4>
                  <div class="text-muted">{props.integration.description}</div>
                  <br />
                  <div class="row">
                    <div class="col-6">
                      <button class="btn btn-success btn-block">Restart</button>
                    </div>
                    <div class="col-6">
                      <button class="btn btn-danger btn-block">Stop</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-9">
              <div class="card">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default IntegrationPage;
