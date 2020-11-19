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

import { Contact } from "../contact/Contact";
import { OrderMap } from "../util/OrderMap";
import { Entity } from "../core/Entity";
import { CommFieldEndpoint } from "./CommFieldEndpoint";
import { MediaConstraint } from "./MediaConstraint";
import { LocalRTCEndpoint } from "./LocalRTCEndpoint";
import { MultipointCommAction } from "./MultipointCommAction";
import { AuthService } from "../auth/AuthService";
import { Pipeline } from "../core/Pipeline";

/**
 * 多方通信场域。
 */
export class CommField extends Entity {

    /**
     * @param {number} id 
     * @param {Contact} founder 
     * @param {Pipeline} pipeline
     */
    constructor(id, founder, pipeline) {
        super(7 * 24 * 60 * 60 * 1000);

        /**
         * 场域 ID 。
         * @type {number}
         */
        this.id = id;

        /**
         * 通信场创建人。
         * @type {Contact}
         */
        this.founder = founder;

        /**
         * 通信管道。
         * @type {Pipeline}
         */
        this.pipeline = pipeline;

        /**
         * 默认的媒体约束。
         * @type {MediaConstraint}
         */
        this.mediaConstraint = new MediaConstraint(true, true);

        /**
         * 终端列表。
         * @type {OrderMap}
         */
        this.fieldEndpoints = new OrderMap();
    }

    /**
     * @returns {Contact} 返回创建人。
     */
    getFounder() {
        return this.founder;
    }

    /**
     * 
     * @param {LocalRTCEndpoint} rtcEndpoint
     */
    launchCaller(rtcEndpoint, mediaConstraint, handleSuccess, handleError) {
        if ((!rtcEndpoint instanceof LocalRTCEndpoint)) {
            return false;
        }

        rtcEndpoint.openOffer(mediaConstraint, (sdp) => {
            this.sendSignaling(MultipointCommAction.Offer, rtcEndpoint.getContact(), sdp, handleSuccess, handleError);
        }, (error) => {
            handleError(error);
        });

        return true;
    }

    launchCallee() {

    }

    addEndpoint(endpoint) {
        let ep = endpoint;

        if (endpoint instanceof Contact) {
            let contact = endpoint;
            let dev = contact.getDevice();
            let name = [contact.getId(), '_', AuthService.DOMAIN, '_',
                        dev.getName(), '_', dev.getPlatform()];
            ep = new CommFieldEndpoint(name.join(''), contact);
        }

        if (this.fieldEndpoints.containsKey(ep.getName())) {
            return false;
        }

        this.fieldEndpoints.put(ep.getName(), ep);
        return true;
    }

    /**
     * 
     */
    removeEndpoint(endpoint) {

    }

    sendSignaling(signaling, contact, sdp, handleSuccess, handleError) {
        let target = 0;

        if (this.id == this.founder.getId()) {
            // 本地的私有场
            target = this.fieldEndpoints.values()[0].getContact().getId();
        }
        else {
            target = this.id;
        }

        let payload = {
            "signaling": signaling,
            "target": target,
            "sdp": sdp,
            "contact": contact.toCompactJSON()
        };

        handleSuccess(this);
    }


}
