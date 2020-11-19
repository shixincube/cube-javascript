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
import { JSONable } from "../util/JSONable";
import { CommField } from "./CommField";

/**
 * 信令。
 */
export class Signaling extends JSONable {

    constructor(name, field, contact, sdp) {
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
         * @type {string}
         */
        this.sdp = (undefined !== sdp) ? sdp : null;

        /**
         * @type {number}
         */
        this.target = 0;
    }

    toJSON() {
        let json = super.toJSON();
        json["name"] = name;
        json["target"] = target;
        json["sdp"] = sdp;
        json["contact"] = contact.toCompactJSON();
        return json;
    }

    static create(json) {
        let signaling = new Signaling(json.name, Contact.create(json.contact), json.sdp);
        signaling.target = json.target;
        return signaling;
    }
}
