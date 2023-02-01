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

import { Entity } from "../core/Entity";
import { Group } from "../contact/Group";
import { CommField } from "../multipointcomm/CommField";

/**
 * 会议房间。
 * 会议房间里所有持有 Cube 联系人的参与者都加入到房间对应的群组里。
 * 所有音视频参与的终端都使用对应的通讯场域进行通讯。
 */
export class Room extends Entity {

    /**
     * @param {Group} group
     * @param {CommField} commField 
     */
    constructor(group, commField) {
        super();

        /**
         * 最大允许参与人数。
         * @type {number}
         */
        this.maxParticipants = 50;

        /**
         * 参与人群组。
         * @type {Group}
         * @private
         */
        this.participantGroup = (undefined !== group) ? group : null;

        /**
         * @type {number}
         * @private
         */
        this.participantGroupId = (null != this.participantGroup) ? this.participantGroup.getId() : 0;

        /**
         * 房间的通讯场。
         * @type {CommField}
         * @private
         */
        this.commField = (undefined !== commField) ? commField : null;

        /**
         * @type {number}
         * @private
         */
        this.commFieldId = (null != this.commField) ? this.commField.getId() : 0;
    }

    /**
     * @inheritdoc
     */
    toJSON() {
        let json = super.toJSON();
        json.maxParticipants = this.maxParticipants;
        json.participantGroupId = this.participantGroupId;
        json.commFieldId = this.commFieldId;
        return json;
    }

    /**
     * @private
     * @param {*} json 
     * @returns {Room}
     */
    static create(json) {
        let room = new Room();
        room.maxParticipants = json.maxParticipants;
        room.participantGroupId = json.participantGroupId;
        room.commFieldId = json.commFieldId;
        return room;
    }
}
