C and GCC compiler errors puzzle
===

One of my friends recently gave me this "puzzle" (modified to make it a bit clearer below)

In test2.c, there is a line with the following:

    double y = pow(x, 2);

and in test3.c, there is a line with the following (only difference is the number).

    double y = pow(x, 3);

That character is the only difference between the files, they're otherwise identical.

Here's the question: One of them compiles successfully with no warnings/errors under `-O -Wall -Wextra` (and runs correctly), the other fails with a compiler error. Why?

Hopefully you didn't glance down beyond this point, since it's a fun exercise to try to figure this out yourself.

My first guess to the solution was some gibberish related to compiletime constant evaluation of the builtin function `pow` (assuming x was constant) and overflow in the compiler. My second guess was preprocessor wizardry, like doing something dumb like `#define pow(x, y) pow_ ## y ( x )` for an optimized version of each power.

The actual reason in my friend's real-world case is more complex, and requires some explaining. The key point comes down to builtin functions (so close to my first guess) and optimization (it is key that test2.c is compiled with at least `-O1`). In particular, gcc happens to know about `pow` and will actually happily optimize away `pow(x, 2)` as `x * x`. However, when presented with `pow(x, 3)`, it retains the call to pow and will *not* optimize to `x * x * x`, even with `-O3`.

Because the `pow` was not optimized away in the 3 case (and apparently didn't link against -lm), there's an undefined symbol `pow` that causes compilation to fail. However, the symbol reference is completely gone in the 2 case, so linking succeeds and we get a binary.

Here's source for test2.c if you want to try it yourself:

    #include <stdio.h>
    #include <math.h>
    
    int main()
    {
        volatile double x = 2;
        double y = pow(x, 2);
        printf("%f\n", y);
    }

Interestingly, if we declare x to be non-volatile, the compiler optimizes away 2^3 (both cases) and it succeeds in either case, with 2 or 3 as the exponent. (It's marked as volatile because I wanted to disable that optimization aspect, since in a large program, x is usually a parameter and unknown, coming from far elsewhere in the program)

I also attempted to figure out which exact flag in `-O` causes it - I made a script that cycled through every combination of 1 and 2 flags under the `-O` flag description listed in the manpage of gcc, but everything failed - so it seems like it's either a combination of three or more flags, something that's not listed in the manpage, or something special only enabled by `-O`.
