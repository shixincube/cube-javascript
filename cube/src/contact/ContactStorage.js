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
import InDB from "indb";
import { ContactService } from "./ContactService";
import { Group } from "./Group";
import { GroupAppendix } from "./GroupAppendix";

/**
 * 消息存储器。
 */
export class ContactStorage {

    constructor(service) {
        /**
         * 联系人服务。
         * @type {ContactService}
         */
        this.service = service;

        /**
         * 存储器操作的域。
         * @type {string}
         */
        this.domain = null;

        /**
         * 数据库实例。
         * @type {InDB}
         */
        this.db = null;

        /**
         * 群组库。
         * @type {object}
         */
        this.groupStore = null;

        /**
         * 联系人库。
         * @type {object}
         */
        this.contactStore = null;

        /**
         * 附录库。
         * @type {object}
         */
        this.appendixStore = null;
    }

    /**
     * 打开存储器连接数据库连接。
     * @param {string} domain 指定操作的域。
     */
    open(domain) {
        if (null != this.db) {
            return;
        }

        cell.Logger.d('ContactStorage', 'Open contact storage : ' + domain);

        this.domain = domain;

        // 数据库配置
        let options = {
            name: 'CubeContact-' + domain,
            version: 1,
            stores: [{
                name: 'group',
                keyPath: 'id',
                indexes: [{
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }, {
                    name: 'lastActive',
                    keyPath: 'lastActive',
                    unique: false
                }, {
                    name: 'creation',
                    keyPath: 'creation',
                    unique: false
                }, {
                    name: 'state',
                    keyPath: 'state',
                    unique: false
                }]
            }, {
                name: 'contact',
                keyPath: 'id',
                indexes: [{
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }]
            }, {
                name: 'appendix',
                keyPath: 'id',
                indexes: [{
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }]
            }, {
                name: 'config',
                keyPath: 'item',
                indexes: [{
                    name: 'item',
                    keyPath: 'item',
                    unique: true
                }]
            }]
        };

        this.db = new InDB(options);

        // 考虑是否不再调用此函数？
        //this.db.connect();

        this.groupStore = this.db.use('group');
        this.contactStore = this.db.use('contact');
        this.appendixStore = this.db.use('appendix');
    }

    /**
     * 关闭存储器。
     */
    close() {
        if (null == this.db) {
            return;
        }

        cell.Logger.d('MessagingStorage', 'Close contact storage : ' + this.domain);

        this.db.close();
        this.db = null;
    }

    /**
     * 读取指定联系人信息。
     * @param {number} id 指定联系人 ID 。
     * @param {function} handler 回调函数，参数：({@linkcode contact}:{@link Contact}) 。如果没有在数据库里找到数据 {@linkcode contact} 为 {@linkcode null} 值。
     */
    readContact(id, handler) {
        // TODO 超期控制
        handler(null);
    }

    /**
     * 将联系人数据写入数据库。
     * @param {Contact} contact 指定写入数据的联系人。
     */
    writeContact(contact) {
        // TODO
    }

    /**
     * 判断是否已经存储了指定 ID 的群组。
     * @param {number} id 群组 ID 。
     * @param {function} handler 回调函数，参数：({@linkcode id}:{@linkcode number}, {@linkcode contains}:{@linkcode boolean}) - (群组的ID, 是否存储了该群组)。
     * @returns {boolean} 返回是否执行了查询操作。
     */
    containsGroup(id, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.groupStore.query('id', id);
            if (result.length > 0) {
                handler(id, true);
            }
            else {
                handler(id, false);
            }
        })();
        return true;
    }

    /**
     * 读取指定最近活跃时间的群组。
     * @param {number} beginning 指定查询起始时间。
     * @param {number} ending 指定查询结束时间。
     * @param {function} handler 查询结果回调函数，参数：({@linkcode beginning}:{@linkcode number}, {@linkcode ending}:{@linkcode number}, {@linkcode groups}:Array<{@link Group}>) 。
     * @param {Array} [matchingStates] 指定需要匹配的群组状态。
     * @returns {boolean} 返回是否执行了查询操作。
     */
    readGroups(beginning, ending, handler, matchingStates) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            // let result = await this.groupStore.all();
            let result = null;

            if (undefined === matchingStates) {
                result = await this.groupStore.select([
                    { key: 'lastActive', value: beginning, compare: '>' },
                    { key: 'lastActive', value: ending, compare: '<=', optional: true }
                ]);
            }
            else {
                let conditions = [
                    { key: 'lastActive', value: beginning, compare: '>' },
                    { key: 'lastActive', value: ending, compare: '<=', optional: true }
                ];
                for (let i = 0; i < matchingStates.length; ++i) {
                    conditions.push({
                        key: 'state', value: matchingStates[i], options: true
                    });
                }
                result = await this.groupStore.select(conditions);
            }

            if (null == result || undefined === result) {
                handler(beginning, ending, []);
                return;
            }

            let selfId = this.service.getSelf().getId();
            let groups = [];
            let count = 0;
            for (let i = 0; i < result.length; ++i) {
                let json = result[i];
                if (json.lastActive > beginning && json.lastActive <= ending) {

                    if (undefined !== matchingStates) {
                        // 判断是否匹配状态
                        if (matchingStates.indexOf(json.state) < 0) {
                            continue;
                        }
                    }

                    let included = false;
                    if (json.owner.id != selfId) {
                        // 不是群组所有者
                        for (let n = 0; n < json.members.length; ++n) {
                            if (json.members[n].id == selfId) {
                                included = true;
                                break;
                            }
                        }
                    }
                    else {
                        included = true;
                    }

                    if (!included) {
                        continue;
                    }

                    json.domain = this.domain;
                    let group = Group.create(this.service, json);
                    ++count;

                    // 读取附录
                    (async (curGroup)=> {
                        // 读取附录
                        let appendixData = await this.appendixStore.query('id', curGroup.id);

                        if (appendixData.length > 0) {
                            let appendix = GroupAppendix.create(this.service, curGroup, appendixData[0]);
                            curGroup.appendix = appendix;
                        }

                        groups.push(curGroup);

                        if (count == groups.length) {
                            handler(beginning, ending, groups);
                        }
                    })(group);
                }
            }

            if (count == groups.length) {
                handler(beginning, ending, groups);
            }
        })();

        return true;
    }

    /**
     * 读取指定 ID 的群组。
     * @param {number} id 指定群组 ID 。
     * @param {function} handler 查询结果回调函数，参数：({@linkcode id}:{@linkcode number}, {@linkcode group}:{@link Group}) - (群组的ID, 查询到的群组) 。如果查询不到指定群组，参数 {@linkcode group} 为 {@linkcode null} 值。
     * @returns {boolean} 返回是否执行了查询操作。
     */
    readGroup(id, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.groupStore.query('id', id);
            if (null != result && result.length > 0) {
                let json = result[0];
                let group = Group.create(this.service, json);

                (async ()=> {
                    // 读取附录
                    let appendixData = await this.appendixStore.query('id', id);

                    if (appendixData.length > 0) {
                        let appendix = GroupAppendix.create(this.service, group, appendixData[0]);
                        group.appendix = appendix;
                    }

                    handler(id, group);
                })();
            }
            else {
                handler(id, null);
            }
        })();

        return true;
    }

    /**
     * 写入群组数据到存储。
     * @param {Group} group 指定群组。
     * @returns {boolean} 返回是否执行了写入操作。
     */
    writeGroup(group) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let data = group.toJSON();
            delete data["domain"];
            await this.groupStore.put(data);
        })();

        (async () => {
            // TODO
            let data = group.getAppendix().toJSON();
            await this.appendixStore.put(data);
        })();

        return true;
    }
}
