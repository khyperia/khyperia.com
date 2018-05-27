import { Point } from "./point"

export function marching_squares(func: (x: number, y: number) => number, width: number, height: number, off_x: number, off_y: number): Array<[Point, Point]> {
    let arr = new Array<[Point, Point]>();
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            one_square(func, x + off_x, y + off_y, arr)
        }
    }
    return arr;
}

function one_square(func: (x: number, y: number) => number, x: number, y: number, arr: Array<[Point, Point]>) {
    // v(y)(x)
    let v00 = func(x, y);
    let v01 = func(x + 1, y);
    let v10 = func(x, y + 1);
    let v11 = func(x + 1, y + 1);
    // edge (negative|positive) (x|y)
    // 0 = x * (v1 - v0) + v0
    // x = v0 / (v0 - v1)
    let eny_val = v00 / (v00 - v01);
    let epy_val = v10 / (v10 - v11);
    let enx_val = v00 / (v00 - v10);
    let epx_val = v01 / (v01 - v11);
    let eny = new Point(eny_val + x, 0.0 + y);
    let epy = new Point(epy_val + x, 1.0 + y);
    let enx = new Point(0.0 + x, enx_val + y);
    let epx = new Point(1.0 + x, epx_val + y);

    let square_type = 0;
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
            } else {
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
            } else {
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
