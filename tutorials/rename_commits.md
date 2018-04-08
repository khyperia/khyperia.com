Renaming your username in Git commits
===

This script will do the trick:

    git filter-branch -f --commit-filter '
        if [ "$GIT_AUTHOR_NAME" = "Dead Name" -o "$GIT_COMMITTER_NAME" = "Dead Name" ];
        then
            GIT_AUTHOR_NAME="Actual Name";
            GIT_COMMITTER_NAME="Actual Name";
            git commit-tree "$@";
        else
            git commit-tree "$@";
        fi' HEAD

Caveats:

* It will strip GPG signatures, even if the commit (including its parent) doesn't change. Ugh.
* Obviously rewrites history, and needs quite a massive force-push (so probably not good for multi-person projects. \*tears\*)
* It assumes AUTHOR_NAME == COMMITTER_NAME (if you're in only one of the two, this will (probably-incorrectly) take ownership of both fields)
* It's a crappy script and can be improved a lot.

Notes:

* Git commits have TWO names: the author, and the committer. There's a logical reason behind this, but google is going to be way better at explaining why than me. Just keep in mind to change *both* the committer *and* the author, assuming they're the same.

Source: [https://stackoverflow.com/a/2931914](https://stackoverflow.com/a/2931914)
