const ErrorPage = ({ children }) => (
  <div class="d-flex justify-content-center">
    <div class="icon mr-3">
      <i class="fe fe-x text-danger" />
    </div>
    {children}
  </div>
);

export default ErrorPage;
