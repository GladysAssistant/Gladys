import SceneCard from './SceneCard';

const SceneCards = ({ children, ...props }) => (
  <div class="row row-cards">
    {props.scenes.map(scene => (
      <SceneCard {...props} scene={scene} />
    ))}
  </div>
);

export default SceneCards;
