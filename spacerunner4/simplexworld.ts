import { Point } from "./point"
import * as perlin from "./perlin"
import { Camera } from "./camera"
import { marching_squares, marching_squares_aligned } from "./marchingsquares";

const worldWidth = (1 << 8)
const worldHeight = (1 << 6)
const gridSize = 4
const simplex_scale = 32;
const simplex_offset_base = 0.25;
const simplex_offset_variance = 0.25;
const falloff_grids = 5
let simplex_offset = 0.25;

export function seedWorld(rng: () => number) {
    perlin.seed(rng())
    simplex_offset = simplex_offset_base + (rng() * 2 - 1) * simplex_offset_variance
}

export class SimplexWorld {
    lines: Array<[Point, Point]>

    constructor() {
        this.lines = marching_squares_aligned(SimplexWorld.sample_noise, worldWidth, worldHeight, 0, 0, gridSize)
        let min = 0;
        let max = 0;
        for (let [start, end] of this.lines)
        {
            min = Math.min(min, start.x);
            max = Math.max(max, start.x);
        }
        console.log("Test min: " + min)
        console.log("Test max: " + max)
    }

    static sample_noise(x: number, y: number) {
        let boundary_size = falloff_grids * gridSize;
        let pad_y = Math.max(Math.abs(y) - (worldHeight - boundary_size), 0) / boundary_size;
        let pad_x = Math.max(Math.abs(x) - (worldWidth - boundary_size), 0) / boundary_size;
        let pad = Math.max(pad_x * pad_x, pad_y * pad_y) * 2;
        return perlin.simplex2(x / simplex_scale, y / simplex_scale) + simplex_offset - pad;
    }

    static choose_start(rng: () => number): Point {
        return this.choose_point(rng, new Point(-worldWidth + worldHeight, 0), worldHeight);
    }

    static choose_end(rng: () => number): Point {
        return this.choose_point(rng, new Point(worldWidth - worldHeight, 0), worldHeight);
    }

    static choose_point(rng: () => number, offset: Point, radius: number): Point {
        let point = new Point(0, 0);
        do {
            point = new Point((rng() * 2 - 1) * radius + offset.x, (rng() * 2 - 1) * radius + offset.y);
        } while (SimplexWorld.sample_noise(point.x, point.y) < 1 - 0.5 * (1 - simplex_offset));
        return point;
    }

    draw(camera: Camera, point: Point) {
        camera.draw_segments(this.lines, "green")
    }

    // returns true if point is bad
    test(point: Point): boolean {
        let cardinality = 0;
        for (let [start, end] of this.lines) {
            if (point.y >= start.y && point.y < end.y ||
                point.y >= end.y && point.y < start.y) {
                let slope = (end.y - start.y) / (end.x - start.x);
                let intercept = start.y - slope * start.x;
                let intersect_x = (point.y - intercept) / slope;
                if (slope > 100)
                {
                    intersect_x = Math.max(start.x, end.x);
                }
                if (intersect_x < point.x) {
                    cardinality++;
                }
            }
        }
        return cardinality % 2 == 0;
    }
}
