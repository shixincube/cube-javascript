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

const config = {
    db: {
        host     : '192.168.100.122',   // 数据库服务器地址
        port     : '3307',              // 数据库服务器端口
        user     : 'cube',              // 数据库访问用户
        password : 'shixincube',        // 数据库访问密码
        database : 'cube_3_app',        // 数据库 Schema
        charset  : 'UTF8',
        supportBigNumbers : true
    },

    cube: {
        address : '127.0.0.1',          // 魔方服务器地址
        domain  : 'shixincube.com',     // 当前应用所在的域
        appKey  : 'shixin-cubeteam-opensource-appkey'   // 当前应用的 App-Key
    }
};

module.exports = config;
