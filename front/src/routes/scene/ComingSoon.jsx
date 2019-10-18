import { Text } from 'preact-i18n';

const ComingSoon = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">
              <Text id="scene.title" />
            </h1>
          </div>
          <div>
            <div>
              <div class="card">
                <div class="card-body">
                  <div class="alert alert-info">Scene support coming soon! 🚧</div>
                  <p>The scene core/API is working, but we are still working on a clean UI 🙂 Stay updated!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ComingSoon;
