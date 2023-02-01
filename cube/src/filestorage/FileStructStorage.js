/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Shixin Cube Team.
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
import { FileLabel } from "./FileLabel";

/**
 * 文件的结构数据存储器。
 */
export class FileStructStorage {

    constructor() {
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
         * 文件标签库。
         * @type {object}
         */
        this.labelStore = null;
    }

    /**
     * 打开存储器连接数据库连接。
     * @param {string} domain 指定操作的域。
     */
    open(domain) {
        if (null != this.db) {
            return;
        }

        cell.Logger.d('FileStructStorage', 'Open file struct storage : ' + domain);

        this.domain = domain;

        // 数据库配置
        let options = {
            name: 'CubeFileStorage-' + domain,
            version: 1,
            stores: [{
                name: 'label',
                keyPath: 'fileCode',
                indexes: [{
                    name: 'fileCode',
                    keyPath: 'fileCode',
                    unique: true
                }, {
                    name: 'id',
                    keyPath: 'id',
                    unique: true
                }, {
                    name: 'ownerId',
                    keyPath: 'ownerId',
                    unique: false
                }, {
                    name: 'fileName',
                    keyPath: 'fileName',
                    unique: false
                }, {
                    name: 'expiryTime',
                    keyPath: 'expiryTime',
                    unique: false
                }, {
                    name: 'fileType',
                    keyPath: 'fileType',
                    unique: false
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

        this.labelStore = this.db.use('label');
    }

    /**
     * 关闭存储器。
     */
    close() {
        if (null == this.db) {
            return;
        }

        cell.Logger.d('FileStructStorage', 'Close file struct storage : ' + this.domain);

        this.db.close();
        this.db = null;
    }

    /**
     * 读取文件码对应的文件标签。
     * @param {string} fileCode 文件码。
     * @param {function} handler 回调函数，参数：({@linkcode fileCode}:string, {@linkcode fileLabel}:{@link FileLabel}) 。
     * @returns {boolean} 返回是否执行了查询操作。
     */
    readFileLabel(fileCode, handler) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let result = await this.labelStore.query('fileCode', fileCode);
            if (result.length > 0) {
                result[0].domain = this.domain;
                let fileLabel = FileLabel.create(result[0]);
                handler(fileCode, fileLabel);
            }
            else {
                handler(fileCode, null);
            }
        })();

        return true;
    }

    /**
     * 写入文件标签。
     * @param {FileLabel} fileLabel 文件标签实例。
     * @returns {boolean} 返回是否执行了操作。
     */
    writeFileLabel(fileLabel) {
        if (null == this.db) {
            return false;
        }

        (async ()=> {
            let data = fileLabel.toJSON();
            delete data["domain"];
            await this.labelStore.put(data);
        })();

        return true;
    }
}
