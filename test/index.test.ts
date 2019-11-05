import { describe, it } from 'mocha';
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
});
