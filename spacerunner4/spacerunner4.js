(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var perlin = require("./perlin");
var point_1 = require("./point");
var marchingsquares_1 = require("./marchingsquares");
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");
var worldSize = (1 << 10) + 1;
var gridSize = 32;
var simplex_scale = 256;
var simplex_offset = 0.25;
var speed_damp = 0.02;
var rot_damp = 8;
var thrust = 75;
var rotation = 32;
var falloff_grids = 5;
var shipColors = [
    "DarkRed",
    "DarkOrange",
    "Gold",
    "Green",
    "Blue",
    "Purple",
];
function sign(x) {
    if (x < 0) {
        return -1;
    }
    else if (x > 0) {
        return 1;
    }
    else {
        return 0;
    }
}
function has(arr, v) {
    return arr.some(function (x) { return x == v; });
}
var Camera = (function () {
    function Camera(center) {
        var offset = new point_1.Point(canvas.width / 2, canvas.height / 2);
        this.delta = point_1.Point.sub(offset, center);
    }
    Camera.prototype.fill = function (poly, color) {
        ctx.fillStyle = color;
        this.drawImpl(poly);
        ctx.fill();
    };
    Camera.prototype.draw = function (poly, color) {
        ctx.strokeStyle = color;
        this.drawImpl(poly);
        ctx.stroke();
    };
    Camera.prototype.drawImpl = function (poly) {
        ctx.beginPath();
        for (var index = 0; index < poly.length; index++) {
            var element = point_1.Point.add(poly[index], this.delta);
            if (index == 0) {
                ctx.moveTo(element.x, element.y);
            }
            else {
                ctx.lineTo(element.x, element.y);
            }
        }
        ctx.closePath();
    };
    Camera.prototype.draw_segments = function (poly, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (var _i = 0, poly_1 = poly; _i < poly_1.length; _i++) {
            var _a = poly_1[_i], start = _a[0], end = _a[1];
            ctx.moveTo(start.x + this.delta.x, start.y + this.delta.y);
            ctx.lineTo(end.x + this.delta.x, end.y + this.delta.y);
        }
        ctx.stroke();
    };
    Camera.prototype.grid = function (color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (var i = 0; i < canvas.width + gridSize; i += gridSize) {
            var x = Math.floor((i - this.delta.x) / gridSize) * gridSize + this.delta.x;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (var i = 0; i < canvas.width + gridSize; i += gridSize) {
            var y = Math.floor((i - this.delta.y) / gridSize) * gridSize + this.delta.y;
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(-worldSize + this.delta.x, -worldSize + this.delta.y);
        ctx.lineTo(worldSize + this.delta.x, -worldSize + this.delta.y);
        ctx.lineTo(worldSize + this.delta.x, worldSize + this.delta.y);
        ctx.lineTo(-worldSize + this.delta.x, worldSize + this.delta.y);
        ctx.closePath();
        ctx.stroke();
    };
    return Camera;
}());
var CameraTrack = (function () {
    function CameraTrack(point) {
        this.point = point;
    }
    CameraTrack.prototype.track = function (newPoint, deltaSeconds) {
        var damp = 1 / deltaSeconds;
        this.point = point_1.Point.mul(point_1.Point.add(point_1.Point.mul(this.point, damp), newPoint), 1 / (damp + 1));
    };
    return CameraTrack;
}());
var SimplexWorld = (function () {
    function SimplexWorld() {
        var mapped_start = Math.floor(worldSize / gridSize);
        var mapped_size = mapped_start * 2;
        var outside_boundary = worldSize / gridSize - falloff_grids;
        this.lines = marchingsquares_1.marching_squares(function (x, y) {
            var outside = Math.max(x - outside_boundary, -x - outside_boundary, y - outside_boundary, -y - outside_boundary, 0.0) / falloff_grids;
            return perlin.simplex2(x * gridSize / simplex_scale, y * gridSize / simplex_scale) + simplex_offset - outside * outside * (1 + simplex_offset);
        }, mapped_size, mapped_size, -mapped_start, -mapped_start);
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var item = _a[_i];
            item[0] = point_1.Point.mul(item[0], gridSize);
            item[1] = point_1.Point.mul(item[1], gridSize);
        }
    }
    SimplexWorld.prototype.draw = function (camera, point) {
        camera.draw_segments(this.lines, "green");
    };
    SimplexWorld.prototype.test = function (point) {
        var cardinality = 0;
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var _b = _a[_i], start = _b[0], end = _b[1];
            if (start.y <= point.y && end.y >= point.y ||
                start.y >= point.y && end.y <= point.y) {
                var slope = (end.y - start.y) / (end.x - start.x);
                var intercept = start.y - slope * start.x;
                var intersect_x = (point.y - intercept) / slope;
                if (intersect_x < point.x) {
                    cardinality++;
                }
            }
        }
        return cardinality % 2 !== 0;
    };
    return SimplexWorld;
}());
var Ship = (function () {
    function Ship(pos, rot) {
        this.pos = pos;
        this.vel = new point_1.Point(0, 0);
        this.rot = rot;
        this.rotVel = 0;
        this.color = shipColors[Math.floor(Math.random() * shipColors.length)];
        this.throttle = false;
        this.rotating = 0;
        this.lastUpdate = 0;
    }
    Ship.prototype.points = function () {
        var radius = 10;
        var theta = Math.PI * 4 / 5;
        var offsets = [
            new point_1.Point(Math.cos(this.rot + theta) * radius, Math.sin(this.rot + theta) * radius),
            new point_1.Point(Math.cos(this.rot - theta) * radius, Math.sin(this.rot - theta) * radius),
            new point_1.Point(Math.cos(this.rot) * radius, Math.sin(this.rot) * radius),
        ];
        for (var i = 0; i < offsets.length; i++) {
            offsets[i] = point_1.Point.add(this.pos, offsets[i]);
        }
        return offsets;
    };
    Ship.prototype.thrustPoints = function () {
        var radius = 10;
        var length = 2;
        var theta = Math.PI * 7 / 8;
        var offsets = [
            new point_1.Point(Math.cos(this.rot + theta) * radius, Math.sin(this.rot + theta) * radius),
            new point_1.Point(Math.cos(this.rot - theta) * radius, Math.sin(this.rot - theta) * radius),
            new point_1.Point(Math.cos(this.rot) * radius * -length, Math.sin(this.rot) * radius * -length),
        ];
        for (var i = 0; i < offsets.length; i++) {
            offsets[i] = point_1.Point.add(this.pos, offsets[i]);
        }
        return offsets;
    };
    Ship.prototype.draw = function (camera) {
        camera.draw(this.points(), this.color);
        if (this.throttle) {
            camera.draw(this.thrustPoints(), "red");
        }
    };
    Ship.prototype.update = function (deltaSeconds) {
        var my_speed_damp = 1 - speed_damp * deltaSeconds;
        var my_rot_damp = 1 - rot_damp * deltaSeconds;
        var my_thrust = thrust * deltaSeconds;
        var my_rotation = rotation * deltaSeconds;
        my_speed_damp = Math.max(my_speed_damp, 0.1);
        my_rot_damp = Math.max(my_rot_damp, 0.1);
        if (this.throttle) {
            var thrustDir = new point_1.Point(Math.cos(this.rot), Math.sin(this.rot));
            this.vel = point_1.Point.add(this.vel, point_1.Point.mul(thrustDir, my_thrust));
        }
        if (this.rotating != 0) {
            this.rotVel += sign(this.rotating) * my_rotation;
        }
        this.vel = point_1.Point.mul(this.vel, my_speed_damp);
        this.rotVel *= my_rot_damp;
        this.pos = point_1.Point.add(this.pos, point_1.Point.mul(this.vel, deltaSeconds));
        this.rot += this.rotVel * deltaSeconds;
    };
    Ship.prototype.updateMe = function (pressedKeys, deltaSeconds) {
        if (has(pressedKeys, 37) || has(pressedKeys, 65)) {
            this.rotating = -1;
        }
        else if (has(pressedKeys, 39) || has(pressedKeys, 68)) {
            this.rotating = 1;
        }
        else {
            this.rotating = 0;
        }
        if (has(pressedKeys, 38) || has(pressedKeys, 87)) {
            this.throttle = true;
        }
        else {
            this.throttle = false;
        }
        if (has(pressedKeys, 40) || has(pressedKeys, 83)) {
        }
        this.update(deltaSeconds);
    };
    return Ship;
}());
function updateScene(ship, camera, pressedKeys, deltaSeconds) {
    ship.updateMe(pressedKeys, deltaSeconds);
    var toTrack = new point_1.Point(ship.pos.x + ship.vel.x * 2, ship.pos.y + ship.vel.y * 2);
    camera.track(toTrack, deltaSeconds);
}
function drawScene(center, ship, simplexWorld) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var camera = new Camera(center);
    simplexWorld.draw(camera, ship.pos);
    camera.grid("grey");
    ship.draw(camera);
}
function resize() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (canvas.width != width ||
        canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
}
var previousMillis = 0;
var ship = new Ship(new point_1.Point(Math.random() * 100 - 50, Math.random() * 100 - 50), 0);
var cameraTrack = new CameraTrack(ship.pos);
var pressedKeys = new Array();
var simplexWorld = new SimplexWorld();
function frame(currentMillis) {
    var deltaSeconds = (currentMillis - previousMillis) / 1000;
    previousMillis = currentMillis;
    deltaSeconds = Math.min(deltaSeconds, 1);
    resize();
    updateScene(ship, cameraTrack, pressedKeys, deltaSeconds);
    drawScene(cameraTrack.point, ship, simplexWorld);
    window.requestAnimationFrame(frame);
}
function keyDown(e) {
    if (!has(pressedKeys, e.keyCode)) {
        pressedKeys.push(e.keyCode);
    }
}
function keyUp(e) {
    for (var i = pressedKeys.length - 1; i >= 0; i--) {
        if (pressedKeys[i] === e.keyCode) {
            pressedKeys.splice(i, 1);
        }
    }
}
window.requestAnimationFrame(frame);
window.addEventListener('keydown', keyDown, false);
window.addEventListener('keyup', keyUp, false);

},{"./marchingsquares":2,"./perlin":3,"./point":4}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var point_1 = require("./point");
function marching_squares(func, width, height, off_x, off_y) {
    var arr = new Array();
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            one_square(func, x + off_x, y + off_y, arr);
        }
    }
    return arr;
}
exports.marching_squares = marching_squares;
function one_square(func, x, y, arr) {
    var v00 = func(x, y);
    var v01 = func(x + 1, y);
    var v10 = func(x, y + 1);
    var v11 = func(x + 1, y + 1);
    var eny_val = v00 / (v00 - v01);
    var epy_val = v10 / (v10 - v11);
    var enx_val = v00 / (v00 - v10);
    var epx_val = v01 / (v01 - v11);
    var eny = new point_1.Point(eny_val + x, 0.0 + y);
    var epy = new point_1.Point(epy_val + x, 1.0 + y);
    var enx = new point_1.Point(0.0 + x, enx_val + y);
    var epx = new point_1.Point(1.0 + x, epx_val + y);
    var square_type = 0;
    if (v00 < 0) {
        square_type += 8;
    }
    if (v01 < 0) {
        square_type += 4;
    }
    if (v11 < 0) {
        square_type += 2;
    }
    if (v10 < 0) {
        square_type += 1;
    }
    switch (square_type) {
        case 0: break;
        case 1:
            arr.push([enx, epy]);
            break;
        case 2:
            arr.push([epy, epx]);
            break;
        case 3:
            arr.push([enx, epx]);
            break;
        case 4:
            arr.push([epx, eny]);
            break;
        case 5:
            if (func(x + 0.5, y + 0.5) < 0) {
                arr.push([enx, eny]);
                arr.push([epx, epy]);
            }
            else {
                arr.push([enx, epy]);
                arr.push([epx, eny]);
            }
            break;
        case 6:
            arr.push([epy, eny]);
            break;
        case 7:
            arr.push([enx, eny]);
            break;
        case 8:
            arr.push([eny, enx]);
            break;
        case 9:
            arr.push([eny, epy]);
            break;
        case 10:
            if (func(x + 0.5, y + 0.5) < 0) {
                arr.push([epy, enx]);
                arr.push([eny, epx]);
            }
            else {
                arr.push([epy, epx]);
                arr.push([eny, enx]);
            }
            break;
        case 11:
            arr.push([eny, epx]);
            break;
        case 12:
            arr.push([epx, enx]);
            break;
        case 13:
            arr.push([epx, epy]);
            break;
        case 14:
            arr.push([epy, enx]);
            break;
        case 15: break;
    }
}

},{"./point":4}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Grad = (function () {
    function Grad(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Grad.prototype.dot2 = function (x, y) {
        return this.x * x + this.y * y;
    };
    Grad.prototype.dot3 = function (x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    };
    return Grad;
}());
var grad3 = [
    new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)
];
var p = [151, 160, 137, 91, 90, 15,
    131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
    77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
    5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
    223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
var perm = new Array(512);
var gradP = new Array(512);
function seed(seed) {
    if (seed > 0 && seed < 1) {
        seed *= 65536;
    }
    seed = Math.floor(seed);
    if (seed < 256) {
        seed |= seed << 8;
    }
    for (var i = 0; i < 256; i++) {
        var v;
        if (i & 1) {
            v = p[i] ^ (seed & 255);
        }
        else {
            v = p[i] ^ ((seed >> 8) & 255);
        }
        perm[i] = perm[i + 256] = v;
        gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
}
exports.seed = seed;
;
seed(0);
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;
var F3 = 1 / 3;
var G3 = 1 / 6;
function simplex2(xin, yin) {
    var n0, n1, n2;
    var s = (xin + yin) * F2;
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var t = (i + j) * G2;
    var x0 = xin - i + t;
    var y0 = yin - j + t;
    var i1, j1;
    if (x0 > y0) {
        i1 = 1;
        j1 = 0;
    }
    else {
        i1 = 0;
        j1 = 1;
    }
    var x1 = x0 - i1 + G2;
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2;
    var y2 = y0 - 1 + 2 * G2;
    i &= 255;
    j &= 255;
    var gi0 = gradP[i + perm[j]];
    var gi1 = gradP[i + i1 + perm[j + j1]];
    var gi2 = gradP[i + 1 + perm[j + 1]];
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
        n0 = 0;
    }
    else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot2(x0, y0);
    }
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
        n1 = 0;
    }
    else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
        n2 = 0;
    }
    else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    return 70 * (n0 + n1 + n2);
}
exports.simplex2 = simplex2;
;
function simplex3(xin, yin, zin) {
    var n0, n1, n2, n3;
    var s = (xin + yin + zin) * F3;
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var k = Math.floor(zin + s);
    var t = (i + j + k) * G3;
    var x0 = xin - i + t;
    var y0 = yin - j + t;
    var z0 = zin - k + t;
    var i1, j1, k1;
    var i2, j2, k2;
    if (x0 >= y0) {
        if (y0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        }
        else if (x0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        }
        else {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        }
    }
    else {
        if (y0 < z0) {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        }
        else if (x0 < z0) {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        }
        else {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        }
    }
    var x1 = x0 - i1 + G3;
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;
    var x2 = x0 - i2 + 2 * G3;
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;
    var x3 = x0 - 1 + 3 * G3;
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;
    i &= 255;
    j &= 255;
    k &= 255;
    var gi0 = gradP[i + perm[j + perm[k]]];
    var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
    var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
    var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];
    var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) {
        n0 = 0;
    }
    else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot3(x0, y0, z0);
    }
    var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) {
        n1 = 0;
    }
    else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) {
        n2 = 0;
    }
    else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) {
        n3 = 0;
    }
    else {
        t3 *= t3;
        n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    return 32 * (n0 + n1 + n2 + n3);
}
exports.simplex3 = simplex3;
;
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}
function perlin2(x, y) {
    var X = Math.floor(x), Y = Math.floor(y);
    x = x - X;
    y = y - Y;
    X = X & 255;
    Y = Y & 255;
    var n00 = gradP[X + perm[Y]].dot2(x, y);
    var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
    var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
    var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);
    var u = fade(x);
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
}
exports.perlin2 = perlin2;
;
function perlin3(x, y, z) {
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    x = x - X;
    y = y - Y;
    z = z - Z;
    X = X & 255;
    Y = Y & 255;
    Z = Z & 255;
    var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
    var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
    var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
    var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
    var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
    var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
    var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
    var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);
    var u = fade(x);
    var v = fade(y);
    var w = fade(z);
    return lerp(lerp(lerp(n000, n100, u), lerp(n001, n101, u), w), lerp(lerp(n010, n110, u), lerp(n011, n111, u), w), v);
}
exports.perlin3 = perlin3;
;

},{}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.add = function (left, right) {
        return new Point(left.x + right.x, left.y + right.y);
    };
    Point.sub = function (left, right) {
        return new Point(left.x - right.x, left.y - right.y);
    };
    Point.mul = function (left, right) {
        return new Point(left.x * right, left.y * right);
    };
    return Point;
}());
exports.Point = Point;

},{}]},{},[1]);
