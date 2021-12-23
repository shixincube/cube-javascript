/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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
 * 视频画面尺寸描述。
 */
export const VideoDimension = {

    /**
     * QVGA 规格。
     * @type {object}
     */
    QVGA: {
        width: 320,
        height: 240,
        constraints: {
            width: { max: 320 },
            height: { max: 240 }
        }
    },

    /**
     * 较好的 VGA 约束。
     * @type {object}
     */
    VGA_IDEAL: {
        width: 640,
        height: 480,
        constraints: {
            width: { min: 320, max: 640 },
            height: { min: 240, max: 480 }
        }
    },

    /**
     * VGA 规格。
     * @type {object}
     */
    VGA: {
        width: 640,
        height: 480,
        constraints: {
            width: { max: 640 },
            height: { max: 480 }
        }
    },

    /**
     * SVGA 规格。
     * @type {object}
     */
    SVGA: {
        width: 800,
        height: 600,
        constraints: {
            width: { max: 800 },
            height: { max: 600 }
        }
    },

    /**
     * HD 高清规格。
     * @type {object}
     */
    HD: {
        width: 1280,
        height: 720,
        constraints: {
            width: { max: 1280 },
            height: { max: 720 }
        }
    },

    /**
     * FHD (1080P) 全高清规格。
     * @type {object}
     */
    FullHD: {
        width: 1920,
        height: 1080,
        constraints: {
            width: { max: 1920 },
            height: { max: 1080 }
        }
    },

    /**
     * 4K 超高清规格。
     * @type {object}
     */
    FourK: {
        width: 4096,
        height: 2160,
        constraints: {
            width: { max: 4096 },
            height: { max: 2160 }
        }
    },

    /**
     * 8K 超高清规格。
     * @type {object}
     */
    EightK: {
        width: 7680,
        height: 4320,
        constraints: {
            width: { max: 7680 },
            height: { max: 4320 }
        }
    }
}
