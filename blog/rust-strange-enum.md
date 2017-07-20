Rust and the case of unexpected enum values
===

There's some interesting quirks in Rust. Here's perfectly valid Rust code:

    match Some(x) {
        Some(_) => println!("Everything is normal"),
        None => println!("How can this happen!?"),
    }

You would think that this could never take the second `None` branch, right? Well, that's not what I'm writing this blog post for.

In some (very few) cases, it prints out

    How can this happen!?

It's a bit fun to try to figure out how the heck this can ever be the case! In fact, I'm surprised that it's still possible with opt-level=3 (I would expect it would be easy to have a bug where the optimizer doesn't consider all cases). Kudos to the rust devs.

Here's the snippit that causes the wacky behavior:

    let x: &i32 = unsafe { &*(0 as *const i32) };

Figuring out exactly why that happens is left to the reader :)
