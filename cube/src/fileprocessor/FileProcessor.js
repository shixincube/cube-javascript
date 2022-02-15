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

import { AuthService } from "../auth/AuthService";
import { ModuleError } from "../core/error/ModuleError";
import { Module } from "../core/Module";
import { Packet } from "../core/Packet";
import { PipelineState } from "../core/PipelineState";
import { FileLabel } from "../filestorage/FileLabel";
import { FileProcessorAction } from "./FileProcessorAction";
import { FileProcessorState } from "./FileProcessorState";
import { CVResult } from "./CVResult";

/**
 * 文件处理器。
 * @extends Module
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
     * @param {string|FileLabel} fileCodeOrLabel
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    detectObject(fileCodeOrLabel, successCallback, failureCallback) {
        let fileCode = fileCodeOrLabel;
        if (fileCodeOrLabel instanceof FileLabel) {
            fileCode = fileCodeOrLabel.getFileCode();
        }

        let packet = new Packet(FileProcessorAction.DetectObject, {
            domain: AuthService.DOMAIN,
            fileCode: fileCode,
            drawBoundingBox: false
        });

        this.pipeline.send(FileProcessor.NAME, packet, (pipeline, source, response) => {
            if (null == response || response.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileProcessor.NAME, FileProcessorState.Failure, fileCode);
                failureCallback(error);
                return;
            }

            let res = response.getPayload().data;
            let cvResult = CVResult.create(res);
            successCallback(cvResult);
        });
    }

    /**
     * 获取指定文件的媒体播放源。
     * 
     * @param {FileLabel} fileLabel 
     * @param {function} handleSuccess 获取成功回调，参数：({@linkcode url}:{@linkcode string})。
     * @param {function} handleFailure 获取失败回调，参数：({@linkcode error}:{@link ModuleError})。
     */
    getMediaSource(fileLabel, handleSuccess, handleFailure) {
        let packet = new Packet(FileProcessorAction.GetMediaSource, {
            "domain": AuthService.DOMAIN,
            "fileCode": fileLabel.fileCode,
            "secure": (window.location.protocol.toLowerCase().indexOf("https") >= 0)
        });

        this.pipeline.send(FileProcessor.NAME, packet, (pipeline, source, response) => {
            if (response.getStateCode() != PipelineState.OK) {
                let error = new ModuleError(FileProcessor.NAME, response.getStateCode(), fileLabel);
                handleFailure(error);
                return;
            }

            let code = response.extractServiceStateCode();
            if (code != FileProcessorState.Ok) {
                let error = new ModuleError(FileProcessor.NAME, code, fileLabel);
                handleFailure(error);
                return;
            }

            let data = response.extractServiceData();
            handleSuccess(data.url);
        });
    }
}
