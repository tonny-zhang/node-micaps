var parse = require('../libs/parser').parse;

var time_start = new Date();
parse('../../data/micaps_source/3/15020402.000', {
	x0: 80,
	y0: 90,
	x1: 90,
	y1: 90,
	grid_space: 0.1,
	numOfNearest: 6,
	default_val: 99,
	interpolation_all: true
}, function(err, data){
	// if(err){
	// 	console.log(err);
	// }else{
	// 	console.log(data);
	// }
	console.log(new Date().getTime() - time_start.getTime());
});