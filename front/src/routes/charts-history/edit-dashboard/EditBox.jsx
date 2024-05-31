import EditChartHistoric from '../../../components/boxs/chart/EditChartHistoric';

const EditBox = ({ children, ...props }) => {
  props.box.type = 'chart-history';
  return <EditChartHistoric {...props} />;
};

export default EditBox;
