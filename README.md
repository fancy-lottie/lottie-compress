[![NPM](https://nodei.co/npm/lottie-compress.png)](https://nodei.co/npm/lottie-compress/)
[![Build Status](https://travis-ci.org/fancy-lottie/lottie-compress.svg?branch=master)](https://app.travis-ci.com/github/weiesky)

# lottie compress

## Install

```bash
npm i -S lottie-compress
```

## Usage

```js
import LottieCompress from 'lottie-compress';

interface IOptions {
  quality: [number, number]; // '55-75';
  traceformInto?: string, // 'png'，'webp'，'avif'
  tinypngKey?: string;  // tinypng api key
}

(async () => {
  const lottieCompress = new LottieCompress(data, options: IOptions);
  const ret = await lottieCompress.execute();
})();
```

## Options

- `lottieJson` Lottie file json data, Support the json data or string.
- `options` quality, traceformInto, tinypngKey




## 简体中文

lottie-compress是lottie体积压缩的工具库。内部功能包含lottie的字符串裁剪和图片体积优化，以及自动化的解决部分兼容性问题。

如果想直接在线用压缩功能，可以直接使用蚂蚁集团提供的在线压缩工具：https://design.alipay.com/lolita；
洛丽塔内部部分lottie优化功能不在lottie-compress中，但lottie-compress已经包含了核心能力。


