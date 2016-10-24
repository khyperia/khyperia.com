---
pagetitle: SSH alias and autologin tutorial
---
Creating an SSH alias and setting up auto-login
===

Basic command to SSH into guardian.it.mtu.edu as user some_user

    ssh some_user@guardian.it.mtu.edu

But this is annoying to type out, so we'll make an alias:

Creating an alias
===

    mkdir ~/.ssh

("~/" means "home directory")

create file ~/.ssh/config

put this into file:

    Host guardian
        HostName guardian.it.mtu.edu
        User some_user
    Host colossus
        HostName colossus.it.mtu.edu
        User some_user

And now we can just do

    ssh guardian

and it uses that config to figure out what to do.

Setting up auto-login
===

Except we still have to enter password every time we log in (urgh!)

Generate a private/public key pair will solve this

("private key" is like a password,

"public key" is like a token that says "allow this password to log in")

---

To generate:

    ssh-keygen

press enter a few times (default location, no password, no password again)

A wacky ASCII art box should print

This will generate .ssh/id_rsa and .ssh/id_rsa.pub

KEEP .ssh/id_rsa PRIVATE, it is like a password!!

---

Next, copy the .pub file to guardian:

    ssh-copy-id guardian

You will enter your MTU password once. Note that text will not appear as you are typing your password!

---

Then, everything should be set up. Test by typing:

    ssh guardian

and you're done!
