# lottie compress

## how to use 

```bash
npm i -S lottie-compress
```

```js
import LottieCompress from 'lottie-compress';

async () => {
  const lottieCompress = new LottieCompress({ lottieJson: JSON.parse(data)});
  const ret = await lottieCompress.execute();
  console.log('ret', ret);
}
```

lottie 压缩逻辑

lottie josn 文件

- stream -> buffer -> json
- json -> assets 资源 base64类型 转换为 buffer 调用 imageminPngquant 压缩 然后再转为 base64 塞回 assets 字段
- json -> 压缩冗余的字符 & 属性
- 返回 json
