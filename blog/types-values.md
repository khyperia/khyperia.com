Types and values
===

This originally came out of a discussion (more of a rant) by me on an IRC channel. The original text (with intermediate stuff stripped) can be found at the bottom.

The questions I'm trying to answer are "What are types? How are they practically useful?". I'll start by making some comparisons to Python and Haskell.

Python is my classic example of a language that's not typed. Granted that's a lie, as it's dynamically typed, not untyped, but please ignore my terrible misuse of terminology and just go with me. For example, let's say we have a function. Looking only at its signature, what can you tell me about it? No cheating by looking at argument names or similar things, essentially, we're the compiler (and the compiler doesn't know English words). Practically, you can tell me almost nothing. Perhaps you can assert it takes two arguments and might return a value (in this particular case).

Let's move on to Haskell. Say this function has the type `(Num a) => a -> a -> a`. Woah! We can suddenly say a *lot* about what the function does! It takes two arguments (well, curried) and returns one, all three the same type. The Num constraint also implies we're doing something mathematical to it, maybe adding, or multiplying the two arguments. We could do something dumb, too, like make it just be implemented by the `const` function (discard one argument and return the other). Look at how there's a few different possible implementations: there's quite a lot of specificity in the type (more so than Python!), but there's still room for different or odd implementations.

Taking a step back, let's look at the Haskell tool `Djinn`. I haven't used it much, but from what I understand it, it takes a type, and attempts to find a function/value that will satisfy that type. It can do some pretty complicated things, too! When given `(a -> b) -> (a, c) -> (b, c)`, it gives back `f a (b, c) = (a b, c)` (which is pretty simple, but you get the idea)! However, note that because of my previous comments about Haskell having room for different implementations, Djinn cannot be perfect and implement any type thrown at it.

But... let's stretch our imaginations for a bit, and enter the land of hypothetical situations. Imagine a new language, let's call it SuperTyped, whose types allow for one (and no more than one) implementation (and maybe zero implementations). Return to the two-argument function example from earlier. Say, the syntax for the type was something like `(a, a) -> <type whose value is sum of first argument>`. Granted, the compiler would have to be pretty magical to figure that out, but this is imagination-land. Then, say a Djinn-clone was made for this language. We would no longer have to write any function implementations! Just embed the Djinn-clone into the compiler, and have it generate the function for you.

Wait a minute. Didn't we just shove the "implementation" of the function into the type? Pretty much, yeah. So here I start making leaping conclusions: **Types are useless without an underlying value system that is more expressive than the types themselves.** If there exists only one (or zero) implementations of a type, as in SuperTyped's Djinn, then we might as well be writing in an untyped language. If the types are the implementation, we just wrote `def f(x, y): return x + y` but called it a "type", no better than that code as Python.

Exploring that idea more, we come across the idea that *typechecking* is *evaluation* in SuperTyped. So wait... apparently, then, running a Python program is equivalent to typechecking it. This makes sense! If a TypeError is raised (or some other exception), then obviously the program is badly typed. But there's a difference here - typechecking is usually done at compile-time, and evaluation is usually done at runtime. So let's restate the previous statement about types being useless, but with slightly different words. **Types are only useful if they can be checked at compile-time, even if their values cannot be obtained until runtime**. `IO` is a perfect example of this. The value of an `IO` in Haskell cannot be obtained until runtime, but its type can be checked at compile-time. Again, though, there's this looseness of "the compiler cannot fully check it until runtime", with, for example, malformed input.

Restating that final paragraph as a final conclusion: The reason types are useful is that they can be evaluated (and checked) when the value that holds that type cannot be obtained at that moment.

---

Thanks for reading! If you happen to know any more formal research related to this topic, I'd love to read about it! This was done entirely from my own ideas, so I'd love to read some peer-reviewed things to clarify the probable holes my arguments have, etc., and maybe edit this article to fix them. And, as I mentioned in the introduction, this was originally a text barf on IRC, which the log can be found below.

    17:54 <khyperia> .... wait a minute, I just had a serious language design
        lightbulb go off
    17:57 <khyperia> so there exist tools in haskell that do things like "given
        a function signature, attempt to make an implementation for the
        function". It doesn't always work due to lack of information on what the
        function does in the type (but seeing as it's pretty strongly typed, it
        does alright). So that got me thinking: design a language that exists in
        source solely in types, and the compiler always can figure out how to
        implement a function. Then I realized: this is pretty much practically
        equivalent to an untyped language, we just changed the meaning of a few
        things, and poof. So my lightbulb: Typing isn't useful just due to
        typing. It's useful because there's a value<->type relationship.
    17:58 <(not me)> properly typed programs are properly typed
    17:59 <khyperia> I'm more talking about the strength of types, and what
        guarantees the type makes about the behavior of a function
    18:00 <khyperia> it ranges anywhere from python ("it doesn't tell you
        anything"), to haskell ("lots of stuff, but not everything"), to my
        hypothetical language ("everything is specified in the type")
    18:01 <khyperia> for example, the haskell type "(Num a) => a -> a -> a".
        This could be anything, really, but we know it probably involves math of
        somesort as a binary operation. If we change that to"(Num a) => a -> a
        -> <type indicating that it's the sum of the first two args>", then we
        know exactly what the function does.
    18:02 <khyperia> and in the hypothetical language, the actual implementation
        isn't needed to be typed out, because the compiler can infer it
    18:02 <(not me)> seems like you just kicked the buck down to that last type
    18:02 <khyperia> ... but wtf, we basically just typed it out in the type
        instead, "x: a -> y: a -> (sum of x and y): a"
    18:03 <(not me)> ye, and the compiler has to know what sum means
    18:03 <khyperia> yeah, stuff like that, etc., but assume it's a fancy
        compiler. (Idris compiler does something similar)
    18:04 <khyperia> so taking a big leap, I say that writing it in the type is
        no different than writing the function itself.
    18:04 <khyperia> so therefore types as types themselves are useless, and
        need an underlying value that's more specific than the type to be useful.
    18:08 <khyperia> Or, in other words, when given a program, why not just
        evaluate it to see if it's right? If it all typechecks / runs correctly
        (identical under my theoretical language), then happiness!... which
        putting it in those words, makes it more clear: types are useful because
        they describe the behavior of a value when there's no value present to
        check against (for example, it comes from IO)
    18:08 <khyperia> Hmm. That's enough ranting for me, I'm going to go throw
        this in a blog post since I feel like it's super interesting.
