export class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    static add(left: Point, right: Point) {
        return new Point(left.x + right.x, left.y + right.y)
    }

    static sub(left: Point, right: Point) {
        return new Point(left.x - right.x, left.y - right.y)
    }

    static mul(left: Point, right: number) {
        return new Point(left.x * right, left.y * right)
    }
}
