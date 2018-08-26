import { Point } from "./point"

const canvas: HTMLCanvasElement = document.getElementById("mainCanvas") as HTMLCanvasElement
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")

export class Camera {
    delta: Point
    scale: number

    constructor(center: Point, scale: number) {
        this.delta = Point.sub(new Point(0, 0), center)
        this.scale = scale
    }

    resize() {
        var width = canvas.clientWidth
        var height = canvas.clientHeight
        if (canvas.width != width ||
            canvas.height != height) {
            canvas.width = width
            canvas.height = height
        }
    }

    begin() {
        this.resize()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
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
        for (var index = 0; index < poly.length; index++) {
            var element = this.transform(poly[index])
            if (index == 0) {
                ctx.moveTo(element.x, element.y)
            } else {
                ctx.lineTo(element.x, element.y)
            }
        }
    }

    draw_segments(poly: Array<[Point, Point]>, color: string) {
        ctx.strokeStyle = color
        ctx.beginPath();
        for (var [start_world, end_world] of poly) {
            let start = this.transform(start_world)
            let end = this.transform(end_world)
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
        }
        ctx.stroke()
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

    track(newPoint: Point, deltaSeconds: number) {
        var damp = 1 / deltaSeconds
        this.point = Point.mul(Point.add(Point.mul(this.point, damp), newPoint), 1 / (damp + 1))
    }
}
