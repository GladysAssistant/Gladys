  
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('MapsCtrl', MapsCtrl);

    MapsCtrl.$inject = ['geoLocationService', 'areaService', '$translate', '$scope', 'notificationService', 'userService', 'moment', '$timeout'];

    function MapsCtrl(geoLocationService, areaService, $translate, $scope, notificationService, userService, moment, $timeout) {
        /* jshint validthis: true */
        var vm = this;
        
        var leafletMap;
        var markerUser = {};
        var areaUser = {};
        var ways = {};
        var filteredWays = {};
        var lastDrawnId = null;
        var lastDrawnPolyLine = null;
        var polylineUser = {};
        var locs = [];

        vm.area = {};
        vm.createArea = createArea;
        vm.deleteArea = deleteArea;
        vm.updateArea = updateArea;
        vm.toggleUser = toggleUser;
        vm.newArea = false;
        vm.dates = {};
        vm.timelines = {length: 1};
        vm.users = {};

        var areaText;
        var newButtonText;
        var editButtonText;
        var deleteButtonText;
        var popup = L.popup();

        activate();

       function activate() {
           getLanguageCurrentUser().then(function(language) {
             getPoints(language);
           })
           return ;
        }

        var icon = L.icon({
            iconUrl: '/img/leaflet/marker-icon.png',
            iconRetinaUrl: '/img/leaflet/marker-icon-2x.png',
            shadowUrl: '/img/leaflet/marker-shadow.png',
            iconSize:[25,41],
            iconAnchor:[12,41],
            popupAnchor:[1,-34],
            tooltipAnchor:[16,-28],
            shadowSize:[41,41]
        });

        function getPoints(language){
            geoLocationService.get()
                .then(function(data) {
                    vm.locations = data.data;

                    if(vm.locations.length) {
                        initMap(vm.locations[0].latitude, vm.locations[0].longitude, 10);
                        for(var i = 0; i < vm.locations.length;i++) {
                          if((vm.dates.start && vm.dates.start > vm.locations[i].datetime) || !vm.dates.start) {
                            vm.dates.start = moment(vm.locations[i].datetime);
                          }
                          if((vm.dates.end && vm.dates.end < vm.locations[i].datetime) || !vm.dates.end) {
                            vm.dates.end = moment(vm.locations[i].datetime);
                          }
                        };
                    } else {

                        // eiffel tower !
                        initMap(48.858093, 2.294694, 8);
                        vm.dates.start = vm.dates.end = moment();
                    }
                    vm.max = vm.dates.end;
                    
                    $('#datetimepickerstartdate').datetimepicker({
                      locale: language
                    }).on('dp.change', function(e) {
                      vm.dates.start = vm.min = e.date;
                      if(vm.dates.start > vm.dates.end) {
                        vm.dates.end = vm.max = vm.dates.start;
                        $('#datetimepickerenddate').data("DateTimePicker").date(new Date(vm.dates.start));
                        //$('#datetimepickerstartdate').datetimepicker({date: vm.dates.start})
                      }
                      getAllPositionsByDateRange(vm.dates);
                    });
                    $('#datetimepickerenddate').datetimepicker({
                      locale: language
                    }).on('dp.change', function(e) {
                      vm.dates.end = vm.max = e.date;
                      if(vm.dates.sart > vm.dates.end) {
                        vm.dates.start = vm.min = vm.dates.end;
                        //$('#datetimepickerenddate').datetimepicker({date: vm.dates.end})
                        $('#datetimepickerstartdate').data("DateTimePicker").date(new Date(vm.dates.end));
                      }
                      getAllPositionsByDateRange(vm.dates);
                    });

                    vm.locations.forEach(function(location){
                        ways[location.user] = [];
                        vm.users[location.user] = {
                          color : 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 0.8)',
                          name : location.firstname + ' ' + location.lastname
                        }

                        markerUser[location.user] = L.marker([location.latitude, location.longitude], {icon: icon}).addTo(leafletMap);
                        markerUser[location.user].bindTooltip(vm.users[location.user].name).openTooltip();
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
            if(!area.color) {
              area.color = '#0052D4';
            } else {
              area.color = '#' + (area.color).toString(16);
            }

            areaUser[area.id] = L.circle([area.latitude, area.longitude], 
                {id: area.id,
                 name: area.name, 
                 longitude: 
                 area.longitude, 
                 latitude: area.latitude, 
                 radius: area.radius,
                 color: area.color,
                 fillColor: area.color,
                 fillOpacity: 0.2
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

        function filterPolylines(range) {
          $timeout(function() {
            vm.min = moment(locs[range[0]].datetime);
            vm.max = moment(locs[range[1]].datetime);

            for(var user in ways) {
              filteredWays[user] = [];

              if(polylineUser[user]) {
                leafletMap.removeLayer(polylineUser[user]);
              }
              for(var i = 0; i < ways[user].length; i++) {
                if(vm.min <= new Date(ways[user][i][2]) && new Date(ways[user][i][2]) <= vm.max) {
                  filteredWays[user].push(ways[user][i]);
                }
              }
              drawPolyline(filteredWays);
            } 
          });
        }

        function drawPolyline(w) {
          for (var user in w) {
            if(polylineUser[user]) {
              leafletMap.removeLayer(polylineUser[user]);
            }

            polylineUser[user] = L.polyline([w[user]],
              {
                color: vm.users[user].color,
                weight: 3,
                opacity: .8,
                dashArray: '10,8',
                lineJoin: 'round'
              }
            ).addTo(leafletMap);
          }
        }

        function toggleUser(user) {
          if(!vm.users[user].hidden) {
            leafletMap.removeLayer(polylineUser[user]);
            vm.users[user].hidden = true;
          } else {
            var tmp = {};
            if(filteredWays[user]) {
              tmp[user] = filteredWays[user];
              drawPolyline(tmp);
            } else {
              tmp[user] = ways[user];
              drawPolyline(tmp);
            }
            vm.users[user].hidden = false;
          }
        }

        function getAllPositionsByDateRange(dates) {
            dates = {
	      start: new Date(dates.start),
              end: new Date(dates.end)
            }
            return geoLocationService.getByUsersAndByDateRange(dates)
              .then(function(data) {
                locs = data.data;
                // Clear old ways
                for (var user in ways) {
                  ways[user] = [];
                }
                // resize the timeline slider
                $("#timeline_slider").slider('setAttribute', 'max', locs.length-1)
                  .slider('setAttribute', 'range', [0, locs.length-1])
                  .slider('refresh')
                  .on('change', function(e) {
                    filterPolylines(e.value.newValue);
                  });
                $(".slider-selection").css("background", "#518cb8");
                // Draw the ways on the map
                for(var i = 0; i < locs.length;i++) {
                  ways[locs[i].user].push([locs[i].latitude, locs[i].longitude, locs[i].datetime]);
                }

                drawPolyline(ways);
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

        function getLanguageCurrentUser(){
          return userService.whoAmI()
            .then(function(user){
               vm.language = user.language.substring(0,2).toLowerCase();
               return vm.language;
          });
        }
    }
})();
