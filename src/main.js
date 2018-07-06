// 默认参数
import {
  config
} from './config';
import * as qiniu from 'qiniu-js';
import async from 'async';
import ss from 'becsdk';
console.log(ss)

// 上传文件
class upload {
  constructor(params) {
    this.fliesStore = []; // 验证通过文件
    this.filesValidError = []; // 验证失败文件
    this.countFiles = 0; // 验证通过的文件
    this.countFilesLoad = 0; // 正在上传的文件大小
    this.countFilesLoaded = 0; // 已完成上传

    // extends config
    this.config = this.extends(config, params);

    // 添加文本域
    this.crateFile(this.config.multiple);
  }

  // extends
  extends(target, source) {
    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        target[p] = source[p];
      }
    }
    return target;
  }

  // 验证名称是否包含特殊符号
  validName(fileName) {
    let fname = fileName.replace(/(.*\/)*([^.]+).*/ig, "$2");
    let regEx = /[\~\!\/\#\$\%\^\*\=\+\\\|\[\{\}\]\;\:\'\"\<\>\/\?]+/ig;
    return !regEx.test(fname);
  }

  // 验证文件类型
  validMineType(fileName) {
    const configMineLimit = this.config.mimeLimit;
    const currentMimeLimit = configMineLimit === 'video' ? this.config['mimeVideo'] : configMineLimit === 'image' ? this.config['mimeImage'] : configMineLimit;
    this.config.currentMimeLimit = currentMimeLimit;
    return currentMimeLimit ? (eval(`/${currentMimeLimit}$/i`).test(fileName)) : true;
  }

  /**
   * 添加文本域file
   * @param {String} multiple 是否可以多选
   */
  crateFile(multiple) {
    let fileEl = document.createElement('input');
    this.fileId = `fid_${new Date().getTime()}`;
    fileEl.setAttribute('type', 'file');
    fileEl.setAttribute('id', this.fileId);
    fileEl.setAttribute('style', "display: none;");
    multiple && fileEl.setAttribute('multiple', 'multiple');
    this.fileEl = fileEl;
    document.body.appendChild(this.fileEl);
    this.bindFile(fileEl);
  }

  chooseFile() {
    this.fileEl.click();
  }

  // 创建file, 绑定change事件
  bindFile() {

    let fileEl = this.fileEl;

    // 监听文件变化
    fileEl.onchange = e => {
      const fileList = fileEl.files;
      const fileNoPassValid = []; // 未通过验证

      // 遍历所选文件
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fileName = file.name;

        // 验证是否含有特殊字符 且 符合当前格式要求
        const validName = this.validName(fileName);
        const validMineType = this.validMineType(fileName);
        const isValid = this.validName(fileName) && this.validMineType(fileName);

        // 验证成功或失败提示信息
        const validMsg = isValid ? '通过验证' : !validName ? '文件名包含特殊字符' : !validMineType ? `文件格式仅能为: ${this.config.currentMimeLimit.replace(/\|/ig, ',')}` : '验证失败';

        /**
         * 创建新的file对象

         * 添加文件上传状态及验证状态,
         */
        let nfile = this.newFileObj(isValid, file, validMsg);

        // 存储nfile对象
        isValid ? this.addFile(nfile) : fileNoPassValid.push(nfile);

        // 绑定上传(upload)与取消(abort)事件
        this.bindUpload(nfile);
      }

      this.config.auto && this.start();
      // 每次选择文件, 清空验证失败文件store
      this.filesValidError = fileNoPassValid;
      this.fileEl.value = '';
    };
  }

  addFile(nfile) {
    nfile.findex = this.fliesStore.length; // 当前文件索引
    this.setLoadStatus(nfile, 0);
    this.fliesStore.push(nfile);
  }

  /**
   * 创建一个包含file对象的新对象
   * @param {Boolen} isValid
   * @param {Blob} file
   * @param {String} msg
   */
  newFileObj(isValid, file, msg) {
    const fileName = file.name;
    return {
      file,
      name: fileName,
      valid: isValid, // 是否验证通过
      message: msg // 文件验证信息
    }
  }

  /**
   * 设置文件上传状态
   * @param {Blob} nfile 包含file的新对象
   * @param {Number} state 0: 未上传, 1: 上传中, 2: 已取消, 3:上传完成, 4: '上传失败'
   */
  setLoadStatus(nfile, state, params) {
    const statusConfig = {
      '0': '未上传',
      '1': '上传中',
      '2': '已取消',
      '3': '上传完成',
      '4': '上传失败'
    }

    nfile.status = state;
    nfile.statusMsg = statusConfig[state];

    switch (state) {
      case 0: // 未上传
        this.countFiles++;
        this.setFileDes(nfile);
        this.config.onadd && this.config.onadd({
          store: this.fliesStore,
          file: nfile
        });
        break;

      case 1: // 上传中
        if (!nfile.hascount) {
          this.countFilesLoad++;
          nfile.hascount = true;
        }

        this.setFileDes(nfile, params);
        this.config.onprogerss && this.config.onprogerss({
          store: this.fliesStore,
          file: nfile,
          res: params
        });
        break;

      case 2: // 已取消
        this.countFilesLoad--;
        this.setFileDes(nfile);
        this.config.onabort && this.config.onabort({
          store: this.fliesStore,
          file: nfile
        });
        break;

      case 3: // 上传完成

        // 计算完成文件数量设置状态
        this.countFilesLoad--;
        this.countFilesLoaded++;
        this.setFileDes(nfile, {
          progress: 1
        });

        // 绑定完成时间
        this.config.ondone && this.config.ondone({
          store: this.fliesStore,
          file: nfile
        });

        // 自动下一个文件的上传
        this.uploadNext(nfile.findex);
        break;

      case 4: // 上传失败
        this.countFilesLoad--;
        this.config.onerror && this.config.onerror({
          store: this.fliesStore,
          file: nfile,
          error: params
        });

        // 自动下一个文件的上传
        this.uploadNext(nfile.findex);
        break;
    }
  }

  // 设置nfile文件相关参数
  setFileDes(nfile, params = {}) {
    nfile.size = params.total || nfile.file.size || 0;
    nfile.loaded = params.progress == 1 ? nfile.size : (params.loaded || 0);
    nfile.progress = params.progress || (nfile.fsize / nfile.loaded) || 0;
    nfile.precent = nfile.progress * 100 || 0;
  }

  /**
   * file对象绑定upload方法与abort方法
   */
  bindUpload(nfile) {
    this.config.platform == 1 ? this.bindBaiduUpload(nfile) : this.bindQiniuUpload(nfile);
  }

  // 开始上传
  start() {
    for (let i = 0; i < this.config.uploadMax; i++) {
      this.uploadNext(i)
    }
  }

  // 上传下一个文件
  uploadNext(currentUploadIndex) {
    // 如果还有文件为上传完且
    // 正在上传文件小于最大同时上传文件数
    if (this.countFiles > this.countFilesLoaded && this.countFilesLoad < this.config.uploadMax) {
      this.getNextFile(currentUploadIndex);
    }

    if (this.countFiles == this.countFilesLoaded) {
      this.config.oncomplete && this.config.oncomplete({
        store: this.fliesStore,
        finished: true
      });
    }
  }

  // 获取下一个需要上传的文件并上传
  getNextFile(currentUploadIndex = 0) {
    let nextFile = null;
    for (let i = currentUploadIndex; i < this.fliesStore.length; i++) {
      let curFile = this.fliesStore[i];
      if (curFile.status == 0) {
        nextFile = curFile;
        break;
      }
    }
    nextFile && nextFile.upload && nextFile.upload();
  }

  // 七牛上传
  bindQiniuUpload(nfile) {
    const key = this.config.base_dir + this.config.prefix + nfile.name
    let observable = qiniu.upload(nfile.file, key, this.config.token);

    // 未开始上传取消则标记状态为已取消
    nfile.abort = () => {
      if (nfile.status == 0) {
        nfile.status = 2;
      }
    }

    // 给file绑定upload 方法
    nfile.upload = () => {
      let subscription = observable.subscribe({
        next: (res) => {
          this.setLoadStatus(nfile, 1, res.total); // 状态为上传中
        },
        complete: (res) => {
          nfile.abort = null; // 移除abort方法
          this.setLoadStatus(nfile, 3); // 状态为已完成
        },
        error: (err) => {
          this.setLoadStatus(nfile, 4, err); // 状态为上传失败
        },
      });

      nfile.abort = () => {
        this.setLoadStatus(nfile, 2); // 状态为已取消
        subscription.unsubscribe();
      }
    }
  }

  // 百度上传
  bindBaiduUpload(nfile) {
    const baiduConfig = this.config.baiduConfig;

    // 百度BOS 相关配置
    let baiduClientConfig = {
      endpoint: baiduConfig.endpoint, //传入Bucket所在区域域名
      credentials: {
        ak: baiduConfig.ak, //您的AccessKey
        sk: baiduConfig.sk //您的SecretAccessKey
      },
      sessionToken: baiduConfig.sessionToken
    };
    const bucket = baiduConfig.bucket;
    const key = this.config.base_dir + this.config.prefix + nfile.name;
    const baidubceSdk = baidubce.sdk;
    const BAIDU_PART_SIZE = 4 * 1024 * 1024; // 分块大小

    // new clinet
    let client = new baidubceSdk.BosClient(baiduClientConfig);

    // 因为Firefox兼容性的一个问题，如果上传的文件是 text/*** 类型，Firefox 会自动添加 charset=utf-8 因此我们给 options 设置 Content-Type 的时候，需要手工加上 charset=utf-8，否则会导致浏览器计算的签名跟服务器计算的签名不一致，导致上传失败
    let ext = nfile.name.split(/\./g).pop();
    let mimeType = baidubceSdk.MimeType.guess(ext);
    if (/^text\//.test(mimeType)) {
      mimeType += '; charset=UTF-8';
    }
    let options = {
      'Content-Type': mimeType
    }

    // 监听上传进度
    client.on('progress', (res) => {
      this.setLoadStatus(nfile, 1, {
        total: res.total,
        loaded: res.loaded
      }); // 状态为上传中
    })

    // 未开始上传则标记为已取消
    nfile.abort = () => {
      if (nfile.status == 0) {
        nfile.status = 2;
      } else { // 已开始则调用abort
        client.abortMultipartUpload();
      }
    }

    if (nfile.size > BAIDU_PART_SIZE) { // 分片上传
      this.baiduMultipartUpload(nfile, client, bucket, key, options, BAIDU_PART_SIZE)
    } else {
      this.baiduNormalUpload(nfile, client, bucket, key, options);
    }
  }

  // 正常上传
  baiduNormalUpload(nfile, client, bucket, key, options) {
    // 给file绑定upload 方法
    nfile.upload = () => {
      client.putObjectFromBlob(bucket, key, nfile.file, options)
        .then(res => {
          this.setLoadStatus(nfile, 3); // 状态为已完成
        })
        .catch(error => {
          this.setLoadStatus(nfile, 4, error); // 状态为上传失败
        });
    }
  }

  // 分片上传
  baiduMultipartUpload(nfile, client, bucket, key, options, partSize) {
    let uploadId;
    nfile.upload = () => {
      client.initiateMultipartUpload(bucket, key, options)
        .then((response) => {
          uploadId = response.body.uploadId; // 开始上传，获取服务器生成的uploadId

          let deferred = baidubce.sdk.Q.defer();
          let tasks = this.baiduGetTasks(nfile.file, uploadId, bucket, key, partSize);
          let state = {
            lengthComputable: true,
            loaded: 0,
            total: tasks.length
          };

          // 为了管理分块上传，使用了async（https://github.com/caolan/async）库来进行异步处理
          let THREADS = 3; // 同时上传的分块数量
          async.mapLimit(tasks, THREADS, this.baiduUploadPartFile(state, client), (err, results) => {
            if (err) {
              deferred.reject(err);
            } else {
              deferred.resolve(results);
            }
          });
          return deferred.promise;
        })
        .then((allResponse) => {
          let partList = [];
          allResponse.forEach((response, index) => {
            // 生成分块清单
            partList.push({
              partNumber: index + 1,
              eTag: response.http_headers.etag
            });
          });
          return client.completeMultipartUpload(bucket, key, uploadId, partList); // 完成上传
        })
        .then(res => {
          this.setLoadStatus(nfile, 3); // 状态为已完成
        })
        .catch(error => {
          this.setLoadStatus(nfile, 4, error); // 状态为上传失败
        });
    }
  }

  // 文件分块
  baiduGetTasks(file, uploadId, bucketName, key, pSize) {
    let leftSize = file.size;
    let offset = 0;
    let partNumber = 1;

    let tasks = [];

    while (leftSize > 0) {
      let partSize = Math.min(leftSize, pSize);
      tasks.push({
        file: file,
        uploadId: uploadId,
        bucketName: bucketName,
        key: key,
        partNumber: partNumber,
        partSize: partSize,
        start: offset,
        stop: offset + partSize - 1
      });

      leftSize -= partSize;
      offset += partSize;
      partNumber += 1;
    }
    return tasks;
  }

  // 分片上传
  baiduUploadPartFile(state, client) {
    return (task, callback) => {
      let blob = task.file.slice(task.start, task.stop + 1);
      client.uploadPartFromBlob(task.bucketName, task.key, task.uploadId, task.partNumber, task.partSize, blob)
        .then((res) => {
          ++state.loaded;
          callback(null, res);
        })
        .catch((err) => {
          callback(err);
        });
    };
  }
}

export {
  upload
};
