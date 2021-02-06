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
import { Entity } from "../core/Entity";
import { ContactAppendix } from "./ContactAppendix";
import { Device } from "./Device";

/**
 * 联系人。
 */
export class Contact extends Entity {

    /**
     * 联系人实体的有效期。
     */
    static Lifespan = 10 * 60 * 1000;

    /**
     * 构造函数。
     * @param {number|string} id 指定联系人 ID 。
     * @param {string} [name] 指定联系人名称。
     * @param {string} [domain] 指定联系人所在的域。
     */
    constructor(id, name, domain) {
        super(Contact.Lifespan);

        /**
         * 联系人 ID 。
         * @private
         * @type {number}
         */
        this.id = (typeof id === 'string') ? parseInt(id) : id;

        /**
         * 联系人名称。
         * @private
         * @type {string}
         */
        this.name = (undefined === name) ? 'Cube-' + id : name;

        /**
         * 联系人所在域。
         * @private
         * @type {string}
         */
        this.domain = (undefined === domain) ? AuthService.DOMAIN : domain;

        /**
         * 当前有效的设备列表。
         * @private
         * @type {Array<Device>}
         */
        this.devices = [];

        /**
         * 联系人附录。
         * @private
         * @type {ContactAppendix}
         */
        this.appendix = null;
    }

    /**
     * 获取联系人 ID 。
     * @returns {number} 返回联系人 ID 。
     */
    getId() {
        return this.id;
    }

    /**
     * 获取联系人所在域。
     * @returns {string} 返回联系人所在域。
     */
    getDomain() {
        return this.domain;
    }

    /**
     * 设置联系人名称。
     * @param {string} name 指定联系人名称。
     */
    setName(name) {
        this.name = name;
    }

    /**
     * 获取联系人名称。
     * @returns {string} 返回联系人名称。
     */
    getName() {
        return this.name;
    }

    /**
     * 添加联系人使用的设备。
     * @param {Device} device 设备描述。
     */
    addDevice(device) {
        let index = this.devices.indexOf(device);
        if (index >= 0) {
            return;
        }

        this.devices.push(device);
    }

    /**
     * 移除联系人使用的设备。
     * @param {Device} device 设备描述。
     */
    removeDevice(device) {
        let index = this.devices.indexOf(device);
        if (index >= 0) {
            this.devices.splice(index, 1);
        }
    }

    /**
     * 获取联系人当前有效的设备列表。
     * @returns {Array<Device>} 返回联系人当前有效的设备列表。
     */
    getDevices() {
        return this.devices;
    }

    /**
     * 返回最近一次使用的设备。
     * @return {Device} 返回最近一次使用的设备。
     */
    getDevice() {
        if (this.devices.length == 0) {
            return new Device('Unknown', 'null');
        }

        return this.devices[this.devices.length - 1];
    }

    /**
     * 获取联系人附录。
     * @returns {ContactAppendix} 返回联系人附录。
     */
    getAppendix() {
        return this.appendix;
    }

    /**
     * 判断指定联系人实例是否于当前实例数据相同。
     * @param {Contact} other 指定待比较的联系人。
     * @returns {boolean} 如果联系人 ID 和域相同返回 {@linkcode true} ，否则返回 {@linkcode false} 。
     */
    equals(other) {
        if (other instanceof Contact) {
            return other.id == this.id && other.domain == this.domain;
        }
        else if (undefined !== other.id && undefined !== other.domain) {
            return other.id == this.id && other.domain == this.domain;
        }

        return false;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json["id"] = this.id;
        json["name"] = this.name;
        json["domain"] = this.domain;

        let devArray = [];
        for (let i = 0; i < this.devices.length; ++i) {
            devArray.push(this.devices[i].toJSON());
        }
        json["devices"] = devArray;

        if (null != this.context) {
            json["context"] = (this.context instanceof JSONable) ? this.context.toJSON() : this.context;
        }

        return json;
    }

    /**
     * 将对象序列化为数据内容紧凑的 JSON 格式。
     * @returns {JSON} 返回紧凑结构的 JSON 数据，数据里只包含基础的联系人数据。
     */
    toCompactJSON() {
        let json = super.toCompactJSON();
        json["id"] = this.id;
        json["name"] = this.name;
        if (null != this.context) {
            json["context"] = (this.context instanceof JSONable) ? this.context.toJSON() : this.context;
        }
        return json;
    }

    /**
     * 通过 JSON 数据格式创建 {@link Contact} 实例。
     * @private
     * @param {JSON} json 指定 {@link Contact} 格式的 JSON 对象。
     * @param {string} [domainName] 指定域名称。
     * @returns {Contact} 返回 {@link Contact} 实例。
     */
    static create(json, domainName) {
        let id = json.id;
        let name = json.name;
        let domain = (undefined !== domainName) ? domainName : json.domain;
        let devices = (json.devices) ? json.devices : [];

        let contact = new Contact(id, name, domain);

        for (let i = 0; i < devices.length; ++i) {
            let devJson = devices[i];
            let dev = new Device(devJson.name, devJson.platform);
            contact.devices.push(dev);
        }

        if (undefined !== json.context) {
            contact.context = json.context;
        }

        return contact;
    }
}
