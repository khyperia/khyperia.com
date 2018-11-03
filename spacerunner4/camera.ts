import { Point } from "./point"

const canvas: HTMLCanvasElement = document.getElementById("mainCanvas") as HTMLCanvasElement
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")
const screen_size = 225

export class Camera {
    delta: Point
    // scale = screen space / world space
    scale: number

    constructor(center: Point, scale: number) {
        var normalizing_scale = ((canvas.width + canvas.height) / 2) / screen_size;
        this.delta = Point.sub(new Point(0, 0), center)
        this.scale = scale * normalizing_scale
    }

    resize() {
        let width = canvas.clientWidth
        let height = canvas.clientHeight
        if (canvas.width != width ||
            canvas.height != height) {
            canvas.width = width
            canvas.height = height
        }
    }

    clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    begin() {
        this.resize()
        this.clear()
    }

    fill(poly: Array<Point>, color: string) {
        ctx.fillStyle = color
        ctx.beginPath()
        this.drawImpl(poly)
        ctx.closePath()
        ctx.fill()
    }

    draw(poly: Array<Point>, color: string) {
        ctx.strokeStyle = color
        ctx.beginPath()
        this.drawImpl(poly)
        ctx.closePath()
        ctx.stroke()
    }

    line(poly: Array<Point>, color: string) {
        ctx.strokeStyle = color
        ctx.beginPath()
        this.drawImpl(poly)
        ctx.stroke()
    }

    transform(point: Point): Point {
        return Point.add(Point.mul(Point.add(point, this.delta), this.scale), new Point(canvas.width / 2, canvas.height / 2))
    }

    transform_scale(distance: number): number {
        return distance * this.scale
    }

    drawImpl(poly: Array<Point>) {
        for (let index = 0; index < poly.length; index++) {
            let element = this.transform(poly[index])
            if (index == 0) {
                ctx.moveTo(element.x, element.y)
            } else {
                ctx.lineTo(element.x, element.y)
            }
        }
    }

    draw_segments(poly: Array<[Point, Point]>, color: string) {
        let offset = this.transform(new Point(0, 0));
        let scale = Point.sub(this.transform(new Point(1, 0)), offset).x;
        let oldLineWidth = ctx.lineWidth;
        ctx.lineWidth = 1 / scale;
        ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y);
        ctx.strokeStyle = color
        ctx.beginPath();
        for (let [start_world, end_world] of poly) {
            ctx.moveTo(start_world.x, start_world.y);
            ctx.lineTo(end_world.x, end_world.y);
        }
        ctx.stroke()
        ctx.resetTransform();
        ctx.lineWidth = oldLineWidth;
    }

    circle(center: Point, radius: number, color: string) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        let center_draw = this.transform(center)
        ctx.arc(center_draw.x, center_draw.y, this.transform_scale(radius), 0, 2 * Math.PI);
        ctx.stroke();
    }

    text(value: string, line: number) {
        ctx.strokeStyle = "Black";
        ctx.font = "16px sans-serif";
        ctx.fillText(value, 10, 15 + line * 20);
    }
}

export class CameraTrack {
    point: Point

    constructor(point: Point) {
        this.point = point
    }

    track(position: Point, velocity: Point, deltaSeconds: number) {
        let newPoint = Point.add(position, Point.mul(velocity, 2))
        let damp = 1 / deltaSeconds
        this.point = Point.mul(Point.add(Point.mul(this.point, damp), newPoint), 1 / (damp + 1))
    }
}
