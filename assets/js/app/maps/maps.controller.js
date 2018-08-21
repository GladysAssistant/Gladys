  
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('MapsCtrl', MapsCtrl);

    MapsCtrl.$inject = ['geoLocationService', 'areaService', '$translate', '$scope', 'notificationService'];

    function MapsCtrl(geoLocationService, areaService, $translate, $scope, notificationService) {
        /* jshint validthis: true */
        var vm = this;
        
        var leafletMap;
        var markerUser = {};
        var areaUser = {};

        var lastDrawnId = null;
        var lastDrawnPolyLine = null;

        vm.area = {};
        vm.createArea = createArea;
        vm.deleteArea = deleteArea;
        vm.updateArea = updateArea;
        vm.newArea = false;

        var areaText;
        var newButtonText;
        var editButtonText;
        var deleteButtonText;
        var popup = L.popup();

        getPoints();

        var icon = L.icon({
            iconUrl: '/styles/leaflet/images/marker-icon.png',
            iconRetinaUrl: '/styles/leaflet/images/marker-icon-2x.png',
            shadowUrl: '/styles/leaflet/images/marker-shadow.png',
            iconSize:[25,41],
            iconAnchor:[12,41],
            popupAnchor:[1,-34],
            tooltipAnchor:[16,-28],
            shadowSize:[41,41]
        });

        function getPoints(){
            geoLocationService.get()
                .then(function(data) {
                    vm.locations = data.data;
                    if(vm.locations.length) {
                        initMap(vm.locations[0].latitude, vm.locations[0].longitude, 10);
                    } else {

                        // eiffel tower !
                        initMap(48.858093, 2.294694, 8);
                    }
                    
                    vm.locations.forEach(function(location){
                        markerUser[location.user] = L.marker([location.latitude, location.longitude], {icon: icon}).addTo(leafletMap);
                        markerUser[location.user].bindTooltip(location.firstname + ' ' + location.lastname).openTooltip();
                        markerUser[location.user].on('click', function() {
                            drawLinesUser(location.user);
                        });
                    });

                    waitForNewValue();
                });
        }

        function initMap(latitude, longitude, zoomLevel){
            translateText()
            leafletMap = L.map('map').setView([latitude, longitude], zoomLevel);

            var CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(leafletMap);
            
            leafletMap.on('contextmenu', function(e){
                vm.newArea = true;
                vm.area = {}
                vm.area.latitude = e.latlng.lat
                vm.area.longitude = e.latlng.lng
                $scope.$apply()
                popup
                    .setLatLng(e.latlng)
                    .setContent('<b>' + areaText + '</b><br><button class="btn btn-flat btn-success" data-toggle="modal" data-target=".area-modal" style="margin-top:10px">' + newButtonText + '</button>')
                    .openOn(leafletMap)
            })

            getAreas();
        }

        function getAreas(){
            areaService.get()
                .then(function(data){
                    data.data.forEach(function(area){
                        newMapArea(area)
                    });
                });
        }

        function waitForNewValue(){
            io.socket.on('newLocation', function (location) {
                updateValue(location);
            });
        }

        function updateValue(location) {
            markerUser[location.user].setLatLng(L.latLng(location.latitude, location.longitude));
        }

        function drawLinesUser(id) {
            
            if(id == lastDrawnId){
                lastDrawnId = null;
                lastDrawnPolyLine.remove();
                return;
            }

            if(lastDrawnPolyLine){
                lastDrawnPolyLine.remove();
            }

            geoLocationService.getByUser(id, {take: 200})
                .then(function(data) {
                    var locations = data.data;
                    var latlngs = [];
                    locations.forEach(function(location){
                        latlngs.push([location.latitude, location.longitude]);
                    });

                    lastDrawnPolyLine = L.polyline(latlngs, {color: '#518cb8'}).addTo(leafletMap);
                    lastDrawnId = id;
                });
        }

        function createArea(area){
            leafletMap.closePopup()
            return areaService.create(area)
                .then(function(data){
                    newMapArea(data.data)
                    vm.area = {};
                })
                .catch(function(err) {
                    vm.area = {};
                    if(err.data && err.data.code && err.data.code == 'E_VALIDATION') {
                        for(var key in err.data.invalidAttributes) {
                            if(err.data.invalidAttributes.hasOwnProperty(key)){
                                notificationService.errorNotificationTranslated('AREA.INVALID_' + key.toUpperCase());
                            }
                        }
                    } else {
                        notificationService.errorNotificationTranslated('DEFAULT.ERROR');
                    }
                });
        }

        function updateArea(id, area){
            return areaService.update(id, area)
                .then(function(data){
                    areaUser[area.id].remove()
                    newMapArea(area)
                });
        }

        function deleteArea(id){
            return areaService.destroy(id)
              .then(function(){
                areaUser[id].remove()
              });
        }

        function newMapArea(area){
            areaUser[area.id] = L.circle([area.latitude, area.longitude], 
                {id: area.id,
                    name: area.name, 
                    longitude: 
                    area.longitude, 
                    latitude: area.latitude, 
                    radius: area.radius
                }).addTo(leafletMap);

            areaUser[area.id].on('mouseover', function(){
                areaUser[area.id].bindTooltip(area.name).openTooltip();
            })

            areaUser[area.id].on('click', function(){
                vm.newArea = false;
                vm.area = {}
                vm.area = areaUser[area.id].options;
                $scope.$apply()
                areaUser[area.id].bindPopup('<b>' + area.name + '</b><br><button class="btn btn-flat btn-primary" data-toggle="modal" data-target=".area-modal" style="margin-bottom:5px; margin-top:10px">' + editButtonText + '</button><br><button class="btn btn-flat btn-danger" id="deleteAreaButton">' + deleteButtonText + '</button>').openPopup();

                $('#deleteAreaButton').click(function(){
                    deleteArea(vm.area.id)
                })
            })

            areaUser[area.id].on({'mousedown': function () {
                    leafletMap.on('mousemove', function (e) {
                        leafletMap.dragging.disable();
                        areaUser[area.id].setLatLng(e.latlng);
                        vm.area = {}
                        vm.area = areaUser[area.id].options
                        vm.area.latitude = e.latlng.lat
                        vm.area.longitude = e.latlng.lng
                        updateArea(vm.area.id, vm.area)
                    });
                }
            });

            leafletMap.on('mouseup',function(e){
                leafletMap.dragging.enable();
                leafletMap.removeEventListener('mousemove');
            })

        }

        function translateText(){
            $translate('MAPS.AREA')
                .then(function(text) {
                    areaText = text
                });
            $translate('MAPS.NEW')
                .then(function(text) {
                    newButtonText = text
                });
            $translate('MAPS.EDIT')
                .then(function(text) {
                    editButtonText = text
                });
            $translate('MAPS.DELETE')
                .then(function(text) {
                    deleteButtonText = text 
                });
            return;
        }
    }
})();