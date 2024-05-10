import { Component, createRef } from 'preact';
import * as THREE from 'three';
import { createNoise3D, createNoise2D } from 'simplex-noise';
import { connect } from 'unistore/preact';
import style from './style.css';

class SpeakBox extends Component {
  ref = createRef();
  camera = null;
  rendered = null;
  audio = null;

  onWindowResize = () => {
    if (this.camera && this.renderer) {
      const width = this.ref.current.offsetWidth;
      const height = this.ref.current.offsetHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  };

  speak = async url => {
    if (this.audio) {
      this.audio.src = url;
      this.audio.crossOrigin = 'anonymous';
      this.audio.load();
      this.audio.play();
      const randomNumber = Math.floor(Math.random() * (20001 - 8000)) + 8000;
      /* setTimeout(
        () => this.speak('https://gladys-gateway-test.fra1.digitaloceanspaces.com/presence.mp3'),
        randomNumber
      ); */
    }
  };

  animate = async () => {
    /* const { url } = await this.props.httpClient.post('/api/v1/gateway/tts', {
      text: 'Bonjour monsieur, il fait très chaud aujourdhui'
    }); */
    const noise2D = createNoise2D();
    const noise3D = createNoise3D();
    const width = this.ref.current.offsetWidth;
    const height = this.ref.current.offsetHeight;
    this.audio = new Audio();

    let context = new AudioContext();
    let src = context.createMediaElementSource(this.audio);
    let analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);
    let scene = new THREE.Scene();
    let group = new THREE.Group();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(scene.position);
    scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    let planeGeometry = new THREE.PlaneGeometry(1000, 1000, 20, 20);
    let planeMaterial = new THREE.MeshLambertMaterial({
      color: 0x0052d4,
      side: THREE.DoubleSide,
      wireframe: true
    });

    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);
    //   group.add(plane);

    let plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -30, 0);
    // group.add(plane2);

    let icosahedronGeometry = new THREE.IcosahedronGeometry(20, 3);
    let lambertMaterial = new THREE.MeshLambertMaterial({
      color: 0x65c7f7,
      wireframe: true
    });

    let ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    let ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    let spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);

    scene.add(group);

    document.getElementById('out').appendChild(this.renderer.domElement);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      let lowerHalfArray = dataArray.slice(0, dataArray.length / 2 - 1);
      let upperHalfArray = dataArray.slice(dataArray.length / 2 - 1, dataArray.length - 1);

      let overallAvg = avg(dataArray);
      let lowerMax = max(lowerHalfArray);
      let lowerAvg = avg(lowerHalfArray);
      let upperMax = max(upperHalfArray);
      let upperAvg = avg(upperHalfArray);

      let lowerMaxFr = lowerMax / lowerHalfArray.length;
      let lowerAvgFr = lowerAvg / lowerHalfArray.length;
      let upperMaxFr = upperMax / upperHalfArray.length;
      let upperAvgFr = upperAvg / upperHalfArray.length;

      makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
      makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));

      makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

      group.rotation.y += 0.005;
      this.renderer.render(scene, this.camera);
      requestAnimationFrame(render);
    };

    render();

    function makeRoughBall(mesh, bassFr, treFr) {
      mesh.geometry.vertices.forEach((vertex, i) => {
        let offset = mesh.geometry.parameters.radius;
        let amp = 7;
        let time = window.performance.now();
        vertex.normalize();
        let rf = 0.00001;
        let distance =
          offset +
          bassFr +
          noise3D(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) * amp * treFr;
        vertex.multiplyScalar(distance);
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    function makeRoughGround(mesh, distortionFr) {
      mesh.geometry.vertices.forEach((vertex, i) => {
        let amp = 2;
        let time = Date.now();
        let distance = (noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
        vertex.z = distance;
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    function fractionate(val, minVal, maxVal) {
      return (val - minVal) / (maxVal - minVal);
    }

    function modulate(val, minVal, maxVal, outMin, outMax) {
      let fr = fractionate(val, minVal, maxVal);
      let delta = outMax - outMin;
      return outMin + fr * delta;
    }

    function avg(arr) {
      let total = arr.reduce((sum, b) => {
        return sum + b;
      });
      return total / arr.length;
    }

    function max(arr) {
      return arr.reduce((a, b) => {
        return Math.max(a, b);
      });
    }
  };

  componentDidMount() {
    this.animate();
    const randomNumber = Math.floor(Math.random() * 10001);
    setTimeout(() => this.speak('https://gladys-gateway-test.fra1.digitaloceanspaces.com/voice.mp3'), randomNumber);
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {};
  }

  render({}, {}) {
    return <div id="out" ref={this.ref} class={style.speakWidgetBottomRight} />;
  }
}

export default connect('httpClient,user', {})(SpeakBox);
