import SceneCard from './SceneCard';
import style from './style.css';

const SceneCards = ({ children, ...props }) => (
  <>
    <div class={`d-block d-lg-none ${style.sceneMobileList}`}>
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
