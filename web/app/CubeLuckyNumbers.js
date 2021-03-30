/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2021 Shixin Cube Team.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * 幸运号码。
 */
const CubeLuckyNumbers = {

    templates: [
        'AABBCCDD',
        'AAABBBCC',
        'AABBBCCC',
        'AAABBCCC',
        'ABABABAB',
        'ABCDABCD',
        'AAAABBCC',
        'AABBBBCC',
        'AABBCCCC',
        'ABBBABBB',
        'AAABAAAB',
        'AAAAXXXX',
        'ABABXXXX',
        'XXXXAAAA',
        'XXXXABAB',
        'XXAAAAXX',
        'XXABABXX',
        'AXAXAXAX'
    ],

    make: function() {
        let mod = Math.round(Math.random() * 1000) % this.templates.length;
        let A = this.rand();
        let B = this.rand();
        let C = this.rand();
        let D = this.rand();
        let template = this.templates[mod];
        let result = [];
        for (let i = 0; i < template.length; ++i) {
            if (template.charAt(i) == 'A') result.push(A);
            else if (template.charAt(i) == 'B') result.push(B);
            else if (template.charAt(i) == 'C') result.push(C);
            else if (template.charAt(i) == 'D') result.push(D);
            else result.push(this.rand());
        }

        while (0 == result[0]) {
            result[0] = this.rand();
        }

        return parseInt(result.join(''));
    },

    rand: function() {
        return Math.round(Math.random() * 1000) % 10;
    }
}

module.exports = CubeLuckyNumbers;
