exports.parse = function(lines, options){
	options || (options = {});
	options.num_of_cols = 12;
	// options.val_col = 7;
	return require('./discrete').parse(lines, options);
}