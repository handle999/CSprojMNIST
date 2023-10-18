// pages/logs/logs.js
const util = require('../../utils/util.js')

Page({
  data: {
      logs: [],
      avatarUrl: '/image/icon_home_HL.png', // 默认头像链接
      username: 'Name', // 默认用户名
      signature: 'Hello, World!', // 默认个性签名
  },
  
  onShow: function () {
      // 检查是否当前页面支持自定义选项卡栏，并且获取选项卡栏实例
      if (typeof this.getTabBar === 'function' &&
          this.getTabBar()) {
              // 输出日志，用于调试和确认代码是否执行
              console.log('设置选中项 1')
              // 通过选项卡栏实例的 setData 方法，设置选中的选项卡为索引 1
              this.getTabBar().setData({
                  selected: 1
              })
          }
  },

  onLoad() {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return {
          date: util.formatTime(new Date(log)),
          timeStamp: log
        }
      })
    })
  },

  changeAvatar: function() {
      // 实现更改头像的逻辑，例如上传新头像并更新this.data.avatarUrl
      const that = this; // 保存页面上下文

      wx.chooseMedia({
          mediaType: ['image'], // 选择图片
          sourceType: ['album', 'camera'], // 从相册或相机选择
          maxDuration: 10, // 最长选择时间，单位秒
          success: function (res) {
              const tempFilePath = res.tempFiles[0].tempFilePath; // 获取选择的临时文件路径

              // 调用微信上传图片的API
              wx.uploadFile({
                  url: 'https://example.com/upload', // 上传图片的服务器地址
                  filePath: tempFilePath,
                  name: 'file',
                  formData: {
                      'user': 'test'
                  },
                  success: function (uploadRes) {
                      // 上传成功后，更新this.data.avatarUrl
                      that.setData({
                          avatarUrl: uploadRes.data // 这里假设服务器返回新的头像链接
                      });
                  },
                  fail: function (uploadError) {
                      console.log('上传失败', uploadError);
                  }
              });
          },
          fail: function (chooseMediaError) {
            console.log('选择图片失败', chooseMediaError);
          }
      });
  },
  
  editProfile: function() {
    // 跳转到编辑个人信息页面，例如：
    wx.navigateTo({
      // url: '/pages/editProfile/editProfile',
    });
  }
})
