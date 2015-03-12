exports.parse = function(lines, options){
	options || (options = {});
	options.num_of_cols = 5;
	options.val_col = 5;
	return require('./discrete').parse(lines, options);
}