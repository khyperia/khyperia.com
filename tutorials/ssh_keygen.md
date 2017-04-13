---
pagetitle: SSH alias and autologin tutorial
---
Creating an SSH alias and setting up auto-login
===

This is the basic command to SSH into guardian.it.mtu.edu as user some_user

    ssh some_user@guardian.it.mtu.edu

But that's annoying to type out, so we'll make an alias!...

Creating an alias
===

    mkdir ~/.ssh

("~/" means "home directory")

Now, create the file `~/.ssh/config`

Put this into the file:

    Host guardian
        HostName guardian.it.mtu.edu
        User some_user
    Host colossus
        HostName colossus.it.mtu.edu
        User some_user

And now we can just do

    ssh guardian

and it uses that config to figure out what to do!

Setting up auto-login
===

Problem: we still have to enter password every time we log in (urgh!)

Generating a private/public key pair will solve this!

("private key" is like a password, "public key" is like a token that says "allow this password to log in")

---

To generate both keys:

    ssh-keygen

and press enter a few times (default location, no password, no password again)

A wacky ASCII art box should print. Afterwards, `.ssh/id_rsa` and `.ssh/id_rsa.pub` should be generated.

KEEP .ssh/id_rsa PRIVATE, it is like a password!!

---

Next, copy the .pub file to guardian:

    ssh-copy-id guardian

You will enter your MTU password once. Note that text will not appear as you are typing your password!

---

Then, everything should be set up. Test everything by typing:

    ssh guardian

and you're done!
