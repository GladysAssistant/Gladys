import { h } from 'preact';

const PageLayout = ({ children, ...props }) => (
  <div class="my-3 my-md-5">
    <div class="page">
      <div class="page-single">
        <div class="container">{children}</div>
      </div>
    </div>
  </div>
);

export default PageLayout;
