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

import cell from "@lib/cell-lib";
import { MediaDeviceTool } from "../util/MediaDeviceTool";
import { Announcer } from "../util/Announcer";
import { Module } from "../core/Module";
import { ModuleError } from "../core/error/ModuleError";
import { ObservableEvent } from "../core/ObservableEvent";
import { FaceMonitorState } from "./FaceMonitorState";
import { FaceMonitorEvent } from "./FaceMonitorEvent";
import { TouchedRecord } from "./TouchedRecord";

/**
 * 人脸监视模块。
 */
export class FaceMonitor extends Module {

    static NAME = 'FaceMonitor';

    constructor() {
        super(FaceMonitor.NAME);

        this.containerEl = null;
        this.videoEl = null;

        this.width = 640;
        this.height = 480;

        this.canvasEl = null;
        this.drawCtx = null;

        this.stream = null;

        // 对视频进行镜像
        this.flipHorizontal = true;

        this.ready = false;
        this.isPlaying = false;
        this.gotMetadata = false;

        this.stopPrediction = true;

        // 是否显示 Mask
        this.maskDisplayed = true;

        this.updateFaceTimer = 0;
        this.loadTimestamp = 0;
    }

    /**
     * @inheritdoc
     */
    start() {
        if (!super.start()) {
            return false;
        }

        if (null == this.containerEl) {
            return false;
        }

        let announcer = new Announcer(2, 10000);
        announcer.addAudience((count, dataMap) => {
            if (count != 2) {
                let error = new ModuleError(FaceMonitor.NAME, FaceMonitorState.LoadLibFailed, this);
                this.notifyObservers(new ObservableEvent(FaceMonitorEvent.Error, error));
                return;
            }

            /*if (null == this.videoEl) {
                this.videoEl = document.createElement('video');
                this.videoEl.setAttribute('autoplay', 'autoplay');
                this.videoEl.setAttribute('playsinline', 'playsinline');
                // this.videoEl.style.position = 'absolute';
                // this.videoEl.style.zIndex = -1;

                this.videoEl.style.width = '100%';
                this.videoEl.style.height = '100%';
                this.containerEl.appendChild(this.videoEl);
            }*/

            // Mirror the local sourceVideo
            if (this.flipHorizontal) {
                this.videoEl.style.transform = 'scale(-1, 1)';
                this.videoEl.style.webkitTransform = 'scale(-1, 1)';
            }

            if (null == this.canvasEl) {
                this.canvasEl = document.createElement('canvas');
                this.canvasEl.setAttribute('class', 'cube-facemonitor-canvas');
                this.canvasEl.style.position = 'absolute';
                this.canvasEl.style.float = 'left';
                this.canvasEl.style.zIndex = 1;
                this.canvasEl.style.display = 'none';
                this.canvasEl.style.width = 'auto';
                this.canvasEl.style.height = 'auto';
                this.canvasEl.style.background = 'unset';
                this.canvasEl.style.maxWidth = 'unset';
                this.containerEl.appendChild(this.canvasEl);
            }

            this.ready = true;

            this.notifyObservers(new ObservableEvent(FaceMonitorEvent.Ready, this));

            if (this.gotMetadata && this.isPlaying) {
                this.launch();
            }
        });

        // 请求依赖的库文件
        super.requireFile('https://static.shixincube.com/cube/javascript/libs/tfjs.js', (url) => {
            announcer.announce('tfjs');
        }, (url) => {
            cell.Logger.w('FaceMonitor', 'Load "tfjs" failed');
        });

        // 请求依赖的库文件
        super.requireFile('https://static.shixincube.com/cube/javascript/libs/body-pix.js', (url) => {
            announcer.announce('body-pix');
        }, (url) => {
            cell.Logger.w('FaceMonitor', 'Load "body-pix" failed');
        });

        return true;
    }

    /**
     * @inheritdoc
     */
    stop() {
        super.stop();

        this.videoEl.pause();

        this.stopPrediction = true;

        if (this.updateFaceTimer > 0) {
            clearInterval(this.updateFaceTimer);
            this.updateFaceTimer = 0;
        }

        // if (this.stream) {
        //     this.stream.getTracks()[0].stop();
        // }
    }

    /**
     * 设置界面元素。
     * @param {HTMLElement} container 
     * @param {HTMLElement} video 
     */
    setup(container, video) {
        this.containerEl = container;
        this.videoEl = video;

        this.videoEl.addEventListener('loadedmetadata', () => {
            cell.Logger.d('FaceMonitor', 'video metadata ready');

            this.width = parseInt(this.videoEl.videoWidth);
            this.height = parseInt(this.videoEl.videoHeight);

            this.gotMetadata = true;
            if (this.ready && this.isPlaying) {
                this.launch();
            }
        });

        this.videoEl.addEventListener('playing', () => {
            cell.Logger.d('FaceMonitor', 'video playing');

            this.isPlaying = true;
            if (this.ready && this.gotMetadata) {
                this.launch();
            }
        });
    }

    /**
     * @private
     * @param {*} videoWidth 
     * @param {*} videoHeight 
     */
    activeCameraSource(videoWidth, videoHeight) {
        if (null == this.canvasEl) {
            return false;
        }

        this.flipHorizontal = true;

        let video = (undefined === videoHeight) ? { width: parseInt(videoWidth) } :
                    { width: parseInt(videoWidth), height: parseInt(videoHeight) };

        MediaDeviceTool.getUserMedia({
                video: video
            }, (stream) => {
                this.stream = stream;
                this.videoEl.srcObject = stream;
            }, (error) => {

            });

        return true;
    }

    /**
     * @private
     */
    deactiveCameraSource() {
        this.videoEl.pause();

        if (null != this.stream) {
            this.stream.getTracks()[0].stop();
        }
    }

    /**
     * 显示遮罩。
     */
    showMask() {
        this.maskDisplayed = true;
    }

    /**
     * 隐藏遮罩。
     */
    hideMask() {
        this.maskDisplayed = false;
    }

    /**
     * 是否显示遮罩。
     */
    isMaskDisplayed() {
        return this.maskDisplayed;
    }

    /**
     * 
     */
    pausePrediction() {
        //this.stopPrediction = true;
    }

    /**
     * @private
     * @param {number} multiplier 
     * @param {number} stride 
     */
    launch(multiplier = 0.75, stride = 16) {
        this.canvasEl.style.display = 'inline-block';
        this.drawCtx = this.canvasEl.getContext('2d');

        this.videoEl.width = this.videoEl.videoWidth;
        this.videoEl.height = this.videoEl.videoHeight;

        // 画布覆盖于视频内容之上，用于绘制显示内容
        this.canvasEl.width = this.videoEl.videoWidth;
        this.canvasEl.height = this.videoEl.videoHeight;
        this.canvasEl.style.left = this.videoEl.offsetLeft + 'px';

        cell.Logger.i('FaceMonitor', `Loading BodyPix with multiplier ${multiplier} and stride ${stride}`);

        let that = this;
        let modelUrl = 'https://static.shixincube.com/cube/javascript/models/model-stride16.json';

        this.loadTimestamp = Date.now();

        bodyPix.load({
            multiplier: multiplier,
            stride: stride,
            quantBytes: 4,
            modelUrl: modelUrl
        }).then(net => _fm_predictLoop(that, net))
        .catch(err => console.error(err));

        // 通知状态
        let event = new ObservableEvent(FaceMonitorEvent.Load, {
            width: that.width,
            height: that.height,
            multiplier: multiplier,
            stride: stride,
            quantBytes: 4
        });
        this.notifyObservers(event);
    }

    /**
     * @private
     * @param {object} personSegmentation 
     */
    draw(personSegmentation) {
        // 使用 bodyPix 的绘制 API

        const sourceVideo = this.videoEl;
        const drawCanvas = this.canvasEl;
        const drawCtx = this.drawCtx;

        if (this.maskDisplayed) {
            let targetSegmentation = personSegmentation;

            // 绘制面部的遮罩，可用于调试

            // 仅显示脸和手的部分
            targetSegmentation.data = personSegmentation.data.map(val => {
                if (val !== 0 && val !== 1 && val !== 10 && val !== 11)
                    return -1;
                else
                    return val;
            });

            const partColors = [
                [76, 187, 185],  [119, 216, 216], [255, 169, 49], [7, 121, 228],
                [232, 94, 73],   [242, 117, 75],  [248, 142, 83],  [251, 167, 96],
                [253, 190, 112], [254, 210, 129], [254, 227, 149], [254, 240, 166],
                [251, 248, 176], [243, 249, 172], [231, 245, 163], [213, 238, 159],
                [190, 229, 160], [164, 218, 163], [137, 207, 165], [110, 192, 168],
                [86, 173, 174],  [70, 150, 179],  [67, 127, 180],  [77, 103, 173]
            ];

            const coloredPartImage = bodyPix.toColoredPartMask(targetSegmentation, partColors);
            const opacity = 0.6;
            const maskBlurAmount = 0;
            bodyPix.drawMask(
                drawCanvas, sourceVideo, coloredPartImage, opacity, maskBlurAmount,
                this.flipHorizontal);
        }

        // 清空绘制的遮罩
        if (false == this.maskDisplayed) {
            // bodyPix.drawMask redraws the canvas.
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        }

        // 从姿态检测数据中显示姿态标记的点
        if (this.maskDisplayed) {
            personSegmentation.allPoses.forEach(pose => {
                if (this.flipHorizontal) {
                    pose = bodyPix.flipPoseHorizontal(pose, personSegmentation.width);
                }
                this.drawKeypoints(pose.keypoints, 0.9, drawCtx);
            });
        }
    }

    /**
     * @protected
     * @param {*} keypoints 
     * @param {*} minConfidence 
     * @param {*} ctx 
     * @param {string} color 
     */
    drawKeypoints(keypoints, minConfidence, ctx, color = 'aqua') {
        for (let i = 0; i < keypoints.length; ++i) {
            const keypoint = keypoints[i];

            if (keypoint.score < minConfidence) {
                continue;
            }

            const {y, x} = keypoint.position;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    /**
     * @protected
     * @param {TouchedRecord} record 
     */
    triggerTouchedEvent(record) {
        let event = new ObservableEvent(FaceMonitorEvent.Touched, record);
        this.notifyObservers(event);
    }

    /**
     * 检查此像素的上方，下方，左侧或右侧是否有脸部像素。
     * 
     * @private
     * @param {object} matrix1 
     * @param {object} matrix2 
     * @param {number} padding 
     */
    _touchingCheck(matrix1, matrix2, padding) {
        let count = 0;
        for (let y = padding; y < matrix1.length - padding; y++) {
            for (let x = padding; x < matrix1[0].length - padding; x++) {
                if (matrix1[y][x] > -1) {
                    for (let p = 0; p < padding; p++) {
                        // 手是左还是右，在脸部数据的上方还是下方
                        if (matrix2[y][x - p] > -1 || matrix2[y][x + p] > -1 ||
                            matrix2[y - p][x] > -1 || matrix2[y + p][x] > -1) {
                            count++;
                        }
                    }
                }
            }
        }
        return count
    }

    /**
     * 辅助函数，将数组转为矩阵（二维数组），便于进行像素的检索
     * 
     * @private
     * @param {Array} arr 
     * @param {number} rowLength 
     */
    _arrayToMatrix(arr, rowLength) {
        // Check
        if (arr.length % rowLength > 0 || rowLength < 1) {
            console.log("array not divisible by rowLength ", arr, rowLength);
            return null;
        }

        let newArray = [];

        let rows = arr.length / rowLength;
        for (let x = 0; x < rows; x++) {
            let b = arr.slice(x * rowLength, x * rowLength + rowLength);
            newArray.push(b);
        }
        return newArray;
    }
}


/**
 * 预测循环。
 * 
 * @private
 * @param {FaceMonitor} fm 
 * @param {*} net 
 */
async function _fm_predictLoop(fm, net) {
    let sourceVideo = fm.videoEl;

    let resetDelay = 2;
    fm.stopPrediction = false;

    let lastFaceArray = new Int32Array(sourceVideo.width * sourceVideo.height);
    let touched = false;
    let resetTouchedTimer = 0;

    // 定时器用于切换更新脸部遮罩的状态
    let updateFace = true;
    fm.updateFaceTimer = setInterval(() => {
        updateFace = !updateFace;
    }, 1000);

    // 通知状态
    let elapsed = Date.now() - fm.loadTimestamp;
    let event = new ObservableEvent(FaceMonitorEvent.Loaded, {
        resetDelay: resetDelay,
        elapsed: elapsed
    });
    fm.notifyObservers(event);

    while (fm.isPlaying && !fm.stopPrediction) {

        // BodyPix setup
        const segmentPersonConfig = {
            flipHorizontal: fm.flipHorizontal,    // 如果是摄像头则翻转画面
            maxDetections: 1,                       // 只检测一个人的人脸
            scoreThreshold: 0.5,
            segmentationThreshold: 0.6,             // default is 0.7
        };

        const segmentation = await net.segmentPersonParts(sourceVideo, segmentPersonConfig);

        const faceThreshold = 0.9;
        const touchThreshold = 0.01;

        const numPixels = segmentation.width * segmentation.height;

        // 未检测到数据，跳过
        if (segmentation.allPoses[0] === undefined) {
            // console.info("No segmentation data");
            continue;
        }

        // 将数据绘制到画布上
        fm.draw(segmentation);

        // 验证有一个质量较好的脸部画面重贴动作
        // 假设是一个一致性数组顺序
        let nose = segmentation.allPoses[0].keypoints[0].score > faceThreshold;
        let leftEye = segmentation.allPoses[0].keypoints[1].score > faceThreshold;
        let rightEye = segmentation.allPoses[0].keypoints[2].score > faceThreshold;

        // 检查鼻子和眼镜是否有手覆盖
        if (nose && (leftEye || rightEye)) {
            // 在手和之前的脸部数据之间寻找重叠部分

            // 创建仅包含脸部数据的数组
            let faceArray = segmentation.data.map(val => {
                if (val === 0 || val === 1) {
                    return val;
                } else {
                    return -1;
                }
            });

            // 创建手部数据数组
            let handArray = segmentation.data.map(val => {
                if (val === 10 || val === 11) {
                    return val;
                } else {
                    return -1;
                }
            });

            let facePixels = 0;
            let score = 0;

            for (let x = 0; x < lastFaceArray.length; x++) {
                // 计算脸部像素的数量
                if (lastFaceArray[x] > -1) {
                    facePixels++;
                }

                // 判断手部是否重叠在上一次的脸部数据之上
                if (lastFaceArray[x] > -1 && handArray[x] > -1) {
                    score++;
                }
            }

            let multiFaceArray = fm._arrayToMatrix(faceArray, segmentation.width);
            let multiHandArray = fm._arrayToMatrix(handArray, segmentation.width);
            let touchScore = fm._touchingCheck(multiFaceArray, multiHandArray, 10);
            score += touchScore;

            // 刷新脸部数据
            if (updateFace) {
                lastFaceArray = faceArray;
            }

            // fm._updateStats(touched);

            // 判断是否可以触发 touch
            if (score > facePixels * touchThreshold) {
                if (!touched) {
                    // console.info(` numPixels: ${numPixels} \n facePixels: ${facePixels}\n score: ${score}, touchScore: ${touchScore}\n` +
                    //     ` facePixels%: ${facePixels / numPixels}\n touch%: ${score / facePixels}`);

                    // 更新状态
                    touched = true;

                    fm.triggerTouchedEvent(new TouchedRecord(
                        touched, numPixels, facePixels, score, touchScore));

                    if (resetTouchedTimer > 0) {
                        clearTimeout(resetTouchedTimer);
                    }

                    resetTouchedTimer = setTimeout(() => {
                        touched = false;
                        fm.triggerTouchedEvent(new TouchedRecord(
                            touched, numPixels, facePixels, score, touchScore));
                    }, resetDelay * 1000);
                }
                else {
                    if (resetTouchedTimer > 0) {
                        clearTimeout(resetTouchedTimer);
                    }
                    resetTouchedTimer = setTimeout(() => {
                        touched = false;
                        fm.triggerTouchedEvent(new TouchedRecord(
                            touched, numPixels, facePixels, score, touchScore));
                    }, resetDelay * 1000);
                }
            }
        }
    }

    if (resetTouchedTimer > 0) {
        clearTimeout(resetTouchedTimer);
    }
}
