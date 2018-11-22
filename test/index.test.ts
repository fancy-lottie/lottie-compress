import { describe, it } from 'mocha';
import * as assert from 'assert';
import LottieCompress from '../lib/index';
import * as fs from 'fs';
import * as path from 'path';
const data = fs.readFileSync(path.resolve(__dirname, 'fixtures/rockball.json')).toString();

describe('LottieCompress', () => {
  it('it is ok', async () => {
    const lottieCompress = new LottieCompress({ lottieJson: JSON.parse(data)});
    const ret = await lottieCompress.execute();
    console.log('ret', ret);
  });
});
