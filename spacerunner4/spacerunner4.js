/** @type {HTMLCanvasElement} */
var canvas = document.getElementById("mainCanvas")
/** @type {CanvasRenderingContext2D} */
var ctx = canvas.getContext("2d")

var worldSize = 505
var shipColors = [
    "DarkRed",
    "DarkOrange",
    "Gold",
    "Green",
    "Blue",
    "Purple",
]

var host = window.location.hostname || "localhost"
var socket = new WebSocket("wss://" + host + ":14759")
var selfId = Math.floor(Math.random() * 100000)

class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    static add(left, right) {
        return new Point(left.x + right.x, left.y + right.y)
    }

    static sub(left, right) {
        return new Point(left.x - right.x, left.y - right.y)
    }

    static mul(left, right) {
        return new Point(left.x * right, left.y * right)
    }
}

function quadraticEq(a, b, c) {
    var temp = b * b - 4 * a * c
    if (temp < 0) {
        return 0
    }
    var solOne = (Math.sqrt(temp) + b) / (-2 * a)
    var solTwo = (Math.sqrt(temp) - b) / (2 * a)
    return Math.max(solOne, solTwo)
}

function getBounceAccel(pos, vel, softAccel, deltaSeconds) {
    if (Math.abs(pos) < worldSize) {
        return 0
    }
    softAccel *= -Math.sign(pos)
    pos -= Math.sign(pos) * worldSize
    if (Math.sign(vel) == Math.sign(pos) && Math.sign(pos) != Math.sign(pos - vel * deltaSeconds)) {
        // going outwards, first frame outside
        var time = quadraticEq(softAccel, vel, pos)
        if (time > 0.1) {
            // soft bounce
            return softAccel * deltaSeconds
        } else {
            // hard bounce
            return vel * -2
        }
    } else {
        // we previously chose a soft bounce
        return softAccel * deltaSeconds
    }
}

class Camera {
    constructor(center) {
        var offset = new Point(canvas.width / 2, canvas.height / 2)
        this.delta = Point.sub(offset, center)
    }

    fill(poly, color) {
        ctx.fillStyle = color
        this.drawImpl(poly)
        ctx.fill()
    }

    draw(poly, color) {
        ctx.strokeStyle = color
        this.drawImpl(poly)
        ctx.stroke()
    }

    drawImpl(poly) {
        ctx.beginPath()
        for (var index = 0; index < poly.length; index++) {
            var element = Point.add(poly[index], this.delta)
            if (index == 0) {
                ctx.moveTo(element.x, element.y)
            } else {
                ctx.lineTo(element.x, element.y)
            }
        }
        ctx.closePath()
    }

    grid(color) {
        var gridSize = 50
        ctx.strokeStyle = color
        ctx.beginPath()
        for (var i = 0; i < canvas.width + gridSize; i += gridSize) {
            var x = Math.floor((i - this.delta.x) / gridSize) * gridSize + this.delta.x
            ctx.moveTo(x, 0)
            ctx.lineTo(x, canvas.height)
        }
        for (var i = 0; i < canvas.width + gridSize; i += gridSize) {
            var y = Math.floor((i - this.delta.y) / gridSize) * gridSize + this.delta.y
            ctx.moveTo(0, y)
            ctx.lineTo(canvas.width, y)
        }
        ctx.stroke()
        ctx.strokeStyle = "red"
        ctx.beginPath()
        ctx.moveTo(-worldSize + this.delta.x, -worldSize + this.delta.y)
        ctx.lineTo(worldSize + this.delta.x, -worldSize + this.delta.y)
        ctx.lineTo(worldSize + this.delta.x, worldSize + this.delta.y)
        ctx.lineTo(-worldSize + this.delta.x, worldSize + this.delta.y)
        ctx.closePath()
        ctx.stroke()
    }
}

class CameraTrack {
    constructor(point) {
        this.point = point
    }

    track(newPoint, deltaSeconds) {
        var damp = 1 / deltaSeconds
        this.point = Point.mul(Point.add(Point.mul(this.point, damp), newPoint), 1 / (damp + 1))
    }
}

var noise = this.noise
class SimplexWorld {
    constructor() {
    }

    trace(point, theta) {
        var scale = 256
        var thresh = 0.5
        var maxsteps = 100
        var derivativeMax = 5.0
        var minStep = 4.0

        var dx = Math.cos(theta)
        var dy = Math.sin(theta)
        var dir = new Point(dx, dy)
        var dist = 0
        var prevSample = 0;
        for (var step = 0; step < maxsteps; step++) {
            var testPoint = Point.mul(Point.add(point, Point.mul(dir, dist)), 1.0 / scale)
            var sample = noise.simplex2(testPoint.x, testPoint.y) + thresh
            var increment = Math.max(sample * scale / derivativeMax, minStep)
            if (sample < 0)
            {
                // y = (y1 - y0) * x - y0
                var fraction = sample / (prevSample - sample)
                dist += increment * fraction
                break;
            }
            prevSample = sample
            dist += increment
        }
        var result = Point.add(point, Point.mul(dir, dist))
        return [result, dist]
    }

    split(points, point, theta, thetaNext, dist1, dist2) {
        var maxSampleSeparation = 4.0

        var dTheta = thetaNext - theta
        if (dTheta * Math.max(dist1, dist2) > maxSampleSeparation)
        {
            var thetaMid = theta + dTheta / 2
            var [traced, distMid] = this.trace(point, thetaMid);
            this.split(points, point, theta, thetaMid, dist1, distMid)
            points.push(traced)
            this.split(points, point, thetaMid, thetaNext, distMid, dist2)
        }
    }

    run(point) {
        var points = []
        var count = 32
        var prevDist = 0
        for (var index = 0; index < count; index++) {
            var prevTheta = (index - 1) / count * (Math.PI * 2)
            var theta = index / count * (Math.PI * 2)
            var [traced, dist] = this.trace(point, theta)
            this.split(points, point, prevTheta, theta, prevDist, dist)
            points.push(traced)
            prevDist = dist
        }
        return points
    }

    draw(camera, point) {
        var points = this.run(point)
        camera.draw(points, "green")
        camera.fill(points, "#e0e0e0")
    }
}

class Ship {
    constructor(pos, rot, id) {
        this.pos = pos
        this.vel = new Point(0, 0)
        this.rot = rot
        this.rotVel = 0
        this.color = shipColors[id % shipColors.length]
        this.throttle = false
        this.rotating = 0
        this.lastUpdate = 0
    }

    decode(json) {
        this.pos = new Point(json.posX, json.posY)
        this.vel = new Point(json.velX, json.velY)
        this.rot = json.rot
        this.rotVel = json.rotVel
        this.color = json.color
        this.throttle = json.throttle
        this.rotating = json.rotating
    }

    encode() {
        return {
            posX: this.pos.x,
            posY: this.pos.y,
            velX: this.vel.x,
            velY: this.vel.y,
            rot: this.rot,
            rotVel: this.rotVel,
            color: this.color,
            throttle: this.throttle,
            rotating: this.rotating,
            id: selfId,
        }
    }

    points() {
        var radius = 10
        var theta = Math.PI * 4 / 5
        var offsets = [
            new Point(Math.cos(this.rot + theta) * radius, Math.sin(this.rot + theta) * radius),
            new Point(Math.cos(this.rot - theta) * radius, Math.sin(this.rot - theta) * radius),
            new Point(Math.cos(this.rot) * radius, Math.sin(this.rot) * radius),
        ]
        for (var i = 0; i < offsets.length; i++) {
            offsets[i] = Point.add(this.pos, offsets[i])
        }
        return offsets
    }

    thrustPoints() {
        var radius = 10
        var length = 2
        var theta = Math.PI * 7 / 8
        var offsets = [
            new Point(Math.cos(this.rot + theta) * radius, Math.sin(this.rot + theta) * radius),
            new Point(Math.cos(this.rot - theta) * radius, Math.sin(this.rot - theta) * radius),
            new Point(Math.cos(this.rot) * radius * -length, Math.sin(this.rot) * radius * -length),
        ]
        for (var i = 0; i < offsets.length; i++) {
            offsets[i] = Point.add(this.pos, offsets[i])
        }
        return offsets
    }

    draw(camera) {
        camera.draw(this.points(), this.color)
        if (this.throttle) {
            camera.draw(this.thrustPoints(), "red")
        }
    }

    update(deltaSeconds) {
        var speedDamp = 1 - 0.02 * deltaSeconds
        var rotDamp = 1 - 8 * deltaSeconds
        var thrust = 75 * deltaSeconds
        var rotation = 32 * deltaSeconds
        var outOfBoundsAccel = 500
        speedDamp = Math.max(speedDamp, 0.1)
        rotDamp = Math.max(rotDamp, 0.1)
        if (this.throttle) {
            var thrustDir = new Point(Math.cos(this.rot), Math.sin(this.rot))
            this.vel = Point.add(this.vel, Point.mul(thrustDir, thrust))
        }
        if (this.rotating != 0) {
            this.rotVel += Math.sign(this.rotating) * rotation
        }
        var bounceAccelX = getBounceAccel(this.pos.x, this.vel.x, outOfBoundsAccel, deltaSeconds)
        var bounceAccelY = getBounceAccel(this.pos.y, this.vel.y, outOfBoundsAccel, deltaSeconds)
        var bounceAccel = new Point(bounceAccelX, bounceAccelY)
        this.vel = Point.add(this.vel, bounceAccel)
        this.vel = Point.mul(this.vel, speedDamp)
        this.rotVel *= rotDamp
        this.pos = Point.add(this.pos, Point.mul(this.vel, deltaSeconds))
        this.rot += this.rotVel * deltaSeconds
    }

    updateMe(pressedKeys, deltaSeconds) {
        if (pressedKeys.has(37) || pressedKeys.has(65)) { // left | a
            this.rotating = -1
        } else if (pressedKeys.has(39) || pressedKeys.has(68)) { // right | d
            this.rotating = 1
        } else {
            this.rotating = 0
        }
        if (pressedKeys.has(38) || pressedKeys.has(87)) { // up | w
            this.throttle = true
        } else {
            this.throttle = false
        }
        if (pressedKeys.has(40) || pressedKeys.has(83)) { // down | s
        }
        this.update(deltaSeconds)
    }
}

var lastNetworkSend = 0
function updateNetwork(ship, deltaSeconds) {
    lastNetworkSend += deltaSeconds
    var updateRate = 0.1
    if (lastNetworkSend > updateRate) {
        lastNetworkSend = 0
        if (socket.readyState == socket.OPEN) {
            socket.send(JSON.stringify(ship.encode()))
        }
    }
}

function updateScene(ship, camera, pressedKeys, deltaSeconds) {
    ship.updateMe(pressedKeys, deltaSeconds)
    updateNetwork(ship, deltaSeconds)
    var toTrack = new Point(ship.pos.x + ship.vel.x * 2, ship.pos.y + ship.vel.y * 2)
    camera.track(toTrack, deltaSeconds)
    toDelete = []
    for (var otherPlayerKey in otherPlayers) {
        var otherPlayer = otherPlayers[otherPlayerKey]
        otherPlayer.update(deltaSeconds)
        otherPlayer.lastUpdate += deltaSeconds
        var timeout = 4;
        if (otherPlayer.lastUpdate > timeout) {
            toDelete.push(otherPlayerKey)
        }
    }
    for (var del in toDelete) {
        delete otherPlayers[del]
    }
}

function drawScene(center, ship, simplexWorld) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    var camera = new Camera(center)
    simplexWorld.draw(camera, ship.pos)
    camera.grid("grey")
    ship.draw(camera)
    for (var otherPlayerKey in otherPlayers) {
        var otherPlayer = otherPlayers[otherPlayerKey]
        otherPlayer.draw(camera)
    }
}

function onOther(otherPlayers, data) {
    var id = data.id.toString()
    if (otherPlayers[id] == undefined) {
        otherPlayers[id] = new Ship(new Point(0, 0), 0, data.id);
    }
    var other = otherPlayers[id]
    other.decode(data)
    other.lastUpdate = 0
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

var previousMillis = 0
var ship = new Ship(new Point(Math.random() * 100 - 50, Math.random() * 100 - 50), 0, selfId)
var cameraTrack = new CameraTrack(ship.pos)
var pressedKeys = new Set()
var otherPlayers = {}
var simplexWorld = new SimplexWorld()

function frame(currentMillis) {
    var deltaSeconds = (currentMillis - previousMillis) / 1000
    previousMillis = currentMillis
    deltaSeconds = Math.min(deltaSeconds, 1)
    resize()
    updateScene(ship, cameraTrack, pressedKeys, deltaSeconds)
    drawScene(cameraTrack.point, ship, simplexWorld)
    window.requestAnimationFrame(frame)
}

function keyDown(e) {
    pressedKeys.add(e.keyCode)
}

function keyUp(e) {
    pressedKeys.delete(e.keyCode)
}

window.requestAnimationFrame(frame)
window.addEventListener('keydown', keyDown, false)
window.addEventListener('keyup', keyUp, false)
socket.addEventListener('message', function (event) {
    var data = JSON.parse(event.data);
    onOther(otherPlayers, data)
})
