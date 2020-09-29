/**
 * This source file is part of Cell.
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

/**
 * Web Console
 * 
 * @author Ambrose Xu
 *
 * 快捷键：
 * Ctrl + ~
 *
 * 控制台命令对象格式：
 * {
 *   name: "version",
 *   shortName: "ver",
 *   desc: "Print console version.",
 *   usage: "version|ver",
 *   exec: function(console, name, args) { console.println("v1.0"); }
 * }
 */

// 代理控制台
var _console_proxy = {
	log: function() {},
	info: function() {},
	warn: function() {},
	error: function() {},
	println: function() {}
};

/**
 * 控制台。
 */
var Console = Class({
	ctor: function() {
		this.version = "1.1";
		this.dom = null;
		this.viewDom = null;
		this.inputDom = null;

		this.markDom = null;

		this.keyDownFun = null;
		this.keyUpFun = null;
		this.resizeFun = null;
		this.hotKeyCtrl = false;

		// 字符数
		this.charCounts = 0;
		// 最大允许字符数
		this.maxCharCounts = 5000;

		this.prompt = '&gt; ';

		// 命令列表
		this.cmdNameMap = {};
		this.cmdShortMap = {};

		// 内置命令
		this._buildIn();

		// 大小重置定时器
		this._resizeTimer = 0;
	},

	/**
	 * 启动控制台。
	 */
	start: function() {
		var that = this;
		this.keyDownFun = function(event) { that._onKeyDown(event); };
		this.keyUpFun = function(event) { that._onKeyUp(event); };
		this.resizeFun = function(event) { that._onResize(event); };
		document.addEventListener('keydown', this.keyDownFun, false);
		document.addEventListener('keyup', this.keyUpFun, false);
		window.addEventListener('resize', this.resizeFun, false);

		if (null == this.dom) {
			var el = document.createElement("div");
			el.id = "_console";
			var ta = ['<div class="window container">'
				, '<div class="title"><div class="text">Console</div><a id="_console_close" href="#" class="close">X</a></div>'
				, '<div id="_console_view" class="view"><p>Console '
				, this.version
				, ' (for Cube, updated 2020)</p><p>Enter the "help" for more information.</p><p><br/></p></div>'
				, '<div class="cmd-input">&gt; <input type="text" name="_console_cmd" id="_console_cmd" maxlength="256"></div>'
				, '</div>'];
			el.innerHTML = ta.join('');
			document.body.appendChild(el);
			el.style.visibility = 'hidden';

			this.dom = el;
		}

		if (null == this.viewDom) {
			this.viewDom = document.getElementById('_console_view');
		}
		if (null == this.inputDom) {
			this.inputDom = document.getElementById('_console_cmd');
		}

		var btnClose = document.getElementById('_console_close');
		btnClose.addEventListener('click', function() { that.close(); }, false);

		if (typeof console === "undefined" || typeof console.log === "undefined") {
			var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
				"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

			window.console = {};
			for (var i = 0; i < names.length; ++i) {
				window.console[names[i]] = function() {};
			}
		}

		// 代理控制台日志
		this._proxyConsole();

		_console_proxy.println = function(args) {
			that.println(args);
		}
	},

	/**
	 * 停用控制台。
	 */
	stop: function() {
		document.removeEventListener('keydown', this.keyDownFun, false);
		document.removeEventListener('keyup', this.keyUpFun, false);
		window.removeEventListener('resize', this.resizeFun, false);
	},

	/**
	 * 开启控制台界面。
	 */
	open: function() {
		if (!this.isClosed()) {
			return;
		}

		this._resize();

		this.dom.style.visibility = 'visible';

		// 刷新角标
		this._refreshMark();
	},

	/**
	 * 关闭控制台界面。
	 */
	close: function() {
		if (this.isClosed()) {
			return;
		}

		this.dom.style.visibility = 'hidden';

		// 刷新角标
		this._refreshMark();
	},

	/**
	 * 设置是否显示角标。
	 */
	mark: function(value) {
		if (value) {
			if (null == this.markDom) {
				var el = document.createElement("div");
				el.innerHTML = '<button class="_console_mark">Console</button>';
				this.markDom = el;

				document.body.appendChild(this.markDom);

				var that = this;
				this.markDom.addEventListener('click', function() {
					that.open();
				}, false);
			}

			this._refreshMark();
		}
		else {
			if (null != this.markDom) {
				document.body.removeChild(this.markDom);
				this.markDom = null;
			}
		}
	},

	/**
	 * 控制台是否已显示。
	 */
	isClosed: function() {
		return (null == this.dom || this.dom.style.visibility != 'visible') ? true : false;
	},

	/**
	 * 代理处理原生控制台日志。
	 */
	_proxyConsole: function() {
		_console_proxy.log = window.console.log;
		window.console.log = this.log;
		_console_proxy.info = window.console.info;
		window.console.info = this.info;
		_console_proxy.warn = window.console.warn;
		window.console.warn = this.warn;
		_console_proxy.error = window.console.error;
		window.console.error = this.error;
	},

	/**
	 * 打印指定文本信息到控制台界面。
	 */
	log: function(text) {
		_console_proxy.log(text);
		_console_proxy.println(text);
	},

	/**
	 * 打印指定文本信息到控制台界面。
	 */
	info: function(text) {
		_console_proxy.info(text);
		_console_proxy.println(text);
	},

	/**
	 * 打印指定文本信息到控制台界面。
	 */
	warn: function(text) {
		_console_proxy.warn(text);
		_console_proxy.println(text);
	},

	/**
	 * 打印指定文本信息到控制台界面。
	 */
	error: function(text) {
		_console_proxy.error(text);
		_console_proxy.println(text);
	},

	/**
	 * 打印文本内容并换行。
	 */
	println: function(content) {
		if (typeof(content) != 'string') {
			content = content.toString();
		}

		if (null != this.viewDom) {
			this._precheckCharCounts(content);

			var el = document.createElement('p');
			el.innerHTML = content.length > 0 ? content : '<br/>';
			this.viewDom.appendChild(el);
			this.viewDom.scrollTop = this.viewDom.scrollHeight;
		}
	},

	/**
	 * 清空打印信息。
	 */
	clear: function() {
		this.viewDom.innerHTML = "";
		this.charCounts = 0;
	},

	/**
	 * 注册控制台命令。
	 */
	register: function(cmd) {
		this.cmdNameMap[cmd.name] = cmd;
		this.cmdShortMap[cmd.shortName] = cmd;
	},

	/**
	 * 内置命令。
	 */
	_buildIn: function() {
		// help
		this.register({name: "help"
				, shortName: "help"
				, desc: "打印控制台帮助信息及命令清单。"
				, usage: "help"
				, exec: function(console, name, args) {
					//console.println(console.prompt + name);
					console.println("控制台显示/隐藏快捷键：Ctrl + ~");
					console.println("控制台命令清单：");
					for (var n in console.cmdNameMap) {
						if (typeof(n) == 'string') {
							var cmd = console.cmdNameMap[n];
							console.println(n + "  -  " + cmd.desc);
						}
					}
					console.println("");
				}
			});

		// version/ver
		this.register({name: "version"
				, shortName: "ver"
				, desc: "打印控制台版本信息。"
				, usage: "version|ver"
				, exec: function(console, name, args) {
					//console.println(console.prompt + name);
					console.log("Console version " + console.version + ", author 'Ambrose Xu'");
					console.println("");
				}
			});

		// clear/cls
		this.register({name: "clear"
				, shortName: "cls"
				, desc: "清空控制台界面内的所有打印信息。"
				, usage: "clear|cls"
				, exec: function(console, name, args) {
					console.clear();
				}
			});
	},

	_precheckCharCounts: function(content) {
		var chars = content.length;
		this.charCounts += chars;

		if (this.charCounts >= this.maxCharCounts) {
			this.viewDom.innerHTML = "";
			this.charCounts = chars;
		}
	},

	_processInput: function() {
		var text = this.inputDom.value;
		if (text.length <= 0) {
			return;
		}

		// 分拆命令
		var name = null;
		var args = "";
		var index = text.indexOf(" ");
		if (index == 0) {
			return;
		}
		else if (index < 0) {
			name = text;
		}
		else {
			name = text.substr(0, index);
			args = text.substr(index + 1, text.length - index);
			// 拆分命令参数
			args = args.split(" ");
		}

		// 清空输入框
		this.inputDom.value = "";

		var cmd = this.cmdNameMap[name];
		if (undefined === cmd || null == cmd) {
			cmd = this.cmdShortMap[name];
		}
		if (null == cmd) {
			// 打印命令
			this.println(this.prompt + name)
			this.println("Unknown command: " + name);
			this.println("");
			return;
		}

		// 打印命令
		this.println(this.prompt + name + ((args.length == 0) ? "" : " " + args.join(" ")));

		// 执行命令
		cmd.exec(this, name, args);
	},

	_resize: function() {
		if (null == this.dom)
			return;

		var w = parseInt(document.body.clientWidth);
		this.dom.style.width = w + "px";

		var h = parseInt(document.body.clientHeight);
		if (h > 200)
			this.dom.style.height = h + "px";

		this.inputDom.style.width = (w - 60) + "px";
	},

	_refreshMark: function() {
		if (null == this.markDom) {
			return;
		}

		if (this.isClosed()) {
			this.markDom.style.visibility = 'visible';
		}
		else {
			this.markDom.style.visibility = 'hidden';
		}
	},

	_onKeyDown: function(event) {
		if (event.keyCode == 17)
			this.hotKeyCtrl = true;
	},

	_onKeyUp: function(event) {
		// C - 67，~ - 192
		if (event.keyCode == 192 && this.hotKeyCtrl) {
			if (this.dom.style.visibility == 'visible')
				this.close();
			else
				this.open();
		}
		else if (event.keyCode == 17) {
			this.hotKeyCtrl = false;
		}
		else if (event.keyCode == 13) {
			// 回车
			this._processInput();
		}
	},

	_onResize: function(event) {
		if (this._resizeTimer > 0) {
			clearTimeout(this._resizeTimer);
			this._resizeTimer = 0;
		}

		var that = this;
		this._resizeTimer = setTimeout(function() {
			clearTimeout(that._resizeTimer);
			that._resizeTimer = 0;

			that._resize();
		}, 600);
	}
});
