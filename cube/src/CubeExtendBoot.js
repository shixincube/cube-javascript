/**
 * This file is part of Cube.
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2020-2022 Cube Team.
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

import { MessageTypePlugin } from "./messaging/extend/MessageTypePlugin";
import { TextMessage } from "./messaging/extend/TextMessage";
import { ImageMessage } from "./messaging/extend/ImageMessage";
import { FileMessage } from "./messaging/extend/FileMessage";
import { CallRecordMessage } from "./messaging/extend/CallRecordMessage";
import { HyperTextMessage } from "./messaging/extend/HyperTextMessage";
import { LocalNoteMessage } from "./messaging/extend/LocalNoteMessage";

/**
 * 导入扩展程序。
 */
(function (global) {
    // 提供全局的接口类

    global.MessageTypePlugin = MessageTypePlugin;
    global.TextMessage = TextMessage;
    global.ImageMessage = ImageMessage;
    global.FileMessage = FileMessage;
    global.CallRecordMessage = CallRecordMessage;
    global.HyperTextMessage = HyperTextMessage;
    global.LocalNoteMessage = LocalNoteMessage;

})(undefined === window.CubeNamespace ? window : window.CubeNamespace);
