[![NPM](https://nodei.co/npm/lottie-compress.png)](https://nodei.co/npm/lottie-compress/)
[![Build Status](https://travis-ci.org/fancy-lottie/lottie-compress.svg?branch=master)](https://app.travis-ci.com/github/weiesky)

# lottie compress // lottie体积压缩工具

## npm安装

```bash
npm i -S lottie-compress
```

## 使用方法

```js
import LottieCompress from 'lottie-compress';

interface IOptions {
  quality: [number, number]; // [0.55, 0.75];
  traceformInto?: string, // 'png'，'webp'，'avif'
  tinypngKey?: string;  // tinypng api key
}

(async () => {
  const lottieCompress = new LottieCompress(data, options: IOptions);
  const ret = await lottieCompress.execute(); // The type of ret is buffer()
})();
```

## 参数设置

- `lottieJson` 主参数可以是lottie的json，页可以是lottie的jsonString
- `options` quality（压缩率）, traceformInto（图片类型转换）, tinypngKey（用tinypng的api，输入key即可，但更推荐使用webp格式，以及期待一下不远的将来avif格式能够全兼容）


## 相关描述

lottie-compress是lottie体积压缩的工具库。内部功能包含lottie的字符串裁剪和图片体积优化，以及自动化的解决部分兼容性问题。

如果想直接在线用压缩功能，可以直接使用蚂蚁集团提供的在线压缩工具：https://design.alipay.com/lolita；
洛丽塔内部部分lottie优化功能不在lottie-compress中，但lottie-compress已经包含了核心能力。

经验分享：
1. lottie-compress在纯矢量的文件中，可以优化字符串的大小，但按照zip的口径计算，压缩率大概只有5%～15%，个人觉得矢量文件没有必要，也不用压缩；
2. lottie-compress的压缩主要收益来自base64的图片，提供png、webp、avif、jpeg的压缩，目前推荐用webp的压缩模式，该模式可以让AE导出的png体积缩小到20%～30%，收益非常大！
3. 实际应用中，会遇到性能问题，可以考虑使用lottie-lint做检测（洛丽塔提供了该能力）；

洛丽塔：https://design.alipay.com/lolita 
1. 在线压缩和性能检测工具，方便大家不想部署仓库的情况下直接使用；
2. 洛丽塔暂时不提供英文版本，如果中国以外的用户使用，可以使用google翻译，不影响功能；

