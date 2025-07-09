[![NPM](https://nodei.co/npm/lottie-compress.png)](https://nodei.co/npm/lottie-compress/)
[![Build Status](https://travis-ci.org/Lottie-Lint/lottie-compress.svg?branch=master)](https://travis-ci.org/Lottie-Lint/lottie-compress)

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
