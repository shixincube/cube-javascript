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
 * 文件存储动作。
 */
export const FileStorageAction = {
    /**
     * 文件放置到存储中。
     * @type {string}
     */
    PutFile: 'putFile',

    /**
     * 获取文件的标签。
     * @type {string}
     */
    GetFile: 'getFile',

    /**
     * 获取根文件夹。
     * @type {string}
     */
    GetRoot: 'getRoot',

    /**
     * 插入文件到目录。
     * @type {string}
     */
    InsertFile: 'insertFile',

    /**
     * 罗列目录清单。
     * @type {string}
     */
    ListDirs: 'listDirs',

    /**
     * 罗列文件清单。
     * @type {string}
     */
    ListFiles: 'listFiles',

    /**
     * 创建新目录。
     * @type {string}
     */
    NewDir: 'newDir',

    /**
     * 删除目录。
     * @type {string}
     */
    DeleteDir: 'deleteDir',

    /**
     * 删除文件。
     * @type {string}
     */
    DeleteFile: 'deleteFile',

    /**
     * 罗列回收站里的废弃数据。
     * @type {string}
     */
    ListTrash: 'listTrash',

    /**
     * 抹除回收站里的废弃数据。
     * @type {string}
     */
    EraseTrash: 'eraseTrash',

    /**
     * 清空回收站里的废弃数据。
     * @type {string}
     */
    EmptyTrash: 'emptyTrash',

    /**
     * 从回收站恢复废弃数据。
     * @type {string}
     */
    RestoreTrash: 'restoreTrash',

    /**
     * 检索文件。
     * @type {string}
     */
    SearchFile: 'searchFile',

    /**
     * 精确查找文件。
     * @type {string}
     */
    FindFile: 'findFile',

    /**
     * 清空所有数据。
     * @type {string}
     */
    Cleanup: 'cleanup',

    /**
     * 创建分享标签。
     * @type {string}
     */
    CreateSharingTag: 'createSharingTag',

    /**
     * 取消分享标签。
     * @type {string}
     */
    CancelSharingTag: 'cancelSharingTag',

    /**
     * 获取分享标签。
     * @type {string}
     */
    GetSharingTag: 'getSharingTag',

    /**
     * 罗列当前联系人的所有分享标签。
     * @type {string}
     */
    ListSharingTags: 'listSharingTags',

    /**
     * 获取监测数据。
     * @type {string}
     */
    ListTraces: 'listTraces'
}
