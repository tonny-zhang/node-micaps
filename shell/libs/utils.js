var _isInsidePolygon = (function(){
    // https://github.com/substack/point-in-polygon/blob/master/index.js
    return function (vs,x,y) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        
        /* 
            false 不在面内
            true 在面内，但不是多边形的端点
            1 在面内，又是多边形的端点
        */
        var inside = 0;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i].x, yi = vs[i].y;
            var xj = vs[j].x, yj = vs[j].y;
            if(x == xi && y == yi || x == xj && y == yj){
                return 1;
            }
            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    };
})();
/*多边形是否在另一个多边形里*/
var _polygonIsInsidePolygon = function(polygon_items,sub_polygon_items){
    var inside_num = 0;
    sub_polygon_items.forEach(function(v){
        var flag = _isInsidePolygon(polygon_items,v.x,v.y);
        if(flag){
            inside_num++;
        }
    });
    /*线切割面时由于计算得到的两交点可能稍有误差,所以判断是否在多边形中时去除两交点的检测*/
    if(inside_num >= sub_polygon_items.length-2){
        return true;
    }
    return false;
}
/*线是否在多边形中*/
var _lineIsInsidePolygon = function(polygon_items,line_items,is_through){
    var inside_num = 0;
    var len = line_items.length;
    line_items.forEach(function(v_line_item){
        var flag = _isInsidePolygon(polygon_items,v_line_item.x,v_line_item.y);
        
        if(flag){
            inside_num++;
        }
    });
    if(is_through){
        return inside_num > 2;
    }
    if(inside_num/len > 0.5){
        return true;
    }
    return false;
}
/*是否在线的左上方*/
function _isInLeftTopLine(line, x, y) {
    var n = line.length;
    var firstPoint = line.x;
    var min_x = max_x = firstPoint.x,
        min_y = max_y = firstPoint.y;
    line.forEach(function(v) {
        var _x = v.x,
            _y = v.y;
        if (_x < min_x) {
            min_x = _x;
        }
        if (_x > max_x) {
            max_x = _x;
        }
        if (_y < min_y) {
            min_y = _y;
        }
        if (_y > max_y) {
            max_y = _y;
        }
    });
    // 经纬度坐标第y轴越往上越大
    if (x < min_x || y > max_y) {
        return true;
    }
    if (x > max_x || y < min_y) {
        return false;
    }
    for (var i = 0; i < n - 1; i++) {
        var x1 = line[i].x,
            x2 = line[i + 1].x,
            y1 = line[i].y,
            y2 = line[i + 1].y;

        if (x1 == x2) {
            if (x1 == x) {
                return false;
            } else if (x > x1) {
                if (y < Math.max(y1, y2)) {
                    return false;
                }
            }
        } else {
            if (x >= Math.min(x1, x2) && x <= Math.max(x1, x2)) {
                var k = (y1 - y2) / (x1 - x2);
                var b = (x1 * y2 - x2 * y1) / (x1 - x2);

                var y_v = k * x + b;
                if (y_v >= y) {
                    return false;
                }
            }
        }
    }
    return true;
}
var Digit = {
    toFixed: function(num, places){
        if(!isNaN(num)){
            num = num.toFixed(places||4)
        }
        return num;
    }
}
exports.isInsidePolygon = _isInsidePolygon;
exports.isInLeftTopLine = _isInLeftTopLine;
exports.lineIsInsidePolygon = _lineIsInsidePolygon;
exports.polygonIsInsidePolygon = _polygonIsInsidePolygon;

exports.Digit = Digit;