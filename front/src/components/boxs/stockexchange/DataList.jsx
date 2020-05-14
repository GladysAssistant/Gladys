import StockData from './StockData';

const DataList = ({ children, ...props }) => (
  <div class="card">
    <div class="card-body">
      <ul class="list-unstyled list-separated">
      {props.datas.map((quote) => (
        <StockData {...props} name={quote.name} index={quote.price} percentage={parseFloat(quote.changesPercentage)}  />
      ))}
      </ul>
    </div>
  </div>
);

export default DataList;
