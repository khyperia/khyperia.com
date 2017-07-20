How I see git
===

This is a description of how Git woks, and how I interact with Git think of its commands. Once I realized the things I'll list in this post, I was able to manipulate Git repos much, much easier, and a lot of things made a whole lot more sense.

First off, obtain a git repo somehow. I'll assume some basic knowledge of using git here - any reasonably-sized repo will work here (>5 commits, multiple files, merges in history will be nice). I'll be using my own repo, Clam3, in this article: `git clone https://github.com/khyperia/Clam3.git`.

The core concept I base things off of is that git is a linked list - "directed acyclic graph" or DAG to be specific, if you've heard that term before. I think a loose definition of a linked list is a bit easier to practically understand at first, though.

So, what's the core concepts of a linked list?

* A node. Nodes contain data...
* ... and a "pointer" to the next node.
* Some way to obtain the first node.

Let's start with the third point: how do we get the first node in this linked list?

Simple: git keeps these "first pointers" inside the directory `.git/refs/heads`. This directory contains a bunch of files, one of them is probably named `master`. Go ahead and print it out:

    % less master
    5405db7df8eaaa1b721b25a0496bc36ac95bb447

Hey look, that looks like a pointer-ish thing - technically a sha1 hash, and you probably recognize things that look like that from previous experiences with git. How do we see the node it points to, though? `git cat-file -p`

    % git cat-file -p 5405db7df8eaaa1b721b25a0496bc36ac95bb447
    tree 2e2c9290a00386a3aaadd95c3a19ba28f049068a
    parent 0368efb1ce81061378cc02b06150ad8c31ffd51a
    author khyperia <khyperia@live.com> 1486739876 -0500
    committer khyperia <khyperia@live.com> 1486740142 -0500

    Format everything

(I have fantastic commit messages on my personal projects)

`git cat-file -p` takes a sha1 hash "pointer", and dumps the raw text associated with it. These actual items live in `.git/objects/`, in a weird two-level directory thing (a quirky optimization to make the filesystem not die when there's a bunch of objects). Any pointer we run `cat-file` should have a corresponding file here - but things get weird, as they're compressed, sometimes in weird bundles (another optimization).

This looks interesting, though: We have a node. It's actually the most recent commit in my project (at the time I'm writing this post). It has some stuff in it: "author" and "committer" that has me in it (google for other posts if you want to know why there's two fields there), the commit message in free-form text at the bottom, and two really interesting lines: "tree" and "parent". Those are more pointer-ish things - let's apply `git cat-file -p` some more!

Let's start with the "parent" line:

    % git cat-file -p 0368efb1ce81061378cc02b06150ad8c31ffd51a
    tree 8a39103dd5556ab387063d016b7f5b42bd3e39f0
    parent 6a71d1de6519a02751d0655d923d552f6950197c
    author khyperia <khyperia@live.com> 1485822498 -0500
    committer khyperia <khyperia@live.com> 1485822498 -0500

    Cut out old mandelbox

Hey look! That's the previous commit. It also has a "tree" and "parent"! Well, that's pretty simple then: git is just a linked list of commits, each one points to the one before it. This is a super important concept, and the core of this blog post.

Let's take a peek into whatever the heck this "tree" line is, just to get it out of the way:

    % git cat-file -p 2e2c9290a00386a3aaadd95c3a19ba28f049068a
    100644 blob 49a5edbae615944fdbb35822aa3027f1992ea8a9    .gitignore
    100644 blob 6f878b8fc85a527e5f909a1e23db7526f16732f0    CMakeLists.txt
    040000 tree 3139910e381068717980d50d8f3e0bb25d4c078e    cmake
    100644 blob a02f596a9f47c3f894e1911ddc78abaeba62e33e    cudaContext.cpp
    100644 blob a50b33f982887baaa63bad168ee9744040e6142e    cudaContext.h
    100644 blob b4432e4bfed77f3049de4c9d10e778e4fc2bf164    cumem.h
    ...

Well, that looks like a directory! It has a bunch of files ("blob") in it, with mode permissions, and other directories ("tree"). Let's dig into "cmake", which is listed as "tree":

    % git cat-file -p 3139910e381068717980d50d8f3e0bb25d4c078e
    100644 blob d793c9d1abd90ce0c52a268175b22ac4cef56921    FindSDL2.cmake
    100644 blob b05a4b2d7b7413be605aefc5583046c613240e8c    FindSDL2_net.cmake
    100644 blob 7276d4faa046ab804f8a2df096b513a8d7588d90    FindSDL2_ttf.cmake
    100644 blob fbb99d5e404d93d8f132be3986028df5581c5575    FindVRPN.cmake

Hey look, another directory! One last example, to show how the actual file contents are stored:

    % git cat-file -p d793c9d1abd90ce0c52a268175b22ac4cef56921
    find_path(SDL2_INCLUDE_DIRS
        NAMES SDL.h
        PATH_SUFFIXES SDL2
        )
    ...

that's the source code! Cool! (... well, it's technically bits of the build system, but actual C++ source here is stored identically)

Every commit stores it's entirely unique file tree. This seems like a potentially huge waste of space, but keep in mind that "sha1 hash pointers" are based on the contents of them - if a file didn't change, its hash won't change, and the same hash and file will be used in both commits trees (they're immutable, so it's fine!). If all the files in a directory don't change, then the directory's hash won't change either (as it includes the hash of its contents in its own "contents"), and so there's really not a lot of extra information being stored every commit.

Okay, so, let's go back to the commits. What happens when you run `git commit`? It hashes everything in the working directory and dumps it into `.git/objects`, and creates a commit with that hash as the "tree" line. It also dumps that commit into `.git/objects`, and takes the hash of *that* and replaces the contents of `.git/refs/heads/branch_name` with that hash: effectively advancing the branch one commit forward.

So, we have a single branch, with a single line of commits. Seems like an awfully complicated system if it can only do just that!

Let's see how branches work: it's pretty simple! When you create a new branch, Git creates another file in `.git/refs/heads` with the most recent commit in that branch. Easy! We can share all the "common ancestors" of each branch, because they have the same hash. At some point, a commit just has two more recent commits pointing to it, and that's fine!

Now for a complicated bit: how the heck do merges work?

The "tree" line is as usual: git just stores the contents of the merged files in yet another directory tree. How does it record that it just took two commits and mashed them together?

    # not actually from the Clam3 repo, but from another repo I had lying on my hard drive with a merge commit
    % git cat-file -p 37a74d6823df9d473eb4f36d08f464f264d16840
    tree 86a1f330c5375902ba532304be2a880632ad2476
    parent be923d61e1167c2736c8fde3f057e0a30fcd60cb
    parent 0e6f664637d66f6bbe9253f48faf22f54e85389f
    author Scott Kuhl <kuhl@mtu.edu> 1476745085 -0400
    committer Scott Kuhl <kuhl@mtu.edu> 1476745085 -0400

    Merge branch 'master' of github.com:skuhl/opengl-examples

Wow, that's silly: it just has two parents! Pretty obvious representation of "hey, this commit took the contents of two things and unified them".

From here, we can really run!

* `git rebase` takes a series of commits, changes them to be "removed this text and added this text", and then applies the diff to another parent commit (creating new commits in the process) to "replay" the changes over there.
* `git rebase --onto` is a more generalized form of the above, allowing any sequence of commits ("from this commit, to this commit"), and dumps it onto an arbitrary other commit. **This is one of my favorite commands!** It took me a bit to remember the order the hashes come in - it's `git rebase --onto put_on_to_this_commit the_commits_from_this_one until_this_one`
* `git reset` flings around `HEAD`, which is what Git thinks is "the commit we're currently looking at". Various options let you change the working tree or not, which is the *actual* files on disk.
* `git checkout` flings around the actual files on disk. Various options let you also change `HEAD` or not.
* "Remotes" are really just "ways to get more `.git/refs` files, and then also ways to grab the objects those point to".
* `git fetch` is "okay, let's hit the web, look at our remote(s), and update our `.git/refs/remotes` (a directory similar to `.git/refs/heads`, but only for all of the remote things not under our control), and download all the hashes (files/objects) that we don't know about (i.e. they're new).
* `git pull` is a *combination* of `git fetch` then `git merge`, which updates `.git/refs/remotes` and then pulls those changes into `.git/refs/heads`. Note you don't have to merge after fetching! I enjoy the extra control, so I almost never use `git pull`.
* `git merge --ff-only` and "fast-forwarding" in general is the act of rewriting `.git/refs/heads` without creating *any* new object files/hashes (merge commits) - note that it isn't always possible, for example in the case when you have extra commits that the thing you're trying to merge doesn't have, so it sometimes fails.
* `git stash` is just a clever way of remembering hashes. Stuff you store in here is just temporary commits whose hashes are remembered in `.git/refs/stash`
* `git tag` is just adding more files to remember hashes, in `.git/refs/tags`.
* And so on and so forth - it's super easy to think of git commands when you're thinking about just what they're doing to `.git/refs` and `.git/objects` as linked lists!

I hope this was a helpful post! I've been working with git for a while, and hopefully the "linked list" concept isn't too much of a "monad tutorial fallacy" (where only the "aha moment" is taught, and not the background that lead up to the aha moment).

Thanks for reading!
