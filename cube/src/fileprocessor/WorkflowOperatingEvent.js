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

import { WorkflowEvents } from "./WorkflowEvents";
import { OperationWorkflow } from "./OperationWorkflow";
import { OperationWork } from "./OperationWork";

/**
 * 工作流操作事件。
 */
export class WorkflowOperatingEvent {

    /**
     * 构造函数。
     * @param {JSON} json 
     */
    constructor(json) {
        /**
         * 事件名称。
         * @type {string}
         * @see WorkflowEvents
         */
        this.name = json.name;

        /**
         * 工作流。
         */
        this.workflow = OperationWorkflow.create(json.workflow);

        /**
         * 工作。
         */
        this.work = (undefined !== json.work) ? OperationWork.create(json.work) : null;
    }

    /**
     * 获取事件名称。
     * @returns {string} 返回事件名称。
     */
    getName() {
        return this.name;
    }

    getWorkflow() {
        return this.workflow;
    }

    getWork() {
        return this.work;
    }
}
