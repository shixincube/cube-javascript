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

import { Group } from "./Group";
import { Contact } from "./Contact";
import { ContactService } from "./ContactService";

/**
 * 用于描述群组数据集合的类。
 */
export class GroupBundle {

    constructor() {
        /**
         * @type {Group}
         */
        this.group = null;

        /**
         * @type {Array<Contact>}
         */
        this.modified = [];

        /**
         * @type {Contact}
         */
        this.operator = null;

        /**
         * @type {boolean}
         */
        this.includeSelf = false;
    }

    /**
     * 由 JSON 格式数据创建 {@link GroupBundle} 实例。
     * @private
     * @param {ContactService} service 指定联系人服务。
     * @param {JSON} json 符合 {@link GroupBundle} 格式的 JSON 数据。
     * @returns {GroupBundle}
     */
    static create(service, json) {
        let bundle = new GroupBundle();

        // 读取群信息
        bundle.group = Group.create(service, json.group);

        // 读取删除的成员列表
        let modified = json.modified;

        for (let i = 0; i < modified.length; ++i) {
            let json = modified[i];
            let contact = Contact.create(json, bundle.group.getDomain());
            bundle.modified.push(contact);

            if (contact.getId() == service.self.getId()) {
                bundle.includeSelf = true;
            }
        }

        // 读取操作员
        if (undefined !== json.operator) {
            bundle.operator = Contact.create(json.operator, bundle.group.getDomain());
        }

        return bundle;
    }
}
