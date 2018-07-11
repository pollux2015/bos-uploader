export const config = {
  platform: 1, // 1:百度 2:七牛
  token: '', //七牛云配置TOKEN
  base_dir: 'course1085/',
  server: 'http://uooc-test.gz.bcebos.com/',
  baiduConfig: { // 百度云配置
    bucket: 'uooc-test',
    endpoint: 'http://gz.bcebos.com',
    sessionToken: "MjUzZjQzNTY4OTE0NDRkNjg3N2E4YzJhZTc4YmU5ZDh8AAAAAFYCAADlROWIKR0NdfI874Ys1mDy/o5mBSNA32F30VTpvex+228h6LGjb7cnHfijKkbrgAz3DDMnPjMcxVmyVAiTnUInAWkUczapcLgJ4HcKPA4c6ztU8wj2z99+5WomLb89vOdXsb+e+NUo7zN7X/5b6EXOzqOR8649QoU7dHjbU5ijSKMZbr9wOFsvnVMEh9fte24cKNG74KBOYHHrTuFFzwwyr73HQdXrz1oSomZbaaXP0ah2xCpUsQcM8gQR4jNWsoxI8pWbMG1g4hvY/6+c+cRk6q+8NERjyu2IbnCldbHj8bcuAOH8SLHUXfSPkiKgJrLgrQom4/kAObfwTVlN8zAFADuaD4lfzlj/XcXsnXU1FKoeXm5DWlZv35ZQ8hpXowMTFfwe0IJwXTThE8Ezrz2I1r1LuNazIwxZ+Scx+fRRrAASo/MpGj2jTWLi3EMh5TKUbJ7/faMj75XgIgQ2idJ5",
    ak: 'e6f9fb15840711e886e3518df8bc5b09',
    sk: '82d338868b09450b8d70d9acedb7c59b'
  },

  prefix: 'document/', // 默认上传路径
  auto: true,
  uploadMax: 1, // 同时最大文件上传个数
  multiple: false, // 是否可以多选
  // 设置允许上传文件类型,
  // mimeLimit: 'video' [对应mimeVideo],
  // mimeLimit: 'image' [对应mimeImage],
  mimeLimit: '',
  mimeVideo: 'mp4', // 视频上传格式限制
  // mimeVideo: 'wmv|avi|dat|asf|rm|rmvb|ram|mpg|mpeg|3gp|mov|mp4|m4v|dvix|dv|dat|mkv|flv|f4v|vob|ram|qt|divx|cpk|fli|flc|mod', // 视频上传格式限制
  mimeImage: 'jpg|jpeg|gif|png', // 图片上传格式显示
  onprogerss: (res) => {
    // console.log('文件上传中')
  },
  ondone: (res) => {
    // console.log('单个文件上传完成')
  },
  oncomplete: (res) => {
    // console.log('全部上传完成')
  },
  onerror: (res) => {
    console.log('出现错误')
  },
  onabort: (res) => {
    // console.log('取消上传')
  },
};;
