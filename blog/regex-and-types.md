Understanding the relationship between values, types, and kinds using an analogy to regexes
===

So what's all this fuss about values and types? I've [written about the relationship before](types-values.html), so obviously I'm at least slightly insane for really liking the relationship between the two.

Here we go again:

---

Regexes describe sets of strings: `(a|b)` describes `{"a", "b"}`

The sets can get really big: `[a-z][a-z][a-z]` describes `{"aaa", "aab", ..., "baa", ..., "zzy", "zzz"}`

The sets can get infinitely big: `(a|b)*` describes `{"", "a", "b", "aa", "ab", "ba", "bb", "aaa", ...}`

---

Types describe sets of values: `bool` describes `{false, true}`

The sets can get really big: `uint32` describes `{0, 1, 2, 3, ..., 2147483647}`

The sets can get infinitely big: `bool[]` describes `{[], [false], [true], [false, false], [false, true], ...}`

---

Wow, that certainly looks similar! Let's see if we explore the operations regexes can have and see if there's an analogy for types:

Leaving holes inside a regex for more regexes:

    // `{hole}` is a syntax I made up - it's like string interpolation,
    // you can replace the hole with another regex
    let regex_twice = /{hole}{hole}/
    let a_or_b = /(a|b)/
    let twice_a_or_b = regex_twice.with(hole = a_or_b)
    twice_a_or_b == /(a|b)(a|b)/
    twice_a_or_b == {"aa", "ab", "ba", "bb"}

Well then, that looks awfully similar to a tuple containing two bools:

    type TypeTwice<T> = (T, T);
    type TrueOrFalse = bool;
    type TwiceTrueOrFalse = TypeTwice<TrueOrFalse>;
    TwiceTrueOrFalse == (bool, bool);
    TwiceTrueOrFalse == {(false, false), (false, true), (true, false), (true, true)}

Cool! So generics are regexes with holes. Let's try another: can we get HKTs?

    // takes a regex, and fills in the hole of *that* with "a|b",
    // and then makes the whole thing repeated
    let funky_thing = /{hole.with("a|b")*}/
    let twice = /{hole}{hole}/
    let result = funky_thing.with(twice)
    result == ((a|b)(a|b))*

And the same thing, with HKTs:

    type FunkyThing<M> = M<bool>[]
    type Twice<T> = (T, T);
    FunkyThing<Twice> == (bool, bool)[]

Awesome!! Seems like we can represent a bunch of cool typing concepts with regexes.

---

But wait, there's more! What's this "dependent typing" thing? It's actually pretty simple with regexes!

Lets start with a regex:

    let num_times = Int::Parse(Console::ReadLine());
    // note that the syntax /(blah){4}/ in regex means
    // "repeat blah four times - blahblahblahblah"
    let that_many_chars = /[a-z]{num_times}/

Woah. Okay. I can't even show the result of that computed: the *regex* depends on a *value* in the program. If the user types in "3", that's certainly not a regex - it's an int! However, we dynamically compile the regex, and sure enough, the result (if the user types in "3"), is `/[a-z]{3}/`

Now, the related type:

    let array_size = Int::Parse(Console::ReadLine());
    type ThatManyInts = int[array_size];

Woah. Dynamically sized arrays, strongly-typed, at runtime. Only incredibly fancy languages, like Idris, and the advanced research language C (with gcc extensions), have this feature!

The opposite, going from types to values, is pretty simple:

    let regex = /(a|bc)/;
    let value = regex.ToString();

Neat!

---

Okay, I promised describing Kinds too - the thing in Haskell called `*`. Super wacky, it's like a type for types. Let's use our regex analogy: replace type with regex. Now it's "a regex for regexes". Well, that's pretty simple!

Let's say we want to validate regexes coming in from a user, and make sure they only use regexes that can be translated to globs (we're also bad coders and forgot to include anything other than lowercase letters): any character from `a-z`, `.` (same as ? in a glob), `.*` (same as \* in a glob).

    let incoming_regex = scary_source();
    let validator = /([a-z]|\.|\.\*)/
    assert validator.matches(incoming_regex)

But... wait a minute! "Validator" is a regex that performs on regexes - it's a regex for regexes! It's the same thing for Kinds: stuff like `* -> *` validates that the incoming type is a type that takes a type as an argument.

Neato.

---

Thanks for reading, and I hope you learned something cool!
