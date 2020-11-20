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
import { MultipointComm } from "./MultipointComm";
import { Packet } from "../core/Packet";
import { StateCode } from "../core/StateCode";
import { MultipointCommState } from "./MultipointCommState";
import { Signaling } from "./Signaling";
import { ModuleError } from "../core/error/ModuleError";

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
         * @type {OrderMap<number,CommFieldEndpoint>}
         */
        this.fieldEndpoints = new OrderMap();
    }

    /**
     * @returns {Contact} 返回创建人。
     */
    getFounder() {
        return this.founder;
    }

    isPrivate() {
        return (this.id == this.founder.getId());
    }

    /**
     * 启动为主叫。
     * @param {LocalRTCEndpoint} rtcEndpoint
     * @param {MediaConstraint} mediaConstraint
     * @param {function} successCallback
     * @param {function} failureCallback
     */
    launchCaller(rtcEndpoint, mediaConstraint, successCallback, failureCallback) {
        if (!(rtcEndpoint instanceof LocalRTCEndpoint)) {
            return false;
        }

        rtcEndpoint.openOffer(mediaConstraint, (description) => {
            let signaling = new Signaling(MultipointCommAction.Offer, this, rtcEndpoint.getContact());
            signaling.sessionDescription = description;
            this.sendSignaling(signaling, successCallback, failureCallback);
        }, (error) => {
            failureCallback(error);
        });

        return true;
    }

    /**
     * 启动为被叫。
     * @param {LocalRTCEndpoint} rtcEndpoint 
     * @param {string} offerDescription
     * @param {MediaConstraint} mediaConstraint 
     * @param {function} successCallback 
     * @param {function} failureCallback 
     */
    launchCallee(rtcEndpoint, offerDescription, mediaConstraint, successCallback, failureCallback) {
        if (!(rtcEndpoint instanceof LocalRTCEndpoint)) {
            return false;
        }

        rtcEndpoint.openAnswer(offerDescription, mediaConstraint, (description) => {

        }, (error) => {

        });

        return true;
    }

    getEndpoint() {
        if (this.fieldEndpoints.size() == 0) {
            return null;
        }

        return this.fieldEndpoints.values()[0];
    }

    addEndpoint(endpoint) {
        let cfe = endpoint;

        if (endpoint instanceof Contact) {
            let contact = endpoint;
            cfe = new CommFieldEndpoint(contact.getId(), contact);
        }

        if (this.fieldEndpoints.containsKey(cfe.getId())) {
            return false;
        }

        this.fieldEndpoints.put(cfe.getId(), cfe);
        return true;
    }

    /**
     * 
     */
    removeEndpoint(endpoint) {

    }

    /**
     * 
     * @param {Signaling} signaling 
     * @param {function} successCallback
     * @param {function} failureCallback
     * @private
     */
    sendSignaling(signaling, successCallback, failureCallback) {
        let target = 0;
        if (this.id == this.founder.getId()) {
            // 本地的私有场
            target = this.fieldEndpoints.values()[0].getContact().getId();
        }
        else {
            target = this.id;
        }

        // 设置目标
        signaling.target = target;

        this.pipeline.send(MultipointComm.NAME, new Packet(signaling.name, signaling.toJSON()), (pipeline, source, packet) => {
            if (null != packet && packet.getStateCode() == StateCode.OK) {
                if (packet.data.code == 0) {
                    let data = packet.data.data;
                    let response = Signaling.create(data);
                    successCallback(response);
                }
                else {
                    failureCallback(new ModuleError(MultipointComm.NAME, packet.data.code, this));
                }
            }
            else {
                failureCallback(new ModuleError(MultipointComm.NAME, MultipointCommState.ServerFault, this));
            }
        });
    }

    toJSON() {
        let json = super.toJSON();
        json.id = this.id;
        json.domain = AuthService.DOMAIN;
        json.founder = this.founder.toCompactJSON();
        json.endpoints = [];
        let list = this.fieldEndpoints.values();
        for (let i = 0; i < list.length; ++i) {
            json.endpoints.push(list[i].toJSON());
        }
        return json;
    }

    toCompactJSON() {
        let json = super.toCompactJSON();
        json.id = this.id;
        json.domain = AuthService.DOMAIN;
        json.founder = this.founder.toCompactJSON();
        return json;
    }

    static create(json, pipeline) {
        let field = new CommField(json.id, Contact.create(json.founder, json.domain), pipeline);
        if (undefined !== json.endpoints) {
            let list = json.endpoints;
            for (let i = 0; i < list.length; ++i) {
                let cfep = CommFieldEndpoint.create(list[i]);
                field.fieldEndpoints.put(cfep.getId(), cfep);
            }
        }
        return field;
    }
}
