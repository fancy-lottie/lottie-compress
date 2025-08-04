/**
 * 优化价值：图片通常在AE中使用存在大面积边缘透明区域，这个区域参与终端渲染计算导致不必要运行内存的浪费
 * TODO:
 *  - 对骨骼结构存在parent和children之间关系的元素要做关联属性变更，出于该类型并没有覆盖的原因，所以imageBlank功能在极端情况下是存在导出缺陷的，如果发现异常渲染，可以跳过该阶段，但对于绝大部分素材，仍然是非常好的。
 */
const { createCanvas, loadImage } = require('@napi-rs/canvas');

/**
 * 返回指定layer的直系儿子节点
 * @param {*} layers 必须填写
 * @param {*} layer 必须填写
 */
const getLayerChildren = (layers, layer) => {
  if (!layers || !layers.length) {
    return [];
  }
  const children: any = [];
  const baseLayers = JSON.parse(JSON.stringify(layers));
  baseLayers.forEach((item: any) => {
    if (item.parent === layer.ind) {
      children.push(item);
    }
  });
  return children;
}

/**
 * 获取子合成的名字
 * @param {*} lottieFile 必须填写
 * @param {*} id 必须填写
 */
const getAssetItemName = (lottieFile, id) => {
  let name;
  lottieFile.layers.forEach(item => {
    if (item.refId === id) {
      name = item.nm;
    }
  });
  lottieFile.assets.forEach(asset => {
    if (asset.layers) {
      asset.layers.forEach(item => {
        if (item.refId === id) {
          name = item.nm;
        }
      });
    }
  });
  return name;
}

// 判断是否存在图片有无意义的空白区域 for循环跳出 给lint使用的版本
async function hasImageBlankForLint(lottieFile, params = {}) {
  const newLottieFile = JSON.parse(JSON.stringify(lottieFile));
  const images: any = [];
  if (!newLottieFile) {
    return false;
  }
  newLottieFile.assets.forEach((item: any) => {
    const { p, id, w, h } = item;
    // 选出图片图层
    if (id && p && p.length && p.indexOf('http') !== 0) {
      images.push({
        p,
        w,
        h,
        id,
      });
    }
  });

  // 测绘出图片空白区域
  const Promises = images.map(async item => getImageBlankArea(item, params));
  let resultImages = await Promise.all(Promises);

  // 清洗不必要优化的图片
  resultImages = resultImages.filter(it => it);

  // 存在蒙板的图片无法参与优化，这里不做过滤，但会打标提醒
  resultImages = hasMask(resultImages, newLottieFile);

  const result: any = [];
  resultImages.forEach((img: any) => {
    const { originWidth, originHeight, w, h } = img;
    if (originWidth - w > 0 || originHeight - h > 0) {
      const nm = getAssetItemName(newLottieFile, img.id);
      const message = `“${nm}”, 裁剪区域面积为 ${Math.floor(Number(originWidth * originHeight - w * h))} 像素 ( 节省${(Number(100 - (w * h) / (originWidth * originHeight) * 100)).toFixed(1)}% )`;
      let report = {
        message,
        rule: 'info_image_has_blank',
        element: { asset: -1 },
        type: 'info',
        name: `图片资源-${nm}`,
      };
      if (img.hasMask) {
        report = {
          message,
          rule: 'warn_image_has_blank_width_mask',
          element: { asset: -1 },
          type: 'warn',
          name: `图片资源-${nm}`,
        };
      }
      result.push(report);
    }
  });
  return result.length > 0 ? result : null;
}

// 判断是否存在图片有无意义的空白区域 for循环跳出
async function hasImageBlank(lottieFile, params = {}) {
  const newLottieFile = JSON.parse(JSON.stringify(lottieFile));
  const images: any = [];
  if (!newLottieFile) {
    return false;
  }
  newLottieFile.assets.forEach(item => {
    const { p, id, w, h } = item;
    // 选出图片图层
    if (id && p && p.length && p.indexOf('http') !== 0) {
      images.push({
        p,
        w,
        h,
        id,
      });
    }
  });

  // 测绘出图片空白区域
  const Promises = images.map(async item => getImageBlankArea(item, params));
  let resultImages = await Promise.all(Promises);

  // 清洗不必要优化的图片
  resultImages = resultImages.filter(it => it);

  // 存在蒙板的图片无法参与优化，这里不做过滤，但会打标提醒
  resultImages = hasMask(resultImages, newLottieFile);

  const result: any = [];
  resultImages.forEach((img: any) => {
    const { originWidth, originHeight, w, h } = img;
    if (originWidth - w > 0 || originHeight - h > 0) {
      result.push({
        ...img,
        nm: getAssetItemName(newLottieFile, img.id),
        diff: Math.floor(Number(originWidth * originHeight - w * h)),
        size: (Number(100 - (w * h) / (originWidth * originHeight) * 100)).toFixed(1),
      });
    }
  });
  return result.length > 0 ? result : null;
}

function hasMask(resultImages, newLottieFile) {
  resultImages.forEach(image => {
    newLottieFile.layers.forEach(layer => {
      if (layer.refId === image.id) {
        if (layer.hasMask) {
          image.hasMask = true;
        }
      }
    });
    newLottieFile.assets.forEach(asset => {
      asset?.layers?.forEach(layer => {
        if (layer.refId === image.id) {
          if (layer.hasMask) {
            image.hasMask = true;
          }
        }
      });
    });
  });
  return resultImages;
}

// 重置图片的尺寸
async function resetImage(itemOption) {
  const {
    imageItem,
    left,
    top,
    originWidth,
    originHeight,
    w,
    h,
  } = itemOption;
  // 如果图片大小一致，则不需要优化
  if (originWidth * originHeight <= w * h) {
    return new Promise(resolve => {
      resolve(itemOption);
    });
  }

  const newCanvasElement = createCanvas(w, h); // 准备canvas环境
  const ctx = newCanvasElement.getContext('2d');
  const img = await loadImage(imageItem.p);
  ctx.drawImage(img, left, top, w, h, 0, 0, w, h);
  const newP = newCanvasElement.toDataURL('image/png');
  // eslint-disable-next-line no-unreachable
  return {
    ...itemOption,
    p: newP,
  };;
}

// 重置图层的位移
function resizeSK(it, { left, top, originWidth, originHeight, w, h }, move) {
  if (move) {
    return it;
  }
  const localW = originWidth / 2 - w / 2;
  const localH = originHeight / 2 - h / 2;
  return [
    Number((it[0] - localW + left).toFixed(2)),
    Number((it[1] - localH + top).toFixed(2)),
    it[2], // 3D先固定不管
  ];
}

// 重置图层轴心的坐标位置
function resizeAK(it, { left, top, originWidth, originHeight, w, h }, move) {
  // 如果图片的中轴线没有做过变化的话，则重新定义图层轴心为宽高的1/2;
  if (
    Number(it[0]).toFixed(1) === Number(originWidth / 2).toFixed(1) &&
    Number(it[1]).toFixed(1) === Number(originHeight / 2).toFixed(1) && !move
  ) {
    return [[
      Number((w / 2).toFixed(2)),
      Number((h / 2).toFixed(2)),
      it[2], // 3D先固定不管
    ], false];
  }
  // 如果发生变化，说明旋转需要轴心变化，则需要继承原来图片的轴心坐标
  return [[
    Number((it[0] - left).toFixed(2)),
    Number((it[1] - top).toFixed(2)),
    it[2], // 3D先固定不管
  ], true];
}

// resetImageSize: 重新给item更新尺寸大小 (param: item, resetItem)
function setItemSize(item, imageItem, layers) {
  // * move是核心参数，用来判断移动轴心(true)，还是移动坐标(false) 存在放大缩小或者旋转行为，则重心保持不动
  let move:any = JSON.stringify(item?.ks?.s?.k) !== JSON.stringify([100, 100, 100]) || item?.ks?.r?.k !== 0;

  // 轴心的偏移量的计算
  const itemAK = item?.ks?.a?.k;
  // 重置图片的轴心位置
  if (itemAK && itemAK.length) {
    if (typeof itemAK[0] === 'number') {
      [item.ks.a.k, move] = resizeAK(itemAK, imageItem, move);
    } else {
      // 关键帧类型
      item.ks.a.k.forEach(it => {
        if (it.s && it.s[0] !== undefined) {
          [it.s, move] = resizeAK(it.s, imageItem, move);
        }
        if (it.e && it.e[0] !== undefined) {
          [it.e, move] = resizeAK(it.e, imageItem, move);
        }
      });
    }
  }

  // 重置图片的位移动
  const itemSK = item?.ks?.p?.k;
  if (itemSK && itemSK.length) {
    if (typeof itemSK[0] === 'number') {
      item.ks.p.k = resizeSK(itemSK, imageItem, move);
    } else {
      // 关键帧类型
      item.ks.p.k.forEach(it => {
        if (it.s && it.s[0] !== undefined) {
          it.s = resizeSK(it.s, imageItem, move);
        }
        if (it.e && it.e[0] !== undefined) {
          it.e = resizeSK(it.e, imageItem, move);
        }
      });
    }
  }

  // 修改子元素的p
  const changeChild = getLayerChildren(layers, item);
  if (changeChild.length) {
    const { left, top } = imageItem;
    layers.forEach(it => {
      changeChild.forEach((child: any) => {
        if (child.ind === it.ind) {
          const itAK = it?.ks?.p?.k;
          if (typeof itAK[0] === 'number') {
            it.ks.p.k = [
              Number((itAK[0] - left).toFixed(2)),
              Number((itAK[1] - top).toFixed(2)),
              itAK[2], // 3D先固定不管
            ];
          } else {
            // 关键帧类型
            itAK.forEach(ak => {
              if (ak.s && ak.s[0] !== undefined) {
                ak.s = [
                  Number((ak.s[0] - left).toFixed(2)),
                  Number((ak.s[1] - top).toFixed(2)),
                  ak.s[2], // 3D先固定不管
                ];
              }
              if (ak.e && ak.e[0] !== undefined) {
                ak.e = [
                  Number((ak.e[0] - left).toFixed(2)),
                  Number((ak.e[1] - top).toFixed(2)),
                  ak.e[2], // 3D先固定不管
                ];
              }
            });
          }
        }
      });
    });
  }

  return item;
}

// 处理单张图片
async function getImageBlankArea(imageItem, { px = 100, percent = 0.95 }) {
  const { w, h } = imageItem;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const img = await loadImage(imageItem.p);

  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h).data;

  let lOffset = w;
  let rOffset = 0;
  let tOffset = h;
  let bOffset = 0;

  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      const pos = (i + w * j) * 4;
      if (
        imgData[pos] > 0 ||
        imgData[pos + 1] > 0 ||
        imgData[pos + 2] > 0 ||
        imgData[pos + 3] > 0
      ) {
        bOffset = Math.max(j, bOffset);
        rOffset = Math.max(i, rOffset);
        tOffset = Math.min(j, tOffset);
        lOffset = Math.min(i, lOffset);
      }
    }
  }

  lOffset++;
  rOffset++;
  tOffset++;
  bOffset++;

  const hOffset = bOffset - tOffset + 1;
  const wOffset = rOffset - lOffset + 1;

  if (
    Math.floor(imageItem.w * imageItem.h - wOffset * hOffset) > px &&
    (wOffset * hOffset) / (imageItem.w * imageItem.h) < percent
  ) {
    return {
      imageItem,
      id: imageItem.id,
      left: lOffset - 1,
      right: rOffset,
      top: tOffset - 1,
      bottom: bOffset,
      originWidth: imageItem.w,
      originHeight: imageItem.h,
      w: wOffset,
      h: hOffset,
    };
  }
  return null;
}

// lottie的图片尺寸压缩的优化
async function resetImageBlank(lottieFile, params = {}) {
  const newLottieFile = JSON.parse(JSON.stringify(lottieFile));
  const images: any = [];
  if (!newLottieFile) {
    return false;
  }
  newLottieFile.assets.forEach(item => {
    const { p, id, w, h } = item;
    // 选出图片图层
    if (id && p && p.length && p.indexOf('http') !== 0) {
      images.push({
        p,
        w,
        h,
        id,
      });
    }
  });

  // 测绘出图片空白区域
  let Promises = images.map(async item => getImageBlankArea(item, params));
  let resultImages = await Promise.all(Promises);

  // 清洗不必要优化的图片
  resultImages = resultImages.filter(it => it);

  // 生成新的图片列表
  Promises = resultImages.map(async item => resetImage(item));
  resultImages = await Promise.all(Promises);

  // 存在蒙板的图片无法参与优化，会被过滤
  resultImages = hasMask(resultImages, newLottieFile);
  resultImages = resultImages.filter(item => !item.hasMask);

  // 置换图片
  resultImages.forEach((item: any) => {
    newLottieFile.assets.forEach(asset => {
      if (asset.id === item.imageItem.id && item.p) {
        asset.p = item.p;
        asset.w = item.w;
        asset.h = item.h;
      }
    });
  });

  // 对引用图片的地方做一次全局属性修改
  resultImages.forEach((item: any) => {
    newLottieFile.layers.forEach(layer => {
      if (layer.refId === item.id) {
        layer = setItemSize(layer, item, newLottieFile.layers);
      }
    });
    newLottieFile.assets.forEach(asset => {
      asset?.layers?.forEach(layer => {
        if (layer.refId === item.id) {
          layer = setItemSize(layer, item, asset.layers);
        }
      });
    });
  });

  return newLottieFile;
}

export {
  resetImageBlank, // 具体图片优化的方法
  hasImageBlank, // 判断是不是存在图片空白
  hasImageBlankForLint, // 判断是不是存在图片空白 给lottie-lint专用
};
