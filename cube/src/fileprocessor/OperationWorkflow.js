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

import cell from "@lib/cell-lib";
import { JSONable } from "../util/JSONable";
import { OperationWork } from "./OperationWork";
import { FileLabel } from "../filestorage/FileLabel";

/**
 * 文件操作工作流。
 * @extends JSONable
 */
export class OperationWorkflow extends JSONable {

    constructor() {
        /**
         * 序号。
         * @type {number}
         */
        this.sn = cell.Utils.generateSerialNumber();

        /**
         * 域名称。
         * @type {string}
         */
        this.domain = null;

        /**
         * 源文件的文件码。
         * @type {string}
         */
        this.sourceFileCode = null;

        /**
         * 联系人 ID 。
         * @type {number}
         */
        this.contactId = 0;

        /**
         * 操作工作列表。
         * @type {Array<OperationWork>}
         */
        this.workList = [];

        /**
         * 结果文件的文件标签。
         * @type {FileLabel}
         */
        this.resultFileLabel = null;
    }

    toJSON() {
        let json = this.toCompactJSON();
        let works = [];
        for (let i = 0; i < this.workList.length; ++i) {
            let work = this.workList[i];
            works.push(work.toJSON());
        }
        json.works = works;
        return json;
    }

    toCompactJSON() {
        let json = super.toJSON();
        json.sn = this.sn;
        json.domain = this.domain;
        json.source = this.sourceFileCode;
        json.contactId = this.contactId;
        return json;
    }

    /**
     * 创建工作流实例。
     * @param {JSON} json 
     * @returns {OperationWorkflow} 返回 {@link OperationWorkflow} 实例。
     */
    static create(json) {
        let workflow = new OperationWorkflow();
        workflow.sn = json.sn;
        workflow.domain = json.domain;
        workflow.sourceFileCode = json.source;
        workflow.contactId = json.contactId;

        if (undefined !== json.works) {
            json.works.forEach((value) => {
                workflow.works.push(OperationWork.create(value));
            });
        }

        return workflow;
    }
}
