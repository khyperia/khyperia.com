(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var point_1 = require("./point");
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");
var screen_size = 225;
var Camera = (function () {
    function Camera(center, scale) {
        var normalizing_scale = ((canvas.width + canvas.height) / 2) / screen_size;
        this.delta = point_1.Point.sub(new point_1.Point(0, 0), center);
        this.scale = scale * normalizing_scale;
    }
    Camera.prototype.resize = function () {
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        if (canvas.width != width ||
            canvas.height != height) {
            canvas.width = width;
            canvas.height = height;
        }
    };
    Camera.prototype.clear = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    Camera.prototype.begin = function () {
        this.resize();
        this.clear();
    };
    Camera.prototype.fill = function (poly, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        this.drawImpl(poly);
        ctx.closePath();
        ctx.fill();
    };
    Camera.prototype.draw = function (poly, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        this.drawImpl(poly);
        ctx.closePath();
        ctx.stroke();
    };
    Camera.prototype.line = function (poly, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        this.drawImpl(poly);
        ctx.stroke();
    };
    Camera.prototype.transform = function (point) {
        return point_1.Point.add(point_1.Point.mul(point_1.Point.add(point, this.delta), this.scale), new point_1.Point(canvas.width / 2, canvas.height / 2));
    };
    Camera.prototype.transform_scale = function (distance) {
        return distance * this.scale;
    };
    Camera.prototype.drawImpl = function (poly) {
        for (var index = 0; index < poly.length; index++) {
            var element = this.transform(poly[index]);
            if (index == 0) {
                ctx.moveTo(element.x, element.y);
            }
            else {
                ctx.lineTo(element.x, element.y);
            }
        }
    };
    Camera.prototype.draw_segments = function (poly, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        for (var _i = 0, poly_1 = poly; _i < poly_1.length; _i++) {
            var _a = poly_1[_i], start_world = _a[0], end_world = _a[1];
            var start = this.transform(start_world);
            var end = this.transform(end_world);
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        }
        ctx.stroke();
    };
    Camera.prototype.circle = function (center, radius, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        var center_draw = this.transform(center);
        ctx.arc(center_draw.x, center_draw.y, this.transform_scale(radius), 0, 2 * Math.PI);
        ctx.stroke();
    };
    Camera.prototype.text = function (value, line) {
        ctx.strokeStyle = "Black";
        ctx.font = "16px sans-serif";
        ctx.fillText(value, 10, 15 + line * 20);
    };
    return Camera;
}());
exports.Camera = Camera;
var CameraTrack = (function () {
    function CameraTrack(point) {
        this.point = point;
    }
    CameraTrack.prototype.track = function (position, velocity, deltaSeconds) {
        var newPoint = point_1.Point.add(position, point_1.Point.mul(velocity, 2));
        var damp = 1 / deltaSeconds;
        this.point = point_1.Point.mul(point_1.Point.add(point_1.Point.mul(this.point, damp), newPoint), 1 / (damp + 1));
    };
    return CameraTrack;
}());
exports.CameraTrack = CameraTrack;

},{"./point":5}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var point_1 = require("./point");
var camera_1 = require("./camera");
var simplexworld_1 = require("./simplexworld");
var rand_1 = require("./rand");
var ship_size = 2;
var ship_shape_angle = 0.5;
var speed_damp = 0.02;
var rot_damp = 6;
var thrust = 18;
var rotation = 25;
var max_reset = 0.75;
var shipColors = [
    "DarkRed",
    "DarkOrange",
    "Gold",
    "Green",
    "Blue",
    "Purple",
];
var Settings = (function () {
    function Settings() {
        if (!location.hash) {
            location.hash = "" + ((Math.random() * 10000) | 0);
        }
        var random = rand_1.rngFromString(location.hash);
        var rng = random.nextFloat.bind(random);
        simplexworld_1.seedWorld(rng());
        this.ship_color = shipColors[Math.floor(rng() * shipColors.length)];
        this.spawn_point = simplexworld_1.SimplexWorld.choose_start(rng);
        this.target_point = simplexworld_1.SimplexWorld.choose_end(rng);
    }
    return Settings;
}());
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
function ship_points(pos, rot) {
    var offsets = [
        new point_1.Point(Math.cos(rot + ship_shape_angle) * -ship_size, Math.sin(rot + ship_shape_angle) * -ship_size),
        new point_1.Point(Math.cos(rot - ship_shape_angle) * -ship_size, Math.sin(rot - ship_shape_angle) * -ship_size),
        new point_1.Point(Math.cos(rot) * ship_size, Math.sin(rot) * ship_size),
    ];
    for (var i = 0; i < offsets.length; i++) {
        offsets[i] = point_1.Point.add(pos, offsets[i]);
    }
    return offsets;
}
var Ship = (function () {
    function Ship(settings, world) {
        this.pos = new point_1.Point(0, 0);
        this.vel = new point_1.Point(0, 0);
        this.rot = 0;
        this.rotVel = 0;
        this.throttle = false;
        this.rotating = 0;
        this.color = settings.ship_color;
        this.world = world;
        this.settings = settings;
        this.respawn();
    }
    Ship.prototype.points = function () {
        return ship_points(this.pos, this.rot);
    };
    Ship.prototype.thrustPoints = function () {
        var theta = ship_shape_angle / 2;
        var offsets = [
            new point_1.Point(Math.cos(this.rot + theta) * -ship_size, Math.sin(this.rot + theta) * -ship_size),
            new point_1.Point(Math.cos(this.rot - theta) * -ship_size, Math.sin(this.rot - theta) * -ship_size),
            new point_1.Point(Math.cos(this.rot) * -2 * ship_size, Math.sin(this.rot) * -2 * ship_size),
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
    Ship.prototype.test = function () {
        for (var _i = 0, _a = this.points(); _i < _a.length; _i++) {
            var point = _a[_i];
            if (this.world.test(point)) {
                return true;
            }
        }
        return false;
    };
    Ship.prototype.respawn = function () {
        this.pos = this.settings.spawn_point;
        this.rot = 0;
        this.rotVel = 0;
        this.vel = new point_1.Point(0, 0);
        this.throttle = false;
        this.rotating = 0;
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
        if (this.test()) {
            return true;
        }
        else {
            return false;
        }
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
        return this.update(deltaSeconds);
    };
    return Ship;
}());
var Target = (function () {
    function Target(settings) {
        this.pos = settings.target_point;
        this.win = 0;
    }
    Target.prototype.draw = function (camera) {
        for (var i = 1; i < 10 + this.win; i++) {
            camera.circle(this.pos, Target.targetRadius / 10 * i, "Blue");
        }
    };
    Target.prototype.update = function (ship) {
        if (this.win > 0) {
            this.win += 1;
        }
        if (this.win > 20) {
            this.win = 1;
        }
        if (this.win == 0) {
            var diff = point_1.Point.sub(ship.pos, this.pos);
            var dist = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
            if (dist < Target.targetRadius) {
                this.win = 1;
            }
        }
        return this.win != 0;
    };
    Target.targetRadius = 10;
    return Target;
}());
var ship_record_update_rate = 0.1;
var ShipRecord = (function () {
    function ShipRecord() {
        this.history = [];
        this.lastUpdate = 0;
    }
    ShipRecord.prototype.update = function (ship, deltaSeconds) {
        this.lastUpdate += deltaSeconds;
        if (this.lastUpdate > ship_record_update_rate) {
            this.lastUpdate = this.lastUpdate % ship_record_update_rate;
            this.history.push(ship.pos);
        }
    };
    ShipRecord.prototype.draw = function (camera, time) {
        camera.line(this.history, "#a0a0a0");
    };
    return ShipRecord;
}());
var HighScore = (function () {
    function HighScore() {
        this.highScore = 0;
        this.lastScore = 0;
    }
    HighScore.prototype.onFinish = function (time) {
        this.lastScore = time;
        if (time < this.highScore || this.highScore == 0) {
            this.highScore = time;
        }
    };
    HighScore.prototype.draw = function (camera, time) {
        camera.text("high score: " + this.highScore, 0);
        camera.text("last score: " + this.lastScore, 1);
        camera.text("curr score: " + time, 2);
    };
    return HighScore;
}());
var Universe = (function () {
    function Universe() {
        var settings = new Settings();
        this.simplex_world = new simplexworld_1.SimplexWorld();
        this.ship = new Ship(settings, this.simplex_world);
        this.camera_track = new camera_1.CameraTrack(this.ship.pos);
        this.target = new Target(settings);
        this.pressedKeys = new Array();
        this.previousMillis = 0;
        this.reset = 0;
        this.cur_record = new ShipRecord();
        this.high_score = new HighScore();
        this.records = [];
        this.current_time = 0;
        this.draw_records = true;
    }
    Universe.prototype.updateScene = function (deltaSeconds) {
        this.current_time += deltaSeconds;
        if (this.reset == 0) {
            this.cur_record.update(this.ship, deltaSeconds);
            if (this.ship.updateMe(this.pressedKeys, deltaSeconds)) {
                this.reset += deltaSeconds;
            }
        }
        this.camera_track.track(this.ship.pos, this.ship.vel, deltaSeconds);
        if (this.target.update(this.ship)) {
            if (this.reset == 0) {
                this.high_score.onFinish(this.current_time);
                this.reset += deltaSeconds;
            }
        }
        if (this.reset > 0) {
            this.reset += deltaSeconds;
            if (this.reset > max_reset) {
                this.reset = -max_reset + 0.0001;
                this.doReset();
            }
        }
        else if (this.reset < 0) {
            this.reset += deltaSeconds;
            if (this.reset >= 0) {
                this.reset = 0;
            }
        }
    };
    Universe.prototype.doReset = function () {
        this.ship.respawn();
        this.camera_track.point = this.ship.pos;
        if (this.target.win != 0) {
            this.records.push(this.cur_record);
        }
        this.cur_record = new ShipRecord();
        while (this.records.length > 100) {
            this.records.splice(0, 1);
        }
        this.target.win = 0;
        this.current_time = 0;
    };
    Universe.prototype.drawScene = function () {
        var reset_x = this.reset * (Math.PI / (2 * max_reset));
        var scale = Math.exp(Math.log(1.5) * (Math.tan(reset_x) - reset_x));
        var camera = new camera_1.Camera(this.camera_track.point, scale);
        camera.begin();
        this.simplex_world.draw(camera, this.ship.pos);
        if (this.draw_records) {
            for (var _i = 0, _a = this.records; _i < _a.length; _i++) {
                var record = _a[_i];
                record.draw(camera, this.current_time);
            }
        }
        this.ship.draw(camera);
        this.target.draw(camera);
        this.high_score.draw(camera, this.current_time);
    };
    Universe.prototype.frame = function (currentMillis) {
        var _this = this;
        var deltaSeconds = (currentMillis - this.previousMillis) / 1000;
        this.previousMillis = currentMillis;
        deltaSeconds = Math.min(deltaSeconds, 1);
        this.updateScene(deltaSeconds);
        this.drawScene();
        window.requestAnimationFrame(function (x) { return _this.frame(x); });
    };
    Universe.prototype.keyDown = function (e) {
        if (e.keyCode == 32) {
            this.draw_records = !this.draw_records;
        }
        if (!has(this.pressedKeys, e.keyCode)) {
            this.pressedKeys.push(e.keyCode);
        }
    };
    Universe.prototype.keyUp = function (e) {
        for (var i = this.pressedKeys.length - 1; i >= 0; i--) {
            if (this.pressedKeys[i] === e.keyCode) {
                this.pressedKeys.splice(i, 1);
            }
        }
    };
    Universe.prototype.register = function () {
        var _this = this;
        window.requestAnimationFrame(function (x) { return _this.frame(x); });
        window.addEventListener('keydown', function (x) { return _this.keyDown(x); }, false);
        window.addEventListener('keyup', function (x) { return _this.keyUp(x); }, false);
    };
    return Universe;
}());
new Universe().register();

},{"./camera":1,"./point":5,"./rand":6,"./simplexworld":7}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var point_1 = require("./point");
function marching_squares_aligned(func, width, height, center_x, center_y, grid_size) {
    var true_start_x = center_x - width;
    var true_start_y = center_y - height;
    var start_x = Math.floor((center_x - width) / grid_size);
    var start_y = Math.floor((center_y - height) / grid_size);
    var end_x = Math.ceil((center_x + width) / grid_size);
    var end_y = Math.ceil((center_y + height) / grid_size);
    var adj_width = end_x - start_x;
    var adj_height = end_y - start_y;
    var result = marching_squares(function (x, y) { return func(x * grid_size + true_start_x, y * grid_size + true_start_y); }, adj_width, adj_height);
    for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
        var item = result_1[_i];
        item[0] = point_1.Point.add(point_1.Point.mul(item[0], grid_size), new point_1.Point(true_start_x, true_start_y));
        item[1] = point_1.Point.add(point_1.Point.mul(item[1], grid_size), new point_1.Point(true_start_x, true_start_y));
    }
    return result;
}
exports.marching_squares_aligned = marching_squares_aligned;
function marching_squares(func, width, height) {
    var points = new Array();
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            points.push(center_square(func, x, y));
        }
    }
    var arr = new Array();
    for (var y = 0; y < height - 1; y++) {
        for (var x = 0; x < width - 1; x++) {
            if (do_line(func, x + 1, y, 0, 1)) {
                arr.push([points[y * width + x], points[y * width + x + 1]]);
            }
            if (do_line(func, x, y + 1, 1, 0)) {
                arr.push([points[y * width + x], points[(y + 1) * width + x]]);
            }
        }
    }
    return arr;
}
exports.marching_squares = marching_squares;
function do_line(func, x, y, dx, dy) {
    var center = func(x, y);
    var other = func(x + dx, y + dy);
    return (center < 0) != (other < 0);
}
function center_square(func, x, y) {
    var p = [
        edge_point(func, x, y, 1, 0),
        edge_point(func, x, y + 1, 1, 0),
        edge_point(func, x, y, 0, 1),
        edge_point(func, x + 1, y, 0, 1)
    ].filter(function (x) { return x !== null; });
    if (p.length == 0) {
        return null;
    }
    var sum = p.reduce(function (left, right) { return point_1.Point.add(left, right); });
    return point_1.Point.mul(sum, 1.0 / p.length);
}
function edge_point(func, x, y, dx, dy) {
    var center = func(x, y);
    var other = func(x + dx, y + dy);
    var val = center / (center - other);
    if (val < 0 || val > 1) {
        return null;
    }
    return new point_1.Point(x + dx * val, y + dy * val);
}

},{"./point":5}],4:[function(require,module,exports){
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
        var v = void 0;
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
"use strict";
exports.__esModule = true;
function hashString(str) {
    var hash = 0, i, chr;
    if (str.length === 0)
        return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}
;
var RNG = (function () {
    function RNG(seed) {
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }
    RNG.prototype.nextInt = function () {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    };
    RNG.prototype.nextFloat = function () {
        return this.nextInt() / (this.m - 1);
    };
    RNG.prototype.nextRange = function (start, end) {
        var rangeSize = end - start;
        var randomUnder1 = this.nextInt() / this.m;
        return start + Math.floor(randomUnder1 * rangeSize);
    };
    RNG.prototype.choice = function (array) {
        return array[this.nextRange(0, array.length)];
    };
    return RNG;
}());
function rngFromString(str) {
    str = str.replace(/^#/, "");
    var num = +str;
    if (isNaN(num)) {
        return new RNG(hashString(str));
    }
    else {
        return new RNG(num | 0);
    }
}
exports.rngFromString = rngFromString;

},{}],7:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var point_1 = require("./point");
var perlin = require("./perlin");
var marchingsquares_1 = require("./marchingsquares");
var worldWidth = (1 << 8);
var worldHeight = (1 << 6);
var gridSize = 4;
var simplex_scale = 32;
var simplex_offset = 0.25;
var falloff_grids = 5;
function seedWorld(seed) {
    perlin.seed(seed);
}
exports.seedWorld = seedWorld;
var SimplexWorld = (function () {
    function SimplexWorld() {
        this.lines = marchingsquares_1.marching_squares_aligned(SimplexWorld.sample_noise, worldWidth, worldHeight, 0, 0, gridSize);
        var min = 0;
        var max = 0;
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var _b = _a[_i], start = _b[0], end = _b[1];
            min = Math.min(min, start.x);
            max = Math.max(max, start.x);
        }
        console.log("Test min: " + min);
        console.log("Test max: " + max);
    }
    SimplexWorld.sample_noise = function (x, y) {
        var boundary_size = falloff_grids * gridSize;
        var pad_y = Math.max(Math.abs(y) - (worldHeight - boundary_size), 0) / boundary_size;
        var pad_x = Math.max(Math.abs(x) - (worldWidth - boundary_size), 0) / boundary_size;
        var pad = Math.max(pad_x * pad_x, pad_y * pad_y) * 2;
        var empty_middle = Math.abs(y) / worldHeight;
        empty_middle = empty_middle * empty_middle - 1;
        return perlin.simplex2(x / simplex_scale, y / simplex_scale) + simplex_offset - pad - empty_middle;
    };
    SimplexWorld.choose_start = function (rng) {
        return this.choose_point(rng, new point_1.Point(-worldWidth + worldHeight, 0), worldHeight);
    };
    SimplexWorld.choose_end = function (rng) {
        return this.choose_point(rng, new point_1.Point(worldWidth - worldHeight, 0), worldHeight);
    };
    SimplexWorld.choose_point = function (rng, offset, radius) {
        var point = new point_1.Point(0, 0);
        do {
            point = new point_1.Point((rng() * 2 - 1) * radius + offset.x, (rng() * 2 - 1) * radius + offset.y);
        } while (SimplexWorld.sample_noise(point.x, point.y) < 1 - 0.5 * (1 - simplex_offset));
        return point;
    };
    SimplexWorld.prototype.draw = function (camera, point) {
        camera.draw_segments(this.lines, "green");
    };
    SimplexWorld.prototype.test = function (point) {
        var cardinality = 0;
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var _b = _a[_i], start = _b[0], end = _b[1];
            if (point.y >= start.y && point.y < end.y ||
                point.y >= end.y && point.y < start.y) {
                var slope = (end.y - start.y) / (end.x - start.x);
                var intercept = start.y - slope * start.x;
                var intersect_x = (point.y - intercept) / slope;
                if (slope > 100) {
                    intersect_x = Math.max(start.x, end.x);
                }
                if (intersect_x < point.x) {
                    cardinality++;
                }
            }
        }
        return cardinality % 2 == 0;
    };
    return SimplexWorld;
}());
exports.SimplexWorld = SimplexWorld;

},{"./marchingsquares":3,"./perlin":4,"./point":5}]},{},[2]);
