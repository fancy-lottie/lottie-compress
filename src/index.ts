import * as fs from 'fs';
import * as imagemin from 'imagemin';
import * as imageminPngquant from 'imagemin-pngquant';
// import * as path from 'path';
// import { mkdirp, rimraf } from 'mz-modules';
// import { write as awaitWriteStream } from 'await-stream-ready';
// import streamTobuffer from 'stream-to-buf';
// const awaitWriteStream = require('await-stream-ready').write;

interface ILottieCompress {
  lottieJson: any;
  options?: any;
}

class LottieCompress {

  public lottieJson: any;
  public options: any;
  constructor(params: ILottieCompress) {
    this.lottieJson = params.lottieJson || {
      error: '初始化失败',
    };
    this.options = {
      quality: '75-90',
      ...params.options,
    };
  }

  /**
   * execute
   */
  public async execute() {
    await this.miniBase64();
    return this.getMiniAttr();
  }
  /**
   * Lottie file compression base64 resource files
   * @param lottieFile lottieFile
   * @param options options config
   */
  public async miniBase64() {
    const assetsPromise = this.lottieJson.assets.map(async asset => {
      if (!asset.u && !asset.p) { return asset; }

      let imageData: any = null;
      let extname: string = 'png';
      const imagestring = asset.p;
      if (imagestring.includes('base64,')) {
        // 图片是 base64 格式
        const base64str = imagestring.slice(imagestring.indexOf('base64,') + 7);
        extname = imagestring.slice(imagestring.indexOf('data:image/') + 11, imagestring.indexOf(';base64'));
        imageData = Buffer.from(base64str, 'base64');
      } else if (/^((https?):\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(imagestring)) {
        return asset; // 远程访问 暂时不对远程访问的路径做压缩
      } else {
        return asset; // 相对路径 (zip类型才会走这个逻辑)
      }

      const newBuf: any = await imagemin.buffer(imageData, {
        plugins: [
          imageminPngquant({ quality: this.options.quality }),
        ],
      });

      return {
        ...asset,
        e: 1,
        u: '',
        p: 'data:image/' + extname + ';base64,' + newBuf.toString('base64'),
      };
    });

    const assets = await Promise.all(assetsPromise);
    this.lottieJson.assets = assets;
    return this.lottieJson;
  }

  /**
   * 压缩文件中的冗余字符/属性
   * @param {*} data lottie.json
   * @return {*} new data lottie.json
   */
  public getMiniAttr() {
    let miniFile = JSON.parse(JSON.stringify(this.lottieJson));
    miniFile.tiny = '75'; // 给文件打哥标，证明是压缩过的，并且写入压缩比例
    miniFile.fr = Math.round(miniFile.fr); // 部分lottie文件导出的bug 作为工具也得清洗
    miniFile.op = Math.round(miniFile.op); // 部分lottie文件导出的bug 作为工具也得清洗
    miniFile = this.attrZip(miniFile, ['nm']); // 缩短属性值
    miniFile = this.attrEqualZip(miniFile, 'id:refId'); // 缩短关联属性值
    miniFile = this.attrMiniNumber(miniFile, ['t', 'sr', 'to', 'ti', 'color', 'ip', 'op', 'st', 's', 'e']); // 缩小属性精度
    miniFile = this.deleteAttr(miniFile, ['n', 'mn']); // 删除属性
    miniFile = this.combNumber(miniFile); // 数字类型的相近值合并，该压缩建议开放高级配置，不做默认
    return miniFile;
  }

  /**
   * 单个base64的图片压缩
   * @param {string} stream base64的图片
   * @param {string} fileds .quality压缩比例
   * @return {string} 压缩以后的图片
   */
  public async tinybase64(stream, fileds) {
    const bufferString = await this.getStream(stream);
    const _bufferString = bufferString.toString();
    const base64str = _bufferString.slice(_bufferString.indexOf('base64,') + 7);
    const imageData = new Buffer(base64str, 'base64');
    const newBuf: any = await imagemin.buffer(imageData, {
      plugins: [
        imageminPngquant({ quality: this.options.quality }),
      ],
    });
    return newBuf;
  }

  public async getJsonStream(stream) {
    const data = await this.getStream(stream);
    try {
      return JSON.parse(data.toString());
    } catch (e) {
      return {
        success: false,
        error: '文件解析错误',
      };
    }
  }

  public async getStream(stream) {
    return await new Promise((resolve) => {
      let data: string = ''; // 创建一个buffer用于存储读取完的信息
      const buffers: any[] = []; // 创建一个数组，用于存储每一个流读取的信息
      let nread = 0; // 用于记录读取全部内容的长度
      stream.on('data', chuck => { // 给stream绑定data事件，用于按流读取文件内容
        buffers.push(chuck); // 把读取到的buffer存入数组中
        nread += chuck.length; // 记录读取文件全部内容的buffer长度
      }).on('end', () => {  // 文件全部读取完，执行end事件，用于对读取的数据进行处理
        let buffer;
        switch (buffers.length) {
          case 0:
            buffer = new Buffer(0);
            break;
          case 1:
            buffer = buffers[0];
            break;
          default:
            buffer = new Buffer(nread);  // 创建nread长度的buffer，用于存储最终的内容buffer
            for (let i = 0, pos = 0; i < buffers.length; i++) {  // 循环遍历每个装片段buffer的数组
              const chunk = buffers[i];
              chunk.copy(buffer, pos);  // 把每段buffer片段，copy到新建buffer的对应位置
              pos += chunk.length;
            }
            break;
        }
        data += buffer.toString(); // 把buffer转换为需要的String类型
        // 使用回调函数是因为读取文件是异步的，只有等文件全部读取完，才能对其内容进行操作
        resolve(data.toString());
      });
    });
  }

  /**
   * 10进制转化到64进制
   * @param {number} number 10进制数值
   * @return {string} 64进制
   */
  public _string10to62(number: number) {
    const chars: string[] = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    const radix: number = chars.length;
    const arr: string[] = [];
    let qutient: number = +number;
    do {
      const mod: number = qutient % radix;
      qutient = (qutient - mod) / radix;
      arr.unshift(chars[mod]);
    } while (qutient);
    return arr.join('');
  }

  /**
   * 简单循环
   * @param {object} obj lottie.json.items
   * @return {Array} 数组
   */
  public _loops(obj: any) {
    const list: string[] = [];
    for (const i in obj) {
      if (i) {
        list.push(i);
      }
    }
    return list;
  }

  /**
   * 循环剥离
   * @param {object} obj lottie.json
   * @param {Array} attrNames 需要剥离的属性
   * @return {object} 循环剥离
   */
  public _loopsAttr(obj, attrNames) {
    const req = {};
    const innerLoops = (innerObj) => {
      const list = this._loops(innerObj);
      (list || []).forEach(attr => {
        if (attrNames.indexOf(attr) !== -1) {
          if (!req[attr]) {
            req[attr] = [innerObj[attr]];
          } else {
            req[attr].push(innerObj[attr]);
          }
        }
        if (typeof innerObj[attr] !== 'string') {
          innerLoops(innerObj[attr]);
        }
      });
    };
    innerLoops(obj);
    return req;
  }

  /**
   * 获取特定属性的值列表
   * @param {object} obj 对象
   * @param {Array} attrNames 属性名
   * @return {object} 清洗以后的数组对象
   */
  public _getMinAttrList(obj, attrNames) {
    const req = this._loopsAttr(obj, attrNames);
    for (const itemList in req) {
      if (itemList) {
        req[itemList] = Array.from(new Set(req[itemList]));
      }
    }
    return req;
  }

  /**
   * 构建需要重新赋值的对象
   * @param {object} obj lottie.json
   * @param {Array} attrNames 属性名
   * @return {object} 清洗以后的对象
   */
  public _getValueMap(obj, attrNames) {
    const resultobj = {};
    const attrKeyObj = this._getMinAttrList(obj, attrNames);
    for (const itemList in attrKeyObj) {
      if (itemList) {
        const _obj = {};
        attrKeyObj[itemList].forEach((item, index) => {
          _obj[item] = this._string10to62(index);
        });
        resultobj[itemList] = _obj;
      }
    }
    return resultobj;
  }

  /**
   * 浮点数字保留小数点后n位(四舍五入)
   * @param {number} num 数字
   * @param {number} n 位数
   * @return {number} 返回截取以后的数值
   */
  public _cutNumber(num, n?) {
    // 如果不是数字则立即返回原值
    if (typeof num !== 'number') { return num; }
    return Number(num.toFixed(n || 3));
  }

  /**
   * 颜色的保留值，保证数值尽可能是统一的rgb。
   * @param {number} num 数字
   * @return {number} 返回截取以后的数值
   */
  public _cutColorNumber(num) {
    // 如果不是数字则立即返回原值
    if (typeof num !== 'number') { return num; }
    return Number((Math.round(num * 255) / 255).toFixed(3));
  }

  /**
   * 更换指定属性的内容
   * @param {object} obj lottie.json
   * @param {Array} attrNames 属性名
   * @param {*} value 赋值，默认是undefined(删除)
   * @return {object} 结果
   */
  public _resetAttr(obj, attrNames, value?: object) {
    const innerLoops = (innerObj) => {
      const list = this._loops(innerObj);
      (list || []).forEach(attr => {
        if (attrNames.indexOf(attr) !== -1) {
          switch (typeof value) {
            case 'undefined': delete innerObj[attr]; break; // 为空则删除属性
            case 'object':
              innerObj[attr] = value && value[attr][innerObj[attr]]; // 替换为map中的值, 目前通常用的是这个
              break;
            default: innerObj[attr] = value; break; // 直接替换值
          }
        }
        if (typeof innerObj[attr] !== 'string') {
          innerLoops(innerObj[attr]);
        }
      });
    };
    innerLoops(obj);
    return obj;
  }

  /**
   * 浮点类型的缩短字节数
   * @param {object} obj lottie.json
   * @param {Array} attrNames 属性名
   * @param {Number} cut 保留小数点后几位 5为保留小数点后三位
   * @return {object} 结果
   */
  public _resetToTi(obj, attrNames) {
    const isColor = attrNames.indexOf('color') !== -1; // 颜色的类型压缩比较特别
    if (isColor) {
      attrNames.splice(attrNames.indexOf('color'), 1);
    }

    const innerLoops = (innerObj: any, parentAttr: string): void => {
      const list = this._loops(innerObj);
      (list || []).forEach(attr => {
        const innerItem = innerObj[attr];
        if (isColor && attr === 'k') {
          // 对所有颜色的属性进行剥离
          if (parentAttr === 'c' || parentAttr === 'v' && Array.isArray(innerItem)) {
            innerObj[attr] = innerItem.map(item => {
              return this._cutColorNumber(item);
            });
          }
        }
        if (attrNames.indexOf(attr) !== -1) {
          // 数字类型和数字数组类型都支持
          if (innerItem && (Array.isArray(innerItem) || typeof innerItem === 'number')) {
            innerObj[attr] = typeof innerItem === 'number' ?
              this._cutNumber(innerItem)
              :
              innerItem.length && innerItem.map(item => {
                if (innerItem.length === 4) {
                  return this._cutColorNumber(item);
                }
                return this._cutNumber(item);
              });
          }
        }
        if (typeof innerObj[attr] !== 'string') {
          innerLoops(innerObj[attr], attr);
        }
      });
    };
    innerLoops(obj, '');
    return obj;
  }

  /**
   * 数字合并,数字的近似位压缩
   * @param {object} obj lottie.json
   * @return {object} 结果
   */
  public combNumber(obj) {
    const numberList: number[] = [];

    // 递归抽取数字类型
    const innerLoops = (innerObj: any, map: any): void => {
      const list = this._loops(innerObj);
      (list || []).forEach(attr => {
        const innerItem = innerObj[attr];
        if (typeof innerItem === 'number') {
          if (map) {
            if (map[innerItem]) {
              innerObj[attr] = map[innerItem];
            }
          } else {
            numberList.push(innerItem);
          }
        }
        if (typeof innerItem !== 'string') {
          innerLoops(innerItem, map);
        }
      });
    };
    innerLoops(obj, undefined);
    // 数组去重
    const tmpObj: object = {};
    const result: number[] = [];
    numberList.forEach((a) => {
      const key = (typeof a) + a;
      if (!tmpObj[key]) {
        tmpObj[key] = true;
        result.push(a);
      }
    });
    // 数组排序
    result.sort((a, b) => {
      return Number(a) - Number(b);
    });
    // 数组抽取相近值列表
    const diffArray: any[] = [];
    let t = 0;
    result.forEach((num, index, arr) => {
      if (arr[index + 1] && (arr[index + 1] - num).toFixed(3) === '0.001') {
        diffArray[t] ? diffArray[t].push(num) : diffArray[t] = [num];
      } else {
        if (arr[index - 1] && (num - arr[index - 1]).toFixed(3) === '0.001') {
          diffArray[t] ? diffArray[t].push(num) : diffArray[t] = [num];
          t++;
        }
      }
    });
    // 构造匹配表
    const map: object = {};
    diffArray.forEach(item => {
      item.forEach((num, index, arr) => {
        if (index % 2 === 1) {
          const preNum = arr[index - 1];
          if (num.toString().length <= preNum.toString().length) {
            map[preNum] = num;
          } else {
            map[num] = preNum;
          }
        }
      });
    });
    innerLoops(obj, map);
    return obj;
  }

  /**
   * 属性值的压缩
   * @param {object} obj lottie.json
   * @param {Array} attrNames 属性名
   * @return {object} returnobj lottie.json
   */
  public attrZip(obj, attrNames) {
    const resultobj = this._resetAttr(obj, attrNames, this._getValueMap(obj, attrNames));
    return resultobj;
  }

  /**
   * 关联性属性值的压缩
   * @param {object} obj lottie.json
   * @param {Array} attrNames 属性名
   * @return {object} returnobj lottie.json
   */
  public attrEqualZip(obj, attrNames) {
    if (!(typeof attrNames === 'string' && attrNames.split(':')[1])) { return obj; }
    const equlAttrs = attrNames.split(':');
    const map = this._getValueMap(obj, equlAttrs[0]);
    map[equlAttrs[1]] = map[equlAttrs[0]];
    const resultobj = this._resetAttr(obj, [equlAttrs[0], equlAttrs[1]], map);
    return resultobj;
  }

  /**
   * 数值类型的压缩
   * @param {object} obj lottie.json
   * @param {Array} attrNames 属性名
   * @return {object} returnobj lottie.json
   */
  public attrMiniNumber(obj, attrNames) {
    const resultobj = this._resetToTi(obj, attrNames);
    return resultobj;
  }

  /**
   * 删除属性
   * @param {object} obj lottie.json
   * @param {Array} attrNames 属性名
   * @return {object} returnobj lottie.json
   */
  public deleteAttr(obj, attrNames) {
    const resultobj = this._resetAttr(obj, attrNames);
    return resultobj;
  }
}

export default LottieCompress;
