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
 * 文件存储模块事件。
 */
export const FileStorageEvent = {

    /**
     * 正在进行文件上传。
     * @type {string}
     */
    Uploading: 'Uploading',

    /**
     * 文件上传完成。
     * @type {string}
     */
    UploadCompleted: 'UploadCompleted',

    /**
     * 文件上传失败。
     * @type {string}
     */
    UploadFailed: 'UploadFailed',

    /**
     * 正在进行文件下载。
     * @type {string}
     */
    Downloading: 'Downloading',

    /**
     * 文件下载完成。
     * @type {string}
     */
    DownloadCompleted: 'DownloadCompleted',

    /**
     * 文件下载失败。
     * @type {string}
     */
    DownloadFailed: 'DownloadFailed',

    /**
     * 文件已更新。
     * @type {string}
     */
    FileUpdated: 'FileUpdated'
}
