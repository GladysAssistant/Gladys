import EditHouse from '../../../components/house/EditHouseComponent';

const House = ({ children, ...props }) => (
  <div class="card">
    <h3 class="card-header">{props.house.name}</h3>
    <div class="card-body">
      <EditHouse {...props} />
    </div>
  </div>
);

export default House;
