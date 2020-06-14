Big-O notation is (very, very rarely) useful! wau!
===

When doing random personal coding projects, I had a weird problem: I had a string, and then a sequence of (range,
replacement string) pairs to replace subsections of that string with. (I could assume the ranges were nonoverlapping,
to simplify things)


```rust
fn replace(original: &str, replacements: Vec<(Range<usize>, &str)>) -> String;
```

The simplest algorithm I could think of was to sort `replacements` by ascending order, then scan through them,
alternating between inserting chunks of the original text, and the replacement text:

```rust
fn replace(original: &str, mut replacements: Vec<(Range<usize>, &str)>) -> String {
    let delta_size: isize = replacements.iter()
        .map(|(location, replacement)| replacement.len() as isize - location.len() as isize)
        .sum();
    let new_size = (original.len() as isize + delta_size) as usize;
    let mut result = String::with_capacity(new_size);
    replacements.sort_by_key(|(location, _)| location.start); // sort!!
    let mut last_end = 0;
    for (location, replacement) in replacements {
        result.push_str(&original[last_end..location.start]);
        result.push_str(replacement);
        last_end = location.end;
    }
    result.push_str(&original[last_end..]);
    result
}
```

But! Passing in a `Vec` there is kind of gross, and it'd be really nice to pass in an `Iterator<...>` instead. My
thoughts went to an algorithm where you have some sort of index mapping where you keep track of what indices in the
source correspond to the partially-replaced string (since if you replace a chunk where the replacement length isn't
the same as what you're replacing, the indices get moved). That sounds really complicated to design, though, and I
wasn't actually sure if it'd be faster.

So I used big-O shenans!

1) Our current algorithm runs in O(n*log(n)), due to the `sort` call.
2) We'd like our fancy new algorithm to run in O(n) time (one loop through the `Iterator`).
3) So... let's start a proof. Assume that we have an implementation of `replace` that runs in O(n).
4) Let's implement a `sort` routine *using our O(n) `replace` function*

```rust
fn speedysort(arr: &[usize]) -> Vec<usize> {
    let source = ",".repeat(arr.iter().copied().max().unwrap_or(0));
    let replacements = arr.iter().map(|&i| (i..i, format!("{}", i))).collect();
    let result = replace(&source, replacements);
    result.split(',').filter(|s| !s.is_empty()).map(|i| i.parse().unwrap()).collect())
}
```

5) Ignoring the obvious horribleness here, note that this sort routine runs in `O(n)` time!
6) This is impossible, since sort routines must take at least `O(n*log(n))` time.
7) By proof by contradiction, that means item 3 is false, and we cannot have a `replace` that runs in O(n) time.

So hey, we figured out that our conceptually faster algorithm is just straight up impossible, and so we don't have to
waste any time trying to implement it!