# Web UI 接口

## /account/register

注册账号

> /account/register
> POST

Request
```json
{
    "account": "haosiyan",
    "password": "c7af98d321febe62e04d45e8806852e0",
    "nickname": "郝思雁",
    "avatar": "images/avatar13.png"
}
```

Respond
```json
{
    "code": 0,
    "account": {
        "id": 1615268975051,
        "account": "haosiyan",
        "password": "c7af98d321febe62e04d45e8806852e0",
        "name": "郝思雁",
        "avatar": "images/avatar13.png",
        "state": 0,
        "region": "--",
        "department": "--",
        "last": 0
    }
}
```

&nbsp;

## /account/login

账号登录

> /account/login
> POST

Request
```json
{
    "account": "haosiyan",
    "password": "c7af98d321febe62e04d45e8806852e0"
}
```

Respond
```json
{
    "code": 0,
    "token": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```

&nbsp;

## /account/logout

账号登出

> /account/logout
> POST

Request
```json
{
    "id": 1615268975051,
    "token": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```

Respond
```json
{
    "id": 1615268975051,
    "token": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```

&nbsp;

----

## /account/all

> /account/all
> GET

返回所有联系人列表。

```javascript
[{
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
}]
```

&nbsp;

## /account/get

使用令牌获取账号信息

> /account/get
> GET


Request query string: `?t=JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK`


Respond
```json
{
    "id": 50001003,
    "name": "郝思雁",
    "avatar": "images/avatar03.png",
    "state": "online",
    "region": "上海",
    "department": "公关部",
    "last": 0
}
```


&nbsp;
