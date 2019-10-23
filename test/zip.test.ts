import { describe, it } from 'mocha';
import * as assert from 'assert';
import zipJSON from '../src/zip';
import * as fs from 'fs';
import * as path from 'path';

describe.only('zipJSON', () => {
  it('zipJSON', async () => {
    const data = fs.readFileSync(path.resolve(__dirname, 'fixtures/sage.json')).toString();
    // console.log(data);
    const lottieJSON = await zipJSON(data, {
      zipPath: path.join(__dirname, 'zip'),
    });
    fs.writeFileSync(path.join(__dirname, 'lottie.zip'), lottieJSON);
    console.log('lottieJSON', lottieJSON);
    // assert(ret.tiny === '75');
  });
  // it('lottieJson is lottie json object', async () => {
  //   const lottieCompress = new LottieCompress(JSON.parse(data));
  //   const ret = await lottieCompress.execute();
  //   // console.log('ret', ret);
  //   assert(ret.tiny === '75');
  // });
});
