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

import { AuthService } from "../auth/AuthService";
import { ModuleError } from "../core/error/ModuleError";
import { Module } from "../core/Module";
import { Packet } from "../core/Packet";
import { FileProcessorAction } from "./FileProcessorAction";
import { FileProcessorState } from "./FileProcessorState";
import { CVResult } from "./CVResult";

/**
 * 文件处理器。
 */
export class FileProcessor extends Module {

    static NAME = 'FileProcessor';

    constructor() {
        super('FileProcessor');
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {

    }

    /**
     * 检测图片内的物体。
     * @param {string} fileCodeOrLabel
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    detectObject(fileCode, successCallback, failureCallback) {
        let packet = new Packet(FileProcessorAction.DetectObject, {
            domain: AuthService.DOMAIN,
            fileCode: fileCode,
            drawBoundingBox: false
        });

        this.pipeline.send(FileProcessor.NAME, packet, (pipeline, source, response) => {
            if (null == response || response.getStateCode() != StateCode.OK) {
                let error = new ModuleError(FileProcessor.NAME, FileProcessorState.Failure, fileCode);
                failureCallback(error);
                return;
            }

            let res = packet.getPayload().data;
            let cvResult = CVResult.create(res);
            successCallback(cvResult);
        });
    }
}
