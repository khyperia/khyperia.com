#!/usr/bin/env python3
import os
import subprocess

spacephotos = [
    "2019_11_21/IC1396A.png",
    "2019_10_05/M27.png",
    "2017_09_28/C27.jpg",
    "2017_07_06/Unknown/Capture_0001.png",
    "2017_07_06/Moon/Moon_0001.png",
    "2017_07_06/M16/m16_0003.png",
    "2017_07_06/M16/m16_0002.png",
    "2017_07_06/M16/m16_0001.png",
    "2017_07_06/Jupiter/Jupiter_0002.png",
    "2017_07_06/Jupiter/Jupiter_0001.png",
    "2014_09_06/M31.png",
    "2014_09_06/M27.png",
    "2014_07_25/M16_cropped.jpg",
    "2014_07_25/M16_2.jpg",
    "2014_07_25/M16.jpg",
    "2014_07_05/NGC2359.png",
    "2014_06_20/C12_Before.png",
    "2014_06_20/C12_2.png",
    "2014_06_20/C12.png",
    "2014_06_06/C4/StackedNoDarkBias.png",
    "2014_06_06/C4/Stacked.png",
    "2014_06_06/C4.png",
    "2014_05_31/Pinwheel_Final.png",
    "2014_05_31/Pinwheel_Final.jpg",
    "2014_05_31/M84_2.jpg",
    "2014_05_31/M84/Stacked.png",
    "2014_05_31/M84.png",
    "2014_05_31/M57/Stacked.png",
    "2014_05_31/M57.png",
    "2014_05_31/M27/Stacked.png",
    "2014_05_31/M27.png",
    "2014_05_31/M17_reproc.png",
    "2014_05_31/M17.png",
    "2014_05_17/Pinwheel_verylongtimelurker_edit.png",
    "2014_05_17/Pinwheel_secondTry.png",
    "2014_05_17/Pinwheel.png",
    "2014_05_11/Moon.png",
    "2014_05_11/M82_PixInsight.png",
    "2014_05_11/M82.png",
    "2014_05_11/M51_PixInsight_2.png",
    "2014_05_11/M51_PixInsight.png",
    "2014_05_11/M51.png",
    "2014_05_11/M5.png",
    "2014_04_09/Stack1_crop.png",
    "2014_04_09/M51.png",
    "2014_04_09/M1.png",
    "2014_04_08/M51.png",
    "2014_04_08/M108.png",
    "2014_04_05/M82.png",
    "2014_04_05/M51.png",
    "2014_04_05/M104.png",
    "2014_04_05/M101.png",
    "2014_03_29/CigarSupernova.png",
    "2014_03_29/Cigar.png",
    "2014_03_20/StarToolsAttempt3.png",
    "2014_03_20/StarToolsAttempt2.png",
    "2014_03_20/StarToolsAttempt1.png",
    "2014_03_20/Satellite.png",
    "2014_03_20/OrionStarTools.png",
    "2014_03_20/Orion.png",
    "2014_03_20/MeteorOrSat.png",
    "2014_03_20/FlameSingleImage.png",
    "2014_03_20/Flame.png",
    "2014_03_20/Crab.png",
    "2014_03_17/OrionB.png",
    "2014_03_17/OrionA.png",
    "2014_03_06/Orion_ps.png",
    "2014_03_06/Orion.png",
    "2014_03_06/Moon.png",
    "2014_03_03/m42d.png",
    "2014_03_03/m42c.png",
    "2014_03_03/m42b.png",
    "2014_03_03/m42.png",
    "2014_03_03/jupiter.png",
    "2014_03_03/Sirius.png",
    "2014_02_23/OrionSeqC.png",
    "2014_02_23/OrionSeqB.png",
    "2014_02_23/OrionSeqA.png",
    "2014_02_21/Post/stack3.png",
    "2014_02_21/Post/stack2.png",
    "2014_02_21/Post/stack.png",
    "2014_02_21/M42.jpg",
    "2013_10_13/moon_10-13.20-19-19.jpg",
    "Unknown_early/saturn.png",
    "Unknown_early/saturn.jpg",
    "Unknown_early/moon.png",
    "Unknown_early/m13_ps.jpg",
    "Unknown_early/m13_8.png",
    "Unknown_early/m13_7.png",
    "Unknown_early/m13_6.png",
    "Unknown_early/m13_5.bmp",
    "Unknown_early/m13_432fsa.png",
    "Unknown_early/m13_4.png",
    "Unknown_early/m13_3.png",
    "Unknown_early/m13_2.png",
    "Unknown_early/m13.png",
    "Unknown_early/h6.bmp",
    "Unknown_early/h5.bmp",
    "Unknown_early/h4.bmp",
    "Unknown_early/h3.bmp",
    "Unknown_early/h2.bmp",
    "Unknown_early/Andromeda_ps.jpg",
    "Unknown_early/Andromeda_3.bmp",
    "Unknown_early/Andromeda_2.bmp",
    "Unknown_early/Andromeda_1.bmp",
    "Unknown_early/AlbireoAB_ps.jpg",
    "Unknown_early/AlbireoAB_3.bmp",
    "Unknown_early/AlbireoAB_2.bmp",
    "Unknown_early/AlbireoAB_1.bmp"
]

def header(f, title):
    f.write("""<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>&#10084; """+title+"""</title>
<style>
body {
    color: #444;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    line-height: 1.7;
    padding: 1em;
    margin: auto;
    max-width: 42em;
    background: #fefefe;
}

a {
    text-decoration: none;
}
</style>
</head>
<body>""")

def footer(f):
    f.write("""</body></html>""")

def fractals(f):
    header(f, "fractals")
    f.write("""<p>Yay, fractals! Hopefully your browser doesn’t explode displaying this page.</p> <p>These were rendered by various versions of my fractal raytracing program. <a href="https://imgur.com/a/rmM4v">More fractals are located here.</a></p>""")
    files = os.listdir("fractals")
    files.sort(reverse=True)
    for f in files:
        imagepath = "image/" + f
        fullpath = "fractals/" + f
        f.write("<p><a href=\"" + fullpath + "\"><img src=\"" + imagepath + "\" /></a></p> <hr />")
        if not os.path.isfile(imagepath):
            print("convert " + fullpath + " to " + imagepath)
            subprocess.run(["convert", fullpath, "-resize", "750x-1", imagepath])
    f.write("""<p>The fractals rendered by me, on this page, and the above imgur album, are under the <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.</p>""")
    footer(f)

def space(f):
    header(f, "space")
    for basepath in spacephotos:
        imagepath = "image/" + basepath
        fullpath = "fractals/" + basepath
        f.write("<code>" + basepath + "</code> <a href=\"" + fullpath + "\"><img src=\"" + imagepath + "\" /></a>")
        if not os.path.isfile(imagepath):
            print("convert " + fullpath + " to " + imagepath)
            subprocess.run(["convert", fullpath, "-resize", "750x-1", imagepath])
    footer(f)

with open("fractals.html", "w") as f:
    fractals(f)

with open("space.html", "w") as f:
    space(f)

subprocess.run(["sudo", "rsync", "--verbose", "--copy-links", "--times", "--recursive", "--delete", "--delete-excluded", "--link-dest=.", "--exclude=.*", "./", "/srv/http"])
