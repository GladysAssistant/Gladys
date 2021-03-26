const DataList = ({ children, ...props }) => (
  <div class="card">
    <div class="card-body">
      <ul class="list-unstyled list-separated">
        <li>{props.piholedatas}</li>
      </ul>
    </div>
  </div>
);

export default DataList;
