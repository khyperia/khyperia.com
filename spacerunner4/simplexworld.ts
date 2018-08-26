import { Point } from "./point"
import * as perlin from "./perlin"
import { Camera } from "./camera"
import { marching_squares } from "./marchingsquares";

const worldSize = (1 << 10) + 1
const gridSize = 32
const simplex_scale = 256;
const simplex_offset = 0.25;
const falloff_grids = 5

export function seedWorld(seed: number) {
    perlin.seed(seed)
}

export class SimplexWorld {
    lines: Array<[Point, Point]>

    constructor() {
        let mapped_start = Math.floor(worldSize / gridSize);
        let mapped_size = mapped_start * 2;

        this.lines = marching_squares(function (x, y) { return SimplexWorld.sample_noise(x * gridSize, y * gridSize); }, mapped_size, mapped_size, -mapped_start, -mapped_start)
        for (var item of this.lines) {
            item[0] = Point.mul(item[0], gridSize);
            item[1] = Point.mul(item[1], gridSize);
        }
    }

    static sample_noise(x: number, y: number) {
        // the +1 is to pad to make sure there's no gaps
        let outside_boundary = worldSize - (falloff_grids + 1) * gridSize;
        let outside = Math.max(x - outside_boundary, -x - outside_boundary, y - outside_boundary, -y - outside_boundary, 0.0) / (gridSize * falloff_grids);
        return perlin.simplex2(x / simplex_scale, y / simplex_scale) + simplex_offset - outside * outside * (1 + simplex_offset);
    }

    static choose_point(rng: () => number): Point {
        let point = new Point(0, 0);
        do {
            point = new Point((rng() * 2 - 1) * worldSize, (rng() * 2 - 1) * worldSize);
        } while (SimplexWorld.sample_noise(point.x, point.y) < 1 - 0.5 * (1 - simplex_offset));
        return point;
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
        return cardinality % 2 == 0;
    }
}
