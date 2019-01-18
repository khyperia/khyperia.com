export class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

	length2() {
		return this.x * this.x + this.y * this.y;
	}

	length() {
		return Math.sqrt(this.length2())
	}

	normalized() {
		return Point.mul(this, 1 / this.length())
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
