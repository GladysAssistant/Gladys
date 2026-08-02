import { Fragment } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { Localizer, Text } from 'preact-i18n';
import cx from 'classnames';

import iconList from '../../../../server/config/icons.json';
import style from './IconSelector.css';

// Icon names are kebab-case ("door-open"), so fold both sides down to plain
// alphanumerics: "door open", "door-open" and "dooropen" all find the icon.
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const IconSelector = ({ value, onChange, darkModeNoFilter = false }) => {
  const [search, setSearch] = useState('');

  const icons = useMemo(() => {
    const searchTerm = normalize(search);
    if (searchTerm.length === 0) {
      return iconList;
    }
    return iconList.filter(icon => normalize(icon).includes(searchTerm));
  }, [search]);

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
          <div class="col-2" key={icon}>
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
                  class={cx('fe', `fe-${icon}`, {
                    'dark-mode-fe-none-filter': darkModeNoFilter
                  })}
                />
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

export default IconSelector;
