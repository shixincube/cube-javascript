/**
 * This file is part of Cube.
 * https://shixincube.com
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

// 辅助函数库
(function(g) {

    var contactData = [{
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

})(window);
