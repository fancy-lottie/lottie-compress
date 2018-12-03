const assert = require('assert');
const LottieCompress = require('../lib/index');
const fs = require('fs');
const path = require('path');

const data = fs.readFileSync(path.resolve(__dirname, '../test/fixtures/rockball.json')).toString();

(async () => {
  const lottieCompress = new LottieCompress(data);
  const ret = await lottieCompress.execute();
  assert(ret.tiny === '75');
})();

