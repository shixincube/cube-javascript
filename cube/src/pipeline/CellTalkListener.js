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

import cell from "@lib/cell-lib"
import { CellPipeline } from "./CellPipeline";

/**
 * 监听器。
 */
export class CellTalkListener extends cell.TalkListener {

    /**
     * 构造函数。
     * @param {CellPipeline} pipeline 数据通道实例。
     */
    constructor(pipeline) {
        super();
        this.pipeline = pipeline;
    }

    /**
     * @inheritdoc
     */
    onListened(speaker, cellet, primitive) {
        this.pipeline.triggerListened(speaker, cellet, primitive);
    }

    /**
     * @inheritdoc
     */
    onSpoke(speaker, cellet, primitive) {
        // Nothing
    }

    /**
     * @inheritdoc
     */
    onAck(speaker, cellet, primitive) {
        // Nothing
    }

    /**
     * @inheritdoc
     */
    onSpeakTimeout(speaker, cellet, primitive) {
        // Nothing
    }

    /**
     * @inheritdoc
     */
    onContacted(speaker) {
        // Nothing
        cell.Logger.d('CellTalkListener', 'onContacted');
    }

    /**
     * @inheritdoc
     */
    onQuitted(speaker) {
        // Nothing
        cell.Logger.d('CellTalkListener', 'onQuitted');
    }

    /**
     * @inheritdoc
     */
    onFailed(speaker, error) {
        this.pipeline.triggerError(speaker, error);
    }
}
