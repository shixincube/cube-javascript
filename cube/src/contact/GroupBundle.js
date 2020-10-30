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

import { Group } from "./Group";
import { Contact } from "./Contact";

/**
 * 用于描述群组数据集合的类。
 */
export class GroupBundle {

    constructor() {
        this.group = null;
        this.modified = [];
        this.operator = null;
        this.includeSelf = false;
    }

    /**
     * 
     * @param {*} service 
     * @param {*} json 
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
            let contact = Contact.create(json, group.getDomain());
            bundle.modified.push(contact);

            if (contact.getId() == service.self.getId()) {
                bundle.includeSelf = true;
            }
        }

        // 读取操作员
        bundle.operator = Contact.create(json.operator, group.getDomain());
        return bundle;
    }
}