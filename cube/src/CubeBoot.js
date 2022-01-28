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
import { ObservableEvent } from "./core/ObservableEvent";
import { JSONable } from "./util/JSONable";
import { OrderMap } from "./util/OrderMap";
import { MediaDeviceTool } from "./util/MediaDeviceTool";
import { MediaDeviceDescription } from "./util/MediaDeviceDescription";
import { Entity } from "./core/Entity";
import { CubeEngine } from "./engine/CubeEngine";
import { CubeShortcut } from "./engine/CubeShortcut";
import { Kernel } from "./core/Kernel";
import { Plugin } from "./core/Plugin";
import { CellPipeline } from "./pipeline/CellPipeline";
import { AuthToken } from "./auth/AuthToken";
import { PrimaryDescription } from "./auth/PrimaryDescription";
import { AuthService } from "./auth/AuthService";
import { ContactService } from "./contact/ContactService";
import { ContactServiceState } from "./contact/ContactServiceState";
import { ContactContextProvider } from "./contact/ContactContextProvider";
import { ContactEvent } from "./contact/ContactEvent";
import { Contact } from "./contact/Contact";
import { ContactZone } from "./contact/ContactZone";
import { ContactZoneParticipantState } from "./contact/ContactZoneParticipantState";
import { ContactZoneParticipantType } from "./contact/ContactZoneParticipantType";
import { ContactZoneParticipant } from "./contact/ContactZoneParticipant";
import { Self } from "./contact/Self";
import { Group } from "./contact/Group";
import { GroupState } from "./contact/GroupState";
import { GroupBundle } from "./contact/GroupBundle";
import { DummyContact } from "./contact/DummyContact";
import { ContactAppendix } from "./contact/ContactAppendix";
import { GroupAppendix } from "./contact/GroupAppendix";
import { MessagingService } from "./messaging/MessagingService";
import { MessagingServiceState } from "./messaging/MessagingServiceState";
import { MessagingEvent } from "./messaging/MessagingEvent";
import { Message } from "./messaging/Message";
import { FileAttachment } from "./messaging/FileAttachment";
import { MessageState } from "./messaging/MessageState";
import { MessagePlugin } from "./messaging/MessagePlugin";
import { Conversation } from "./messaging/Conversation";
import { ConversationType } from "./messaging/ConversationType";
import { ConversationState } from "./messaging/ConversationState";
import { ConversationReminding } from "./messaging/ConversationReminding";
import { FileStorage } from "./filestorage/FileStorage";
import { FileAnchor } from "./filestorage/FileAnchor";
import { FileLabel } from "./filestorage/FileLabel";
import { Directory } from "./filestorage/Directory";
import { SearchItem } from "./filestorage/SearchItem";
import { TrashFile } from "./filestorage/TrashFile";
import { TrashDirectory } from "./filestorage/TrashDirectory";
import { FileStorageEvent } from "./filestorage/FileStorageEvent";
import { FileProcessor } from "./fileprocessor/FileProcessor";
import { FileThumbnail } from "./fileprocessor/FileThumbnail";
import { MultipointComm } from "./multipointcomm/MultipointComm";
import { MediaConstraint } from "./multipointcomm/MediaConstraint";
import { VideoDimension } from "./multipointcomm/VideoDimension";
import { RTCDevice } from "./multipointcomm/RTCDevice";
import { MediaListener } from "./multipointcomm/MediaListener";
import { MultipointCommEvent } from "./multipointcomm/MultipointCommEvent";
import { MultipointCommState } from "./multipointcomm/MultipointCommState";
import { CallRecord } from "./multipointcomm/CallRecord";
import { CallEvent } from "./multipointcomm/CallEvent";
import { CallState } from "./multipointcomm/CallState";
import { CommEvent } from "./multipointcomm/CommEvent";
import { CommField } from "./multipointcomm/CommField";
import { CommFieldEndpoint } from "./multipointcomm/CommFieldEndpoint";
import { ConferenceService } from "./conference/ConferenceService";
import { Conference } from "./conference/Conference";
import { Invitation } from "./conference/Invitation";
import { FaceMonitor } from "./facemonitor/FaceMonitor";
import { FaceMonitorEvent } from "./facemonitor/FaceMonitorEvent";
import { FaceMonitorState } from "./facemonitor/FaceMonitorState";
import { Announcer } from "./util/Announcer";

/**
 * 引导程序, 负责模块导入。
 */
(function (global) {
    // 提供全局的接口类

    global.Subject = Subject;
    global.Observer = Observer;
    global.ObservableEvent = ObservableEvent;

    global.JSONable = JSONable;
    global.Entity = Entity;
    global.OrderMap = OrderMap;
    global.MediaDeviceTool = MediaDeviceTool;
    global.MediaDeviceDescription = MediaDeviceDescription;

    global.CubeEngine = CubeEngine;
    global.Kernel = Kernel;
    global.Plugin = Plugin;

    global.CellPipeline = CellPipeline;

    global.AuthToken = AuthToken;
    global.AuthService = AuthService;
    global.PrimaryDescription = PrimaryDescription;

    global.ContactService = ContactService;
    global.ContactServiceState = ContactServiceState;
    global.ContactContextProvider = ContactContextProvider;
    global.ContactEvent = ContactEvent;
    global.Contact = Contact;
    global.ContactZone = ContactZone;
    global.ContactZoneParticipantType = ContactZoneParticipantType;
    global.ContactZoneParticipantState = ContactZoneParticipantState;
    global.ContactZoneParticipant = ContactZoneParticipant;
    global.Self = Self;
    global.Group = Group;
    global.GroupState = GroupState;
    global.GroupBundle = GroupBundle;
    global.DummyContact = DummyContact;
    global.ContactAppendix = ContactAppendix;
    global.GroupAppendix = GroupAppendix;

    global.MessagingService = MessagingService;
    global.MessagingServiceState = MessagingServiceState;
    global.MessagingEvent = MessagingEvent;
    global.Message = Message;
    global.MessageState = MessageState;
    global.MessagePlugin = MessagePlugin;
    global.Conversation = Conversation;
    global.ConversationType = ConversationType;
    global.ConversationState = ConversationState;
    global.ConversationReminding = ConversationReminding;

    global.FileStorage = FileStorage;
    global.FileAnchor = FileAnchor;
    global.FileLabel = FileLabel;
    global.FileAttachment = FileAttachment;
    global.FileStorageEvent = FileStorageEvent;
    global.Directory = Directory;
    global.SearchItem = SearchItem;
    global.TrashFile = TrashFile;
    global.TrashDirectory = TrashDirectory;

    global.FileProcessor = FileProcessor;
    global.FileThumbnail = FileThumbnail;

    global.MultipointComm = MultipointComm;
    global.VideoDimension = VideoDimension;
    global.MediaConstraint = MediaConstraint;
    global.RTCDevice = RTCDevice;
    global.MultipointCommEvent = MultipointCommEvent;
    global.MultipointCommState = MultipointCommState;
    global.CallRecord = CallRecord;
    global.CallEvent = CallEvent;
    global.CallState = CallState;
    global.CommEvent = CommEvent;
    global.CommField = CommField;
    global.CommFieldEndpoint = CommFieldEndpoint;
    global.MediaListener = MediaListener;

    global.ConferenceService = ConferenceService;
    global.Conference = Conference;
    global.Invitation = Invitation;

    global.FaceMonitor = FaceMonitor;
    global.FaceMonitorEvent = FaceMonitorEvent;
    global.FaceMonitorState = FaceMonitorState;

    global.Announcer = Announcer;

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

})(undefined === window.CubeNamespace ? window : window.CubeNamespace);
