import television from './television/template';
import light from './light/template';

export const TEMPLATES = [television, light];
export const TEMPLATE_BY_CATEGORY = {};
TEMPLATES.forEach(template => {
  TEMPLATE_BY_CATEGORY[template.category] = template;
});

export const FEATURE_LIST_BY_CATEGORY = {};
export const FEATURES_BY_CATEGORY = {};

TEMPLATES.forEach(template => {
  const { features = {}, category } = template;
  FEATURE_LIST_BY_CATEGORY[category] = [];
  FEATURES_BY_CATEGORY[category] = {};

  Object.keys(features).forEach(type => {
    const button = features[type];
    const { values } = button;

    const item = { type, key: type, ...button };
    if (values) {
      Object.keys(values).forEach(value => {
        let key = `${type}-${value}`;
        const valuedButton = { ...button, ...values[value] };
        const subItem = { type, value: parseInt(value, 10), key, ...valuedButton };
        FEATURE_LIST_BY_CATEGORY[category].push(subItem);
        FEATURES_BY_CATEGORY[category][key] = subItem;
      });
    } else {
      FEATURE_LIST_BY_CATEGORY[category].push(item);
    }
    FEATURES_BY_CATEGORY[category][type] = item;
  });
});

export const REMOTE_CATEGORIES = Object.keys(TEMPLATE_BY_CATEGORY);
