// /**
//  * 多边形包含判断
//  * 警告：下面这段代码会很难看，建议跳过~
//  * zrender 方案
//  */
// function _isInsidePolygon(area, x, y) {
//     /**
//      * 射线判别法
//      * 如果一个点在多边形内部，任意角度做射线肯定会与多边形要么有一个交点，要么有与多边形边界线重叠
//      * 如果一个点在多边形外部，任意角度做射线要么与多边形有一个交点，
//      * 要么有两个交点，要么没有交点，要么有与多边形边界线重叠。
//      */
//     var i;
//     var j;
//     var polygon = area;
//     var N = polygon.length;
//     var inside = false;
//     var redo = true;
//     var v;
//     var left = 0;
//     var right = 0;
//     for (i = 0; i < N; ++i) {
//         // 是否在顶点上
//         if (polygon[i].x == x && polygon[i].y == y) {
//             redo = false;
//             inside = true;
//             break;
//         }
//     }
//     if (redo) {
//         redo = false;
//         inside = false;
//         for (i = 0, j = N - 1; i < N; j = i++) {
//             if ((polygon[i].y < y && y < polygon[j].y) || (polygon[j].y < y && y < polygon[i].y)) {
//                 if (x <= polygon[i].x || x <= polygon[j].x) {
//                     v = (y - polygon[i].y) * (polygon[j].x - polygon[i].x) / (polygon[j].y - polygon[i].y) + polygon[i].x;
//                     if (x < v) { // 在线的左侧
//                         inside = !inside;
//                     } else if (x == v) { // 在线上
//                         inside = true;
//                         break;
//                     }
//                 }
//             } else if (y == polygon[i].y) {
//                 if (x < polygon[i].x) { // 交点在顶点上
//                     polygon[i].y > polygon[j].y ? --y : ++y;
//                     //redo = true;
//                     break;
//                 }
//             } else if (polygon[i].y == polygon[j].y // 在水平的边界线上
//                 && y == polygon[i].y && ((polygon[i].x < x && x < polygon[j].x) || (polygon[j].x < x && x < polygon[i].x))
//             ) {
//                 inside = true;
//                 break;
//             }
//         }
//     }
//     return inside;
// }


// var _isInsidePolygon = (function(){
//     // 根据 http://alienryderflex.com/polygon/ 改
//     var polySides;
//     var polyX = [],polyY = [];
//     var constant = [],multiple = [];
//     function precalc_values(){
//         var i ,j=polySides-1;
//         for(i=0; i<polySides; i++) {
//             if(polyY[j]==polyY[i]) {
//                 constant[i]=polyX[i];
//                 multiple[i]=0; 
//             }else {
//                 constant[i]=polyX[i]-(polyY[i]*polyX[j])/(polyY[j]-polyY[i])+(polyY[i]*polyX[i])/(polyY[j]-polyY[i]);
//                 multiple[i]=(polyX[j]-polyX[i])/(polyY[j]-polyY[i]); 
//             }
//             j=i;
//         }
//     }
//     function pointInPolygon(x,y){
//         var i, j=polySides-1 ;
//         var oddNodes = false;
//         for (i=0; i<polySides; i++) {
//             if ((polyY[i]< y && polyY[j]>=y ||   
//                 polyY[j]< y && polyY[i]>=y)) {
//                 oddNodes ^= (y*multiple[i]+constant[i]<x); 
//             }
//             j=i; 
//         }
        
//         return oddNodes;
//     }

//     return function(area,x,y){
//         polySides = area.length;
//         area.forEach(function(v){
//             polyX.push(v.x);
//             polyY.push(v.y);
//         });
//         return pointInPolygon(x,y);
//     }
// })();
// var _isInsidePolygon = (function(){
//     // 根据 http://assemblysys.com/php-point-in-polygon-algorithm/ 改
//     var pointOnVertex = true;
//     function fn_pointOnVertex(point, vertices) {
//         vertices.forEach(function(v){
//             if(v.x == point.x && v.y == point.y){
//                 return true;
//             }
//         });
//     }
//     var VERTEX = true,
//         BOUNDARY = true;
//     return function(vertices,x,y){
//         var point = {x: x,y: y};
//         if (pointOnVertex == true && fn_pointOnVertex(point, vertices) == true) {
//             return VERTEX;
//         }
//         // Check if the point is inside the polygon or on the boundary
//         var intersections = 0; 
//         var vertices_count = vertices.length;
//         for (var i=1; i < vertices_count; i++) {
//             var vertex1 = vertices[i-1]; 
//             var vertex2 = vertices[i];
//             if (vertex1['y'] == vertex2['y'] && vertex1['y'] == point['y'] && point['x'] > Math.min(vertex1['x'], vertex2['x']) && point['x'] < Math.max(vertex1['x'], vertex2['x'])) { // Check if point is on an horizontal polygon boundary
//                 return BOUNDARY;
//             }
//             if (point['y'] > Math.min(vertex1['y'], vertex2['y']) && point['y'] <= Math.max(vertex1['y'], vertex2['y']) && point['x'] <= Math.max(vertex1['x'], vertex2['x']) && vertex1['y'] != vertex2['y']) { 
//                 var xinters = (point['y'] - vertex1['y']) * (vertex2['x'] - vertex1['x']) / (vertex2['y'] - vertex1['y']) + vertex1['x']; 
//                 if (xinters == point['x']) { // Check if point is on the polygon boundary (other than horizontal)
//                     return BOUNDARY;
//                 }
//                 if (vertex1['x'] == vertex2['x'] || point['x'] <= xinters) {
//                     intersections++; 
//                 }
//             } 
//         } 
//         // If the number of edges we passed through is odd, then it's in the polygon. 
//         if (intersections % 2 != 0) {
//             return true;
//         } else {
//             return false;
//         }
//     }
// })();
var _isInsidePolygon = (function(){
    // https://github.com/substack/point-in-polygon/blob/master/index.js
    return function (vs,x,y) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i].x, yi = vs[i].y;
            var xj = vs[j].x, yj = vs[j].y;
            
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
    if(inside_num == sub_polygon_items.length){
        return true;
    }
    return false;
}
/*线是否在多边形中*/
var _lineIsInsidePolygon = function(polygon_items,line_items){
    var inside_num = 0;
    var len = line_items.length;
    line_items.forEach(function(v_line_item){
        var flag = _isInsidePolygon(polygon_items,v_line_item.x,v_line_item.y);
        
        if(flag){
            inside_num++;
        }
    });
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
exports.isInsidePolygon = _isInsidePolygon;
exports.isInLeftTopLine = _isInLeftTopLine;
exports.lineIsInsidePolygon = _lineIsInsidePolygon;
exports.polygonIsInsidePolygon = _polygonIsInsidePolygon;