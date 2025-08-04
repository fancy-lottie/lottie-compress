[中文](README.zh.md) 

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
  quality: [number, number]; // [0.55, 0.75];
  traceformInto?: string, // 'pngMixWebp', 'png', 'webp', 'avif'
  tinypngKey?: string;  // tinypng api key
}

(async () => {
  const lottieCompress = new LottieCompress(data, options: IOptions);
  const ret = await lottieCompress.execute();
})();
```

## Options

- `lottieJson` Lottie file json data, Support the json data or string.
- `options` quality (compression rate), traceformInto (image type conversion), tinypngKey (use tinypng's api, just enter the key)
- `traceformInto` Considering that most terminal machines now support the webp format, the author recommends using the webp format. However, in actual tests, since the algorithm of webp is not always better than png, and considering that the parsing cost of webp in the terminal may be greater than png, there is a special definition "pngMixWebp" for forced type conversion. In the definition of "pngMixWebp", lottie-compress will automatically choose the final output png or webp, and finally ensure that the output volume is optimal.

## Description

lottie-compress is a tool library for lottie volume compression. The internal functions include lottie's string cropping and image volume optimization, as well as automatic solutions to some compatibility issues.

If you want to use the compression function directly online, you can directly use the online compression tool provided by Ant Group: https://design.alipay.com/lolita;
Lolita's internal part of lottie optimization function is not in lottie-compress, but lottie-compress already includes the core capabilities.

Experience sharing:
1. lottie-compress can optimize the size of strings in pure vector files, but according to the zip caliber, the compression rate is only about 5% to 15%. I personally think that vector files are unnecessary and do not need to be compressed;
2. The main benefits of lottie-compress's compression come from base64 images, providing compression of png, webp, avif, and jpeg. It is currently recommended to use the webp compression mode, which can reduce the size of png exported by AE to 20% to 30%, which is very profitable!
3. In actual applications, you may encounter performance problems. You can consider using lottie-lint for testing (Lolita provides this capability);

Lolita: https://design.alipay.com/lolita
1. Online compression and performance testing tools, which are convenient for you to use directly when you don’t want to deploy a warehouse;
2. Lolita does not provide an English version for the time being. If you are a user outside of China, you can use Google Translate without any impact;


