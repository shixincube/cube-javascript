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

import { JSONable } from "../util/JSONable";
import { FileProcessorAction } from "./FileProcessorAction";
import { FileOperation } from "./operation/FileOperation";
import { ReverseColorOperation } from "./operation/ReverseColorOperation";

/**
 * 文件操作工作。
 * @extends JSONable
 */
export class OperationWork extends JSONable {

    /**
     * 构造函数。
     * 
     * @param {FileOperation} fileOperation 
     */
    constructor(fileOperation) {
        this.fileOperation = fileOperation;
    }

    toJSON() {
        let json = super.toJSON();
        json.operation = this.fileOperation.toJSON();
        return json;
    }

    /**
     * 创建操作工作实例。
     * @param {JSON} json 
     * @returns {FileOperation}
     */
    static create(json) {
        let result = null;
        let process = json.process;

        if (process == FileProcessorAction.Image) {
            let operation = json.operation;
            if (operation == ReverseColorOperation.Operation()) {
                result = ReverseColorOperation.create(json);
            }
        }
        else if (process == FileProcessorAction.Video) {
            let operation = json.operation;
        }
        else if (process == FileProcessorAction.OCR) {

        }

        return result;
    }
}
