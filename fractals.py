#!/usr/bin/env python3
import os
print("Yay, fractals! Hopefully your browser doesn't explode displaying this page.")
print("")
print("These were rendered by various versions of my fractal raytracing program. [More fractals are located here.](https://imgur.com/a/rmM4v)")
print("")
files = os.listdir("fractals")
files.sort(reverse=True)
for f in files:
    print("[![](/image/" + f + ")](fractals/" + f + ")")
    print("")
    print("---")
    print("")
print("![](https://licensebuttons.net/l/by/4.0/88x31.png)")
print("")
print("The fractals rendered by me, on this page, and the above imgur album, are under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).")
