Architecture of a Fractal Raytracer
===

So, I've written a fractal raytracer. It's a decently complicated beast that
I've been writing and re-writing over the past half-decade, so I figure it
might be fun to write up on how it works!

[![](/image/2017-08-18_10-05-15.canyon.png](fractals/2017-08-18_10-05-15.canyon.png)

First off, there's two major parts to it.

* The "CPU side": This (by definition) runs on the CPU, not the GPU. It handles all of the "control" aspects: keyboard input, reading/writing configurations to files, managing/interpolating configurations for video recordings, and the like. It's also responsible for managing the GPU, controlling what it does, and when. The CPU side is about 90% of all the code in the project.
* The "GPU side": This is a [single file](https://github.com/khyperia/Clam/blob/8e340b982b98575224d04fc92275cf902eb6ecbd/src/mandelbox.cl) (in my current raytracer, at least) that handles *all* of the raytracing "stuff": fractal formula evaluation, casting rays, calculating physics of the light rays to figure out how the photon interacts with the world, and finally recording the photon in a particular pixel of the camera's sensor. The output of this is an image, a pretty typical 2d array of RGB values, which the CPU side grabs and displays\*.

We'll start with the CPU side (and we'll get to that asterisk later).

[![](/image/2017-08-18_10-05-16.fire.png](fractals/2017-08-18_10-05-16.fire.png)

I'll explain how my current rewrite of the raytracer works here. Note that there's many implementations of this that I've written over the years (the GPU side is generally extremely similar, and is copy-pasted between rewrites). I'll add a note at the end of some of the more interesting things other rewrites do.

The thing is designed around a simple primitive: a ["settings bag"](https://github.com/khyperia/Clam/blob/8e340b982b98575224d04fc92275cf902eb6ecbd/src/settings.rs), which is a dictionary of `String->Float` (specifically, `String->(Int|Float)`, but whatever). There are 30-40 variables in normal use - these include things like "position (and look, and up vector) of the camera", "focal distance of the camera", "position of a light source", "color of a light source", and 5 or so parameters that run to the actual fractal formula itself.

[Keyboard input](https://github.com/khyperia/Clam/blob/8e340b982b98575224d04fc92275cf902eb6ecbd/src/input.rs) is structured in two phases. One, the stream of "key down" and "key up" events are tracked, along with the times those events happened. It's transformed into an output stream of "these keys have been held down for this long". Two, that output stream is ingested into the key handler. It's a big hardcoded table of things like "if the W key has been held down for the past `t` seconds, move the camera forward `speed*t` units".

(Advanced note: The "start of key down" time is reset to "now" every time this integration is performed, so it's not a x^2 amount of forward movement. The cool thing about structuring it this way is that key down events mid-frame are handled correctly (giving e.g. half a frame movement forward), which is very useful when things are running at 5fps or less).

[![](/image/2017-08-18_10-05-17.giants.png](fractals/2017-08-18_10-05-17.giants.png)

The other two major sources of code size are pretty boring (but very complicated):

* [The "GPU handler"](https://github.com/khyperia/Clam/blob/8e340b982b98575224d04fc92275cf902eb6ecbd/src/kernel.rs), which is just a bunch of OpenCL calls. It finds a GPU, creates a context for it, runtime-compiles the raytracer, allocates memory (or re-allocates if the render size changes), uploads settings from the settings bag to the GPU (extracted into the binary format the GPU code wants), and invokes the GPU (repeatedly) to render images... except all a lot more complicated than that, since I recently introduced dynamic recompilation of the kernel to change arbitrary constants instead of putting them in global RAM.
* [The "display"](https://github.com/khyperia/Clam/blob/8e340b982b98575224d04fc92275cf902eb6ecbd/src/display.rs), which is a huge heap of glue code that ties together creating a window onscreen, reading events from it, handing those events to the keyboard input handler, taking the resulting state from that and giving it to the GPU handling code, taking the resulting pixel buffer and pushing it to the displayed window, and making sure everything's not exploding. Except all of that is asynchronous. It gets a bit crazy.

\* On the asterisk near the beginning of the article: I *could* have had the result of the GPU's rendering (in OpenCL memory) be kept on the GPU, but ownership transferred to OpenGL as a texture, and rendered that texture as a fullscreen quad... but honestly, I tried that, and that weaves together the "GPU handler" component and the "display" component in an extremely complex way, so uh, I said screw that and just download the result buffer to throw the heap of pixels at SDL2. (SDL2 is way better at gamma than OpenGL, too - I had [quite the week or two](https://twitter.com/khyperia/status/978396006206205952) debugging OpenGL's gamma shenanigans)

[![](/image/2017-08-18_10-05-19.lightfog.png](fractals/2017-08-18_10-05-19.lightfog.png)

Now, for some other super cool stuff my other rewrites can do.

* Cluster computing! My university had a GPU cluster of 8 machines, 2 GPUs each, with 3 monitors per machine, and so I could display fractals in realtime on a 50 megapixel, 24-display wall (... if you count 5fps as "realtime").
* Cluster computing with all of the above, except everything was dynamically scriptable in Lua!
* Video recording: I could record keyframes at various settings/camera positions/etc, and have an interpolation run through it and produce a video! [Here's an example](https://www.youtube.com/watch?v=tLUGrknCr9Y) of me changing a bunch of different fractal parameters, and my [(really really old) youtube channel](https://www.youtube.com/user/khyperia/videos) has a decent number of these fractal videos.

![](https://pbs.twimg.com/media/CRFg2jsWIAEG-dv.jpg:large)

Now, for the GPU side, the actual raytracer!

... on second thought, this post is far too large already, and goes over a bunch of neat stuff. Yell at me on [twitter](https://twitter.com/khyperia) if you want a second post detailing the physics and math of my fractal raytracer!

So long, and be blessed with many beautiful mathy structures!

[![](/image/2018-04-11_08-42-47.shiny.png](fractals/2018-04-11_08-42-47.shiny.png)
