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

import cell from "@lib/cell-lib";
import { Subject } from "./core/Subject";
import { Observer } from "./core/Observer";
import { ObservableState } from "./core/ObservableState";
import { Entity } from "./core/Entity";
import { CubeEngine } from "./engine/CubeEngine";
import { CubeShortcut } from "./engine/CubeShortcut";
import { Kernel } from "./core/Kernel";
import { CellPipeline } from "./pipeline/CellPipeline";
import { AuthToken } from "./auth/AuthToken";
import { PrimaryDescription } from "./auth/PrimaryDescription";
import { AuthService } from "./auth/AuthService";
import { ContactService } from "./contacts/ContactService";
import { ContactEvent } from "./contacts/ContactEvent";
import { Contact } from "./contacts/Contact";
import { Self } from "./contacts/Self";
import { MessagingService } from "./messaging/MessagingService";
import { MessagingEvent } from "./messaging/MessagingEvent";
import { Message } from "./messaging/Message";
import { MessageState } from "./messaging/MessageState";
import { FileMessage } from "./messaging/FileMessage";
import { FileStorage } from "./filestorage/FileStorage";
import { FileAnchor } from "./filestorage/FileAnchor";
import { FileAttachment } from "./filestorage/FileAttachment";
import { FileStorageEvent } from "./filestorage/FileStorageEvent";
import { ConferenceService } from "./conference/ConferenceService";
import { FaceMonitor } from "./facemonitor/FaceMonitor";

/**
 * 引导程序, 负责模块导入。
 */
(function (global) {
    // 提供全局的接口类

    global.Subject = Subject;
    global.Observer = Observer;
    global.ObservableState = ObservableState;

    global.Entity = Entity;

    global.CubeEngine = CubeEngine;
    global.Kernel = Kernel;

    global.CellPipeline = CellPipeline;

    global.AuthToken = AuthToken;
    global.AuthService = AuthService;
    global.PrimaryDescription = PrimaryDescription;

    global.ContactService = ContactService;
    global.ContactEvent = ContactEvent;
    global.Contact = Contact;
    global.Self = Self;

    global.MessagingService = MessagingService;
    global.MessagingEvent = MessagingEvent;
    global.Message = Message;
    global.MessageState = MessageState;
    global.FileMessage = FileMessage;

    global.FileStorage = FileStorage;
    global.FileAnchor = FileAnchor;
    global.FileAttachment = FileAttachment;
    global.FileStorageEvent = FileStorageEvent;

    global.ConferenceService = ConferenceService;

    global.FaceMonitor = FaceMonitor;

    global.cell = cell;

    global._cube_ = null;

    // Cube 全局快捷函数。
    global.cube = function() {
        if (undefined !== global._cube_ && null != global._cube_) {
            return global._cube_;
        }

        global._cube_ = new CubeShortcut();
        return global._cube_;
    }

})(window);
