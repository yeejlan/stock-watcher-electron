import electron = require("electron");
import {
	dialog,
	app,
	globalShortcut,
	Menu,
	Tray,
	clipboard
} from "electron";

import path = require("path");
import fs = require("fs");
import http = require('http');
import iconv = require('iconv-lite');
const request = require('request');
const ini = require('ini');
const ipc = electron.ipcMain;

const singleLock = app.requestSingleInstanceLock();
const config = ini.parse(fs.readFileSync(path.join(__dirname, "config.ini"), 'utf-8'));

let mainWindow: electron.BrowserWindow = null;
let tray: any = null;

app.on("second-instance", () => {
	if (mainWindow) {
		if (!mainWindow.isVisible()) mainWindow.show();
			else mainWindow.moveTop();
		}
});

if (!singleLock) {
  app.quit();
}

app.on("ready", () => {
	mainWindow = createMainWindow();
	showWindow();

	let hotkey = config.hotkey.modifier + '+' + config.hotkey.key
	globalShortcut.register(hotkey, () => {
		toggleWindow();
	})
});

function createAboutWindow() {
	let win = new electron.BrowserWindow({
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
	win.removeMenu()
	win.loadURL(`file://${__dirname}/about.html`);
	return win;
}

function createStockChartWindow(code: string) {
	let url = getStockChartUrl(code);
	let win = new electron.BrowserWindow({
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
	win.removeMenu()
	win.loadURL(`file://${__dirname}/stockchart.html?url=${encodeURIComponent(url)}`);
	return win;
}

function createMainWindow() {
	const screenElectron = electron.screen;
	let mainScreen = screenElectron.getPrimaryDisplay();

	let w = parseInt(config.window.width);
	let h = parseInt(config.window.height);
	let win = new electron.BrowserWindow({
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
	win.loadURL(`file://${__dirname}/index.html`);

	let iconPath = path.join(__dirname, "console.png");

	tray = new Tray(iconPath);

	const contextMenu = Menu.buildFromTemplate([
	{
		label: "Show",
		click: () => {
			showWindow();
		}
	},
	{
	label: "About",
		click: () => {
			let about = createAboutWindow();
			about.show();
		}
	},
	{
	label: "Quit",
		click: () => {
			quit();
		}
	}
	]);
	tray.on("double-click", showWindow);
	tray.setToolTip("stock watcher");
	tray.setContextMenu(contextMenu);

	win.on('closed', () => {
		win = null
		quit();
	})
	return win;
}

app.on("window-all-closed", () => {
	quit();
});

app.on("activate", () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

function showWindow() {
	if(mainWindow) {
		if(!mainWindow.isVisible()) {
			mainWindow.show();
		}else {
			mainWindow.moveTop();
		}
	}
}

function toggleWindow() {
	if(mainWindow) {
		if(mainWindow.isFocused() && mainWindow.isVisible()) {
			mainWindow.hide();
			mainWindow.blur();
		}else {
			mainWindow.show();
			mainWindow.moveTop();
		}
	}else{
		showWindow();
	}
}

function quit() {
	app.quit();
}

async function getStockData(codeList: String) {
	let rn = Math.floor(Math.random() * Math.floor(1000000));
	let url = `http://hq.sinajs.cn/rn=${rn}&list=${codeList}`;
	var converterStream = iconv.decodeStream('gbk');

	return new Promise((resolve: (result: string) => void) => {
		request(url).pipe(converterStream)
		let str: string = '';
		converterStream.on('data', (chunk: string) => { str += chunk; });
		converterStream.on('end', () => {
			resolve(str)
		})
	});
}

interface OneStock {
	[name: string]: any;
}

function sh_sz_info(dataArr: Array<string>): OneStock {
	let info: OneStock= {};
	info['name'] = dataArr[0];
	info['open'] = parseFloat(dataArr[1]);
	info['close_yesterday'] = parseFloat(dataArr[2]);
	let priceInt = parseInt(dataArr[3]);
	let priceFloat = parseFloat(dataArr[3]);

	info['price'] = priceFloat
	if(priceInt == 0){
		info['price'] = info['close_yesterday']
	}

	info['close'] = info['price']
	info['high'] = parseFloat(dataArr[4])
	info['low'] = parseFloat(dataArr[5])
	info['amount'] = parseFloat(dataArr[9])/1000
	if (info['close_yesterday'] > 0){
		info['price_change'] = info['price']-info['close_yesterday']
		info['price_change_percent'] = (info['price']-info['close_yesterday'])*100/info['close_yesterday']
	}

	info['time'] = dataArr[31]

	return info
}

function qihuo_info(dataArr: Array<string>): OneStock {
	let info: OneStock= {};
	info['name'] = dataArr[0]
	info['open'] = parseFloat(dataArr[2])
	info['high'] = parseFloat(dataArr[3])
	info['low'] = parseFloat(dataArr[4])
	info['close_yesterday'] = parseFloat(dataArr[10])

	let priceInt = parseInt(dataArr[8]);
	let priceFloat = parseFloat(dataArr[8]);

	info['price'] = priceFloat
	if(priceInt == 0){
		info['price'] = info['close_yesterday']
	}

	info['amount'] = parseFloat(dataArr[14])/1000

	if(info['close_yesterday'] > 0){
		info['price_change'] = info['price']-info['close_yesterday']
		info['price_change_percent'] = (info['price']-info['close_yesterday'])*100/info['close_yesterday']
	}

	info['time'] = '-'

	return info
}

function hk_info(dataArr: Array<string>): OneStock {
	let info: OneStock= {};
	info['name'] = dataArr[1]
	info['open'] = parseFloat(dataArr[2])
	info['close_yesterday'] = parseFloat(dataArr[3])

	let priceInt = parseInt(dataArr[6]);
	let priceFloat = parseFloat(dataArr[6]);

	info['price'] = priceFloat
	if(priceInt == 0){
		info['price'] = info['close_yesterday']
	}

	info['close'] = info['price']
	info['high'] = parseFloat(dataArr[4])
	info['low'] = parseFloat(dataArr[5]) 
	if(info['close_yesterday'] > 0) {
		info['price_change'] = info['price']-info['close_yesterday']
		info['price_change_percent'] = (info['price']-info['close_yesterday'])*100/info['close_yesterday']
	}
	info['time'] = dataArr[18]

	return info
}

function forex_info(dataArr: Array<string>): OneStock {
	let info: OneStock= {};
	info['name'] = dataArr[9]
	info['open'] = parseFloat(dataArr[5])
	info['close_yesterday'] = parseFloat(dataArr[5])
	let priceInt = parseInt(dataArr[1]);
	let priceFloat = parseFloat(dataArr[1]);

	info['price'] = priceFloat
	if(priceInt == 0){
		info['price'] = info['close_yesterday']
	}

	info['close'] = info['price']
	info['high'] = parseFloat(dataArr[6])
	info['low'] = parseFloat(dataArr[7])
	if(info['close_yesterday'] > 0) {
		info['price_change'] = info['price']-info['close_yesterday']
		info['price_change_percent'] = (info['price']-info['close_yesterday'])*100/info['close_yesterday']
	}

	info['time'] = dataArr[0]
	return info
}

async function refreshStockInfo() {
	let codeArr: Array<string> = []; 
	for(let code in config.hq) {
		codeArr.push(code)
	}
	let codeList = codeArr.join(',');
	let sinaData = await getStockData(codeList)
	let rePattern = new RegExp(/var hq_str_(.*)="(.*)";/g);
	let match: any;
	let hqData: Array<OneStock> = [];
	while (match = rePattern.exec(sinaData)) {
		let info: OneStock= {};
		let [_, code, dataStr] = match;
		let dataArr = dataStr.split(',');
		let stockType = code.slice(0, 2);
		if(stockType == "sh" || stockType == "sz" ) {
			info = sh_sz_info(dataArr);
		}else if(stockType == "hk" || code.slice(0, 5) == "rt_hk") {
			info = hk_info(dataArr);
		}else if(code.slice(0, 6) == code && /^[A-Z]+$/.test(code)) {
			info = forex_info(dataArr);
		}else{
			info = qihuo_info(dataArr);
		}
		info['code'] = code
		if(code.slice(0, 5) == "rt_hk") {
			info['code'] = code.slice(3)
		}
		hqData.push(info);
	}
	return hqData;
}

function getStockChartUrl(code: string) {
	let stockType = code.slice(0, 2);
	let imageUrl = '';
	let rn = Math.floor(Math.random() * Math.floor(1000000));
	if(stockType == 'sh' || stockType == 'sz') {
		imageUrl = `http://image.sinajs.cn/newchart/min/n/${code}.gif?${rn}`
	}else if(stockType == 'hk') {
		imageUrl = 'http://image.sinajs.cn/newchart/v5/hk_stock/min/${code.slice(2)}.gif?${rn}'
	}else if(code.slice(0, 5) == 'rt_hk') {
		imageUrl = 'http://image.sinajs.cn/newchart/v5/hk_stock/min/${code.slice(5)}.gif?${rn}'
	}else if(code.slice(0, 6) == code && /^[A-Z]+$/.test(code)) {
		imageUrl = 'http://image.sinajs.cn/newchart/v5/forex/min/${code}.gif?${rn}'
	}else{
		imageUrl = 'http://image.sinajs.cn/newchart/v5/futures/min/${code}.gif?${rn}'
	}
	return imageUrl
}

ipc.on('update_stock_info', async function(event, arg) {
	let data = await refreshStockInfo();
	event.reply('stock_info_latest', data);
});

ipc.on('show_stock_chart', async function(event, code) {
	createStockChartWindow(code);
});