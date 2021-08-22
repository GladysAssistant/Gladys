import SceneCard from './SceneCard';

const SceneCards = ({ children, ...props }) => (
  <div class="row row-cards">
    {props.scenes.map((scene, index) => (
      <SceneCard {...props} scene={scene} index={index} />
    ))}
  </div>
);

export default SceneCards;
