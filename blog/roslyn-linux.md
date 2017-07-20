Building Roslyn on Arch Linux
===

I'm going to assume you're already interested in the [Roslyn](https://github.com/dotnet/roslyn) project and want to build it, and that you're also running Arch Linux (or some other similar distribution).

First off: The [roslyn-git AUR package](https://aur4.archlinux.org/packages/roslyn-git/) is currently unmaintained, so forget that. If, in sometime in the future, this changes, then you will probably want to disregard this blog post and use that instead.

Start off by cloning the Roslyn repository, and try to run "make". If you look at the Makefile, you'll notice that it's downloading three things: `roslyn.linux.3`, `mono.linux.4`, `nuget.54`. These are: a pre-built Roslyn version plus coreclr (I think, I'm not entirely sure), a pre-built Mono version (with I think some extra patches applied), and a *ton* of NuGet stuff (including msbuild and other stuff).

Once that download is complete, the build will probably fail with something like "csc exited with code 255" or something of the like, 10-20 times, once for each project it tried to build. If we dig down into the build system, and try to invoke csc manually (`/tmp/roslyn.linux.3/csc`), we'll see that it prints the message `coreclr_initialize failed: 0x80131500`.

After enough digging/debugging, doing an `ldd /tmp/roslyn.linux.3/System.Globalization.Native.so` will show that it depends on `libicuuc.so.52` and `libicui18n.so.52`. Oops. Arch Linux's icu .so version (at the time of writing) is 56, so the .so isn't found (and don't think about symlinking 56->52, it blows up).

The only way I've gotten around this is to build icu-52 from source and install it alongside icu-56. One could probably build the AUR package `coreclr-git` and somehow redirect Roslyn's build system to use that, but building coreclr-git itself is also pretty bad as well.

Here's how I got icu-52 working: download the icu PKGBUILD, change the `pkgname` to icu-52 or something like that and add a `_pkgname=icu`, replace the `source` references to `pkgname` with `_pkgname`, and build. If you get a `__float128` error, define `CXXFLAGS="-D__STRICT_ANSI__"` in the make flags. Once a package is built, try to install it - obviously there will be file conflicts (with the normal icu 56). Copy and paste these conflicts to a .txt file, and remove the .gz from the man pages (because they're actually uncompressed during the build process, makepkg actually compresses them after `package()`), add the txt file to the `source` array, and add `cd ${pkgdir}` `rm $(cat ${srcdir}/thetxtfile.txt)` after the `make install` of `package()`. Rebuild and install, without file conflicts this time. If you're thinking what I'm thinking ("wow that's nasty"), yes, it is, but it's the only way I know how to get it to work. Note that if you install icu-52 and remove "normal icu", instead of installing both, *lots* of things *will* break, as normal system things depend on the 56 .so version as well (For example, your web browser).

Re-run the Roslyn makefile (perhaps ensure the previous `ldd` and `csc` commands work without error first), and hopefully it should build!

Some other things I ran into along the way:

If nuget.exe crashes with "value cannot be null", this was fixed (by me at least) by exporting the UserProfile environment variable before invoking nuget. I believe this is due to nuget assuming that environment variable exists before passing it into (I think) a `Path.*` function, which when it does not exist, it is null, and crashes with an incredibly helpful error message. Pointing UserProfile=~/tmp even if ~/tmp doesn't exist fixes it (it never creates that directory either).

Some things I wished for when trying to debug all of this:

The downloads for the pre-built packages take *forever*, especially nuget, and those get wiped every time I reboot. Could we at least download them to a directory inside the git repository (which is .gitignore-d), even if we have to extract them to /tmp? That way they're not wiped every reboot.

Can we allow a custom coreclr to be used? That way we can use a coreclr linked to icu-56 (or whatever system version we have) instead of the dual install crud (which is *not* very user friendly and prevents a fully automated install from the AUR). However, coreclr is also a huge pain to install, particularly due to mscorlib not being built by default on Arch.

If you try to do this yourself and end up solving problems not mentioned in this post, feel free to contact me and I'll put in your fixes. (There's probably some stuff I fixed that I forgot about before writing this blog post)

In conclusion, though, I am very happy that Roslyn is trying to have support for linux, and the fact that it even works (after a lot of hacking) is amazing.
