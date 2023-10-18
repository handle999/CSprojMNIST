// pages/index/index.js
// 获取应用实例
const app = getApp()

const MAX_V = 1; // 最大书写速度
const MIN_V = 0; // 最小书写速度
const MAX_LINE_WIDTH = 16; // 最大笔画宽度
const MIN_LINE_WIDTH = 4; // 最小笔画宽度
const MAX_LINE_DIFF = .03; // 两点之间笔画宽度最大差异
let context = null; // canvas上下文
let lastPoint = null; // 包含上一点笔画信息的对象

// pages/index/index.js

Page({
    data: {
        currentTab: 0,
        selectedImage: '',
        isDrawing: true,
        showResult: false, // 控制数字结果输出的显示状态
        numberResult: '', // 存储数字结果
        feedbackText: '', // 存储用户反馈的文本
    },

    onLoad: function () {
        this.touchInit();
    },

    onShow: function () {
        // 检查是否当前页面支持自定义选项卡栏，并且获取选项卡栏实例
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            // 输出日志，用于调试和确认代码是否执行
            console.log('设置选中项 0')
            // 通过选项卡栏实例的 setData 方法，设置选中的选项卡为索引 0（第一个选项卡）
            this.getTabBar().setData({
                selected: 0
            })
        }
    },

    // 切换div
    switchDiv(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ currentTab: parseInt(tab) });
        if (tab == 0) {
            this.touchInit();
        }
    },

    // 初始化画笔
    touchInit: function () {
        this.setData({ isDrawing: true });
        wx.createSelectorQuery()
            .select('#handwriting')
            .fields({ node: true, size: true })
            .exec((res) => {
                // 注意，这里一定要检查wxml里面canvas用的是什么，老版的canvas-id会报错，新版只需要用id区分即可
                res[0].node.width = res[0].width;
                res[0].node.height = res[0].height;
                context = res[0].node.getContext("2d")
            });
    },

    // 绘制路径
    touchMove: function (e) {
        this.setData({ isDrawing: true })
        let currPoint = {
            x: e.changedTouches[0].x, // X坐标
            y: e.changedTouches[0].y, // Y坐标
            t: new Date().getTime(), // 当前时间
            w: (MAX_LINE_WIDTH + MIN_LINE_WIDTH) / 2 /*默认宽度 */
        };
        if (lastPoint) {
            currPoint.w = this.calcLineWidth(currPoint); // 重新赋值宽度，覆盖默认值 
            context.beginPath();
            context.strokeStyle = '#000';
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = currPoint.w;
            context.moveTo(lastPoint.x, lastPoint.y);
            context.lineTo(currPoint.x, currPoint.y);
            context.stroke();
        }
        lastPoint = currPoint; // 结束前保存当前点为上一点
    },

    // 计算当前点的宽度，书写速度越快，笔画宽度越小，呈现出笔锋的感觉（笑）
    calcLineWidth: function (currPoint) {
        let consuming = currPoint.t - lastPoint.t; // 两点之间耗时
        if (!consuming) return lastPoint.w; // 如果当前点用时为0，返回上点的宽度。
        let maxWidth = Math.min(MAX_LINE_WIDTH, lastPoint.w * (1 + MAX_LINE_DIFF)); // 当前点的最大宽度
        let minWidth = Math.max(MIN_LINE_WIDTH, lastPoint.w * (1 - MAX_LINE_DIFF * 3)); // 当前点的最小宽度，变细时速度快所以宽度变化要稍快
        let distance = Math.sqrt(Math.pow(currPoint.x - lastPoint.x, 2) + Math.pow(currPoint.y - lastPoint.y, 2)); // 两点之间距离
        let speed = Math.max(Math.min(distance / consuming, MAX_V), MIN_V); /*当前点速度*/
        let lineWidth = Math.max(Math.min(MAX_LINE_WIDTH * (1 - speed / MAX_V), maxWidth), minWidth); /* 当前点宽度 */
        return lineWidth;
    },
    
    // 结束绘制
    touchEnd: function (e) {
        lastPoint = null;
    },

    // 清空手写内容
    touchClear: function () {
        this.setData({ 
            isDrawing: false,
            showResult: false, // 控制数字结果输出的显示状态
            numberResult: '', // 存储数字结果
        });
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    },
    
    // 提交手写内容
    submitHandwriting: function () {
        const res = context.canvas.toDataURL("image/png");
        const fsm = wx.getFileSystemManager();
        const FILE_BASE_NAME = "tmp_base64src_" + new Date().getTime();
        const filePath = `${wx.env.USER_DATA_PATH}/${FILE_BASE_NAME}.png`;
        fsm.writeFile({
            filePath,
            data: res.replace(/^data:image\/\w+;base64,/, ""),
            encoding: "base64",
            success: () => {
                console.log('生成图片成功', filePath);
                // 在这里执行手写数字识别的逻辑，获取结果
                const result = '识别的数字结果是' + 6; // 替换为实际的数字识别结果
                this.setData({
                    showResult: true,
                    numberResult: result,
                });
            },
            fail() {
                console.log("生成图片失败");
            },
        })
    },

    // 触发问题反馈弹窗
    showFeedbackDialog: function () {
        var that = this; // 用一个变量保存当前页面的上下文，应对success回调this上下文丢失
        wx.showModal({
            title: '问题反馈',
            editable: true,  // 启用输入框
            placeholderText: '请输入您的反馈信息',
            showCancel: true,
            confirmText: '提交',
            cancelText: '取消',
            success: function (res) {
                console.log(res.confirm)
                if (res.confirm) {
                    console.log(res.content)
                    if (res.content) {
                        // 处理反馈的提交逻辑，可以将 feedbackText 发送到服务器或进行其他操作
                        that.setData({
                            feedbackText: res.content,
                        });
                        console.log(that.data.feedbackText);
                        wx.showToast({
                            title: '感谢您的反馈',
                            icon: 'success',
                        });
                    }
                    else {
                        wx.showToast({
                            title: '无有效反馈信息提交',
                            icon: 'error',
                        });
                    }
                }
                else if (res.cancel) {
                    // 用户点击了取消按钮
                    wx.showToast({
                        title: '取消反馈',
                        icon: 'none',
                    });
                }
            },
        });
    },

    // 选择图片
    chooseImage() {
        wx.chooseMedia({
            mediaType: ['image'],
            sourceType: ['album'], // 或 'camera'，根据你的需求选择
            maxDuration: 60, // 可选，视频最大时长（仅在选择视频时有效）
            camera: 'back', // 可选，选择前置或后置摄像头（仅在选择视频时有效）
            success: (res) => {
                if (res.type === 'image') {
                    // 选择的是图片
                    const imagePath = res.tempFiles[0].tempFilePath;
                    this.setData({ selectedImage: imagePath });
                    console.log(res.tempFiles.tempFilePath)
                    console.log(res.tempFiles.size)
                }
                else {
                    // 选择的是视频
                    console.log('请选择图片而不是视频');
                }
            },
        });
    },

    // 提交选择的图片
    submitImage() {
        // 将选择的图片保存在当前文件夹下（以模拟为例）
        const imagePath = this.data.selectedImage;
        wx.saveFile({
            tempFilePath: imagePath,
            success: (res) => {
                console.log('提交的图片已保存：', res.savedFilePath);
                // 在这里执行手写数字识别的逻辑，获取结果
                const result = '识别的数字结果是' + 6; // 替换为实际的数字识别结果
                this.setData({
                    showResult: true,
                    numberResult: result,
                });
            },
            fail: (error) => {
                console.error('保存提交的图片失败：', error);
            },
        });
    },
    
    // 清空选择的图片
    clearImage() {
        this.setData({
            selectedImage: '',
            showResult: false,
            numberResult: '',
        });
    },
});
