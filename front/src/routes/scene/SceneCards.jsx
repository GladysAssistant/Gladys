import SceneCard from './SceneCard';

const SceneCards = ({ children, ...props }) => (
  <div class="row row-cards p-3 align-items-stretch">
    {props.scenes.map((scene, index) => (
      <SceneCard {...props} scene={scene} index={index} />
    ))}
  </div>
);

export default SceneCards;
