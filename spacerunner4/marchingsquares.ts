import { Point } from "./point"

export function marching_squares_aligned(func: (x: number, y: number) => number, width: number, height: number, center_x: number, center_y: number, grid_size: number): Array<[Point, Point]> {
    let true_start_x = center_x - width;
    let true_start_y = center_y - height;
    let start_x = Math.floor((center_x - width) / grid_size);
    let start_y = Math.floor((center_y - height) / grid_size);
    let end_x = Math.ceil((center_x + width) / grid_size);
    let end_y = Math.ceil((center_y + height) / grid_size);
    let adj_width = end_x - start_x;
    let adj_height = end_y - start_y;

    let result = marching_squares(function (x, y) { return func(x * grid_size + true_start_x, y * grid_size + true_start_y); }, adj_width, adj_height)

    for (let item of result) {
        item[0] = Point.add(Point.mul(item[0], grid_size), new Point(true_start_x, true_start_y));
        item[1] = Point.add(Point.mul(item[1], grid_size), new Point(true_start_x, true_start_y));
    }

    return result;
}

export function marching_squares(func: (x: number, y: number) => number, width: number, height: number): Array<[Point, Point]> {
    let points = new Array<Point>();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            points.push(center_square(func, x, y));
        }
    }
    let arr = new Array<[Point, Point]>();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x != width - 1 && do_line(func, x + 1, y, 0, 1)) {
                arr.push([points[y * width + x], points[y * width + x + 1]]);
            }
            if (y != height - 1 && do_line(func, x, y + 1, 1, 0)) {
                arr.push([points[y * width + x], points[(y + 1) * width + x]]);
            }
        }
    }
    for (var [a, b] of arr) {
        if (a.x === undefined || a.y === undefined || b.x === undefined || b.y === undefined) {
            throw new Error("Undefined line");
        }
    }
    return arr;
}

function do_line(func: (x: number, y: number) => number, x: number, y: number, dx: number, dy: number): boolean {
    let center = func(x, y);
    let other = func(x + dx, y + dy);
    return (center < 0) != (other < 0);
}

function center_square(func: (x: number, y: number) => number, x: number, y: number): Point {
    let p = [
        edge_point(func, x, y, 1, 0),
        edge_point(func, x, y + 1, 1, 0),
        edge_point(func, x, y, 0, 1),
        edge_point(func, x + 1, y, 0, 1)
    ].filter(x => x !== null);
    if (p.length == 0) {
        return null;
    }
    let sum = p.reduce((left, right) => Point.add(left, right));
    return Point.mul(sum, 1.0 / p.length);
}

function edge_point(func: (x: number, y: number) => number, x: number, y: number, dx: number, dy: number): Point {
    let center = func(x, y);
    let other = func(x + dx, y + dy);
    let val = center / (center - other);
    if (val < 0 || val > 1) {
        return null;
    }
    return new Point(x + dx * val, y + dy * val);
}
