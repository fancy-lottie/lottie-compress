import { describe, it } from 'mocha';
import * as assert from 'assert';
import LottieCompress from '../lib/index';
import * as fs from 'fs';
import * as path from 'path';
const data = fs.readFileSync(path.resolve(__dirname, 'fixtures/rockball.json')).toString();

describe('LottieCompress', () => {
  it('lottieJson is lottie string', async () => {
    const lottieCompress = new LottieCompress(data);
    const ret = await lottieCompress.execute();
    // console.log('ret', ret);
    assert(ret.tiny === '75');
  });
  it('lottieJson is lottie json object', async () => {
    const lottieCompress = new LottieCompress(JSON.parse(data));
    const ret = await lottieCompress.execute();
    // console.log('ret', ret);
    assert(ret.tiny === '75');
  });
});
