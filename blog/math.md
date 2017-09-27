Math.png
===

AKA the absurdity of khyperia

    [15:58] poor_soul: what is the actual process that you're using to generate these?
    [15:58] khyperia: spooky artifacts ftw
    [15:58] khyperia: uuuuuuuuuuuuuuu
    [15:58] poor_soul: :smile:
    [15:58] khyperia: math, a fuckton of math. Do you want to sit here and have me explain for 30 minutes? (totally cool to say yes or no, just want to check)
    [15:58] khyperia: (probably actually like, 5 minutes)
    [15:58] poor_soul: yeeeee
    [15:59] khyperia: okay, so. MATH TIME. Let's go from bottom-up (it's sort of a series of nested components/concepts). I'm guessing you know what fractals are and yadda yadda mandelbrot?
    [15:59] poor_soul: yea
    [16:00] khyperia: okay so, given a recursive iterated fractal like the mandelbrot (I'm using the "mandelbox"), there's usually a way to get a thing called a "distance estimator"
    [16:01] khyperia: which is "give a point on the fractal space. The result is a scalar that is the distance to the closest point 'inside' of the fractal / in the fractal set."
    [16:01] khyperia: deriving a distance estimator involves a FUCkTON of math that I do NOT understand, it's basically black magic to me (involves a lot of like, Jacobian derivatives of matrixes and shit)
    [16:02] khyperia: but anyway
    [16:02] khyperia: turns out the Mandelbox is 3 dimensional - the vector you pass into this "distance estimator" is a 3d vector
    [16:02] khyperia: and that's all the definition of "the fractal" is, it's just a definition of a distance estimator. you can slap anything in there
    [16:03] khyperia: (actually, the mandelbox is n-dimentional, all the operations are vector ops and independent of dimension, but whateverrrr I lock it to 3d)
    [16:04] khyperia: anyway, so. now we have this distance estimator, I'll call it "DE" for short, because that's too hecking long to type out
    [16:04] khyperia: time to start simulating ~photons~
    [16:04] khyperia: so, a photon is a ray: it has an origin, and a direction
    [16:05] khyperia: so, let's put the origin into the distance estimator. It gives us back a scalar. Gee thanks, what does that mean? Well, it means that the closest point in the fractal is x distance away. It also means that the fractal is not within a sphere, of radius x, centered at the origin of the ray
    [16:06] khyperia: soooo... let's advance the origin by distance X, along the direction of the ray! Put it up right against the edge of this pseudo-sphere, because we know for a fact that the fractal doesn't exist between that point and its original point.
    [16:06] khyperia: and then do it again.
    [16:06] khyperia: and advance the ray again.
    [16:06] khyperia: and then do it again.
    [16:06] khyperia: and advance the ray again.
    [16:06] khyperia: yadda yadda
    [16:07] khyperia: eventually, through Magical Heuristical Mathematics™, we decide that this ray has "hit" the fractal, and there's a solid hunk of an object right in front of it
    [16:07] khyperia: cool™
    [16:07] khyperia: now let's do some more Mathematical Magic and calculate the surface normal of this object (again, using only the DE!)
    [16:08] khyperia: hey look, we have a photon incoming, a surface normal, some properties about the surface (that we just made up)
    [16:08] khyperia: let's bounce that shit!
    [16:08] khyperia: do some raytracing math shenanigans, calculate a new direction for this phunny foton, and send it off on the DE/advance/DE/advance cycle again
    [16:08] poor_soul: ooh
    [16:08] khyperia: cool, so we know how to simulate light
    [16:08] khyperia: let's do it backwards now! Because that's more EFFICIENT™
    [16:09] khyperia: send photos out from the camera, into the scene
    [16:09] khyperia: bounce 'em around
    [16:09] khyperia: when they hit a bright shiny object, say cool! That shit's shiny. So, color the "pixel" that ray came out of (in the camera) a bright shiny color, but affected by all the surfaces it bounced off of
    [16:10] khyperia: but hey! that's only one path a photon could take!
    [16:10] khyperia: a photon could bounce in any direction off of a surface!
    [16:10] khyperia: cool. so do it all again
    [16:10] khyperia: except this time take a different bouncy-path
    [16:11] khyperia: and then average your two results!
    [16:11] khyperia: and then do it again. and again. and *again. and AGAIN. AND * AGAIN AND AGAINNNNNN
    [16:11] khyperia: and then do that for
    every
    single
    goddamn
    pixel
    in your 10000x10000 image you're trying to render
    yeah that's a lot of fucking math
    [16:12] khyperia: and that is why I run this on the GPU :)
    [16:12] khyperia: end of explanation <3
    [16:12] khyperia: in summary, "math, a fuckton of math". questions?
