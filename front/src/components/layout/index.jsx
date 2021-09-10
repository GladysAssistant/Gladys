import { h } from 'preact';

const NOT_MAIN_PAGES = ['/login'];

const notMainPages = currentUrl => {
  const found = NOT_MAIN_PAGES.find(page => {
    return currentUrl.startsWith(page);
  });
  if (found) {
    return true;
  }
  return false;
};

const Layout = ({ children, ...props }) => (
  <div class="page">
    <div class={notMainPages(props.currentUrl) ? 'page-single' : 'page-main'}>{children}</div>
  </div>
);

export default Layout;
