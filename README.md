# Cube for Javascript

**Cube** **时信魔方** 是面向开发者的实时协作开发框架。帮助开发者快速、高效的在项目中集成实时协作能力。

支持的操作系统有：Windows、Linux 、macOS 、Android、iOS 等，支持的浏览器有：Chrome、Firefox、Safari 等。


## 简介

Cube for Javascript 是 Cube 的浏览器端 SDK 解决方案。开发者可使用该项目快速集成 Cube 的各项功能和能力。


## 功能列表

Cube 包含以下协作功能：

* 即时消息（Instant Messaging / IM）。支持卡片消息、通知消息、文件消息和自定义消息等。
* 实时多人语音/多人视频（Multipoint RTC）。支持自适应码率、超低延迟等，支持实时图像识别等。
* 超大规模(100+)会议 （Video Conference）。支持会议控制、演讲模式，自定义 MCU 和 SFU 布局等。
* 群组管理（Group management）。支持集成式管理和扩展组织架构等。
* 共享桌面（Remote Desktop Sharing）。支持无缝集成白板等。
* 云端文件存储（Cloud File Storage）。支持无缝集成文档在线协作等。
* 实时白板（Realtime Whiteboard）。支持集成媒体回放、远程桌面和文档分享等。
* 视频直播（Live video）。支持第三方推流和 CDN ，无缝支持会议直播和回放等。
* 互动课堂（Online Classroom）。支持实时课堂互动和在线习题、考试。
* 电子邮件管理与代收发（Email management）。
* 在线文档协作（Online Document Collaboration）。支持 Word、PowerPoint、Excel 等主流格式文多人在写协作。
* 安全与运维管理（Operation and Maintenance management）。所有数据通道支持加密，可支持国密算法等。
* 风控管理（Risk Management）。对系统内所有文本、图片、视频、文件等内容进行包括 NLP、OCR、IR 等技术手段的风险控制和预警等。


## 快速开始

在您的页面中引入 Cube 的库文件：
```html
<script type="text/javascript" src="/javascripts/cube-3.0.0.js"></script>
```

仅需要两步即可开始使用 Cube 的各个模块功能：

1. 获取 Cube 实例并启动 Cube 引擎。
  ```javascript
  // 获取 Cube 的实例
  var cube = window.cube();

  // 指定 Cube 工作的域和网关地址，启动 Cube 引擎。
  cube.start({
      address: '127.0.0.1',
      domain: 'shixincube.com',
      appKey: 'shixin-cubeteam-opensource-appkey'
  }, function() {
      console.log('启动成功');
  }, function(error) {
      console.log('启动故障');
  });
  ```

2. 签入当前账号。例如：账号 ID 是 500123 。签入该 ID 之后，Cube 将以该 ID 为一个有效的联系人进行管理。
   ```javascript
   cube.signIn(500123);
   ```

完成上述操作之后，即可使用 Cube 的各个模块及其相关功能，例如发送消息给 ID 为 500298 的联系人：
```javascript
cube.messaging.sendToContact(500298,  { "content": "今天是周一，上午有例会。" });
```

更多功能请参考 Cube 手册和 API 文档。


## 如何从源代码构建项目

### 1. 工具与软件准备

 您需要在您的开发环境中正确安装以下工具：

 * [node](https://nodejs.org/zh-cn/) (需要 11.0 及以上版本。)
 * [npm](https://www.npmjs.com/)


### 2. 下载工程源代码

 从 [cube-javascript](https://gitee.com/shixinhulian/cube-javascript) 获得 Cube for Javascript 的源代码。克隆 [cube-javascript](https://gitee.com/shixinhulian/cube-javascript) 代码库：

   `git clone https://gitee.com/shixinhulian/cube-javascript.git`


### 3. 运行构建脚本

 从代码库下载代码之后，进入 Cube 的工程目录 `cube` 目录下，依次执行以下步骤来进行项目构建。

 1. 在项目根目录下安装项目依赖的 NPM 模块：`npm install`

 2. 执行工程构建命令：`npm run build`

成功执行构建命令之后，会在 `dist` 目录下生成 Cube 的库文件。

## 功能展示

| 即时消息 |
|:----:|
|![IM](https://static.shixincube.com/cube/assets/showcase/im.gif)|

| 视频聊天(1) | 视频聊天(2) |
|:----:|:----:|
|![VideoChat1](https://static.shixincube.com/cube/assets/showcase/videochat_1.gif)|![VideoChat2](https://static.shixincube.com/cube/assets/showcase/videochat_2.gif)|

| 多人视频聊天(1) | 多人视频聊天(2) |
|:----:|:----:|
|![VideoChat3](https://static.shixincube.com/cube/assets/showcase/videochat_3.gif)|![VideoChat4](https://static.shixincube.com/cube/assets/showcase/videochat_4.gif)|

| 会议 |
|:----:|
|![Conf100](https://static.shixincube.com/cube/assets/showcase/screen_conference.jpg)|
|![ConfTile](https://static.shixincube.com/cube/assets/showcase/screen_conference_tile.jpg)|
|![StartConf](https://static.shixincube.com/cube/assets/showcase/start_conference.gif)|

| 共享桌面 |
|:----:|
|![ScreenSharing](https://static.shixincube.com/cube/assets/showcase/screen_sharing.gif)|

| 云端文件存储 |
|:----:|
|![CFS](https://static.shixincube.com/cube/assets/showcase/cloud_file.gif)|

| 白板 |
|:----:|
|![Whiteboard](https://static.shixincube.com/cube/assets/showcase/whiteboard.gif)|

| 直播 |
|:----:|
|![Live](https://static.shixincube.com/cube/assets/showcase/live.gif)|

| 在线课堂 |
|:----:|
|![OnlineClassroom](https://static.shixincube.com/cube/assets/showcase/online_classroom.gif)|

| 文档协作 |
|:----:|
|![DocCollaboration](https://static.shixincube.com/cube/assets/showcase/doc_collaboration_excel.gif)|
|![DocCollaboration](https://static.shixincube.com/cube/assets/showcase/doc_collaboration.gif)|


## 获得帮助

您可以访问 [时信魔方官网](https://www.shixincube.com/) 获得更多信息。如果您在使用 Cube 的过程中需要帮助可以发送邮件到 [cube@spap.com](mailto:cube@spap.com) 。
