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
import normalizeSearchText from '../../utils/normalizeSearchText';

// Fold both the query and the searched text down to plain lowercase letters:
// the shared search fold takes care of the case, of the accents and of the
// ligatures, so "eclair" finds "éclair", "coeur" finds "Cœur" and
// "vergrossern" finds "vergrößern". Icons take a stricter fold than the rest
// of the front on top of it: everything that is not a letter or a digit goes
// too, so "door open", "door-open" and "dooropen" all match the same icon.
const normalize = (value) => normalizeSearchText(value).replace(/[^a-z0-9]/g, '');

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
    [translations],
  );

  const icons = useMemo(() => {
    const searchTerm = normalize(search);
    if (searchTerm.length === 0) {
      return iconList;
    }
    return iconList.filter((icon) => haystacks[icon].includes(searchTerm));
  }, [search, haystacks]);

  // The selector lives inside the new/duplicate scene <form>, where Enter in a
  // text input submits it. Swallow it so searching never creates the scene.
  const preventSubmitOnEnter = (e) => {
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
            onInput={(e) => setSearch(e.target.value)}
            onKeyDown={preventSubmitOnEnter}
            placeholder={<Text id="iconSelector.searchPlaceholder" />}
          />
        </Localizer>
      </div>
      <div class={cx('row', style.iconContainer)}>
        {icons.map((icon) => {
          const label = get(translations, `${icon}.label`) || icon;
          return (
            <div class={cx('col-4 col-sm-3', style.iconCol)} key={icon}>
              <div
                class={cx('text-center', style.iconDiv, {
                  [style.iconDivChecked]: value === icon,
                })}
              >
                {/* The tile is a fixed size, so a long label can be clamped:
                    keep the full one — and the icon name — on hover. */}
                <label class={style.iconLabel} title={`${label} · ${icon}`}>
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
                      'dark-mode-fe-none-filter': darkModeNoFilter,
                    })}
                  />
                  <span class={style.iconName}>{label}</span>
                </label>
              </div>
            </div>
          );
        })}
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
