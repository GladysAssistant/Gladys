import { h } from 'preact';

const NOT_MAIN_PAGES = ['/login'];

const Layout = ({ children, ...props }) => (
  <div class="page">
    <div class={NOT_MAIN_PAGES.includes(props.currentUrl) ? 'page-single' : 'page-main'}>{children}</div>
  </div>
);

export default Layout;
