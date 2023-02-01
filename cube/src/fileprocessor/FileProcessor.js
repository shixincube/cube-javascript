/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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
import { AuthService } from "../auth/AuthService";
import { ModuleError } from "../core/error/ModuleError";
import { Module } from "../core/Module";
import { Packet } from "../core/Packet";
import { PipelineState } from "../core/PipelineState";
import { FileLabel } from "../filestorage/FileLabel";
import { FileProcessorAction } from "./FileProcessorAction";
import { FileProcessorState } from "./FileProcessorState";
import { FileProcessorPipelineListener } from "./FileProcessorPipelineListener";
import { WorkflowOperatingEvent } from "./WorkflowOperatingEvent";
import { CVResult } from "./CVResult";

/**
 * 文件处理器。
 * @extends Module
 */
export class FileProcessor extends Module {

    static NAME = 'FileProcessor';

    constructor() {
        super('FileProcessor');

        this.pipelineListener = null;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        this.pipelineListener = new FileProcessorPipelineListener(this);
        // 添加数据通道的监听器
        this.pipeline.addListener(FileProcessor.NAME, this.pipelineListener);

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        this.pipeline.removeListener(FileProcessor.NAME, this.pipelineListener);
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
            let url = data.url + "?t=" + this.kernel.getAuthToken().code;
            handleSuccess(url);
        });
    }

    /**
     * @private
     * @param {WorkflowOperatingEvent} event 
     */
    _processEvent(event) {
        cell.Logger.d('FileProcessor', 'event - ' + event.name);

        let workflow = event.getWorkflow();
        
    }
}
