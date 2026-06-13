/* טוען את כל קבצי סמלי-לוח (סינכרוני, לפני app.js) */
(function () {
  "use strict";
  var base = "סמלי-לוח/";
  var files = [
    "primitives.js",
    "qa-mccb-3p.js", "qa-mccb-1p.js",
    "kd-mcb-1p.js", "kd-mcb-2p.js", "kd-mcb-3p.js", "kd-mcb-4p.js",
    "fc-fuse-1p.js", "fc-fuse-3p.js",
    "bo-rcd-2p.js", "bo-rcd-4p.js",
    "rcbo-1p.js", "rcbo-3p.js",
    "qa1-contactor-1p.js", "qa1-contactor-3p.js",
    "ie-motor-breaker-1p.js", "ie-motor-breaker-3p.js",
    "fk-fuse-switch-1p.js", "fk-fuse-switch-3p.js",
    "kd-isolator-1p.js", "kd-isolator-3p.js",
    "pc-spd-1p.js", "pc-spd-3p.js",
    "ma-motor-1p.js", "ma-motor-3p.js",
    "heater-1p.js", "heater-3p.js",
    "trafo-1p.js", "trafo-3p.js",
    "pj-siren.js",
    "xs-socket-1p.js", "xs-socket-3p.js",
    "x-terminal.js", "ca-capacitor.js",
    "pf-lamp.js", "xd-lamp.js", "fluor-lamp.js",
    "switch-1p.js", "switch-2p.js",
    "sj-button-no.js", "sj-button-nc.js",
    "sh-selector-2pos.js", "sh-selector-3pos.js",
    "bt-potentiometer.js", "bt-thermostat.js",
    "pb-relay-1p.js", "pb-relay-3p.js", "pb-timer-1p.js",
    "kf-relay-1p.js", "kf-relay-3p.js", "kf-earth-relay.js",
    "tc-shunt-1p.js", "tc-shunt-3p.js",
    "tv-controller.js",
    "bc-ct-1p.js", "bc-ct-3p.js",
    "ta-ammeter.js", "ta-voltmeter.js", "ta-multimeter.js",
    "aux-contact-no.js", "aux-contact-nc.js",
    "w-busbar.js", "pe-ground.js", "n-neutral.js", "pg-enclosure.js",
    "index.js",
  ];
  for (var i = 0; i < files.length; i++) {
    document.write('<script src="' + base + files[i] + '"><\/script>');
  }
})();
