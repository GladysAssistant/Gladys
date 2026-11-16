import { Component } from 'preact';
import leaflet from 'leaflet';
import { connect } from 'unistore/preact';

import 'leaflet/dist/leaflet.css';
import { addMapTileLayer, removeMapWhenSettled } from '../../utils/mapTileLayer';
import mapStyle from './style.css';
import style from './mobileArea.css';
import { clampRadius, roundRadius, parseRadius, formatRadius } from './areaRadius';

const DEFAULT_COORDS = [48.8583, 2.2945];
const DEFAULT_ZOOM = 2;
const MAX_FIT_ZOOM = 18;
const HANDLE_SIZE_PX = 44;
// the room kept around the zone when the map is fitted to it: its handle and its label stay in
const FIT_PADDING_PX = 56;
const SMALL_FIT_PADDING_PX = 40;
const SMALL_MAP_PX = 300;
const HOUSES_PADDING_PX = 48;
const HOUSES_MAX_ZOOM = 15;
// below this size on screen the resize handle would sit on the center one: it is hidden, the
// radius is then set from the panel
const MIN_RESIZE_HANDLE_RADIUS_PX = 26;
// a zone placed from far away is approached by steps: a tap on a map of the world is not precise
const TAP_ZOOM_STEP = 4;
// a press that moves less than this is a tap, not a drag of the circle
const DRAG_THRESHOLD_PX = 4;
// the click the browser sends at the end of a drag is not a tap on the map
const CLICK_AFTER_DRAG_MS = 350;
const EAST = 90;
const EARTH_RADIUS = 6371000;

const toRadians = degrees => (degrees * Math.PI) / 180;
const toDegrees = radians => (radians * 180) / Math.PI;

// the point at `distance` meters from a position, in the direction `bearing` (degrees from north)
const destinationPoint = (latitude, longitude, distance, bearing) => {
  const angularDistance = distance / EARTH_RADIUS;
  const direction = toRadians(bearing);
  const fromLatitude = toRadians(latitude);
  const fromLongitude = toRadians(longitude);
  const toLatitude = Math.asin(
    Math.sin(fromLatitude) * Math.cos(angularDistance) +
      Math.cos(fromLatitude) * Math.sin(angularDistance) * Math.cos(direction)
  );
  const toLongitude =
    fromLongitude +
    Math.atan2(
      Math.sin(direction) * Math.sin(angularDistance) * Math.cos(fromLatitude),
      Math.cos(angularDistance) - Math.sin(fromLatitude) * Math.sin(toLatitude)
    );
  return [toDegrees(toLatitude), toDegrees(toLongitude)];
};

const bearingBetween = (from, to) => {
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);
  const deltaLongitude = toRadians(to.lng - from.lng);
  const y = Math.sin(deltaLongitude) * Math.cos(toLatitude);
  const x =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(deltaLongitude);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

const hasCenter = props =>
  props.latitude !== null && props.latitude !== undefined && props.longitude !== null && props.longitude !== undefined;

const handleIcon = (knobClass, color, content = '') =>
  leaflet.divIcon({
    className: style.handle,
    iconSize: [HANDLE_SIZE_PX, HANDLE_SIZE_PX],
    iconAnchor: [HANDLE_SIZE_PX / 2, HANDLE_SIZE_PX / 2],
    html: `<span class="${knobClass}" style="border-color: ${color}">${content}</span>`
  });

/**
 * @description The map a zone is drawn on with a finger (docs/specs/mobile-pages/map-areas.md,
 * C): a tap places its center, the circle (or its center handle) is dragged to move it without
 * panning the map, and the handle on its edge is dragged to resize it — the radius follows the
 * finger and is written above the handle. Anywhere else, a finger pans and two fingers zoom.
 *
 * The zone itself (latitude, longitude, radius, color) lives in the page: the map reports the
 * gestures through `setLatLong` and `setRadius`. A change coming from the page (the slider, "my
 * position") fits the map to the zone; one coming from a gesture leaves the view to the user.
 */
class MobileAreaMap extends Component {
  constructor(props) {
    super(props);
    this.houseMarkers = [];
    // the direction of the resize handle from the center: where the user left it
    this.handleBearing = EAST;
    // what the gestures last reported: a change of the props equal to it is not fitted
    this.sentCenter = null;
    this.sentRadius = null;
  }

  componentDidMount() {
    this.initMap();
    if (typeof ResizeObserver === 'function') {
      // the map changes size with the panel under it and when the phone is turned
      this.resizeObserver = new ResizeObserver(() => {
        if (this.leafletMap) {
          this.leafletMap.invalidateSize({ debounceMoveend: true });
        }
      });
      this.resizeObserver.observe(this.mapElement);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.darkMode !== this.props.darkMode) {
      // the other set of tiles, on the same view
      const center = this.leafletMap.getCenter();
      this.initMap({ center: [center.lat, center.lng], zoom: this.leafletMap.getZoom(), keepView: true });
      return;
    }
    if (prevProps.houses !== this.props.houses) {
      this.displayHouses();
      if (!hasCenter(this.props)) {
        this.fitHouses();
      }
    }
    const centerChanged = prevProps.latitude !== this.props.latitude || prevProps.longitude !== this.props.longitude;
    const radiusChanged = prevProps.radius !== this.props.radius;
    if (centerChanged || radiusChanged || prevProps.color !== this.props.color) {
      const centerFromGesture =
        this.sentCenter &&
        this.sentCenter.latitude === this.props.latitude &&
        this.sentCenter.longitude === this.props.longitude;
      const radiusFromGesture = this.sentRadius !== null && this.sentRadius === this.props.radius;
      const fromThePage = (centerChanged && !centerFromGesture) || (radiusChanged && !radiusFromGesture);
      this.drawArea();
      if (fromThePage && !this.resizing) {
        this.fitArea(Boolean(this.areaWasDrawn));
      } else if (this.tapped) {
        // a tap placed a zone larger than what the map shows
        this.keepAreaInView();
      }
      this.tapped = false;
      this.areaWasDrawn = hasCenter(this.props);
    }
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.removeArea();
    // once the frames queued by the basemap layer have run (utils/mapTileLayer.js): the page
    // may be switching to its desktop layout in the middle of a resize
    removeMapWhenSettled(this.leafletMap);
    this.leafletMap = null;
  }

  setMapRef = element => {
    this.mapElement = element;
  };

  initMap = (view = {}) => {
    if (this.leafletMap) {
      this.removeArea();
      this.leafletMap.remove();
    }
    this.houseMarkers = [];
    this.leafletMap = leaflet.map(this.mapElement).setView(view.center || DEFAULT_COORDS, view.zoom || DEFAULT_ZOOM);
    // the attribution of the basemap alone: with the "Leaflet" prefix it takes two lines of a
    // narrow screen, over the zone
    this.leafletMap.attributionControl.setPrefix(false);
    addMapTileLayer(this.leafletMap, this.props.darkMode);
    this.leafletMap.on('click', this.onMapClick);
    this.leafletMap.on('zoomend', this.syncResizeHandle);
    this.displayHouses();
    this.drawArea();
    if (view.keepView) {
      return;
    }
    if (hasCenter(this.props)) {
      this.fitArea(false);
      this.areaWasDrawn = true;
    } else {
      this.fitHouses();
    }
  };

  // ---------- houses ----------

  displayHouses = () => {
    this.houseMarkers.forEach(marker => marker.remove());
    this.houseMarkers = (this.props.houses || [])
      .filter(house => house.latitude && house.longitude)
      .map(house =>
        leaflet
          .marker([house.latitude, house.longitude], {
            icon: leaflet.icon({
              iconUrl: '/assets/images/home-icon.png',
              iconSize: [40, 40],
              className: mapStyle.houseIconImage
            }),
            // a tap on a house places the zone there, like a tap anywhere else
            interactive: false,
            keyboard: false
          })
          .addTo(this.leafletMap)
      );
  };

  fitHouses = () => {
    if (this.houseMarkers.length === 0) {
      return;
    }
    const group = leaflet.featureGroup(this.houseMarkers);
    this.leafletMap.fitBounds(group.getBounds(), {
      padding: [HOUSES_PADDING_PX, HOUSES_PADDING_PX],
      maxZoom: HOUSES_MAX_ZOOM,
      animate: false
    });
  };

  // ---------- the zone ----------

  getRadius = () => parseRadius(this.props.radius);

  formatRadius = radius => formatRadius(radius, this.props.language);

  removeArea = () => {
    if (this.circleElement) {
      this.circleElement.removeEventListener('pointerdown', this.onCirclePointerDown);
      this.circleElement.removeEventListener('mousedown', this.stopPropagation);
      this.circleElement.removeEventListener('touchstart', this.stopPropagation);
      this.circleElement.removeEventListener('pointermove', this.onCirclePointerMove);
      this.circleElement.removeEventListener('pointerup', this.onCirclePointerUp);
      this.circleElement.removeEventListener('pointercancel', this.onCirclePointerUp);
      this.circleElement = null;
    }
    [this.circle, this.centerMarker, this.resizeMarker].forEach(layer => {
      if (layer) {
        layer.remove();
      }
    });
    this.circle = null;
    this.centerMarker = null;
    this.resizeMarker = null;
    this.circleDrag = null;
    this.resizing = false;
  };

  // Draws the zone of the props: the circle, the handle of its center and the one of its edge
  drawArea = () => {
    if (!this.leafletMap) {
      return;
    }
    const radius = this.getRadius();
    if (!hasCenter(this.props) || radius === null) {
      this.removeArea();
      return;
    }
    const { latitude, longitude, color } = this.props;
    const center = [latitude, longitude];
    if (!this.circle) {
      this.circle = leaflet
        .circle(center, { radius, color, fillColor: color, fillOpacity: 0.2, className: style.zoneCircle })
        .addTo(this.leafletMap);
      this.circleElement = this.circle.getElement();
      if (this.circleElement) {
        this.circleElement.addEventListener('pointerdown', this.onCirclePointerDown);
        // Leaflet starts the pan of the map on "touchstart" where the browser has touch events,
        // on "pointerdown" elsewhere, and on "mousedown" for a mouse: none of them reaches it
        this.circleElement.addEventListener('mousedown', this.stopPropagation);
        this.circleElement.addEventListener('touchstart', this.stopPropagation, { passive: true });
        this.circleElement.addEventListener('pointermove', this.onCirclePointerMove);
        this.circleElement.addEventListener('pointerup', this.onCirclePointerUp);
        this.circleElement.addEventListener('pointercancel', this.onCirclePointerUp);
      }
      this.centerMarker = leaflet
        .marker(center, {
          icon: handleIcon(style.centerKnob, color),
          draggable: true,
          autoPan: false,
          zIndexOffset: 900,
          title: this.props.moveLabel
        })
        .addTo(this.leafletMap);
      this.centerMarker.on('drag', this.onCenterDrag);
      this.centerMarker.on('dragend', this.onCenterDragEnd);
      this.resizeMarker = leaflet.marker(destinationPoint(latitude, longitude, radius, this.handleBearing), {
        icon: handleIcon(style.resizeKnob, color, '&#8596;'),
        draggable: true,
        autoPan: false,
        zIndexOffset: 1000,
        title: this.props.resizeLabel
      });
      this.resizeMarker.bindTooltip(this.formatRadius(radius), {
        permanent: true,
        direction: 'top',
        offset: [0, -14],
        className: style.radiusLabel
      });
      this.resizeMarker.on('dragstart', this.onResizeStart);
      this.resizeMarker.on('drag', this.onResizeDrag);
      this.resizeMarker.on('dragend', this.onResizeEnd);
      this.shownColor = color;
    } else if (!this.resizing) {
      this.circle.setLatLng(center);
      this.circle.setRadius(radius);
      this.centerMarker.setLatLng(center);
      this.resizeMarker.setLatLng(destinationPoint(latitude, longitude, radius, this.handleBearing));
      this.resizeMarker.setTooltipContent(this.formatRadius(radius));
    }
    if (this.shownColor !== color) {
      this.shownColor = color;
      this.circle.setStyle({ color, fillColor: color });
      this.centerMarker.setIcon(handleIcon(style.centerKnob, color));
      this.resizeMarker.setIcon(handleIcon(style.resizeKnob, color, '&#8596;'));
    }
    this.syncResizeHandle();
  };

  // The handle of the edge is only shown while the circle is large enough on screen to keep it
  // clear of the handle of the center
  syncResizeHandle = () => {
    if (!this.circle || !this.resizeMarker || this.resizing) {
      return;
    }
    const map = this.leafletMap;
    const centerPoint = map.latLngToContainerPoint(this.circle.getLatLng());
    const edgePoint = map.latLngToContainerPoint(this.resizeMarker.getLatLng());
    const visible = centerPoint.distanceTo(edgePoint) >= MIN_RESIZE_HANDLE_RADIUS_PX;
    if (visible && !map.hasLayer(this.resizeMarker)) {
      this.resizeMarker.addTo(map);
    } else if (!visible && map.hasLayer(this.resizeMarker)) {
      this.resizeMarker.remove();
    }
  };

  // What the map keeps free around the zone when it is fitted to it: room for its handle and its
  // label, less on a small map, and at the bottom what covers the map — the attribution, and the
  // rounded edge of the panel
  getFitPadding = () => {
    const size = this.leafletMap.getSize();
    const padding = Math.min(size.x, size.y) < SMALL_MAP_PX ? SMALL_FIT_PADDING_PX : FIT_PADDING_PX;
    const corner = this.mapElement.querySelector('.leaflet-bottom.leaflet-right');
    const covered = corner ? this.mapElement.getBoundingClientRect().bottom - corner.getBoundingClientRect().top : 0;
    // never more than a third of the map: on a very low one the zone keeps most of the room
    const bottom = Math.min(Math.max(0, covered), size.y / 3);
    return { paddingTopLeft: [padding, padding], paddingBottomRight: [padding, padding / 2 + bottom] };
  };

  // Brings the whole zone into view
  fitArea = (animate = true) => {
    if (!this.circle) {
      return;
    }
    this.leafletMap.fitBounds(this.circle.getBounds(), {
      ...this.getFitPadding(),
      maxZoom: MAX_FIT_ZOOM,
      animate
    });
  };

  // After a gesture the view is the user's: it only moves when the zone left it
  keepAreaInView = () => {
    if (this.circle && !this.leafletMap.getBounds().contains(this.circle.getBounds())) {
      this.fitArea();
    }
  };

  // Moves the layers of the zone under a finger, without telling the page yet
  moveLayers = latlng => {
    this.circle.setLatLng(latlng);
    this.centerMarker.setLatLng(latlng);
    const radius = this.circle.getRadius();
    this.resizeMarker.setLatLng(destinationPoint(latlng.lat, latlng.lng, radius, this.handleBearing));
  };

  // The stored longitude is the one of the main copy of the world, whichever copy was touched
  commitCenter = latlng => {
    const { lat, lng } = leaflet.latLng(latlng).wrap();
    this.sentCenter = { latitude: lat, longitude: lng };
    this.props.setLatLong(lat, lng);
  };

  commitRadius = radius => {
    this.sentRadius = radius;
    this.props.setRadius(radius);
  };

  // ---------- gestures ----------

  onMapClick = event => {
    if (this.suppressClickUntil && Date.now() < this.suppressClickUntil) {
      return;
    }
    const map = this.leafletMap;
    const radius = this.getRadius();
    this.tapped = true;
    this.commitCenter(event.latlng);
    if (radius === null) {
      return;
    }
    // a zone too small to be seen at this zoom: the map comes closer, by steps
    const bounds = leaflet.latLng(event.latlng).toBounds(radius * 2);
    const fitZoom = Math.min(MAX_FIT_ZOOM, map.getBoundsZoom(bounds, false, [FIT_PADDING_PX, FIT_PADDING_PX]));
    const radiusInPixels = radius / this.metersPerPixel(event.latlng.lat);
    if (radiusInPixels < MIN_RESIZE_HANDLE_RADIUS_PX && fitZoom > map.getZoom()) {
      map.setView(event.latlng, Math.min(fitZoom, map.getZoom() + TAP_ZOOM_STEP));
    }
  };

  metersPerPixel = latitude =>
    (40075016.686 * Math.abs(Math.cos(toRadians(latitude)))) / Math.pow(2, this.leafletMap.getZoom() + 8);

  stopPropagation = event => event.stopPropagation();

  // The circle is taken with a finger (or the mouse): the press does not reach the map, which
  // would pan under it
  onCirclePointerDown = event => {
    if (this.circleDrag || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }
    event.stopPropagation();
    const map = this.leafletMap;
    const startPoint = map.mouseEventToContainerPoint(event);
    const centerPoint = map.latLngToContainerPoint(this.circle.getLatLng());
    this.circleDrag = {
      pointerId: event.pointerId,
      startPoint,
      // the circle keeps the point it was taken by under the finger
      offset: centerPoint.subtract(startPoint),
      moved: false
    };
    try {
      this.circleElement.setPointerCapture(event.pointerId);
    } catch (e) {
      // the pointer may already be gone: the gesture still works while it stays on the circle
    }
  };

  onCirclePointerMove = event => {
    const drag = this.circleDrag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const map = this.leafletMap;
    const point = map.mouseEventToContainerPoint(event);
    if (!drag.moved && point.distanceTo(drag.startPoint) < DRAG_THRESHOLD_PX) {
      return;
    }
    drag.moved = true;
    event.preventDefault();
    drag.latlng = map.containerPointToLatLng(point.add(drag.offset));
    this.moveLayers(drag.latlng);
  };

  onCirclePointerUp = event => {
    const drag = this.circleDrag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    this.circleDrag = null;
    if (!drag.moved || !drag.latlng) {
      // a tap on the circle: the click that follows places the center there
      return;
    }
    this.suppressClickUntil = Date.now() + CLICK_AFTER_DRAG_MS;
    if (event.type === 'pointercancel') {
      // the browser took the gesture back: the zone returns where it was
      this.drawArea();
      return;
    }
    this.commitCenter(drag.latlng);
    this.keepAreaInView();
  };

  onCenterDrag = event => this.moveLayers(event.target.getLatLng());

  onCenterDragEnd = event => {
    this.suppressClickUntil = Date.now() + CLICK_AFTER_DRAG_MS;
    this.commitCenter(event.target.getLatLng());
    this.keepAreaInView();
  };

  onResizeStart = () => {
    this.resizing = true;
  };

  // The radius is the distance from the center to the finger, within the bounds of a zone
  onResizeDrag = event => {
    const center = this.circle.getLatLng();
    const handle = event.target.getLatLng();
    const radius = roundRadius(clampRadius(center.distanceTo(handle)));
    this.handleBearing = bearingBetween(center, handle);
    this.circle.setRadius(radius);
    this.resizeMarker.setTooltipContent(this.formatRadius(radius));
    if (radius !== this.getRadius()) {
      this.commitRadius(radius);
    }
  };

  onResizeEnd = () => {
    this.resizing = false;
    this.suppressClickUntil = Date.now() + CLICK_AFTER_DRAG_MS;
    // the handle goes back on the edge of the circle, in the direction it was left
    this.drawArea();
    this.keepAreaInView();
  };

  render() {
    return <div ref={this.setMapRef} class={style.map} data-cy="zone-map" />;
  }
}

export default connect('darkMode', {})(MobileAreaMap);
