import { Link } from 'preact-router/match';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

const IntegrationCategory = ({ category, integration, currentUrl }) => {
  let url = `${currentUrl}/`;
  if (!category) {
    url += `${integration.type}/`;
  }
  url += get(integration, 'link', { default: integration.key }).toLowerCase();

  return (
    <div class="col-sm-6 col-lg-4">
      <div class="card">
        <Link href={url}>
          <Localizer>
            <img
              class="card-img-top"
              src={integration.img}
              alt={<Text id={`integration.${integration.key}.title`} />}
            />
          </Localizer>
        </Link>
        <div class="card-body d-flex flex-column">
          <h4>
            <Link href={url}>
              <Text id={`integration.${integration.key}.title`} />
            </Link>
          </h4>
          <div class="text-muted">
            <Text id={`integration.${integration.key}.description`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationCategory;
