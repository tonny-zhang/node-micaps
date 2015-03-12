exports.parse = function(lines, options){
	options || (options = {});
	options.num_of_cols = 24;
	options.val_col = 7;
	return require('./discrete').parse(lines, options);
}