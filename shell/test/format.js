var parse = require('../libs/parser').parse;

parse('../../data/micaps_source/14/14110508.000', function(err, data){
	if(err){
		console.log(err);
	}else{
		console.log(data);
	}
});