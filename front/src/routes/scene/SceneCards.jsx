import SceneCard from './SceneCard';

const SceneCards = ({ children, ...props }) => (
  <>
    <div class="d-block d-lg-none list-group list-group-flush">
      {/* Only visible on small screens */}
      {props.scenes.map((scene, index) => (
        <SceneCard {...props} scene={scene} index={index} showMobileView />
      ))}
    </div>
    <div class="d-none d-lg-block ">
      <div class="row row-cards p-3 align-items-stretch">
        {/* Only visible on bigger screens */}
        {props.scenes.map((scene, index) => (
          <SceneCard {...props} scene={scene} index={index} showMobileView={false} />
        ))}
      </div>
    </div>
  </>
);

export default SceneCards;
