# Web UI 接口

## /cube/config

获取时信魔方的配置信息。

> /cube/config
> GET

Request
```json
{
    "t": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```

Respond
```json
{
    "address": "127.0.0.1",
    "domain": "shixincube.com",
    "appKey": "shixin-cubeteam-opensource-appkey"
}
```

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
    "avatar": "avatar13.png"
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
        "avatar": "avatar13.png",
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
    "token": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
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

## /account/get

使用令牌获取账号信息

> /account/get
> GET

```json
{
    "t": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```

Respond
```json
{
    "id": 50001003,
    "account": "cube3",
    "password": "c7af98d321febe62e04d45e8806852e0",
    "name": "郝思雁",
    "avatar": "avatar03.png",
    "state": 0,
    "region": "上海",
    "department": "公关部",
    "last": 0
}
```

&nbsp;

## /account/info

获取指定账号数据

> /account/info
> GET

Request
```json
{
    "id": 50001003,
    "token": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```
*OR*
```json
{
    "list": "50001002,50001003,50001004",
    "token": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```

Respond
```json
{
    "id": 50001003,
    "name": "郝思雁",
    "avatar": "avatar03.png",
    "state": 0,
    "region": "上海",
    "department": "公关部",
    "last": 0
}
```

&nbsp;

## /account/info

修改当前账号数据

> /account/info
> POST

Request
```json
{
    "name": "来自白垩纪",
    "avatar": "avatar09.png"
}
```

Respond
```json
{
    "id": 50001003,
    "name": "来自白垩纪",
    "avatar": "avatar09.png",
    "state": 0,
    "region": "上海",
    "department": "公关部",
    "last": 0
}
```

> 该接口仅能修改当前已登录账号的信息。


&nbsp;

## /account/hb

心跳指令，客户端保持活跃。

> /account/hb
> POST

Request
```json
{
    "token": "JSZeCEqjQgHpeoMAqwVVtmzLcDyJxGUK"
}
```

Respond
```json
{
    "success": true
}
```

&nbsp;

----

## /account/buildin

> /account/buildin
> GET

返回系统内置的联系人列表。

```javascript
[{
    id: 50001001,
    name: '李国诚',
    avatar: 'avatar01.png',
    state: 'offline',
    region: '北京',
    department: '产品中心',
    last: 0
}, {
    id: 50001002,
    name: '王沛珊',
    avatar: 'avatar02.png',
    state: 'offline',
    region: '武汉',
    department: '媒介部',
    last: 0
}, {
    id: 50001003,
    name: '郝思雁',
    avatar: 'avatar03.png',
    state: 'offline',
    region: '上海',
    department: '公关部',
    last: 0
}, {
    id: 50001004,
    name: '高海光',
    avatar: 'avatar04.png',
    state: 'offline',
    region: '成都',
    department: '技术部',
    last: 0
}, {
    id: 50001005,
    name: '张明宇',
    avatar: 'avatar05.png',
    state: 'offline',
    region: '广州',
    department: '设计部',
    last: 0
}]
```

&nbsp;
