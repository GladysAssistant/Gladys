import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import ScrollToTopLink from '../../components/router/ScrollToTopLink';

const IntegrationCategory = ({ category, integration, currentUrl }) => {
  let url = `${currentUrl}/`;
  if (!category) {
    url += `${integration.type}/`;
  }
  url += get(integration, 'link', { default: integration.key }).toLowerCase();

  return (
    <div class="col-sm-6 col-lg-4">
      <div class="card">
        <ScrollToTopLink href={url}>
          <Localizer>
            <img
              class="card-img-top"
              src={integration.img}
              alt={<Text id={`integration.${integration.key}.title`} />}
            />
          </Localizer>
        </ScrollToTopLink>
        <div class="card-body d-flex flex-column">
          <h4>
            <ScrollToTopLink href={url}>
              <Text id={`integration.${integration.key}.title`} />
            </ScrollToTopLink>
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
