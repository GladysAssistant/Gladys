const DataList = ({ children, ...props }) => (
  <div class="card">
    <div class="card-body">
      <ul class="list-unstyled list-separated">
        <li>{props.piholedatas.name}</li>
        <li>{props.piholedatas.value}</li>
      </ul>
    </div>
  </div>
);

export default DataList;
