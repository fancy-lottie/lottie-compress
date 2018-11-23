# lottie compress

## Install

```bash
npm i -S lottie-compress
```

## Usage

```js
import LottieCompress from 'lottie-compress';

async () => {
  const lottieCompress = new LottieCompress(lottieJson);
  const ret = await lottieCompress.execute();
  console.log('ret', ret);
}
```

## Options

- `lottieJson` Lottie file json data, Support the json data and string.
- `options` not support.