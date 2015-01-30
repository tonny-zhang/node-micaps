var micaps_3 = require('../../libs/types/3.js');
var data = require('../../1.json');
var area = micaps_3.stroke(data[0]);
console.log(area);
console.log(area.length);
// require('fs').writeFile('../../2.json', JSON.stringify(area));