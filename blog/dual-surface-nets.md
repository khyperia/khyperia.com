Dual Surface Nets
===

This is the hill I will die on:

Dual Surface Nets are WAY better than Marching Cubes.

---

Okay, what the heck is a dual surface net? The [blog I learned it from is here](https://0fps.net/2012/07/12/smooth-voxel-terrain-part-2/) if you want another explanation + some pretty pictures (and extremely convincing pictures).

Not going from a mathematical angle to explain this, so just take me for granted when I say "dual" makes sense in the name of this thing. This does mean that I'll be restricted to the 2d and 3d case, however, know that it's extremely simple to extend to high dimensions.

I'm not going to explain the use of this algorithm, I'm just going to assume you know what marching cubes is (or rather, its purpose), and move on. Let's start with a 2d signed distance field (the thing we want to poliganize, or rather, draw lines around). Let's put a unit grid over it, so we can sample this signed distance field on the integer coordinate grid - `(1, 1) and (2, 5) and (-2, 9)`, etc.

Then, draw lines between all points horizontally and vertically adjacent in this grid. Each point has a positive/negative value, and only keep the lines where one end is positive and one is negative (transition from solid surface to air, or whatever your field represents). In other words, draw this line whenever the edge between two points crosses through the surface.

At this point, we'll have a blocky, 90 degree angle outline of our shape. Let's fine-tune the shape.

For each point, think of all the lines we've drawn connected to this point (skip if zero): all of them cross the surface. Let's do a linear approximation of finding *where* in between [self] and [other] the SDF is zero.

```
f(point self) = v0
f(point other) = v1
f(x) = m * x + b
point self = 0
point other = 1
m * 0 + b = v0
m * 1 + b = v1
m = (v1 - v0)
b = v0
f(x) = 0
(v1 - v0) * x + v0 = 0
x = -v0 / (v1 - v0)
x = v0 / (v0 - v1)
```

In other words, the distance along the line from self to other is `[SDE at self] / ([SDE at self] - [SDE at other])`
