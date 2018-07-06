export const config = {
  platform: 2, // 1:百度 2:七牛
  token: '', //七牛云配置TOKEN
  baiduConfig: { // 百度云配置
    bucket: '',
    endpoint: '',
    sessionToken: "",
    ak: '',
    sk: ''
  },
  base_dir: '',
  prefix: 'documents/', // 默认上传路径
  auto: true,
  uploadMax: 1, // 同时最大文件上传个数
  multiple: false, // 是否可以多选
  // 设置允许上传文件类型,
  // mimeLimit: 'video' [对应mimeVideo],
  // mimeLimit: 'image' [对应mimeImage],
  mimeLimit: '',
  mimeVideo: 'wmv|avi|dat|asf|rm|rmvb|ram|mpg|mpeg|3gp|mov|mp4|m4v|dvix|dv|dat|mkv|flv|f4v|vob|ram|qt|divx|cpk|fli|flc|mod', // 视频上传格式限制
  mimeImage: 'jpg|jpeg|gif|png', // 图片上传格式显示
  onprogerss: (res) => {
    console.log('文件上传中')
  },
  ondone: (res) => {
    console.log('单个文件上传完成')
  },
  oncomplete: (res) => {
    console.log('全部上传完成')
  },
  onerror: (res) => {
    console.log('出现错误')
  },
  onabort: (res) => {
    console.log('取消上传')
  },
};;
