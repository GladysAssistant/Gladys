import { h } from 'preact';
import { isUrlInArray } from '../../utils/url';

const NOT_MAIN_PAGES = ['/login', '/authorize'];

const Layout = ({ children, ...props }) => (
  <div class="page">
    <div class={isUrlInArray(props.currentUrl, NOT_MAIN_PAGES) ? 'page-single' : 'page-main'}>{children}</div>
  </div>
);

export default Layout;
