// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
function hashString(str: string) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

// https://stackoverflow.com/questions/424292/seedable-javascript-random-number-generator
class RNG {
    // LCG using GCC's constants
    m: number = 0x80000000; // 2**31;
    a: number = 1103515245;
    c: number = 12345;
    state: number;

    constructor(seed: number) {
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }

    nextFloat() {
        // returns in range [0,1]
        return this.nextInt() / (this.m - 1);
    }

    nextRange(start: number, end: number) {
        // returns in range [start, end): including start, excluding end
        // can't modulu nextInt because of weak randomness in lower bits
        var rangeSize = end - start;
        var randomUnder1 = this.nextInt() / this.m;
        return start + Math.floor(randomUnder1 * rangeSize);
    }

    choice<T>(array: T[]) {
        return array[this.nextRange(0, array.length)];
    }
}

export function rngFromString(str: string) {
    str = str.replace(/^#/, "");
    const num = +str;
    if (isNaN(num)) {
        return new RNG(hashString(str));
    } else {
        return new RNG(num | 0);
    }
}
