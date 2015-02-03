var parse = require('../libs/parser').parse;

parse('../../data/micaps_source/14/haze020308.024', function(err, data){
	if(err){
		console.log(err);
	}else{
		console.log(data);
	}
});