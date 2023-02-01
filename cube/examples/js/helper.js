/**
 * This file is part of Cube.
 * https://shixincube.com
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

// 辅助函数库
(function(g) {

    const contactData = [{
            id: 300101,
            name: '武致远'
        }, {
            id: 300102,
            name: '邓雅云'
        }, {
            id: 300103,
            name: '石季萌'
        }, {
            id: 300104,
            name: '吴凝蕊'
        }, {
            id: 300105,
            name: '罗文栋'
        }, {
            id: 300106,
            name: '叶瑶华'
        }, {
            id: 300107,
            name: '田宏茂'
        }, {
            id: 300108,
            name: '风诗柳'
        }, {
            id: 300109,
            name: '徐文石'
        }, {
            id: 300110,
            name: '韶宁乐'
        }];

    var contacts = [];

    function getContactName(id) {
        for (var i = 0; i < contactData.length; ++i) {
            var data = contactData[i];
            if (data.id == id) {
                return data.name;
            }
        }
        return '';
    }

    g.formatTime = function(timestamp) {
        var date = new Date(timestamp);
        var format = [
            date.getFullYear(), '-',
            date.getMonth() + 1, '-',
            date.getDate(), ' ',
            date.getHours(), ':',
            date.getMinutes(), ':',
            date.getSeconds()
        ];
        return format.join('');
    }

    // 从引擎加载联系人
    g.loadContacts = function(cube, callback) {
        contacts.splice(0, contacts.length);

        contactData.forEach(function(value) {
            cube.contact.getContact(value.id, function(contact) {
                contact.setName(getContactName(contact.getId()));
                contacts.push(contact);

                if (contacts.length == contactData.length) {
                    callback(contacts);
                }
            });
        });
    }

    /**
     * 返回指定 ID 的联系人名称。
     * @param {number} id 
     * @returns {string}
     */
    g.getContactName = function(id) {
        var name = getContactName(id);
        if (name.length == 0) {
            if (g.cube().contact.getSelf().getId() == id) {
                name = g.cube().contact.getSelf().getName();
            }
        }

        return name;
    }

    /**
     * 返回所有演示用联系人的 ID 列表。
     */
    g.getAllContactsId = function() {
        var list = [];
        for (var i = 0; i < contactData.length; ++i) {
            list.push(contactData[i].id);
        }
        return list;
    }

    // 对话框操作
    g.dialog = function(id, action, handler) {
        var el = document.getElementById(id);
        if (undefined === el) {
            return;
        }

        var list = el.getElementsByTagName('button');
        for (var i = 0; i < list.length; ++i) {
            var item = list[i];
            if (item.getAttribute('data') == 'close') {
                item.onclick = function() {
                    handler(false);
                    el.style.visibility = 'hidden';
                    document.documentElement.style.overflow = 'unset';
                };
            }
            else if (item.getAttribute('data') == 'confirm') {
                item.onclick = function() {
                    var ret = handler(true);
                    if (undefined === ret || ret === true) {
                        el.style.visibility = 'hidden';
                        document.documentElement.style.overflow = 'unset';
                    }
                };
            }
        }

        document.body.scrollTop = document.documentElement.scrollTop = 0;
        document.documentElement.style.overflow = 'hidden';
        el.style.visibility = (action == 'show') ? 'visible' : 'hidden';
    }

    /**
     * 选择一个可用的媒体输入设备。
     * @param {string} type 设备类型：'audio' 或 'video'
     * @param {function} handler 
     */
    g.selectMediaDevice = function(type, handler) {
        // 枚举当前接入的设备
        MediaDeviceTool.enumDevices(function(list) {
            var devices = [];
            for (var i = 0; i < list.length; ++i) {
                var device = list[i];
                if (type == 'audio' && device.isAudioInput()) {
                    devices.push(device);
                }
                else if (type == 'video' && device.isVideoInput()) {
                    devices.push(device);
                }
            }

            if (devices.length == 0) {
                handler(undefined);
            }
            else if (devices.length == 1) {
                handler(devices[0]);
            }
            else {
                showSelectDevice(devices, handler);
            }
        });
    }

    function showSelectDevice(devices, handler) {
        var el = document.getElementById('select_device');
        if (null == el || undefined === el) {
            var html = [
                '<div class="dialog-content">',
                    '<div class="dialog-header">',
                        '<h3>选择设备</h3>',
                    '</div>',
                    '<div class="dialog-body">',
                    '</div>',
                    '<div class="dialog-footer">',
                        '<button data="close">取消</button>',
                        '<button data="confirm">确定</button>',
                    '</div>',
                '</div>'
            ];

            el = document.createElement('div');
            el.setAttribute('id', 'select_device');
            el.setAttribute('class', 'dialog');
            el.innerHTML = html.join('');
            document.body.appendChild(el);
        }

        var deviceHTML = ['<form>'];
        for (var i = 0; i < devices.length; ++i) {
            var device = devices[i];
            deviceHTML.push('<div style="margin-bottom:10px;"><label><input name="MediaDevices" id="device_' + i + '" type="radio" value="' + i + '" '
                    + ((i == 0) ? 'checked' : '')
                + ' > ' +
                    device.label
                + '</label></div>');
        }
        deviceHTML.push('</form>');

        var body = el.getElementsByClassName('dialog-body')[0];
        body.innerHTML = deviceHTML.join('');

        var list = el.getElementsByTagName('button');
        for (var i = 0; i < list.length; ++i) {
            var item = list[i];
            if (item.getAttribute('data') == 'close') {
                item.onclick = function() {
                    handler(null);
                    el.style.visibility = 'hidden';
                    document.documentElement.style.overflow = 'unset';
                };
            }
            else if (item.getAttribute('data') == 'confirm') {
                item.onclick = function() {
                    var radioList = body.getElementsByTagName('input');
                    var selectedDevice = null;
                    for (var n = 0; n < radioList.length; ++n) {
                        var radio = radioList[n];
                        if (radio.checked) {
                            selectedDevice = devices[parseInt(radio.value)];
                            break;
                        }
                    }
                    handler(selectedDevice);
                    el.style.visibility = 'hidden';
                    document.documentElement.style.overflow = 'unset';
                };
            }
        }

        document.body.scrollTop = document.documentElement.scrollTop = 0;
        document.documentElement.style.overflow = 'hidden';
        el.style.visibility = 'visible';
    }

    /**
     * 显示状态统计数据。
     * @param {*} el 
     * @param {*} stats 
     */
    g.showRTCStats = function(el, stats) {
        var statsOutput = '';

        if (null != stats) {
            stats.forEach(function(report) {
                if (report.type.indexOf('rtp') >= 0) {
                    statsOutput += `<h3>${report.type}</h3>\n<span class="stat-name">id</span> : ${report.id}<br>\n` +
                            `<span class="stat-name">timestamp</span> : ${report.timestamp}<br>\n`;
    
                    Object.keys(report).forEach(function(statName) {
                        if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                            statsOutput += `<span class="stat-name">${statName}</span> : ${report[statName]}<br>\n`;
                        }
                    });
                }

                /* ALL - only for debug
                statsOutput += `<h3>Report: ${report.type}</h3>\n<strong>ID:</strong> ${report.id}<br>\n` +
                            `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;
                Object.keys(report).forEach(function(statName) {
                    if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                        statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
                    }
                });*/
            });
        }
        else {
            statsOutput = '<h3>没有数据</h3>'
        }

        el.innerHTML = statsOutput;
        el.style.visibility = 'visible';
    }

    g.hideRTCStats = function(el) {
        el.style.visibility = 'hidden';
    }

})(window);
