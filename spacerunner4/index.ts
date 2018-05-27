import * as perlin from "./perlin"
import { Point } from "./point"
import { marching_squares } from "./marchingsquares";

const canvas: HTMLCanvasElement = document.getElementById("mainCanvas") as HTMLCanvasElement
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")

const worldSize = (1 << 10) + 1
const gridSize = 32
const simplex_scale = 256;
const simplex_offset = 0.25;
const speed_damp = 0.02
const rot_damp = 8
const thrust = 75
const rotation = 32
const falloff_grids = 5

const shipColors = [
    "DarkRed",
    "DarkOrange",
    "Gold",
    "Green",
    "Blue",
    "Purple",
]

function sign(x: number): number {
    if (x < 0) {
        return -1;
    } else if (x > 0) {
        return 1;
    } else {
        return 0;
    }
}

function has<T>(arr: Array<T>, v: T): boolean {
    return arr.some(x => x == v)
}

class Camera {
    delta: Point

    constructor(center: Point) {
        var offset = new Point(canvas.width / 2, canvas.height / 2)
        this.delta = Point.sub(offset, center)
    }

    fill(poly: Array<Point>, color: string) {
        ctx.fillStyle = color
        this.drawImpl(poly)
        ctx.fill()
    }

    draw(poly: Array<Point>, color: string) {
        ctx.strokeStyle = color
        this.drawImpl(poly)
        ctx.stroke()
    }

    drawImpl(poly: Array<Point>) {
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

    draw_segments(poly: Array<[Point, Point]>, color: string) {
        ctx.strokeStyle = color
        ctx.beginPath();
        for (var [start, end] of poly) {
            ctx.moveTo(start.x + this.delta.x, start.y + this.delta.y);
            ctx.lineTo(end.x + this.delta.x, end.y + this.delta.y);
        }
        ctx.stroke()
    }

    grid(color: string) {
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
    point: Point

    constructor(point: Point) {
        this.point = point
    }

    track(newPoint: Point, deltaSeconds: number) {
        var damp = 1 / deltaSeconds
        this.point = Point.mul(Point.add(Point.mul(this.point, damp), newPoint), 1 / (damp + 1))
    }
}

class SimplexWorld {
    lines: Array<[Point, Point]>

    constructor() {
        let mapped_start = Math.floor(worldSize / gridSize);
        let mapped_size = mapped_start * 2;
        let outside_boundary = worldSize / gridSize - falloff_grids;

        this.lines = marching_squares(function (x, y) {
            //return x * x + y * y - Math.PI * 2
            let outside = Math.max(x - outside_boundary, -x - outside_boundary, y - outside_boundary, -y - outside_boundary, 0.0) / falloff_grids;
            return perlin.simplex2(x * gridSize / simplex_scale, y * gridSize / simplex_scale) + simplex_offset - outside * outside * (1 + simplex_offset);
        }, mapped_size, mapped_size, -mapped_start, -mapped_start)
        for (var item of this.lines) {
            item[0] = Point.mul(item[0], gridSize);
            item[1] = Point.mul(item[1], gridSize);
        }
    }

    draw(camera: Camera, point: Point) {
        camera.draw_segments(this.lines, "green")
    }

    // returns true if point is bad
    test(point: Point): boolean {
        let cardinality = 0;
        for (var [start, end] of this.lines) {
            if (start.y <= point.y && end.y >= point.y ||
                start.y >= point.y && end.y <= point.y) {
                let slope = (end.y - start.y) / (end.x - start.x);
                let intercept = start.y - slope * start.x;
                let intersect_x = (point.y - intercept) / slope;
                if (intersect_x < point.x) {
                    cardinality++;
                }
            }
        }
        return cardinality % 2 !== 0;
    }
}

class Ship {
    lastUpdate: number
    rotating: number
    throttle: boolean
    color: string
    rot: number
    rotVel: number
    vel: Point
    pos: Point

    constructor(pos: Point, rot: number) {
        this.pos = pos
        this.vel = new Point(0, 0)
        this.rot = rot
        this.rotVel = 0
        this.color = shipColors[Math.floor(Math.random() * shipColors.length)]
        this.throttle = false
        this.rotating = 0
        this.lastUpdate = 0
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

    draw(camera: Camera) {
        camera.draw(this.points(), this.color)
        if (this.throttle) {
            camera.draw(this.thrustPoints(), "red")
        }
    }

    update(deltaSeconds: number) {
        var my_speed_damp = 1 - speed_damp * deltaSeconds
        var my_rot_damp = 1 - rot_damp * deltaSeconds
        var my_thrust = thrust * deltaSeconds
        var my_rotation = rotation * deltaSeconds
        my_speed_damp = Math.max(my_speed_damp, 0.1)
        my_rot_damp = Math.max(my_rot_damp, 0.1)
        if (this.throttle) {
            var thrustDir = new Point(Math.cos(this.rot), Math.sin(this.rot))
            this.vel = Point.add(this.vel, Point.mul(thrustDir, my_thrust))
        }
        if (this.rotating != 0) {
            this.rotVel += sign(this.rotating) * my_rotation
        }
        this.vel = Point.mul(this.vel, my_speed_damp)
        this.rotVel *= my_rot_damp
        this.pos = Point.add(this.pos, Point.mul(this.vel, deltaSeconds))
        this.rot += this.rotVel * deltaSeconds
    }

    updateMe(pressedKeys: Array<number>, deltaSeconds: number) {
        if (has(pressedKeys, 37) || has(pressedKeys, 65)) { // left | a
            this.rotating = -1
        } else if (has(pressedKeys, 39) || has(pressedKeys, 68)) { // right | d
            this.rotating = 1
        } else {
            this.rotating = 0
        }
        if (has(pressedKeys, 38) || has(pressedKeys, 87)) { // up | w
            this.throttle = true
        } else {
            this.throttle = false
        }
        if (has(pressedKeys, 40) || has(pressedKeys, 83)) { // down | s
        }
        this.update(deltaSeconds)
    }
}

function updateScene(ship: Ship, camera: CameraTrack, pressedKeys: Array<number>, deltaSeconds: number) {
    ship.updateMe(pressedKeys, deltaSeconds)
    var toTrack = new Point(ship.pos.x + ship.vel.x * 2, ship.pos.y + ship.vel.y * 2)
    camera.track(toTrack, deltaSeconds)
}

function drawScene(center: Point, ship: Ship, simplexWorld: SimplexWorld) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    var camera = new Camera(center)
    simplexWorld.draw(camera, ship.pos)
    camera.grid("grey")
    ship.draw(camera)
}

function resize() {
    var width = canvas.clientWidth
    var height = canvas.clientHeight
    if (canvas.width != width ||
        canvas.height != height) {
        canvas.width = width
        canvas.height = height
    }
}

var previousMillis = 0
var ship = new Ship(new Point(Math.random() * 100 - 50, Math.random() * 100 - 50), 0)
var cameraTrack = new CameraTrack(ship.pos)
var pressedKeys = new Array<number>()
var simplexWorld = new SimplexWorld()

function frame(currentMillis: number) {
    var deltaSeconds = (currentMillis - previousMillis) / 1000
    previousMillis = currentMillis
    deltaSeconds = Math.min(deltaSeconds, 1)
    resize()
    updateScene(ship, cameraTrack, pressedKeys, deltaSeconds)
    drawScene(cameraTrack.point, ship, simplexWorld)
    window.requestAnimationFrame(frame)
}

function keyDown(e: KeyboardEvent) {
    if (!has(pressedKeys, e.keyCode)) {
        pressedKeys.push(e.keyCode)
    }
}

function keyUp(e: KeyboardEvent) {
    for (var i = pressedKeys.length - 1; i >= 0; i--) {
        if (pressedKeys[i] === e.keyCode) {
            pressedKeys.splice(i, 1);
        }
    }
}

window.requestAnimationFrame(frame)
window.addEventListener('keydown', keyDown, false)
window.addEventListener('keyup', keyUp, false)
