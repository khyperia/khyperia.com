Copying files to/from Guardian/Colossus
===

Note: This tutorial assumes you have set up an alias as described in [this tutorial](ssh_keygen.html).

---

To get `file/at/path` to guardian at `other/path`:

    scp file/at/path guardian:other/path

To get from guardian to local:

    scp guardian:other/path file/at/path

---

Remote path defaults to `$HOME`, so:

    scp file/at/path guardian:

will copy to your home (default) folder.

---

If you need to copy a folder, not file, use the -r option (recursive) - you'll get an error otherwise

    scp -r some_folder guardian:dest_folder

---

if some_folder already exists, you don't need to do this:

    scp file.txt guardian:some_folder/file.txt

this will work (default appends to path if directory already exists)

    scp file.txt guardian:some_folder

