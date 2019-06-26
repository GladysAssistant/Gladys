const HumidityBox = ({ children, ...props }) => (
  <div class="card">
    <div class="card-body p-3 text-center">
      <div class="text-right text-green">
        6%
        <i class="fe fe-chevron-up" />
      </div>
      <div class="h1 m-0">70%</div>
      <div class="text-muted mb-4">Bathroom</div>
    </div>
  </div>
);

export default HumidityBox;
