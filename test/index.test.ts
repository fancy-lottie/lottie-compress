import * as assert from 'assert';
import LottieCompress from '../src/index';
import * as fs from 'fs';
import * as path from 'path';
const data = fs.readFileSync(path.resolve(__dirname, 'fixtures/data.json')).toString();

describe('LottieCompress', () => {
  it('lottieJson is lottie string', async () => {
    const lottieCompress = new LottieCompress(data);
    const ret = await lottieCompress.execute();
    assert(ret.tiny === 0.75);
  });
  it('lottieJson is lottie json object', async () => {
    const lottieCompress = new LottieCompress(JSON.parse(data));
    const ret = await lottieCompress.execute();
    assert(ret.tiny === 0.75);
  });
  it('lottieJson is lottie string and tiny 0.5', async () => {
    const lottieCompress = new LottieCompress(data, {
      quality: [0.5, 0.75],
    });
    const ret = await lottieCompress.execute();
    assert(ret.tiny === 0.5);
  });
  it('lottieJson is lottie string and tiny string', async () => {
    const lottieCompress = new LottieCompress(data, {
      quality: '50-75',
    });
    const ret = await lottieCompress.execute();
    assert(ret.tiny === 0.5);
  });

  it('lottieJson is lottie string and tiny string with tinypng', async () => {
    const lottieCompress = new LottieCompress(data, {
      tinypngKey: 'zBPwXmVrwtvgJkws5qHmy6wYR6n5NXs2'
    });
    const ret = await lottieCompress.execute();
    assert(ret.tiny === 0.75);
  });
  it('lottieJson traceform into webp', async () => {
    const lottieCompress = new LottieCompress(data, {
      quality: '50-75',
      traceformInto: 'webp'
    });
    const ret = await lottieCompress.execute();
    const imagestring = ret.assets[0].p;
    const extname = imagestring.slice(imagestring.indexOf('data:image/') + 11, imagestring.indexOf(';base64'));
    assert(extname === 'webp');
  });
  it('lottieJson traceform into avif', async () => {
    const lottieCompress = new LottieCompress(data, {
      quality: '50-75',
      traceformInto: 'avif'
    });
    const ret = await lottieCompress.execute();
    const imagestring = ret.assets[0].p;
    const extname = imagestring.slice(imagestring.indexOf('data:image/') + 11, imagestring.indexOf(';base64'));
    assert(extname === 'avif');
  });
});
