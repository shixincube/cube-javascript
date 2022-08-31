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
 * 文件存储模块状态。
 */
export const FileStorageState = {

    /**
     * 成功。
     * @type {number}
     */
    Ok: 0,

    /**
     * 遇到故障。
     * @type {number}
     */
    Failure: 9,

    /**
     * 无效的域信息。
     * @type {number}
     */
    InvalidDomain: 11,

    /**
     * 无效的参数，禁止访问。
     * @type {number}
     */
    Forbidden: 12,

    /**
     * 未找到指定数据。
     * @type {number}
     */
    NotFound: 13,

    /**
     * 未授权访问。
     * @type {number}
     */
    Unauthorized: 14,

    /**
     * 拒绝操作。
     * @type {number}
     */
    Reject: 15,

    /**
     * 文件标签错误。
     * @type {number}
     */
    FileLabelError: 16,

    /**
     * 正在写入文件。
     * @type {number}
     */
    Writing: 17,

    /**
     * 没有目录。
     * @type {number}
     */
    NoDirectory: 18,

    /**
     * 重名。
     * @type {number}
     */
    DuplicationOfName: 20,

    /**
     * 搜索条件错误。
     * @type {number}
     */
    SearchConditionError: 25,

    /**
     * 模块的工作状态未就绪。
     * @type {number}
     */
    NotReady: 101,

    /**
     * 文件 I/O 异常。
     * @type {number}
     */
    IOException: 102,

    /**
     * 读取文件错误。
     * @type {number}
     */
    ReadFileFailed: 103,

    /**
     * 上传失败。
     * @type {number}
     */
    TransmitFailed: 104,

    /**
     * 获取文件标签失败。
     * @type {number}
     */
    GetFileLabelFailed: 105,

    /**
     * 数据通道未就绪。
     * @type {number}
     */
    PipelineNotReady: 106,

    /**
     * 数据格式错误。
     * @type {number}
     */
    DataFormatError: 107,

    /**
     * 空间超限。
     * @type {number}
     */
    OverSize: 110,

    /**
     * 未知的状态。
     * @type {number}
     */
    Unknown: 99
}
