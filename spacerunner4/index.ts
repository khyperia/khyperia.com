import { Point } from "./point"
import { Camera, CameraTrack } from "./camera"
import { SimplexWorld } from "./simplexworld"
import { rngFromString } from "./rand";

const ship_size = 2
const ship_shape_angle = 0.5
const speed_damp = 0.02
const rot_damp = 6
const thrust = 18
const rotation = 25
const max_reset = 0.75

const shipColors = [
    "DarkRed",
    "DarkOrange",
    "Green",
    "Blue",
    "Purple",
]

class Settings {
    ship_color: string;
    rng: () => number;

    constructor() {
        if (!location.hash) {
            location.hash = "" + ((Math.random() * 10000) | 0)
        }
        const random = rngFromString(location.hash);
        this.rng = random.nextFloat.bind(random);
        this.ship_color = shipColors[Math.floor(this.rng() * shipColors.length)]
    }
}

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

function arrow(position: Point, target: Point) {
	let dir = Point.mul(Point.sub(target, position).normalized(), 100);
	let normal = new Point(dir.y, -dir.x);
	let points = [
		dir,
		Point.add(Point.mul(dir, 0.99), Point.mul(normal, 0.05)),
		Point.add(Point.mul(dir, 0.99), Point.mul(normal, -0.05)),
	]
	let screen_camera = new Camera(new Point(0, 0), 1);
	screen_camera.draw(points, "Red")
}

function ship_points(pos: Point, rot: number): Array<Point> {
    let offsets = [
        new Point(Math.cos(rot + ship_shape_angle) * -ship_size, Math.sin(rot + ship_shape_angle) * -ship_size),
        new Point(Math.cos(rot - ship_shape_angle) * -ship_size, Math.sin(rot - ship_shape_angle) * -ship_size),
        new Point(Math.cos(rot) * ship_size, Math.sin(rot) * ship_size),
    ]
    for (let i = 0; i < offsets.length; i++) {
        offsets[i] = Point.add(pos, offsets[i])
    }
    return offsets
}

class Ship {
    pos: Point
    vel: Point
    rot: number
    rotVel: number
    throttle: boolean
    rotating: number
    color: string
    settings: Settings

    constructor(settings: Settings, world: SimplexWorld) {
        this.pos = new Point(0, 0)
        this.vel = new Point(0, 0)
        this.rot = 0
        this.rotVel = 0
        this.throttle = false
        this.rotating = 0
        this.color = settings.ship_color
        this.settings = settings

        this.respawn(world)
    }

    points() {
        return ship_points(this.pos, this.rot)
    }

    thrustPoints() {
        let theta = ship_shape_angle / 2;
        let offsets = [
            new Point(Math.cos(this.rot + theta) * -ship_size, Math.sin(this.rot + theta) * -ship_size),
            new Point(Math.cos(this.rot - theta) * -ship_size, Math.sin(this.rot - theta) * -ship_size),
            new Point(Math.cos(this.rot) * -2 * ship_size, Math.sin(this.rot) * -2 * ship_size),
        ]
        for (let i = 0; i < offsets.length; i++) {
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

    test(world: SimplexWorld): boolean {
        for (let point of this.points()) {
            if (world.test(point)) {
                return true;
            }
        }
        return false;
    }

    respawn(world: SimplexWorld) {
        this.pos = world.spawn_point;
        this.rot = 0;
        this.rotVel = 0
        this.vel = new Point(0, 0)
        this.throttle = false;
        this.rotating = 0;
    }

    update(world: SimplexWorld, deltaSeconds: number): boolean {
        let my_speed_damp = 1 - speed_damp * deltaSeconds
        let my_rot_damp = 1 - rot_damp * deltaSeconds
        let my_thrust = thrust * deltaSeconds
        let my_rotation = rotation * deltaSeconds
        my_speed_damp = Math.max(my_speed_damp, 0.1)
        my_rot_damp = Math.max(my_rot_damp, 0.1)
        if (this.throttle) {
            let thrustDir = new Point(Math.cos(this.rot), Math.sin(this.rot))
            this.vel = Point.add(this.vel, Point.mul(thrustDir, my_thrust))
        }
        if (this.rotating != 0) {
            this.rotVel += sign(this.rotating) * my_rotation
        }
        this.vel = Point.mul(this.vel, my_speed_damp)
        this.rotVel *= my_rot_damp
        this.pos = Point.add(this.pos, Point.mul(this.vel, deltaSeconds))
        this.rot += this.rotVel * deltaSeconds

        if (this.test(world)) {
            return true
        } else {
            return false
        }
    }

    updateMe(pressedKeys: Array<number>, world: SimplexWorld, deltaSeconds: number): boolean {
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
        return this.update(world, deltaSeconds)
    }
}

class Target {
    pos: Point
    win: number
    static targetRadius = 10

    constructor(world: SimplexWorld) {
        this.pos = world.target_point
        this.win = 0
    }

    draw(camera: Camera) {
        for (let i = 1; i < 10 + this.win; i++) {
            camera.circle(this.pos, Target.targetRadius / 10 * i, "Blue")
        }
    }

    update(ship: Ship): boolean {
        if (this.win > 0) {
            this.win += 1;
        }
        if (this.win > 20) {
            this.win = 1;
        }
        if (this.win == 0) {
            let diff = Point.sub(ship.pos, this.pos);
            let dist = Math.sqrt(diff.x * diff.x + diff.y * diff.y)
            if (dist < Target.targetRadius) {
                this.win = 1
            }
        }
        return this.win != 0
    }
}

const ship_record_update_rate = 0.1;
class ShipRecord {
    history: Point[]
    lastUpdate: number

    constructor() {
        this.history = [];
        this.lastUpdate = 0;
    }

    update(ship: Ship, deltaSeconds: number) {
        this.lastUpdate += deltaSeconds;
        if (this.lastUpdate > ship_record_update_rate) {
            this.lastUpdate = this.lastUpdate % ship_record_update_rate;
            this.history.push(ship.pos)
        }
    }

    draw(camera: Camera) {
        camera.line(this.history, "#a0a0a0")
    }
}

class HighScore {
    highScore: number
    lastScore: number

    constructor() {
        this.highScore = 0;
        this.lastScore = 0;
    }

    onFinish(time: number) {
        this.lastScore = time;
        if (time < this.highScore || this.highScore == 0) {
            this.highScore = time;
        }
    }

    draw(camera: Camera, time: number) {
        camera.text(`high score: ${this.highScore}`, 0);
        camera.text(`last score: ${this.lastScore}`, 1);
        camera.text(`curr score: ${time}`, 2);
    }
}

class Universe {
    settings: Settings
    ship: Ship
    camera_track: CameraTrack
    target: Target
    pressedKeys: Array<number>
    simplex_world: SimplexWorld
    previousMillis: number
    reset: number
    records: Array<ShipRecord>
    cur_record: ShipRecord
    high_score: HighScore
    current_time: number
    draw_records: boolean

    constructor() {
        this.settings = new Settings();
        this.simplex_world = new SimplexWorld(this.settings.rng);
        this.ship = new Ship(this.settings, this.simplex_world);
        this.camera_track = new CameraTrack(this.ship.pos);
        this.target = new Target(this.simplex_world);
        this.pressedKeys = new Array<number>();
        this.previousMillis = 0;
        this.reset = 0;
        this.cur_record = new ShipRecord();
        this.high_score = new HighScore();
        this.records = [];
        this.current_time = 0;
        this.draw_records = true;
    }

    updateScene(deltaSeconds: number) {
        if (this.reset > 0) {
            this.reset += deltaSeconds;
            this.target.update(this.ship); // shouldn't use ship
            if (this.reset > max_reset) {
                this.reset = -max_reset + 0.0001
                this.doReset()
            }
        } else if (this.reset < 0) {
            this.reset += deltaSeconds;
            if (this.reset >= 0) {
                this.reset = 0;
            }
        } else {
            this.current_time += deltaSeconds;
            this.cur_record.update(this.ship, deltaSeconds);
            if (this.ship.updateMe(this.pressedKeys, this.simplex_world, deltaSeconds)) {
                this.reset += deltaSeconds;
            } else if (this.target.update(this.ship)) {
                this.high_score.onFinish(this.current_time);
                this.reset += deltaSeconds;
            }
        }
        this.camera_track.track(this.ship.pos, this.ship.vel, deltaSeconds)
    }

    doFullRespawn(): boolean {
        // StartsWith('0')
        return location.hash.substr(0, 2) == '#0'
    }

    doReset() {
        if (this.target.win != 0) {
            this.records.push(this.cur_record);
        }
        if (this.doFullRespawn()) {
            this.simplex_world = new SimplexWorld(this.settings.rng);
            this.target.pos = this.simplex_world.target_point;
            this.records = [];
            this.high_score = new HighScore();
        }
        this.ship.respawn(this.simplex_world);
        this.camera_track.point = this.ship.pos
        this.cur_record = new ShipRecord();
        while (this.records.length > 100) {
            this.records.splice(0, 1)
        }
        this.target.win = 0;
        this.current_time = 0;
    }

    drawScene() {
        let reset_x = this.reset * (Math.PI / (2 * max_reset));
        let scale = Math.exp(Math.log(1.5) * (Math.tan(reset_x) - reset_x))
        let camera = new Camera(this.camera_track.point, scale)
        camera.begin()
        this.simplex_world.draw(camera, this.ship.pos)
        if (this.draw_records) {
            for (let record of this.records) {
                record.draw(camera)
            }
        }
        this.ship.draw(camera)
        this.target.draw(camera)
		arrow(this.ship.pos, this.target.pos)
        this.high_score.draw(camera, this.current_time)
    }

    frame(currentMillis: number) {
        let deltaSeconds = (currentMillis - this.previousMillis) / 1000
        this.previousMillis = currentMillis
        deltaSeconds = Math.min(deltaSeconds, 1)
        this.updateScene(deltaSeconds)
        this.drawScene()
        window.requestAnimationFrame(x => this.frame(x))
    }

    keyDown(e: KeyboardEvent) {
        if (e.keyCode == 32) { // space
            this.draw_records = !this.draw_records
        }
        if (!has(this.pressedKeys, e.keyCode)) {
            this.pressedKeys.push(e.keyCode)
        }
    }

    keyUp(e: KeyboardEvent) {
        for (let i = this.pressedKeys.length - 1; i >= 0; i--) {
            if (this.pressedKeys[i] === e.keyCode) {
                this.pressedKeys.splice(i, 1);
            }
        }
    }

    register() {
        window.requestAnimationFrame(x => this.frame(x))
        window.addEventListener('keydown', x => this.keyDown(x), false)
        window.addEventListener('keyup', x => this.keyUp(x), false)
    }
}

new Universe().register()
