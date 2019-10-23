import * as compressing from 'compressing';
import * as os from 'os';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as crypto from 'crypto';
// import { rimraf } from 'mz-modules';

// const pump = require('pump');
import * as pump from 'pump';


interface ILottieJSONAsset {
  id: string;
  u?: string;
  p?: string;
  e?: number;
  layers?: ILottieJSONLayer[];
}

interface ILottieJSONLayer {
  ty: number;
  nm: string;
  ks: any;
  ao: number;
  ddd: number;
  ind: number;
  ip: number;
  op: number;
  refId?: string;
}

interface ILottieJSON {
  // 版本
  v: string;
  // 帧率
  fr: number;
  // 起始关键帧
  ip: number;
  // 结束关键帧
  op: number;
  // 宽度
  w: number;
  // 高度
  h: number;
  // 合成名称
  nm: string;
  // 3d
  ddd: number;
  // 资源信息
  assets: ILottieJSONAsset[];
  // 图层信息
  layers: ILottieJSONLayer[];
  markers: ILottieJSONLayer[];
}

// 压缩文件夹为 zip 到指定目录
export const pack = async (source: string, dest: string) => {
  await compressing.zip.compressDir(source, dest);
};
const handleError = error => {
  console.log('error', error);
};
// 压缩文件夹里面的lottie内容 zip 到指定目录
export const packLottie = async (source: string, dest: string) => {
  console.log('packLottie');
  const zipStream = new compressing.tar.Stream();
  zipStream.addEntry(path.join(source, 'data.json'));
  zipStream.addEntry(path.join(source, 'images'));
  const destStream = fs.createWriteStream(dest);
  await pump(zipStream, destStream, handleError);
};

const randomSavePath = (pathname: string, ext?: string): string => {
  const hash = crypto.randomBytes(32).toString('hex');
  const basePath = path.join(pathname, hash, 'lottiezip');
  console.log(basePath);
  fse.ensureDirSync(basePath);
  fse.ensureDirSync(basePath + '/images');
  if (ext) {
    return path.join(basePath, `lottie${ext}`);
  }
  return basePath;
};

export const zipJSON = async (lottieData: string, options?: object) => {
  const zipPath = os.tmpdir();
  const defaultOptions = {
    zipPath,
    ...options,
  };
  const tempDist = randomSavePath(defaultOptions.zipPath);
  // 抽取json的图片 base64
  const lottieObj = JSON.parse(lottieData);
  lottieObj.assets = await Promise.all(
    lottieObj.assets.map(async asset => {
      // 非 img 数据，则原数据返回
      if (!asset.u && !asset.p) {
        return asset;
      }

      // 不处理 base64 和远程资源
      if (!asset.p.includes('base64,')) {
        return asset;
      }

      // const imagePath = path.join(lottieDir, asset.u, asset.p);
      // const extname = path.extname(asset.p).substr(1) || 'png';
      // const imageBuffer = await readFilePromise(imagePath);
      const imgFileName = `img_${asset.id}.png`;
      const imageBase64 =  asset.p.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(tempDist, 'images/', imgFileName), imageBase64, 'base64');
      return {
        ...asset,
        e: 1,
        u: 'images/',
        p: imgFileName, // TODO: 会不会有jpg
      };
    }),
  );
  // const images = assets.filter(item => item.p);
  // 转 buffer
  const complateLottieData = JSON.stringify(lottieObj);
  const compressLottieBuffer = Buffer.from(complateLottieData);
  // buffer 写入临时文件
  const lottieFilePath = path.join(tempDist, 'data.json');
  fs.writeFileSync(lottieFilePath, compressLottieBuffer);
  // 压缩文件
  // const zipDist = randomSavePath(defaultOptions.zipPath, '.zip');
  const zipDist = path.join(defaultOptions.zipPath, 'lottie-compress.zip');
  await packLottie(tempDist, zipDist);
  console.log('tempDist', tempDist);
  console.log('zipDist', zipDist);
  const zipBuffer = fs.readFileSync(zipDist);
  console.log(zipBuffer);
  // await rimraf(tempDist);
  // await rimraf(path.dirname(zipDist));
  return zipBuffer;
};

export default zipJSON;
