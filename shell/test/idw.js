var idw = require('../libs/interpolate/idw.js');

var data = require('../../data/micaps/3/15012108.000.json');
var time_start = new Date();
var lnglat_arr = idw.genLngLatArr(73.5, 18.16, 135.09, 53.56);
var new_data = idw.interpolate(data, lnglat_arr, 6, 999999);
require('fs').writeFile('./micaps_3.json', JSON.stringify(new_data));
console.log(new Date() - time_start, 'ms')