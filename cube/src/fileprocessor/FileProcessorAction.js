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
 * 文件处理模块的动作定义。
 */
export const FileProcessorAction = {

    /**
     * 获取媒体源地址。
     * @type {string}
     */
    GetMediaSource: 'getMediaSource',

    /**
     * 提交工作流。
     * @type {string}
     */
    SubmitWorkflow: 'submitWorkflow',

    /**
     * 取消工作流。
     * @type {string}
     */
    CancelWorkflow: 'cancelWorkflow',

    /**
     * 工作流操作中。
     * @type {string}
     */
    WorkflowOperating: 'workflowOperating',

    /**
     * 图像文件操作。
     * @type {string}
     */
    Image: 'image',

    /**
     * 视频文件操作。
     * @type {string}
     */
    Video: 'video',

    /**
     * 字符识别。
     * @type {string}
     */
    OCR: 'ocr',

    /**
     * 检测图片里的物体。
     * @type {string}
     */
    DetectObject: 'detectObject',

    /**
     * 检测图片里的物体应答。
     * @type {string}
     */
    DetectObjectAck: 'detectObjectAck'
}
