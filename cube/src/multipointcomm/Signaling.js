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
import { Device } from "../contact/Device";
import { JSONable } from "../util/JSONable";
import { CommField } from "./CommField";
import { MediaConstraint } from "./MediaConstraint";

/**
 * 信令。
 */
export class Signaling extends JSONable {

    /**
     * @param {string} name 
     * @param {CommField} field 
     * @param {Contact} contact 
     * @param {Device} device
     */
    constructor(name, field, contact, device) {
        super();

        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {CommField}
         */
        this.field = field;

        /**
         * @type {Contact}
         */
        this.contact = contact;

        /**
         * @type {Device}
         */
        this.device = device;

        /**
         * @type {object}
         */
        this.sessionDescription = null;

        /**
         * @type {object}
         */
        this.candidate = null;

        /**
         * @type {Array<object>}
         */
        this.candidates = null;

        /**
         * @type {object}
         */
        this.mediaConstraint = null;

        /**
         * @type {Contact}
         */
        this.caller = null;

        /**
         * @type {Contact}
         */
        this.callee = null;
    }

    toJSON() {
        let json = super.toJSON();
        json["name"] = this.name;
        json["field"] = this.field.toCompactJSON();
        json["contact"] = this.contact.toCompactJSON();
        json["device"] = this.device.toCompactJSON();

        if (null != this.sessionDescription) {
            json["description"] = this.sessionDescription;
        }

        if (null != this.candidate) {
            json["candidate"] = this.candidate;
        }

        if (null != this.mediaConstraint) {
            json["constraint"] = this.mediaConstraint.toJSON();
        }

        return json;
    }

    toCompactJSON() {
        return this.toJSON();
    }

    static create(json, pipeline) {
        let signaling = new Signaling(json.name,
            CommField.create(json.field, pipeline),
            Contact.create(json.contact),
            Device.create(json.device));

        if (json.description) {
            signaling.sessionDescription = json.description;
        }

        if (json.candidate) {
            signaling.candidate = json.candidate;
        }

        if (json.candidates) {
            signaling.candidates = json.candidates;
        }

        if (json.constraint) {
            signaling.mediaConstraint = MediaConstraint.create(json.constraint);
        }

        if (json.caller) {
            signaling.caller = Contact.create(json.caller);
        }

        if (json.callee) {
            signaling.callee = Contact.create(json.callee);
        }

        return signaling;
    }
}
