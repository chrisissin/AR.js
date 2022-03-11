import * as AFRAME from 'aframe';

AFRAME.registerComponent('gps-new-camera', {
    schema: {
        simulateLatitude: {
            type: 'number',
            default: 0
        },
        simulateLongitude: {
            type: 'number',
            default: 0
        },
        simulateAltitude: {
            type: 'number',
            default: -Number.MAX_VALUE
        },
        gpsMinDistance: {
            type: 'number',
            default: 0
        },
        positionMinAccuracy: {
            type: 'number',
            default: 100
        }
    },


    init: function() {
        this.threeLoc = new THREEx.LocationBased(
            this.el.sceneEl.object3D, 
            this.el.object3D
        );

        this.threeLoc.on("gpsupdate", gpspos => { 
            this._sendGpsUpdateEvent(gpspos.coords.longitude, gpspos.coords.latitude);
        });

        // from original gps-camera component
        // if Safari
        if (!!navigator.userAgent.match(/Version\/[\d.]+.*Safari/)) {
            this._setupSafariOrientationPermissions();
        }
    },

    update: function(oldData) {
        this.threeLoc.setGpsOptions({
            gpsMinAccuracy: this.data.positionMinAccuracy,
            gpsMinDistance: this.data.gpsMinDistance,
        });
        if((this.data.simulateLatitude !== 0 || this.data.simulateLongitude !== 0) && (this.data.simulateLatitude != oldData.simulateLatitude || this.data.simulateLongitude != oldData.simulateLongitude)) {

            this.threeLoc.fakeGps(
                this.data.simulateLongitude,
                this.data.simulateLatitude
            );
            this.data.simulateLatitude = 0;
            this.data.simulateLongitude = 0;
        }
        if(this.data.simulateAltitude > -Number.MAX_VALUE) {
            this.threeLoc.setElevation(this.data.simulateAltitude + 1.6);
        }
    },

    play: function() {
        if(this.data.simulateLatitude === 0 && this.data.simulateLongitude === 0) {
            this.threeLoc.startGps();
        }
    },

    pause: function() {
        this.threeLoc.stopGps();
    },

    _sendGpsUpdateEvent: function(lon, lat) {
        this.el.emit('gps-camera-update-position', {
            position: {    
                longitude: lon,
                latitude: lat
            }
        });
    },

    // from original gps-camera component
    _setupSafariOrientationPermissions: function() {
        // iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            var handler = function() {
                console.log('Requesting device orientation permissions...')
                DeviceOrientationEvent.requestPermission();
                document.removeEventListener('touchend', handler);
            };

            document.addEventListener('touchend', function() { handler() }, false);

            this.el.sceneEl.systems['arjs']._displayErrorPopup('After camera permission prompt, please tap the screen to activate geolocation.');
        } else {
            var timeout = setTimeout(function() {
                this.el.sceneEl.systems['arjs']._displayErrorPopup('Please enable device orientation in Settings > Safari > Motion & Orientation Access.');
            }, 750);
            window.addEventListener(eventName, function() {
                clearTimeout(timeout);
            });
        }
    }
});
