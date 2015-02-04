var parse = require('../libs/parser').parse;

var time_start = new Date();
parse('../../data/micaps_source/3/15020402.000', function(err, data){
	if(err){
		console.log(err);
	}else{
		console.log(data);
	}
	console.log(new Date().getTime() - time_start.getTime());
});