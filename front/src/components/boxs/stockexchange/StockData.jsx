const StockData = ({ children, ...props }) => (
  <li class="list-separated-item">
    <div class="row align-items-center">
      <div class="col-auto">
        <span class={props.percentage < 0 ? "stamp stamp-md bg-red mr-3":"stamp stamp-md bg-green mr-3"}>
        <i class={props.percentage < 0 ? "fe fe-thumbs-down":"fe fe-thumbs-up"} />
        </span>
      </div>
      <div class="col-auto">
        <h4 class="m-0">{props.name}</h4>
        <small class="text-muted">{props.index}</small>
        <small  style={props.percentage < 0 ? "color:red":"color:green"} >
         ({props.percentage}%)
         </small>
      </div>
    </div>
  </li>
);

export default StockData;
