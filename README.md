# lottie compress

## Install

```bash
npm i -S lottie-compress
```

## Usage

```js
import LottieCompress from 'lottie-compress';

async () => {
  const lottieCompress = new LottieCompress(JSON.parse(data));
  const ret = await lottieCompress.execute();
  console.log('ret', ret);
}
```

## Options

- `lottieJson` Lottie file json data, Please transform the data `JSON.parse(data)` before use.