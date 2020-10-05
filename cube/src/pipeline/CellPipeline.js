/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Shixin Cube Team.
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
import { OrderMap } from "../util/OrderMap";
import { Pipeline } from "../core/Pipeline";
import { CellTalkListener } from "./CellTalkListener";
import { Packet } from "../core/Packet";

/**
 * 使用 Cell 进行通信的管道服务。
 */
export class CellPipeline extends Pipeline {

    /**
     * Cell 管道名称。
     * @type {string}
     */
    static NAME = 'Cell';

    /**
     * 构造函数。
     */
    constructor() {
        super('Cell');

        /**
         * 监听器。
         * @type {CellTalkListener}
         */
        this.talkListener = new CellTalkListener(this);

        /**
         * Cell 内核。
         * @type {cell.Nucleus}
         */
        this.nucleus = new cell.Nucleus();
        this.nucleus.talk.addListener(this.talkListener);

        /**
         * 保存异步返回消息的状态信息的映射。
         * @type {OrderMap}
         */
        this.responseMap = new OrderMap();

        /**
         * 应答超时控制定时器。
         */
        this.responseTimer = 0;
        /**
         * 应答超时时长。单位：毫秒。
         * @type {number}
         */
        this.responseTimeout = 5000;
        /**
         * 定时器周期。单位：毫秒。
         * @type {number}
         */
        this.timerPeriod = 1000;
    }

    /**
     * @inheritdoc
     */
    open() {
        if (this.opened) {
            return;
        }

        super.open();

        if (null == this.address || 0 == this.port) {
            cell.Logger.w('CellPipeline', 'Not configured address and port');
            return;
        }

        this.nucleus.talk.call(new cell.InetAddress(this.address, this.port));
    }

    /**
     * @inheritdoc
     */
    close() {
        super.close();

        if (null == this.address || 0 == this.port) {
            cell.Logger.w('CellPipeline', 'Not configured address and port');
            return;
        }

        this.nucleus.talk.hangup(new cell.InetAddress(this.address, this.port));
        //this.nucleus.talk.hangupAll();
    }

    /**
     * @inheritdoc
     */
    isReady() {
        return this.nucleus.talk.isCalled();
    }

    /**
     * @inheritdoc
     */
    send(destination, packet, handleResponse) {
        if (undefined !== handleResponse) {
            this.responseMap.put(packet.sn, {
                    destination: destination,
                    handle: handleResponse,
                    timestamp: Date.now()
                });

            if (this.responseTimer == 0) {
                // 启动超时控制
                let that = this;
                this.responseTimer = setInterval(() => {
                        if (0 == that.responseMap.size()) {
                            clearInterval(that.responseTimer);
                            that.responseTimer = 0;
                            return;
                        }

                        let now = Date.now();

                        let keys = that.responseMap.keys();
                        for (let i = 0; i < keys.length; ++i) {
                            let key = keys[i];
                            let value = that.responseMap.get(key);
                            if (now - value.timestamp >= that.responseTimeout) {
                                that.responseMap.remove(key);
                                super.touchCallback(value.destination, null, value.handle);
                            }
                        }
                    },
                    this.timerPeriod);
            }
        }

        let primitive = this.convertPacketToPrimitive(packet);
        this.nucleus.talkService.speak(destination, primitive);
    }

    /**
     * 触发消息接收处理。
     * @protected
     * @param {cell.Speaker} speaker 
     * @param {string} cellet 
     * @param {cell.Primitive} primitive 
     */
    triggerListened(speaker, cellet, primitive) {
        let packet = this.convertPrimitiveToPacket(primitive);

        let response = this.responseMap.remove(packet.sn);
        if (null != response) {
            super.touchCallback(cellet, packet, response.handle);
        }

        // 通知监听器
        super.triggerListeners(cellet, packet);
    }

    /**
     * 将 Packet 转为 ActionDialect 格式。
     * @param {Packet} packet 数据报文封装实体。
     * @returns {cell.ActionDialect} 返回 ActionDialect 实例。
     */
    convertPacketToPrimitive(packet) {
        let dialect = new cell.ActionDialect(packet.name);
        dialect.addParam('sn', packet.sn, cell.LiteralBase.LONG);
        dialect.addParam('data', packet.data, cell.LiteralBase.JSON);
        return dialect;
    }

    /**
     * 将 Primitive 转为 Packet 格式。
     * @param {cell.Primitive} primitive Cell 的 Primitive 实例。
     * @returns {Packet} 返回 Packet 实例。
     */
    convertPrimitiveToPacket(primitive) {
        let action = new cell.ActionDialect(primitive);
        let packet = new Packet(action.getName(), action.getParamAsJson('data')
            , action.getParamAsLong('sn'));
        return packet;
    }
}
