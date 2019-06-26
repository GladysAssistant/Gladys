import { Link } from 'preact-router/match';

const IntegrationCategory = ({ children, ...props }) => (
  <div class="row row-cards">
    {props.integrations.map(integration => (
      <div class="col-sm-6 col-lg-4">
        <div class="card">
          <Link href={`${props.currentUrl}/${integration.key}`}>
            <img class="card-img-top" src={integration.img} alt={integration.name} />
          </Link>
          <div class="card-body d-flex flex-column">
            <h4>
              <Link href="#">{integration.name}</Link>
            </h4>
            <div class="text-muted">{integration.description}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default IntegrationCategory;
