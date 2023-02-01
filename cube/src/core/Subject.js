/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2023 Cube Team.
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

import { Observer } from "./Observer";
import { ObservableEvent } from "./ObservableEvent";
import { FastMap } from "../util/FastMap";

/**
 * 观察者主题。
 */
export class Subject {

    constructor() {
        /**
         * 观察者列表。
         * @type {Array<Observer>}
         * @see {@link Observer}
         * @private
         */
        this.observers = [];

        /**
         * 回调函数形式的观察者列表。
         * @type {Array}
         * @private
         */
        this.functions = [];

        /**
         * 观察者映射。
         * @type {FastMap}
         * @private
         */
        this.namedObservers = null;

        /**
         * 回调函数形式的观察者映射。
         * @type {FastMap}
         * @private
         */
        this.namedFunctions = null;
    }

    /**
     * 添加观察者。
     * @param {Observer|function} observer 指定观察者对象或回调函数。
     */
    attach(observer) {
        let list = null;
        if (typeof observer === 'function') {
            list = this.functions;
        }
        else {
            list = this.observers;
        }

        let index = list.indexOf(observer);
        if (index >= 0) {
            return;
        }

        list.push(observer);
    }

    /**
     * 添加指定事件名的观察者。
     * @param {string} name 事件名称。
     * @param {Observer|function} observer 指定观察者对象或回调函数。
     */
    attachWithName(name, observer) {
        let map = null;
        if (typeof observer === 'function') {
            if (null == this.namedFunctions) {
                this.namedFunctions = new FastMap();
            }
            map = this.namedFunctions;
        }
        else {
            if (null == this.namedObservers) {
                this.namedObservers = new FastMap();
            }
            map = this.namedObservers;
        }

        let list = map.get(name);
        if (null == list) {
            map.put(name, [ observer ]);
        }
        else {
            list.push(observer);
        }
    }

    /**
     * 移除观察者。
     * @param {Observer|function} observer 指定观察者对象或回调函数。
     */
    detach(observer) {
        let list = null;
        if (typeof observer === 'function') {
            list = this.functions;
        }
        else {
            list = this.observers;
        }

        let index = list.indexOf(observer);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }

    /**
     * 移除指定事件名的观察者。
     * @param {string} name 指定事件名。
     * @param {Observer|function} observer 指定观察者对象或回调函数。
     */
    detachWithName(name, observer) {
        let map = null;
        if (typeof observer === 'function') {
            if (null == this.namedFunctions) {
                return;
            }
            map = this.namedFunctions;
        }
        else {
            if (null == this.namedObservers) {
                return;
            }
            map = this.namedObservers;
        }

        let list = map.get(name);
        if (null == list) {
            return;
        }

        let index = list.indexOf(observer);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }

    /**
     * 通知观察者有新事件更新。
     * @param {ObservableEvent} event 新的事件。
     */
    notifyObservers(event) {
        event.subject = this;

        for (let i = 0; i < this.functions.length; ++i) {
            let func = this.functions[i];
            func(event);
        }

        for (let i = 0; i < this.observers.length; ++i) {
            let obs = this.observers[i];
            obs.update(event);
        }

        if (null != this.namedFunctions) {
            let list = this.namedFunctions.get(event.name);
            if (null != list) {
                for (let i = 0; i < list.length; ++i) {
                    list[i](event);
                }
            }
        }

        if (null != this.namedObservers) {
            let list = this.namedObservers.get(event.name);
            if (null != list) {
                for (let i = 0; i < list.length; ++i) {
                    list[i].update(event);
                }
            }
        }
    }
}
