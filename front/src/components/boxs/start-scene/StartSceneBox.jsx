const StartSceneBox = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Clean Living Room</h3>
    </div>
    <div class="card-body p-3">
      <div class="row">
        <div class="col">
          <button class="btn btn-block btn-outline-primary">Start</button>
        </div>
        <div class="col">
          <button class="btn btn-block btn-outline-danger">Stop</button>
        </div>
      </div>
    </div>
  </div>
);

export default StartSceneBox;
