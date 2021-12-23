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

import { Packet } from "../core/Packet";

/**
 * 描述 AJAX 请求的文件块封包结构。
 * @extends Packet
 */
export class AjaxFileChunkPacket extends Packet {

    /**
     * 构造函数。
     * @param {number} cid 联系人 ID 。
     * @param {string} domain 域。
     * @param {string} fileName 文件名。
     * @param {number} fileSize 文件大小。
     * @param {number} lastModified 文件最后修改时间。
     * @param {Blob} blob 文件数据块 Blob 。
     * @param {number} cursor 文件数据块的起始游标位置。
     * @param {number} size 文件数据块大小。
     * @param {number} [sn] 包序号。
     */
    constructor(cid, domain, fileName, fileSize, lastModified, blob, cursor, size, sn) {
        super('FileChunk', null, sn);

        let formData = new FormData();
        formData.append('cid', cid);
        formData.append('domain', domain);
        formData.append('fileSize', fileSize);
        formData.append('lastModified', lastModified);
        formData.append('cursor', cursor);
        formData.append('size', size);
        formData.append('file', blob, fileName);

        this.data = formData;
    }
}
