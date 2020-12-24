// app-db.js

(function (global) {
    'use strict'

    var accounts = [{
        id: 50001001,
        name: '李国诚',
        avatar: 'images/avatar01.png',
        state: 'offline',
        region: '北京',
        department: '产品中心',
        last: 0
    }, {
        id: 50001002,
        name: '王沛珊',
        avatar: 'images/avatar02.png',
        state: 'offline',
        region: '武汉',
        department: '媒介部',
        last: 0
    }, {
        id: 50001003,
        name: '郝思雁',
        avatar: 'images/avatar03.png',
        state: 'offline',
        region: '上海',
        department: '公关部',
        last: 0
    }, {
        id: 50001004,
        name: '高海光',
        avatar: 'images/avatar04.png',
        state: 'offline',
        region: '成都',
        department: '技术部',
        last: 0
    }, {
        id: 50001005,
        name: '张明宇',
        avatar: 'images/avatar05.png',
        state: 'offline',
        region: '广州',
        department: '设计部',
        last: 0
    }];

    global.app.accounts = accounts;

})(window);
