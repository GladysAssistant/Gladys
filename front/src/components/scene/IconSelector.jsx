import { Fragment } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import get from 'get-value';

import iconList from '../../../../server/config/icons.json';
import iconKeywords from '../../config/i18n/icon-keywords';
import { AVAILABLE_LANGUAGES } from '../../../../server/utils/constants';
import style from './IconSelector.css';

// Fold both the query and the searched text down to plain lowercase letters:
// dashes disappear, so "door open", "door-open" and "dooropen" all match the
// same icon, and accents do too, so "eclair" finds "éclair" and "vergrossern"
// finds "vergrößern".
const normalize = value =>
  value
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const IconSelector = ({ value, onChange, darkModeNoFilter = false, user }) => {
  const [search, setSearch] = useState('');
  const language = get(user, 'language') || AVAILABLE_LANGUAGES.EN;

  // Icon names are English, so a French or German user has no way to find one
  // by name. Each icon carries a translated label — shown under the icon — plus
  // extra keywords. The English name, the label and the keywords are searched.
  const translations = iconKeywords[language] || iconKeywords[AVAILABLE_LANGUAGES.EN];

  const haystacks = useMemo(
    () =>
      iconList.reduce((acc, icon) => {
        const { label = '', keywords = '' } = translations[icon] || {};
        acc[icon] = normalize(`${icon} ${label} ${keywords}`);
        return acc;
      }, {}),
    [translations]
  );

  const icons = useMemo(() => {
    const searchTerm = normalize(search);
    if (searchTerm.length === 0) {
      return iconList;
    }
    return iconList.filter(icon => haystacks[icon].includes(searchTerm));
  }, [search, haystacks]);

  // The selector lives inside the new/duplicate scene <form>, where Enter in a
  // text input submits it. Swallow it so searching never creates the scene.
  const preventSubmitOnEnter = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <Fragment>
      <div class="input-icon">
        <span class="input-icon-addon">
          <i class="fe fe-search" />
        </span>
        <Localizer>
          <input
            type="text"
            class="form-control"
            value={search}
            onInput={e => setSearch(e.target.value)}
            onKeyDown={preventSubmitOnEnter}
            placeholder={<Text id="iconSelector.searchPlaceholder" />}
          />
        </Localizer>
      </div>
      <div class={cx('row', style.iconContainer)}>
        {icons.map(icon => (
          <div class={cx('col-4 col-sm-3', style.iconCol)} key={icon}>
            <div
              class={cx('text-center', style.iconDiv, {
                [style.iconDivChecked]: value === icon
              })}
            >
              <label class={style.iconLabel} title={icon}>
                <input
                  name="icon"
                  type="radio"
                  onChange={onChange}
                  checked={value === icon}
                  value={icon}
                  class={style.iconInput}
                />
                <i
                  class={cx('fe', `fe-${icon}`, style.iconGlyph, {
                    'dark-mode-fe-none-filter': darkModeNoFilter
                  })}
                />
                <span class={style.iconName}>{get(translations, `${icon}.label`) || icon}</span>
              </label>
            </div>
          </div>
        ))}
        {icons.length === 0 && (
          <div class={cx('col-12', 'text-muted', style.noResult)}>
            <Text id="iconSelector.noResult" fields={{ search }} />
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default connect('user', {})(IconSelector);
