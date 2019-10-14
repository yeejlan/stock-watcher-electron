"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var electron = require("electron");
var electron_1 = require("electron");
var path = require("path");
var fs = require("fs");
var iconv = require("iconv-lite");
var request = require('request');
var ini = require('ini');
var ipc = electron.ipcMain;
var singleLock = electron_1.app.requestSingleInstanceLock();
var config = ini.parse(fs.readFileSync(path.join(__dirname, "config.ini"), 'utf-8'));
var mainWindow = null;
var tray = null;
require("electron-debug")({ showDevTools: false });
electron_1.app.on("second-instance", function () {
    if (mainWindow) {
        if (!mainWindow.isVisible())
            mainWindow.show();
        else
            mainWindow.moveTop();
    }
});
if (!singleLock) {
    electron_1.app.quit();
}
electron_1.app.on("ready", function () {
    mainWindow = createMainWindow();
    showWindow();
    var hotkey = config.hotkey.modifier + '+' + config.hotkey.key;
    electron_1.globalShortcut.register(hotkey, function () {
        toggleWindow();
    });
});
function createAboutWindow() {
    var win = new electron.BrowserWindow({
        backgroundColor: "#fefefe",
        frame: true,
        modal: true,
        parent: mainWindow,
        show: true,
        width: 450,
        height: 250,
        resizable: false,
        title: "about",
        icon: "console.png",
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.removeMenu();
    win.loadURL("file://" + __dirname + "/about.html");
    return win;
}
function createStockChartWindow(code) {
    var url = getStockChartUrl(code);
    var win = new electron.BrowserWindow({
        backgroundColor: "#fefefe",
        frame: true,
        modal: true,
        parent: mainWindow,
        show: true,
        width: 600,
        height: 400,
        resizable: true,
        title: "detail",
        icon: "console.png",
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.removeMenu();
    win.loadURL("file://" + __dirname + "/stockchart.html?url=" + encodeURIComponent(url));
    return win;
}
function createMainWindow() {
    var screenElectron = electron.screen;
    var mainScreen = screenElectron.getPrimaryDisplay();
    var w = parseInt(config.window.width);
    var h = parseInt(config.window.height);
    var win = new electron.BrowserWindow({
        backgroundColor: "#fefefe",
        frame: false,
        show: false,
        width: w,
        height: h,
        x: mainScreen.workArea.width - w,
        y: mainScreen.workArea.height - h,
        title: "stock watcher",
        icon: "console.png",
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadURL("file://" + __dirname + "/index.html");
    var iconPath = path.join(__dirname, "console.png");
    tray = new electron_1.Tray(iconPath);
    var contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: "Show",
            click: function () {
                showWindow();
            }
        },
        {
            label: "About",
            click: function () {
                var about = createAboutWindow();
                about.show();
            }
        },
        {
            label: "Quit",
            click: function () {
                quit();
            }
        }
    ]);
    tray.on("double-click", showWindow);
    tray.setToolTip("stock watcher");
    tray.setContextMenu(contextMenu);
    win.on('closed', function () {
        win = null;
        quit();
    });
    return win;
}
electron_1.app.on("window-all-closed", function () {
    quit();
});
electron_1.app.on("activate", function () {
    if (!mainWindow) {
        mainWindow = createMainWindow();
    }
});
function showWindow() {
    if (mainWindow) {
        if (!mainWindow.isVisible()) {
            mainWindow.show();
        }
        else {
            mainWindow.moveTop();
        }
    }
}
function toggleWindow() {
    if (mainWindow) {
        if (mainWindow.isFocused() && mainWindow.isVisible()) {
            mainWindow.hide();
            mainWindow.blur();
        }
        else {
            mainWindow.show();
            mainWindow.moveTop();
        }
    }
    else {
        showWindow();
    }
}
function quit() {
    electron_1.app.quit();
}
function getStockData(codeList) {
    return __awaiter(this, void 0, void 0, function () {
        var rn, url, converterStream;
        return __generator(this, function (_a) {
            rn = Math.floor(Math.random() * Math.floor(1000000));
            url = "http://hq.sinajs.cn/rn=" + rn + "&list=" + codeList;
            converterStream = iconv.decodeStream('gbk');
            return [2, new Promise(function (resolve) {
                    request(url).pipe(converterStream);
                    var str = '';
                    converterStream.on('data', function (chunk) { str += chunk; });
                    converterStream.on('end', function () {
                        resolve(str);
                    });
                })];
        });
    });
}
function sh_sz_info(dataArr) {
    var info = {};
    info['name'] = dataArr[0];
    info['open'] = parseFloat(dataArr[1]);
    info['close_yesterday'] = parseFloat(dataArr[2]);
    var priceInt = parseInt(dataArr[3]);
    var priceFloat = parseFloat(dataArr[3]);
    info['price'] = priceFloat;
    if (priceInt == 0) {
        info['price'] = info['close_yesterday'];
    }
    info['close'] = info['price'];
    info['high'] = parseFloat(dataArr[4]);
    info['low'] = parseFloat(dataArr[5]);
    info['amount'] = parseFloat(dataArr[9]) / 1000;
    if (info['close_yesterday'] > 0) {
        info['price_change'] = info['price'] - info['close_yesterday'];
        info['price_change_percent'] = (info['price'] - info['close_yesterday']) * 100 / info['close_yesterday'];
    }
    info['time'] = dataArr[31];
    return info;
}
function qihuo_info(dataArr) {
    var info = {};
    info['name'] = dataArr[0];
    info['open'] = parseFloat(dataArr[2]);
    info['high'] = parseFloat(dataArr[3]);
    info['low'] = parseFloat(dataArr[4]);
    info['close_yesterday'] = parseFloat(dataArr[10]);
    var priceInt = parseInt(dataArr[8]);
    var priceFloat = parseFloat(dataArr[8]);
    info['price'] = priceFloat;
    if (priceInt == 0) {
        info['price'] = info['close_yesterday'];
    }
    info['amount'] = parseFloat(dataArr[14]) / 1000;
    if (info['close_yesterday'] > 0) {
        info['price_change'] = info['price'] - info['close_yesterday'];
        info['price_change_percent'] = (info['price'] - info['close_yesterday']) * 100 / info['close_yesterday'];
    }
    info['time'] = '-';
    return info;
}
function hk_info(dataArr) {
    var info = {};
    info['name'] = dataArr[1];
    info['open'] = parseFloat(dataArr[2]);
    info['close_yesterday'] = parseFloat(dataArr[3]);
    var priceInt = parseInt(dataArr[6]);
    var priceFloat = parseFloat(dataArr[6]);
    info['price'] = priceFloat;
    if (priceInt == 0) {
        info['price'] = info['close_yesterday'];
    }
    info['close'] = info['price'];
    info['high'] = parseFloat(dataArr[4]);
    info['low'] = parseFloat(dataArr[5]);
    if (info['close_yesterday'] > 0) {
        info['price_change'] = info['price'] - info['close_yesterday'];
        info['price_change_percent'] = (info['price'] - info['close_yesterday']) * 100 / info['close_yesterday'];
    }
    info['time'] = dataArr[18];
    return info;
}
function forex_info(dataArr) {
    var info = {};
    info['name'] = dataArr[9];
    info['open'] = parseFloat(dataArr[5]);
    info['close_yesterday'] = parseFloat(dataArr[5]);
    var priceInt = parseInt(dataArr[1]);
    var priceFloat = parseFloat(dataArr[1]);
    info['price'] = priceFloat;
    if (priceInt == 0) {
        info['price'] = info['close_yesterday'];
    }
    info['close'] = info['price'];
    info['high'] = parseFloat(dataArr[6]);
    info['low'] = parseFloat(dataArr[7]);
    if (info['close_yesterday'] > 0) {
        info['price_change'] = info['price'] - info['close_yesterday'];
        info['price_change_percent'] = (info['price'] - info['close_yesterday']) * 100 / info['close_yesterday'];
    }
    info['time'] = dataArr[0];
    return info;
}
function refreshStockInfo() {
    return __awaiter(this, void 0, void 0, function () {
        var codeArr, code, codeList, sinaData, rePattern, match, hqData, info, _, code, dataStr, dataArr, stockType;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    codeArr = [];
                    for (code in config.hq) {
                        codeArr.push(code);
                    }
                    codeList = codeArr.join(',');
                    return [4, getStockData(codeList)];
                case 1:
                    sinaData = _a.sent();
                    rePattern = new RegExp(/var hq_str_(.*)="(.*)";/g);
                    hqData = [];
                    while (match = rePattern.exec(sinaData)) {
                        info = {};
                        _ = match[0], code = match[1], dataStr = match[2];
                        dataArr = dataStr.split(',');
                        stockType = code.slice(0, 2);
                        if (stockType == "sh" || stockType == "sz") {
                            info = sh_sz_info(dataArr);
                        }
                        else if (stockType == "hk" || code.slice(0, 5) == "rt_hk") {
                            info = hk_info(dataArr);
                        }
                        else if (code.slice(0, 6) == code && /^[A-Z]+$/.test(code)) {
                            info = forex_info(dataArr);
                        }
                        else {
                            info = qihuo_info(dataArr);
                        }
                        info['code'] = code;
                        if (code.slice(0, 5) == "rt_hk") {
                            info['code'] = code.slice(3);
                        }
                        hqData.push(info);
                    }
                    return [2, hqData];
            }
        });
    });
}
function getStockChartUrl(code) {
    var stockType = code.slice(0, 2);
    var imageUrl = '';
    var rn = Math.floor(Math.random() * Math.floor(1000000));
    if (stockType == 'sh' || stockType == 'sz') {
        imageUrl = "http://image.sinajs.cn/newchart/min/n/" + code + ".gif?" + rn;
    }
    else if (stockType == 'hk') {
        imageUrl = 'http://image.sinajs.cn/newchart/v5/hk_stock/min/${code.slice(2)}.gif?${rn}';
    }
    else if (code.slice(0, 5) == 'rt_hk') {
        imageUrl = 'http://image.sinajs.cn/newchart/v5/hk_stock/min/${code.slice(5)}.gif?${rn}';
    }
    else if (code.slice(0, 6) == code && /^[A-Z]+$/.test(code)) {
        imageUrl = 'http://image.sinajs.cn/newchart/v5/forex/min/${code}.gif?${rn}';
    }
    else {
        imageUrl = 'http://image.sinajs.cn/newchart/v5/futures/min/${code}.gif?${rn}';
    }
    return imageUrl;
}
ipc.on('update_stock_info', function (event, arg) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, refreshStockInfo()];
                case 1:
                    data = _a.sent();
                    event.reply('stock_info_latest', data);
                    return [2];
            }
        });
    });
});
ipc.on('show_stock_chart', function (event, code) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            createStockChartWindow(code);
            return [2];
        });
    });
});
