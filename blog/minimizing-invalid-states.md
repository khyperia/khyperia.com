More reliable software through minimizing invalid states
===

This post is about me writing down and figuring out my subconscious avoidance of the potential of "invalid states".

First off, some assumptions that I'll be basing my arguments off of.

* The execution paradigm that we're using is imperative programming: this excludes functional-only languages, although most concepts still translate (after some reworking). Specifically, we're using the definition of "a program is a sequence of statements that change the program's state"
* Murphy's Law is true: in particular, the more places a program *can* have bugs, the more bugs there *will* be.

---

First, let's start with algorithm and data structure design.

I'll use the example of a singly linked list and doubly linked list. A doubly linked list has an element, an optional next reference, and an optional previous reference. So, if you receive an arbitrary object that is one of these things, a "doubly linked list node", there is an issue: even assuming all references are valid (e.g. ignoring that C can have bogus pointers), the object may still be invalid. For example, the definition of a doubly linked list implies that moving to the next element and then the previous element of that element will land you right where you started from. However, it's entirely possible you won't! Someone may have forgotten to update the backwards reference of a node when inserting, for example.

A singly linked list is simpler: just an element and an optional "next" node. This data structure cannot have an invalid state: if you receive an object that has the type of a linked list, it will always be in a valid state. There is no duplication of data (as with the previous and next references of a doubly linked list), so there's no possibility for data to be in conflict with each other.

Using those two conclusions, and an assumption I made earlier, we can show something interesting: because the doubly linked list has the potential to be invalid due to information duplication, using Murphy's Law on it says that there will be bugs in code that deals with it. However, with a singly linked list, there is no possibility of invalidity, so the predicate of Murphy's Law ("if it can go wrong") is false, and so the conclusion doesn't hold ("it will go wrong").

My ideal solution to this problem is to make as much state *derived* as possible, and minimize the amount of raw information so that as little state is duplicated as possible (hopefully zero state). Derived means it is calculated from other data, without actually storing the data: if you have a 2d vector structure, don't store the polar coordinate angle as a third field (that may accidentally become inconsistent with the X and Y cartesian coordinates), rather, calculate it on the fly when requested with the arctangent function. Linked lists are a bit more complicated: if you only need the ability to backtrack, instead of storing a backwards pointer in the data itself, use a derived data structure that remembers how you got somewhere. The act of retrieving the "next" element will return a structure that does represent the next element, but also remembers that it came from the current one (and so can travel backwards). (As a side note, this is similar to Roslyn's "red-green tree" implementation for it's AST, a design which I really really like)

However, there's an issue with this solution: performance. First, all of the common sayings of "premature optimization is the root of all evil": in our previous example of a 2d vector, yes, arctangent is slow, but evaluate first if it's actually a bottleneck and deserves extra complexity (and therefore possibility of bugs). If, however, a "derived data" calculation is truly a bottleneck, there is an extremely simple method to make it go faster: caching.

Caching, by definition, is duplication of data, and introduces bugs (by Murphy's Law). However, the advantage of this method is that the developer is very clearly viewing it as the abstraction of caching, and knows to be careful. Perhaps there are dedicated caching helpers in a library for their language, but even if not, explicitly marking data as "this is a potentially invalid piece of data with these explicit dependencies" and writing code as such will allow potential bugs to be much more clear to the developer (as it is very easy to build easily verifiable abstractions for this), hopefully reducing bugs.

The alternative to caching is implicit assumptions: in the vector example, whenever anything touches the X or Y components, they must also remember to update the angle and keep things in a valid state. So, if there is a bug (Murphy's Law again) and that task is forgotten, things will become invalid and software will break. With caching there is no assumption of validity: invalidity is explicitly checked for, and handled accordingly to update the derived state.

---

There's another side to this issue: types, instead of data.

Instead of removing potential duplication (and inconsistency) of state from data structures, another option is to strengthen the type to reduce or eliminate the possibility of inconsistency.

For example, in the case of the linked list, a doubly linked list can become safe and guaranteed valid if the type of a doubly linked list node includes the assumption/assertion that "if the current node has a next element, the next element's previous element is equal to the current node" and a similar statement for the previous element (and if that assumption doesn't hold, it is not a doubly linked list - a compiler error if your language is statically typed, or error/exception if dynamic)

However, this solution is difficult to use in practice, as most modern programming languages make strong typing (especially with complex descriptions such as that example) impractical or impossible, and tend to have a generally weak typing system. As such, I tend to gravitate towards minimizing the complexity of the data structure to match the complexity of the language's type system (as increasing the complexity of the type system to match the data structure is usually not possible).

---

If you'd like to hear more of my thoughts on types, the ideas I wrote in this post are fairly closely related to the ideas in my post about [Types and Values](types-values.html)
