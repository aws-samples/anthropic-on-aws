#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/color-name/index.js
var require_color_name = __commonJS({
  "node_modules/color-name/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      "aliceblue": [240, 248, 255],
      "antiquewhite": [250, 235, 215],
      "aqua": [0, 255, 255],
      "aquamarine": [127, 255, 212],
      "azure": [240, 255, 255],
      "beige": [245, 245, 220],
      "bisque": [255, 228, 196],
      "black": [0, 0, 0],
      "blanchedalmond": [255, 235, 205],
      "blue": [0, 0, 255],
      "blueviolet": [138, 43, 226],
      "brown": [165, 42, 42],
      "burlywood": [222, 184, 135],
      "cadetblue": [95, 158, 160],
      "chartreuse": [127, 255, 0],
      "chocolate": [210, 105, 30],
      "coral": [255, 127, 80],
      "cornflowerblue": [100, 149, 237],
      "cornsilk": [255, 248, 220],
      "crimson": [220, 20, 60],
      "cyan": [0, 255, 255],
      "darkblue": [0, 0, 139],
      "darkcyan": [0, 139, 139],
      "darkgoldenrod": [184, 134, 11],
      "darkgray": [169, 169, 169],
      "darkgreen": [0, 100, 0],
      "darkgrey": [169, 169, 169],
      "darkkhaki": [189, 183, 107],
      "darkmagenta": [139, 0, 139],
      "darkolivegreen": [85, 107, 47],
      "darkorange": [255, 140, 0],
      "darkorchid": [153, 50, 204],
      "darkred": [139, 0, 0],
      "darksalmon": [233, 150, 122],
      "darkseagreen": [143, 188, 143],
      "darkslateblue": [72, 61, 139],
      "darkslategray": [47, 79, 79],
      "darkslategrey": [47, 79, 79],
      "darkturquoise": [0, 206, 209],
      "darkviolet": [148, 0, 211],
      "deeppink": [255, 20, 147],
      "deepskyblue": [0, 191, 255],
      "dimgray": [105, 105, 105],
      "dimgrey": [105, 105, 105],
      "dodgerblue": [30, 144, 255],
      "firebrick": [178, 34, 34],
      "floralwhite": [255, 250, 240],
      "forestgreen": [34, 139, 34],
      "fuchsia": [255, 0, 255],
      "gainsboro": [220, 220, 220],
      "ghostwhite": [248, 248, 255],
      "gold": [255, 215, 0],
      "goldenrod": [218, 165, 32],
      "gray": [128, 128, 128],
      "green": [0, 128, 0],
      "greenyellow": [173, 255, 47],
      "grey": [128, 128, 128],
      "honeydew": [240, 255, 240],
      "hotpink": [255, 105, 180],
      "indianred": [205, 92, 92],
      "indigo": [75, 0, 130],
      "ivory": [255, 255, 240],
      "khaki": [240, 230, 140],
      "lavender": [230, 230, 250],
      "lavenderblush": [255, 240, 245],
      "lawngreen": [124, 252, 0],
      "lemonchiffon": [255, 250, 205],
      "lightblue": [173, 216, 230],
      "lightcoral": [240, 128, 128],
      "lightcyan": [224, 255, 255],
      "lightgoldenrodyellow": [250, 250, 210],
      "lightgray": [211, 211, 211],
      "lightgreen": [144, 238, 144],
      "lightgrey": [211, 211, 211],
      "lightpink": [255, 182, 193],
      "lightsalmon": [255, 160, 122],
      "lightseagreen": [32, 178, 170],
      "lightskyblue": [135, 206, 250],
      "lightslategray": [119, 136, 153],
      "lightslategrey": [119, 136, 153],
      "lightsteelblue": [176, 196, 222],
      "lightyellow": [255, 255, 224],
      "lime": [0, 255, 0],
      "limegreen": [50, 205, 50],
      "linen": [250, 240, 230],
      "magenta": [255, 0, 255],
      "maroon": [128, 0, 0],
      "mediumaquamarine": [102, 205, 170],
      "mediumblue": [0, 0, 205],
      "mediumorchid": [186, 85, 211],
      "mediumpurple": [147, 112, 219],
      "mediumseagreen": [60, 179, 113],
      "mediumslateblue": [123, 104, 238],
      "mediumspringgreen": [0, 250, 154],
      "mediumturquoise": [72, 209, 204],
      "mediumvioletred": [199, 21, 133],
      "midnightblue": [25, 25, 112],
      "mintcream": [245, 255, 250],
      "mistyrose": [255, 228, 225],
      "moccasin": [255, 228, 181],
      "navajowhite": [255, 222, 173],
      "navy": [0, 0, 128],
      "oldlace": [253, 245, 230],
      "olive": [128, 128, 0],
      "olivedrab": [107, 142, 35],
      "orange": [255, 165, 0],
      "orangered": [255, 69, 0],
      "orchid": [218, 112, 214],
      "palegoldenrod": [238, 232, 170],
      "palegreen": [152, 251, 152],
      "paleturquoise": [175, 238, 238],
      "palevioletred": [219, 112, 147],
      "papayawhip": [255, 239, 213],
      "peachpuff": [255, 218, 185],
      "peru": [205, 133, 63],
      "pink": [255, 192, 203],
      "plum": [221, 160, 221],
      "powderblue": [176, 224, 230],
      "purple": [128, 0, 128],
      "rebeccapurple": [102, 51, 153],
      "red": [255, 0, 0],
      "rosybrown": [188, 143, 143],
      "royalblue": [65, 105, 225],
      "saddlebrown": [139, 69, 19],
      "salmon": [250, 128, 114],
      "sandybrown": [244, 164, 96],
      "seagreen": [46, 139, 87],
      "seashell": [255, 245, 238],
      "sienna": [160, 82, 45],
      "silver": [192, 192, 192],
      "skyblue": [135, 206, 235],
      "slateblue": [106, 90, 205],
      "slategray": [112, 128, 144],
      "slategrey": [112, 128, 144],
      "snow": [255, 250, 250],
      "springgreen": [0, 255, 127],
      "steelblue": [70, 130, 180],
      "tan": [210, 180, 140],
      "teal": [0, 128, 128],
      "thistle": [216, 191, 216],
      "tomato": [255, 99, 71],
      "turquoise": [64, 224, 208],
      "violet": [238, 130, 238],
      "wheat": [245, 222, 179],
      "white": [255, 255, 255],
      "whitesmoke": [245, 245, 245],
      "yellow": [255, 255, 0],
      "yellowgreen": [154, 205, 50]
    };
  }
});

// node_modules/color-convert/conversions.js
var require_conversions = __commonJS({
  "node_modules/color-convert/conversions.js"(exports2, module2) {
    var cssKeywords = require_color_name();
    var reverseKeywords = {};
    for (const key of Object.keys(cssKeywords)) {
      reverseKeywords[cssKeywords[key]] = key;
    }
    var convert = {
      rgb: { channels: 3, labels: "rgb" },
      hsl: { channels: 3, labels: "hsl" },
      hsv: { channels: 3, labels: "hsv" },
      hwb: { channels: 3, labels: "hwb" },
      cmyk: { channels: 4, labels: "cmyk" },
      xyz: { channels: 3, labels: "xyz" },
      lab: { channels: 3, labels: "lab" },
      lch: { channels: 3, labels: "lch" },
      hex: { channels: 1, labels: ["hex"] },
      keyword: { channels: 1, labels: ["keyword"] },
      ansi16: { channels: 1, labels: ["ansi16"] },
      ansi256: { channels: 1, labels: ["ansi256"] },
      hcg: { channels: 3, labels: ["h", "c", "g"] },
      apple: { channels: 3, labels: ["r16", "g16", "b16"] },
      gray: { channels: 1, labels: ["gray"] }
    };
    module2.exports = convert;
    for (const model of Object.keys(convert)) {
      if (!("channels" in convert[model])) {
        throw new Error("missing channels property: " + model);
      }
      if (!("labels" in convert[model])) {
        throw new Error("missing channel labels property: " + model);
      }
      if (convert[model].labels.length !== convert[model].channels) {
        throw new Error("channel and label counts mismatch: " + model);
      }
      const { channels, labels } = convert[model];
      delete convert[model].channels;
      delete convert[model].labels;
      Object.defineProperty(convert[model], "channels", { value: channels });
      Object.defineProperty(convert[model], "labels", { value: labels });
    }
    convert.rgb.hsl = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const delta = max - min;
      let h;
      let s;
      if (max === min) {
        h = 0;
      } else if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      const l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert.rgb.hsv = function(rgb) {
      let rdif;
      let gdif;
      let bdif;
      let h;
      let s;
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const v = Math.max(r, g, b);
      const diff = v - Math.min(r, g, b);
      const diffc = function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };
      if (diff === 0) {
        h = 0;
        s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        if (r === v) {
          h = bdif - gdif;
        } else if (g === v) {
          h = 1 / 3 + rdif - bdif;
        } else if (b === v) {
          h = 2 / 3 + gdif - rdif;
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [
        h * 360,
        s * 100,
        v * 100
      ];
    };
    convert.rgb.hwb = function(rgb) {
      const r = rgb[0];
      const g = rgb[1];
      let b = rgb[2];
      const h = convert.rgb.hsl(rgb)[0];
      const w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert.rgb.cmyk = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const k = Math.min(1 - r, 1 - g, 1 - b);
      const c = (1 - r - k) / (1 - k) || 0;
      const m = (1 - g - k) / (1 - k) || 0;
      const y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
    }
    convert.rgb.keyword = function(rgb) {
      const reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      let currentClosestDistance = Infinity;
      let currentClosestKeyword;
      for (const keyword of Object.keys(cssKeywords)) {
        const value = cssKeywords[keyword];
        const distance = comparativeDistance(rgb, value);
        if (distance < currentClosestDistance) {
          currentClosestDistance = distance;
          currentClosestKeyword = keyword;
        }
      }
      return currentClosestKeyword;
    };
    convert.keyword.rgb = function(keyword) {
      return cssKeywords[keyword];
    };
    convert.rgb.xyz = function(rgb) {
      let r = rgb[0] / 255;
      let g = rgb[1] / 255;
      let b = rgb[2] / 255;
      r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
      g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
      b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
      const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
      const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
      return [x * 100, y * 100, z * 100];
    };
    convert.rgb.lab = function(rgb) {
      const xyz = convert.rgb.xyz(rgb);
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.hsl.rgb = function(hsl) {
      const h = hsl[0] / 360;
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      let t2;
      let t3;
      let val;
      if (s === 0) {
        val = l * 255;
        return [val, val, val];
      }
      if (l < 0.5) {
        t2 = l * (1 + s);
      } else {
        t2 = l + s - l * s;
      }
      const t1 = 2 * l - t2;
      const rgb = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          val = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          val = t2;
        } else if (3 * t3 < 2) {
          val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          val = t1;
        }
        rgb[i] = val * 255;
      }
      return rgb;
    };
    convert.hsl.hsv = function(hsl) {
      const h = hsl[0];
      let s = hsl[1] / 100;
      let l = hsl[2] / 100;
      let smin = s;
      const lmin = Math.max(l, 0.01);
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      const v = (l + s) / 2;
      const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert.hsv.rgb = function(hsv) {
      const h = hsv[0] / 60;
      const s = hsv[1] / 100;
      let v = hsv[2] / 100;
      const hi = Math.floor(h) % 6;
      const f = h - Math.floor(h);
      const p = 255 * v * (1 - s);
      const q = 255 * v * (1 - s * f);
      const t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0:
          return [v, t, p];
        case 1:
          return [q, v, p];
        case 2:
          return [p, v, t];
        case 3:
          return [p, q, v];
        case 4:
          return [t, p, v];
        case 5:
          return [v, p, q];
      }
    };
    convert.hsv.hsl = function(hsv) {
      const h = hsv[0];
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const vmin = Math.max(v, 0.01);
      let sl;
      let l;
      l = (2 - s) * v;
      const lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert.hwb.rgb = function(hwb) {
      const h = hwb[0] / 360;
      let wh = hwb[1] / 100;
      let bl = hwb[2] / 100;
      const ratio = wh + bl;
      let f;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      const i = Math.floor(6 * h);
      const v = 1 - bl;
      f = 6 * h - i;
      if ((i & 1) !== 0) {
        f = 1 - f;
      }
      const n = wh + f * (v - wh);
      let r;
      let g;
      let b;
      switch (i) {
        default:
        case 6:
        case 0:
          r = v;
          g = n;
          b = wh;
          break;
        case 1:
          r = n;
          g = v;
          b = wh;
          break;
        case 2:
          r = wh;
          g = v;
          b = n;
          break;
        case 3:
          r = wh;
          g = n;
          b = v;
          break;
        case 4:
          r = n;
          g = wh;
          b = v;
          break;
        case 5:
          r = v;
          g = wh;
          b = n;
          break;
      }
      return [r * 255, g * 255, b * 255];
    };
    convert.cmyk.rgb = function(cmyk) {
      const c = cmyk[0] / 100;
      const m = cmyk[1] / 100;
      const y = cmyk[2] / 100;
      const k = cmyk[3] / 100;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.rgb = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      let r;
      let g;
      let b;
      r = x * 3.2406 + y * -1.5372 + z * -0.4986;
      g = x * -0.9689 + y * 1.8758 + z * 0.0415;
      b = x * 0.0557 + y * -0.204 + z * 1.057;
      r = r > 31308e-7 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
      g = g > 31308e-7 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92;
      b = b > 31308e-7 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92;
      r = Math.min(Math.max(0, r), 1);
      g = Math.min(Math.max(0, g), 1);
      b = Math.min(Math.max(0, b), 1);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.lab = function(xyz) {
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.lab.xyz = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let x;
      let y;
      let z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      const y2 = y ** 3;
      const x2 = x ** 3;
      const z2 = z ** 3;
      y = y2 > 8856e-6 ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > 8856e-6 ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert.lab.lch = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let h;
      const hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      const c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert.lch.lab = function(lch) {
      const l = lch[0];
      const c = lch[1];
      const h = lch[2];
      const hr = h / 360 * 2 * Math.PI;
      const a = c * Math.cos(hr);
      const b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert.rgb.ansi16 = function(args, saturation = null) {
      const [r, g, b] = args;
      let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert.hsv.ansi16 = function(args) {
      return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
    };
    convert.rgb.ansi256 = function(args) {
      const r = args[0];
      const g = args[1];
      const b = args[2];
      if (r === g && g === b) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert.ansi16.rgb = function(args) {
      let color = args % 10;
      if (color === 0 || color === 7) {
        if (args > 50) {
          color += 3.5;
        }
        color = color / 10.5 * 255;
        return [color, color, color];
      }
      const mult = (~~(args > 50) + 1) * 0.5;
      const r = (color & 1) * mult * 255;
      const g = (color >> 1 & 1) * mult * 255;
      const b = (color >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert.ansi256.rgb = function(args) {
      if (args >= 232) {
        const c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      let rem;
      const r = Math.floor(args / 36) / 5 * 255;
      const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      const b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert.rgb.hex = function(args) {
      const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
      const string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.hex.rgb = function(args) {
      const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      let colorString = match[0];
      if (match[0].length === 3) {
        colorString = colorString.split("").map((char) => {
          return char + char;
        }).join("");
      }
      const integer = parseInt(colorString, 16);
      const r = integer >> 16 & 255;
      const g = integer >> 8 & 255;
      const b = integer & 255;
      return [r, g, b];
    };
    convert.rgb.hcg = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(Math.max(r, g), b);
      const min = Math.min(Math.min(r, g), b);
      const chroma = max - min;
      let grayscale;
      let hue;
      if (chroma < 1) {
        grayscale = min / (1 - chroma);
      } else {
        grayscale = 0;
      }
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale * 100];
    };
    convert.hsl.hcg = function(hsl) {
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
      let f = 0;
      if (c < 1) {
        f = (l - 0.5 * c) / (1 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert.hsv.hcg = function(hsv) {
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const c = s * v;
      let f = 0;
      if (c < 1) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert.hcg.rgb = function(hcg) {
      const h = hcg[0] / 360;
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      if (c === 0) {
        return [g * 255, g * 255, g * 255];
      }
      const pure = [0, 0, 0];
      const hi = h % 1 * 6;
      const v = hi % 1;
      const w = 1 - v;
      let mg = 0;
      switch (Math.floor(hi)) {
        case 0:
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        case 1:
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        case 2:
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        case 3:
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        case 4:
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        default:
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
      }
      mg = (1 - c) * g;
      return [
        (c * pure[0] + mg) * 255,
        (c * pure[1] + mg) * 255,
        (c * pure[2] + mg) * 255
      ];
    };
    convert.hcg.hsv = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      let f = 0;
      if (v > 0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert.hcg.hsl = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const l = g * (1 - c) + 0.5 * c;
      let s = 0;
      if (l > 0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert.hcg.hwb = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert.hwb.hcg = function(hwb) {
      const w = hwb[1] / 100;
      const b = hwb[2] / 100;
      const v = 1 - b;
      const c = v - w;
      let g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert.apple.rgb = function(apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert.rgb.apple = function(rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert.gray.rgb = function(args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert.gray.hsl = function(args) {
      return [0, 0, args[0]];
    };
    convert.gray.hsv = convert.gray.hsl;
    convert.gray.hwb = function(gray3) {
      return [0, 100, gray3[0]];
    };
    convert.gray.cmyk = function(gray3) {
      return [0, 0, 0, gray3[0]];
    };
    convert.gray.lab = function(gray3) {
      return [gray3[0], 0, 0];
    };
    convert.gray.hex = function(gray3) {
      const val = Math.round(gray3[0] / 100 * 255) & 255;
      const integer = (val << 16) + (val << 8) + val;
      const string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.rgb.gray = function(rgb) {
      const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [val / 255 * 100];
    };
  }
});

// node_modules/color-convert/route.js
var require_route = __commonJS({
  "node_modules/color-convert/route.js"(exports2, module2) {
    var conversions = require_conversions();
    function buildGraph() {
      const graph = {};
      const models = Object.keys(conversions);
      for (let len = models.length, i = 0; i < len; i++) {
        graph[models[i]] = {
          // http://jsperf.com/1-vs-infinity
          // micro-opt, but this is simple.
          distance: -1,
          parent: null
        };
      }
      return graph;
    }
    function deriveBFS(fromModel) {
      const graph = buildGraph();
      const queue = [fromModel];
      graph[fromModel].distance = 0;
      while (queue.length) {
        const current = queue.pop();
        const adjacents = Object.keys(conversions[current]);
        for (let len = adjacents.length, i = 0; i < len; i++) {
          const adjacent = adjacents[i];
          const node2 = graph[adjacent];
          if (node2.distance === -1) {
            node2.distance = graph[current].distance + 1;
            node2.parent = current;
            queue.unshift(adjacent);
          }
        }
      }
      return graph;
    }
    function link(from, to) {
      return function(args) {
        return to(from(args));
      };
    }
    function wrapConversion(toModel, graph) {
      const path7 = [graph[toModel].parent, toModel];
      let fn = conversions[graph[toModel].parent][toModel];
      let cur = graph[toModel].parent;
      while (graph[cur].parent) {
        path7.unshift(graph[cur].parent);
        fn = link(conversions[graph[cur].parent][cur], fn);
        cur = graph[cur].parent;
      }
      fn.conversion = path7;
      return fn;
    }
    module2.exports = function(fromModel) {
      const graph = deriveBFS(fromModel);
      const conversion = {};
      const models = Object.keys(graph);
      for (let len = models.length, i = 0; i < len; i++) {
        const toModel = models[i];
        const node2 = graph[toModel];
        if (node2.parent === null) {
          continue;
        }
        conversion[toModel] = wrapConversion(toModel, graph);
      }
      return conversion;
    };
  }
});

// node_modules/color-convert/index.js
var require_color_convert = __commonJS({
  "node_modules/color-convert/index.js"(exports2, module2) {
    var conversions = require_conversions();
    var route = require_route();
    var convert = {};
    var models = Object.keys(conversions);
    function wrapRaw(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        return fn(args);
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    function wrapRounded(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        const result = fn(args);
        if (typeof result === "object") {
          for (let len = result.length, i = 0; i < len; i++) {
            result[i] = Math.round(result[i]);
          }
        }
        return result;
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    models.forEach((fromModel) => {
      convert[fromModel] = {};
      Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
      Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
      const routes = route(fromModel);
      const routeModels = Object.keys(routes);
      routeModels.forEach((toModel) => {
        const fn = routes[toModel];
        convert[fromModel][toModel] = wrapRounded(fn);
        convert[fromModel][toModel].raw = wrapRaw(fn);
      });
    });
    module2.exports = convert;
  }
});

// node_modules/ansi-styles/index.js
var require_ansi_styles = __commonJS({
  "node_modules/ansi-styles/index.js"(exports2, module2) {
    "use strict";
    var wrapAnsi16 = (fn, offset) => (...args) => {
      const code2 = fn(...args);
      return `\x1B[${code2 + offset}m`;
    };
    var wrapAnsi256 = (fn, offset) => (...args) => {
      const code2 = fn(...args);
      return `\x1B[${38 + offset};5;${code2}m`;
    };
    var wrapAnsi16m = (fn, offset) => (...args) => {
      const rgb = fn(...args);
      return `\x1B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
    };
    var ansi2ansi = (n) => n;
    var rgb2rgb = (r, g, b) => [r, g, b];
    var setLazyProperty = (object, property, get) => {
      Object.defineProperty(object, property, {
        get: () => {
          const value = get();
          Object.defineProperty(object, property, {
            value,
            enumerable: true,
            configurable: true
          });
          return value;
        },
        enumerable: true,
        configurable: true
      });
    };
    var colorConvert;
    var makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
      if (colorConvert === void 0) {
        colorConvert = require_color_convert();
      }
      const offset = isBackground ? 10 : 0;
      const styles = {};
      for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
        const name = sourceSpace === "ansi16" ? "ansi" : sourceSpace;
        if (sourceSpace === targetSpace) {
          styles[name] = wrap(identity, offset);
        } else if (typeof suite === "object") {
          styles[name] = wrap(suite[targetSpace], offset);
        }
      }
      return styles;
    };
    function assembleStyles() {
      const codes = /* @__PURE__ */ new Map();
      const styles = {
        modifier: {
          reset: [0, 0],
          // 21 isn't widely supported and 22 does the same thing
          bold: [1, 22],
          dim: [2, 22],
          italic: [3, 23],
          underline: [4, 24],
          inverse: [7, 27],
          hidden: [8, 28],
          strikethrough: [9, 29]
        },
        color: {
          black: [30, 39],
          red: [31, 39],
          green: [32, 39],
          yellow: [33, 39],
          blue: [34, 39],
          magenta: [35, 39],
          cyan: [36, 39],
          white: [37, 39],
          // Bright color
          blackBright: [90, 39],
          redBright: [91, 39],
          greenBright: [92, 39],
          yellowBright: [93, 39],
          blueBright: [94, 39],
          magentaBright: [95, 39],
          cyanBright: [96, 39],
          whiteBright: [97, 39]
        },
        bgColor: {
          bgBlack: [40, 49],
          bgRed: [41, 49],
          bgGreen: [42, 49],
          bgYellow: [43, 49],
          bgBlue: [44, 49],
          bgMagenta: [45, 49],
          bgCyan: [46, 49],
          bgWhite: [47, 49],
          // Bright color
          bgBlackBright: [100, 49],
          bgRedBright: [101, 49],
          bgGreenBright: [102, 49],
          bgYellowBright: [103, 49],
          bgBlueBright: [104, 49],
          bgMagentaBright: [105, 49],
          bgCyanBright: [106, 49],
          bgWhiteBright: [107, 49]
        }
      };
      styles.color.gray = styles.color.blackBright;
      styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
      styles.color.grey = styles.color.blackBright;
      styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;
      for (const [groupName, group] of Object.entries(styles)) {
        for (const [styleName, style] of Object.entries(group)) {
          styles[styleName] = {
            open: `\x1B[${style[0]}m`,
            close: `\x1B[${style[1]}m`
          };
          group[styleName] = styles[styleName];
          codes.set(style[0], style[1]);
        }
        Object.defineProperty(styles, groupName, {
          value: group,
          enumerable: false
        });
      }
      Object.defineProperty(styles, "codes", {
        value: codes,
        enumerable: false
      });
      styles.color.close = "\x1B[39m";
      styles.bgColor.close = "\x1B[49m";
      setLazyProperty(styles.color, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, false));
      setLazyProperty(styles.bgColor, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, true));
      return styles;
    }
    Object.defineProperty(module2, "exports", {
      enumerable: true,
      get: assembleStyles
    });
  }
});

// node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "node_modules/has-flag/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "node_modules/supports-color/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var tty2 = require("tty");
    var hasFlag = require_has_flag();
    var { env } = process;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      forceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = 1;
    }
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        forceColor = 1;
      } else if (env.FORCE_COLOR === "false") {
        forceColor = 0;
      } else {
        forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (forceColor === 0) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream, stream && stream.isTTY);
      return translateLevel(level);
    }
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: translateLevel(supportsColor(true, tty2.isatty(1))),
      stderr: translateLevel(supportsColor(true, tty2.isatty(2)))
    };
  }
});

// node_modules/chalk/source/util.js
var require_util = __commonJS({
  "node_modules/chalk/source/util.js"(exports2, module2) {
    "use strict";
    var stringReplaceAll = (string, substring, replacer) => {
      let index = string.indexOf(substring);
      if (index === -1) {
        return string;
      }
      const substringLength = substring.length;
      let endIndex = 0;
      let returnValue = "";
      do {
        returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
        endIndex = index + substringLength;
        index = string.indexOf(substring, endIndex);
      } while (index !== -1);
      returnValue += string.substr(endIndex);
      return returnValue;
    };
    var stringEncaseCRLFWithFirstIndex = (string, prefix, postfix, index) => {
      let endIndex = 0;
      let returnValue = "";
      do {
        const gotCR = string[index - 1] === "\r";
        returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
        endIndex = index + 1;
        index = string.indexOf("\n", endIndex);
      } while (index !== -1);
      returnValue += string.substr(endIndex);
      return returnValue;
    };
    module2.exports = {
      stringReplaceAll,
      stringEncaseCRLFWithFirstIndex
    };
  }
});

// node_modules/chalk/source/templates.js
var require_templates = __commonJS({
  "node_modules/chalk/source/templates.js"(exports2, module2) {
    "use strict";
    var TEMPLATE_REGEX = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
    var STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
    var STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
    var ESCAPE_REGEX = /\\(u(?:[a-f\d]{4}|{[a-f\d]{1,6}})|x[a-f\d]{2}|.)|([^\\])/gi;
    var ESCAPES = /* @__PURE__ */ new Map([
      ["n", "\n"],
      ["r", "\r"],
      ["t", "	"],
      ["b", "\b"],
      ["f", "\f"],
      ["v", "\v"],
      ["0", "\0"],
      ["\\", "\\"],
      ["e", "\x1B"],
      ["a", "\x07"]
    ]);
    function unescape(c) {
      const u = c[0] === "u";
      const bracket = c[1] === "{";
      if (u && !bracket && c.length === 5 || c[0] === "x" && c.length === 3) {
        return String.fromCharCode(parseInt(c.slice(1), 16));
      }
      if (u && bracket) {
        return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
      }
      return ESCAPES.get(c) || c;
    }
    function parseArguments(name, arguments_) {
      const results = [];
      const chunks = arguments_.trim().split(/\s*,\s*/g);
      let matches;
      for (const chunk of chunks) {
        const number = Number(chunk);
        if (!Number.isNaN(number)) {
          results.push(number);
        } else if (matches = chunk.match(STRING_REGEX)) {
          results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, character) => escape ? unescape(escape) : character));
        } else {
          throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
        }
      }
      return results;
    }
    function parseStyle(style) {
      STYLE_REGEX.lastIndex = 0;
      const results = [];
      let matches;
      while ((matches = STYLE_REGEX.exec(style)) !== null) {
        const name = matches[1];
        if (matches[2]) {
          const args = parseArguments(name, matches[2]);
          results.push([name].concat(args));
        } else {
          results.push([name]);
        }
      }
      return results;
    }
    function buildStyle(chalk2, styles) {
      const enabled3 = {};
      for (const layer of styles) {
        for (const style of layer.styles) {
          enabled3[style[0]] = layer.inverse ? null : style.slice(1);
        }
      }
      let current = chalk2;
      for (const [styleName, styles2] of Object.entries(enabled3)) {
        if (!Array.isArray(styles2)) {
          continue;
        }
        if (!(styleName in current)) {
          throw new Error(`Unknown Chalk style: ${styleName}`);
        }
        current = styles2.length > 0 ? current[styleName](...styles2) : current[styleName];
      }
      return current;
    }
    module2.exports = (chalk2, temporary) => {
      const styles = [];
      const chunks = [];
      let chunk = [];
      temporary.replace(TEMPLATE_REGEX, (m, escapeCharacter, inverse, style, close, character) => {
        if (escapeCharacter) {
          chunk.push(unescape(escapeCharacter));
        } else if (style) {
          const string = chunk.join("");
          chunk = [];
          chunks.push(styles.length === 0 ? string : buildStyle(chalk2, styles)(string));
          styles.push({ inverse, styles: parseStyle(style) });
        } else if (close) {
          if (styles.length === 0) {
            throw new Error("Found extraneous } in Chalk template literal");
          }
          chunks.push(buildStyle(chalk2, styles)(chunk.join("")));
          chunk = [];
          styles.pop();
        } else {
          chunk.push(character);
        }
      });
      chunks.push(chunk.join(""));
      if (styles.length > 0) {
        const errMessage = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? "" : "s"} (\`}\`)`;
        throw new Error(errMessage);
      }
      return chunks.join("");
    };
  }
});

// node_modules/chalk/source/index.js
var require_source = __commonJS({
  "node_modules/chalk/source/index.js"(exports2, module2) {
    "use strict";
    var ansiStyles = require_ansi_styles();
    var { stdout: stdoutColor, stderr: stderrColor } = require_supports_color();
    var {
      stringReplaceAll,
      stringEncaseCRLFWithFirstIndex
    } = require_util();
    var { isArray } = Array;
    var levelMapping = [
      "ansi",
      "ansi",
      "ansi256",
      "ansi16m"
    ];
    var styles = /* @__PURE__ */ Object.create(null);
    var applyOptions = (object, options = {}) => {
      if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
        throw new Error("The `level` option should be an integer from 0 to 3");
      }
      const colorLevel = stdoutColor ? stdoutColor.level : 0;
      object.level = options.level === void 0 ? colorLevel : options.level;
    };
    var ChalkClass = class {
      constructor(options) {
        return chalkFactory(options);
      }
    };
    var chalkFactory = (options) => {
      const chalk3 = {};
      applyOptions(chalk3, options);
      chalk3.template = (...arguments_) => chalkTag(chalk3.template, ...arguments_);
      Object.setPrototypeOf(chalk3, Chalk.prototype);
      Object.setPrototypeOf(chalk3.template, chalk3);
      chalk3.template.constructor = () => {
        throw new Error("`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.");
      };
      chalk3.template.Instance = ChalkClass;
      return chalk3.template;
    };
    function Chalk(options) {
      return chalkFactory(options);
    }
    for (const [styleName, style] of Object.entries(ansiStyles)) {
      styles[styleName] = {
        get() {
          const builder = createBuilder(this, createStyler(style.open, style.close, this._styler), this._isEmpty);
          Object.defineProperty(this, styleName, { value: builder });
          return builder;
        }
      };
    }
    styles.visible = {
      get() {
        const builder = createBuilder(this, this._styler, true);
        Object.defineProperty(this, "visible", { value: builder });
        return builder;
      }
    };
    var usedModels = ["rgb", "hex", "keyword", "hsl", "hsv", "hwb", "ansi", "ansi256"];
    for (const model of usedModels) {
      styles[model] = {
        get() {
          const { level } = this;
          return function(...arguments_) {
            const styler = createStyler(ansiStyles.color[levelMapping[level]][model](...arguments_), ansiStyles.color.close, this._styler);
            return createBuilder(this, styler, this._isEmpty);
          };
        }
      };
    }
    for (const model of usedModels) {
      const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
      styles[bgModel] = {
        get() {
          const { level } = this;
          return function(...arguments_) {
            const styler = createStyler(ansiStyles.bgColor[levelMapping[level]][model](...arguments_), ansiStyles.bgColor.close, this._styler);
            return createBuilder(this, styler, this._isEmpty);
          };
        }
      };
    }
    var proto = Object.defineProperties(() => {
    }, {
      ...styles,
      level: {
        enumerable: true,
        get() {
          return this._generator.level;
        },
        set(level) {
          this._generator.level = level;
        }
      }
    });
    var createStyler = (open3, close, parent) => {
      let openAll;
      let closeAll;
      if (parent === void 0) {
        openAll = open3;
        closeAll = close;
      } else {
        openAll = parent.openAll + open3;
        closeAll = close + parent.closeAll;
      }
      return {
        open: open3,
        close,
        openAll,
        closeAll,
        parent
      };
    };
    var createBuilder = (self, _styler, _isEmpty) => {
      const builder = (...arguments_) => {
        if (isArray(arguments_[0]) && isArray(arguments_[0].raw)) {
          return applyStyle(builder, chalkTag(builder, ...arguments_));
        }
        return applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
      };
      Object.setPrototypeOf(builder, proto);
      builder._generator = self;
      builder._styler = _styler;
      builder._isEmpty = _isEmpty;
      return builder;
    };
    var applyStyle = (self, string) => {
      if (self.level <= 0 || !string) {
        return self._isEmpty ? "" : string;
      }
      let styler = self._styler;
      if (styler === void 0) {
        return string;
      }
      const { openAll, closeAll } = styler;
      if (string.indexOf("\x1B") !== -1) {
        while (styler !== void 0) {
          string = stringReplaceAll(string, styler.close, styler.open);
          styler = styler.parent;
        }
      }
      const lfIndex = string.indexOf("\n");
      if (lfIndex !== -1) {
        string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
      }
      return openAll + string + closeAll;
    };
    var template2;
    var chalkTag = (chalk3, ...strings) => {
      const [firstString] = strings;
      if (!isArray(firstString) || !isArray(firstString.raw)) {
        return strings.join(" ");
      }
      const arguments_ = strings.slice(1);
      const parts = [firstString.raw[0]];
      for (let i = 1; i < firstString.length; i++) {
        parts.push(
          String(arguments_[i - 1]).replace(/[{}\\]/g, "\\$&"),
          String(firstString.raw[i])
        );
      }
      if (template2 === void 0) {
        template2 = require_templates();
      }
      return template2(chalk3, parts.join(""));
    };
    Object.defineProperties(Chalk.prototype, styles);
    var chalk2 = Chalk();
    chalk2.supportsColor = stdoutColor;
    chalk2.stderr = Chalk({ level: stderrColor ? stderrColor.level : 0 });
    chalk2.stderr.supportsColor = stderrColor;
    module2.exports = chalk2;
  }
});

// package.json
var require_package = __commonJS({
  "package.json"(exports2, module2) {
    module2.exports = {
      name: "projen",
      description: "CDK for software projects",
      repository: {
        type: "git",
        url: "https://github.com/projen/projen.git"
      },
      bin: {
        projen: "bin/projen"
      },
      scripts: {
        audit: "node ./projen.js audit",
        build: "node ./projen.js build",
        bump: "node ./projen.js bump",
        "bundle:task-runner": "node ./projen.js bundle:task-runner",
        "check-licenses": "node ./projen.js check-licenses",
        clobber: "node ./projen.js clobber",
        compat: "node ./projen.js compat",
        compile: "node ./projen.js compile",
        default: "node ./projen.js default",
        "devenv:setup": "node ./projen.js devenv:setup",
        docgen: "node ./projen.js docgen",
        eject: "node ./projen.js eject",
        eslint: "node ./projen.js eslint",
        integ: "node ./projen.js integ",
        "integ:eject": "node ./projen.js integ:eject",
        "integ:go": "node ./projen.js integ:go",
        "integ:java": "node ./projen.js integ:java",
        "integ:node": "node ./projen.js integ:node",
        "integ:python": "node ./projen.js integ:python",
        package: "node ./projen.js package",
        "package-all": "node ./projen.js package-all",
        "package:go": "node ./projen.js package:go",
        "package:java": "node ./projen.js package:java",
        "package:js": "node ./projen.js package:js",
        "package:python": "node ./projen.js package:python",
        "post-compile": "node ./projen.js post-compile",
        "post-upgrade": "node ./projen.js post-upgrade",
        "pre-compile": "node ./projen.js pre-compile",
        "readme-macros": "node ./projen.js readme-macros",
        release: "node ./projen.js release",
        test: "node ./projen.js test",
        "test:watch": "node ./projen.js test:watch",
        unbump: "node ./projen.js unbump",
        upgrade: "node ./projen.js upgrade",
        "upgrade-bundled": "node ./projen.js upgrade-bundled",
        watch: "node ./projen.js watch",
        projen: "node ./projen.js"
      },
      author: {
        name: "Amazon Web Services",
        url: "https://aws.amazon.com",
        organization: true
      },
      devDependencies: {
        "@biomejs/biome": "^2",
        "@jsii/check-node": "^1.137.0",
        "@types/conventional-changelog-config-spec": "^2.1.5",
        "@types/ini": "^1.3.34",
        "@types/jest": "^30",
        "@types/node": "^16",
        "@types/parse-conflict-json": "^1.1.3",
        "@types/semver": "^7.7.1",
        "@types/yargs": "^16.0.11",
        "@typescript-eslint/eslint-plugin": "^8",
        "@typescript-eslint/parser": "^8",
        "aws-cdk-lib": "^2.260.0",
        "commit-and-tag-version": "^12",
        esbuild: "^0.28.1",
        eslint: "^9",
        "eslint-config-prettier": "^10.1.8",
        "eslint-import-resolver-typescript": "^2.7.1",
        "eslint-plugin-import": "^2.32.0",
        "eslint-plugin-prettier": "^5.5.6",
        jest: "^30",
        "jest-junit": "^17",
        jsii: "6.0.x",
        "jsii-diff": "^1.137.0",
        "jsii-docgen": "^10.5.0",
        "jsii-pacmak": "^1.137.0",
        "jsii-rosetta": "6.0.x",
        json2jsii: "^0.5.19",
        "license-checker": "^25.0.1",
        markmac: "^0.1.659",
        prettier: "^3",
        "ts-jest": "^29",
        tsx: "^4.22.4",
        typescript: "6.0.x"
      },
      peerDependencies: {
        constructs: "^10.5.0"
      },
      dependencies: {
        "@iarna/toml": "^2.2.5",
        case: "^1.6.3",
        chalk: "^4.1.2",
        "comment-json": "4.2.2",
        constructs: "^10.5.0",
        "conventional-changelog-config-spec": "^2.1.0",
        dax: "^0.48.3",
        "fast-glob": "^3.3.3",
        "fast-json-patch": "^3.1.1",
        ini: "^2.0.0",
        "parse-conflict-json": "^4.0.0",
        semver: "^7.8.5",
        xmlbuilder2: "^4.0.3",
        yaml: "^2.2.2",
        yargs: "^17.7.3"
      },
      bundledDependencies: [
        "@iarna/toml",
        "case",
        "chalk",
        "comment-json",
        "conventional-changelog-config-spec",
        "dax",
        "fast-glob",
        "fast-json-patch",
        "ini",
        "parse-conflict-json",
        "semver",
        "xmlbuilder2",
        "yaml",
        "yargs"
      ],
      keywords: [
        "cdk",
        "cicd",
        "generator",
        "management",
        "project",
        "scaffolding"
      ],
      engines: {
        node: ">= 16.0.0"
      },
      devEngines: {
        packageManager: {
          name: "npm",
          onFail: "ignore"
        }
      },
      main: "lib/index.js",
      license: "Apache-2.0",
      stability: "experimental",
      publishConfig: {
        access: "public"
      },
      version: "0.101.4",
      jest: {
        coverageProvider: "v8",
        coverageReporters: [
          "json",
          "lcov",
          "clover",
          "cobertura",
          "text-summary"
        ],
        maxWorkers: "50%",
        setupFiles: [
          "./test/jest.setup.js"
        ],
        testMatch: [
          "<rootDir>/@(src|test)/**/*(*.)@(spec|test).ts?(x)",
          "<rootDir>/@(src|test)/**/__tests__/**/*.ts?(x)",
          "<rootDir>/@(projenrc)/**/*(*.)@(spec|test).ts?(x)",
          "<rootDir>/@(projenrc)/**/__tests__/**/*.ts?(x)"
        ],
        clearMocks: true,
        collectCoverage: true,
        coverageDirectory: "coverage",
        coveragePathIgnorePatterns: [
          "/node_modules/",
          "src/javascript/biome/biome-config.ts",
          "src/python/pyproject-toml.ts",
          "src/python/uv-config.ts",
          "src/awscdk/private/feature-flags-v2.const.ts"
        ],
        testPathIgnorePatterns: [
          "/node_modules/",
          "src/javascript/biome/biome-config.ts",
          "src/python/pyproject-toml.ts",
          "src/python/uv-config.ts",
          "src/awscdk/private/feature-flags-v2.const.ts"
        ],
        watchPathIgnorePatterns: [
          "/node_modules/"
        ],
        reporters: [
          "default",
          [
            "jest-junit",
            {
              outputDirectory: "test-reports"
            }
          ]
        ],
        transform: {
          "^.+\\.[t]sx?$": [
            "ts-jest",
            {
              tsconfig: "test/tsconfig.json"
            }
          ]
        }
      },
      types: "lib/index.d.ts",
      jsii: {
        outdir: "dist",
        targets: {
          java: {
            package: "io.github.cdklabs.projen",
            maven: {
              groupId: "io.github.cdklabs",
              artifactId: "projen"
            }
          },
          python: {
            distName: "projen",
            module: "projen"
          },
          go: {
            moduleName: "github.com/projen/projen-go"
          }
        },
        tsconfig: "tsconfig.json",
        validateTsconfig: "strict"
      },
      "//": '~~ Generated by projen. To modify, edit .projenrc.ts and run "node ./projen.js".'
    };
  }
});

// node_modules/json-parse-even-better-errors/lib/index.js
var require_lib = __commonJS({
  "node_modules/json-parse-even-better-errors/lib/index.js"(exports2, module2) {
    "use strict";
    var INDENT = /* @__PURE__ */ Symbol.for("indent");
    var NEWLINE = /* @__PURE__ */ Symbol.for("newline");
    var DEFAULT_NEWLINE = "\n";
    var DEFAULT_INDENT = "  ";
    var BOM = /^\uFEFF/;
    var FORMAT = /^\s*[{[]((?:\r?\n)+)([\s\t]*)/;
    var EMPTY = /^(?:\{\}|\[\])((?:\r?\n)+)?$/;
    var UNEXPECTED_TOKEN = /^Unexpected token '?(.)'?(,)? /i;
    var hexify = (char) => {
      const h = char.charCodeAt(0).toString(16).toUpperCase();
      return `0x${h.length % 2 ? "0" : ""}${h}`;
    };
    var stripBOM = (txt) => String(txt).replace(BOM, "");
    var makeParsedError = (msg, parsing, position = 0) => ({
      message: `${msg} while parsing ${parsing}`,
      position
    });
    var parseError = (e, txt, context = 20) => {
      let msg = e.message;
      if (!txt) {
        return makeParsedError(msg, "empty string");
      }
      const badTokenMatch = msg.match(UNEXPECTED_TOKEN);
      const badIndexMatch = msg.match(/ position\s+(\d+)/i);
      if (badTokenMatch) {
        msg = msg.replace(
          UNEXPECTED_TOKEN,
          `Unexpected token ${JSON.stringify(badTokenMatch[1])} (${hexify(badTokenMatch[1])})$2 `
        );
      }
      let errIdx;
      if (badIndexMatch) {
        errIdx = +badIndexMatch[1];
      } else if (msg.match(/^Unexpected end of JSON.*/i)) {
        errIdx = txt.length - 1;
      }
      if (errIdx == null) {
        return makeParsedError(msg, `'${txt.slice(0, context * 2)}'`);
      }
      const start = errIdx <= context ? 0 : errIdx - context;
      const end = errIdx + context >= txt.length ? txt.length : errIdx + context;
      const slice = `${start ? "..." : ""}${txt.slice(start, end)}${end === txt.length ? "" : "..."}`;
      return makeParsedError(
        msg,
        `${txt === slice ? "" : "near "}${JSON.stringify(slice)}`,
        errIdx
      );
    };
    var JSONParseError = class extends SyntaxError {
      constructor(er, txt, context, caller) {
        const metadata = parseError(er, txt, context);
        super(metadata.message);
        Object.assign(this, metadata);
        this.code = "EJSONPARSE";
        this.systemError = er;
        Error.captureStackTrace(this, caller || this.constructor);
      }
      get name() {
        return this.constructor.name;
      }
      set name(n) {
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    var parseJson = (txt, reviver) => {
      const result = JSON.parse(txt, reviver);
      if (result && typeof result === "object") {
        const match = txt.match(EMPTY) || txt.match(FORMAT) || [null, "", ""];
        result[NEWLINE] = match[1] ?? DEFAULT_NEWLINE;
        result[INDENT] = match[2] ?? DEFAULT_INDENT;
      }
      return result;
    };
    var parseJsonError = (raw, reviver, context) => {
      const txt = stripBOM(raw);
      try {
        return parseJson(txt, reviver);
      } catch (e) {
        if (typeof raw !== "string" && !Buffer.isBuffer(raw)) {
          const msg = Array.isArray(raw) && raw.length === 0 ? "an empty array" : String(raw);
          throw Object.assign(
            new TypeError(`Cannot parse ${msg}`),
            { code: "EJSONPARSE", systemError: e }
          );
        }
        throw new JSONParseError(e, txt, context, parseJsonError);
      }
    };
    module2.exports = parseJsonError;
    parseJsonError.JSONParseError = JSONParseError;
    parseJsonError.noExceptions = (raw, reviver) => {
      try {
        return parseJson(stripBOM(raw), reviver);
      } catch {
      }
    };
  }
});

// node_modules/just-diff/index.cjs
var require_just_diff = __commonJS({
  "node_modules/just-diff/index.cjs"(exports2, module2) {
    module2.exports = {
      diff,
      jsonPatchPathConverter
    };
    function diff(obj1, obj2, pathConverter) {
      if (!obj1 || typeof obj1 != "object" || !obj2 || typeof obj2 != "object") {
        throw new Error("both arguments must be objects or arrays");
      }
      pathConverter || (pathConverter = function(arr) {
        return arr;
      });
      function getDiff({ obj1: obj12, obj2: obj22, basePath, basePathForRemoves, diffs: diffs2 }) {
        var obj1Keys = Object.keys(obj12);
        var obj1KeysLength = obj1Keys.length;
        var obj2Keys = Object.keys(obj22);
        var obj2KeysLength = obj2Keys.length;
        var path7;
        var lengthDelta = obj12.length - obj22.length;
        if (trimFromRight(obj12, obj22)) {
          for (var i = 0; i < obj1KeysLength; i++) {
            var key = Array.isArray(obj12) ? Number(obj1Keys[i]) : obj1Keys[i];
            if (!(key in obj22)) {
              path7 = basePathForRemoves.concat(key);
              diffs2.remove.push({
                op: "remove",
                path: pathConverter(path7)
              });
            }
          }
          for (var i = 0; i < obj2KeysLength; i++) {
            var key = Array.isArray(obj22) ? Number(obj2Keys[i]) : obj2Keys[i];
            pushReplaces({
              key,
              obj1: obj12,
              obj2: obj22,
              path: basePath.concat(key),
              pathForRemoves: basePath.concat(key),
              diffs: diffs2
            });
          }
        } else {
          for (var i = 0; i < lengthDelta; i++) {
            path7 = basePathForRemoves.concat(i);
            diffs2.remove.push({
              op: "remove",
              path: pathConverter(path7)
            });
          }
          var obj1Trimmed = obj12.slice(lengthDelta);
          ;
          for (var i = 0; i < obj2KeysLength; i++) {
            pushReplaces({
              key: i,
              obj1: obj1Trimmed,
              obj2: obj22,
              path: basePath.concat(i),
              // since list of removes are reversed before presenting result,
              // we need to ignore existing parent removes when doing nested removes
              pathForRemoves: basePath.concat(i + lengthDelta),
              diffs: diffs2
            });
          }
        }
      }
      var diffs = { remove: [], replace: [], add: [] };
      getDiff({
        obj1,
        obj2,
        basePath: [],
        basePathForRemoves: [],
        diffs
      });
      return diffs.remove.reverse().concat(diffs.replace).concat(diffs.add);
      function pushReplaces({ key, obj1: obj12, obj2: obj22, path: path7, pathForRemoves, diffs: diffs2 }) {
        var obj1AtKey = obj12[key];
        var obj2AtKey = obj22[key];
        if (!(key in obj12) && key in obj22) {
          var obj2Value = obj2AtKey;
          diffs2.add.push({
            op: "add",
            path: pathConverter(path7),
            value: obj2Value
          });
        } else if (obj1AtKey !== obj2AtKey) {
          if (Object(obj1AtKey) !== obj1AtKey || Object(obj2AtKey) !== obj2AtKey || differentTypes(obj1AtKey, obj2AtKey)) {
            pushReplace(path7, diffs2, obj2AtKey);
          } else {
            if (!Object.keys(obj1AtKey).length && !Object.keys(obj2AtKey).length && String(obj1AtKey) != String(obj2AtKey)) {
              pushReplace(path7, diffs2, obj2AtKey);
            } else {
              getDiff({
                obj1: obj12[key],
                obj2: obj22[key],
                basePath: path7,
                basePathForRemoves: pathForRemoves,
                diffs: diffs2
              });
            }
          }
        }
      }
      function pushReplace(path7, diffs2, newValue) {
        diffs2.replace.push({
          op: "replace",
          path: pathConverter(path7),
          value: newValue
        });
      }
    }
    function jsonPatchPathConverter(arrayPath) {
      return [""].concat(arrayPath).join("/");
    }
    function differentTypes(a, b) {
      return Object.prototype.toString.call(a) != Object.prototype.toString.call(b);
    }
    function trimFromRight(obj1, obj2) {
      var lengthDelta = obj1.length - obj2.length;
      if (Array.isArray(obj1) && Array.isArray(obj2) && lengthDelta > 0) {
        var leftMatches = 0;
        var rightMatches = 0;
        for (var i = 0; i < obj2.length; i++) {
          if (String(obj1[i]) === String(obj2[i])) {
            leftMatches++;
          } else {
            break;
          }
        }
        for (var j = obj2.length; j > 0; j--) {
          if (String(obj1[j + lengthDelta]) === String(obj2[j])) {
            rightMatches++;
          } else {
            break;
          }
        }
        return leftMatches >= rightMatches;
      }
      return true;
    }
  }
});

// node_modules/just-diff-apply/index.cjs
var require_just_diff_apply = __commonJS({
  "node_modules/just-diff-apply/index.cjs"(exports2, module2) {
    module2.exports = {
      diffApply,
      jsonPatchPathConverter
    };
    var REMOVE = "remove";
    var REPLACE = "replace";
    var ADD = "add";
    var MOVE = "move";
    function diffApply(obj, diff, pathConverter) {
      if (!obj || typeof obj != "object") {
        throw new Error("base object must be an object or an array");
      }
      if (!Array.isArray(diff)) {
        throw new Error("diff must be an array");
      }
      var diffLength = diff.length;
      for (var i = 0; i < diffLength; i++) {
        var thisDiff = diff[i];
        var subObject = obj;
        var thisOp = thisDiff.op;
        var thisPath = transformPath(pathConverter, thisDiff.path);
        var thisFromPath = thisDiff.from && transformPath(pathConverter, thisDiff.from);
        var toPath, toPathCopy, lastToProp, subToObject, valueToMove;
        if (thisFromPath) {
          toPath = thisPath;
          thisPath = thisFromPath;
          toPathCopy = toPath.slice();
          lastToProp = toPathCopy.pop();
          prototypeCheck(lastToProp);
          if (lastToProp == null) {
            return false;
          }
          var thisToProp;
          while ((thisToProp = toPathCopy.shift()) != null) {
            prototypeCheck(thisToProp);
            if (!(thisToProp in subToObject)) {
              subToObject[thisToProp] = {};
            }
            subToObject = subToObject[thisToProp];
          }
        }
        var pathCopy = thisPath.slice();
        var lastProp = pathCopy.pop();
        prototypeCheck(lastProp);
        if (lastProp == null) {
          return false;
        }
        var thisProp;
        while ((thisProp = pathCopy.shift()) != null) {
          prototypeCheck(thisProp);
          if (!(thisProp in subObject)) {
            subObject[thisProp] = {};
          }
          subObject = subObject[thisProp];
        }
        if (thisOp === REMOVE || thisOp === REPLACE || thisOp === MOVE) {
          var path7 = thisOp === MOVE ? thisDiff.from : thisDiff.path;
          if (!subObject.hasOwnProperty(lastProp)) {
            throw new Error(["expected to find property", path7, "in object", obj].join(" "));
          }
        }
        if (thisOp === REMOVE || thisOp === MOVE) {
          if (thisOp === MOVE) {
            valueToMove = subObject[lastProp];
          }
          Array.isArray(subObject) ? subObject.splice(lastProp, 1) : delete subObject[lastProp];
        }
        if (thisOp === REPLACE || thisOp === ADD) {
          subObject[lastProp] = thisDiff.value;
        }
        if (thisOp === MOVE) {
          subObject[lastToProp] = valueToMove;
        }
      }
      return subObject;
    }
    function transformPath(pathConverter, thisPath) {
      if (pathConverter) {
        thisPath = pathConverter(thisPath);
        if (!Array.isArray(thisPath)) {
          throw new Error([
            "pathConverter must return an array, returned:",
            thisPath
          ].join(" "));
        }
      } else {
        if (!Array.isArray(thisPath)) {
          throw new Error([
            "diff path",
            thisPath,
            "must be an array, consider supplying a path converter"
          ].join(" "));
        }
      }
      return thisPath;
    }
    function jsonPatchPathConverter(stringPath) {
      return stringPath.split("/").slice(1);
    }
    function prototypeCheck(prop) {
      if (prop == "__proto__" || prop == "constructor" || prop == "prototype") {
        throw new Error("setting of prototype values not supported");
      }
    }
  }
});

// node_modules/parse-conflict-json/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/parse-conflict-json/lib/index.js"(exports2, module2) {
    var parseJSON = require_lib();
    var { diff } = require_just_diff();
    var { diffApply } = require_just_diff_apply();
    var globalObjectProperties = Object.getOwnPropertyNames(Object.prototype);
    var stripBOM = (content) => {
      content = content.toString();
      if (content.charCodeAt(0) === 65279) {
        content = content.slice(1);
      }
      return content;
    };
    var PARENT_RE = /\|{7,}/g;
    var OURS_RE = /<{7,}/g;
    var THEIRS_RE = /={7,}/g;
    var END_RE = />{7,}/g;
    var isDiff = (str) => str.match(OURS_RE) && str.match(THEIRS_RE) && str.match(END_RE);
    var parseConflictJSON2 = (str, reviver, prefer) => {
      prefer = prefer || "ours";
      if (prefer !== "theirs" && prefer !== "ours") {
        throw new TypeError('prefer param must be "ours" or "theirs" if set');
      }
      str = stripBOM(str);
      if (!isDiff(str)) {
        return parseJSON(str);
      }
      const pieces = str.split(/[\n\r]+/g).reduce((acc, line) => {
        if (line.match(PARENT_RE)) {
          acc.state = "parent";
        } else if (line.match(OURS_RE)) {
          acc.state = "ours";
        } else if (line.match(THEIRS_RE)) {
          acc.state = "theirs";
        } else if (line.match(END_RE)) {
          acc.state = "top";
        } else {
          if (acc.state === "top" || acc.state === "ours") {
            acc.ours += line;
          }
          if (acc.state === "top" || acc.state === "theirs") {
            acc.theirs += line;
          }
          if (acc.state === "top" || acc.state === "parent") {
            acc.parent += line;
          }
        }
        return acc;
      }, {
        state: "top",
        ours: "",
        theirs: "",
        parent: ""
      });
      const parent = parseJSON(pieces.parent, reviver);
      const ours = parseJSON(pieces.ours, reviver);
      const theirs = parseJSON(pieces.theirs, reviver);
      return prefer === "ours" ? resolve7(parent, ours, theirs) : resolve7(parent, theirs, ours);
    };
    var isObj = (obj) => obj && typeof obj === "object";
    var copyPath = (to, from, path7, i) => {
      const p = path7[i];
      if (isObj(to[p]) && isObj(from[p]) && Array.isArray(to[p]) === Array.isArray(from[p])) {
        return copyPath(to[p], from[p], path7, i + 1);
      }
      to[p] = from[p];
    };
    var resolve7 = (parent, ours, theirs) => {
      const dours = diff(parent, ours);
      for (let i = 0; i < dours.length; i++) {
        if (globalObjectProperties.find((prop) => dours[i].path.includes(prop))) {
          continue;
        }
        try {
          diffApply(theirs, [dours[i]]);
        } catch (e) {
          copyPath(theirs, ours, dours[i].path, 0);
        }
      }
      return theirs;
    };
    module2.exports = Object.assign(parseConflictJSON2, { isDiff });
  }
});

// src/cli/task-runtime.ts
var task_runtime_exports = {};
__export(task_runtime_exports, {
  TaskRuntime: () => TaskRuntime
});
module.exports = __toCommonJS(task_runtime_exports);
var import_fs = require("fs");
var import_path = require("path");
var path6 = __toESM(require("path"));
var import_util = require("util");
var import_chalk2 = __toESM(require_source());

// node_modules/dax/esm/mod.js
var import_node_util = require("node:util");
var import_node_util2 = require("node:util");
var import_web = require("node:stream/web");
var import_web2 = require("node:stream/web");
var import_node_fs = __toESM(require("node:fs"), 1);
var import_promises = __toESM(require("node:fs/promises"), 1);
var import_node_path = require("node:path");
var path5 = __toESM(require("node:path"), 1);
var import_node_url = require("node:url");
var fs3 = __toESM(require("node:fs"), 1);
var path = __toESM(require("node:path"), 1);
var fs2 = __toESM(require("node:fs"), 1);
var import_node_timers = require("node:timers");
var nodeUtil = __toESM(require("node:util"), 1);
var fs4 = __toESM(require("node:fs"), 1);
var fs5 = __toESM(require("node:fs"), 1);
var path2 = __toESM(require("node:path"), 1);
var fs6 = __toESM(require("node:fs"), 1);
var path3 = __toESM(require("node:path"), 1);
var fs7 = __toESM(require("node:fs"), 1);
var import_node_path2 = require("node:path");
var path4 = __toESM(require("node:path"), 1);
var fs8 = __toESM(require("node:fs"), 1);
var cp = __toESM(require("node:child_process"), 1);
var import_node_stream = require("node:stream");
var fs9 = __toESM(require("node:fs"), 1);
var nodePath = __toESM(require("node:path"), 1);
var fs10 = __toESM(require("node:fs"), 1);
var tty = __toESM(require("node:tty"), 1);
var import_node_process = __toESM(require("node:process"), 1);
var import_node_util3 = require("node:util");
var __defProp2 = Object.defineProperty;
var __export2 = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
if (!Object.hasOwn) {
  Object.defineProperty(Object, "hasOwn", {
    value: function(object, property) {
      if (object == null) {
        throw new TypeError("Cannot convert undefined or null to object");
      }
      return Object.prototype.hasOwnProperty.call(Object(object), property);
    },
    configurable: true,
    enumerable: false,
    writable: true
  });
}
if (Promise.withResolvers === void 0) {
  Promise.withResolvers = () => {
    const out = {};
    out.promise = new Promise((resolve_, reject_) => {
      out.resolve = resolve_;
      out.reject = reject_;
    });
    return out;
  };
}
function findLastIndex(self, callbackfn, that) {
  const boundFunc = that === void 0 ? callbackfn : callbackfn.bind(that);
  let index = self.length - 1;
  while (index >= 0) {
    const result = boundFunc(self[index], index, self);
    if (result) {
      return index;
    }
    index--;
  }
  return -1;
}
function findLast(self, callbackfn, that) {
  const index = self.findLastIndex(callbackfn, that);
  return index === -1 ? void 0 : self[index];
}
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function(callbackfn, that) {
    return findLastIndex(this, callbackfn, that);
  };
}
if (!Array.prototype.findLast) {
  Array.prototype.findLast = function(callbackfn, that) {
    return findLast(this, callbackfn, that);
  };
}
if (!Uint8Array.prototype.findLastIndex) {
  Uint8Array.prototype.findLastIndex = function(callbackfn, that) {
    return findLastIndex(this, callbackfn, that);
  };
}
if (!Uint8Array.prototype.findLast) {
  Uint8Array.prototype.findLast = function(callbackfn, that) {
    return findLast(this, callbackfn, that);
  };
}
var { MAX_SAFE_INTEGER } = Number;
var iteratorSymbol = Symbol.iterator;
var asyncIteratorSymbol = Symbol.asyncIterator;
var IntrinsicArray = Array;
var tooLongErrorMessage = "Input is too long and exceeded Number.MAX_SAFE_INTEGER times.";
function isConstructor(obj) {
  if (obj != null) {
    const prox = new Proxy(obj, {
      construct() {
        return prox;
      }
    });
    try {
      new prox();
      return true;
    } catch (err) {
      return false;
    }
  } else {
    return false;
  }
}
async function fromAsync(items, mapfn, thisArg) {
  const itemsAreIterable = asyncIteratorSymbol in items || iteratorSymbol in items;
  if (itemsAreIterable) {
    const result = isConstructor(this) ? new this() : IntrinsicArray(0);
    let i = 0;
    for await (const v of items) {
      if (i > MAX_SAFE_INTEGER) {
        throw TypeError(tooLongErrorMessage);
      } else if (mapfn) {
        result[i] = await mapfn.call(thisArg, v, i);
      } else {
        result[i] = v;
      }
      i++;
    }
    result.length = i;
    return result;
  } else {
    const { length } = items;
    const result = isConstructor(this) ? new this(length) : IntrinsicArray(length);
    let i = 0;
    while (i < length) {
      if (i > MAX_SAFE_INTEGER) {
        throw TypeError(tooLongErrorMessage);
      }
      const v = await items[i];
      if (mapfn) {
        result[i] = await mapfn.call(thisArg, v, i);
      } else {
        result[i] = v;
      }
      i++;
    }
    result.length = i;
    return result;
  }
}
if (!Array.fromAsync) {
  Array.fromAsync = fromAsync;
}
var dntGlobals = {
  TextDecoder: import_node_util.TextDecoder,
  ReadableStream: import_web.ReadableStream,
  WritableStream: import_web.WritableStream,
  TextDecoderStream: import_web.TextDecoderStream,
  TransformStream: import_web.TransformStream
};
var dntGlobalThis = createMergeProxy(globalThis, dntGlobals);
function createMergeProxy(baseObj, extObj) {
  return new Proxy(baseObj, {
    get(_target, prop, _receiver) {
      if (prop in extObj) {
        return extObj[prop];
      } else {
        return baseObj[prop];
      }
    },
    set(_target, prop, value) {
      if (prop in extObj) {
        delete extObj[prop];
      }
      baseObj[prop] = value;
      return true;
    },
    deleteProperty(_target, prop) {
      let success = false;
      if (prop in extObj) {
        delete extObj[prop];
        success = true;
      }
      if (prop in baseObj) {
        delete baseObj[prop];
        success = true;
      }
      return success;
    },
    ownKeys(_target) {
      const baseKeys = Reflect.ownKeys(baseObj);
      const extKeys = Reflect.ownKeys(extObj);
      const extKeysSet = new Set(extKeys);
      return [...baseKeys.filter((k) => !extKeysSet.has(k)), ...extKeys];
    },
    defineProperty(_target, prop, desc) {
      if (prop in extObj) {
        delete extObj[prop];
      }
      Reflect.defineProperty(baseObj, prop, desc);
      return true;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop in extObj) {
        return Reflect.getOwnPropertyDescriptor(extObj, prop);
      } else {
        return Reflect.getOwnPropertyDescriptor(baseObj, prop);
      }
    },
    has(_target, prop) {
      return prop in extObj || prop in baseObj;
    }
  });
}
var { Deno } = dntGlobalThis;
var noColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : false;
var enabled = !noColor;
function code(open3, close) {
  return {
    open: `\x1B[${open3.join(";")}m`,
    close: `\x1B[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g")
  };
}
function run(str, code2) {
  return enabled ? `${code2.open}${str.replace(code2.regexp, code2.open)}${code2.close}` : str;
}
function bold(str) {
  return run(str, code([1], 22));
}
function dim(str) {
  return run(str, code([2], 22));
}
function italic(str) {
  return run(str, code([3], 23));
}
function red(str) {
  return run(str, code([31], 39));
}
function green(str) {
  return run(str, code([32], 39));
}
function yellow(str) {
  return run(str, code([33], 39));
}
function blue(str) {
  return run(str, code([34], 39));
}
function cyan(str) {
  return run(str, code([36], 39));
}
function white(str) {
  return run(str, code([37], 39));
}
function gray(str) {
  return brightBlack(str);
}
function brightBlack(str) {
  return run(str, code([90], 39));
}
var ANSI_REGEXP = new RegExp([
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))"
].join("|"), "g");
var denoGlobal = globalThis.Deno;
var nodeProcess = globalThis.process;
var nodeFs;
function getNodeFs() {
  return nodeFs ??= nodeProcess.getBuiltinModule("node:fs");
}
var RealEnvironment = class {
  env(key) {
    if (denoGlobal?.env) {
      return denoGlobal.env.get(key);
    }
    return nodeProcess.env[key];
  }
  async stat(path62) {
    if (denoGlobal?.stat) {
      return await denoGlobal.stat(path62);
    }
    const info2 = await getNodeFs().promises.stat(path62);
    return { isFile: info2.isFile() };
  }
  statSync(path62) {
    if (denoGlobal?.statSync) {
      return denoGlobal.statSync(path62);
    }
    const info2 = getNodeFs().statSync(path62);
    return { isFile: info2.isFile() };
  }
  async lstat(path62) {
    if (denoGlobal?.lstat) {
      return await denoGlobal.lstat(path62);
    }
    const info2 = await getNodeFs().promises.lstat(path62);
    return { isFile: info2.isFile(), isSymlink: info2.isSymbolicLink() };
  }
  lstatSync(path62) {
    if (denoGlobal?.lstatSync) {
      return denoGlobal.lstatSync(path62);
    }
    const info2 = getNodeFs().lstatSync(path62);
    return { isFile: info2.isFile(), isSymlink: info2.isSymbolicLink() };
  }
  async readLink(path62) {
    if (denoGlobal?.readLink) {
      return await denoGlobal.readLink(path62);
    }
    return await getNodeFs().promises.readlink(path62);
  }
  readLinkSync(path62) {
    if (denoGlobal?.readLinkSync) {
      return denoGlobal.readLinkSync(path62);
    }
    return getNodeFs().readlinkSync(path62);
  }
  get isWindows() {
    if (denoGlobal?.build?.os) {
      return denoGlobal.build.os === "windows";
    }
    return nodeProcess.platform === "win32";
  }
};
async function which(command, environment = new RealEnvironment()) {
  if (commandHasPathSeparator(command, environment.isWindows)) {
    if (await pathMatches(environment, command)) {
      return command;
    }
    const pathExts = getPathExts(command, environment);
    if (pathExts == null) {
      return void 0;
    }
    for (const pathExt of pathExts) {
      const filePath = command + pathExt;
      if (await pathMatches(environment, filePath)) {
        return filePath;
      }
    }
    return void 0;
  }
  const systemInfo = getSystemInfo(command, environment);
  if (systemInfo == null) {
    return void 0;
  }
  for (const pathItem of systemInfo.pathItems) {
    const filePath = pathItem + command;
    if (systemInfo.pathExts) {
      environment.requestPermission?.(pathItem);
      for (const pathExt of systemInfo.pathExts) {
        const filePath2 = pathItem + command + pathExt;
        if (await pathMatches(environment, filePath2)) {
          return filePath2;
        }
      }
    } else if (await pathMatches(environment, filePath)) {
      return filePath;
    }
  }
  return void 0;
}
async function pathMatches(environment, path62) {
  try {
    return (await environment.stat(path62)).isFile;
  } catch (statErr) {
    if (isDenoPermissionDeniedError(statErr)) {
      throw statErr;
    }
    if (environment.isWindows && isEaccesError(statErr)) {
      return await followSymlinkChain(environment, path62);
    }
    return false;
  }
}
async function followSymlinkChain(environment, path62) {
  let current = path62;
  for (let hops = 0; hops < 40; hops++) {
    let info2;
    try {
      info2 = await environment.lstat(current);
    } catch (err) {
      if (isDenoPermissionDeniedError(err)) {
        throw err;
      }
      return false;
    }
    if (info2.isFile)
      return true;
    if (!info2.isSymlink)
      return false;
    let target;
    try {
      target = await environment.readLink(current);
    } catch (err) {
      if (isDenoPermissionDeniedError(err)) {
        throw err;
      }
      return false;
    }
    current = resolveLinkTarget(current, target);
  }
  return false;
}
function whichSync(command, environment = new RealEnvironment()) {
  if (commandHasPathSeparator(command, environment.isWindows)) {
    if (pathMatchesSync(environment, command)) {
      return command;
    }
    const pathExts = getPathExts(command, environment);
    if (pathExts == null) {
      return void 0;
    }
    for (const pathExt of pathExts) {
      const filePath = command + pathExt;
      if (pathMatchesSync(environment, filePath)) {
        return filePath;
      }
    }
    return void 0;
  }
  const systemInfo = getSystemInfo(command, environment);
  if (systemInfo == null) {
    return void 0;
  }
  for (const pathItem of systemInfo.pathItems) {
    const filePath = pathItem + command;
    if (systemInfo.pathExts) {
      environment.requestPermission?.(pathItem);
      for (const pathExt of systemInfo.pathExts) {
        const filePath2 = pathItem + command + pathExt;
        if (pathMatchesSync(environment, filePath2)) {
          return filePath2;
        }
      }
    } else if (pathMatchesSync(environment, filePath)) {
      return filePath;
    }
  }
  return void 0;
}
function pathMatchesSync(environment, path62) {
  try {
    return environment.statSync(path62).isFile;
  } catch (statErr) {
    if (isDenoPermissionDeniedError(statErr)) {
      throw statErr;
    }
    if (environment.isWindows && isEaccesError(statErr)) {
      return followSymlinkChainSync(environment, path62);
    }
    return false;
  }
}
function followSymlinkChainSync(environment, path62) {
  let current = path62;
  for (let hops = 0; hops < 40; hops++) {
    let info2;
    try {
      info2 = environment.lstatSync(current);
    } catch (err) {
      if (isDenoPermissionDeniedError(err)) {
        throw err;
      }
      return false;
    }
    if (info2.isFile)
      return true;
    if (!info2.isSymlink)
      return false;
    let target;
    try {
      target = environment.readLinkSync(current);
    } catch (err) {
      if (isDenoPermissionDeniedError(err)) {
        throw err;
      }
      return false;
    }
    current = resolveLinkTarget(current, target);
  }
  return false;
}
function resolveLinkTarget(linkPath, target) {
  if (isAbsolutePath(target)) {
    return target;
  }
  const sepIdx = Math.max(linkPath.lastIndexOf("/"), linkPath.lastIndexOf("\\"));
  const dir = sepIdx >= 0 ? linkPath.slice(0, sepIdx + 1) : "";
  return dir + target;
}
function isAbsolutePath(p) {
  if (p.startsWith("/") || p.startsWith("\\"))
    return true;
  return /^[A-Za-z]:[\\/]/.test(p);
}
function isEaccesError(err) {
  return err != null && typeof err === "object" && "code" in err && err.code === "EACCES";
}
function isDenoPermissionDeniedError(err) {
  const permissionDeniedError = denoGlobal?.errors?.PermissionDenied;
  return permissionDeniedError != null && err instanceof permissionDeniedError;
}
function getSystemInfo(command, environment) {
  const isWindows5 = environment.isWindows;
  const path62 = environment.env("PATH");
  const pathSeparator = isWindows5 ? "\\" : "/";
  if (path62 == null) {
    return void 0;
  }
  return {
    pathItems: splitEnvValue(path62, isWindows5).map((item) => normalizeDir(item, pathSeparator)),
    pathExts: getPathExts(command, environment),
    isNameMatch: isWindows5 ? (a, b) => a.toLowerCase() === b.toLowerCase() : (a, b) => a === b
  };
}
function getPathExts(command, environment) {
  if (!environment.isWindows) {
    return void 0;
  }
  const pathExtText = environment.env("PATHEXT") ?? ".EXE;.CMD;.BAT;.COM";
  const pathExts = splitEnvValue(pathExtText, true);
  const lowerCaseCommand = command.toLowerCase();
  for (const pathExt of pathExts) {
    if (lowerCaseCommand.endsWith(pathExt.toLowerCase())) {
      return void 0;
    }
  }
  return pathExts;
}
function commandHasPathSeparator(command, isWindows5) {
  return command.includes("/") || isWindows5 && command.includes("\\");
}
function splitEnvValue(value, isWindows5) {
  const envValueSeparator = isWindows5 ? ";" : ":";
  return value.split(envValueSeparator).map((item) => item.trim()).filter((item) => item.length > 0);
}
function normalizeDir(dirPath, pathSeparator) {
  if (!dirPath.endsWith(pathSeparator)) {
    dirPath += pathSeparator;
  }
  return dirPath;
}
function checkWindows() {
  const global = dntGlobalThis;
  const platform = global.process?.platform;
  if (typeof platform === "string")
    return platform.startsWith("win");
  const os = global.Deno?.build?.os;
  if (typeof os === "string")
    return os === "windows";
  return global.navigator?.platform?.startsWith("Win") ?? false;
}
var isWindows = checkWindows();
function assertPath(path62) {
  if (typeof path62 !== "string") {
    throw new TypeError(`Path must be a string, received "${JSON.stringify(path62)}"`);
  }
}
function stripSuffix(name, suffix) {
  if (suffix.length >= name.length) {
    return name;
  }
  const lenDiff = name.length - suffix.length;
  for (let i = suffix.length - 1; i >= 0; --i) {
    if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
      return name;
    }
  }
  return name.slice(0, -suffix.length);
}
function lastPathSegment(path62, isSep, start = 0) {
  let matchedNonSeparator = false;
  let end = path62.length;
  for (let i = path62.length - 1; i >= start; --i) {
    if (isSep(path62.charCodeAt(i))) {
      if (matchedNonSeparator) {
        start = i + 1;
        break;
      }
    } else if (!matchedNonSeparator) {
      matchedNonSeparator = true;
      end = i + 1;
    }
  }
  return path62.slice(start, end);
}
function assertArgs(path62, suffix) {
  assertPath(path62);
  if (path62.length === 0)
    return path62;
  if (typeof suffix !== "string") {
    throw new TypeError(`Suffix must be a string, received "${JSON.stringify(suffix)}"`);
  }
}
function assertArg(url) {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol !== "file:") {
    throw new TypeError(`URL must be a file URL: received "${url.protocol}"`);
  }
  return url;
}
function fromFileUrl(url) {
  url = assertArg(url);
  return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function stripTrailingSeparators(segment, isSep) {
  if (segment.length <= 1) {
    return segment;
  }
  let end = segment.length;
  for (let i = segment.length - 1; i > 0; i--) {
    if (isSep(segment.charCodeAt(i))) {
      end = i;
    } else {
      break;
    }
  }
  return segment.slice(0, end);
}
var CHAR_UPPERCASE_A = 65;
var CHAR_LOWERCASE_A = 97;
var CHAR_UPPERCASE_Z = 90;
var CHAR_LOWERCASE_Z = 122;
var CHAR_DOT = 46;
var CHAR_FORWARD_SLASH = 47;
var CHAR_BACKWARD_SLASH = 92;
var CHAR_COLON = 58;
function isPosixPathSeparator(code2) {
  return code2 === CHAR_FORWARD_SLASH;
}
function basename2(path62, suffix = "") {
  if (path62 instanceof URL) {
    path62 = fromFileUrl(path62);
  }
  assertArgs(path62, suffix);
  const lastSegment = lastPathSegment(path62, isPosixPathSeparator);
  const strippedSegment = stripTrailingSeparators(lastSegment, isPosixPathSeparator);
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function isPosixPathSeparator2(code2) {
  return code2 === CHAR_FORWARD_SLASH;
}
function isPathSeparator(code2) {
  return code2 === CHAR_FORWARD_SLASH || code2 === CHAR_BACKWARD_SLASH;
}
function isWindowsDeviceRoot(code2) {
  return code2 >= CHAR_LOWERCASE_A && code2 <= CHAR_LOWERCASE_Z || code2 >= CHAR_UPPERCASE_A && code2 <= CHAR_UPPERCASE_Z;
}
function fromFileUrl2(url) {
  url = assertArg(url);
  let path62 = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
  if (url.hostname !== "") {
    path62 = `\\\\${url.hostname}${path62}`;
  }
  return path62;
}
function basename22(path62, suffix = "") {
  if (path62 instanceof URL) {
    path62 = fromFileUrl2(path62);
  }
  assertArgs(path62, suffix);
  let start = 0;
  if (path62.length >= 2) {
    const drive = path62.charCodeAt(0);
    if (isWindowsDeviceRoot(drive)) {
      if (path62.charCodeAt(1) === CHAR_COLON)
        start = 2;
    }
  }
  const lastSegment = lastPathSegment(path62, isPathSeparator, start);
  const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function basename3(path62, suffix = "") {
  return isWindows ? basename22(path62, suffix) : basename2(path62, suffix);
}
function assertArg2(path62) {
  assertPath(path62);
  if (path62.length === 0)
    return ".";
}
function dirname2(path62) {
  if (path62 instanceof URL) {
    path62 = fromFileUrl(path62);
  }
  assertArg2(path62);
  let end = -1;
  let matchedNonSeparator = false;
  for (let i = path62.length - 1; i >= 1; --i) {
    if (isPosixPathSeparator(path62.charCodeAt(i))) {
      if (matchedNonSeparator) {
        end = i;
        break;
      }
    } else {
      matchedNonSeparator = true;
    }
  }
  if (end === -1) {
    return isPosixPathSeparator(path62.charCodeAt(0)) ? "/" : ".";
  }
  return stripTrailingSeparators(path62.slice(0, end), isPosixPathSeparator);
}
function dirname22(path62) {
  if (path62 instanceof URL) {
    path62 = fromFileUrl2(path62);
  }
  assertArg2(path62);
  const len = path62.length;
  let rootEnd = -1;
  let end = -1;
  let matchedSlash = true;
  let offset = 0;
  const code2 = path62.charCodeAt(0);
  if (len > 1) {
    if (isPathSeparator(code2)) {
      rootEnd = offset = 1;
      if (isPathSeparator(path62.charCodeAt(1))) {
        let j = 2;
        let last = j;
        for (; j < len; ++j) {
          if (isPathSeparator(path62.charCodeAt(j)))
            break;
        }
        if (j < len && j !== last) {
          last = j;
          for (; j < len; ++j) {
            if (!isPathSeparator(path62.charCodeAt(j)))
              break;
          }
          if (j < len && j !== last) {
            last = j;
            for (; j < len; ++j) {
              if (isPathSeparator(path62.charCodeAt(j)))
                break;
            }
            if (j === len) {
              return path62;
            }
            if (j !== last) {
              rootEnd = offset = j + 1;
            }
          }
        }
      }
    } else if (isWindowsDeviceRoot(code2)) {
      if (path62.charCodeAt(1) === CHAR_COLON) {
        rootEnd = offset = 2;
        if (len > 2) {
          if (isPathSeparator(path62.charCodeAt(2)))
            rootEnd = offset = 3;
        }
      }
    }
  } else if (isPathSeparator(code2)) {
    return path62;
  }
  for (let i = len - 1; i >= offset; --i) {
    if (isPathSeparator(path62.charCodeAt(i))) {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else {
      matchedSlash = false;
    }
  }
  if (end === -1) {
    if (rootEnd === -1)
      return ".";
    else
      end = rootEnd;
  }
  return stripTrailingSeparators(path62.slice(0, end), isPosixPathSeparator2);
}
function dirname3(path62) {
  return isWindows ? dirname22(path62) : dirname2(path62);
}
function extname(path62) {
  if (path62 instanceof URL) {
    path62 = fromFileUrl(path62);
  }
  assertPath(path62);
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  let preDotState = 0;
  for (let i = path62.length - 1; i >= 0; --i) {
    const code2 = path62.charCodeAt(i);
    if (isPosixPathSeparator(code2)) {
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      matchedSlash = false;
      end = i + 1;
    }
    if (code2 === CHAR_DOT) {
      if (startDot === -1)
        startDot = i;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
  preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return "";
  }
  return path62.slice(startDot, end);
}
function extname2(path62) {
  if (path62 instanceof URL) {
    path62 = fromFileUrl2(path62);
  }
  assertPath(path62);
  let start = 0;
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  let preDotState = 0;
  if (path62.length >= 2 && path62.charCodeAt(1) === CHAR_COLON && isWindowsDeviceRoot(path62.charCodeAt(0))) {
    start = startPart = 2;
  }
  for (let i = path62.length - 1; i >= start; --i) {
    const code2 = path62.charCodeAt(i);
    if (isPathSeparator(code2)) {
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      matchedSlash = false;
      end = i + 1;
    }
    if (code2 === CHAR_DOT) {
      if (startDot === -1)
        startDot = i;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1) {
      preDotState = -1;
    }
  }
  if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
  preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return "";
  }
  return path62.slice(startDot, end);
}
function extname3(path62) {
  return isWindows ? extname2(path62) : extname(path62);
}
function fromFileUrl3(url) {
  return isWindows ? fromFileUrl2(url) : fromFileUrl(url);
}
function isAbsolute4(path62) {
  assertPath(path62);
  return path62.length > 0 && isPosixPathSeparator(path62.charCodeAt(0));
}
function isAbsolute22(path62) {
  assertPath(path62);
  const len = path62.length;
  if (len === 0)
    return false;
  const code2 = path62.charCodeAt(0);
  if (isPathSeparator(code2)) {
    return true;
  } else if (isWindowsDeviceRoot(code2)) {
    if (len > 2 && path62.charCodeAt(1) === CHAR_COLON) {
      if (isPathSeparator(path62.charCodeAt(2)))
        return true;
    }
  }
  return false;
}
function isAbsolute32(path62) {
  return isWindows ? isAbsolute22(path62) : isAbsolute4(path62);
}
function assertArg4(path62) {
  assertPath(path62);
  if (path62.length === 0)
    return ".";
}
function normalizeString(path62, allowAboveRoot, separator, isPathSeparator2) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code2;
  for (let i = 0; i <= path62.length; ++i) {
    if (i < path62.length)
      code2 = path62.charCodeAt(i);
    else if (isPathSeparator2(code2))
      break;
    else
      code2 = CHAR_FORWARD_SLASH;
    if (isPathSeparator2(code2)) {
      if (lastSlash === i - 1 || dots === 1) {
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT || res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += `${separator}..`;
          else
            res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += separator + path62.slice(lastSlash + 1, i);
        else
          res = path62.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code2 === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function normalize(path62) {
  if (path62 instanceof URL) {
    path62 = fromFileUrl(path62);
  }
  assertArg4(path62);
  const isAbsolute42 = isPosixPathSeparator(path62.charCodeAt(0));
  const trailingSeparator = isPosixPathSeparator(path62.charCodeAt(path62.length - 1));
  path62 = normalizeString(path62, !isAbsolute42, "/", isPosixPathSeparator);
  if (path62.length === 0 && !isAbsolute42)
    path62 = ".";
  if (path62.length > 0 && trailingSeparator)
    path62 += "/";
  if (isAbsolute42)
    return `/${path62}`;
  return path62;
}
function join6(path62, ...paths) {
  if (path62 === void 0)
    return ".";
  if (path62 instanceof URL) {
    path62 = fromFileUrl(path62);
  }
  paths = path62 ? [
    path62,
    ...paths
  ] : paths;
  paths.forEach((path22) => assertPath(path22));
  const joined = paths.filter((path22) => path22.length > 0).join("/");
  return joined === "" ? "." : normalize(joined);
}
function normalize2(path62) {
  if (path62 instanceof URL) {
    path62 = fromFileUrl2(path62);
  }
  assertArg4(path62);
  const len = path62.length;
  let rootEnd = 0;
  let device;
  let isAbsolute42 = false;
  const code2 = path62.charCodeAt(0);
  if (len > 1) {
    if (isPathSeparator(code2)) {
      isAbsolute42 = true;
      if (isPathSeparator(path62.charCodeAt(1))) {
        let j = 2;
        let last = j;
        for (; j < len; ++j) {
          if (isPathSeparator(path62.charCodeAt(j)))
            break;
        }
        if (j < len && j !== last) {
          const firstPart = path62.slice(last, j);
          last = j;
          for (; j < len; ++j) {
            if (!isPathSeparator(path62.charCodeAt(j)))
              break;
          }
          if (j < len && j !== last) {
            last = j;
            for (; j < len; ++j) {
              if (isPathSeparator(path62.charCodeAt(j)))
                break;
            }
            if (j === len) {
              return `\\\\${firstPart}\\${path62.slice(last)}\\`;
            } else if (j !== last) {
              device = `\\\\${firstPart}\\${path62.slice(last, j)}`;
              rootEnd = j;
            }
          }
        }
      } else {
        rootEnd = 1;
      }
    } else if (isWindowsDeviceRoot(code2)) {
      if (path62.charCodeAt(1) === CHAR_COLON) {
        device = path62.slice(0, 2);
        rootEnd = 2;
        if (len > 2) {
          if (isPathSeparator(path62.charCodeAt(2))) {
            isAbsolute42 = true;
            rootEnd = 3;
          }
        }
      }
    }
  } else if (isPathSeparator(code2)) {
    return "\\";
  }
  let tail;
  if (rootEnd < len) {
    tail = normalizeString(path62.slice(rootEnd), !isAbsolute42, "\\", isPathSeparator);
  } else {
    tail = "";
  }
  if (tail.length === 0 && !isAbsolute42)
    tail = ".";
  if (tail.length > 0 && isPathSeparator(path62.charCodeAt(len - 1))) {
    tail += "\\";
  }
  if (device === void 0) {
    if (isAbsolute42) {
      if (tail.length > 0)
        return `\\${tail}`;
      else
        return "\\";
    }
    return tail;
  } else if (isAbsolute42) {
    if (tail.length > 0)
      return `${device}\\${tail}`;
    else
      return `${device}\\`;
  }
  return device + tail;
}
function join22(path62, ...paths) {
  if (path62 instanceof URL) {
    path62 = fromFileUrl2(path62);
  }
  paths = path62 ? [
    path62,
    ...paths
  ] : paths;
  paths.forEach((path22) => assertPath(path22));
  paths = paths.filter((path22) => path22.length > 0);
  if (paths.length === 0)
    return ".";
  let needsReplace = true;
  let slashCount = 0;
  const firstPart = paths[0];
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    const firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2)))
            ++slashCount;
          else {
            needsReplace = false;
          }
        }
      }
    }
  }
  let joined = paths.join("\\");
  if (needsReplace) {
    for (; slashCount < joined.length; ++slashCount) {
      if (!isPathSeparator(joined.charCodeAt(slashCount)))
        break;
    }
    if (slashCount >= 2)
      joined = `\\${joined.slice(slashCount)}`;
  }
  return normalize2(joined);
}
function join32(path62, ...paths) {
  return isWindows ? join22(path62, ...paths) : join6(path62, ...paths);
}
function normalize3(path62) {
  return isWindows ? normalize2(path62) : normalize(path62);
}
function cwd(errorMessage) {
  const global = dntGlobalThis;
  const getCwd = global.process?.cwd ?? global.Deno?.cwd;
  if (typeof getCwd !== "function") {
    throw new TypeError(errorMessage);
  }
  return getCwd();
}
function resolve5(...pathSegments) {
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    let path62;
    if (i >= 0)
      path62 = pathSegments[i];
    else {
      path62 = cwd("Resolved a relative path without a current working directory (CWD)");
    }
    assertPath(path62);
    if (path62.length === 0) {
      continue;
    }
    resolvedPath = `${path62}/${resolvedPath}`;
    resolvedAbsolute = isPosixPathSeparator(path62.charCodeAt(0));
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
  if (resolvedAbsolute) {
    if (resolvedPath.length > 0)
      return `/${resolvedPath}`;
    else
      return "/";
  } else if (resolvedPath.length > 0)
    return resolvedPath;
  else
    return ".";
}
function assertArgs2(from, to) {
  assertPath(from);
  assertPath(to);
  if (from === to)
    return "";
}
function relative2(from, to) {
  assertArgs2(from, to);
  from = resolve5(from);
  to = resolve5(to);
  if (from === to)
    return "";
  let fromStart = 1;
  const fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (!isPosixPathSeparator(from.charCodeAt(fromStart)))
      break;
  }
  const fromLen = fromEnd - fromStart;
  let toStart = 1;
  const toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (!isPosixPathSeparator(to.charCodeAt(toStart)))
      break;
  }
  const toLen = toEnd - toStart;
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i = 0;
  for (; i <= length; ++i) {
    if (i === length) {
      if (toLen > length) {
        if (isPosixPathSeparator(to.charCodeAt(toStart + i))) {
          return to.slice(toStart + i + 1);
        } else if (i === 0) {
          return to.slice(toStart + i);
        }
      } else if (fromLen > length) {
        if (isPosixPathSeparator(from.charCodeAt(fromStart + i))) {
          lastCommonSep = i;
        } else if (i === 0) {
          lastCommonSep = 0;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i);
    const toCode = to.charCodeAt(toStart + i);
    if (fromCode !== toCode)
      break;
    else if (isPosixPathSeparator(fromCode))
      lastCommonSep = i;
  }
  let out = "";
  for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
    if (i === fromEnd || isPosixPathSeparator(from.charCodeAt(i))) {
      if (out.length === 0)
        out += "..";
      else
        out += "/..";
    }
  }
  if (out.length > 0)
    return out + to.slice(toStart + lastCommonSep);
  else {
    toStart += lastCommonSep;
    if (isPosixPathSeparator(to.charCodeAt(toStart)))
      ++toStart;
    return to.slice(toStart);
  }
}
function resolve22(...pathSegments) {
  let resolvedDevice = "";
  let resolvedTail = "";
  let resolvedAbsolute = false;
  for (let i = pathSegments.length - 1; i >= -1; i--) {
    let path62;
    if (i >= 0) {
      path62 = pathSegments[i];
    } else if (!resolvedDevice) {
      path62 = cwd("Resolved a drive-letter-less path without a current working directory (CWD)");
    } else {
      path62 = cwd("Resolved a relative path without a current working directory (CWD)");
      if (path62 === void 0 || path62.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
        path62 = `${resolvedDevice}\\`;
      }
    }
    assertPath(path62);
    const len = path62.length;
    if (len === 0)
      continue;
    let rootEnd = 0;
    let device = "";
    let isAbsolute42 = false;
    const code2 = path62.charCodeAt(0);
    if (len > 1) {
      if (isPathSeparator(code2)) {
        isAbsolute42 = true;
        if (isPathSeparator(path62.charCodeAt(1))) {
          let j = 2;
          let last = j;
          for (; j < len; ++j) {
            if (isPathSeparator(path62.charCodeAt(j)))
              break;
          }
          if (j < len && j !== last) {
            const firstPart = path62.slice(last, j);
            last = j;
            for (; j < len; ++j) {
              if (!isPathSeparator(path62.charCodeAt(j)))
                break;
            }
            if (j < len && j !== last) {
              last = j;
              for (; j < len; ++j) {
                if (isPathSeparator(path62.charCodeAt(j)))
                  break;
              }
              if (j === len) {
                device = `\\\\${firstPart}\\${path62.slice(last)}`;
                rootEnd = j;
              } else if (j !== last) {
                device = `\\\\${firstPart}\\${path62.slice(last, j)}`;
                rootEnd = j;
              }
            }
          }
        } else {
          rootEnd = 1;
        }
      } else if (isWindowsDeviceRoot(code2)) {
        if (path62.charCodeAt(1) === CHAR_COLON) {
          device = path62.slice(0, 2);
          rootEnd = 2;
          if (len > 2) {
            if (isPathSeparator(path62.charCodeAt(2))) {
              isAbsolute42 = true;
              rootEnd = 3;
            }
          }
        }
      }
    } else if (isPathSeparator(code2)) {
      rootEnd = 1;
      isAbsolute42 = true;
    }
    if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
      continue;
    }
    if (resolvedDevice.length === 0 && device.length > 0) {
      resolvedDevice = device;
    }
    if (!resolvedAbsolute) {
      resolvedTail = `${path62.slice(rootEnd)}\\${resolvedTail}`;
      resolvedAbsolute = isAbsolute42;
    }
    if (resolvedAbsolute && resolvedDevice.length > 0)
      break;
  }
  resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
  return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function relative22(from, to) {
  assertArgs2(from, to);
  const fromOrig = resolve22(from);
  const toOrig = resolve22(to);
  if (fromOrig === toOrig)
    return "";
  from = fromOrig.toLowerCase();
  to = toOrig.toLowerCase();
  if (from === to)
    return "";
  let fromStart = 0;
  let fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (from.charCodeAt(fromStart) !== CHAR_BACKWARD_SLASH)
      break;
  }
  for (; fromEnd - 1 > fromStart; --fromEnd) {
    if (from.charCodeAt(fromEnd - 1) !== CHAR_BACKWARD_SLASH)
      break;
  }
  const fromLen = fromEnd - fromStart;
  let toStart = 0;
  let toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (to.charCodeAt(toStart) !== CHAR_BACKWARD_SLASH)
      break;
  }
  for (; toEnd - 1 > toStart; --toEnd) {
    if (to.charCodeAt(toEnd - 1) !== CHAR_BACKWARD_SLASH)
      break;
  }
  const toLen = toEnd - toStart;
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i = 0;
  for (; i <= length; ++i) {
    if (i === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i) === CHAR_BACKWARD_SLASH) {
          return toOrig.slice(toStart + i + 1);
        } else if (i === 2) {
          return toOrig.slice(toStart + i);
        }
      }
      if (fromLen > length) {
        if (from.charCodeAt(fromStart + i) === CHAR_BACKWARD_SLASH) {
          lastCommonSep = i;
        } else if (i === 2) {
          lastCommonSep = 3;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i);
    const toCode = to.charCodeAt(toStart + i);
    if (fromCode !== toCode)
      break;
    else if (fromCode === CHAR_BACKWARD_SLASH)
      lastCommonSep = i;
  }
  if (i !== length && lastCommonSep === -1) {
    return toOrig;
  }
  let out = "";
  if (lastCommonSep === -1)
    lastCommonSep = 0;
  for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
    if (i === fromEnd || from.charCodeAt(i) === CHAR_BACKWARD_SLASH) {
      if (out.length === 0)
        out += "..";
      else
        out += "\\..";
    }
  }
  if (out.length > 0) {
    return out + toOrig.slice(toStart + lastCommonSep, toEnd);
  } else {
    toStart += lastCommonSep;
    if (toOrig.charCodeAt(toStart) === CHAR_BACKWARD_SLASH)
      ++toStart;
    return toOrig.slice(toStart, toEnd);
  }
}
function relative3(from, to) {
  return isWindows ? relative22(from, to) : relative2(from, to);
}
function resolve32(...pathSegments) {
  return isWindows ? resolve22(...pathSegments) : resolve5(...pathSegments);
}
var WHITESPACE_ENCODINGS = {
  "	": "%09",
  "\n": "%0A",
  "\v": "%0B",
  "\f": "%0C",
  "\r": "%0D",
  " ": "%20"
};
function encodeWhitespace(string) {
  return string.replaceAll(/[\s]/g, (c) => {
    return WHITESPACE_ENCODINGS[c] ?? c;
  });
}
function toFileUrl(path62) {
  if (!isAbsolute4(path62)) {
    throw new TypeError(`Path must be absolute: received "${path62}"`);
  }
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(path62.replace(/%/g, "%25").replace(/\\/g, "%5C"));
  return url;
}
function toFileUrl2(path62) {
  if (!isAbsolute22(path62)) {
    throw new TypeError(`Path must be absolute: received "${path62}"`);
  }
  const [, hostname, pathname] = path62.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
  const url = new URL("file:///");
  url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
  if (hostname !== void 0 && hostname !== "localhost") {
    url.hostname = hostname;
    if (!url.hostname) {
      throw new TypeError(`Invalid hostname: "${url.hostname}"`);
    }
  }
  return url;
}
function toFileUrl3(path62) {
  return isWindows ? toFileUrl2(path62) : toFileUrl(path62);
}
function isNotFoundError(err) {
  return err?.code === "ENOENT";
}
function createNotFoundError(message) {
  const err = new Error(message);
  err.code = "ENOENT";
  return err;
}
function isWindows2() {
  return process.platform === "win32";
}
var FsFile = class {
  /** @internal */
  _fd;
  /** @internal */
  constructor(fd) {
    this._fd = fd;
  }
  /** Writes data to the file, resolving to the number of bytes written.
   *
   * Strings are encoded as UTF-8.
   */
  write(data) {
    const bytes3 = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return new Promise((resolve8, reject) => {
      import_node_fs.default.write(this._fd, bytes3, 0, bytes3.length, null, (err, written) => {
        if (err)
          reject(err);
        else
          resolve8(written);
      });
    });
  }
  /** Synchronously writes data to the file, returning the number of bytes written.
   *
   * Strings are encoded as UTF-8.
   */
  writeSync(data) {
    const bytes3 = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return import_node_fs.default.writeSync(this._fd, bytes3, 0, bytes3.length);
  }
  /** Reads into `buf`, resolving to the number of bytes read (0 at EOF). */
  read(buf) {
    return new Promise((resolve8, reject) => {
      import_node_fs.default.read(this._fd, buf, 0, buf.length, null, (err, bytesRead) => {
        if (err)
          reject(err);
        else
          resolve8(bytesRead);
      });
    });
  }
  /** Synchronously reads into `buf`, returning the number of bytes read (0 at EOF). */
  readSync(buf) {
    return import_node_fs.default.readSync(this._fd, buf, 0, buf.length, null);
  }
  /** Closes the file handle. */
  close() {
    import_node_fs.default.closeSync(this._fd);
  }
  /** A writable stream that writes to this file. */
  get writable() {
    const fd = this._fd;
    return new import_web2.WritableStream({
      write(chunk) {
        return new Promise((resolve8, reject) => {
          import_node_fs.default.write(fd, chunk, 0, chunk.length, null, (err) => {
            if (err)
              reject(err);
            else
              resolve8();
          });
        });
      }
    });
  }
  /** A readable stream that reads from this file. */
  get readable() {
    const fd = this._fd;
    return new import_web2.ReadableStream({
      pull(controller) {
        return new Promise((resolve8, reject) => {
          const buf = new Uint8Array(16384);
          import_node_fs.default.read(fd, buf, 0, buf.length, null, (err, bytesRead) => {
            if (err) {
              reject(err);
              return;
            }
            if (bytesRead === 0) {
              controller.close();
            } else {
              controller.enqueue(buf.subarray(0, bytesRead));
            }
            resolve8();
          });
        });
      }
    });
  }
};
function stat(path62) {
  return import_promises.default.stat(path62);
}
function statSync(path62) {
  return import_node_fs.default.statSync(path62);
}
function lstat(path62) {
  return import_promises.default.lstat(path62);
}
function lstatSync(path62) {
  return import_node_fs.default.lstatSync(path62);
}
function realPath(path62) {
  return import_promises.default.realpath(path62);
}
function realPathSync(path62) {
  return import_node_fs.default.realpathSync(path62);
}
async function mkdirFn(path62, options) {
  await import_promises.default.mkdir(path62, options);
}
function mkdirSyncFn(path62, options) {
  import_node_fs.default.mkdirSync(path62, options);
}
async function linkFn(oldPath, newPath) {
  await import_promises.default.link(oldPath, newPath);
}
function linkSyncFn(oldPath, newPath) {
  import_node_fs.default.linkSync(oldPath, newPath);
}
async function symlinkFn(target, path62, type) {
  await import_promises.default.symlink(target, path62, type?.type);
}
function symlinkSyncFn(target, path62, type) {
  import_node_fs.default.symlinkSync(target, path62, type?.type);
}
async function* readDir(path62) {
  const entries = await import_promises.default.readdir(path62, { withFileTypes: true });
  yield* entries;
}
function* readDirSync(path62) {
  yield* import_node_fs.default.readdirSync(path62, { withFileTypes: true });
}
async function readFile(path62, options) {
  return new Uint8Array(await import_promises.default.readFile(path62, { signal: options?.signal }));
}
function readFileSync(path62) {
  return new Uint8Array(import_node_fs.default.readFileSync(path62));
}
function readTextFile(path62, options) {
  return import_promises.default.readFile(path62, {
    encoding: "utf8",
    signal: options?.signal
  });
}
function readTextFileSync(path62) {
  return import_node_fs.default.readFileSync(path62, "utf8");
}
async function chmod(path62, mode) {
  await import_promises.default.chmod(path62, mode);
}
function chmodSync(path62, mode) {
  import_node_fs.default.chmodSync(path62, mode);
}
async function chown(path62, uid, gid) {
  await import_promises.default.chown(path62, uid ?? -1, gid ?? -1);
}
function chownSync(path62, uid, gid) {
  import_node_fs.default.chownSync(path62, uid ?? -1, gid ?? -1);
}
function openFile(path62, options) {
  return new Promise((resolve8, reject) => {
    import_node_fs.default.open(path62, openOptionsToFlags(options), options?.mode, (err, fd) => {
      if (err)
        reject(err);
      else
        resolve8(new FsFile(fd));
    });
  });
}
function openFileSync(path62, options) {
  const fd = import_node_fs.default.openSync(path62, openOptionsToFlags(options), options?.mode);
  return new FsFile(fd);
}
function createFile(path62) {
  return openFile(path62, {
    write: true,
    create: true,
    truncate: true,
    read: true
  });
}
function createFileSync(path62) {
  return openFileSync(path62, {
    write: true,
    create: true,
    truncate: true,
    read: true
  });
}
async function remove(path62, options) {
  if (options?.recursive) {
    await import_promises.default.rm(path62, { recursive: true });
    return;
  }
  const info2 = await import_promises.default.lstat(path62);
  if (info2.isDirectory()) {
    await import_promises.default.rmdir(path62);
  } else {
    await import_promises.default.unlink(path62);
  }
}
function removeSync(path62, options) {
  if (options?.recursive) {
    import_node_fs.default.rmSync(path62, { recursive: true });
    return;
  }
  const info2 = import_node_fs.default.lstatSync(path62);
  if (info2.isDirectory()) {
    import_node_fs.default.rmdirSync(path62);
  } else {
    import_node_fs.default.unlinkSync(path62);
  }
}
async function copyFileFn(src, dest) {
  await import_promises.default.copyFile(src, dest);
}
function copyFileSyncFn(src, dest) {
  import_node_fs.default.copyFileSync(src, dest);
}
async function renameFn(oldPath, newPath) {
  await import_promises.default.rename(oldPath, newPath);
}
function renameSyncFn(oldPath, newPath) {
  import_node_fs.default.renameSync(oldPath, newPath);
}
async function ensureDir(path62) {
  await mkdirFn(path62, { recursive: true });
}
function ensureDirSync(path62) {
  mkdirSyncFn(path62, { recursive: true });
}
async function ensureFile(path62) {
  const info2 = await lstatOrUndefined(path62);
  if (info2 != null) {
    if (info2.isFile())
      return;
    throw new Error(`Path '${path62}' already exists and is not a file.`);
  }
  await mkdirFn((0, import_node_path.dirname)(path62), { recursive: true });
  (await createFile(path62)).close();
}
function ensureFileSync(path62) {
  const info2 = lstatOrUndefinedSync(path62);
  if (info2 != null) {
    if (info2.isFile())
      return;
    throw new Error(`Path '${path62}' already exists and is not a file.`);
  }
  mkdirSyncFn((0, import_node_path.dirname)(path62), { recursive: true });
  createFileSync(path62).close();
}
async function emptyDir(path62) {
  try {
    const entries = [];
    for await (const entry of readDir(path62)) {
      entries.push(entry);
    }
    for (const entry of entries) {
      await remove((0, import_node_path.join)(path62, entry.name), { recursive: true });
    }
  } catch (err) {
    if (!isNotFoundError(err))
      throw err;
    await mkdirFn(path62, { recursive: true });
  }
}
function emptyDirSync(path62) {
  try {
    const entries = [...readDirSync(path62)];
    for (const entry of entries) {
      removeSync((0, import_node_path.join)(path62, entry.name), { recursive: true });
    }
  } catch (err) {
    if (!isNotFoundError(err))
      throw err;
    mkdirSyncFn(path62, { recursive: true });
  }
}
async function copy(src, dest, options) {
  const overwrite = options?.overwrite ?? false;
  const srcInfo = await stat(src);
  await copyRecursive(src, dest, srcInfo, overwrite);
}
function copySync(src, dest, options) {
  const overwrite = options?.overwrite ?? false;
  const srcInfo = statSync(src);
  copyRecursiveSync(src, dest, srcInfo, overwrite);
}
async function copyRecursive(src, dest, srcInfo, overwrite) {
  let destInfo = await lstatOrUndefined(dest);
  if (destInfo != null && !overwrite) {
    throw new Error(`'${dest}' already exists.`);
  }
  if (srcInfo.isDirectory()) {
    if (destInfo != null && !destInfo.isDirectory()) {
      await remove(dest);
      destInfo = void 0;
    }
    if (destInfo == null) {
      await mkdirFn(dest, { recursive: true });
    }
    for await (const entry of readDir(src)) {
      const srcChild = (0, import_node_path.join)(src, entry.name);
      const destChild = (0, import_node_path.join)(dest, entry.name);
      const childInfo = await stat(srcChild);
      await copyRecursive(srcChild, destChild, childInfo, overwrite);
    }
  } else {
    if (destInfo != null && destInfo.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with file '${src}'.`);
    }
    await copyFileFn(src, dest);
  }
}
function copyRecursiveSync(src, dest, srcInfo, overwrite) {
  let destInfo = lstatOrUndefinedSync(dest);
  if (destInfo != null && !overwrite) {
    throw new Error(`'${dest}' already exists.`);
  }
  if (srcInfo.isDirectory()) {
    if (destInfo != null && !destInfo.isDirectory()) {
      removeSync(dest);
      destInfo = void 0;
    }
    if (destInfo == null) {
      mkdirSyncFn(dest, { recursive: true });
    }
    for (const entry of readDirSync(src)) {
      const srcChild = (0, import_node_path.join)(src, entry.name);
      const destChild = (0, import_node_path.join)(dest, entry.name);
      const childInfo = statSync(srcChild);
      copyRecursiveSync(srcChild, destChild, childInfo, overwrite);
    }
  } else {
    if (destInfo != null && destInfo.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with file '${src}'.`);
    }
    copyFileSyncFn(src, dest);
  }
}
async function lstatOrUndefined(path62) {
  try {
    return await lstat(path62);
  } catch (err) {
    if (isNotFoundError(err))
      return void 0;
    throw err;
  }
}
function lstatOrUndefinedSync(path62) {
  try {
    return lstatSync(path62);
  } catch (err) {
    if (isNotFoundError(err))
      return void 0;
    throw err;
  }
}
function openOptionsToFlags(options) {
  const C = import_node_fs.default.constants;
  if (!options)
    return C.O_RDONLY;
  const { read: read2, write: write2, append, truncate, create: create2, createNew } = options;
  const needsWrite = write2 || append || create2 || createNew;
  let flags;
  if (read2 && needsWrite)
    flags = C.O_RDWR;
  else if (needsWrite)
    flags = C.O_WRONLY;
  else
    flags = C.O_RDONLY;
  if (append)
    flags |= C.O_APPEND;
  if (truncate)
    flags |= C.O_TRUNC;
  if (createNew)
    flags |= C.O_CREAT | C.O_EXCL;
  else if (create2)
    flags |= C.O_CREAT;
  return flags;
}
var Path = class _Path {
  #path;
  #knownResolved = false;
  /** This is a special symbol that allows different versions of
   * `Path` API to match on `instanceof` checks. Ideally
   * people shouldn't be mixing versions, but if it happens then
   * this will maybe reduce some bugs.
   * @internal
   */
  static instanceofSymbol = /* @__PURE__ */ Symbol.for("@david/path.Path");
  /** Creates a new path from the provided string, URL, or another Path. */
  constructor(path62) {
    if (path62 instanceof URL) {
      this.#path = fromFileUrl3(path62);
    } else if (path62 instanceof _Path) {
      this.#path = path62.toString();
    } else if (typeof path62 === "string") {
      if (path62.startsWith("file://")) {
        this.#path = fromFileUrl3(path62);
      } else {
        this.#path = path62;
      }
    } else {
      throw new Error(`Invalid path argument: ${path62}

Provide a URL, string, or another Path.`);
    }
  }
  /** @internal */
  static [Symbol.hasInstance](instance) {
    return instance?.constructor?.instanceofSymbol === _Path.instanceofSymbol;
  }
  /** @internal */
  [/* @__PURE__ */ Symbol.for("Deno.customInspect")]() {
    return `Path("${this.#path}")`;
  }
  /** @internal */
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return `Path("${this.#path}")`;
  }
  /** Gets the string representation of this path. */
  toString() {
    return this.#path;
  }
  /** Resolves the path and gets the file URL. */
  toFileUrl() {
    const resolvedPath = this.resolve();
    return toFileUrl3(resolvedPath.toString());
  }
  /** If this path reference is the same as another one. */
  equals(otherPath) {
    return this.resolve().toString() === otherPath.resolve().toString();
  }
  /** Follows symlinks and gets if this path is a directory. */
  isDirSync() {
    return this.statSync()?.isDirectory() ?? false;
  }
  /** Follows symlinks and gets if this path is a file. */
  isFileSync() {
    return this.statSync()?.isFile() ?? false;
  }
  /** Gets if this path is a symlink. */
  isSymlinkSync() {
    return this.lstatSync()?.isSymbolicLink() ?? false;
  }
  /** Gets if this path is an absolute path. */
  isAbsolute() {
    return isAbsolute32(this.#path);
  }
  /** Gets if this path is relative. */
  isRelative() {
    return !this.isAbsolute();
  }
  /** Joins the provided path segments onto this path. */
  join(...pathSegments) {
    return new _Path(join32(this.#path, ...pathSegments));
  }
  /** Resolves this path to an absolute path along with the provided path segments. */
  resolve(...pathSegments) {
    if (this.#knownResolved && pathSegments.length === 0) {
      return this;
    }
    const resolvedPath = resolve32(this.#path, ...pathSegments);
    if (pathSegments.length === 0 && resolvedPath === this.#path) {
      this.#knownResolved = true;
      return this;
    } else {
      const pathRef = new _Path(resolvedPath);
      pathRef.#knownResolved = true;
      return pathRef;
    }
  }
  /**
   * Normalizes the `path`, resolving `'..'` and `'.'` segments.
   * Note that resolving these segments does not necessarily mean that all will be eliminated.
   * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
   */
  normalize() {
    return new _Path(normalize3(this.#path));
  }
  /** Resolves the file info of this path following symlinks. */
  async stat() {
    try {
      return await stat(this.#path);
    } catch (err) {
      if (isNotFoundError(err)) {
        return void 0;
      } else {
        throw err;
      }
    }
  }
  /** Synchronously resolves the file info of this path following symlinks. */
  statSync() {
    try {
      return statSync(this.#path);
    } catch (err) {
      if (isNotFoundError(err)) {
        return void 0;
      } else {
        throw err;
      }
    }
  }
  /** Resolves the file info of this path without following symlinks. */
  async lstat() {
    try {
      return await lstat(this.#path);
    } catch (err) {
      if (isNotFoundError(err)) {
        return void 0;
      } else {
        throw err;
      }
    }
  }
  /** Synchronously resolves the file info of this path without following symlinks. */
  lstatSync() {
    try {
      return lstatSync(this.#path);
    } catch (err) {
      if (isNotFoundError(err)) {
        return void 0;
      } else {
        throw err;
      }
    }
  }
  /**
   * Gets the directory path. In most cases, it is recommended
   * to use `.parent()` instead since it will give you a `PathRef`.
   */
  dirname() {
    return dirname3(this.#path);
  }
  /** Gets the file or directory name of the path. */
  basename() {
    return basename3(this.#path);
  }
  /** Resolves the path getting all its ancestor directories in order. */
  *ancestors() {
    let ancestor = this.parent();
    while (ancestor != null) {
      yield ancestor;
      ancestor = ancestor.parent();
    }
  }
  /** Iterates over the components of a path. */
  *components() {
    const path62 = this.normalize();
    let last_index = 0;
    if (path62.#path.startsWith("\\\\?\\")) {
      last_index = nextSlash(path62.#path, 4);
      if (last_index === -1) {
        yield path62.#path;
        return;
      } else {
        yield path62.#path.substring(0, last_index);
        last_index += 1;
      }
    } else if (path62.#path.startsWith("/")) {
      last_index += 1;
    }
    while (true) {
      const index = nextSlash(path62.#path, last_index);
      if (index < 0) {
        const part = path62.#path.substring(last_index);
        if (part.length > 0) {
          yield part;
        }
        return;
      }
      yield path62.#path.substring(last_index, index);
      last_index = index + 1;
    }
    function nextSlash(path7, start) {
      for (let i = start; i < path7.length; i++) {
        const c = path7.charCodeAt(i);
        if (c === 47 || c === 92) {
          return i;
        }
      }
      return -1;
    }
  }
  // This is private because this doesn't handle stuff like `\\?\` at the start
  // so it's only used internally with #endsWith for perf. API consumers should
  // use .components()
  *#rcomponents() {
    const path62 = this.normalize();
    let last_index = void 0;
    while (last_index == null || last_index > 0) {
      const index = nextSlash(path62.#path, last_index == null ? void 0 : last_index - 1);
      if (index < 0) {
        const part2 = path62.#path.substring(0, last_index);
        if (part2.length > 0) {
          yield part2;
        }
        return;
      }
      const part = path62.#path.substring(index + 1, last_index);
      if (last_index != null || part.length > 0) {
        yield part;
      }
      last_index = index;
    }
    function nextSlash(path7, start) {
      for (let i = start ?? path7.length - 1; i >= 0; i--) {
        const c = path7.charCodeAt(i);
        if (c === 47 || c === 92) {
          return i;
        }
      }
      return -1;
    }
  }
  /** Gets if the provided path starts with the specified Path, URL, or string.
   *
   * This verifies based on matching the components.
   *
   * ```
   * assert(new Path("/a/b/c").startsWith("/a/b"));
   * assert(!new Path("/example").endsWith("/exam"));
   * ```
   */
  startsWith(path62) {
    const startsWithComponents = ensurePath(path62).components();
    for (const component of this.components()) {
      const next = startsWithComponents.next();
      if (next.done) {
        return true;
      }
      if (next.value !== component) {
        return false;
      }
    }
    return startsWithComponents.next().done ?? true;
  }
  /** Gets if the provided path ends with the specified Path, URL, or string.
   *
   * This verifies based on matching the components.
   *
   * ```
   * assert(new Path("/a/b/c").endsWith("b/c"));
   * assert(!new Path("/a/b/example").endsWith("ple"));
   * ```
   */
  endsWith(path62) {
    const endsWithComponents = ensurePath(path62).#rcomponents();
    for (const component of this.#rcomponents()) {
      const next = endsWithComponents.next();
      if (next.done) {
        return true;
      }
      if (next.value !== component) {
        return false;
      }
    }
    return endsWithComponents.next().done ?? true;
  }
  /** Gets the parent directory or returns undefined if the parent is the root directory. */
  parent() {
    const resolvedPath = this.resolve();
    const dirname6 = resolvedPath.dirname();
    if (dirname6 === resolvedPath.#path) {
      return void 0;
    } else {
      return new _Path(dirname6);
    }
  }
  /** Gets the parent or throws if the current directory was the root. */
  parentOrThrow() {
    const parent = this.parent();
    if (parent == null) {
      throw new Error(`Cannot get the parent directory of '${this.#path}'.`);
    }
    return parent;
  }
  /**
   * Returns the extension of the path with leading period or undefined
   * if there is no extension.
   */
  extname() {
    const extName = extname3(this.#path);
    return extName.length === 0 ? void 0 : extName;
  }
  /** Gets a new path reference with the provided extension. */
  withExtname(ext) {
    const currentExt = this.extname();
    const hasLeadingPeriod = ext.charCodeAt(0) === /* period */
    46;
    if (!hasLeadingPeriod && ext.length !== 0) {
      ext = "." + ext;
    }
    return new _Path(this.#path.substring(0, this.#path.length - (currentExt?.length ?? 0)) + ext);
  }
  /** Gets a new path reference with the provided file or directory name. */
  withBasename(basename5) {
    const currentBaseName = this.basename();
    return new _Path(this.#path.substring(0, this.#path.length - currentBaseName.length) + basename5);
  }
  /** Gets the relative path from this path to the specified path. */
  relative(to) {
    const toPathRef = ensurePath(to);
    return relative3(this.resolve().#path, toPathRef.resolve().toString());
  }
  /** Gets if the path exists. Beware of TOCTOU issues. */
  exists() {
    return this.lstat().then((info2) => info2 != null);
  }
  /** Synchronously gets if the path exists. Beware of TOCTOU issues. */
  existsSync() {
    return this.lstatSync() != null;
  }
  /** Resolves to the absolute normalized path, with symbolic links resolved. */
  realPath() {
    return realPath(this.#path).then((path62) => new _Path(path62));
  }
  /** Synchronously resolves to the absolute normalized path, with symbolic links resolved. */
  realPathSync() {
    return new _Path(realPathSync(this.#path));
  }
  /** Creates a directory at this path.
   * @remarks By default, this is recursive.
   */
  async mkdir(options) {
    await mkdirFn(this.#path, {
      recursive: true,
      ...options
    });
    return this;
  }
  /** Synchronously creates a directory at this path.
   * @remarks By default, this is recursive.
   */
  mkdirSync(options) {
    mkdirSyncFn(this.#path, {
      recursive: true,
      ...options
    });
    return this;
  }
  async symlinkTo(target, opts) {
    await createSymlink(this.#resolveCreateSymlinkOpts(target, opts));
  }
  symlinkToSync(target, opts) {
    createSymlinkSync(this.#resolveCreateSymlinkOpts(target, opts));
  }
  #resolveCreateSymlinkOpts(target, opts) {
    if (opts?.kind == null) {
      if (typeof target === "string") {
        return {
          fromPath: this.resolve(),
          targetPath: ensurePath(target),
          text: target,
          type: opts?.type
        };
      } else {
        throw new Error("Please specify if this symlink is absolute or relative. Otherwise provide the target text.");
      }
    }
    const targetPath = ensurePath(target).resolve();
    if (opts?.kind === "relative") {
      const fromPath = this.resolve();
      const relativePath = fromPath.parentOrThrow().relative(targetPath);
      return {
        fromPath,
        targetPath,
        text: relativePath,
        type: opts?.type
      };
    } else {
      return {
        fromPath: this.resolve(),
        targetPath,
        text: targetPath.toString(),
        type: opts?.type
      };
    }
  }
  /**
   * Creates a hardlink to the provided target path.
   */
  async linkTo(targetPath) {
    const targetPathRef = ensurePath(targetPath).resolve();
    await linkFn(targetPathRef.toString(), this.resolve().toString());
  }
  /**
   * Synchronously creates a hardlink to the provided target path.
   */
  linkToSync(targetPath) {
    const targetPathRef = ensurePath(targetPath).resolve();
    linkSyncFn(targetPathRef.toString(), this.resolve().toString());
  }
  /** Reads the entries in the directory. */
  async *readDir() {
    const dir = this.resolve();
    for await (const entry of readDir(dir.#path)) {
      const out = entry;
      out.path = dir.join(entry.name);
      yield out;
    }
  }
  /** Synchronously reads the entries in the directory. */
  *readDirSync() {
    const dir = this.resolve();
    for (const entry of readDirSync(dir.#path)) {
      const out = entry;
      out.path = dir.join(entry.name);
      yield out;
    }
  }
  /** Reads only the directory file paths, not including symlinks. */
  async *readDirFilePaths() {
    const dir = this.resolve();
    for await (const entry of readDir(dir.#path)) {
      if (entry.isFile()) {
        yield dir.join(entry.name);
      }
    }
  }
  /** Synchronously reads only the directory file paths, not including symlinks. */
  *readDirFilePathsSync() {
    const dir = this.resolve();
    for (const entry of readDirSync(dir.#path)) {
      if (entry.isFile()) {
        yield dir.join(entry.name);
      }
    }
  }
  /** Reads the bytes from the file. */
  readBytes(options) {
    return readFile(this.#path, options);
  }
  /** Synchronously reads the bytes from the file. */
  readBytesSync() {
    return readFileSync(this.#path);
  }
  /** Calls `.readBytes()`, but returns undefined if the path doesn't exist. */
  readMaybeBytes(options) {
    return notFoundToUndefined(() => this.readBytes(options));
  }
  /** Calls `.readBytesSync()`, but returns undefined if the path doesn't exist. */
  readMaybeBytesSync() {
    return notFoundToUndefinedSync(() => this.readBytesSync());
  }
  /** Reads the text from the file. */
  readText(options) {
    return readTextFile(this.#path, options);
  }
  /** Synchronously reads the text from the file. */
  readTextSync() {
    return readTextFileSync(this.#path);
  }
  /** Calls `.readText()`, but returns undefined when the path doesn't exist.
   * @remarks This still errors for other kinds of errors reading a file.
   */
  readMaybeText(options) {
    return notFoundToUndefined(() => this.readText(options));
  }
  /** Calls `.readTextSync()`, but returns undefined when the path doesn't exist.
   * @remarks This still errors for other kinds of errors reading a file.
   */
  readMaybeTextSync() {
    return notFoundToUndefinedSync(() => this.readTextSync());
  }
  /** Reads the file's text and returns an array of its lines.
   *
   * Lines are split at `\n` or `\r\n`. Line terminators are not included.
   * A trailing blank line caused by a final line ending is excluded (matches
   * [Rust's `str::lines`](https://doc.rust-lang.org/std/primitive.str.html#method.lines)).
   */
  async lines(options) {
    return [...splitLines(await this.readText(options))];
  }
  /** Synchronously reads the file's text and returns an array of its lines.
   *
   * See `.lines()` for the splitting semantics.
   */
  linesSync() {
    return [...splitLines(this.readTextSync())];
  }
  /** Streams the file and iterates over its lines without loading it all into memory.
   *
   * See `.lines()` for the splitting semantics.
   */
  async *linesIter(options) {
    const file = await openFile(this.#path, { read: true });
    try {
      const decoder2 = new import_node_util2.TextDecoder();
      const chunk = new Uint8Array(16384);
      let buffer = "";
      while (true) {
        options?.signal?.throwIfAborted();
        const n = await file.read(chunk);
        if (n === 0)
          break;
        buffer += decoder2.decode(chunk.subarray(0, n), { stream: true });
        let start = 0;
        while (true) {
          const nl = buffer.indexOf("\n", start);
          if (nl === -1)
            break;
          const end = nl > start && buffer.charCodeAt(nl - 1) === 13 ? nl - 1 : nl;
          yield buffer.substring(start, end);
          start = nl + 1;
        }
        if (start > 0)
          buffer = buffer.substring(start);
      }
      buffer += decoder2.decode();
      if (buffer !== "")
        yield buffer;
    } finally {
      try {
        file.close();
      } catch {
      }
    }
  }
  /** Synchronously streams the file and iterates over its lines without
   * loading it all into memory.
   *
   * See `.lines()` for the splitting semantics.
   */
  *linesIterSync() {
    const file = openFileSync(this.#path, { read: true });
    try {
      const decoder2 = new import_node_util2.TextDecoder();
      const chunk = new Uint8Array(16384);
      let buffer = "";
      while (true) {
        const n = file.readSync(chunk);
        if (n === 0)
          break;
        buffer += decoder2.decode(chunk.subarray(0, n), { stream: true });
        let start = 0;
        while (true) {
          const nl = buffer.indexOf("\n", start);
          if (nl === -1)
            break;
          const end = nl > start && buffer.charCodeAt(nl - 1) === 13 ? nl - 1 : nl;
          yield buffer.substring(start, end);
          start = nl + 1;
        }
        if (start > 0)
          buffer = buffer.substring(start);
      }
      buffer += decoder2.decode();
      if (buffer !== "")
        yield buffer;
    } finally {
      try {
        file.close();
      } catch {
      }
    }
  }
  /** Reads and parses the file as JSON, throwing if it doesn't exist or is not valid JSON. */
  async readJson(options) {
    return this.#parseJson(await this.readText(options));
  }
  /** Synchronously reads and parses the file as JSON, throwing if it doesn't
   * exist or is not valid JSON. */
  readJsonSync() {
    return this.#parseJson(this.readTextSync());
  }
  #parseJson(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Failed parsing JSON in '${this.toString()}'.`, {
        cause: err
      });
    }
  }
  /**
   * Calls `.readJson()`, but returns undefined if the file doesn't exist.
   * @remarks This method will still throw if the file cannot be parsed as JSON.
   */
  readMaybeJson(options) {
    return notFoundToUndefined(() => this.readJson(options));
  }
  /**
   * Calls `.readJsonSync()`, but returns undefined if the file doesn't exist.
   * @remarks This method will still throw if the file cannot be parsed as JSON.
   */
  readMaybeJsonSync() {
    return notFoundToUndefinedSync(() => this.readJsonSync());
  }
  /** Writes out the provided bytes or text to the file.
   *
   * Strings are encoded as UTF-8.
   */
  async write(data, options) {
    const bytes3 = typeof data === "string" ? new TextEncoder().encode(data) : data;
    await this.#withFileForWriting(options, (file) => {
      return writeAll(file, bytes3, options?.signal);
    });
    return this;
  }
  /** Synchronously writes out the provided bytes or text to the file.
   *
   * Strings are encoded as UTF-8.
   */
  writeSync(data, options) {
    const bytes3 = typeof data === "string" ? new TextEncoder().encode(data) : data;
    this.#withFileForWritingSync(options, (file) => {
      writeAllSync(file, bytes3, options?.signal);
    });
    return this;
  }
  /** Writes the provided text to the file.
   * @deprecated Use `.write(text)` instead — `write` now accepts strings.
   */
  writeText(text, options) {
    return this.write(text, options);
  }
  /** Synchronously writes the provided text to the file.
   * @deprecated Use `.writeSync(text)` instead — `writeSync` now accepts strings.
   */
  writeTextSync(text, options) {
    return this.writeSync(text, options);
  }
  /** Writes out the provided object as compact JSON. */
  async writeJson(obj, options) {
    await this.write(JSON.stringify(obj) + "\n", options);
    return this;
  }
  /** Synchronously writes out the provided object as compact JSON. */
  writeJsonSync(obj, options) {
    this.writeSync(JSON.stringify(obj) + "\n", options);
    return this;
  }
  /** Writes out the provided object as formatted JSON. */
  async writeJsonPretty(obj, options) {
    await this.write(JSON.stringify(obj, void 0, 2) + "\n", options);
    return this;
  }
  /** Synchronously writes out the provided object as formatted JSON. */
  writeJsonPrettySync(obj, options) {
    this.writeSync(JSON.stringify(obj, void 0, 2) + "\n", options);
    return this;
  }
  /** Appends the provided bytes or text to the file.
   *
   * Strings are encoded as UTF-8.
   */
  async append(data, options) {
    const bytes3 = typeof data === "string" ? new TextEncoder().encode(data) : data;
    await this.#withFileForAppending(options, (file) => writeAll(file, bytes3, options?.signal));
    return this;
  }
  /** Synchronously appends the provided bytes or text to the file.
   *
   * Strings are encoded as UTF-8.
   */
  appendSync(data, options) {
    const bytes3 = typeof data === "string" ? new TextEncoder().encode(data) : data;
    this.#withFileForAppendingSync(options, (file) => {
      writeAllSync(file, bytes3, options?.signal);
    });
    return this;
  }
  #withFileForAppending(options, action) {
    return this.#withFileForWriting({
      append: true,
      ...options
    }, action);
  }
  async #withFileForWriting(options, action) {
    const file = await this.#openFileMaybeCreatingDirectory({
      write: true,
      create: true,
      truncate: options?.append !== true,
      ...options
    });
    try {
      return await action(file);
    } finally {
      try {
        file.close();
      } catch {
      }
    }
  }
  /** Opens a file, but handles if the directory does not exist. */
  async #openFileMaybeCreatingDirectory(options) {
    const resolvedPath = this.resolve();
    try {
      return await resolvedPath.open(options);
    } catch (err) {
      if (isNotFoundError(err)) {
        const parent = resolvedPath.parent();
        if (parent != null) {
          try {
            await parent.mkdir();
          } catch {
            throw err;
          }
        }
        return await resolvedPath.open(options);
      } else {
        throw err;
      }
    }
  }
  #withFileForAppendingSync(options, action) {
    return this.#withFileForWritingSync({
      append: true,
      ...options
    }, action);
  }
  #withFileForWritingSync(options, action) {
    const file = this.#openFileForWritingSync(options);
    try {
      return action(file);
    } finally {
      try {
        file.close();
      } catch {
      }
    }
  }
  /** Opens a file for writing, but handles if the directory does not exist. */
  #openFileForWritingSync(options) {
    return this.#openFileMaybeCreatingDirectorySync({
      write: true,
      create: true,
      truncate: options?.append !== true,
      ...options
    });
  }
  /** Opens a file for writing, but handles if the directory does not exist. */
  #openFileMaybeCreatingDirectorySync(options) {
    try {
      return this.openSync(options);
    } catch (err) {
      if (isNotFoundError(err)) {
        const parent = this.resolve().parent();
        if (parent != null) {
          try {
            parent.mkdirSync();
          } catch {
            throw err;
          }
        }
        return this.openSync(options);
      } else {
        throw err;
      }
    }
  }
  /** Changes the permissions of the file or directory. */
  async chmod(mode) {
    await chmod(this.#path, mode);
    return this;
  }
  /** Synchronously changes the permissions of the file or directory. */
  chmodSync(mode) {
    chmodSync(this.#path, mode);
    return this;
  }
  /** Changes the ownership permissions of the file. */
  async chown(uid, gid) {
    await chown(this.#path, uid, gid);
    return this;
  }
  /** Synchronously changes the ownership permissions of the file. */
  chownSync(uid, gid) {
    chownSync(this.#path, uid, gid);
    return this;
  }
  /** Creates a new file or opens the existing one. */
  create() {
    return createFile(this.#path).then((file) => createFsFileWrapper(file));
  }
  /** Synchronously creates a new file or opens the existing one. */
  createSync() {
    return createFsFileWrapper(createFileSync(this.#path));
  }
  /** Creates a file throwing if a file previously existed. */
  createNew() {
    return this.open({
      createNew: true,
      read: true,
      write: true
    });
  }
  /** Synchronously creates a file throwing if a file previously existed. */
  createNewSync() {
    return this.openSync({
      createNew: true,
      read: true,
      write: true
    });
  }
  /** Opens a file. */
  open(options) {
    return openFile(this.#path, options).then((file) => createFsFileWrapper(file));
  }
  /** Opens a file synchronously. */
  openSync(options) {
    return createFsFileWrapper(openFileSync(this.#path, options));
  }
  /** Removes the file or directory from the file system. */
  async remove(options) {
    await remove(this.#path, options);
    return this;
  }
  /** Removes the file or directory from the file system synchronously. */
  removeSync(options) {
    removeSync(this.#path, options);
    return this;
  }
  /** Removes the file or directory from the file system, but doesn't throw
   * when the file doesn't exist.
   */
  async ensureRemove(options) {
    try {
      return await this.remove(options);
    } catch (err) {
      if (isNotFoundError(err)) {
        return this;
      } else {
        throw err;
      }
    }
  }
  /** Removes the file or directory from the file system, but doesn't throw
   * when the file doesn't exist.
   */
  ensureRemoveSync(options) {
    try {
      return this.removeSync(options);
    } catch (err) {
      if (isNotFoundError(err)) {
        return this;
      } else {
        throw err;
      }
    }
  }
  /**
   * Ensures that a directory is empty.
   * Deletes directory contents if the directory is not empty.
   * If the directory does not exist, it is created.
   * The directory itself is not deleted.
   */
  async emptyDir() {
    await emptyDir(this.toString());
    return this;
  }
  /** Synchronous version of `emptyDir()` */
  emptyDirSync() {
    emptyDirSync(this.toString());
    return this;
  }
  /** Ensures that the directory exists.
   * If the directory structure does not exist, it is created. Like mkdir -p.
   */
  async ensureDir() {
    await ensureDir(this.toString());
    return this;
  }
  /** Synchronously ensures that the directory exists.
   * If the directory structure does not exist, it is created. Like mkdir -p.
   */
  ensureDirSync() {
    ensureDirSync(this.toString());
    return this;
  }
  /**
   * Ensures that the file exists.
   * If the file that is requested to be created is in directories that do
   * not exist these directories are created. If the file already exists,
   * it is NOTMODIFIED.
   */
  async ensureFile() {
    await ensureFile(this.toString());
    return this;
  }
  /**
   * Synchronously ensures that the file exists.
   * If the file that is requested to be created is in directories that do
   * not exist these directories are created. If the file already exists,
   * it is NOTMODIFIED.
   */
  ensureFileSync() {
    ensureFileSync(this.toString());
    return this;
  }
  /** Copies a file or directory to the provided destination.
   * @returns The destination path.
   */
  async copy(destinationPath, options) {
    const pathRef = ensurePath(destinationPath);
    await copy(this.#path, pathRef.toString(), options);
    return pathRef;
  }
  /** Copies a file or directory to the provided destination synchronously.
   * @returns The destination path.
   */
  copySync(destinationPath, options) {
    const pathRef = ensurePath(destinationPath);
    copySync(this.#path, pathRef.toString(), options);
    return pathRef;
  }
  /**
   * Copies the file or directory to the specified directory.
   * @returns The destination path.
   */
  copyToDir(destinationDirPath, options) {
    const destinationPath = ensurePath(destinationDirPath).join(this.basename());
    return this.copy(destinationPath, options);
  }
  /**
   * Copies the file or directory to the specified directory synchronously.
   * @returns The destination path.
   */
  copyToDirSync(destinationDirPath, options) {
    const destinationPath = ensurePath(destinationDirPath).join(this.basename());
    return this.copySync(destinationPath, options);
  }
  /**
   * Copies the file to the specified destination path.
   * @returns The destination path.
   */
  copyFile(destinationPath) {
    const pathRef = ensurePath(destinationPath);
    return copyFileFn(this.#path, pathRef.toString()).then(() => pathRef);
  }
  /**
   * Copies the file to the destination path synchronously.
   * @returns The destination path.
   */
  copyFileSync(destinationPath) {
    const pathRef = ensurePath(destinationPath);
    copyFileSyncFn(this.#path, pathRef.toString());
    return pathRef;
  }
  /**
   * Copies the file to the specified directory.
   * @returns The destination path.
   */
  copyFileToDir(destinationDirPath) {
    const destinationPath = ensurePath(destinationDirPath).join(this.basename());
    return this.copyFile(destinationPath);
  }
  /**
   * Copies the file to the specified directory synchronously.
   * @returns The destination path.
   */
  copyFileToDirSync(destinationDirPath) {
    const destinationPath = ensurePath(destinationDirPath).join(this.basename());
    return this.copyFileSync(destinationPath);
  }
  /**
   * Moves the file or directory returning a promise that resolves to
   * the renamed path.
   * @returns The destination path.
   */
  rename(newPath) {
    const pathRef = ensurePath(newPath);
    return renameFn(this.#path, pathRef.toString()).then(() => pathRef);
  }
  /**
   * Moves the file or directory returning the renamed path synchronously.
   * @returns The destination path.
   */
  renameSync(newPath) {
    const pathRef = ensurePath(newPath);
    renameSyncFn(this.#path, pathRef.toString());
    return pathRef;
  }
  /**
   * Moves the file or directory to the specified directory.
   * @returns The destination path.
   */
  renameToDir(destinationDirPath) {
    const destinationPath = ensurePath(destinationDirPath).join(this.basename());
    return this.rename(destinationPath);
  }
  /**
   * Moves the file or directory to the specified directory synchronously.
   * @returns The destination path.
   */
  renameToDirSync(destinationDirPath) {
    const destinationPath = ensurePath(destinationDirPath).join(this.basename());
    return this.renameSync(destinationPath);
  }
  /** Opens the file and pipes it to the writable stream. */
  async pipeTo(dest, options) {
    const file = await openFile(this.#path, { read: true });
    try {
      await file.readable.pipeTo(dest, options);
    } finally {
      try {
        file.close();
      } catch {
      }
    }
    return this;
  }
};
function ensurePath(path62) {
  return path62 instanceof Path ? path62 : new Path(path62);
}
function createFsFileWrapper(file) {
  Object.setPrototypeOf(file, FsFileWrapper.prototype);
  return file;
}
var FsFileWrapper = class extends FsFile {
  /** Writes the provided text to this file, looping to handle partial writes. */
  writeText(text) {
    return this.writeBytes(new TextEncoder().encode(text));
  }
  /** Synchronously writes the provided text to this file, looping to handle partial writes. */
  writeTextSync(text) {
    return this.writeBytesSync(new TextEncoder().encode(text));
  }
  /** Writes all the provided bytes to this file, looping to handle partial writes. */
  async writeBytes(bytes3) {
    let nwritten = 0;
    while (nwritten < bytes3.length) {
      nwritten += await this.write(bytes3.subarray(nwritten));
    }
    return this;
  }
  /** Synchronously writes all the provided bytes to this file, looping to handle partial writes. */
  writeBytesSync(bytes3) {
    let nwritten = 0;
    while (nwritten < bytes3.length) {
      nwritten += this.writeSync(bytes3.subarray(nwritten));
    }
    return this;
  }
  /** Writes all the provided data to this file, dispatching to `.writeText` or `.writeBytes` based on input type. */
  writeAll(data) {
    return typeof data === "string" ? this.writeText(data) : this.writeBytes(data);
  }
  /** Synchronously writes all the provided data to this file, dispatching to `.writeTextSync` or `.writeBytesSync` based on input type. */
  writeAllSync(data) {
    return typeof data === "string" ? this.writeTextSync(data) : this.writeBytesSync(data);
  }
};
async function createSymlink(opts) {
  let kind = opts.type;
  if (kind == null && isWindows2()) {
    const info2 = await opts.targetPath.lstat();
    if (info2?.isDirectory()) {
      kind = "dir";
    } else if (info2?.isFile()) {
      kind = "file";
    } else {
      throw createNotFoundError(`The target path '${opts.targetPath}' did not exist or path kind could not be determined. When the path doesn't exist, you need to specify a symlink type on Windows.`);
    }
  }
  await symlinkFn(opts.text, opts.fromPath.toString(), kind == null ? void 0 : {
    type: kind
  });
}
function createSymlinkSync(opts) {
  let kind = opts.type;
  if (kind == null && isWindows2()) {
    const info2 = opts.targetPath.lstatSync();
    if (info2?.isDirectory()) {
      kind = "dir";
    } else if (info2?.isFile()) {
      kind = "file";
    } else {
      throw createNotFoundError(`The target path '${opts.targetPath}' did not exist or path kind could not be determined. When the path doesn't exist, you need to specify a symlink type on Windows.`);
    }
  }
  symlinkSyncFn(opts.text, opts.fromPath.toString(), kind == null ? void 0 : {
    type: kind
  });
}
async function notFoundToUndefined(action) {
  try {
    return await action();
  } catch (err) {
    if (isNotFoundError(err)) {
      return void 0;
    } else {
      throw err;
    }
  }
}
function notFoundToUndefinedSync(action) {
  try {
    return action();
  } catch (err) {
    if (isNotFoundError(err)) {
      return void 0;
    } else {
      throw err;
    }
  }
}
async function writeAll(writer, data, signal) {
  let nwritten = 0;
  while (nwritten < data.length) {
    signal?.throwIfAborted();
    nwritten += await writer.write(data.subarray(nwritten));
  }
}
function writeAllSync(writer, data, signal) {
  let nwritten = 0;
  while (nwritten < data.length) {
    signal?.throwIfAborted();
    nwritten += writer.writeSync(data.subarray(nwritten));
  }
}
function* splitLines(text) {
  if (text === "")
    return;
  let start = 0;
  while (true) {
    const nl = text.indexOf("\n", start);
    if (nl === -1) {
      if (start < text.length)
        yield text.substring(start);
      return;
    }
    const end = nl > start && text.charCodeAt(nl - 1) === 13 ? nl - 1 : nl;
    yield text.substring(start, end);
    start = nl + 1;
    if (start === text.length)
      return;
  }
}
var rs_lib_internal_exports = {};
__export2(rs_lib_internal_exports, {
  StaticTextContainer: () => StaticTextContainer,
  __wbg_buffer_609cc3eee51ed158: () => __wbg_buffer_609cc3eee51ed158,
  __wbg_call_672a4d21634d4a24: () => __wbg_call_672a4d21634d4a24,
  __wbg_done_769e5ede4b31c67b: () => __wbg_done_769e5ede4b31c67b,
  __wbg_entries_3265d4158b33e5dc: () => __wbg_entries_3265d4158b33e5dc,
  __wbg_get_67b2ba62fc30de12: () => __wbg_get_67b2ba62fc30de12,
  __wbg_get_b9b93047fe3cf45b: () => __wbg_get_b9b93047fe3cf45b,
  __wbg_instanceof_ArrayBuffer_e14585432e3737fc: () => __wbg_instanceof_ArrayBuffer_e14585432e3737fc,
  __wbg_instanceof_Map_f3469ce2244d2430: () => __wbg_instanceof_Map_f3469ce2244d2430,
  __wbg_instanceof_Uint8Array_17156bcf118086a9: () => __wbg_instanceof_Uint8Array_17156bcf118086a9,
  __wbg_isArray_a1eab7e0d067391b: () => __wbg_isArray_a1eab7e0d067391b,
  __wbg_isSafeInteger_343e2beeeece1bb0: () => __wbg_isSafeInteger_343e2beeeece1bb0,
  __wbg_iterator_9a24c88df860dc65: () => __wbg_iterator_9a24c88df860dc65,
  __wbg_length_a446193dc22c12f8: () => __wbg_length_a446193dc22c12f8,
  __wbg_length_e2d2a49132c1b256: () => __wbg_length_e2d2a49132c1b256,
  __wbg_new_a12002a7f91c75be: () => __wbg_new_a12002a7f91c75be,
  __wbg_next_25feadfc0913fea9: () => __wbg_next_25feadfc0913fea9,
  __wbg_next_6574e1a8a62d1055: () => __wbg_next_6574e1a8a62d1055,
  __wbg_set_65595bdd868b3009: () => __wbg_set_65595bdd868b3009,
  __wbg_set_wasm: () => __wbg_set_wasm,
  __wbg_value_cd1ffa7b1ab794f1: () => __wbg_value_cd1ffa7b1ab794f1,
  __wbindgen_bigint_from_i64: () => __wbindgen_bigint_from_i64,
  __wbindgen_bigint_from_u64: () => __wbindgen_bigint_from_u64,
  __wbindgen_bigint_get_as_i64: () => __wbindgen_bigint_get_as_i64,
  __wbindgen_boolean_get: () => __wbindgen_boolean_get,
  __wbindgen_debug_string: () => __wbindgen_debug_string,
  __wbindgen_error_new: () => __wbindgen_error_new,
  __wbindgen_in: () => __wbindgen_in,
  __wbindgen_init_externref_table: () => __wbindgen_init_externref_table,
  __wbindgen_is_bigint: () => __wbindgen_is_bigint,
  __wbindgen_is_function: () => __wbindgen_is_function,
  __wbindgen_is_object: () => __wbindgen_is_object,
  __wbindgen_jsval_eq: () => __wbindgen_jsval_eq,
  __wbindgen_jsval_loose_eq: () => __wbindgen_jsval_loose_eq,
  __wbindgen_memory: () => __wbindgen_memory,
  __wbindgen_number_get: () => __wbindgen_number_get,
  __wbindgen_string_get: () => __wbindgen_string_get,
  __wbindgen_throw: () => __wbindgen_throw,
  static_text_render_once: () => static_text_render_once,
  strip_ansi_codes: () => strip_ansi_codes
});
var wasm;
function __wbg_set_wasm(val) {
  wasm = val;
}
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_export_2.set(idx, obj);
  return idx;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug2 = "[";
    if (length > 0) {
      debug2 += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug2 += ", " + debugString(val[i]);
    }
    debug2 += "]";
    return debug2;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
var WASM_VECTOR_LEN = 0;
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
var lTextEncoder = typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder;
var cachedTextEncoder = new lTextEncoder("utf-8");
var encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
  return cachedTextEncoder.encodeInto(arg, view);
} : function(arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code2 = arg.charCodeAt(offset);
    if (code2 > 127)
      break;
    mem[ptr + offset] = code2;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
var lTextDecoder = typeof import_node_util2.TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : import_node_util2.TextDecoder;
var cachedTextDecoder = new lTextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true
});
cachedTextDecoder.decode();
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_export_2.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
function static_text_render_once(items, cols, rows) {
  const ret = wasm.static_text_render_once(items, isLikeNone(cols) ? 4294967297 : cols >>> 0, isLikeNone(rows) ? 4294967297 : rows >>> 0);
  if (ret[3]) {
    throw takeFromExternrefTable0(ret[2]);
  }
  let v1;
  if (ret[0] !== 0) {
    v1 = getStringFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
  }
  return v1;
}
function strip_ansi_codes(text) {
  let deferred2_0;
  let deferred2_1;
  try {
    const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.strip_ansi_codes(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}
var StaticTextContainerFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_statictextcontainer_free(ptr >>> 0, 1));
var StaticTextContainer = class {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    StaticTextContainerFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_statictextcontainer_free(ptr, 0);
  }
  constructor() {
    const ret = wasm.statictextcontainer_new();
    this.__wbg_ptr = ret >>> 0;
    StaticTextContainerFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
   * @param {any} items
   * @param {number | null} [cols]
   * @param {number | null} [rows]
   * @returns {string | undefined}
   */
  render_text(items, cols, rows) {
    const ret = wasm.statictextcontainer_render_text(this.__wbg_ptr, items, isLikeNone(cols) ? 4294967297 : cols >>> 0, isLikeNone(rows) ? 4294967297 : rows >>> 0);
    if (ret[3]) {
      throw takeFromExternrefTable0(ret[2]);
    }
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
  /**
   * @param {number | null} [cols]
   * @param {number | null} [rows]
   * @returns {string | undefined}
   */
  clear_text(cols, rows) {
    const ret = wasm.statictextcontainer_clear_text(this.__wbg_ptr, isLikeNone(cols) ? 4294967297 : cols >>> 0, isLikeNone(rows) ? 4294967297 : rows >>> 0);
    let v1;
    if (ret[0] !== 0) {
      v1 = getStringFromWasm0(ret[0], ret[1]).slice();
      wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
  }
};
function __wbg_buffer_609cc3eee51ed158(arg0) {
  const ret = arg0.buffer;
  return ret;
}
function __wbg_call_672a4d21634d4a24() {
  return handleError(function(arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
  }, arguments);
}
function __wbg_done_769e5ede4b31c67b(arg0) {
  const ret = arg0.done;
  return ret;
}
function __wbg_entries_3265d4158b33e5dc(arg0) {
  const ret = Object.entries(arg0);
  return ret;
}
function __wbg_get_67b2ba62fc30de12() {
  return handleError(function(arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
  }, arguments);
}
function __wbg_get_b9b93047fe3cf45b(arg0, arg1) {
  const ret = arg0[arg1 >>> 0];
  return ret;
}
function __wbg_instanceof_ArrayBuffer_e14585432e3737fc(arg0) {
  let result;
  try {
    result = arg0 instanceof ArrayBuffer;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_instanceof_Map_f3469ce2244d2430(arg0) {
  let result;
  try {
    result = arg0 instanceof Map;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_instanceof_Uint8Array_17156bcf118086a9(arg0) {
  let result;
  try {
    result = arg0 instanceof Uint8Array;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_isArray_a1eab7e0d067391b(arg0) {
  const ret = Array.isArray(arg0);
  return ret;
}
function __wbg_isSafeInteger_343e2beeeece1bb0(arg0) {
  const ret = Number.isSafeInteger(arg0);
  return ret;
}
function __wbg_iterator_9a24c88df860dc65() {
  const ret = Symbol.iterator;
  return ret;
}
function __wbg_length_a446193dc22c12f8(arg0) {
  const ret = arg0.length;
  return ret;
}
function __wbg_length_e2d2a49132c1b256(arg0) {
  const ret = arg0.length;
  return ret;
}
function __wbg_new_a12002a7f91c75be(arg0) {
  const ret = new Uint8Array(arg0);
  return ret;
}
function __wbg_next_25feadfc0913fea9(arg0) {
  const ret = arg0.next;
  return ret;
}
function __wbg_next_6574e1a8a62d1055() {
  return handleError(function(arg0) {
    const ret = arg0.next();
    return ret;
  }, arguments);
}
function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
  arg0.set(arg1, arg2 >>> 0);
}
function __wbg_value_cd1ffa7b1ab794f1(arg0) {
  const ret = arg0.value;
  return ret;
}
function __wbindgen_bigint_from_i64(arg0) {
  const ret = arg0;
  return ret;
}
function __wbindgen_bigint_from_u64(arg0) {
  const ret = BigInt.asUintN(64, arg0);
  return ret;
}
function __wbindgen_bigint_get_as_i64(arg0, arg1) {
  const v = arg1;
  const ret = typeof v === "bigint" ? v : void 0;
  getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
}
function __wbindgen_boolean_get(arg0) {
  const v = arg0;
  const ret = typeof v === "boolean" ? v ? 1 : 0 : 2;
  return ret;
}
function __wbindgen_debug_string(arg0, arg1) {
  const ret = debugString(arg1);
  const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbindgen_error_new(arg0, arg1) {
  const ret = new Error(getStringFromWasm0(arg0, arg1));
  return ret;
}
function __wbindgen_in(arg0, arg1) {
  const ret = arg0 in arg1;
  return ret;
}
function __wbindgen_init_externref_table() {
  const table = wasm.__wbindgen_export_2;
  const offset = table.grow(4);
  table.set(0, void 0);
  table.set(offset + 0, void 0);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
}
function __wbindgen_is_bigint(arg0) {
  const ret = typeof arg0 === "bigint";
  return ret;
}
function __wbindgen_is_function(arg0) {
  const ret = typeof arg0 === "function";
  return ret;
}
function __wbindgen_is_object(arg0) {
  const val = arg0;
  const ret = typeof val === "object" && val !== null;
  return ret;
}
function __wbindgen_jsval_eq(arg0, arg1) {
  const ret = arg0 === arg1;
  return ret;
}
function __wbindgen_jsval_loose_eq(arg0, arg1) {
  const ret = arg0 == arg1;
  return ret;
}
function __wbindgen_memory() {
  const ret = wasm.memory;
  return ret;
}
function __wbindgen_number_get(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "number" ? obj : void 0;
  getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
}
function __wbindgen_string_get(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "string" ? obj : void 0;
  var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN;
  getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}
var bytes = base64decode("AGFzbQEAAAABpwIrYAJ/fwBgAn9/AX9gA39/fwF/YAN/f38AYAF/AGABfwF/YAFvAX9gBX9/f39/AGAEf39/fwBgAW8Bb2AEf39/fwF/YAJ/bwBgBn9/f39/fwBgAAR/f39/YAACf39gAm9vAX9gAAF/YAV/f39/fwF/YAF+AW9gAAFvYAJvbwFvYAAAYAZ/f39/f38Bf2ADf35/AGACf34AYAJvfwFvYAJ/fwFvYANvb38AYAh/f39/f39/fwBgCX9/f39/f35+fgBgB39/f39/f38Bf2ADf35+AGACf3wAYAR/b3x8BH9/f39gA298fAR/f39/YAN/fHwCf39gAn9/An9/YAV/f31/fwBgBH99f38AYAV/f35/fwBgBH9+f38AYAV/f3x/fwBgBH98f38AApcOJBQuL3JzX2xpYi5pbnRlcm5hbC5qcxpfX3diZ19nZXRfYjliOTMwNDdmZTNjZjQ1YgAZFC4vcnNfbGliLmludGVybmFsLmpzGV9fd2JpbmRnZW5fanN2YWxfbG9vc2VfZXEADxQuL3JzX2xpYi5pbnRlcm5hbC5qcyxfX3diZ19pbnN0YW5jZW9mX1VpbnQ4QXJyYXlfMTcxNTZiY2YxMTgwODZhOQAGFC4vcnNfbGliLmludGVybmFsLmpzLV9fd2JnX2luc3RhbmNlb2ZfQXJyYXlCdWZmZXJfZTE0NTg1NDMyZTM3MzdmYwAGFC4vcnNfbGliLmludGVybmFsLmpzGl9fd2JnX25ld19hMTIwMDJhN2Y5MWM3NWJlAAkULi9yc19saWIuaW50ZXJuYWwuanMWX193YmluZGdlbl9ib29sZWFuX2dldAAGFC4vcnNfbGliLmludGVybmFsLmpzFV9fd2JpbmRnZW5fbnVtYmVyX2dldAALFC4vcnNfbGliLmludGVybmFsLmpzFV9fd2JpbmRnZW5fc3RyaW5nX2dldAALFC4vcnNfbGliLmludGVybmFsLmpzFF9fd2JpbmRnZW5fZXJyb3JfbmV3ABoULi9yc19saWIuaW50ZXJuYWwuanMdX193YmdfbGVuZ3RoX2UyZDJhNDkxMzJjMWIyNTYABhQuL3JzX2xpYi5pbnRlcm5hbC5qcxRfX3diaW5kZ2VuX2lzX2JpZ2ludAAGFC4vcnNfbGliLmludGVybmFsLmpzJF9fd2JnX2lzU2FmZUludGVnZXJfMzQzZTJiZWVlZWNlMWJiMAAGFC4vcnNfbGliLmludGVybmFsLmpzGl9fd2JpbmRnZW5fYmlnaW50X2Zyb21faTY0ABIULi9yc19saWIuaW50ZXJuYWwuanMaX193YmluZGdlbl9iaWdpbnRfZnJvbV91NjQAEhQuL3JzX2xpYi5pbnRlcm5hbC5qcxRfX3diaW5kZ2VuX2lzX29iamVjdAAGFC4vcnNfbGliLmludGVybmFsLmpzH19fd2JnX2l0ZXJhdG9yXzlhMjRjODhkZjg2MGRjNjUAExQuL3JzX2xpYi5pbnRlcm5hbC5qcw1fX3diaW5kZ2VuX2luAA8ULi9yc19saWIuaW50ZXJuYWwuanMlX193YmdfaW5zdGFuY2VvZl9NYXBfZjM0NjljZTIyNDRkMjQzMAAGFC4vcnNfbGliLmludGVybmFsLmpzHl9fd2JnX2VudHJpZXNfMzI2NWQ0MTU4YjMzZTVkYwAJFC4vcnNfbGliLmludGVybmFsLmpzE19fd2JpbmRnZW5fanN2YWxfZXEADxQuL3JzX2xpYi5pbnRlcm5hbC5qcxZfX3diaW5kZ2VuX2lzX2Z1bmN0aW9uAAYULi9yc19saWIuaW50ZXJuYWwuanMbX193YmdfbmV4dF82NTc0ZTFhOGE2MmQxMDU1AAkULi9yc19saWIuaW50ZXJuYWwuanMbX193YmdfZG9uZV83NjllNWVkZTRiMzFjNjdiAAYULi9yc19saWIuaW50ZXJuYWwuanMcX193YmdfdmFsdWVfY2QxZmZhN2IxYWI3OTRmMQAJFC4vcnNfbGliLmludGVybmFsLmpzGl9fd2JnX2dldF82N2IyYmE2MmZjMzBkZTEyABQULi9yc19saWIuaW50ZXJuYWwuanMbX193YmdfY2FsbF82NzJhNGQyMTYzNGQ0YTI0ABQULi9yc19saWIuaW50ZXJuYWwuanMbX193YmdfbmV4dF8yNWZlYWRmYzA5MTNmZWE5AAkULi9yc19saWIuaW50ZXJuYWwuanMeX193YmdfaXNBcnJheV9hMWVhYjdlMGQwNjczOTFiAAYULi9yc19saWIuaW50ZXJuYWwuanMdX193YmdfbGVuZ3RoX2E0NDYxOTNkYzIyYzEyZjgABhQuL3JzX2xpYi5pbnRlcm5hbC5qcxFfX3diaW5kZ2VuX21lbW9yeQATFC4vcnNfbGliLmludGVybmFsLmpzHV9fd2JnX2J1ZmZlcl82MDljYzNlZWU1MWVkMTU4AAkULi9yc19saWIuaW50ZXJuYWwuanMaX193Ymdfc2V0XzY1NTk1YmRkODY4YjMwMDkAGxQuL3JzX2xpYi5pbnRlcm5hbC5qcxBfX3diaW5kZ2VuX3Rocm93AAAULi9yc19saWIuaW50ZXJuYWwuanMcX193YmluZGdlbl9iaWdpbnRfZ2V0X2FzX2k2NAALFC4vcnNfbGliLmludGVybmFsLmpzF19fd2JpbmRnZW5fZGVidWdfc3RyaW5nAAsULi9yc19saWIuaW50ZXJuYWwuanMfX193YmluZGdlbl9pbml0X2V4dGVybnJlZl90YWJsZQAVA4UCgwIFHAEABwADCAIBAwEKAQMABAMAARYCAwMAAgIAHRABAAACAB4XDAMDDAEBAAEIAQAHAwAHABUBAwMAAAgABAUCBwAAAQAMCAEIDAUAAR8HAAADAwgDAAIEAgABCAAAAAMBAAADAwQABAMDAAgAAAcBBAEAAAAHBAACAwMAAwMABwADGBggAwEBEAQDAAQEAwEBBQUAAAADEQEEAQQBCiEAIgAAASMEJAAAAAAEFgoDBxElJykDAQgEBAIBBAQEAQEEBQEAAQEABAABBAQEAQEBAQEBAgADBAQHAQQFEAMBAQAFAAQBBQAAAwMAAAAEAQAABQUAAAAAAAAFBQUFAAcICggXBAkCcAE2Nm8AgAEFAwEAEQYJAX8BQYCAwAALB/ACDwZtZW1vcnkCAB5fX3diZ19zdGF0aWN0ZXh0Y29udGFpbmVyX2ZyZWUAXhdzdGF0aWN0ZXh0Y29udGFpbmVyX25ldwCsAR9zdGF0aWN0ZXh0Y29udGFpbmVyX3JlbmRlcl90ZXh0AMIBHnN0YXRpY3RleHRjb250YWluZXJfY2xlYXJfdGV4dADIARdzdGF0aWNfdGV4dF9yZW5kZXJfb25jZQDEARBzdHJpcF9hbnNpX2NvZGVzAMoBFF9fd2JpbmRnZW5fZXhuX3N0b3JlAPoBF19fZXh0ZXJucmVmX3RhYmxlX2FsbG9jAEETX193YmluZGdlbl9leHBvcnRfMgEBEV9fd2JpbmRnZW5fbWFsbG9jALwBEl9f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EIYBIANBNGogAUG4mcAAEJ0BDAELA0AgA0HMAGoQtgEiBkGAgMQARwRAIANBCGogBhB9IAMoAghBAXFFDQEgBSADKAIMIgEgBGoiBEkEQCADQYABaiIEIANBkAFqEIYBIANBNGogBEGomcAAEJ0BIANBADYCnAEgAyAGIANBnAFqEJ4BIAQgAygCACADKAIEEIwBIANBmAFqIANBiAFqKAIANgIAIAMgAykCgAE3A5ABIAEhBAwCBSADQZABaiAGEIUBDAILAAsLIAMoApgBBEAgA0GAAWoiASADQZABahCGASADQTRqIAFBmJnAABCdAQUgAygCkAEgAygClAEQjgILDAALAAsgA0HYAGogAiABENgBA0AgA0EYaiADQdgAahBGIAMoAhgiAUUNBiADQZABaiIEIAEgAygCHBCMASADQYABaiIBIAQQhgEgA0E0aiABQciZwAAQnQEMAAsACyAEKQIEIQ4gASAKaiILIAc2AgAgC0EEaiAONwIAIAZBEGshBiAFQRBqIQUgAUEMaiEBIAhBAWohCCAEQRBqIQQMAQsLDAQLDAMLIAAgASkCADcCACABQoCAgIDAADcCACAAQQhqIAFBCGoiACgCADYCACAAQQA2AgAMAQsgA0GIAWoiBCADQTxqKAIANgIAIAMgAykCNDcDgAECQCAOQoCAgIAQg1ANACADKAKIASIGIA5CMIinIgFNDQAgA0EANgKIASADIAMoAoQBIgU2AlggAyABNgJoIAMgBiABayIBNgJkIAMgBSABQQR0ajYCXCADIANBgAFqNgJgIANB2ABqEGELIAAgAykDgAE3AgAgAEEIaiAEKAIANgIAIAMoAkAgAhDqASAHIAoQjgIgCSEBA0AgCARAIAEoAgAgAUEEaigCABCOAiAIQQFrIQggAUEMaiEBDAELCyAMIAlBBEEMEHcLIANBoAFqJAAPCyADQQA2AmggA0EBNgJcIANByJXAADYCWCADQgQ3AmAgA0HYAGpB9JbAABDGAQALzAoBBX8jAEEQayIGJAACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAJB/wFxQQFrDg8ACgsCAQwZBhEHEggYGAkZCyAAQQA6AIEKIABBADYC8AEgAEEAOwH+CSAAQQA6AOQBIABBADYC4AEMGAsgA0H/AXFBCWsOBQMBFhYCFgsgACgC8AEQ4AEMFQsgASgCFCEAIAEtABhBAUYEQCABQQA6ABggASAAQQFrNgIMCyABIAA2AhAMFQsgASgCFCEAIAEtABhBAUYEQCABQQA6ABggASAAQQFrNgIMCyABIAA2AhAMFAsgASgCFCEAIAEtABhBAUYEQCABQQA6ABggASAAQQFrNgIMCyABIAA2AhAMEwsgACgC9AEhBSAAKAL4CSIERQ0GIARBEEYNByAEQQFrIgJBEE8NCCAEQRBPDQkgACAEQQN0aiIDIAAgAkEDdGooAgQ2AgAgAyAFNgIEIAAgACgC+AlBAWoiBDYC+AkgACgC9AEhBQwHCyAAKAL0AQRAIABBADYC9AELIABBADYC+AkMEQsgASADQf8BcRCCAQwQCyAAIAEgAxA6DA8LIAAoAvABIgFBAkYNCCABQQJJBEAgACABQQFqNgLwASAAIAFqIAM6APwJDA8LIAFBAkGclMAAEHYACwJAIAAoAuABQSBHBEAgAEGAAWogAC8B/gkQdAwBCyAAQQE6AIEKCyAAKALwARDgAQwMCwJAIAAoAuABQSBHBEAgAEGAAWogAC8B/gkQdAwBCyAAQQE6AIEKCyAAKALwARDgAQwLC0EBIQQgAEEBNgL4CSAAIAU2AgQgAEEANgIAC0EAIQJBfyEDA0AgA0EBaiIDIARHIAJBgAFHcUUEQCAEQRFJDQsgBEEQQeyTwAAQjAIACyAAIAJqIgdBBGooAgAiCCAHKAIAIgdJDQYgAkEIaiECIAUgCE8NAAsgCCAFQfyTwAAQjAIACyACQRBBrJTAABB2AAsgBEEQQbyUwAAQdgALIAAoAvQBIgFBgAhGDQcCQAJAIAACfwJAIANB/wFxQTtGBEAgACgC+AkiAkUNASACQRBGDQwgAkEBayIDQRBPDQMgAkEQTw0EIAAgAkEDdGoiAiAAIANBA3RqKAIENgIAIAIgATYCBCAAKAL4CUEBagwCCyABQYAITw0HIAAgAUEBajYC9AEgACABaiADOgD4AQwLCyAAIAE2AgQgAEEANgIAQQELNgL4CQwJCyADQRBBzJTAABB2AAsgAkEQQdyUwAAQdgALAkACQAJAIAAoAuABIgRBIEcEQCAAQYABaiECIAAvAf4JIQEgA0H/AXFBOmsOAgIBAwsgAEEBOgCBCgwJCyACIAEQdCAAQQA7Af4JDAgLIAQgAC0A5AEiBGsiA0EfSw0EIAAgA2ogBEEBajoAwAEgACgC4AEiA0EgTw0FIAIgA0EBdGogATsBACAAQQA7Af4JIAAgAC0A5AFBAWo6AOQBIAAgACgC4AFBAWo2AuABDAcLIABBf0H//wMgAUEKbCIAQf7/A3EgA0Ewa0H/AXFqIgEgAUH//wNPGyAAQRB2GzsB/gkMBgsgAEEBOgCBCgwFCyAHIAhB/JPAABCNAgALIAYgAzoAD0HglcAAQSsgBkEPakGMlsAAQeyUwAAQcgALIANBIEGclcAAEHYACyADQSBBrJXAABB2AAsgAS0AGEUEQCABQQAQjgEgAUEBOgAYIAEgASgCEDYCDAsgASABKAIUNgIQIAFBARCOASABIAEoAhQ2AgwLIAZBEGokAAvJBwEKfwJAAkAgACgCCCILQYCAgMABcUUNAAJAAkACQAJAIAtBgICAgAFxBEAgAC8BDiIGDQFBACECDAILIAJBEE8EQCACIAEgAUEDakF8cSIIayIJaiIGQQNxIQcgASAIRwRAIAEhAwNAIAUgAywAAEG/f0pqIQUgA0EBaiEDIAlBAWoiCQ0ACwsgBwRAIAggBkF8cWohAwNAIAQgAywAAEG/f0pqIQQgA0EBaiEDIAdBAWsiBw0ACwsgBkECdiEJIAQgBWohBQNAIAghBiAJRQ0FQcABIAkgCUHAAU8bIgxBA3EhCiAMQQJ0IQdBACEEIAlBBE8EQCAGIAdB8AdxaiEIIAYhAwNAIAQgAygCACIEQX9zQQd2IARBBnZyQYGChAhxaiADQQRqKAIAIgRBf3NBB3YgBEEGdnJBgYKECHFqIANBCGooAgAiBEF/c0EHdiAEQQZ2ckGBgoQIcWogA0EMaigCACIEQX9zQQd2IARBBnZyQYGChAhxaiEEIANBEGoiAyAIRw0ACwsgCSAMayEJIAYgB2ohCCAEQQh2Qf+B/AdxIARB/4H8B3FqQYGABGxBEHYgBWohBSAKRQ0ACyAKQQJ0IQcgBiAMQfwBcUECdGohA0EAIQQDQCADKAIAIgZBf3NBB3YgBkEGdnJBgYKECHEgBGohBCADQQRqIQMgB0EEayIHDQALIARBCHZB/4H8B3EgBEH/gfwHcWpBgYAEbEEQdiAFaiEFDAQLIAJFBEBBACECDAQLA0AgBSABIANqLAAAQb9/SmohBSACIANBAWoiA0cNAAsMAwsgASACaiEIQQAhAiABIQQgBiEHA0AgBCIDIAhGDQICfyADQQFqIAMsAAAiBEEATg0AGiADQQJqIARBYEkNABogA0EDaiAEQXBJDQAaIANBBGoLIgQgA2sgAmohAiAHQQFrIgcNAAsLQQAhBwsgBiAHayEFCyAFIAAvAQwiBk8NACAGIAVrIQZBACEDQQAhBQJAAkACQCALQR12QQNxQQFrDgIAAQILIAYhBQwBCyAGQf7/A3FBAXYhBQsgC0H///8AcSEIIAAoAgQhCiAAKAIAIQcDQCADQf//A3EgBUH//wNxSQRAQQEhBCADQQFqIQMgByAIIAooAhARAQBFDQEMAwsLQQEhBCAHIAEgAiAKKAIMEQIADQEgBiAFa0H//wNxIQBBACEDA0AgACADQf//A3FNBEBBAA8LIANBAWohAyAHIAggCigCEBEBAEUNAAsMAQsgACgCACABIAIgACgCBCgCDBECACEECyAEC/cHAQd/AkAgAUGACkkEQCABQQV2IQUCQAJAIAAoAqABIgQEQCAEQQFrIQMgBEECdCAAakEEayECIAQgBWpBAnQgAGpBBGshBiAEQSlJIQQDQCAERQ0CIAMgBWoiB0EoTw0DIAYgAigCADYCACAGQQRrIQYgAkEEayECIANBAWsiA0F/Rw0ACwsgAUEgSQ0DIABBADYCACAFQQFqIgJBAkYNAyAAQQA2AgQgAkEDRg0DIABBADYCCCACQQRGDQMgAEEANgIMIAJBBUYNAyAAQQA2AhAgAkEGRg0DIABBADYCFCACQQdGDQMgAEEANgIYIAJBCEYNAyAAQQA2AhwgAkEJRg0DIABBADYCICACQQpGDQMgAEEANgIkIAJBC0YNAyAAQQA2AiggAkEMRg0DIABBADYCLCACQQ1GDQMgAEEANgIwIAJBDkYNAyAAQQA2AjQgAkEPRg0DIABBADYCOCACQRBGDQMgAEEANgI8IAJBEUYNAyAAQQA2AkAgAkESRg0DIABBADYCRCACQRNGDQMgAEEANgJIIAJBFEYNAyAAQQA2AkwgAkEVRg0DIABBADYCUCACQRZGDQMgAEEANgJUIAJBF0YNAyAAQQA2AlggAkEYRg0DIABBADYCXCACQRlGDQMgAEEANgJgIAJBGkYNAyAAQQA2AmQgAkEbRg0DIABBADYCaCACQRxGDQMgAEEANgJsIAJBHUYNAyAAQQA2AnAgAkEeRg0DIABBADYCdCACQR9GDQMgAEEANgJ4IAJBIEYNAyAAQQA2AnwgAkEhRg0DIABBADYCgAEgAkEiRg0DIABBADYChAEgAkEjRg0DIABBADYCiAEgAkEkRg0DIABBADYCjAEgAkElRg0DIABBADYCkAEgAkEmRg0DIABBADYClAEgAkEnRg0DIABBADYCmAEgAkEoRg0DIABBADYCnAEgAkEpRg0DQShBKEH0x8AAEHYACyADQShB9MfAABB2AAsgB0EoQfTHwAAQdgALQZ7IwABBHUH0x8AAEKkBAAsgACgCoAEgBWohAiABQR9xIgZFBEAgACACNgKgASAADwsCQCACQQFrIgNBJ00EQCACIQQgACADQQJ0aigCAEEAIAFrIgF2IgNFDQEgAkEnTQRAIAAgAkECdGogAzYCACACQQFqIQQMAgsgAkEoQfTHwAAQdgALIANBKEH0x8AAEHYACyACIAVBAWoiB0sEQCABQR9xIQEgAkECdCAAakEIayEDA0AgA0EEaiIIIAgoAgAgBnQgAygCACABdnI2AgAgA0EEayEDIAcgAkEBayICSQ0ACwsgACAFQQJ0aiIBIAEoAgAgBnQ2AgAgACAENgKgASAAC7kKAQV/IwBBIGsiBCQAIAACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCABDigCAQEBAQEBAQEDBQEBBAEBAQEBAQEBAQEBAQEBAQEBAQEBCQEBAQEHAAsgAUHcAEYNBQsgAkEBcSABQf8FS3ENBiABQSBJDQogAUH/AEkNDAwJCyAAQgA3AQIgAEHc4AA7AQAMBwsgAEIANwECIABB3OgBOwEADAYLIABCADcBAiAAQdzkATsBAAwFCyAAQgA3AQIgAEHc3AE7AQAMBAsgAEIANwECIABB3LgBOwEADAMLIAJBgAJxRQ0GIABCADcBAiAAQdzOADsBAAwCC0ERQQAgAUGvsARPGyICIAJBCHIiAyABQQt0IgIgA0ECdEHwycAAaigCAEELdEkbIgMgA0EEciIDIANBAnRB8MnAAGooAgBBC3QgAksbIgMgA0ECciIDIANBAnRB8MnAAGooAgBBC3QgAksbIgMgA0EBaiIDIANBAnRB8MnAAGooAgBBC3QgAksbIgMgA0EBaiIDIANBAnRB8MnAAGooAgBBC3QgAksbIgNBAnRB8MnAAGooAgBBC3QiBiACRiACIAZLaiADaiIGQQJ0QfDJwABqIgcoAgBBFXYhAkHvBSEDAkAgBkEgTQRAIAcoAgRBFXYhAyAGRQ0BCyAHQQRrKAIAQf///wBxIQULAkAgAyACQX9zakUNACABIAVrIQUgA0EBayEGQQAhAwNAIAMgAkGIm8AAai0AAGoiAyAFSw0BIAYgAkEBaiICRw0ACwsgAkEBcUUNAiAEQQ5qQQA6AAAgBEEAOwEMIAQgAUEUdkHas8AAai0AADoADyAEIAFBBHZBD3FB2rPAAGotAAA6ABMgBCABQQh2QQ9xQdqzwABqLQAAOgASIAQgAUEMdkEPcUHas8AAai0AADoAESAEIAFBEHZBD3FB2rPAAGotAAA6ABAgAUEBcmdBAnYiAiAEQQxqIgNqIgVB+wA6AAAgBUEBa0H1ADoAACADIAJBAmsiAmpB3AA6AAAgBEEUaiIDIAFBD3FB2rPAAGotAAA6AAAgACAEKQEMNwAAIARB/QA6ABUMBAsgAkH///8HcUGAgARJDQQgAEIANwECIABB3MQAOwEAC0EAIQJBAgwECyABQYCABE8EQCABQYCACEkEQCABQci8wABBLEGgvcAAQdABQfC+wABB5gMQR0UNAgwECyABQf7//wBxQZ7wCkYgAUHg//8AcUHgzQpGciABQcDuCmtBeUsgAUGwnQtrQXFLcnIgAUHw1wtrQXBLIAFBgPALa0HdbEtyIAFBgIAMa0GddEsgAUHQpgxrQXpLcnJyIAFBgII4a0GvxVRLIAFB8IM4T3JyDQEMAwsgAUHWwsAAQShBpsPAAEGiAkHIxcAAQakCEEcNAgsgBEEYakEAOgAAIARBADsBFiAEIAFBFHZB2rPAAGotAAA6ABkgBCABQQR2QQ9xQdqzwABqLQAAOgAdIAQgAUEIdkEPcUHas8AAai0AADoAHCAEIAFBDHZBD3FB2rPAAGotAAA6ABsgBCABQRB2QQ9xQdqzwABqLQAAOgAaIAFBAXJnQQJ2IgIgBEEWaiIDaiIFQfsAOgAAIAVBAWtB9QA6AAAgAyACQQJrIgJqQdwAOgAAIARBHmoiAyABQQ9xQdqzwABqLQAAOgAAIAAgBCkBFjcAACAEQf0AOgAfCyAAQQhqIAMvAQA7AABBCgwBCyAAIAE2AgBBgAEhAkGBAQs6AA0gACACOgAMIARBIGokAAvMBgENfyMAQRBrIggkACAAKAIEIQMgACgCACEHQQEhCwJAIAEoAgAiCUEiIAEoAgQiDCgCECINEQEADQACQCADRQRAQQAhA0EAIQAMAQtBACEBIAchBCADIQUDQCAEIAVqIQ5BACEAAkACQANAIAAgBGoiBi0AACIKQf8Aa0H/AXFBoQFJIApBIkZyIApB3ABGcg0BIAUgAEEBaiIARw0ACyACIAVqIQIMAQsgACACaiECAkACQCAGLAAAIgBBAE4EQCAGQQFqIQQgAEH/AXEhAAwBCyAGLQABQT9xIQQgAEEfcSEFIABBX00EQCAFQQZ0IARyIQAgBkECaiEEDAELIAYtAAJBP3EgBEEGdHIhCiAAQXBJBEAgCiAFQQx0ciEAIAZBA2ohBAwBCyAGQQRqIQQgBUESdEGAgPAAcSAGLQADQT9xIApBBnRyciIAQYCAxABGDQELIAggAEGBgAQQLgJAIAgtAA0gCC0ADGtB/wFxQQFGDQACQAJAAkAgASACSw0AAkAgAUUNACABIANPBEAgASADRw0CDAELIAEgB2osAABBv39MDQELAkAgAkUNACACIANPBEAgAiADRg0BDAILIAIgB2osAABBv39MDQELIAkgASAHaiACIAFrIAwoAgwiARECAEUNAQwCCyAHIAMgASACQZi4wAAQ/AEACwJAIAgtAA0iBUGBAU8EQCAJIAgoAgAgDREBAA0CDAELIAkgCCAILQAMIgZqIAUgBmsgARECAA0BCwJ/QQEgAEGAAUkNABpBAiAAQYAQSQ0AGkEDQQQgAEGAgARJGwsgAmohAQwBCwwFCwJ/QQEgAEGAAUkNABpBAiAAQYAQSQ0AGkEDQQQgAEGAgARJGwsgAmohAgsgDiAEayIFDQELCwJAIAEgAksNAEEAIQACQCABRQ0AIAEgA08EQCABIAMiAEcNAgwBCyABIgAgB2osAABBv39MDQELIAJFBEBBACEDDAILAkAgAiADTwRAIAIgA0YNAwwBCyACIAdqLAAAQb9/TA0AIAIhAwwCCyAAIQELIAcgAyABIAJBqLjAABD8AQALIAkgACAHaiADIABrIAwoAgwRAgANACAJQSIgDREBACELCyAIQRBqJAAgCwvqBgEFfwJAAkACQAJAAkAgAEEEayIFKAIAIgdBeHEiBEEEQQggB0EDcSIGGyABak8EQCAGQQAgAUEnaiIIIARJGw0BAkACQCACQQlPBEAgAiADEEIiAg0BQQAPC0EAIQIgA0HM/3tLDQFBECADQQtqQXhxIANBC0kbIQECQCAGRQRAIAFBgAJJIAQgAUEEcklyIAQgAWtBgYAIT3INAQwJCyAAQQhrIgYgBGohCAJAAkACQAJAIAEgBEsEQCAIQYTAwQAoAgBGDQQgCEGAwMEAKAIARg0CIAgoAgQiB0ECcQ0FIAdBeHEiByAEaiIEIAFJDQUgCCAHEEQgBCABayICQRBJDQEgBSABIAUoAgBBAXFyQQJyNgIAIAEgBmoiASACQQNyNgIEIAQgBmoiAyADKAIEQQFyNgIEIAEgAhA8DA0LIAQgAWsiAkEPSw0CDAwLIAUgBCAFKAIAQQFxckECcjYCACAEIAZqIgEgASgCBEEBcjYCBAwLC0H4v8EAKAIAIARqIgQgAUkNAgJAIAQgAWsiA0EPTQRAIAUgB0EBcSAEckECcjYCACAEIAZqIgEgASgCBEEBcjYCBEEAIQNBACEBDAELIAUgASAHQQFxckECcjYCACABIAZqIgEgA0EBcjYCBCAEIAZqIgIgAzYCACACIAIoAgRBfnE2AgQLQYDAwQAgATYCAEH4v8EAIAM2AgAMCgsgBSABIAdBAXFyQQJyNgIAIAEgBmoiASACQQNyNgIEIAggCCgCBEEBcjYCBCABIAIQPAwJC0H8v8EAKAIAIARqIgQgAUsNBwsgAxAkIgFFDQEgA0F8QXggBSgCACICQQNxGyACQXhxaiICIAIgA0sbIgIEQCABIAAgAvwKAAALIAAQNCABDwsgAyABIAEgA0sbIgMEQCACIAAgA/wKAAALIAUoAgAiA0F4cSIFIAFBBEEIIANBA3EiARtqSQ0DIAFBACAFIAhLGw0EIAAQNAsgAg8LQdbTwABBLkGE1MAAEKkBAAtBlNTAAEEuQcTUwAAQqQEAC0HW08AAQS5BhNTAABCpAQALQZTUwABBLkHE1MAAEKkBAAsgBSABIAdBAXFyQQJyNgIAIAEgBmoiAiAEIAFrIgFBAXI2AgRB/L/BACABNgIAQYTAwQAgAjYCACAADwsgAAuCBwIBfwF8IwBBMGsiAiQAAn8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAC0AAEEBaw4RAQIDBAUGBwgJCgsMDQ4PEBEACyACIAAtAAE6AAggAkECNgIUIAJB3NHAADYCECACQgE3AhwgAkEDNgIsIAIgAkEoajYCGCACIAJBCGo2AiggASgCACABKAIEIAJBEGoQ9wEMEQsgAiAAKQMINwMIIAJBAjYCFCACQfjRwAA2AhAgAkIBNwIcIAJBBDYCLCACIAJBKGo2AhggAiACQQhqNgIoIAEoAgAgASgCBCACQRBqEPcBDBALIAIgACkDCDcDCCACQQI2AhQgAkH40cAANgIQIAJCATcCHCACQQU2AiwgAiACQShqNgIYIAIgAkEIajYCKCABKAIAIAEoAgQgAkEQahD3AQwPCyAAKwMIIQMgAkECNgIUIAJBmNLAADYCECACQgE3AhwgAkEGNgIMIAIgAzkDKCACIAJBCGo2AhggAiACQShqNgIIIAEoAgAgASgCBCACQRBqEPcBDA4LIAIgACgCBDYCCCACQQI2AhQgAkG00sAANgIQIAJCATcCHCACQQc2AiwgAiACQShqNgIYIAIgAkEIajYCKCABKAIAIAEoAgQgAkEQahD3AQwNCyACIAApAgQ3AgggAkEBNgIUIAJBzNLAADYCECACQgE3AhwgAkEINgIsIAIgAkEoajYCGCACIAJBCGo2AiggASgCACABKAIEIAJBEGoQ9wEMDAsgASgCAEHI0cAAQQogASgCBCgCDBECAAwLCyABKAIAQdTSwABBCiABKAIEKAIMEQIADAoLIAEoAgBB3tLAAEEMIAEoAgQoAgwRAgAMCQsgASgCAEHq0sAAQQ4gASgCBCgCDBECAAwICyABKAIAQfjSwABBCCABKAIEKAIMEQIADAcLIAEoAgBBgNPAAEEDIAEoAgQoAgwRAgAMBgsgASgCAEGD08AAQQQgASgCBCgCDBECAAwFCyABKAIAQYfTwABBDCABKAIEKAIMEQIADAQLIAEoAgBBk9PAAEEPIAEoAgQoAgwRAgAMAwsgASgCAEGi08AAQQ0gASgCBCgCDBECAAwCCyABKAIAQa/TwABBDiABKAIEKAIMEQIADAELIAEoAgAgACgCBCAAKAIIIAEoAgQoAgwRAgALIAJBMGokAAuIBQIMfwN+IwBBoAFrIggkACAIQQBBoAH8CwACQAJAIAIgACgCoAEiBU0EQCAFQSlPDQIgBUECdCEJIAVBAWohDCABIAJBAnRqIQ0CQANAIAggBkECdGohAwNAIAYhAiADIQQgASANRg0EIANBBGohAyACQQFqIQYgASgCACEHIAFBBGoiCyEBIAdFDQALIAetIRFCACEPIAkhByACIQEgACEDA0AgAUEoTw0CIAQgDyAENQIAfCADNQIAIBF+fCIQPgIAIBBCIIghDyAEQQRqIQQgAUEBaiEBIANBBGohAyAHQQRrIgcNAAsCQCAKIBBCgICAgBBaBH8gAiAFaiIBQShPDQEgCCABQQJ0aiAPPgIAIAwFIAULIAJqIgEgASAKSRshCiALIQEMAQsLIAFBKEH0x8AAEHYACyABQShB9MfAABB2AAsgAkECdCEMIAJBAWohDSAAIAVBAnRqIQ4gACEDAkADQCAIIAdBAnRqIQYDQCAHIQsgBiEEIAMgDkYNAyAEQQRqIQYgB0EBaiEHIAMoAgAhCSADQQRqIgUhAyAJRQ0ACyAJrSERQgAhDyAMIQkgCyEDIAEhBgNAIANBKE8NAiAEIA8gBDUCAHwgBjUCACARfnwiED4CACAQQiCIIQ8gBEEEaiEEIANBAWohAyAGQQRqIQYgCUEEayIJDQALAkAgCiAQQoCAgIAQWgR/IAIgC2oiA0EoTw0BIAggA0ECdGogDz4CACANBSACCyALaiIDIAMgCkkbIQogBSEDDAELCyADQShB9MfAABB2AAsgA0EoQfTHwAAQdgALIAAgCEGgAfwKAAAgACAKNgKgASAIQaABaiQADwsgBUEoQfTHwAAQjAIAC90EAgR/A34CQAJAAkAgAUEITwRAIAFBB3EiA0UNASAAKAKgASICQSlPDQIgAkUEQCAAQQA2AqABDAILIAJBAnQhBCADQQJ0QYijwABqKAIAIAN2rSEIIAAhAwNAIAMgAzUCACAIfiAGfCIHPgIAIANBBGohAyAHQiCIIQYgBEEEayIEDQALIAAgB0KAgICAEFoEfyACQShGDQQgACACQQJ0aiAGPgIAIAJBAWoFIAILNgKgAQwBCyAAKAKgASICQSlPDQEgAkUEQCAAQQA2AqABDwsgAUECdEGIo8AAajUCACEIIAJBAnQhBCAAIQMDQCADIAM1AgAgCH4gBnwiBz4CACADQQRqIQMgB0IgiCEGIARBBGsiBA0ACyAAIAdCgICAgBBaBH8gAkEoRg0DIAAgAkECdGogBj4CACACQQFqBSACCzYCoAEPCwJAIAFBCHEEQCAAKAKgASICQSlPDQICQCACRQRAQQAhAgwBCyAAIAJBAnQiBGpCACEGIAAhAwNAIAMgAzUCAELh6xd+IAZ8Igc+AgAgA0EEaiEDIAdCIIghBiAEQQRrIgQNAAsgB0KAgICAEFQNACACQShGDQIgBj4CACACQQFqIQILIAAgAjYCoAELIAFBEHEEQCAAQbCjwABBAhAyCyABQSBxBEAgAEG4o8AAQQMQMgsgAUHAAHEEQCAAQcSjwABBBRAyCyABQYABcQRAIABB2KPAAEEKEDILIAFBgAJxBEAgAEGApMAAQRMQMgsgACABEC0aDwsMAQsgAkEoQfTHwAAQjAIAC0EoQShB9MfAABB2AAv+BQEFfyAAQQhrIgEgAEEEaygCACIDQXhxIgBqIQICQAJAIANBAXENACADQQJxRQ0BIAEoAgAiAyAAaiEAIAEgA2siAUGAwMEAKAIARgRAIAIoAgRBA3FBA0cNAUH4v8EAIAA2AgAgAiACKAIEQX5xNgIEIAEgAEEBcjYCBCACIAA2AgAPCyABIAMQRAsCQAJAAkACQAJAIAIoAgQiA0ECcUUEQCACQYTAwQAoAgBGDQIgAkGAwMEAKAIARg0DIAIgA0F4cSICEEQgASAAIAJqIgBBAXI2AgQgACABaiAANgIAIAFBgMDBACgCAEcNAUH4v8EAIAA2AgAPCyACIANBfnE2AgQgASAAQQFyNgIEIAAgAWogADYCAAsgAEGAAkkNAiABIAAQT0EAIQFBmMDBAEGYwMEAKAIAQQFrIgA2AgAgAA0EQeC9wQAoAgAiAARAA0AgAUEBaiEBIAAoAggiAA0ACwtBmMDBAEH/HyABIAFB/x9NGzYCAA8LQYTAwQAgATYCAEH8v8EAQfy/wQAoAgAgAGoiADYCACABIABBAXI2AgRBgMDBACgCACABRgRAQfi/wQBBADYCAEGAwMEAQQA2AgALIABBkMDBACgCACIDTQ0DQYTAwQAoAgAiAkUNA0EAIQBB/L/BACgCACIEQSlJDQJB2L3BACEBA0AgAiABKAIAIgVPBEAgAiAFIAEoAgRqSQ0ECyABKAIIIQEMAAsAC0GAwMEAIAE2AgBB+L/BAEH4v8EAKAIAIABqIgA2AgAgASAAQQFyNgIEIAAgAWogADYCAA8LIABB+AFxQei9wQBqIQICf0Hwv8EAKAIAIgNBASAAQQN2dCIAcUUEQEHwv8EAIAAgA3I2AgAgAgwBCyACKAIICyEAIAIgATYCCCAAIAE2AgwgASACNgIMIAEgADYCCA8LQeC9wQAoAgAiAQRAA0AgAEEBaiEAIAEoAggiAQ0ACwtBmMDBAEH/HyAAIABB/x9NGzYCACADIARPDQBBkMDBAEF/NgIACwv+BAEHfyMAQSBrIgYkAAJAAkAgAkUNACACQQdrIgNBACACIANPGyEIIAFBA2pBfHEgAWshCUEAIQMDQAJAAkACQCABIANqLQAAIgXAIgdBAE4EQCAJIANrQQNxDQEgAyAITw0CA0AgASADaiIFQQRqKAIAIAUoAgByQYCBgoR4cQ0DIANBCGoiAyAISQ0ACwwCCwJAAkACQAJAAkACQAJAIAVBuLjAAGotAABBAmsOAwABAgULIANBAWoiAyACTw0EIAEgA2osAABBv39KDQQMBQsgA0EBaiIEIAJPDQMgASAEaiwAACEEAkAgBUHgAUcEQCAFQe0BRg0BIAdBH2pB/wFxQQxJDQMgB0F+cUFuRw0FIARBQEgNBAwFCyAEQWBxQaB/Rg0DDAQLIARBn39KDQMMAgsgA0EBaiIEIAJPDQIgASAEaiwAACEEAkACQAJAAkAgBUHwAWsOBQEAAAACAAsgB0EPakH/AXFBAksNBSAEQUBIDQIMBQsgBEHwAGpB/wFxQTBJDQEMBAsgBEGPf0oNAwsgA0ECaiIFIAJPDQIgASAFaiwAAEG/f0oNAiADQQNqIgMgAk8NAiABIANqLAAAQUBIDQMMAgsgBEFATg0BCyADQQJqIgMgAk8NACABIANqLAAAQb9/TA0BCyAGIAI2AhAgBiABNgIMIAZBBjoACCAGQQhqIAZBH2pB+MrAABB8IQEgAEGAgICAeDYCACAAIAE2AgQMBgsgA0EBaiEDDAILIANBAWohAwwBCyACIANNDQADQCABIANqLAAAQQBIDQEgAiADQQFqIgNHDQALDAILIAIgA0sNAAsLIAAgASACEI0BCyAGQSBqJAALjwUCA38BfiMAQdAAayICJAAgAiABNgIQAkACQAJAAkAgAkEQahCFAiIDBEAgAiADKAIAEJ4CIgE2AhwgAkEANgIYIAJBADYCICACIAM2AhQgAkEkakGAgAQgASABQYCABE8bELcBA0AgAkEIaiACQRRqEJcBQYGAgIB4IQEgAigCCEEBcQRAIAIoAgwhASACIAIoAiBBAWo2AiAgAkFAayABECkgAigCRCEDIAIoAkAiAUGBgICAeEYNAyACKQJIIQULIAIgBTcCOCACIAM2AjQgAiABNgIwIAFBgYCAgHhHBEAgAkEkaiACQTBqEJ8BDAELCyACQTBqEOsBIAAgAikCJDcCACAAQQhqIAJBLGooAgA2AgAMBAsgAkFAayABEFYgAigCQCEBAkACQAJAIAItAEQiA0ECaw4CAgABCyAAQYCAgIB4NgIAIAAgATYCBAwFCyACIAM6ACggAiABNgIkIAJBFGpBABC3AQNAIAIgAkEkahBlQYGAgIB4IQEgAigCACIEQQJHBEAgAigCBCEDIARBAXENBCACQUBrIAMQKSACKAJEIQMgAigCQCIBQYGAgIB4Rg0EIAIpAkghBQsgAiAFNwI4IAIgAzYCNCACIAE2AjAgAUGBgICAeEcEQCACQRRqIAJBMGoQnwEMAQsLIAJBMGoQ6wEgACACKQIUNwIAIABBCGogAkEcaigCADYCAAwDCyACQRBqIAJBQGtB1MvAABA9IQEgAEGAgICAeDYCACAAIAE2AgQMAwsgAEGAgICAeDYCACAAIAM2AgQgAkEkahCtAQwCCyAAQYCAgIB4NgIAIAAgAzYCBCACQRRqEK0BCyACKAIkEPsBCyACKAIQEPsBIAJB0ABqJAAL5AQCB38BfiMAQRBrIgMkAAJAIAAvAQwiAkUEQCAAKAIAIAAoAgQgARA+IQEMAQsgA0EIaiABQQhqKQIANwMAIAMgASkCADcDAAJAAn8gACkCCCIJpyIFQYCAgAhxRQRAIAMoAgQMAQsgACgCACADKAIAIAMoAgQiASAAKAIEKAIMEQIADQEgACAFQYCAgP95cUGwgICAAnIiBTYCCCADQgE3AwAgAiABQf//A3FrIgFBACABIAJNGyECQQALIQQgAygCDCIGBEAgAygCCCEBIAZBDGwhCANAAn8CQAJAAkAgAS8BAEEBaw4CAgEACyABQQRqKAIADAILIAFBCGooAgAMAQsgAUECai8BACIHQegHTwRAQQRBBSAHQZDOAEkbDAELQQEgB0EKSQ0AGkECQQMgB0HkAEkbCyEGIAFBDGohASAEIAZqIQQgCEEMayIIDQALCwJAIAJB//8DcSAESwRAIAIgBGshBEEAIQFBACECAkACQAJAIAVBHXZBA3FBAWsOAwABAAILIAQhAgwBCyAEQf7/A3FBAXYhAgsgBUH///8AcSEHIAAoAgQhBiAAKAIAIQUDQCABQf//A3EgAkH//wNxTw0CIAFBAWohASAFIAcgBigCEBEBAEUNAAsMAgsgACgCACAAKAIEIAMQPiEBIAAgCTcCCAwCCyAFIAYgAxA+DQAgBCACa0H//wNxIQRBACECA0AgBCACQf//A3FNBEBBACEBIAAgCTcCCAwDC0EBIQEgAkEBaiECIAUgByAGKAIQEQEARQ0ACyAAIAk3AggMAQtBASEBCyADQRBqJAAgAQvJBAIGfwF+An8gAUUEQCAAKAIIIQZBLSELIAVBAWoMAQtBK0GAgMQAIAAoAggiBkGAgIABcSIBGyELIAFBFXYgBWoLIQkCQCAGQYCAgARxRQRAQQAhAgwBCyADBEAgAiEBIAMhCANAIAcgASwAAEG/f0pqIQcgAUEBaiEBIAhBAWsiCA0ACwsgByAJaiEJCwJAIAAvAQwiCCAJSwRAAkACQCAGQYCAgAhxRQRAIAggCWshCUEAIQFBACEIAkACQAJAIAZBHXZBA3FBAWsOAwABAAILIAkhCAwBCyAJQf7/A3FBAXYhCAsgBkH///8AcSEKIAAoAgQhBiAAKAIAIQADQCABQf//A3EgCEH//wNxTw0CQQEhByABQQFqIQEgACAKIAYoAhARAQBFDQALDAQLIAAgACkCCCIMp0GAgID/eXFBsICAgAJyNgIIQQEhByAAKAIAIgYgACgCBCIKIAsgAiADELsBDQNBACEBIAggCWtB//8DcSECA0AgAUH//wNxIAJPDQIgAUEBaiEBIAZBMCAKKAIQEQEARQ0ACwwDC0EBIQcgACAGIAsgAiADELsBDQIgACAEIAUgBigCDBECAA0CIAkgCGtB//8DcSECQQAhAQNAIAIgAUH//wNxTQRAQQAPCyABQQFqIQEgACAKIAYoAhARAQBFDQALDAILIAYgBCAFIAooAgwRAgANASAAIAw3AghBAA8LQQEhByAAKAIAIgEgACgCBCIAIAsgAiADELsBDQAgASAEIAUgACgCDBECACEHCyAHC7oEAQh/IwBBEGsiAyQAIAMgATYCBCADIAA2AgAgA0KggICADjcCCAJ/AkACQAJAIAIoAhAiCQRAIAIoAhQiAA0BDAILIAIoAgwiAEUNASACKAIIIgEgAEEDdGohBCAAQQFrQf////8BcUEBaiEGIAIoAgAhAANAAkAgAEEEaigCACIFRQ0AIAMoAgAgACgCACAFIAMoAgQoAgwRAgBFDQBBAQwFC0EBIAEoAgAgAyABQQRqKAIAEQEADQQaIABBCGohACAEIAFBCGoiAUcNAAsMAgsgAEEYbCEKIABBAWtB/////wFxQQFqIQYgAigCCCEEIAIoAgAhAANAAkAgAEEEaigCACIBRQ0AIAMoAgAgACgCACABIAMoAgQoAgwRAgBFDQBBAQwEC0EAIQdBACEIAkACQAJAIAUgCWoiAUEIai8BAEEBaw4CAQIACyABQQpqLwEAIQgMAQsgBCABQQxqKAIAQQN0ai8BBCEICwJAAkACQCABLwEAQQFrDgIBAgALIAFBAmovAQAhBwwBCyAEIAFBBGooAgBBA3RqLwEEIQcLIAMgBzsBDiADIAg7AQwgAyABQRRqKAIANgIIQQEgBCABQRBqKAIAQQN0aiIBKAIAIAMgASgCBBEBAA0DGiAAQQhqIQAgBUEYaiIFIApHDQALDAELCwJAIAYgAigCBE8NACADKAIAIAIoAgAgBkEDdGoiACgCACAAKAIEIAMoAgQoAgwRAgBFDQBBAQwBC0EACyADQRBqJAALqgQBAn8CQAJAAkACQAJAAn8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAALQDsAUEBaw4HCgYAAQIDBAULIALAQUBODQYgACgC6AEhBCAAQQA2AugBIAEgBCACQT9xchCCASAAQQw6AIAKDBELIAJB4AFxQaABRg0PDAULIALAQaB/Tg0EDA4LIAJB8ABqQf8BcUEwSSIEQQF0IQMMBwsgAsBBkH9IIgRBAXQhAwwGCyACwEEATg0CIAJBPmpB/wFxQR5JDQNBBiEDAkACQCACQf8BcSIEQfABaw4FCwEBAQoAC0EEIARB4AFGDQgaIARB7QFGDQcLQQIgAkH+AXFB7gFGIAJBH2pB/wFxQQxJcg0HGiACQQ9qQf8BcUEDSSIDRQ0KDAkLIALAQUBIDQoLDAgLIAEgAkH/AXEQggEgAEEMOgCACgwJCyAAIAAoAugBIAJBH3FBBnRyNgLoAUEDIQMMCAsgAsBBQEgiBEEBdCEDCyAERQ0EIAAgACgC6AEgAkE/cUEMdHI2AugBDAYLQQULIQMgACAAKALoASACQQ9xQQx0cjYC6AEMBAtBByEDCyAAIAAoAugBIAJBB3FBEnRyNgLoAQwCCyAAQQA2AugBIAEoAhQhAiABLQAYQQFGBEAgAUEAOgAYIAEgAkEDazYCDAsgAEEMOgCACiABIAI2AhAMAQsgACAAKALoASACQT9xQQZ0cjYC6AFBAyEDCyAAIAM6AOwBC6MEAQd/IwBBoAprIgMkACADQQBBgAH8CwAgA0EANgLwASADQQw6AIAKIANBgAFqQQBB5QD8CwAgA0EAOgCBCiADQQA2AvQBIANCADcC+AkgA0EAOgDsASADQQA2AugBIANCADcClAogA0IANwKMCiADQQA6AJwKIANCgICAgMAANwKECgNAAkACQCACBEAgAyADKAKYCkEBajYCmAogAS0AACEEIAMtAIAKIgdBD0YEQCADIANBhApqIAQQOgwDCyAEQfaZwQBqLQAAIgVFBEAgB0EIdCAEckH2mcEAai0AACEFCyAFQfABcUEEdiEIIAVBD3EiBkUEQCADIANBhApqIAggBBArDAMLQQghCQJAAkACQCAHQQlrDgUAAgICAQILQQ4hCQsgAyADQYQKaiAJIAQQKwsgBUEPTQ0BIAMgA0GECmogCCAEECsMAQsgAyADKAKYCjYClAogA0GECmogAy0AnAoQjgEgAEEIaiADQYwKaigCADYCACAAIAMpAoQKNwIAIANBoApqJAAPCwJAAkACQAJAAkAgBkEFaw4JAgQEBAACBAQDAQsgAyADQYQKakEGIAQQKwwDCyAGQQFHDQILIANBADoAgQogA0EANgLwASADQQA7Af4JIANBADoA5AEgA0EANgLgAQwBCyADKAL0AQRAIANBADYC9AELIANBADYC+AkLIAMgBjoAgAoLIAFBAWohASACQQFrIQIMAAsAC/kDAQJ/IAAgAWohAgJAAkAgACgCBCIDQQFxDQAgA0ECcUUNASAAKAIAIgMgAWohASAAIANrIgBBgMDBACgCAEYEQCACKAIEQQNxQQNHDQFB+L/BACABNgIAIAIgAigCBEF+cTYCBCAAIAFBAXI2AgQgAiABNgIADAILIAAgAxBE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ADYCGCAAQgQ3AiAgAEEYakGQu8EAEMYBAAv2AQECfyMAQTBrIgIkAAJAIAApAwBC////////////AINCgICAgICAgPj/AFoEQCACQQE2AhQgAkHA08AANgIQIAJCATcCHCACQR42AiwgAiAANgIoIAIgAkEoajYCGCABKAIAIAEoAgQgAkEQahD3ASEDDAELIAJBADoADCACIAE2AghBASEDIAJBATYCFCACQcDTwAA2AhAgAkIBNwIcIAJBHjYCLCACIAA2AiggAiACQShqNgIYIAJBCGogAkEQahD2AQ0AIAItAAxFBEAgASgCAEHI08AAQQIgASgCBCgCDBECAA0BC0EAIQMLIAJBMGokACADC/gBAQN/IwBBIGsiAyQAAkACf0EAIAEgASACaiICSw0AGkEAQQggAiAAKAIAIgRBAXQiASABIAJJGyIBIAFBCE0bIgFBAEgNABogAyAEBH8gAyAENgIcIAMgACgCBDYCFEEBBUEACzYCGCADQQhqIQICfwJAIANBFGoiBCgCBEUNACAEKAIIIgVFDQAgBCgCACAFQQEgARAwDAELIAEQJAshBCACIAE2AgggAiAEQQEgBBs2AgQgAiAERTYCACADKAIIQQFHDQEgAygCEBogAygCDAtB1JLAABDnAQALIAMoAgwhAiAAIAE2AgAgACACNgIEIANBIGokAAuzAQEDfyMAQRBrIgUkACABKAIIIgMgAksEQCABKAIEIAJBA3RqIgQoAgQhASAEKAIAIQQgACADIAJBAWpLBH8gBUEANgIMIAVBDSAFQQxqEJ4BQQAhAiAFKAIEIgMgAU0EQCAEQQAgBSgCACADIAQgASADa2ogAxDRARshAgsgAiAEIAIbIQQgASADQQAgAhtrBSABCzYCBCAAIAQ2AgAgBUEQaiQADwsgAiADQZiawAAQdgALsQEAAkAgAEGAAU8EQCAAQYAQSQ0BIABBgIAETwRAIAEgAEE/cUGAAXI6AAMgASAAQRJ2QfABcjoAACABIABBBnZBP3FBgAFyOgACIAEgAEEMdkE/cUGAAXI6AAEPCyABIABBP3FBgAFyOgACIAEgAEEMdkHgAXI6AAAgASAAQQZ2QT9xQYABcjoAAQ8LIAEgADoAAA8LIAEgAEE/cUGAAXI6AAEgASAAQQZ2QcABcjoAAAu+AQICfwF+IwBBIGsiAiQAIAAQ/gEgAEEIayEDAkACQCABRQRAIAMoAgBBAUcNAiACQRhqIABBHGopAgA3AwAgAkEQaiAAQRRqKQIANwMAIAJBCGogAEEMaikCADcDACAAKQIEIQQgA0EANgIAIAIgBDcDAAJAIANBf0YNACAAQQRrIgAgACgCAEEBayIANgIAIAANACADQSwQgAELIAIQmgEMAQsgAxDbAQsgAkEgaiQADwtBldDAAEE/EJQCAAupAQICfwF+IwBBEGsiBCQAIAACfwJAIAIgA2pBAWtBACACa3GtIAGtfiIGQiCIUARAIAanIgNBgICAgHggAmtNDQELIABBADYCBEEBDAELIANFBEAgACACNgIIIABBADYCBEEADAELIARBCGogAiADENIBIAQoAggiBQRAIAAgBTYCCCAAIAE2AgRBAAwBCyAAIAM2AgggACACNgIEQQELNgIAIARBEGokAAvCAQEFfyMAQRBrIgMkACABKAIMIQICQAJAAkACQAJAAkAgASgCBA4CAAECCyACDQFBASECQQAhAQwCCyACDQAgASgCACICKAIEIQEgAigCACECDAELIAAgARBTDAELIANBBGogAUEBQQEQXyADKAIIIQQgAygCBEEBRg0BIAMoAgwhBSABBEAgBSACIAH8CgAACyAAIAE2AgggACAFNgIEIAAgBDYCAAsgA0EQaiQADwsgAygCDCEGIARBxM7AABDnAQALrQEBBX8gACgCBCEBIAAoAgAhAiAAQoSAgIDAADcCAAJAIAEgAkYNACABIAJrQQR2IQEDQCABRQ0BIAIoAgAgAkEEaigCABCOAiABQQFrIQEgAkEQaiECDAALAAsgACgCECICBEACQCAAKAIMIgMgACgCCCIAKAIIIgFGDQAgAkEEdCIERQ0AIAAoAgQiBSABQQR0aiAFIANBBHRqIAT8CgAACyAAIAEgAmo2AggLC5kBAQJ/AkAgAEEJayIBQRhPBEBBACEBIABBgAFJDQECQCAAQQh2IgIEQCACQTBHBEAgAkEgRg0CIAJBFkcNBCAAQYAtRiEBDAQLIABBgOAARiEBDAMLIABB/wFxQfegwABqLQAAIQEMAgsgAEH/AXFB96DAAGotAABBAnFBAXYhAQwBC0EAQZ+AgAQgAXZBAXFrIQELIAFBAXELlAEBBX8jAEEQayIDJAACQCACQQdNBEAgAiEE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IAUoAgRBAUYEQCAFKAIMIQYgASAEEOcBAAsgACAFKAIMNgIEIAAgATYCACAFQRBqJAALUwAjAEEgayIAJAAgAEEBNgIEIABB1JfAADYCACAAQgE3AgwgAEEONgIcIABBvJfAADYCGCAAIABBGGo2AgggASgCACABKAIEIAAQOSAAQSBqJAALTgECfyAAKAIMIAAoAgQiAWtBGG4hAgNAIAIEQCABKAIAIAFBBGooAgAQjwIgAkEBayECIAFBGGohAQwBCwsgACgCCCAAKAIAQQRBGBB3C0gCAX8CfiMAQSBrIgIkACACIAApAwAiAyADQj+HIgSFIAR9IAJBDGoQSCABIANCAFlBAUEAIAIoAgAgAigCBBA4IAJBIGokAAtYAQF/IAEoAgwhAgJAAkACQAJAIAEoAgQOAgABAgsgAg0BQQEhAUEAIQIMAgsgAg0AIAEoAgAiASgCBCECIAEoAgAhAQwBCyAAIAEQUw8LIAAgASACEIwBC0gBAn8jAEEQayICJAAgASgCAAR/IAJBCGogARCkASACKAIMIQMgAigCCEEBcQVBAAshASAAIAM2AgQgACABNgIAIAJBEGokAAtIAQJ/IwBBEGsiAiQAIAAgASgCAEGAgICAeEcEfyACQQhqIAEQmwEgAigCCCEDIAIoAgwFQQALNgIEIAAgAzYCACACQRBqJAALSAACQCADRQ0AAkAgAiADTQRAIAIgA0cNAQwCCyABIANqLAAAQb9/Sg0BCyABIAJBACADIAQQ/AEACyAAIAM2AgQgACABNgIAC1IBBH8gACgCFCEBIAAoAhgiAygCACICBEAgASACEQQACyADKAIEIgIEQCADKAIIIQQgASACEIABCyAAKAIEIgEgACgCCBDFASAAKAIAIAEQkAILSQEBfyMAQSBrIgIkACACQRhqIAFBCGooAgA2AgAgAiABKQIANwMQIAJBCGogAkEQakHU0MAAEHggACACKQMINwMAIAJBIGokAAtHAQF/IAAoAgAgACgCCCIDayACSQRAIAAgAyACEFsgACgCCCEDCyACBEAgACgCBCADaiABIAL8CgAACyAAIAIgA2o2AghBAAuGAQEDfyAAKAIIIgQgACgCAEYEQCMAQRBrIgMkACADQQhqIAAgACgCAEEBQQRBEBBMIAMoAggiBUGBgICAeEcEQCADKAIMGiAFIAIQ5wEACyADQRBqJAALIAAgBEEBajYCCCAAKAIEIARBBHRqIgAgASkCADcCACAAQQhqIAFBCGopAgA3AgALOQAgASACEF0gAAJ/QQEgAUGAAUkNABpBAiABQYAQSQ0AGkEDQQQgAUGAgARJGws2AgQgACACNgIAC4cBAQN/IAAoAggiAyAAKAIARgRAIwBBEGsiAiQAIAJBCGogACAAKAIAQQRBEBBUIAIoAggiBEGBgICAeEcEQCACKAIMGiAEQcTLwAAQ5wEACyACQRBqJAALIAAgA0EBajYCCCAAKAIEIANBBHRqIgAgASkCADcCACAAQQhqIAFBCGopAgA3AgALDQAgACABIAJBBRClAgsNACAAIAEgAkEGEKUCC4cBAQN/IAAoAggiAyAAKAIARgRAIwBBEGsiAiQAIAJBCGogACAAKAIAQQhBEBBUIAIoAggiBEGBgICAeEcEQCACKAIMGiAEQbTOwAAQ5wEACyACQRBqJAALIAAgA0EBajYCCCAAKAIEIANBBHRqIgAgASkDADcDACAAQQhqIAFBCGopAwA3AwALSAECfyMAQRBrIgUkACAFQQhqIAAgASACIAMgBBBMIAUoAggiAEGBgICAeEcEQCAFKAIMIQYgAEGUl8AAEOcBAAsgBUEQaiQAC0IBAX8gASgCBCICIAEoAghPBH9BAAUgASACQQFqNgIEIAEoAgAoAgAgAhDiASEBQQELIQIgACABNgIEIAAgAjYCAAtEAQF/IwBBIGsiAyQAIAMgAjYCHCADIAE2AhggAyACNgIUIANBCGogA0EUakGkvMEAEHggACADKQMINwMAIANBIGokAAsLACAAIAFBARCmAgsLACAAIAFBAhCmAgtHAQJ/IwBBIGsiAiQAIAJBAzoACCACIAE5AxAgAkEIaiACQR9qQaTNwAAQeiEDIABBgYCAgHg2AgAgACADNgIEIAJBIGokAAtCAQF/IwBBIGsiAyQAIANBADYCECADQQE2AgQgA0IENwIIIAMgATYCHCADIAA2AhggAyADQRhqNgIAIAMgAhDGAQALOQEBfyMAQSBrIgIkACACQQhqIAAoAgAgAkEWahBKIAFBAUEBQQAgAigCCCACKAIMEDggAkEgaiQAC/pPAxl/FX4BfCABKAIIIgZBgICAAXEhBCAAKwMAITAgBkGAgICAAXFFBEACfyABIQUg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ACAIQQFxaiIINgIAIAAgAUkgACAIS3IhCCACQQRqIQIgB0EEaiEHIARBAWsiBA0ACyAIRQ0RCyADIAY2AvwBIAlBAmohCQsgDiAGIAYgDkkbIgBBKU8NDSAAQQJ0IQICQAJAAkADQCACRQ0BIAJBBGsiAiADQdwAamooAgAiASACIANByARqaigCACIERg0ACyABIARPDQEgBiEADAILIANByARqIgEgASACakYNACAGIQAMAQsgAARAQQEhCCADQcgEaiEHIANB3ABqIQIgACEEA0AgAiACKAIAIgYgBygCAEF/c2oiASAIQQFxaiIINgIAIAEgBkkgASAIS3IhCCACQQRqIQIgB0EEaiEHIARBAWsiBA0ACyAIRQ0RCyADIAA2AvwBIAlBAWohCQsgCkERRg0EIANBywBqIApqIAlBMGo6AAAgAygCoAMiESAAIAAgEUkbIgJBKU8NECAKQQFqIQkgAkECdCECAn8CQANAIAJFDQEgAkEEayICIANB3ABqaigCACIBIAIgA0GAAmpqKAIAIgRGDQALIAEgBEsgASAESWsMAQtBf0EAIANBgAJqIgEgASACakcbCyEYIANB3AlqIANB3ABqQaQB/AoAAAJAAkAgAygCxAQiBiADKAL8CiIBIAEgBkkbIgFBKE0EQCABDQFBACEBDAILDBALQQAhCCADQaQDaiEHIANB3AlqIQIgASEEA0AgAiACKAIAIhkgBygCAGoiFiAIQQFxaiIINgIAIBYgGUkgCCAWSXIhCCACQQRqIQIgB0EEaiEHIARBAWsiBA0ACyAIRQ0AIAFBKEYNEiADQdwJaiABQQJ0akEBNgIAIAFBAWohAQsgAyABNgL8CiABIA4gASAOSxsiAkEpTw0QIAJBAnQhAiAMIBhKIghFAn8CQANAIAJFDQEgAkEEayICIANByARqaigCACIBIAIgA0HcCWpqKAIAIgRGDQALIAEgBEsgASAESWsMAQtBf0EAIANB3AlqIgEgASACakcbCyIBIAxOcUUEQCABIAxIDQMMCgtBACEBIAMCf0EAIABFDQAaIABBAnQiByADQdwAaiICakIAIRwDQCACIAI1AgBCCn4gHHwiGz4CACACQQRqIQIgG0IgiCEcIAdBBGsiBw0ACyAAIBtCgICAgBBUDQAaIABBKEYNEiAcPgIAIABBAWoLIgg2AvwBAkAgEUUNACARQQJ0IgcgA0GAAmoiAmpCACEcA0AgAiACNQIAQgp+IBx8Ihs+AgAgAkEEaiECIBtCIIghHCAHQQRrIgcNAAsgG0KAgICAEFQEQCARIQEMAQsgEUEoRg0SIBw+AgAgEUEBaiEBCyADIAE2AqADAkAgBkUEQEEAIQYMAQsgBkECdCIHIANBpANqIgJqQgAhHANAIAIgAjUCAEIKfiAcfCIbPgIAIAJBBGohAiAbQiCIIRwgB0EEayIHDQALIBtCgICAgBBUDQAgBkEoRg0SIBw+AgAgBkEBaiEGCyADIAY2AsQEIA8gCCAIIA9JGyIAQShNDQALCwwLCyAIRQ0FIANB3ABqQQEQLRogAygC6AUiACADKAL8ASIBIAAgAUsbIgJBKU8NDSACQQJ0IQIgA0HYAGohAANAIAJFDQMgACACaigCACIBIAJBBGsiAiADQcgEamooAgAiBEYNAAsgASAESQ0GDAULIAZBKEH0x8AAEIwCAAtBEUERQeikwAAQdgALIANByARqIgAgACACakcNAwwCCwwHCwwICyADQcsAaiAJaiEEQX8hByAJIQICQANAIAIiAEUNASAHQQFqIQcgAkEBayICIANBywBqIgFqLQAAQTlGDQALIAEgAmoiBCAELQAAQQFqOgAAIAdFIAAgCktyDQEgACABakEwIAf8CwAMAQsgA0ExOgBLAkAgCgRAIAoEQCADQcwAakEwIAr8CwALIApBD0sNAQsgBEEwOgAAIAtBAWohCyAKQQJqIQkMAgsgCUERQfikwAAQdgALIApBEUkNACAJQRFBiKXAABCMAgALIANBCGogA0HLAGogCSALQQAgA0HcCWoQSSADKAIMIQEgAygCCAshACADIAE2AsQIIAMgADYCwAggAyANNgK8CCADIBI2ArgIIAUgA0G4CGoQNyADQYALaiQADAYLIANBADYC3AkjAEEQayIBJAAgASADQbgIajYCDCABIANBkAdqNgIIIwBB8ABrIgAkACAAQdi0wAA2AgwgACABQQhqNgIIIABB2LTAADYCFCAAIAFBDGo2AhAgAEECNgIcIABB6LTAADYCGAJAIANB3AlqIgEoAgAEQCAAQTBqIAFBEGopAgA3AwAgAEEoaiABQQhqKQIANwMAIAAgASkCADcDICAAQQQ2AlwgAEHQtcAANgJYIABCBDcC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IQJBACEDDAILIAMNACACKAIAIgIoAgQhAyACKAIAIQIMAQsgAEGAgICAeDYCACAAIAE2AgwgASgCCCIBLQAIIQIgAS0ACRogAEEfIAIQdQALIAAgAzYCBCAAIAI2AgAgASgCCCIBLQAIIQIgAS0ACRogAEEgIAIQdQALLAAgACAALQAEIAFBLkZyOgAEIAAoAgAiACgCACABIABBBGooAgAoAhARAQALoAIBA38jAEEQayIEJAAjAEFAaiIDJAAgA0EIaiAAEJEBIAMoAgghACADIAL8AzsBGiADIAJEAAAQAAAA8EFiOwEYIAMgAfwDOwEWIAMgAUQAABAAAADwQWI7ARQgA0EcaiAAIANBFGoQKgJAAkAgAygCJCIABEAgA0EoaiIFQYiZwABBBBCMASAAQQFrIgBFDQEgA0E0aiAAEJABIAUgAygCOCIAIAMoAjwQgQIgAygCNCAAEI4CDAELIANBgICAgHg2AigMAQsgA0EoakGMmcAAQZOZwAAQugELIANBHGoQ4QEgAygCDEEANgIAIAMoAhAQ2wEgAyADQShqEJgBIAQgAykDADcCACADQUBrJAAgBCgCACAEKAIEIARBEGokAAstAQF+QajAwQApAwAhAUGowMEAQgA3AwAgACABQiCIPgIEIAAgAadBAUY2AgALigEBBH8jAEEQayIDJAAjAEEwayICJAAgAkEQaiAAIAEQpQEgAkEkaiACKAIQIgAgAigCFCIBEEsgAkEYaiIEIAIoAigiBSACKAIsEI0BIAIoAiQgBRDsASABIAAQigIgAkEIaiAEEJsBIAMgAikDCDcCACACQTBqJAAgAygCACADKAIEIANBEGokAAspAQJ/IAFBABDiASECIAFBARDiASEDIAEQ+wEgACADNgIEIAAgAjYCAAskAQF/IAAoAgAgACgCCCICayABSQRAIAAgAiABQQFBARCjAQsLJAEBfyAAKAIAIAAoAggiAmsgAUkEQCAAIAIgAUEEQRAQowELCyoAIAAgASgCDDsBBiAAIAEoAgg7AQQgACABKAIEOwECIAAgASgCADsBAAskACAAIAAoAgBBgICAgHhGQQJ0aiIAKAIAIABBBGooAgAQigILJQAgAEUEQEHk0MAAQTIQlAIACyAAIAIgAyAEIAUgASgCEBERAAtTAQJ/IAEgA0YEf0EAIQMCQCABRQ0A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LXdpZHRoLTAuMS4xNFxzcmNcdGFibGVzLnJzAFY6XC5jYWNoZVxjYXJnb1xyZWdpc3RyeVxzcmNcaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2Zcd2FzbS1iaW5kZ2VuLTAuMi4xMDBcc3JjXGNvbnZlcnRcc2xpY2VzLnJzAEM6XFVzZXJzXGRhdmlkXC5ydXN0dXBcdG9vbGNoYWluc1xzdGFibGUteDg2XzY0LXBjLXdpbmRvd3MtbXN2Y1xsaWIvcnVzdGxpYi9zcmMvcnVzdFxsaWJyYXJ5L2FsbG9jL3NyYy9zdHIucnMAQzpcVXNlcnNcZGF2aWRcLnJ1c3R1cFx0b29sY2hhaW5zXHN0YWJsZS14ODZfNjQtcGMtd2luZG93cy1tc3ZjXGxpYi9ydXN0bGliL3NyYy9ydXN0XGxpYnJhcnkvY29yZS9zcmMvaXRlci90cmFpdHMvaXRlcmF0b3IucnMAQzpcVXNlcnNcZGF2aWRcLnJ1c3R1cFx0b29sY2hhaW5zXHN0YWJsZS14ODZfNjQtcGMtd2luZG93cy1tc3ZjXGxpYi9ydXN0bGliL3NyYy9ydXN0XGxpYnJhcnkvY29yZS9zcmMvc3RyL3BhdHRlcm4ucnMAbGlicmFyeS9jb3JlL3NyYy9udW0vZmx0MmRlYy9zdHJhdGVneS9kcmFnb24ucnMAbGlicmFyeS9jb3JlL3NyYy9udW0vYmlnbnVtLnJzAFY6XC5jYWNoZVxjYXJnb1xyZWdpc3RyeVxzcmNcaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2ZcY29uc29sZV9zdGF0aWNfdGV4dC0wLjkuMFxzcmNcYW5zaS5ycwBDOlxVc2Vyc1xkYXZpZFwucnVzdHVwXHRvb2xjaGFpbnNcc3RhYmxlLXg4Nl82NC1wYy13aW5kb3dzLW1zdmNcbGliL3J1c3RsaWIvc3JjL3J1c3RcbGlicmFyeS9hbGxvYy9zcmMvc3RyaW5nLnJzAFY6XC5jYWNoZVxjYXJnb1xyZWdpc3RyeVxzcmNcaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2Zcc2VyZGUtMS4wLjIxOVxzcmNcZGVcdmFsdWUucnMAbGlicmFyeS9jb3JlL3NyYy91bmljb2RlL3ByaW50YWJsZS5ycwBWOlwuY2FjaGVcY2FyZ29ccmVnaXN0cnlcc3JjXGluZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmXHNlcmRlLTEuMC4yMTlcc3JjXHByaXZhdGVcZGUucnMAQzpcVXNlcnNcZGF2aWRcLnJ1c3R1cFx0b29sY2hhaW5zXHN0YWJsZS14ODZfNjQtcGMtd2luZG93cy1tc3ZjXGxpYi9ydXN0bGliL3NyYy9ydXN0XGxpYnJhcnkvYWxsb2Mvc3JjL3NsaWNlLnJzAFY6XC5jYWNoZVxjYXJnb1xyZWdpc3RyeVxzcmNcaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2ZcY29uc29sZV9zdGF0aWNfdGV4dC0wLjkuMFxzcmNcd29yZC5ycwBsaWJyYXJ5L2NvcmUvc3JjL2ZtdC9tb2QucnMAbGlicmFyeS9jb3JlL3NyYy9zdHIvbW9kLnJzAEM6XFVzZXJzXGRhdmlkXC5ydXN0dXBcdG9vbGNoYWluc1xzdGFibGUteDg2XzY0LXBjLXdpbmRvd3MtbXN2Y1xsaWIvcnVzdGxpYi9zcmMvcnVzdFxsaWJyYXJ5L2NvcmUvc3JjL3NsaWNlL21vZC5ycwBDOlxVc2Vyc1xkYXZpZFwucnVzdHVwXHRvb2xjaGFpbnNcc3RhYmxlLXg4Nl82NC1wYy13aW5kb3dzLW1zdmNcbGliL3J1c3RsaWIvc3JjL3J1c3RcbGlicmFyeS9hbGxvYy9zcmMvcmF3X3ZlYy9tb2QucnMAbGlicmFyeS9jb3JlL3NyYy9udW0vZmx0MmRlYy9tb2QucnMAL3J1c3QvZGVwcy9kbG1hbGxvYy0wLjIuOS9zcmMvZGxtYWxsb2MucnMAVjpcLmNhY2hlXGNhcmdvXHJlZ2lzdHJ5XHNyY1xpbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zlxqcy1zeXMtMC4zLjc3XHNyY1xsaWIucnMAVjpcLmNhY2hlXGNhcmdvXHJlZ2lzdHJ5XHNyY1xpbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3ZlxvbmNlX2NlbGwtMS4yMS4zXHNyY1xsaWIucnMAVjpcLmNhY2hlXGNhcmdvXHJlZ2lzdHJ5XHNyY1xpbmRleC5jcmF0ZXMu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ZWZnAmgCaWprbAICbW5vcAJxcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcwICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnR1AgICAgICAnZ3OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTl4OTk5OTk5OTk5eXoCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAns5OXw5OX0CAgICAgICAgICAgICAgICAgICfgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn8CAgKAgYICAgICAgICAgICAgICAgKDhAICAgICAgICAgKFhnUCAocCAgKIAgICAgICAomKAgICAgICAgICAgICAouMAo2OAo+QkZKTlJWWApcCApiZmpsCAgICAgICAgICOTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5nB0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAnQICAgKenwIEAgUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0CAh4CAgICAgICHyAhIiMCJCUmJygpAioCAgICoKGio6Slpi6nqKmqq6ytMwICAgICAq4CAjU2NwI4OTo7PD0+rzk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OUwCAgICArBOT7GFhnUCAocCAgKIAgICAgICAomKAgICAgICAgICAgICAouMsrOOAo+QkZKTlJWWApcCApiZmpsCAgICAgICAgICVVV1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAEG84sAACylVVVVVFQBQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAQBB7+LAAAvEARBBEFVVVVVVV1VVVVVVVVVVVVFVVQAAQFT13VVVVVVVVVVVFQAAAAAAVVVVVfxdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFABQAFARQVVVVVVVVVRVRVVVVVVVVVQAAAAAAAEBVVVVVVVVVVVXVV1VVVVVVVVVVVVVVBQAAVFVVVVVVVVVVVVVVVVUVAABVVVFVVVVVVQUQAAABAVBVVVVVVVVVVVVVAVVVVVVV/////39VVVVQVQAAVVVVVVVVVVVVVQUAQcDkwAALmARAVVVVVVVVVVVVVVVVVUVUAQBUUQEAVVUFVVVVVVVVVVFVVVVVVVVVVVVVVVVVVUQBVFVRVRVVVQVVVVVVVVVFQVVVVVVVVVVVVVVVVVVVVEEVFFBRVVVVVVVVVVBRVVVBVVVVVVVVVVVVVVVVVVVUARBUUVVVVVUFVVVVVVUFAFFVVVVVVVVVVVVVVVVVVQQBVFVRVQFVVQVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVRVRVVVFVFVVVVVVVVVVVVVVUVFVVVVVVVVVVVVVVVVUEVAUEUFVBVVUFVVVVVVVVVVFVVVVVVVVVVVVVVVVVVRREBQRQVUFVVQVVVVVVVVVVUFVVVVVVVVVVVVVVVVUVRAFUVUFVFVVVBVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVFFQVEVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVEAQFVVFQBAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUQAAVFVVAEBVVVVVVVVVVVVVVVVVVVVVVVVQVVVVVVVVEVFVVVVVVVVVVVVVVVVVAQAAQAAEVQEAAAEAAAAAAAAAAFRVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUBBABBQVVVVVVVVVAFVFVVVQFUVVVFQVVRVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgBBgOnAAAuQA1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAVVVVVVVVVVVVVVVVQVUVVVVVVVVBVVVVVVVVVUFVVVVVVVVVQVVVVV///33//3XX3fW1ddVEABQVUUBAABVV1FVVVVVVVVVVVVVFQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUFVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAVVFVFVQFVVVVVVVVVVVVVVVVVVVVVVVVVVVVXFRRVVVVVVVVVVVVVVVVVVUUAQEQBAFQVAAAUVVVVVVVVVVVVVVVVAAAAAAAAAEBVVVVVVVVVVVVVVVUAVVVVVVVVVVVVVVVVAABQBVVVVVVVVVVVVRUAAFVVVVBVVVVVVVVVBVAQUFVVVVVVVVVVVVVVVVVFUBFQVVVVVVVVVVVVVVVVVVUAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAAAAAEAFRRVVRQVVVVVVVVVVVVVVVVVVVVVVUAQaDswAALkwhVVRUAVVVVVVVVBUBVVVVVVVVVVVVVVVUAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAAAAAAAAAABUVVVVVVVVVVVV9VVVVWlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf1X11VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV9VVVVVVVfVVVVVVVVVVVVVVVV////VVVVVVVVVVVVVdVVVVVV1VVVVV1V9VVVVVV9VV9VdVVXVVVVVXVV9V11XVVd9VVVVVVVVVVXVVVVVVVVVVV31d9VVVVVVVVVVVVVVVVVVVX9VVVVVVVVV1VV1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVXVV1VVVVVVVVVVVVVVVVddVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVQVVVVVVVVVVVVVVVVVVVV/f///////////////19V1VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAAAAAAAAAAKqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpaVVVVVVVVqqqqqqqqqqqqqqqqqqoKAKqqqmqpqqqqqqqqqqqqqqqqqqqqqqqqqqpqgaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVqaqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqKqqqqqqqqqqqmqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVVZWqqqqqqqqqqqqqqmqqqqqqqqqqqqqqVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVVVVVVVVVVVVVVVVVVVVaqqqlaqqqqqqqqqqqqqqqqqalVVVVVVVVVVVVVVVVVfVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFUAAAFBVVVVVVVVVBVVVVVVVVVVVVVVVVVVVVVVVVVVVUFVVVUVFFVVVVVVVVUFVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVVVVVVVVAAAAAFBVRRVVVVVVVVVVVVUFAFBVVVVVVRUAAFBVVVWqqqqqqqqqVkBVVVVVVVVVVVVVVRUFUFBVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVQFAQUFVVRVVVVRVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVUEFFQFUVVVVVVVVVVVVVVQVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVFFVVVVVqqqqqqqqqqqqVVVVAAAAAABAFQBBv/TAAAvhDFVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQAAAPCqqlpVAAAAAKqqqqqqqqqqaqqqqqpqqlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRWpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpWVVVVVVVVVVVVVVVVVVUFVFVVVVVVVVVVVVVVVVVVVapqVVUAAFRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBUBVAUFVAFVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQVVVVVVVVdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVRVVVVVVVVVVVVVVVVVVVVVVVVVAVVVVVVVVVVVVVVVVVVVVVVVBQAAVFVVVVVVVVVVVVVVBVBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVQAAAEBVVVVVVVVVVVVVFFRVFVBVVVVVVVVVVVVVVRVAQVVFVVVVVVVVVVVVVVVVVVVVQFVVVVVVVVVVFQABAFRVVVVVVVVVVVVVVVVVVRVVVVVQVVVVVVVVVVVVVVVVBQBABVUBFFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVAEVUVRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVFQBAVVVVVVVQVVVVVVVVVVVVVVVVVRVEVFVVVVUVVVVVBQBUAFRVVVVVVVVVVVVVVVVVVVVVAAAFRFVVVVVVRVVVVVVVVVVVVVVVVVVVVVVVVVVVFABEEQRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRUFUFUQVFVVVVVVVVBVVVVVVVVVVVVVVVVVVVVVVVVVVRUAQBFUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVRABBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAQUQAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFQAAQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFUVBBFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUABVVUVVVVVVVVVQEAQFVVVVVVVVVVVRUABEBVFVVVAUABVVVVVVVVVVVVVQAAAABAUFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAQAAQVVVVVVVVVVVVVVVVVVVVVVVVVVUFAAAAAAAFAARBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAUBFEAAAVVVVVVVVVVVVVVVVVVVVVVVVUBFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVFVVQFVVVVVVVVVVVVVVVQVAVURVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBUAAABQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAVFVVVVVVVVVVVVVVVVVVAEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVFVVVVVVVVVVVVVVVVVVVVRVAVVVVVVVVVVVVVVVVVVVVVVVVVapUVVVaVVVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqpaVVVVVVVVVVVVVaqqVlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqpqmmqqqqqqqqqqmpVVVVlVVVVVVVVVWpZVVVVqlVVqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpVVVVVVVVVVUEAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUAQauBwQALdVAAAAAAAEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVURUAUAAAAAQAEAVVVVVVVVVQVQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVBVRVVVVVVVVVVVVVVVVVVQBBrYLBAAsCQBUAQbuCwQALxQZUVVFVVVVUVVVVVRUAAQAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVAEAAAAAAFAAQBEBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRVVVVVVVVVVVVVVVVVVVVQBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQBAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAEBVVVVVVVVVVVVVVVVVVVdVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV1VVVVVVVVVVVVVVVVVVVVXX9/39VVVVVVVVVVVVVVVVVVVVVVVX1////////blVVVaqquqqqqqrq+r+/VaqqVlVfVVVVqlpVVVVVVVX//////////1dVVf3/3///////////////////////9///////VVVV/////////////3/V/1VVVf////9XV///////////////////////f/f/////////////////////////////////////////////////////////////1////////////////////19VVdV/////////VVVVVXVVVVVVVVV9VVVVV1VVVVVVVVVVVVVVVVVVVVVVVVVV1f///////////////////////////1VVVVVVVVVVVVVVVf//////////////////////X1VXf/1V/1VV1VdV//9XVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV////VVdVVVVVVVX//////////////3///9//////////////////////////////////////////////////////////////VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf///1f//1dV///////////////f/19V9f///1X//1dV//9XVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpaVVVVVVVVVVVZllVhqqVZqlVVVVVVlVVVVVVVVVWVVVUAQY6JwQALAQMAQZyJwQAL7AdVVVVVVZVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRUAlmpaWmqqBUCmWZVlVVVVVVVVVVUAAAAAVVZVValWVVVVVVVVVVVVVlVVVVVVVVVVAAAAAAAAAABUVVVVlVlZVVVlVVVpVVVVVVVVVVVVVVWVVpVqqqqqVaqqWlVVVVlVqqqqVVVVVWVVVVpVVVVVpWVWVVVVlVVVVVVVVaaWmpZZWWWplqqqZlWqVVpZVVpWZVVVVWqqpaVaVVVVpapaVVVZWVVVWVVVVVVVlVVVVVVVVVVVVVVVVVVVVVVVVVVVZVX1VVVVaVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqVaqqqqqqqqqqqlVVVaqqqqqlWlVVmqpaVaWlVVpapZalWlVVVaVaVZVVVVV9VWlZpVVfVWZVVVVVVVVVVWZV////VVVVmppqmlVVVdVVVVVV1VVVpV1V9VVVVVW9Va+quqqrqqqaVbqq+q66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uLgoKCgoCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcABB9qXBAAuAAXBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcABwAABwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwAEGSp8EACwEMAEH2p8EAC4ABcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwAHAAAHBwcHAgICAgICAgICAgICAgICAgBgYGBgYGBgYGBgYGBgYGBgkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCXAAQfapwQALgAFwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHAAcAAAcHBwcCcnJycnJycnJycnJycnJyewsLCwsLCwsLCwsLAGBgYGCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJcABB9qvBAAuAAdDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0ADQAADQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NBwAEGSrcEACwEMAEH2rcEAC4ABUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQAFAAAFBQUFArKysrKysrKysrKysrKysrTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEwFTExMTExMTA5MTAFMDQ4OTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTHAAQfavwQALgAFQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFAAUAAAUFBQUCAgICAgICAgICAgICAgICBMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMcABB9rHBAAudAVBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUABQAABQUFBQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAUFBQUFBQUFBQUFBQUFBQUABQUFBQUFBQUFBQAFAAQbizwQALM////////////////////////////////////////////////////////////////////wBB9rPBAAuAA3BwcHBwcHAMcHBwcHBwcHBwcHBwcHBwcABwAABwcHBwkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHAAcAAAcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcABBkrfBAAsBDABB9rnBAAu7AlRyaWVkIHRvIHNocmluayB0byBhIGxhcmdlciBjYXBhY2l0eQAA9lwQACQAAAAnBxAAdgAAALkCAAAJAAAATGF6eSBpbnN0YW5jZSBoYXMgcHJldmlvdXNseSBiZWVuIHBvaXNvbmVkAAA0XRAAKgAAAEIIEABaAAAACAMAABkAAAByZWVudHJhbnQgaW5pdAAAeF0QAA4AAABCCBAAWgAAAHoCAAANAAAAbnVsbCBwb2ludGVyIHBhc3NlZCB0byBydXN0cmVjdXJzaXZlIHVzZSBvZiBhbiBvYmplY3QgZGV0ZWN0ZWQgd2hpY2ggd291bGQgbGVhZCB0byB1bnNhZmUgYWxpYXNpbmcgaW4gcnVzdEpzVmFsdWUoKQAKXhAACAAAABJeEAABAAAA2gEQAGkAAADoAAAAAQBBzLzBAAsBNQBwCXByb2R1Y2VycwIIbGFuZ3VhZ2UBBFJ1c3QADHByb2Nlc3NlZC1ieQMFcnVzdGMdMS44OS4wICgyOTQ4Mzg4M2UgMjAyNS0wOC0wNCkGd2FscnVzBjAuMjMuMwx3YXNtLWJpbmRnZW4HMC4yLjEwMAB8D3RhcmdldF9mZWF0dXJlcwcrD211dGFibGUtZ2xvYmFscysTbm9udHJhcHBpbmctZnB0b2ludCsLYnVsay1tZW1vcnkrCHNpZ24tZXh0Kw9yZWZlcmVuY2UtdHlwZXMrCm11bHRpdmFsdWUrD2J1bGstbWVtb3J5LW9wdA==");
var wasmModule = new WebAssembly.Module(bytes);
var wasm2 = new WebAssembly.Instance(wasmModule, {
  "./rs_lib.internal.js": rs_lib_internal_exports
});
__wbg_set_wasm(wasm2.exports);
wasm2.exports.__wbindgen_start();
function base64decode(b64) {
  const binString = atob(b64);
  const size = binString.length;
  const bytes3 = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes3[i] = binString.charCodeAt(i);
  }
  return bytes3;
}
var scopesSymbol = /* @__PURE__ */ Symbol();
var getItemsSymbol = /* @__PURE__ */ Symbol();
var renderOnceSymbol = /* @__PURE__ */ Symbol();
var onItemsChangedEventsSymbol = /* @__PURE__ */ Symbol();
var StaticTextScope = class {
  #container;
  #items = [];
  constructor(container) {
    this.#container = container;
    this.#container[scopesSymbol].push(this);
  }
  [Symbol.dispose]() {
    this.#items.length = 0;
    const index = this.#container[scopesSymbol].indexOf(this);
    if (index >= 0) {
      this.#container[scopesSymbol].splice(index, 1);
      this.#container.refresh();
      this.#notifyContainerOnItemsChanged();
    }
  }
  [getItemsSymbol]() {
    return this.#items;
  }
  setText(textOrItems) {
    if (typeof textOrItems === "string") {
      if (textOrItems.length === 0) {
        textOrItems = [];
      } else {
        textOrItems = [{ text: textOrItems }];
      }
    } else if (textOrItems instanceof Function) {
      textOrItems = [{ text: textOrItems }];
    }
    this.#items = textOrItems;
    this.#notifyContainerOnItemsChanged();
  }
  #notifyContainerOnItemsChanged() {
    for (const onChanged of this.#container[onItemsChangedEventsSymbol]) {
      onChanged();
    }
  }
  logAbove(textOrItems, size) {
    this.#container.logAbove(textOrItems, size);
  }
  /** Forces a refresh of the container. */
  refresh(size) {
    this.#container.refresh(size);
  }
};
var StaticTextContainer2 = class {
  #container = new StaticTextContainer();
  [scopesSymbol] = [];
  #getConsoleSize;
  #onWriteText;
  [onItemsChangedEventsSymbol] = [];
  constructor(onWriteText, getConsoleSize) {
    this.#onWriteText = onWriteText;
    this.#getConsoleSize = getConsoleSize;
  }
  /** If any scope has text or items. */
  hasText() {
    return this[scopesSymbol].some((s) => s[getItemsSymbol]().length > 0);
  }
  /** Creates a scope which can be used to set the text for. */
  createScope() {
    return new StaticTextScope(this);
  }
  /** Gets the containers current console size. */
  getConsoleSize() {
    return this.#getConsoleSize();
  }
  logAbove(textOrItems, size) {
    size ??= this.getConsoleSize();
    let detailedItem;
    if (typeof textOrItems === "string") {
      if (textOrItems.length === 0) {
        detailedItem = [];
      } else {
        detailedItem = [{ text: textOrItems }];
      }
    } else {
      detailedItem = Array.from(resolveItems(textOrItems, size));
    }
    this.withTempClear(() => {
      this[renderOnceSymbol](detailedItem, size);
    }, size);
  }
  /** Clears the displayed text for the provided action. */
  withTempClear(action, size) {
    size ??= this.getConsoleSize();
    this.clear(size);
    try {
      action();
    } finally {
      this.refresh(size);
    }
  }
  /** Clears the text and flushes it to the console. */
  clear(size) {
    const newText = this.renderClearText(size);
    if (newText != null) {
      this.#onWriteText(newText);
    }
  }
  /** Refreshes the static text (writes it to the console). */
  refresh(size) {
    const newText = this.renderRefreshText(size);
    if (newText != null) {
      this.#onWriteText(newText);
    }
  }
  /**
   * Renders the clear text.
   *
   * Note: this is a low level method. Prefer calling `.clear()` instead.
   */
  renderClearText(size) {
    size = size ?? this.#getConsoleSize();
    return this.#container.clear_text(size?.columns, size?.rows);
  }
  /**
   * Renders the next text that should be displayed.
   *
   * Note: This is a low level method. Prefer calling `.refresh()` instead.
   */
  renderRefreshText(size) {
    size ??= this.#getConsoleSize();
    const items = Array.from(this.#resolveItems(size));
    return this.#container.render_text(items, size?.columns, size?.rows);
  }
  *#resolveItems(size) {
    for (const provider of this[scopesSymbol]) {
      for (const item of provider[getItemsSymbol]()) {
        yield* resolveItem(item, size);
      }
    }
  }
  [renderOnceSymbol](items, size) {
    const newText = static_text_render_once(items, size?.columns, void 0);
    if (newText != null) {
      this.#onWriteText(newText + "\r\n");
    }
  }
};
var encoder = new TextEncoder();
var RenderInterval = class {
  #count = 0;
  #intervalId = void 0;
  #container;
  #intervalMs = 60;
  #containerSubscription;
  #disposed = false;
  /**
   * Constructs a new `RenderInterval` from the provided `StaticTextContainer`.
   * @param container Container to render every `intervalMs`.
   */
  constructor(container) {
    this.#container = container;
  }
  [Symbol.dispose]() {
    this.#markStop();
    this.#disposed = true;
  }
  /** Gets how often this interval will refresh the output.
   * @default `60`
   */
  get intervalMs() {
    return this.#intervalMs;
  }
  /** Sets how often this should refresh the output. */
  set intervalMs(value) {
    if (this.#intervalMs === value) {
      return;
    }
    this.#intervalMs = value;
    if (this.#intervalId != null) {
      this.#stopInterval();
      this.#startInterval();
    }
  }
  /**
   * Starts the render task returning a disposable for stopping it.
   *
   * Note that it's perfectly fine to just start this and never dispose it.
   * The underlying interval won't run if there's no items in the container.
   */
  start() {
    if (this.#disposed) {
      throw new Error("Cannot call .start() on a disposed RenderInterval.");
    }
    if (this.#count === 0) {
      this.#markStart();
    }
    this.#count++;
    let hasCalled = false;
    return {
      [Symbol.dispose]: () => {
        if (!hasCalled && !this.#disposed) {
          hasCalled = true;
          this.#count--;
          if (this.#count === 0) {
            this.#markStop();
            this.#container.refresh();
          }
        }
      }
    };
  }
  #markStart() {
    this.#addSubscriptionToContainer();
    if (this.#container.hasText()) {
      this.#container.refresh();
    }
  }
  #markStop() {
    this.#removeSubscriptionFromContainer();
    this.#stopInterval();
  }
  #startInterval() {
    this.#container.refresh();
    this.#intervalId = setInterval(() => {
      this.#container.refresh();
    }, this.#intervalMs);
  }
  #stopInterval() {
    if (this.#intervalId == null) {
      return;
    }
    clearInterval(this.#intervalId);
    this.#intervalId = void 0;
  }
  #addSubscriptionToContainer() {
    let lastValue = this.#container.hasText();
    this.#containerSubscription = () => {
      const hasItems = this.#container.hasText();
      if (hasItems != lastValue) {
        lastValue = hasItems;
        if (hasItems) {
          this.#startInterval();
        } else {
          this.#stopInterval();
          this.#container.refresh();
        }
      }
    };
    this.#container[onItemsChangedEventsSymbol].push(this.#containerSubscription);
  }
  #removeSubscriptionFromContainer() {
    if (!this.#containerSubscription) {
      return;
    }
    const events = this.#container[onItemsChangedEventsSymbol];
    const removeIndex = events.indexOf(this.#containerSubscription);
    if (removeIndex >= 0) {
      events.splice(removeIndex, 1);
      this.#containerSubscription = void 0;
    }
  }
};
var staticText = new StaticTextContainer2((text) => {
  process.stderr.write(encoder.encode(text));
}, () => maybeConsoleSize());
var renderInterval = new RenderInterval(staticText);
function renderTextItems(items, size) {
  size ??= maybeConsoleSize();
  const wasmItems = Array.from(resolveItems(items, size));
  return static_text_render_once(wasmItems, size?.columns, size?.rows) ?? "";
}
function maybeConsoleSize() {
  try {
    for (const stream of [process.stdout, process.stderr]) {
      if (stream.isTTY) {
        return {
          columns: stream.columns,
          rows: stream.rows
        };
      }
    }
    return void 0;
  } catch {
    return void 0;
  }
}
function stripAnsiCodes(text) {
  return strip_ansi_codes(text);
}
function* resolveDeferred(deferred, size) {
  const value = deferred(size);
  if (value instanceof Array) {
    yield* resolveItems(value, size);
  } else {
    yield* resolveItem(value, size);
  }
}
function* resolveItems(value, size) {
  for (const item of value) {
    yield* resolveItem(item, size);
  }
}
function* resolveItem(item, size) {
  if (typeof item === "string") {
    if (item.length > 0) {
      yield { text: item };
    }
  } else if (item instanceof Function) {
    yield* resolveDeferred(item, size);
  } else if (item.text instanceof Function) {
    const hangingIndent = item.hangingIndent ?? 0;
    for (const value of resolveDeferred(item.text, size)) {
      yield {
        ...value,
        hangingIndent: hangingIndent + (value.hangingIndent ?? 0)
      };
    }
  } else if (item.text.length > 0) {
    yield item;
  }
}
function copy2(src, dst, offset = 0) {
  offset = Math.max(0, Math.min(offset, dst.byteLength));
  const dstBytesAvailable = dst.byteLength - offset;
  if (src.byteLength > dstBytesAvailable) {
    src = src.subarray(0, dstBytesAvailable);
  }
  dst.set(src, offset);
  return src.byteLength;
}
var MIN_READ = 32 * 1024;
var MAX_SIZE = 2 ** 32 - 2;
var Buffer2 = class {
  #buf;
  // contents are the bytes buf[off : len(buf)]
  #off = 0;
  // read at buf[off], write at buf[buf.byteLength]
  /**
   * Constructs a new instance with the specified {@linkcode ArrayBuffer} as its
   * initial contents.
   *
   * @param ab The ArrayBuffer to use as the initial contents of the buffer.
   */
  constructor(ab) {
    if (ab === void 0) {
      this.#buf = new Uint8Array(0);
    } else if (ab instanceof SharedArrayBuffer) {
      this.#buf = new Uint8Array(ab);
    } else {
      this.#buf = new Uint8Array(ab);
    }
  }
  /**
   * Returns a slice holding the unread portion of the buffer.
   *
   * The slice is valid for use only until the next buffer modification (that
   * is, only until the next call to a method like `read()`, `write()`,
   * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
   * least until the next buffer modification, so immediate changes to the
   * slice will affect the result of future reads.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * const slice = buf.bytes();
   * assertEquals(new TextDecoder().decode(slice), "Hello, world!");
   * ```
   *
   * @param options The options for the slice.
   * @returns A slice holding the unread portion of the buffer.
   */
  bytes(options = { copy: true }) {
    if (options.copy === false)
      return this.#buf.subarray(this.#off);
    return this.#buf.slice(this.#off);
  }
  /**
   * Returns whether the unread portion of the buffer is empty.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * assertEquals(buf.empty(), true);
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * assertEquals(buf.empty(), false);
   * ```
   *
   * @returns `true` if the unread portion of the buffer is empty, `false`
   *          otherwise.
   */
  empty() {
    return this.#buf.byteLength <= this.#off;
  }
  /**
   * A read only number of bytes of the unread portion of the buffer.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * assertEquals(buf.length, 13);
   * ```
   *
   * @returns The number of bytes of the unread portion of the buffer.
   */
  get length() {
    return this.#buf.byteLength - this.#off;
  }
  /**
   * The read only capacity of the buffer's underlying byte slice, that is,
   * the total space allocated for the buffer's data.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * assertEquals(buf.capacity, 0);
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * assertEquals(buf.capacity, 13);
   * ```
   *
   * @returns The capacity of the buffer.
   */
  get capacity() {
    return this.#buf.buffer.byteLength;
  }
  /**
   * Discards all but the first `n` unread bytes from the buffer but
   * continues to use the same allocated storage. It throws if `n` is
   * negative or greater than the length of the buffer.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * buf.truncate(6);
   * assertEquals(buf.length, 6);
   * ```
   *
   * @param n The number of bytes to keep.
   */
  truncate(n) {
    if (n === 0) {
      this.reset();
      return;
    }
    if (n < 0 || n > this.length) {
      throw new Error("Buffer truncation out of range");
    }
    this.#reslice(this.#off + n);
  }
  /**
   * Resets the contents
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * buf.reset();
   * assertEquals(buf.length, 0);
   * ```
   */
  reset() {
    this.#reslice(0);
    this.#off = 0;
  }
  #tryGrowByReslice(n) {
    const l = this.#buf.byteLength;
    if (n <= this.capacity - l) {
      this.#reslice(l + n);
      return l;
    }
    return -1;
  }
  #reslice(len) {
    if (len > this.#buf.buffer.byteLength) {
      throw new RangeError("Length is greater than buffer capacity");
    }
    this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
  }
  /**
   * Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Returns the number of bytes read. If the buffer has no data to
   * return, the return is EOF (`null`).
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * const data = new Uint8Array(5);
   * const res = await buf.read(data);
   *
   * assertEquals(res, 5);
   * assertEquals(new TextDecoder().decode(data), "Hello");
   * ```
   *
   * @param p The buffer to read data into.
   * @returns The number of bytes read.
   */
  readSync(p) {
    if (this.empty()) {
      this.reset();
      if (p.byteLength === 0) {
        return 0;
      }
      return null;
    }
    const nread = copy2(this.#buf.subarray(this.#off), p);
    this.#off += nread;
    return nread;
  }
  /**
   * Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Resolves to the number of bytes read. If the buffer has no
   * data to return, resolves to EOF (`null`).
   *
   * NOTE: This methods reads bytes synchronously; it's provided for
   * compatibility with `Reader` interfaces.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * const data = new Uint8Array(5);
   * const res = await buf.read(data);
   *
   * assertEquals(res, 5);
   * assertEquals(new TextDecoder().decode(data), "Hello");
   * ```
   *
   * @param p The buffer to read data into.
   * @returns The number of bytes read.
   */
  read(p) {
    const rr = this.readSync(p);
    return Promise.resolve(rr);
  }
  /**
   * Writes the given data to the buffer.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const data = new TextEncoder().encode("Hello, world!");
   * buf.writeSync(data);
   *
   * const slice = buf.bytes();
   * assertEquals(new TextDecoder().decode(slice), "Hello, world!");
   * ```
   *
   * @param p The data to write to the buffer.
   * @returns The number of bytes written.
   */
  writeSync(p) {
    const m = this.#grow(p.byteLength);
    return copy2(p, this.#buf, m);
  }
  /**
   * Writes the given data to the buffer. Resolves to the number of bytes
   * written.
   *
   * > [!NOTE]
   * > This methods writes bytes synchronously; it's provided for compatibility
   * > with the {@linkcode Writer} interface.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const data = new TextEncoder().encode("Hello, world!");
   * await buf.write(data);
   *
   * const slice = buf.bytes();
   * assertEquals(new TextDecoder().decode(slice), "Hello, world!");
   * ```
   *
   * @param p The data to write to the buffer.
   * @returns The number of bytes written.
   */
  write(p) {
    const n = this.writeSync(p);
    return Promise.resolve(n);
  }
  #grow(n) {
    const m = this.length;
    if (m === 0 && this.#off !== 0) {
      this.reset();
    }
    const i = this.#tryGrowByReslice(n);
    if (i >= 0) {
      return i;
    }
    const c = this.capacity;
    if (n <= Math.floor(c / 2) - m) {
      copy2(this.#buf.subarray(this.#off), this.#buf);
    } else if (c + n > MAX_SIZE) {
      throw new Error(`The buffer cannot be grown beyond the maximum size of "${MAX_SIZE}"`);
    } else {
      const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
      copy2(this.#buf.subarray(this.#off), buf);
      this.#buf = buf;
    }
    this.#off = 0;
    this.#reslice(Math.min(m + n, MAX_SIZE));
    return m;
  }
  /** Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
   * the buffer without another allocation. If `n` is negative, `.grow()` will
   * throw. If the buffer can't grow it will throw an error.
   *
   * Based on Go Lang's
   * {@link https://golang.org/pkg/bytes/#Buffer.Grow | Buffer.Grow}.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * buf.grow(10);
   * assertEquals(buf.capacity, 10);
   * ```
   *
   * @param n The number of bytes to grow the buffer by.
   */
  grow(n) {
    if (n < 0) {
      throw new Error("Buffer growth cannot be negative");
    }
    const m = this.#grow(n);
    this.#reslice(m);
  }
  /**
   * Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It resolves to the number of bytes read.
   * If the buffer becomes too large, `.readFrom()` will reject with an error.
   *
   * Based on Go Lang's
   * {@link https://golang.org/pkg/bytes/#Buffer.ReadFrom | Buffer.ReadFrom}.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const r = new Buffer(new TextEncoder().encode("Hello, world!"));
   * const n = await buf.readFrom(r);
   *
   * assertEquals(n, 13);
   * ```
   *
   * @param r The reader to read from.
   * @returns The number of bytes read.
   */
  async readFrom(r) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
      const nread = await r.read(buf);
      if (nread === null) {
        return n;
      }
      if (shouldGrow)
        this.writeSync(buf.subarray(0, nread));
      else
        this.#reslice(this.length + nread);
      n += nread;
    }
  }
  /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It returns the number of bytes read. If the
   * buffer becomes too large, `.readFromSync()` will throw an error.
   *
   * Based on Go Lang's
   * {@link https://golang.org/pkg/bytes/#Buffer.ReadFrom | Buffer.ReadFrom}.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const r = new Buffer(new TextEncoder().encode("Hello, world!"));
   * const n = buf.readFromSync(r);
   *
   * assertEquals(n, 13);
   * ```
   *
   * @param r The reader to read from.
   * @returns The number of bytes read.
   */
  readFromSync(r) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
      const nread = r.readSync(buf);
      if (nread === null) {
        return n;
      }
      if (shouldGrow)
        this.writeSync(buf.subarray(0, nread));
      else
        this.#reslice(this.length + nread);
      n += nread;
    }
  }
};
async function writeAll2(writer, data) {
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += await writer.write(data.subarray(nwritten));
  }
}
function writeAllSync2(writer, data) {
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += writer.writeSync(data.subarray(nwritten));
  }
}
function readerFromStreamReader(streamReader) {
  const buffer = new Buffer2();
  return {
    async read(p) {
      if (buffer.empty()) {
        const res = await streamReader.read();
        if (res.done) {
          return null;
        }
        await writeAll2(buffer, res.value);
      }
      return buffer.read(p);
    }
  };
}
var openAsync = nodeUtil.promisify(fs2.open);
var FsFile2 = class {
  #fd;
  /** Wraps an existing open file descriptor. */
  constructor(fd) {
    this.#fd = fd;
  }
  /** Reads up to `p.length` bytes into `p`, returning the number of bytes
   * read or `null` on EOF. */
  read(p) {
    return new Promise((resolve8, reject) => {
      fs2.read(this.#fd, p, 0, p.length, null, (err, bytesRead) => {
        if (err)
          reject(err);
        else
          resolve8(bytesRead === 0 ? null : bytesRead);
      });
    });
  }
  /** Synchronous variant of {@link FsFile.read}. */
  readSync(p) {
    const bytesRead = fs2.readSync(this.#fd, p);
    return bytesRead === 0 ? null : bytesRead;
  }
  /** Writes the provided bytes to the file, returning the number of bytes
   * written. */
  write(p) {
    return writeAll3(this.#fd, p);
  }
  /** Synchronous variant of {@link FsFile.write}. */
  writeSync(p) {
    return writeSyncAll(this.#fd, p);
  }
  /** Closes the underlying file descriptor. */
  close() {
    try {
      fs2.closeSync(this.#fd);
    } catch {
    }
  }
  /** A `WritableStream` that writes to this file. */
  get writable() {
    const write2 = this.write.bind(this);
    return new import_web2.WritableStream({
      async write(chunk) {
        await write2(chunk);
      }
    });
  }
  /** Closes the file when used with `using` declarations. */
  [Symbol.dispose]() {
    this.close();
  }
};
async function open2(filePath, options) {
  const fd = await openAsync(filePath, openOptionsToFlags2(options));
  return new FsFile2(fd);
}
async function create(filePath) {
  const fd = await openAsync(filePath, fs2.constants.O_WRONLY | fs2.constants.O_CREAT | fs2.constants.O_TRUNC);
  return new FsFile2(fd);
}
function openOptionsToFlags2(options) {
  let flags = options.read && options.write ? fs2.constants.O_RDWR : options.write ? fs2.constants.O_WRONLY : fs2.constants.O_RDONLY;
  if (options.create)
    flags |= fs2.constants.O_CREAT;
  if (options.truncate)
    flags |= fs2.constants.O_TRUNC;
  if (options.append)
    flags |= fs2.constants.O_APPEND;
  return flags;
}
function writeSyncAll(fd, data) {
  let offset = 0;
  while (offset < data.length) {
    try {
      const n = fs2.writeSync(fd, data, offset, data.length - offset);
      if (n <= 0)
        break;
      offset += n;
    } catch (err) {
      if (err?.code === "EAGAIN" || err?.code === "EWOULDBLOCK")
        continue;
      throw err;
    }
  }
  return offset;
}
async function writeAll3(fd, data) {
  let offset = 0;
  while (offset < data.length) {
    const n = await writeOnce(fd, data, offset);
    if (n <= 0)
      break;
    offset += n;
  }
  return offset;
}
function writeOnce(fd, data, offset) {
  return new Promise((resolve8, reject) => {
    const attempt = () => {
      fs2.write(fd, data, offset, data.length - offset, null, (err, bytesWritten) => {
        if (err) {
          if (err.code === "EAGAIN" || err.code === "EWOULDBLOCK")
            (0, import_node_timers.setImmediate)(attempt);
          else
            reject(err);
        } else {
          resolve8(bytesWritten);
        }
      });
    };
    attempt();
  });
}
var isWindows3 = process.platform === "win32";
function getRealEnvVars() {
  const result = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== void 0) {
      result[key] = value;
    }
  }
  return result;
}
var symbols = {
  writable: /* @__PURE__ */ Symbol.for("dax.writableStream"),
  readable: /* @__PURE__ */ Symbol.for("dax.readableStream")
};
function delayToMs(delay) {
  if (typeof delay === "number") {
    return delay;
  } else if (typeof delay === "string") {
    const msMatch = delay.match(/^([0-9]+)ms$/);
    if (msMatch != null) {
      return parseInt(msMatch[1], 10);
    }
    const secondsMatch = delay.match(/^([0-9]+\.?[0-9]*)s$/);
    if (secondsMatch != null) {
      return Math.round(parseFloat(secondsMatch[1]) * 1e3);
    }
    const minutesMatch = delay.match(/^([0-9]+\.?[0-9]*)m$/);
    if (minutesMatch != null) {
      return Math.round(parseFloat(minutesMatch[1]) * 1e3 * 60);
    }
    const minutesSecondsMatch = delay.match(/^([0-9]+\.?[0-9]*)m([0-9]+\.?[0-9]*)s$/);
    if (minutesSecondsMatch != null) {
      return Math.round(parseFloat(minutesSecondsMatch[1]) * 1e3 * 60 + parseFloat(minutesSecondsMatch[2]) * 1e3);
    }
    const hoursMatch = delay.match(/^([0-9]+\.?[0-9]*)h$/);
    if (hoursMatch != null) {
      return Math.round(parseFloat(hoursMatch[1]) * 1e3 * 60 * 60);
    }
    const hoursMinutesMatch = delay.match(/^([0-9]+\.?[0-9]*)h([0-9]+\.?[0-9]*)m$/);
    if (hoursMinutesMatch != null) {
      return Math.round(parseFloat(hoursMinutesMatch[1]) * 1e3 * 60 * 60 + parseFloat(hoursMinutesMatch[2]) * 1e3 * 60);
    }
    const hoursMinutesSecondsMatch = delay.match(/^([0-9]+\.?[0-9]*)h([0-9]+\.?[0-9]*)m([0-9]+\.?[0-9]*)s$/);
    if (hoursMinutesSecondsMatch != null) {
      return Math.round(parseFloat(hoursMinutesSecondsMatch[1]) * 1e3 * 60 * 60 + parseFloat(hoursMinutesSecondsMatch[2]) * 1e3 * 60 + parseFloat(hoursMinutesSecondsMatch[3]) * 1e3);
    }
  }
  throw new Error(`Unknown delay value: ${delay}`);
}
function resolvePath(cwd2, arg) {
  return path.resolve(path.isAbsolute(arg) ? arg : path.join(cwd2, arg));
}
var Box = class {
  value;
  constructor(value) {
    this.value = value;
  }
};
var TreeBox = class _TreeBox {
  #value;
  constructor(value) {
    this.#value = value;
  }
  getValue() {
    let tree = this;
    while (tree.#value instanceof _TreeBox) {
      tree = tree.#value;
    }
    return tree.#value;
  }
  setValue(value) {
    this.#value = value;
  }
  createChild() {
    return new _TreeBox(this);
  }
};
var LoggerTreeBox = class extends TreeBox {
  getValue() {
    const innerValue = super.getValue();
    return (...args) => {
      return staticText.withTempClear(() => {
        innerValue(...args);
      });
    };
  }
};
async function safeLstat(path62) {
  try {
    return await fs3.promises.lstat(path62);
  } catch (err) {
    if (err?.code === "ENOENT") {
      return void 0;
    } else {
      throw err;
    }
  }
}
async function getExecutableShebangFromPath(path62) {
  try {
    const file = await open2(path62, { read: true });
    try {
      return await getExecutableShebang(file);
    } finally {
      try {
        file.close();
      } catch {
      }
    }
  } catch (err) {
    if (err?.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}
var decoder = new import_node_util2.TextDecoder();
async function getExecutableShebang(reader) {
  const text = "#!/usr/bin/env ";
  const buffer = new Uint8Array(text.length);
  const bytesReadCount = await reader.read(buffer);
  if (bytesReadCount !== text.length || decoder.decode(buffer) !== text) {
    return void 0;
  }
  const line = (await readFirstLine(reader)).trim();
  if (line.length === 0) {
    return void 0;
  }
  const dashS = "-S ";
  if (line.startsWith(dashS)) {
    return {
      stringSplit: true,
      command: line.slice(dashS.length)
    };
  } else {
    return {
      stringSplit: false,
      command: line
    };
  }
}
async function readFirstLine(reader) {
  const chunkSize = 1024;
  const chunkBuffer = new Uint8Array(chunkSize);
  const collectedChunks = [];
  let totalLength = 0;
  while (true) {
    const bytesRead = await reader.read(chunkBuffer);
    if (bytesRead == null || bytesRead === 0) {
      break;
    }
    const currentChunk = chunkBuffer.subarray(0, bytesRead);
    const newlineIndex = currentChunk.indexOf(10);
    if (newlineIndex !== -1) {
      collectedChunks.push(currentChunk.subarray(0, newlineIndex));
      totalLength += newlineIndex;
      break;
    } else {
      collectedChunks.push(currentChunk);
      totalLength += bytesRead;
    }
  }
  const finalBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of collectedChunks) {
    finalBytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new import_node_util2.TextDecoder().decode(finalBytes);
}
function abortSignalToPromise(signal) {
  const { resolve: resolve8, promise } = Promise.withResolvers();
  const listener = () => {
    signal.removeEventListener("abort", listener);
    resolve8();
  };
  signal.addEventListener("abort", listener);
  return {
    [Symbol.dispose]() {
      signal.removeEventListener("abort", listener);
    },
    promise
  };
}
var nodeErrorPrefix = /^E[A-Z0-9_]+: /;
function errorToString(err) {
  const message = err instanceof Error ? err.message : String(err);
  return message.replace(nodeErrorPrefix, "");
}
function parseArgKinds(flags) {
  const result = [];
  let had_dash_dash = false;
  for (const arg of flags) {
    if (had_dash_dash) {
      result.push({ arg, kind: "Arg" });
    } else if (arg == "-") {
      result.push({ arg: "-", kind: "Arg" });
    } else if (arg == "--") {
      had_dash_dash = true;
    } else if (arg.startsWith("--")) {
      result.push({ arg: arg.replace(/^--/, ""), kind: "LongFlag" });
    } else if (arg.startsWith("-")) {
      const flags2 = arg.replace(/^-/, "");
      if (!isNaN(parseFloat(flags2))) {
        result.push({ arg, kind: "Arg" });
      } else {
        for (const c of flags2) {
          result.push({ arg: c, kind: "ShortFlag" });
        }
      }
    } else {
      result.push({ arg, kind: "Arg" });
    }
  }
  return result;
}
function bailUnsupported(arg) {
  switch (arg.kind) {
    case "Arg":
      throw Error(`unsupported argument: ${arg.arg}`);
    case "ShortFlag":
      throw Error(`unsupported flag: -${arg.arg}`);
    case "LongFlag":
      throw Error(`unsupported flag: --${arg.arg}`);
  }
}
async function catCommand(context) {
  try {
    const code2 = await executeCat(context);
    return { code: code2 };
  } catch (err) {
    return context.error(`cat: ${errorToString(err)}`);
  }
}
async function executeCat(context) {
  const flags = parseCatArgs(context.args);
  let exitCode = 0;
  const buf = new Uint8Array(1024);
  for (const path62 of flags.paths) {
    if (path62 === "-") {
      if (typeof context.stdin === "object") {
        while (!context.signal.aborted) {
          const size = await context.stdin.read(buf);
          if (!size || size === 0) {
            break;
          } else {
            const maybePromise = context.stdout.write(buf.slice(0, size));
            if (maybePromise instanceof Promise) {
              await maybePromise;
            }
          }
        }
        exitCode = context.signal.abortedExitCode ?? 0;
      } else {
        const _assertValue = context.stdin;
        throw new Error(`not supported. stdin was '${context.stdin}'`);
      }
    } else {
      let file;
      try {
        file = await open2(resolvePath(context.cwd, path62), { read: true });
        while (!context.signal.aborted) {
          const size = await file.read(buf);
          if (!size || size === 0) {
            break;
          } else {
            const maybePromise = context.stdout.write(buf.slice(0, size));
            if (maybePromise instanceof Promise) {
              await maybePromise;
            }
          }
        }
        exitCode = context.signal.abortedExitCode ?? 0;
      } catch (err) {
        const maybePromise = context.stderr.writeLine(`cat ${path62}: ${errorToString(err)}`);
        if (maybePromise instanceof Promise) {
          await maybePromise;
        }
        exitCode = 1;
      } finally {
        file?.close();
      }
    }
  }
  return exitCode;
}
function parseCatArgs(args) {
  const paths = [];
  for (const arg of parseArgKinds(args)) {
    if (arg.kind === "Arg") {
      paths.push(arg.arg);
    } else {
      bailUnsupported(arg);
    }
  }
  if (paths.length === 0) {
    paths.push("-");
  }
  return { paths };
}
async function cdCommand(context) {
  try {
    const dir = await executeCd(context.cwd, context.args);
    return {
      code: 0,
      changes: [{
        kind: "cd",
        dir
      }]
    };
  } catch (err) {
    return context.error(`cd: ${errorToString(err)}`);
  }
}
async function executeCd(cwd2, args) {
  const arg = parseArgs(args);
  const result = resolvePath(cwd2, arg);
  if (!await isDirectory(result)) {
    throw new Error(`${result}: Not a directory`);
  }
  return result;
}
async function isDirectory(path62) {
  try {
    return (await fs4.promises.stat(path62)).isDirectory();
  } catch (err) {
    if (err?.code === "ENOENT") {
      return false;
    } else {
      throw err;
    }
  }
}
function parseArgs(args) {
  if (args.length === 0) {
    throw new Error("expected at least 1 argument");
  } else if (args.length > 1) {
    throw new Error("too many arguments");
  } else {
    return args[0];
  }
}
async function cpCommand(context) {
  try {
    await executeCp(context.cwd, context.args);
    return { code: 0 };
  } catch (err) {
    return context.error(`cp: ${errorToString(err)}`);
  }
}
async function executeCp(cwd2, args) {
  const flags = await parseCpArgs(cwd2, args);
  for (const { from, to } of flags.operations) {
    await doCopyOperation(flags, from, to);
  }
}
async function parseCpArgs(cwd2, args) {
  const paths = [];
  let recursive = false;
  for (const arg of parseArgKinds(args)) {
    if (arg.kind === "Arg")
      paths.push(arg.arg);
    else if (arg.arg === "recursive" && arg.kind === "LongFlag" || arg.arg === "r" && arg.kind == "ShortFlag" || arg.arg === "R" && arg.kind === "ShortFlag") {
      recursive = true;
    } else
      bailUnsupported(arg);
  }
  if (paths.length === 0)
    throw Error("missing file operand");
  else if (paths.length === 1)
    throw Error(`missing destination file operand after '${paths[0]}'`);
  return { recursive, operations: await getCopyAndMoveOperations(cwd2, paths) };
}
async function doCopyOperation(flags, from, to) {
  const fromInfo = await safeLstat(from.path);
  if (fromInfo?.isDirectory()) {
    if (flags.recursive) {
      const toInfo = await safeLstat(to.path);
      if (toInfo?.isFile()) {
        throw Error("destination was a file");
      } else if (toInfo?.isSymbolicLink()) {
        throw Error("no support for copying to symlinks");
      } else if (fromInfo.isSymbolicLink()) {
        throw Error("no support for copying from symlinks");
      } else {
        await fs5.promises.cp(from.path, to.path, { recursive: true });
      }
    } else {
      throw Error("source was a directory; maybe specify -r");
    }
  } else {
    await fs5.promises.copyFile(from.path, to.path);
  }
}
async function mvCommand(context) {
  try {
    await executeMove(context.cwd, context.args);
    return { code: 0 };
  } catch (err) {
    return context.error(`mv: ${errorToString(err)}`);
  }
}
async function executeMove(cwd2, args) {
  const flags = await parseMvArgs(cwd2, args);
  for (const { from, to } of flags.operations) {
    await fs5.promises.rename(from.path, to.path);
  }
}
async function parseMvArgs(cwd2, args) {
  const paths = [];
  for (const arg of parseArgKinds(args)) {
    if (arg.kind === "Arg")
      paths.push(arg.arg);
    else
      bailUnsupported(arg);
  }
  if (paths.length === 0)
    throw Error("missing operand");
  else if (paths.length === 1)
    throw Error(`missing destination file operand after '${paths[0]}'`);
  return { operations: await getCopyAndMoveOperations(cwd2, paths) };
}
async function getCopyAndMoveOperations(cwd2, paths) {
  const specified_destination = paths.splice(paths.length - 1, 1)[0];
  const destination = resolvePath(cwd2, specified_destination);
  const fromArgs = paths;
  const operations = [];
  if (fromArgs.length > 1) {
    if (!await safeLstat(destination).then((p) => p?.isDirectory())) {
      throw Error(`target '${specified_destination}' is not a directory`);
    }
    for (const from of fromArgs) {
      const fromPath = resolvePath(cwd2, from);
      const toPath = path2.join(destination, path2.basename(fromPath));
      operations.push({
        from: {
          specified: from,
          path: fromPath
        },
        to: {
          specified: specified_destination,
          path: toPath
        }
      });
    }
  } else {
    const fromPath = resolvePath(cwd2, fromArgs[0]);
    const toPath = await safeLstat(destination).then((p) => p?.isDirectory()) ? calculateDestinationPath(destination, fromPath) : destination;
    operations.push({
      from: {
        specified: fromArgs[0],
        path: fromPath
      },
      to: {
        specified: specified_destination,
        path: toPath
      }
    });
  }
  return operations;
}
function calculateDestinationPath(destination, from) {
  return path2.join(destination, path2.basename(from));
}
function echoCommand(context) {
  try {
    const maybePromise = context.stdout.writeLine(context.args.join(" "));
    if (maybePromise instanceof Promise) {
      return maybePromise.then(() => ({ code: 0 })).catch((err) => handleFailure(context, err));
    } else {
      return { code: 0 };
    }
  } catch (err) {
    return handleFailure(context, err);
  }
}
function handleFailure(context, err) {
  return context.error(`echo: ${errorToString(err)}`);
}
function exitCommand(context) {
  try {
    const code2 = parseArgs2(context.args);
    return {
      kind: "exit",
      code: code2
    };
  } catch (err) {
    return context.error(2, `exit: ${errorToString(err)}`);
  }
}
function parseArgs2(args) {
  if (args.length === 0)
    return 1;
  if (args.length > 1)
    throw new Error("too many arguments");
  const exitCode = parseInt(args[0], 10);
  if (isNaN(exitCode))
    throw new Error("numeric argument required.");
  if (exitCode < 0) {
    const code2 = -exitCode % 256;
    return 256 - code2;
  }
  return exitCode % 256;
}
function exportCommand(context) {
  const changes = [];
  for (const arg of context.args) {
    const equalsIndex = arg.indexOf("=");
    if (equalsIndex >= 0) {
      changes.push({
        kind: "envvar",
        name: arg.substring(0, equalsIndex),
        value: arg.substring(equalsIndex + 1)
      });
    }
  }
  return {
    code: 0,
    changes
  };
}
async function mkdirCommand(context) {
  try {
    await executeMkdir(context.cwd, context.args);
    return { code: 0 };
  } catch (err) {
    return context.error(`mkdir: ${errorToString(err)}`);
  }
}
async function executeMkdir(cwd2, args) {
  const flags = parseArgs3(args);
  for (const specifiedPath of flags.paths) {
    const path62 = resolvePath(cwd2, specifiedPath);
    const info2 = await safeLstat(path62);
    if (info2?.isFile() || !flags.parents && info2?.isDirectory()) {
      throw Error(`cannot create directory '${specifiedPath}': File exists`);
    }
    if (flags.parents) {
      await fs6.promises.mkdir(path62, { recursive: true });
    } else {
      await fs6.promises.mkdir(path62);
    }
  }
}
function parseArgs3(args) {
  const result = {
    parents: false,
    paths: []
  };
  for (const arg of parseArgKinds(args)) {
    if (arg.arg === "parents" && arg.kind === "LongFlag" || arg.arg === "p" && arg.kind == "ShortFlag") {
      result.parents = true;
    } else {
      if (arg.kind !== "Arg")
        bailUnsupported(arg);
      result.paths.push(arg.arg.trim());
    }
  }
  if (result.paths.length === 0) {
    throw Error("missing operand");
  }
  return result;
}
function printEnvCommand(context) {
  let args;
  if (isWindows3) {
    args = context.args.map((arg) => arg.toUpperCase());
  } else {
    args = context.args;
  }
  try {
    const result = executePrintEnv(context.env, args);
    const code2 = args.some((arg) => context.env[arg] === void 0) ? 1 : 0;
    const maybePromise = context.stdout.writeLine(result);
    if (maybePromise instanceof Promise) {
      return maybePromise.then(() => ({ code: code2 })).catch((err) => handleError2(context, err));
    } else {
      return { code: code2 };
    }
  } catch (err) {
    return handleError2(context, err);
  }
}
function handleError2(context, err) {
  return context.error(`printenv: ${errorToString(err)}`);
}
function executePrintEnv(env, args) {
  if (args.length === 0) {
    return Object.entries(env).map(([key, val]) => `${isWindows3 ? key.toUpperCase() : key}=${val}`).join("\n");
  } else {
    if (isWindows3) {
      args = args.map((arg) => arg.toUpperCase());
    }
    return Object.entries(env).filter(([key]) => args.includes(key)).map(([_key, val]) => val).join("\n");
  }
}
function pwdCommand(context) {
  try {
    const output = executePwd(context.cwd, context.args);
    const maybePromise = context.stdout.writeLine(output);
    const result = { code: 0 };
    if (maybePromise instanceof Promise) {
      return maybePromise.then(() => result).catch((err) => handleError3(context, err));
    } else {
      return result;
    }
  } catch (err) {
    return handleError3(context, err);
  }
}
function handleError3(context, err) {
  return context.error(`pwd: ${errorToString(err)}`);
}
function executePwd(cwd2, args) {
  const flags = parseArgs4(args);
  if (flags.logical) {
    return path3.resolve(cwd2);
  } else {
    return cwd2;
  }
}
function parseArgs4(args) {
  let logical = false;
  for (const arg of parseArgKinds(args)) {
    if (arg.arg === "L" && arg.kind === "ShortFlag") {
      logical = true;
    } else if (arg.arg === "P" && arg.kind == "ShortFlag") {
    } else if (arg.kind === "Arg") {
    } else {
      bailUnsupported(arg);
    }
  }
  return { logical };
}
async function rmCommand(context) {
  try {
    await executeRemove(context.cwd, context.args);
    return { code: 0 };
  } catch (err) {
    return context.error(`rm: ${errorToString(err)}`);
  }
}
async function executeRemove(cwd2, args) {
  const flags = parseArgs5(args);
  await Promise.all(flags.paths.map((specifiedPath) => {
    if (specifiedPath.length === 0) {
      throw new Error("Bug in dax. Specified path should have not been empty.");
    }
    const path62 = resolvePath(cwd2, specifiedPath);
    if (path62 === "/") {
      throw new Error("Cannot delete root directory. Maybe bug in dax? Please report this.");
    }
    return removePath(path62, flags.recursive).catch((err) => {
      if (flags.force && err?.code === "ENOENT") {
        return Promise.resolve();
      } else {
        return Promise.reject(err);
      }
    });
  }));
}
async function removePath(filePath, recursive) {
  if (recursive) {
    await fs7.promises.rm(filePath, { recursive: true });
    return;
  }
  try {
    await fs7.promises.rm(filePath);
  } catch (err) {
    if (err?.code !== "EISDIR" && err?.code !== "ERR_FS_EISDIR") {
      throw err;
    }
    await fs7.promises.rmdir(filePath);
  }
}
function parseArgs5(args) {
  const result = {
    recursive: false,
    force: false,
    dir: false,
    paths: []
  };
  for (const arg of parseArgKinds(args)) {
    if (arg.arg === "recursive" && arg.kind === "LongFlag" || arg.arg === "r" && arg.kind == "ShortFlag" || arg.arg === "R" && arg.kind === "ShortFlag") {
      result.recursive = true;
    } else if (arg.arg == "dir" && arg.kind === "LongFlag" || arg.arg == "d" && arg.kind === "ShortFlag") {
      result.dir = true;
    } else if (arg.arg == "force" && arg.kind === "LongFlag" || arg.arg == "f" && arg.kind === "ShortFlag") {
      result.force = true;
    } else {
      if (arg.kind !== "Arg")
        bailUnsupported2(arg);
      result.paths.push(arg.arg.trim());
    }
  }
  if (result.paths.length === 0) {
    throw Error("missing operand");
  }
  return result;
}
function bailUnsupported2(arg) {
  switch (arg.kind) {
    case "Arg":
      throw Error(`unsupported argument: ${arg.arg}`);
    case "ShortFlag":
      throw Error(`unsupported flag: -${arg.arg}`);
    case "LongFlag":
      throw Error(`unsupported flag: --${arg.arg}`);
  }
}
var NAMED_OPTIONS = [
  ["errexit", "errexit"],
  ["pipefail", "pipefail"]
];
var SHORT_FLAGS = {
  e: "errexit"
};
function findNamedOption(name) {
  return NAMED_OPTIONS.find(([n]) => n === name)?.[1];
}
function findShortFlag(arg) {
  if (arg.length !== 2)
    return void 0;
  const sign = arg[0];
  if (sign !== "-" && sign !== "+")
    return void 0;
  return SHORT_FLAGS[arg[1]];
}
function setCommand(context) {
  const args = context.args;
  if (args.length === 0) {
    return { code: 0 };
  }
  if (args.length === 1 && args[0] === "-o") {
    const opts = context.shellOptions;
    for (const [name, flag] of NAMED_OPTIONS) {
      context.stdout.writeLine(`${name}	${opts[flag] ? "on" : "off"}`);
    }
    return { code: 0 };
  }
  if (args.length === 1 && args[0] === "+o") {
    const opts = context.shellOptions;
    for (const [name, flag] of NAMED_OPTIONS) {
      context.stdout.writeLine(`set ${opts[flag] ? "-o" : "+o"} ${name}`);
    }
    return { code: 0 };
  }
  const changes = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if ((arg === "-o" || arg === "+o") && i + 1 < args.length) {
      const enable = arg === "-o";
      const optionName = args[i + 1];
      const option = findNamedOption(optionName);
      if (option == null) {
        return context.error(`set: unknown option: ${optionName}`);
      }
      changes.push({ kind: "setoption", option, value: enable });
      i += 2;
    } else {
      const option = findShortFlag(arg);
      if (option == null) {
        return context.error(`set: invalid option: ${arg}`);
      }
      changes.push({ kind: "setoption", option, value: arg.startsWith("-") });
      i += 1;
    }
  }
  return { code: 0, changes };
}
var SHOPT_OPTIONS = ["nullglob", "failglob", "globstar"];
function isShoptOption(name) {
  return SHOPT_OPTIONS.includes(name);
}
function invalidOptionError(context, name) {
  return context.error(`shopt: ${name}: invalid shell option name`);
}
function shoptCommand(context) {
  const args = context.args;
  let mode;
  let optionArgs = args;
  if (args.length > 0) {
    if (args[0] === "-s") {
      mode = true;
      optionArgs = args.slice(1);
    } else if (args[0] === "-u") {
      mode = false;
      optionArgs = args.slice(1);
    }
  }
  const options = [];
  for (const arg of optionArgs) {
    if (!isShoptOption(arg)) {
      return invalidOptionError(context, arg);
    }
    options.push(arg);
  }
  if (mode !== void 0) {
    const changes = options.map((option) => ({
      kind: "setoption",
      option,
      value: mode
    }));
    return { code: 0, changes };
  }
  const currentOptions = context.shellOptions;
  if (options.length === 0) {
    context.stdout.writeLine(`failglob	${currentOptions.failglob ? "on" : "off"}`);
    context.stdout.writeLine(`globstar	${currentOptions.globstar ? "on" : "off"}`);
    context.stdout.writeLine(`nullglob	${currentOptions.nullglob ? "on" : "off"}`);
    return { code: 0 };
  } else {
    let anyOff = false;
    for (const opt of options) {
      const isOn = currentOptions[opt];
      if (!isOn) {
        anyOff = true;
      }
      context.stdout.writeLine(`${opt}	${isOn ? "on" : "off"}`);
    }
    return { code: anyOff ? 1 : 0 };
  }
}
function getAbortedResult() {
  return {
    kind: "exit",
    code: 124
    // same as timeout command
  };
}
async function sleepCommand(context) {
  try {
    const ms = parseArgs6(context.args);
    await new Promise((resolve8) => {
      const timeoutId = setTimeout(finish, ms);
      context.signal.addListener(signalListener);
      function signalListener(_signal) {
        if (context.signal.aborted) {
          finish();
        }
      }
      function finish() {
        resolve8();
        clearInterval(timeoutId);
        context.signal.removeListener(signalListener);
      }
    });
    if (context.signal.aborted) {
      return getAbortedResult();
    }
    return { code: 0 };
  } catch (err) {
    return context.error(`sleep: ${errorToString(err)}`);
  }
}
function parseArgs6(args) {
  let totalTimeMs = 0;
  if (args.length === 0) {
    throw new Error("missing operand");
  }
  for (const arg of args) {
    if (arg.startsWith("-")) {
      throw new Error(`unsupported: ${arg}`);
    }
    const value = parseFloat(arg);
    if (isNaN(value)) {
      throw new Error(`error parsing argument '${arg}' to number.`);
    }
    totalTimeMs = value * 1e3;
  }
  return totalTimeMs;
}
async function testCommand(context) {
  try {
    const [testFlag, testPath] = parseArgs7(context.cwd, context.args);
    let result;
    switch (testFlag) {
      case "-f":
        result = (await safeLstat(testPath))?.isFile() ?? false;
        break;
      case "-d":
        result = (await safeLstat(testPath))?.isDirectory() ?? false;
        break;
      case "-e":
        result = await safeLstat(testPath) != null;
        break;
      case "-s":
        result = ((await safeLstat(testPath))?.size ?? 0) > 0;
        break;
      case "-L":
        result = (await safeLstat(testPath))?.isSymbolicLink() ?? false;
        break;
      default:
        throw new Error("unsupported test type");
    }
    return { code: result ? 0 : 1 };
  } catch (err) {
    return context.error(2, `test: ${errorToString(err)}`);
  }
}
function parseArgs7(cwd2, args) {
  if (args.length !== 2) {
    throw new Error("expected 2 arguments");
  }
  if (args[0] == null || !args[0].startsWith("-")) {
    throw new Error("missing test type flag");
  }
  return [args[0], resolvePath(cwd2, args[1])];
}
var __addDisposableResource = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources = /* @__PURE__ */ (function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
async function touchCommand(context) {
  try {
    await executetouch(context.args, context.cwd);
    return { code: 0 };
  } catch (err) {
    return context.error(`touch: ${errorToString(err)}`);
  }
}
async function executetouch(args, cwd2) {
  const flags = parseArgs8(args);
  for (const path62 of flags.paths) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
      const _f = __addDisposableResource(env_1, await create((0, import_node_path2.join)(cwd2, path62)), false);
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources(env_1);
    }
  }
}
function parseArgs8(args) {
  const paths = [];
  for (const arg of parseArgKinds(args)) {
    if (arg.kind === "Arg")
      paths.push(arg.arg);
    else
      bailUnsupported(arg);
  }
  if (paths.length === 0)
    throw Error("missing file operand");
  return { paths };
}
function unsetCommand(context) {
  try {
    return {
      code: 0,
      changes: parseNames(context.args).map((name) => ({ kind: "unsetvar", name }))
    };
  } catch (err) {
    return context.error(`unset: ${errorToString(err)}`);
  }
}
function parseNames(args) {
  if (args[0] === "-f") {
    throw Error(`unsupported flag: -f`);
  } else if (args[0] === "-v") {
    return args.slice(1);
  } else {
    return args;
  }
}
var LineRingBuffer = class {
  capacity;
  #buffer;
  #size = 0;
  #head = 0;
  constructor(capacity) {
    this.capacity = Math.max(1, capacity);
    this.#buffer = new Array(this.capacity);
  }
  get size() {
    return this.#size;
  }
  push(item) {
    this.#buffer[this.#head] = item;
    this.#head = (this.#head + 1) % this.capacity;
    if (this.#size < this.capacity)
      this.#size++;
  }
  /** Iterate every retained item, oldest first. */
  *[Symbol.iterator]() {
    const start = this.#size < this.capacity ? 0 : this.#head;
    for (let i = 0; i < this.#size; i++) {
      yield this.#buffer[(start + i) % this.capacity];
    }
  }
  /** Iterate the last `n` retained items, oldest first. */
  *takeLast(n) {
    const count = Math.min(Math.max(0, n), this.#size);
    const start = (this.#head - count + this.capacity) % this.capacity;
    for (let i = 0; i < count; i++) {
      yield this.#buffer[(start + i) % this.capacity];
    }
  }
};
var __addDisposableResource2 = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
};
var __disposeResources2 = /* @__PURE__ */ (function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1)
            return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async)
              return s |= 2, Promise.resolve(result).then(next, function(e) {
                fail(e);
                return next();
              });
          } else
            s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1)
        return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError)
        throw env.error;
    }
    return next();
  };
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
var TAIL_INDENT = "  ";
function indentTailLine(line) {
  return { text: TAIL_INDENT + line, hangingIndent: TAIL_INDENT.length };
}
var TailRenderer = class {
  container;
  #scope;
  #intervalScope;
  #segments = [];
  // single deferred installed on the scope while at least one segment is
  // active. `setText` is called only on the empty↔non-empty transition, so
  // appendLines/setHeader become pure field writes — items get rebuilt at
  // draw time (≈16 Hz via renderInterval) instead of per write.
  #deferredItems;
  constructor(options = {}) {
    this.container = options.container ?? staticText;
    this.#scope = this.container.createScope();
    const interval = options.interval === null ? void 0 : options.interval ?? renderInterval;
    this.#intervalScope = interval?.start();
    this.#deferredItems = [(size) => this.#buildItems(size)];
  }
  [Symbol.dispose]() {
    this.#intervalScope?.[Symbol.dispose]();
    this.#scope[Symbol.dispose]();
  }
  /** @internal */
  register(seg) {
    const wasEmpty = this.#segments.length === 0;
    this.#segments.push(seg);
    if (wasEmpty)
      this.#scope.setText(this.#deferredItems);
  }
  /** @internal */
  unregister(seg) {
    const idx = this.#segments.indexOf(seg);
    if (idx !== -1)
      this.#segments.splice(idx, 1);
    if (this.#segments.length === 0)
      this.#scope.setText([]);
  }
  /** @internal */
  logAbove(items) {
    this.#scope.logAbove(items);
  }
  #buildItems(size) {
    const items = [];
    const ctx = { size };
    for (const seg of this.#segments) {
      if (seg.headerFn != null) {
        const text = seg.headerFn(ctx);
        items.push(seg.headerVerbatim ? truncateHeaderToWidth(text, size) : formatTailHeader(text, size));
      }
      for (const line of seg.lines.takeLast(seg.visibleLineCount(ctx)))
        items.push(indentTailLine(line));
    }
    return items;
  }
};
var defaultTailRenderer = new TailRenderer();
var encoder2 = new TextEncoder();
var NullPipeReader = class {
  read(_p) {
    return Promise.resolve(null);
  }
};
var NullPipeWriter = class {
  writeSync(p) {
    return p.length;
  }
};
var ShellPipeWriter = class {
  #kind;
  #inner;
  constructor(kind, inner) {
    this.#kind = kind;
    this.#inner = inner;
  }
  get kind() {
    return this.#kind;
  }
  get inner() {
    return this.#inner;
  }
  write(p) {
    if ("write" in this.#inner) {
      return this.#inner.write(p);
    } else {
      return this.#inner.writeSync(p);
    }
  }
  writeAll(data) {
    if ("write" in this.#inner) {
      return writeAll2(this.#inner, data);
    } else {
      return writeAllSync2(this.#inner, data);
    }
  }
  writeText(text) {
    return this.writeAll(encoder2.encode(text));
  }
  writeLine(text) {
    return this.writeText(text + "\n");
  }
};
var CapturingBufferWriter = class {
  #buffer;
  #innerWriter;
  constructor(innerWriter, buffer) {
    this.#innerWriter = innerWriter;
    this.#buffer = buffer;
  }
  getBuffer() {
    return this.#buffer;
  }
  async write(p) {
    const nWritten = await this.#innerWriter.write(p);
    this.#buffer.writeSync(p.slice(0, nWritten));
    return nWritten;
  }
};
var CapturingBufferWriterSync = class {
  #buffer;
  #innerWriter;
  constructor(innerWriter, buffer) {
    this.#innerWriter = innerWriter;
    this.#buffer = buffer;
  }
  getBuffer() {
    return this.#buffer;
  }
  writeSync(p) {
    const nWritten = this.#innerWriter.writeSync(p);
    this.#buffer.writeSync(p.slice(0, nWritten));
    return nWritten;
  }
};
var ErrorTailCaptureWriter = class {
  ring;
  #innerWriter;
  constructor(innerWriter, ring) {
    this.#innerWriter = innerWriter;
    this.ring = ring;
  }
  async write(p) {
    const nWritten = await this.#innerWriter.write(p);
    this.ring.push(p.subarray(0, nWritten));
    return nWritten;
  }
};
var ErrorTailCaptureWriterSync = class {
  ring;
  #innerWriter;
  constructor(innerWriter, ring) {
    this.#innerWriter = innerWriter;
    this.ring = ring;
  }
  writeSync(p) {
    const nWritten = this.#innerWriter.writeSync(p);
    this.ring.push(p.subarray(0, nWritten));
    return nWritten;
  }
};
var lineFeedCharCode = "\n".charCodeAt(0);
var InheritStaticTextBypassWriter = class {
  #buffer;
  #innerWriter;
  constructor(innerWriter) {
    this.#innerWriter = innerWriter;
    this.#buffer = new Buffer2();
  }
  writeSync(p) {
    const index = p.findLastIndex((v) => v === lineFeedCharCode);
    if (index === -1) {
      this.#buffer.writeSync(p);
    } else {
      this.#buffer.writeSync(p.slice(0, index + 1));
      this.flush();
      this.#buffer.writeSync(p.slice(index + 1));
    }
    return p.byteLength;
  }
  flush() {
    const bytes3 = this.#buffer.bytes({ copy: false });
    staticText.withTempClear(() => {
      writeAllSync2(this.#innerWriter, bytes3);
    });
    this.#buffer.reset();
  }
};
var DEFAULT_INHERIT_TAIL_LINES = 5;
var DEFAULT_INHERIT_TAIL_ERROR_LINES = 80;
var DEFAULT_ERROR_TAIL_BYTES = 8 * 1024;
function makeMaxLinesResolver(value) {
  if (typeof value === "function")
    return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Invalid tailDisplay maxLines: ${value}`);
    }
    const n = Math.max(1, Math.floor(value));
    return () => n;
  }
  const match = /^(\d+(?:\.\d+)?)%$/.exec(value);
  if (!match)
    throw new TypeError(`Invalid tailDisplay maxLines: ${JSON.stringify(value)}`);
  const fraction = parseFloat(match[1]) / 100;
  return ({ size }) => {
    if (size?.rows == null)
      return DEFAULT_INHERIT_TAIL_LINES;
    return Math.max(1, Math.floor(size.rows * fraction));
  };
}
function normalizeHeaderText(text) {
  if (text == null)
    return void 0;
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function truncateHeaderToWidth(text, size) {
  const cols = size?.columns ?? 80;
  const visible = stripAnsiCodes(text);
  if (visible.length <= cols)
    return text;
  return visible.slice(0, Math.max(1, cols - 1)) + "\u2026";
}
var InheritTailState = class {
  resolveMaxLines;
  lines;
  enabled;
  /** Per-draw callback that produces the header text. `undefined` means
   * "no header" (live tail renders no label). Percentages, raw strings and
   * user callbacks are all normalized into this single shape upstream. */
  headerFn;
  /** When true, the header is rendered verbatim instead of being framed
   * with the built-in `Running <text>` / `Ran <text>` styling. Set when
   * the user supplies a custom header string or function. */
  headerVerbatim = false;
  /** Always-present fallback shown on the error path, even if the live
   * header is hidden or customized — so error scrollback is unambiguous
   * about which command failed. */
  errorHeader;
  promoteHeaderOnSuccess = false;
  #refCount = 0;
  #disposed = false;
  #errored = false;
  #trailingLines = [];
  #registered = false;
  #totalLinesSeen = 0;
  renderer;
  constructor(renderer, maxLines, isTty, maxErrorLines = DEFAULT_INHERIT_TAIL_ERROR_LINES) {
    this.renderer = renderer;
    this.resolveMaxLines = makeMaxLinesResolver(maxLines);
    const initial = this.resolveMaxLines({ size: renderer.container.getConsoleSize() });
    this.lines = new LineRingBuffer(Math.max(initial, maxErrorLines));
    this.enabled = isTty;
  }
  get omittedLineCount() {
    return Math.max(0, this.#totalLinesSeen - this.lines.size);
  }
  /** Visible output rows after subtracting the header (if any) from the
   * total `maxLines` budget. Floors to 1 so a headered segment always shows
   * at least one line. */
  visibleLineCount(ctx) {
    const total = this.resolveMaxLines(ctx);
    return Math.max(1, this.headerFn != null ? total - 1 : total);
  }
  addRef() {
    this.#refCount++;
    if (this.enabled && !this.#registered && !this.#disposed) {
      this.renderer.register(this);
      this.#registered = true;
    }
  }
  setHeader(header, options) {
    if (header == null) {
      this.headerFn = void 0;
    } else if (typeof header === "string") {
      const trimmed = normalizeHeaderText(header);
      this.headerFn = trimmed != null ? () => trimmed : void 0;
    } else {
      this.headerFn = header;
    }
    this.headerVerbatim = options?.verbatim ?? false;
  }
  appendLines(newLines) {
    if (this.#disposed)
      return;
    this.#totalLinesSeen += newLines.length;
    for (const line of newLines)
      this.lines.push(line);
  }
  release(errored, trailing) {
    if (this.#disposed)
      return;
    if (errored)
      this.#errored = true;
    if (trailing.length > 0)
      this.#trailingLines.push(...trailing);
    this.#refCount--;
    if (this.#refCount > 0)
      return;
    this.#disposed = true;
    if (!this.enabled)
      return;
    this.renderer.unregister(this);
    this.#flushAbove();
  }
  #flushAbove() {
    const preserved = [];
    if (this.#errored) {
      if (this.errorHeader != null) {
        preserved.push(`${white(">")} ${blue(this.errorHeader)}`);
      } else if (this.headerFn != null) {
        const headerFn = this.headerFn;
        preserved.push((size) => `${white(">")} ${blue(headerFn({ size }))}`);
      }
      const omitted = this.omittedLineCount;
      if (omitted > 0) {
        const noun = omitted === 1 ? "line" : "lines";
        preserved.push(indentTailLine(dim(`...${omitted} ${noun} omitted...`)));
      }
      for (const line of this.lines)
        preserved.push(indentTailLine(line));
      for (const line of this.#trailingLines)
        preserved.push(indentTailLine(line));
    } else if (this.promoteHeaderOnSuccess && this.headerFn != null) {
      const headerFn = this.headerFn;
      const verbatim = this.headerVerbatim;
      preserved.push((size) => {
        const text = headerFn({ size });
        return verbatim ? truncateHeaderToWidth(text, size) : formatRanHeader(text, size);
      });
    }
    if (preserved.length > 0)
      this.renderer.logAbove(preserved);
  }
};
var InheritTailWriter = class _InheritTailWriter {
  #innerWriter;
  #state;
  #decoder = new import_node_util2.TextDecoder();
  #pending = "";
  #finalized = false;
  constructor(innerWriter, optionsOrSibling = {}) {
    this.#innerWriter = innerWriter;
    if (optionsOrSibling instanceof _InheritTailWriter) {
      this.#state = optionsOrSibling.#state;
    } else {
      const opts = optionsOrSibling;
      const renderer = opts.renderer ?? defaultTailRenderer;
      const maxLines = opts.maxLines ?? DEFAULT_INHERIT_TAIL_LINES;
      const isTty = opts.isTty ?? isStderrTty();
      const state = new InheritTailState(renderer, maxLines, isTty);
      if (opts.header !== void 0) {
        state.setHeader(opts.header, { verbatim: opts.headerVerbatim });
      }
      if (opts.errorHeader !== void 0) {
        state.errorHeader = normalizeHeaderText(opts.errorHeader);
      }
      if (opts.promoteHeaderOnSuccess !== void 0) {
        state.promoteHeaderOnSuccess = opts.promoteHeaderOnSuccess;
      }
      this.#state = state;
    }
    this.#state.addRef();
  }
  /** Snapshot of the live tail (last visible-window retained lines, oldest
   * first). The visible-window size is `maxLines - 1` when a header is shown
   * (recomputed from the current console size for percentage / callback
   * `maxLines`). */
  get tailLines() {
    const size = this.#state.renderer.container.getConsoleSize();
    return Array.from(this.#state.lines.takeLast(this.#state.visibleLineCount({ size })));
  }
  /** Number of completed lines that were dropped from the retained ring
   * buffer because its capacity is bounded. Rendered as
   * `...N lines omitted...` above the retained tail when the command fails. */
  get omittedLineCount() {
    return this.#state.omittedLineCount;
  }
  /**
   * Sets a label rendered above the tail lines that identifies what this
   * scrolling region is showing. Accepts a literal string (collapsed to
   * a single line) or a per-draw callback that receives the current
   * `{ size }`. `undefined` removes the header. Long text is truncated to
   * the terminal width.
   *
   * When `options.verbatim` is true, the text is rendered as-is (no
   * built-in `Running` / `Ran` framing). Used by `.tailDisplay({ header })`
   * so the caller has full control over styling.
   */
  setHeader(header, options) {
    this.#state.setHeader(header, options);
  }
  /**
   * Sets the command label preserved on the error scrollback path even
   * when the live header is hidden or customized — so `> <command>` is
   * always shown when a tailed command fails, regardless of `.tailDisplay`
   * header config.
   */
  setErrorHeader(text) {
    this.#state.errorHeader = normalizeHeaderText(text);
  }
  /**
   * Controls whether the `Ran <command>` header is promoted to scrollback
   * on successful finalize. Defaults to `false` — on success the live tail
   * clears silently unless the caller opts in (command.ts enables it when
   * `.printCommand()` was set, so the command stays visible in scrollback).
   * The error-path header (`> <command>` + retained tail) is always emitted
   * regardless of this flag since it's diagnostic.
   */
  setPromoteHeaderOnSuccess(value) {
    this.#state.promoteHeaderOnSuccess = value;
  }
  writeSync(p) {
    if (this.#finalized) {
      return p.length;
    }
    if (!this.#state.enabled) {
      return this.#innerWriter.writeSync(p);
    }
    this.#pending += this.#decoder.decode(p, { stream: true });
    const lastNewline = this.#pending.lastIndexOf("\n");
    if (lastNewline !== -1) {
      const complete = this.#pending.slice(0, lastNewline);
      this.#pending = this.#pending.slice(lastNewline + 1);
      this.#state.appendLines(complete.split("\n").map(stripTrailingCR));
    }
    return p.length;
  }
  /**
   * Clears the scrolling region. Called on successful command completion.
   *
   * If a header was set it's promoted to scrollback via `logAbove` before
   * the scope is disposed, so "which commands ran" remains visible after
   * the transient tail clears. When multiple writers share a scope the
   * scope is only disposed once all of them have finalized.
   *
   * Any partial pending line is still passed to `release` so that — if a
   * sibling writer subsequently errors — the success side's last partial
   * line is preserved in the error scrollback. The success path itself
   * never renders trailing lines, so there's no visual cost when no
   * sibling errors.
   */
  finalize() {
    if (this.#finalized)
      return;
    this.#finalized = true;
    const trailing = [];
    if (this.#pending.length > 0) {
      trailing.push(stripTrailingCR(this.#pending));
      this.#pending = "";
    }
    this.#state.release(false, trailing);
  }
  [Symbol.dispose]() {
    this.finalize();
  }
  /**
   * Promotes the header + retained tail above the static region before
   * clearing it. Called when the command errored so the user has visible
   * context. When multiple writers share a scope, any writer finalizing
   * for error causes the shared region to use the error path once all
   * writers have finalized.
   */
  finalizeForError() {
    if (this.#finalized)
      return;
    this.#finalized = true;
    const trailing = [];
    if (this.#pending.length > 0) {
      trailing.push(stripTrailingCR(this.#pending));
      this.#pending = "";
    }
    this.#state.release(true, trailing);
  }
};
function stripTrailingCR(line) {
  return line.endsWith("\r") ? line.slice(0, -1) : line;
}
function isStderrTty() {
  return Boolean(process.stderr.isTTY);
}
function formatTailHeader(text, size) {
  return renderTailHeader(text, size, "Running", cyan);
}
function formatRanHeader(text, size) {
  return renderTailHeader(text, size, "Ran", green);
}
function renderTailHeader(text, size, status, statusColor) {
  const maxColumns = size?.columns ?? 80;
  const overhead = status.length + 1;
  const budget = Math.max(10, maxColumns - overhead);
  const display = text.length > budget ? text.slice(0, budget - 1) + "\u2026" : text;
  return `${bold(statusColor(status))} ${display}`;
}
var PipedBuffer = class {
  #inner;
  #hasSet = false;
  constructor() {
    this.#inner = new Buffer2();
  }
  getBuffer() {
    if (this.#inner instanceof Buffer2) {
      return this.#inner;
    } else {
      return void 0;
    }
  }
  setError(err) {
    if ("setError" in this.#inner) {
      this.#inner.setError(err);
    }
  }
  close() {
    if ("close" in this.#inner) {
      this.#inner.close();
    }
  }
  writeSync(p) {
    return this.#inner.writeSync(p);
  }
  setListener(listener) {
    if (this.#hasSet) {
      throw new Error("Piping to multiple outputs is currently not supported.");
    }
    if (this.#inner instanceof Buffer2) {
      writeAllSync2(listener, this.#inner.bytes({ copy: false }));
    }
    this.#inner = listener;
    this.#hasSet = true;
  }
};
var PipeSequencePipe = class {
  #inner = new Buffer2();
  #readListener;
  #closed = false;
  close() {
    this.#readListener?.();
    this.#closed = true;
  }
  writeSync(p) {
    const value = this.#inner.writeSync(p);
    if (this.#readListener !== void 0) {
      const listener = this.#readListener;
      this.#readListener = void 0;
      listener();
    }
    return value;
  }
  read(p) {
    if (this.#readListener !== void 0) {
      throw new Error("Misuse of PipeSequencePipe");
    }
    if (this.#inner.length === 0) {
      if (this.#closed) {
        return Promise.resolve(null);
      } else {
        return new Promise((resolve8) => {
          this.#readListener = () => {
            resolve8(this.#inner.readSync(p));
          };
        });
      }
    } else {
      return Promise.resolve(this.#inner.readSync(p));
    }
  }
};
async function pipeReaderToWritable(reader, writable, signal) {
  const env_1 = { stack: [], error: void 0, hasError: false };
  try {
    const abortedPromise = __addDisposableResource2(env_1, abortSignalToPromise(signal), false);
    const writer = writable.getWriter();
    try {
      while (!signal.aborted) {
        const buffer = new Uint8Array(1024);
        const length = await Promise.race([abortedPromise.promise, reader.read(buffer)]);
        if (length === 0 || length == null) {
          break;
        }
        await writer.write(buffer.subarray(0, length));
      }
    } finally {
      await writer.close();
    }
  } catch (e_1) {
    env_1.error = e_1;
    env_1.hasError = true;
  } finally {
    __disposeResources2(env_1);
  }
}
async function pipeReadableToWriterSync(readable, writer, signal) {
  const reader = readable.getReader();
  while (!signal.aborted) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    const maybePromise = writer.writeAll(result.value);
    if (maybePromise) {
      await maybePromise;
    }
  }
}
function spawnCommand(path62, options) {
  let receivedSignal;
  const isWindowsBatch = isWindows3 && /\.(cmd|bat)$/i.test(path62);
  const child = cp.spawn(isWindowsBatch ? "cmd.exe" : path62, isWindowsBatch ? ["/d", "/s", "/c", path62, ...options.args] : options.args, {
    cwd: options.cwd,
    env: options.env,
    stdio: [
      toNodeStdio(options.stdin),
      toNodeStdio(options.stdout),
      toNodeStdio(options.stderr)
    ]
  });
  const exitResolvers = Promise.withResolvers();
  child.on("exit", (code2) => {
    if (code2 == null && receivedSignal != null) {
      exitResolvers.resolve(getSignalAbortCode(receivedSignal) ?? 1);
    } else {
      exitResolvers.resolve(code2 ?? 0);
    }
  });
  child.on("error", (err) => {
    exitResolvers.reject(err);
  });
  return {
    stdin() {
      return import_node_stream.Writable.toWeb(child.stdin);
    },
    kill(signo) {
      receivedSignal = signo;
      child.kill(signo);
    },
    waitExitCode() {
      return exitResolvers.promise;
    },
    stdout() {
      return import_node_stream.Readable.toWeb(child.stdout);
    },
    stderr() {
      return import_node_stream.Readable.toWeb(child.stderr);
    }
  };
}
function toNodeStdio(stdio) {
  switch (stdio) {
    case "inherit":
      return "inherit";
    case "null":
      return "ignore";
    case "piped":
      return "pipe";
  }
}
var neverAbortedSignal = new AbortController().signal;
function createExecutableCommand(resolvedPath, options) {
  const prependArgs = options?.args;
  return async function executeCommandAtPath(context) {
    const pipeStringVals = {
      stdin: getStdioStringValue(context.stdin),
      stdout: getStdioStringValue(context.stdout.kind),
      stderr: getStdioStringValue(context.stderr.kind)
    };
    let p;
    const cwd2 = context.cwd;
    const args = prependArgs != null && prependArgs.length > 0 ? [...prependArgs, ...context.args] : context.args;
    try {
      p = spawnCommand(resolvedPath, {
        args,
        cwd: cwd2,
        env: context.env,
        ...pipeStringVals
      });
    } catch (err) {
      throw checkMapCwdNotExistsError(cwd2, err);
    }
    const listener = (signal) => p.kill(signal);
    context.signal.addListener(listener);
    const completeController = new AbortController();
    const completeSignal = completeController.signal;
    let stdinError;
    const stdinPromise = writeStdin(context.stdin, p, completeSignal).catch(async (err) => {
      if (completeSignal.aborted) {
        return;
      }
      const maybePromise = context.stderr.writeLine(`stdin pipe broken. ${errorToString(err)}`);
      if (maybePromise != null) {
        await maybePromise;
      }
      stdinError = err;
      try {
        p.kill("SIGKILL");
      } catch (err2) {
        const code2 = err2?.code;
        if (code2 !== "EACCES" && code2 !== "EPERM" && code2 !== "ENOENT") {
          throw err2;
        }
      }
    });
    try {
      const readStdoutTask = pipeStringVals.stdout === "piped" ? readStdOutOrErr(p.stdout(), context.stdout) : Promise.resolve();
      const readStderrTask = pipeStringVals.stderr === "piped" ? readStdOutOrErr(p.stderr(), context.stderr) : Promise.resolve();
      const [exitCode] = await Promise.all([
        p.waitExitCode().catch((err) => Promise.reject(checkMapCwdNotExistsError(cwd2, err))),
        readStdoutTask,
        readStderrTask
      ]);
      if (stdinError != null) {
        return {
          code: 1,
          kind: "exit"
        };
      } else {
        return { code: exitCode };
      }
    } finally {
      completeController.abort();
      context.signal.removeListener(listener);
      await stdinPromise;
    }
  };
}
async function writeStdin(stdin2, p, signal) {
  if (typeof stdin2 === "string") {
    return;
  }
  const processStdin = p.stdin();
  await pipeReaderToWritable(stdin2, processStdin, signal);
  try {
    await processStdin.close();
  } catch {
  }
}
async function readStdOutOrErr(readable, writer) {
  if (typeof writer === "string") {
    return;
  }
  await pipeReadableToWriterSync(readable, writer, neverAbortedSignal);
}
function getStdioStringValue(value) {
  if (value === "inheritPiped") {
    return "piped";
  } else if (value === "inherit" || value === "null" || value === "piped") {
    return value;
  } else {
    return "piped";
  }
}
function checkMapCwdNotExistsError(cwd2, err) {
  if (err.code === "ENOENT" && !fs8.existsSync(cwd2)) {
    throw new Error(`Failed to launch command because the cwd does not exist (${cwd2}).`, {
      cause: err
    });
  } else {
    throw err;
  }
}
function checkWindows2() {
  const global = dntGlobalThis;
  const platform = global.process?.platform;
  if (typeof platform === "string")
    return platform.startsWith("win");
  const os = global.Deno?.build?.os;
  if (typeof os === "string")
    return os === "windows";
  return global.navigator?.platform?.startsWith("Win") ?? false;
}
var isWindows4 = checkWindows2();
var REG_EXP_ESCAPE_CHARS = [
  "!",
  "$",
  "(",
  ")",
  "*",
  "+",
  ".",
  "=",
  "?",
  "[",
  "\\",
  "^",
  "{",
  "|"
];
var RANGE_ESCAPE_CHARS = ["-", "\\", "]"];
function _globToRegExp(c, glob, {
  extended = true,
  globstar: globstarOption = true,
  // os = osType,
  caseInsensitive = false
} = {}) {
  if (glob === "") {
    return /(?!)/;
  }
  let newLength = glob.length;
  for (; newLength > 1 && c.seps.includes(glob[newLength - 1]); newLength--)
    ;
  glob = glob.slice(0, newLength);
  let regExpString = "";
  for (let j = 0; j < glob.length; ) {
    let segment = "";
    const groupStack = [];
    let inRange = false;
    let inEscape = false;
    let endsWithSep = false;
    let i = j;
    for (; i < glob.length && !(c.seps.includes(glob[i]) && groupStack.length === 0); i++) {
      if (inEscape) {
        inEscape = false;
        const escapeChars = inRange ? RANGE_ESCAPE_CHARS : REG_EXP_ESCAPE_CHARS;
        segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        continue;
      }
      if (glob[i] === c.escapePrefix) {
        inEscape = true;
        continue;
      }
      if (glob[i] === "[") {
        if (!inRange) {
          inRange = true;
          segment += "[";
          if (glob[i + 1] === "!") {
            i++;
            segment += "^";
          } else if (glob[i + 1] === "^") {
            i++;
            segment += "\\^";
          }
          continue;
        } else if (glob[i + 1] === ":") {
          let k = i + 1;
          let value = "";
          while (glob[k + 1] !== void 0 && glob[k + 1] !== ":") {
            value += glob[k + 1];
            k++;
          }
          if (glob[k + 1] === ":" && glob[k + 2] === "]") {
            i = k + 2;
            if (value === "alnum")
              segment += "\\dA-Za-z";
            else if (value === "alpha")
              segment += "A-Za-z";
            else if (value === "ascii")
              segment += "\0-\x7F";
            else if (value === "blank")
              segment += "	 ";
            else if (value === "cntrl")
              segment += "\0-\x7F";
            else if (value === "digit")
              segment += "\\d";
            else if (value === "graph")
              segment += "!-~";
            else if (value === "lower")
              segment += "a-z";
            else if (value === "print")
              segment += " -~";
            else if (value === "punct") {
              segment += `!"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_\u2018{|}~`;
            } else if (value === "space")
              segment += "\\s\v";
            else if (value === "upper")
              segment += "A-Z";
            else if (value === "word")
              segment += "\\w";
            else if (value === "xdigit")
              segment += "\\dA-Fa-f";
            continue;
          }
        }
      }
      if (glob[i] === "]" && inRange) {
        inRange = false;
        segment += "]";
        continue;
      }
      if (inRange) {
        segment += glob[i];
        continue;
      }
      if (glob[i] === ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] !== "BRACE") {
        segment += ")";
        const type = groupStack.pop();
        if (type === "!") {
          segment += c.wildcard;
        } else if (type !== "@") {
          segment += type;
        }
        continue;
      }
      if (glob[i] === "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] !== "BRACE") {
        segment += "|";
        continue;
      }
      if (glob[i] === "+" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("+");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "@" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("@");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "?") {
        if (extended && glob[i + 1] === "(") {
          i++;
          groupStack.push("?");
          segment += "(?:";
        } else {
          segment += ".";
        }
        continue;
      }
      if (glob[i] === "!" && extended && glob[i + 1] === "(") {
        i++;
        groupStack.push("!");
        segment += "(?!";
        continue;
      }
      if (glob[i] === "{") {
        groupStack.push("BRACE");
        segment += "(?:";
        continue;
      }
      if (glob[i] === "}" && groupStack[groupStack.length - 1] === "BRACE") {
        groupStack.pop();
        segment += ")";
        continue;
      }
      if (glob[i] === "," && groupStack[groupStack.length - 1] === "BRACE") {
        segment += "|";
        continue;
      }
      if (glob[i] === "*") {
        if (extended && glob[i + 1] === "(") {
          i++;
          groupStack.push("*");
          segment += "(?:";
        } else {
          const prevChar = glob[i - 1];
          let numStars = 1;
          while (glob[i + 1] === "*") {
            i++;
            numStars++;
          }
          const nextChar = glob[i + 1];
          if (globstarOption && numStars === 2 && [...c.seps, void 0].includes(prevChar) && [...c.seps, void 0].includes(nextChar)) {
            segment += c.globstar;
            endsWithSep = true;
          } else {
            segment += c.wildcard;
          }
        }
        continue;
      }
      segment += REG_EXP_ESCAPE_CHARS.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
    }
    if (groupStack.length > 0 || inRange || inEscape) {
      segment = "";
      for (const c2 of glob.slice(j, i)) {
        segment += REG_EXP_ESCAPE_CHARS.includes(c2) ? `\\${c2}` : c2;
        endsWithSep = false;
      }
    }
    regExpString += segment;
    if (!endsWithSep) {
      regExpString += i < glob.length ? c.sep : c.sepMaybe;
      endsWithSep = true;
    }
    while (c.seps.includes(glob[i]))
      i++;
    j = i;
  }
  regExpString = `^${regExpString}$`;
  return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
var constants2 = {
  sep: "/+",
  sepMaybe: "/*",
  seps: ["/"],
  globstar: "(?:[^/]*(?:/|$)+)*",
  wildcard: "[^/]*",
  escapePrefix: "\\"
};
function globToRegExp(glob, options = {}) {
  return _globToRegExp(constants2, glob, options);
}
var constants3 = {
  sep: "(?:\\\\|/)+",
  sepMaybe: "(?:\\\\|/)*",
  seps: ["\\", "/"],
  globstar: "(?:[^\\\\/]*(?:\\\\|/|$)+)*",
  wildcard: "[^\\\\/]*",
  escapePrefix: "`"
};
function globToRegExp2(glob, options = {}) {
  return _globToRegExp(constants3, glob, options);
}
function globToRegExp3(glob, options = {}) {
  return isWindows4 ? globToRegExp2(glob, options) : globToRegExp(glob, options);
}
async function* expandGlob(pattern, options) {
  const opts = {
    caseInsensitive: options.caseInsensitive ?? false,
    globstar: options.globstar ?? true,
    followSymlinks: options.followSymlinks ?? false,
    includeDirs: options.includeDirs ?? true
  };
  let startDir;
  let remaining;
  if (nodePath.isAbsolute(pattern)) {
    const parsed = nodePath.parse(pattern);
    startDir = parsed.root;
    remaining = pattern.slice(parsed.root.length);
  } else {
    startDir = options.root;
    remaining = pattern;
  }
  const sepRe = isWindows3 ? /[/\\]/ : /\//;
  const segments = remaining.split(sepRe).filter((s) => s.length > 0);
  yield* walkSegments(startDir, segments, 0, opts);
}
async function* walkSegments(dir, segments, index, opts) {
  if (index >= segments.length) {
    return;
  }
  const segment = segments[index];
  const isLast = index === segments.length - 1;
  if (segment === "**" && opts.globstar) {
    yield* walkSegments(dir, segments, index + 1, opts);
    let entries2;
    try {
      entries2 = await fs9.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries2) {
      const entryPath = nodePath.join(dir, entry.name);
      if (await isDirectory2(entry, entryPath, opts.followSymlinks)) {
        yield* walkSegments(entryPath, segments, index, opts);
      }
    }
    return;
  }
  if (!hasGlobChar(segment)) {
    const nextPath = nodePath.join(dir, segment);
    let stat2;
    try {
      stat2 = await fs9.promises.stat(nextPath);
    } catch (err) {
      if (err?.code !== "ENOENT" || !opts.caseInsensitive || isWindows3) {
        return;
      }
      let entries2;
      try {
        entries2 = await fs9.promises.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      const lowered = segment.toLowerCase();
      for (const entry of entries2) {
        if (entry.name.toLowerCase() !== lowered)
          continue;
        yield* yieldOrDescend(nodePath.join(dir, entry.name), entry, segments, index, isLast, opts);
      }
      return;
    }
    if (isLast) {
      if (stat2.isFile() || stat2.isDirectory() && opts.includeDirs) {
        yield { path: nextPath };
      }
    } else if (stat2.isDirectory()) {
      yield* walkSegments(nextPath, segments, index + 1, opts);
    }
    return;
  }
  const regex = globToRegExp3(segment, {
    caseInsensitive: opts.caseInsensitive,
    globstar: opts.globstar
  });
  let entries;
  try {
    entries = await fs9.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!regex.test(entry.name))
      continue;
    yield* yieldOrDescend(nodePath.join(dir, entry.name), entry, segments, index, isLast, opts);
  }
}
async function* yieldOrDescend(entryPath, entry, segments, index, isLast, opts) {
  let isFile = entry.isFile();
  let isDir = entry.isDirectory();
  if (entry.isSymbolicLink()) {
    if (opts.followSymlinks) {
      try {
        const s = await fs9.promises.stat(entryPath);
        isFile = s.isFile();
        isDir = s.isDirectory();
      } catch {
        return;
      }
    } else if (isLast) {
      isFile = true;
    }
  }
  if (isLast) {
    if (isFile || isDir && opts.includeDirs) {
      yield { path: entryPath };
    }
  } else if (isDir) {
    yield* walkSegments(entryPath, segments, index + 1, opts);
  }
}
async function isDirectory2(entry, entryPath, followSymlinks) {
  if (entry.isDirectory())
    return true;
  if (followSymlinks && entry.isSymbolicLink()) {
    try {
      return (await fs9.promises.stat(entryPath)).isDirectory();
    } catch {
      return false;
    }
  }
  return false;
}
function hasGlobChar(segment) {
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (ch === "*" || ch === "?" || ch === "[")
      return true;
  }
  return false;
}
var rs_lib_internal_exports2 = {};
__export2(rs_lib_internal_exports2, {
  __wbg_error_7534b8e9a36f1ab4: () => __wbg_error_7534b8e9a36f1ab4,
  __wbg_new_405e22f390576ce2: () => __wbg_new_405e22f390576ce2,
  __wbg_new_78feb108b6472713: () => __wbg_new_78feb108b6472713,
  __wbg_new_8a6f238a6ece86ea: () => __wbg_new_8a6f238a6ece86ea,
  __wbg_set_37837023f3d740e8: () => __wbg_set_37837023f3d740e8,
  __wbg_set_3f1d0b984ed272ed: () => __wbg_set_3f1d0b984ed272ed,
  __wbg_set_wasm: () => __wbg_set_wasm2,
  __wbg_stack_0ed75d68575b0f3c: () => __wbg_stack_0ed75d68575b0f3c,
  __wbindgen_debug_string: () => __wbindgen_debug_string2,
  __wbindgen_init_externref_table: () => __wbindgen_init_externref_table2,
  __wbindgen_number_new: () => __wbindgen_number_new,
  __wbindgen_string_new: () => __wbindgen_string_new,
  __wbindgen_throw: () => __wbindgen_throw2,
  parse: () => parse2
});
var wasm3;
function __wbg_set_wasm2(val) {
  wasm3 = val;
}
var lTextDecoder2 = typeof import_node_util2.TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : import_node_util2.TextDecoder;
var cachedTextDecoder2 = new lTextDecoder2("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder2.decode();
var cachedUint8ArrayMemory02 = null;
function getUint8ArrayMemory02() {
  if (cachedUint8ArrayMemory02 === null || cachedUint8ArrayMemory02.byteLength === 0) {
    cachedUint8ArrayMemory02 = new Uint8Array(wasm3.memory.buffer);
  }
  return cachedUint8ArrayMemory02;
}
function getStringFromWasm02(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder2.decode(getUint8ArrayMemory02().subarray(ptr, ptr + len));
}
var WASM_VECTOR_LEN2 = 0;
var lTextEncoder2 = typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder;
var cachedTextEncoder2 = new lTextEncoder2("utf-8");
var encodeString2 = typeof cachedTextEncoder2.encodeInto === "function" ? function(arg, view) {
  return cachedTextEncoder2.encodeInto(arg, view);
} : function(arg, view) {
  const buf = cachedTextEncoder2.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
function passStringToWasm02(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder2.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory02().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN2 = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory02();
  let offset = 0;
  for (; offset < len; offset++) {
    const code2 = arg.charCodeAt(offset);
    if (code2 > 127)
      break;
    mem[ptr + offset] = code2;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory02().subarray(ptr + offset, ptr + len);
    const ret = encodeString2(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN2 = offset;
  return ptr;
}
var cachedDataViewMemory02 = null;
function getDataViewMemory02() {
  if (cachedDataViewMemory02 === null || cachedDataViewMemory02.buffer.detached === true || cachedDataViewMemory02.buffer.detached === void 0 && cachedDataViewMemory02.buffer !== wasm3.memory.buffer) {
    cachedDataViewMemory02 = new DataView(wasm3.memory.buffer);
  }
  return cachedDataViewMemory02;
}
function debugString2(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug2 = "[";
    if (length > 0) {
      debug2 += debugString2(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug2 += ", " + debugString2(val[i]);
    }
    debug2 += "]";
    return debug2;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
function takeFromExternrefTable02(idx) {
  const value = wasm3.__wbindgen_export_3.get(idx);
  wasm3.__externref_table_dealloc(idx);
  return value;
}
function parse2(command) {
  const ptr0 = passStringToWasm02(command, wasm3.__wbindgen_malloc, wasm3.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN2;
  const ret = wasm3.parse(ptr0, len0);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return takeFromExternrefTable02(ret[0]);
}
function __wbg_error_7534b8e9a36f1ab4(arg0, arg1) {
  let deferred0_0;
  let deferred0_1;
  try {
    deferred0_0 = arg0;
    deferred0_1 = arg1;
    console.error(getStringFromWasm02(arg0, arg1));
  } finally {
    wasm3.__wbindgen_free(deferred0_0, deferred0_1, 1);
  }
}
function __wbg_new_405e22f390576ce2() {
  const ret = new Object();
  return ret;
}
function __wbg_new_78feb108b6472713() {
  const ret = new Array();
  return ret;
}
function __wbg_new_8a6f238a6ece86ea() {
  const ret = new Error();
  return ret;
}
function __wbg_set_37837023f3d740e8(arg0, arg1, arg2) {
  arg0[arg1 >>> 0] = arg2;
}
function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
  arg0[arg1] = arg2;
}
function __wbg_stack_0ed75d68575b0f3c(arg0, arg1) {
  const ret = arg1.stack;
  const ptr1 = passStringToWasm02(ret, wasm3.__wbindgen_malloc, wasm3.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbindgen_debug_string2(arg0, arg1) {
  const ret = debugString2(arg1);
  const ptr1 = passStringToWasm02(ret, wasm3.__wbindgen_malloc, wasm3.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbindgen_init_externref_table2() {
  const table = wasm3.__wbindgen_export_3;
  const offset = table.grow(4);
  table.set(0, void 0);
  table.set(offset + 0, void 0);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
}
function __wbindgen_number_new(arg0) {
  const ret = arg0;
  return ret;
}
function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm02(arg0, arg1);
  return ret;
}
function __wbindgen_throw2(arg0, arg1) {
  throw new Error(getStringFromWasm02(arg0, arg1));
}
var bytes2 = base64decode2("AGFzbQEAAAAB8wEkYAJ/fwF/YAN/f38Bf2ACf38AYAN/f38AYAF/AGAFf39/f38AYAR/f39/AGABfwF/YAR/f39/AX9gBX9/f39/AX9gAAFvYAAAYAABf2ACf28AYAd/f39/f39/AX9gB39/f39/f38AYAZ/f39/f38AYAN/fn4Bf2ADf35+AGAAA39/f2ACf38Bb2ADb39vAGADb29vAGABfAFvYAJ+fwF/YAJ/fgF/YAN/f34Bf2AEf39/fgBgAn9/A39/f2AGf39/f39/AX9gBX9/fn9/AGAEf35/fwBgBX9/fX9/AGAEf31/fwBgBX9/fH9/AGAEf3x/fwACywQMFC4vcnNfbGliLmludGVybmFsLmpzFV9fd2JpbmRnZW5fc3RyaW5nX25ldwAUFC4vcnNfbGliLmludGVybmFsLmpzGl9fd2JnX25ld180MDVlMjJmMzkwNTc2Y2UyAAoULi9yc19saWIuaW50ZXJuYWwuanMaX193YmdfbmV3Xzc4ZmViMTA4YjY0NzI3MTMAChQuL3JzX2xpYi5pbnRlcm5hbC5qcxpfX3diZ19zZXRfMzc4MzcwMjNmM2Q3NDBlOAAVFC4vcnNfbGliLmludGVybmFsLmpzGl9fd2JnX3NldF8zZjFkMGI5ODRlZDI3MmVkABYULi9yc19saWIuaW50ZXJuYWwuanMVX193YmluZGdlbl9udW1iZXJfbmV3ABcULi9yc19saWIuaW50ZXJuYWwuanMXX193YmluZGdlbl9kZWJ1Z19zdHJpbmcADRQuL3JzX2xpYi5pbnRlcm5hbC5qcxpfX3diZ19uZXdfOGE2ZjIzOGE2ZWNlODZlYQAKFC4vcnNfbGliLmludGVybmFsLmpzHF9fd2JnX3N0YWNrXzBlZDc1ZDY4NTc1YjBmM2MADRQuL3JzX2xpYi5pbnRlcm5hbC5qcxxfX3diZ19lcnJvcl83NTM0YjhlOWEzNmYxYWI0AAIULi9yc19saWIuaW50ZXJuYWwuanMQX193YmluZGdlbl90aHJvdwACFC4vcnNfbGliLmludGVybmFsLmpzH19fd2JpbmRnZW5faW5pdF9leHRlcm5yZWZfdGFibGUACwPtAusCBgcAAwMDAAAFAwMABwIHAw4ICAcHAwUBAwIDAwQDBQMAAwEBAAMJAAEBBw8DDwIDAwIG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AgBBxOPAAEG448AANgIAQbjjwABBsOPAADYCAEHM48AAQcDjwAA2AgBBwOPAAEG448AANgIAQdTjwABByOPAADYCAEHI48AAQcDjwAA2AgBB3OPAAEHQ48AANgIAQdDjwABByOPAADYCAEGU48AAQQA2AgBB5OPAAEHY48AANgIAQdjjwABB0OPAADYCAEHg48AAQdjjwAA2AgBB7OPAAEHg48AANgIAQejjwABB4OPAADYCAEH048AAQejjwAA2AgBB8OPAAEHo48AANgIAQfzjwABB8OPAADYCAEH448AAQfDjwAA2AgBBhOTAAEH448AANgIAQYDkwABB+OPAADYCAEGM5MAAQYDkwAA2AgBBiOTAAEGA5MAANgIAQZTkwABBiOTAADYCAEGQ5MAAQYjkwAA2AgBBnOTAAEGQ5MAANgIAQZjkwABBkOTAADYCAEGk5MAAQZjkwAA2AgBBrOTAAEGg5MAANgIAQaDkwABBmOTAADYCAEG05MAAQajkwAA2AgBBqOTAAEGg5MAANgIAQbzkwABBsOTAADYCAEGw5MAAQajkwAA2AgBBxOTAAEG45MAANgIAQbjkwABBsOTAADYCAEHM5MAAQcDkwAA2AgBBwOTAAEG45MAANgIAQdTkwABByOTAADYCAEHI5MAAQcDkwAA2AgBB3OTAAEHQ5MAANgIAQdDkwABByOTAADYCAEHk5MAAQdjkwAA2AgBB2OTAAEHQ5MAANgIAQezkwABB4OTAADYCAEHg5MAAQdjkwAA2AgBB9OTAAEHo5MAANgIAQejkwABB4OTAADYCAEH85MAAQfDkwAA2AgBB8OTAAEHo5MAANgIAQYTlwABB+OTAADYCAEH45MAAQfDkwAA2AgBBjOXAAEGA5cAANgIAQYDlwABB+OTAADYCAEGU5cAAQYjlwAA2AgBBiOXAAEGA5cAANgIAQZzlwABBkOXAADYCAEGQ5cAAQYjlwAA2AgBBtOXAACACNgIAQZjlwABBkOXAADYCAEGs5cAAIARBKGsiADYCACACIABBAXI2AgQgACACakEoNgIEQcDlwABBgICAATYCAAwICyACIANNIAEgA0tyDQAgACgCDEUNAwtBxOXAAEHE5cAAKAIAIgAgAiAAIAJJGzYCACACIARqIQFBiOPAACEAAkACQANAIAEgACgCACIGRwRAIAAoAggi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AAsgCyADOgAvQdzLwABBKyALQS9qQbjPwABByM/AABCWAQALrhgCD38BfiMAQbACayIDJAAgA0EANgKcASADQoCAgIDAADcClAEgA0HoAGohCSADQYQCaiEKIANB7ABqIRAgA0GsAWohCyADQaQBaiEMAn8CQAJAAkACQAJAA0AgAkUEQEEAIQIMAwsgA0GAgICAeDYCgAIgA0HgAGogA0GAAmoQoAEgAy0AZCEFIAMoAmAiBEGBgICAeEcEQCADQecAai0AAEEYdCADLwBlQQh0ciAFciEFIAMoAnAhAiADKAJsIQEgAygCaCEGDAILIAVBAXFFDQIgAyACNgKUAiADIAE2ApACIANBHjYCjAIgA0GWv8AANgKIAiADQqeAgIDwBDcCgAIgA0HgAGpBJyABIAIQiwEgAygCaCEEIAMoAmQhDQJAAkACQAJAIAMoAmAiEUGBgICAeEcEQCADKAJsIQYMAQsgA0EANgJoIAMgDTYCYCADIAQgDWo2AmQgA0HIAGogDSAEIAQCfwJAA0AgA0HYAGogA0HgAGoQngEgAygCXCIFQYCAxABGDQEgBUEnRw0ACyADQdAAaiANIAQgAygCWEGsucAAELUBIAMoAlAhBiADKAJUDAELQQEhBkEACyIFa0HwucAAELoBIAMoAkwhByADKAJIIQggA0HgAGogCiAGIAUQRyADKAJgIhFBgYCAgHhGDQEgAygCbCEGIAMoAmghBCADKAJkIQ0LIAMoAnAhBSARQYCAgIB4RwRAIAMgBTYCtAEgAyAGNgKwASADIAQ2AqwBIAMgDTYCqAEgAyARNgKkASADQQE2AqABDAMLIANBgAJqQSIgASACEIsBIAMoAogCIQggAygChAIhByADKAKAAiIEQYGAgIB4RwRAIAMgAykCjAI3ArABIAMgCDYCrAEgAyAHNgKoASADIAQ2AqQBIANBATYCoAEMAgsgA0EANgLAASADQoCAgIDAADcCuAEgA0EANgLMASADIAc2AsQBIAMgByAIajYCyAEDQEEAIQRBgYDEACEFAkACQAJAAkACQAJAAkADQCADQYGAxAA2AtQBAn8gBUGBgMQARwRAIAMoAtABDAELIANBQGsgA0HEAWoQngEgAygCRCEFIAMoAkALIQYCQAJAAkACQAJAAkAgBUEiaw4DAwQBAAsgBUHgAEYNASAFQYCAxABHDQMgA0GgAWogASACQaTBwABBHhCMAiADQbgBahDWAQwPCyAEQQFxDQIgAygC1AEiBEGBgMQARgRAIANBGGogA0HEAWoQngEgAyADKAIcIgQ2AtQBIAMgAygCGDYC0AELIARBKEcNAiADQRBqIAcgCCAGQbS/wAAQugEgA0GAAmogAygCECADKAIUEE8gCSAKQQhqIgUpAgA3AwAgA0HwAGoiBCAKQRBqKAIANgIAIAMgCikCADcDYCADKAKAAkEBRgRAIAwgAykDYDcCACAMQRBqIAQoAgA2AgAgDEEIaiAJKQMANwIADAoLIANBuAFqIAkQnAEgA0EIaiAHIAggBkHEv8AAELUBIANBgAJqIAMoAgggAygCDBA8IAMoAoACQQFHDQMgAygChAIiBkGAgICAeEcEQCADKAKUAiEHIAMoApACIQggAygCjAIhDyADKAKIAiEEIANB6AFqIg5B1L/AAEE8ELIBIA5BvLnAAEG+ucAAEN0BIA4gBCAPEM4CIANB4ABqIAggByAOEJUCIAYgBBDxAgwICyADQoGAgICAgICAgH83A2AMBwsgBEEBcQ0BIANBKGogByAIIAZBoMDAABC6ASADQYACaiADKAIoIAMoAiwQTyAJIApBCGoiBSkCADcDACADQfAAaiIEIApBEGooAgA2AgAgAyAKKQIANwNgIAMoAoACQQFGBEAgDCADKQNgNwIAIAxBEGogBCgCADYCACAMQQhqIAkpAwA3AgAMCQsgA0G4AWogCRCcASADQSBqIAcgCCAGQbDAwAAQtQEgA0GAAmogAygCICADKAIkECEgAygCgAJBAUcNBCADKAKEAiIGQYCAgIB4RwRAIAMoApQCIQcgAygCkAIhCCADKAKMAiEPIAMoAogCIQQgA0H0AWoiDkHAwMAAQTEQsgEgDkG8ucAAQb65wAAQ3QEgDiAEIA8QzgIgA0HgAGogCCAHIA4QlQIgBiAEEPECDAYLIANCgYCAgICAgICAfzcDYAwFCyAEQQFxDQAgA0E4aiAHIAggBkGEwcAAELoBIANBgAJqIAMoAjggAygCPBBPIAkgCkEIaikCADcDACADQfAAaiIEIApBEGooAgA2AgAgAyAKKQIANwNgIAMoAoACQQFGBEAgDCADKQNgNwIAIAxBEGogBCgCADYCACAMQQhqIAkpAwA3AgAMCAsgA0GIAmoiDyAJQQhqKAIANgIAIAMgCSkCADcDgAIgA0EwaiAHIAggBkEBakGUwcAAELUBIAMoAjQhBCADKAIwIQUgAygCwAEEQCADQbgBaiADQYACahCcASALIAMpArgBNwIAIAtBCGogA0HAAWooAgA2AgAgAyAENgKoASADIAU2AqQBIANBADYCoAEMDQsgCyADKQOAAjcCACALQQhqIA8oAgA2AgAgAyAENgKoASADIAU2AqQBIANBADYCoAEMCAsgBUHcAEYhBCADKALUASEFDAELCyAEIANBkAJqKQIANwMAIAkgA0GIAmopAgA3AwAgAyADKQKAAjcDYAwCCyAEIANBkAJqKQIANwMAIAkgA0GIAmopAgA3AwAgAyADKQKAAjcDYAsgA0HgAWoiBCAQQQhqKAIANgIAIAMgECkCADcD2AEgAygCZCEHIAMoAmghCCADKAJgQQFGBEAMAgsgCiADKQPYATcCACAFIAQoAgA2AgAgA0EDNgKAAiADQbgBaiADQYACakH0wMAAEMEBIANBgYDEADYC1AEgA0EANgLMASADIAc2AsQBIAMgByAIajYCyAEMBQsgA0HgAWoiBCAQQQhqKAIANgIAIAMgECkCADcD2AEgAygCZCEHIAMoAmghCCADKAJgQQFHDQMLIAsgAykD2AE3AgAgC0EIaiAEKAIANgIAIAMgCDYCqAEgAyAHNgKkAQsgA0EBNgKgAQsgA0G4AWoQ1gEMAwsgCiADKQPYATcCACAFIAQoAgA2AgAgA0EDNgKAAiADQbgBaiADQYACakGQwMAAEMEBIANBgYDEADYC1AEgA0EANgLMASADIAc2AsQBIAMgByAIajYCyAEMAAsACyADKQJkIRJBEBDBAiEEIANBgAJqIAggBxCyASAEQQA2AgAgBCADKQKAAjcCBCAEQQxqIANBiAJqKAIANgIAIANBATYCtAEgAyAENgKwASADQQE2AqwBIAMgEjcCpAEgA0EANgKgAQwBCyARIA0QrwILAkAgAygCoAEEQCADKAKkASIEQYCAgIB4Rg0BIAMoArQBIQIgAygCsAEhASADKAKsASEGIAMoAqgBIQUMAwsgAygCqAEhAiADKAKkASEBIANBlAFqIAsQxQEMAQsLIAMoApwBIQQgAygCmAEhBSADKAKUASEGQYCAgIB4IAMoAqgBEK8CDAILIANBlAFqENcBDAILIAMoApwBIQQgAygCmAEhBSADKAKUASEGCyADIAQ2AogCIAMgBTYChAIgAyAGNgKAAiAEDQEgA0GAAmoQ1wFBACECQYCAgIB4IQQLIAAgBjYCDCAAIAU2AgggACAENgIEQQEhBUEQIQZBFAwBCyADQQA2AoABIANBADYCcCADIAY2AmggAyAFNgJkIAMgBTYCYCADIAUgBEEMbGo2AmwgA0GgAWogA0HgAGoiBxB0AkAgAygCoAFBBUcEQCADQYACaiIIIAcQmQEgA0EEIAMoAoACQQFqIgRBfyAEGyIEIARBBE0bQQRBEEHkuMAAELQBIANBqAFqKQIAIRIgAygCACEFIAMoAgQiBCADKQKgATcCACAEQQhqIBI3AgAgA0HMAWoiBkEBNgIAIAMgBDYCyAEgAyAFNgLEASAIIAdBMPwKAAAgA0HEAWogCBCEASAAQQxqIgRBCGogBigCADYCACAEIAMpAsQBNwIADAELIABBADYCFCAAQoCAgIDAADcCDCADQeAAahCtAQtBACEFQQQhBkEICyEEIAAgBmogATYCACAAIARqIAI2AgAgACAFNgIAIANBsAJqJAALnBUCD38CfiMAQYADayIDJAAgAyACNgKkASADIAE2AqABIANBKTYCnAEgA0HgxcAANgKYASADQqiAgICQBTcCkAEgA0G8AmoiBkEoIAEgAhCLASADKALEAiEEIAMoAsACIQcCQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCADKAK8AiIIQYGAgIB4RgRAIAYgByAEEI8BIAMoAsQCIQQgAygCwAIhByADKAK8AiIIQYGAgIB4Rg0BCyADKQLIAiESDAELIANBvAJqIAcgBBApIAMpAswCIRIgAygCyAIhBiADKALEAiEHIAMoAsACIQggAygCvAIEQCAGIQQMAQsgAyASNwIQIAMgBjYCDCADQbwCaiADQZQBaiAIIAcQRyADKALEAiEEIAMoAsACIQcgAygCvAIiCEGBgICAeEYNASADKQLIAiESIANBDGoQugILIAhBgICAgHhHBEAgCCEFIAchBiAEIQkMAwsgA0G8AmogASACEBsgAykCzAIhEiADKALIAiEKIAMoAsQCIQYgAygCwAIhBQJ/IAMoArwCQQFGBEAgCiEJQYGAgIB4DAELIAMgCjYCkAEgAyASNwKUASADQbwCaiAFIAYQFSADKQLMAiETIAMoAsgCIQkgAygCxAIhBCADKALAAiELAkACfyADKAK8AkEBRgRAIBMhEiAEIQYgCwwBCyADIAk2ArwCIAMgEzcCwAIgE0L/////D1YNASADQbwCahDQAUGAgICAeAshBSADQZABahDPAUGBgICAeAwBCyASQiCIpyEGIBKnIQUgCkGAgICAeEYEQCATIRJBgYCAgHgMAQsgEyESIAoLIQwgCCAHEK8CIAxBgYCAgHhGDQIMAQtBDBDBAiIFIBI3AgQgBSAGNgIAQYCAgIB4IQwgByELCyADIBI3AswCIAMgCTYCyAIgAyAGNgLEAiADIAU2AsACIAMgDDYCvAIgA0GQAWogCyAEEFQgAygCmAEhCiADKAKUASENIAMoApABIgRBgYCAgHhGDQEgAykCnAEhEiADQbwCahDrASAEIQUgDSEGIAohCQsgAyASNwLgASADIAk2AtwBIAMgBjYC2AEgAyAFNgLUAQwBCyADIBI3AqABIAMgCTYCnAEgAyAGNgKYASADIAU2ApQBIAMgDDYCkAEgA0EANgJsIANCgICAgMAANwJkQQQhDEEQIQhBACEHIAohBCANIQYCQAJAAkADQCAERQRAQQAhBAwCCyADQYCAgIB4NgK8AiADQQxqIANBvAJqEKABIAMtABAhBQJAIAMoAgwiC0GBgICAeEcEQCADQRNqLQAAQRh0IAMvABFBCHRyIAVyIQUgAykCGCESIAMoAhQhCQwBCyAFQQFxRQ0CIANBvAJqIAYgBBAWAkACQCADKALEAiIOQQNGBEAgAykC1AIhEiADKALQAiEJIAMoAswCIQUgAygCyAIhCwwBCyADKALAAiEFIAMoArwCIQkgAygCyAIhDyADKALMAiEQIAMoAtACIREgAyADKQLUAiISNwLMAiADIBE2AsgCIAMgEDYCxAIgAyAPNgLAAiADIA42ArwCIANBDGogCSAFEFQgAygCFCEJIAMoAhAhBSADKAIMIgtBgYCAgHhGDQEgAykCGCESIANBvAJqEJMCCyALQYCAgIB4Rw0BIAMpAmghEiADKAJkIQhBgICAgHggBRCvAgwECyADKAJkIAdGBEAgA0HkAGoQxgEgAygCaCEMCyAIIAxqIgQgEjcCACAEQQRrIBE2AgAgBEEIayAQNgIAIARBDGsgDzYCACAEQRBrIA42AgAgAyAHQQFqIgc2AmwgCEEYaiEIIAkhBCAFIQYMAQsLIANB5ABqENEBIAMgEjcC4AEgAyAJNgLcASADIAU2AtgBIAMgCzYC1AEMAgsgAykCaCESIAMoAmQhCAsgAyAINgK8AiADIBI3AsACIBJC/////x9YBEBBAyEIIBJCgICAgBBaBEAgA0GwAmogEqciBUEMaikCADcDACADQbgCaiAFQRRqKAIANgIAIANBADYCxAIgAyAFKQIENwOoAiAFKAIAIQgLIANB+AFqIANBoAFqKQIANwIAIANB8AFqIANBmAFqKQIANwIAIANB3AFqIANBsAJqIgkpAwA3AgAgA0HkAWogA0G4AmoiBygCADYCACADIAMpApABNwLoASADIAMpA6gCNwLUASADQbwCahDRASAIQQRGDQIgA0E0aiADQegBaiIFQRBqKQIANwIAIANBLGogBUEIaikCADcCACADQRhqIAkpAwA3AgAgA0EgaiAHKAIANgIAIAMgBSkCADcCJCADIAMpA6gCNwIQIAMgCDYCDCADQeQAaiAGIAQQQiADKAJkQYCAgIB4aw4CBQMECyADQdQBaiANIApBpr7AAEEvEJcBIANBvAJqENEBCyADQZABahDrAQsgA0GIAWogA0HkAWooAgAiATYCACADQYABaiADQdwBaikCACISNwMAIAMgAykC1AEiEzcDeCAAQRxqIAE2AgAgAEEUaiASNwIAIAAgEzcCDCAAQQU2AggMBQsgAy0AcCEFIANBvAJqIAMoAmgiBCADKAJsIgYQEAJAAkACQCADKALEAkEFRgRAIANByAFqIgkgBCAGEBAgAygC0AFBBUYNASADQZABaiAEIAZBub3AAEEtEIsCIAkQ8wEMAgsgA0GQAWogA0G8AmpBOPwKAAAMAgsgAygC1AEiCUGAgICAeEcEQCADKALkASEGIAMoAuABIQcgAygC3AEhCyADKALYASEEIANB9AJqIgpBub3AAEEtELIBIApBvLnAAEG+ucAAEN0BIAogBCALEM4CIANBnAFqIAcgBiAKEPABIANBBTYCmAEgCSAEEPECDAELIANBkAFqIAQgBkG5vcAAQS0QiwILIANBvAJqEPMBCyADKAKYASIJQQVGBEAgA0GIAWogA0GsAWooAgAiATYCACADQYABaiADQaQBaikCACISNwMAIAMgAykCnAEiEzcDeCAAQRxqIAE2AgAgAEEUaiASNwIAIAAgEzcCDCAAQQU2AggMBAsgA0GAAWogA0GkAWopAgAiEjcDACADQYgBaiADQawBaigCACIHNgIAIAMgAykCnAEiEzcDeCADKAKUASEEIAMoApABIQYgA0HkAmogA0HAAWopAgA3AgAgA0HcAmogA0G4AWopAgA3AgAgA0HIAmogEjcCACADQdACaiAHNgIAIAMgAykCsAE3AtQCIAMgEzcCwAIgAyAJNgK8AiAIQQNGBEAgA0HIAWogA0EMakEw/AoAACADQfgBaiADQbwCakEw/AoAAEHkABDBAiIHIANByAFqQeAA/AoAACAHIAU6AGBBBCEIDAMLIAAgASACQea9wABBwAAQiwIgA0G8AmoQ6gEMAwsgACADKQJkNwIMIABBBTYCCCAAQRxqIANB9ABqKAIANgIAIABBFGogA0HsAGopAgA3AgAMAgsgAygCECEHIANBPGogA0EUakEo/AoAAEGAgICAeCADKAJoEK8CCyAAIAc2AgwgACAINgIIIAAgBDYCBCAAIAY2AgAgAEEQaiADQTxqQSj8CgAADAELIANBDGoQgQILIANBgANqJAAL5hQCCn8CfiMAQeACayIDJAAgA0HQAWogASACEBsgA0EIaiIEIANB5AFqKAIANgIAIAMgAykC3AE3AwAgAygC2AEhCCADKALUASEFAkACQAJAAkACfgJAAkACQAJAAkACQAJAAkACQAJAIAMoAtABQQFGBEAgA0FAayAEKAIANgIAIAMgAykDADcDOAwBCyADQdgBaiAEKAIAIgQ2AgAgAyADKQMANwPQASAEDQEgA0HQAWoQzwFBgICAgHghBQsgA0EINgKoAiADQbwCaiADQUBrKAIANgIAIAMgAykDODcCtAIgAyAINgKwAiADIAU2AqwCDAELIANBgAFqIANB2AFqIgYoAgAiBDYCACADIAMpA9ABIg03A3ggA0FAayAENgIAIAMgDTcDOCADQdABaiAFIAgQFSADQQhqIgQgA0HkAWooAgA2AgAgAyADKQLcATcDACADKALYASEIIAMoAtQBIQUCQAJAIAMoAtABQQFGBEAgA0EINgKoAiADQbwCaiAEKAIANgIAIAMgAykDADcCtAIgAyAINgKwAiADIAU2AqwCDAELIAYgBCgCACIENgIAIAMgAykDADcD0AEgBEUNASADQoiAgICAgICAgH83AqgCIANB0AFqENABQYCAgIB4IQULIANBOGoQzwEMAQsCfyADKAJAIgZBAU0EQCAGRQ0EIANBtAJqIAMoAjwiB0EIaikCADcCACADQbwCaiAHQRBqKQIANwIAIAMgBykCADcCrAIgBkEYbEEYayIEBEAgByAHQRhqIAT8CgAACyADQQU2AqgCIAMgCDYCpAIgAyAFNgKgAiADIAZBAWs2AkBBBQwBCyADQaACaiABIAJB7LzAAEHNABCKAiADKAKoAgshCSADQdABahDQASADQThqEM8BIAlBCEcNASADKAKsAiEFCyAFQYCAgIB4RwRAIAMpArgCIQ0gAygCtAIhBCADKAKwAiEGDAoLIANBydPAAEEBELIBIANB0AFqIAMoAgQiCyADKAIIIAEgAhCkASADKALgASEIIAMoAtwBIQcgAygC2AEhBCADKALUASEGIAMoAtABIgVBgYCAgHhHBEAgCCEKDAQLIANB0AFqIAYgBBA7IAMoAuABIQogAygC3AEhCSADKALYASEEIAMoAtQBIQYgAygC0AEiBUGBgICAeEcNAiAGRQRAIAQhBSAHIQYgCCEEDAMLIAMoAgAgCxDxAgwECyADQZgBaiADQcgCaikCADcDACADQaABaiADQdACaikCADcDACADQZ4CaiADQdsCai0AADoAACADIAMpAsACNwOQASADIAMvANkCOwGcAiADKQK4AiENIAMoArQCIQQgAygCsAIhBiADKAKsAiEFIAMoAqQCIQEgAygCoAIhByADLQDYAiECDAcLIwBBMGsiACQAIABBADYCBCAAQQA2AgAgAEEDNgIMIABBlJbAADYCCCAAQgI3AhQgACAAQQRqrUKAgICAMIQ3AyggACAArUKAgICAMIQ3AyAgACAAQSBqNgIQIABBCGpB3LzAABDtAQALIAkhBwsgAygCACALEPECAkAgBUGAgICAeGsOAgABAgtBgICAgHggBhCvAkEAIQcgAiEEIAEhBgsgA0HQAWogBiAEEBAgAygC2AEiCUEFRw0BIAMpAugBIg1CIIinIQogAygC5AEhBCADKALgASEGIAMoAtwBIQUgDachBwtBCCEJIAetIAqtQiCGhAwBCyADQZgBaiADQfgBaikCADcDACADQaABaiADQYACaikCADcDACADIAMpAvABNwOQASAHQQBHIQIgAygC5AEhBCADKALgASEGIAMoAtwBIQUgAygC1AEhASADKALQASEHIAMpAugBCyENIAMoAqgCQQhGBEBBgICAgHggAygCsAIQrwILIAlBCEYNAQsgA0HIAmogA0GgAWopAwA3AgAgA0HAAmogA0GYAWopAwA3AgAgA0HTAmogA0GeAmotAAA6AAAgAyADKQOQATcCuAIgAyACOgDQAiADIA03ArACIAMgBDYCrAIgAyAGNgKoAiADIAU2AqQCIAMgCTYCoAIgAyADLwGcAjsA0QIgA0HQAWogByABEFQgAygC2AEhAiADKALUASEBIAMoAtABIghBgYCAgHhGDQEgAykC3AEhDSADQaACahDAASACIQQgASEGIAghBQsgACANNwIYIAAgBDYCFCAAIAY2AhAgACAFNgIMIABBCDYCCAwBCyADQTBqIANBuAJqIghBGGooAgA2AgAgA0EoaiAIQRBqKQIANwIAIANBIGogCEEIaikCADcCACADIAgpAgA3AhggAyANNwIQIAMgBDYCDCADIAY2AgggAyAFNgIEIAMgCTYCACADQeQAaiABIAIQXgJAAkACQAJAAkAgAygCZCIMQYCAgIB4aw4CAgABCyADLQBwIQsgA0HQAWogAygCaCIEIAMoAmwiAhARAkACQAJAIAMoAtgBQQhGBEAgA0GgAmoiASAEIAIQESADKAKoAkEIRg0BIANBkAFqIAQgAkGwvMAAQSwQigIgARDyAQwCCyADQZABaiADQdABakE8/AoAAAwCCyADKAKsAiIGQYCAgIB4RwRAIAMoArwCIQQgAygCuAIhAiADKAK0AiEBIAMoArACIQggA0GQAmoiB0GwvMAAQSwQsgEgB0G8ucAAQb65wAAQ3QEgByAIIAEQzgIgA0GcAWogAiAEIAcQ8AEgA0EINgKYASAGIAgQ8QIMAQsgA0GQAWogBCACQbC8wABBLBCKAgsgA0HQAWoQ8gELIAMoApgBIgpBCEYEQCADQYgBaiADQawBaigCACIBNgIAIANBgAFqIANBpAFqKQIAIg43AwAgAyADKQKcASINNwN4IABBHGogATYCACAAQRRqIA43AgAgACANNwIMIABBCDYCCAwECyADQYABaiIFIANBpAFqKQIANwMAIANBiAFq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AwAgB0EYaiABQRBqKQIANwMAIAdBEGogAUEIaikCADcDACAHIAEpAgA3AwggCSgCACEBIAcgB0EIaq1CgICAgKABhDcDSCAHQQE2AjQgB0H82cAANgIwIAdCATcCPCABQQRqKAIAIQggByAHQcgAajYCOCABKAIAIAggB0EwahAvRQ0CDAQLIAkoAgAiASgCAEHM2sAAQQkgAUEEaigCACgCDBEBAA0DDAELIAdBKGogAUEgaikCADcDACAHQSBqIAFBGGopAgA3AwAgB0EYaiABQRBqKQIANwMAIAdBEGogAUEIaikCADcDACAHIAEpAgA3AwggCSgCACEBIAcgB0EIaq1CgICAgKABhDcDSCAHQQE2AkQgB0HY2MAANgJAIAdBATYCNCAHQfzZwAA2AjAgB0EBNgI8IAFBBGooAgAhCCAHIAdByABqNgI4IAEoAgAgCCAHQTBqEC8NAgsgCSgCACIBKAIAQaTbwABBASABQQRqKAIAKAIMEQEADQEgAigCAEECRg0AQQEhASADQQFxRQ0AIwBBQGoiAyQAIAMgBDYCDAJAIAktABBBAUYEQCAJKAIAIQggA0KAgICAoAE3AxggA0H82cAANgIoIANC/NnAgPAANwMQQQEhBCADQQE2AjwgA0HM3MAANgI4IANBATYCLCADQQI2AjQgCEEEaigCACEKIAMgA0EQajYCMCAIKAIAIAogA0EoahAvDQELIAkoAgAiBCgCAEHq3MAAQRAgBEEEaigCACgCDBEBAARAQQEhBAwBCyAJKAIEIAkoAgghCiADQTRqIAJBCGooAgA2AgAgAyAJKAIAIgs2AiggAyACKQIANwIsQQEhBCALIANBLGogCigCEBEBAA0AIAkoAgAhAiADIANBDGqtQoCAgICwAYQ3AxAgA0EBNgIsIANB/NzAADYCKCADQgE3AjQgAkEEaigCACEIIAMgA0EQaiIKNgIwIAIoAgAgCCADQShqIggQLw0AIAVBAXEEQCADIAY2AiQgCSgCACECIAMgA0Ekaq1CgICAgLABhDcDECADQQE2AiwgA0H83MAANgIoIANCATcCNCACQQRqKAIAIQUgAyAKNgIwIAIoAgAgBSAIEC8NAQsgCSgCACICKAIAQaTbwABBASACQQRqKAIAKAIMEQEAIQQLIANBQGskACAEDQILIAAgDEEBajYCBEEA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AEYNAiACQbDlwAAoAgBGDQMgAiADQXhxIgIQSiABIAAgAmoiAEEBcjYCBCAAIAFqIAA2AgAgAUGw5cAAKAIARw0BQajlwAAgADYCAA8LIAIgA0F+cTYCBCABIABBAXI2AgQgACABaiAANgIACyAAQYACSQ0CIAEgABBWQQAhAUHI5cAAQcjlwAAoAgBBAWsiADYCACAADQRBkOPAACgCACIABEADQCABQQFqIQEgACgCCCIADQALC0HI5cAAQf8fIAEgAUH/H00bNgIADwtBtOXAACABNgIAQazlwABBrOXAACgCACAAaiIANgIAIAEgAEEBcjYCBEGw5cAAKAIAIAFGBEBBqOXAAEEANgIAQbDlwABBADYCAAsgAEHA5cAAKAIAIgNNDQNBtOXAACgCACICRQ0DQQAhAEGs5cAAKAIAIgRBKUkNAkGI48AAIQEDQCACIAEoAgAiBU8EQCACIAUgASgCBGpJDQQLIAEoAgghAQwACwALQbDlwAAgATYCAEGo5cAAQajlwAAoAgAgAGoiADYCACABIABBAXI2AgQgACABaiAANgIADwsgAEH4AXFBmOPAAGohAgJ/QaDlwAAoAgAiA0EBIABBA3Z0IgBxRQRAQaDlwAAgACADcjYCACACDAELIAIoAggLIQAgAiABNgIIIAAgATYCDCABIAI2AgwgASAANgIIDwtBkOPAACgCACIBBEADQCAAQQFqIQAgASgCCCIBDQALC0HI5cAAQf8fIAAgAEH/H00bNgIAIAMgBE8NAEHA5cAAQX82AgALC8AFAQV/IwBBgAFrIgMkACADQcQAaiABIAIQjwEgAygCTCECIAMoAkghAQJAIAMoAkQiBkGBgICAeEcEQCAAIAMpAlA3AhAgACACNgIMIAAgATYCCCAAIAY2AgQgAEEBNgIADAELQQAhBiADQQA2AgwgA0KAgICAwAA3AgQgA0HMAGohBwJAAkACQAJAA0AgAkUNBCADQcQAaiABIAIQESADKAJMQQhGBEAgAygCUEGAgICAeEYNBCAAQQE2AgAgACADQdAAaiIBKQIANwIEIABBFGogAUEQaigCADYCACAAQQxqIAFBCGopAgA3AgAMAwsgAygCSCEBIAMoAkQhAiADQRBqIAdBNPwKAAAgA0HEAGogAiABEFQgAygCTCECIAMoAkghASADKAJEIgRBgYCA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DAELQQEhAiADQcrUwABBARA1DQAgAVAEQCADQcrTwABBARA1IQIMAQsCQCABIAA1AhQiBVgEQCAFIAF9IgFCGlQNASADQcrTwABBARA1DQIgASADEEYhAgwCCyADQaDUwABBEBA1DQFBACECIABBADoABCAAQQA2AgAMAQsgBCABp0HhAGo2AgwgBEEMaiADEF0hAgsgBEEQaiQAIAILugECBH8BfiMAQRBrIgMkACADIAE2AgggAyABIAJqNgIMAkADQAJAAkAgA0EIahDZASIEQYCAxABHBEAgBEEwayIEQQpJDQEgBUUNAgsgAyABIAIgBUGMxsAAELUBIAMpAwAhByAAIAY2AgwgACAHNwIEIABBgYCAgHg2AgAMAwsgBq1CCn4iB0IgiKcNACAEIAenIgRqIgYgBEkNACAFQQFqIQUMAQsLIABBgICAgHg2AgALIANBEGokAAu1AQEBfyMAQTBrIgIkAAJAIAAoAgxBgICAgHhHBEAgAiAAQQxqNgIEIAJBAzYCHCACQbDKwAA2AhggAkICNwIkIAJBIDYCFCACQQQ2AgwgAiAANgIIIAIgAkEIajYCICACIAJBBGo2AhAMAQsgAkEBNgIcIAJB/NnAADYCGCACQgE3AiQgAkEENgIMIAIgADYCCCACIAJBCGo2AiALIAEoAgAgASgCBCACQRhqEKkCIAJBMGokAAupAQICfwF+IwBBEGsiBCQAIAACfwJAIAIgA2pBAWtBACACa3GtIAGtfiIGQiCIUARAIAanIgNBgICAgHggAmtNDQELIABBADYCBEEBDAELIANFBEAgACACNgIIIABBADYCBEEADAELIARBCGogAiADEPsBIAQoAggiBQRAIAAgBTYCCCAAIAE2AgRBAAwBCyAAIAM2AgggACACNgIEQQELNgIAIARBEGokAAvMAQEDfyMAQRBrIgIkACACIAA2AgQgASgCAEG3zMAAQQ0gASgCBCgCDBEBACEAIAJBADoADSACIAA6AAwgAiABNgIIIAJBCGpBxMzAAEEEIAJBBGpBIRBcIQAgAi0ADSIDIAItAAwiBHIhAQJAIARBAXEgA0EBR3INACAAKAIAIgAtAApBgAFxRQRAIAAoAgBBtdXAAEECIAAoAgQoAgwRAQAhAQwBCyAAKAIAQZbRwABBASAAKAIEKAIMEQEAIQELIAJBEGok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ACAGQSBqJAAPCxDoAgALIAYoAgwhCCABQcTHwAAQpAIAC5gBAQF/IwBBIGsiAyQAIANBDGogASACEDsCQAJAAkACQCADKAIMQYCAgIB4aw4CAQACCyAAIAMpAhA3AgQgAEGBgICAeDYCAAwCCyAAIAI2AgggACABNgIEIABBgYCAgHg2AgAMAQsgACADKQIMNwIAIABBEGogA0EcaigCADYCACAAQQhqIANBFGopAgA3AgALIANBIGokAAuAAQIBfgF/AkACQCABrSADrX4iBEIgiKcNACAEpyIBIAJBAWtqIgUgAUkNACAFQQAgAmtxIgEgA0EIamoiAyABSQ0BQYCAgIB4IAJrIANPBEAgACABNgIIIAAgAzYCBCAAIAI2AgAPCyAAQQA2AgAPCyAAQQA2AgAPCyAAQQA2AgALiQEBBH8jAEEgayICJAAgAkEYaiIEIAFBLGopAgA3AwAgAkEQaiIFIAFBJGopAgA3AwAgAiABKQIcNwMIQRgQwQIiA0EQaiAEKQMANwIAIANBCGogBSkDADcCACADIAIpAwg3AgAgAUEEahCSAiABEOcCIABBxLrAADYCBCAAIAM2AgAgAkEgaiQAC4MBAQN/An8CQCAAKAIAIgFFDQADQAJAIAAoAggiAyAAKAIETw0AIAEgA2otAABBxQBHDQAgACADQQFqNgIIDAILAkAgAkUNACAAKAIQIgFFDQAgAUHR1MAAQQIQNUUNAEEBDwtBASAAQQEQEw0CGiACQQFrIQIgACgCACIBDQALC0EACwuBAQECfyMAQSBrIgIkACACQQhqEI8CQTQQwQIiAUGsu8AANgIAIAEgAikCCDcCBCABQQxqIAJBEGopAgA3AgAgAUEUaiACQRhqKQIANwIAIAEgACkCADcCHCABQSRqIABBCGopAgA3AgAgAUEsaiAAQRBqKQIANwIAIAJBIGokACABC4cBAQN/IwBBEGsiAyQAAkACQCABKAIABEAgASgCBCICIAEoAgxGDQEgASACQQhqNgIEIAIoAgQhBCACKAIAIQIMAgsgASgCBCICRQ0AIANBCGogAiABKAIIIgQoAhgRAgAgASADKQMINwIEDAELQQAhAgsgACAENgIEIAAgAjYCACADQRBqJAALiQEBA38jAEEQayIDJAAgAyABNgIIIAMgASACajYCDAJAAkAgA0EIahDZASIEQYCAxABGDQAgBBCCAQ0AIARB/ABGIARBJmsiBUEVTUEAQQEgBXRBjYCAAXEbcg0AIAAgASACEMQCDAELIAAgAjYCCCAAIAE2AgQgAEGBgICAeDYCAAsgA0EQaiQAC3wBAX8jAEFAaiIFJAAgBSABNgIMIAUgADYCCCAFIAM2AhQgBSACNgIQIAVBAjYCHCAFQZDcwAA2AhggBUICNwIkIAUgBUEQaq1CgICAgOAAhDcDOCAFIAVBCGqtQoCAgIDwAIQ3AzAgBSAFQTBqNgIgIAVBGGogBBDtAQALfwEEfyMAQRBrIgUkACAFQQRqIARBAUEBEHwgBSgCCCEGIAUoAgRBAUcEQCAFKAIMIQcgBARAIAcgAyAE/AoAAAsgACACNgIQIAAgATYCDCAAIAQ2AgggACAHNgIEIAAgBjYCACAFQRBqJAAPCyAFKAIMIQggBkGYysAAEKQCAAt1AQJ/IAEgAqdxIQNBCCEEA38gACADaikAAEKAgYKEiJCgwIB/gyICUAR/IAMgBGogAXEhAyAEQQhqIQQMAQUgACACeqdBA3YgA2ogAXEiA2osAABBAE4EfyAAKQMAQoCBgoSIkKDAgH+DeqdBA3YFIAMLCwsLdQEBfyABKAIsIAEoAiRrQQR2QQAgASgCIBsgASgCHCABKAIUa0EEdkEAIAEoAhAbaiECAn8CQCABKAIARQ0AIAEoAgwgASgCBEYNACAAIAI2AgBBACECQQQMAQsgAEEBNgIEIAAgAjYCAEEICyAAaiACNgIAC3IBAn8jAEEQayIEJAAgASAAKAIIIgNrIQEgACgCBCADaiEDA0ACQCABBEAgBEEIaiACENUBIAQtAAgNAQsgBEEQaiQAIAFFDwsgAyAELQAJOgAAIAAgACgCCEEBajYCCCABQQFrIQEgA0EBaiEDDAALAAtiAQF/IwBBEGsiAyQAAn8gAkEHTQRAIABB/wFxIQADQEEAIAJFDQIaQQEgACABLQAARg0CGiACQQFrIQIgAUEBaiEBDAALAAsgA0EIaiAAIAEgAhBbIAMoAggLIANBEGokAAt3AQR/IwBBEGsiAiQAIAIgASgCADYCCCACIAEoAgQiAzYCACACIAM2AgQgACABKAIIIgEQ8QEgACgCCCEEIAFBBHQiBQRAIAAoAgQgBEEEdGogAyAF/AoAAAsgACABIARqNgIIIAIgAzYCDCACEMwBIAJBEGokAAt2AQV/AkAgACgCACIBQYCAgIB4RwRAIAFFDQEgACgCBCABEKkBDwsgAC0ABEEDRw0AIAAoAggiACgCACEBIABBBGooAgAiAygCACICBEAgASACEQQACyADKAIEIgIEQCADKAIIIQUgASACEKkBCyAAQQwQqQELC3YBBX8jAEEQayICJAAgASgCACEEIAEoAgQhBSACQQhqIAEQbQJAIAIoAghBAXFFBEBBgIDEACEDDAELIAIoAgwhAyABIAEoAgAgASgCCCIGIAVqIAQgASgCBGprajYCCAsgACADNgIEIAAgBjYCACACQRBqJAALfAEEfyMAQSBrIgUkACAFQQxqIAMgBBB+QYGAgIB4IQYgBSgCECEIIAACfyAFKAIMIgdBgYCAgHhGBEBBgICAgHgiByABIAIgBSgCGBB/DQEaCyAAIAQ2AgggACADNgIEIAchBkGBgICAeAs2AgAgBiAIELACIAVBIGokAAuIAQACQAJAAkAgASgCAEGAgICAeGsOAgABAgsgAEGBgICAeDYCACAAQQE6AARBgICAgHggASgCBBCvAg8LIABBgYCAgHg2AgAgAEEAOgAEQYGAgIB4IAEoAgQQsAIPCyAAIAEpAgA3AgAgAEEQaiABQRBqKAIANgIAIABBCGogAUEIaikCADcCAAteAQF/IwBBEGsiBCQAAn8gAEUEQEEAIQAgBEEMagwBCyAEIAI2AgwgACADbCEAIARBCGoLIAA2AgACQCAEKAIMIgBFDQAgBCgCCCICRQ0AIAEgAhCpAQsgBEEQaiQAC20BA38jAEEQayIDJAACQCAAIAEoAggiBCABKAIASQR/IANBCGogASAEQQFBARBrIAMoAggiBEGBgICAeEcNASABKAIIBSAECzYCBCAAIAEoAgQ2AgAgA0EQaiQADwsgAygCDCEFIAQgAhCkAgALaQEBfyMAQTBrIgMkACADIAE2AgQgAyAANgIAIANBAjYCDCADQeSiwAA2AgggA0ICNwIUIAMgA61CgICAgDCENwMoIAMgA0EEaq1CgICAgDCENwMgIAMgA0EgajYCECADQQhqIAIQ7QEAC3kCAn8BfiMAQRBrIgUkAEGAgICAeCEGIAAgAyAEIAEgAhD5AQR/IAVBCGogAyAEIAJBwLnAABC1ASAFKQMIIQcgBSADIAQgAkHQucAAELoBIAAgBSkDADcCDCAAIAc3AgRBgYCAgHgFQYCAgIB4CzYCACAFQRBqJAALYwEBfyMAQRBrIgAkAAJ/IAIoAgAEQEHM2sAAIQNBCQwBCyAAQQRqIAIoAgQgAigCCBAnQczawAAgACgCCCAAKAIEIgIbIQNBCSAAKAIMIAIbCyECIAMgAiABEDQgAEEQaiQAC2cBAn8jAEEQayIDJAAgAxDCAiIENgIMIAMgAjYCCCADIANBCGogARBpQQEhAgJAIAMoAgBBAXFFBEBBACECIAQhAQwBCyADKAIEIQEgBBC7AgsgACABNgIEIAAgAjYCACADQRBqJAALZAEDfyMAQRBrIgIkACAAIAEoAgQgASgCAGsQ9wEgACgCCCEDIAAoAgQhBANAIAJBCGogARDVASACLQAIBEAgAyAEaiACLQAJOgAAIANBAWohAwwBCwsgACADNgIIIAJBEGokAAtYAQJ/IwBBEGsiBCQAAn8gAEUEQEEAIQAgBEEMagwBCyAEIAI2AgwgACADbCEAIARBCGoLIAA2AgAgBCgCDCIABEAgBCgCCCEFIAEgBRChAgsgBEEQaiQAC10BAn8CQCAAQQRrKAIAIgJBeHEiA0EEQQggAkEDcSICGyABak8EQCACQQAgAyABQSdqSxsNASAAECgPC0HI18AAQS5B+NfAABDNAQALQYjYwABBLkG42MAAEM0BAAtjAQJ/IwBBEGsiAyQAIANBCGogAiABKAIAENsBQQEhAiADKAIMIQQgAygCCEEBcUUEQEHakcAAQQUQLCECIAEoAgQgAiAEEI4CQQAhAgsgACAENgIEIAAgAjYCACADQRBqJAALYgEFfyMAQRBrIgIkACABKAIgIQQQwgIhAyABKAIUIQUgASgCECEGIAJBCGogASgCGCABKAIcEKMCIAIoAgwhASADIAYgBRAsIAEQjgIgACADNgIEIAAgBDYCACACQRBqJAALUgECfyAAKAIIIQIgAAJ/QQEgAUGAAUkNABpBAiABQYAQSQ0AGkEDQQQgAUGAgARJGwsiAxD3ASABIAAoAgQgACgCCGoQeCAAIAIgA2o2AghBAAtXAQN/IAAoAgAiAwRAIAAoAgwgACgCBCIBa0EMbiECA0AgAgRAIAJBAWshAiABENYBIAFBDGohAQwBCwsgACgCCCADEN8CCyAAQRBqEMACIABBIGoQwAILVgEEfyAAKAIIIgIoAgAgACgCECIDIAAoAgwiBGoiBWsgAUkEQCACIAUgARBiCyABIARqIQEgAwRAIAIoAgQiAiABaiACIARqIAP8CgAACyAAIAE2AgwLUAECfyAAKAIIIQIgAAJ/QQEgAUGAAUkNABpBAiABQYAQSQ0AGkEDQQQgAUGAgARJGwsiAxD0ASABIAAoAgQgACgCCGoQeCAAIAIgA2o2AggLXQEBfyMAQRBrIgIkAAJ/IAAoAgAiACgCAEGAgICAeEcEQCACIAA2AgwgAUGEusAAQQQgAkEMakEPEGoMAQsgASgCAEGAusAAQQQgASgCBCgCDBEBAAsgAkEQaiQAC2UBAX8CQCAAQYQBTwRAIADQbyYBEG4gAEHY4cAAKAIAIgFJDQEgACABayIAQdDhwAAoAgBPDQFBzOHAACgCACAAQQJ0akHU4cAAKAIANgIAQdThwAAgADYCAEEAQQQQ4QILDwsAC1kBA38jAEEQayIDJAAgA0EIaiACQQFBAUGYysAAELQBIAMoAgghBSADKAIMIQQgAgRAIAQgASAC/AoAAAsgACACNgIIIAAgBDYCBCAAIAU2AgAgA0EQaiQAC1EAAkACQCABRQ0AAkAgASADTwRAIAEgA0cNAQwCCyABIAJqLAAAQb9/Sg0BC0EAIQIMAQsgASACaiECIAMgAWshAQsgACABNgIEIAAgAjYCAAtTAQJ/IwBBEGsiBSQAIAVBBGogASACIAMQfCAFKAIIIQEgBSgCBEEBRgRAIAUoAgwhBiABIAQQpAIACyAAIAUoAgw2AgQgACABNgIAIAVBEGokAAtQAQJ/IwBBEGsiBSQAIAVBCGogAyABIAIQswEgBSgCCCIGRQRAIAEgAiADIAIgBBC+AgALIAUoAgwhASAAIAY2AgAgACABNgIEIAVBEGokAAtYAQF/IAEoAgwhAgJAAkACQAJAIAEoAgQOAgABAgsgAg0BQQEhAUEAIQIMAgsgAg0AIAEoAgAiASgCBCECIAEoAgAhAQwBCyAAIAEQXw8LIAAgASACELIBC0kAAkACQCACIANNBEAgAiADRw0BDAILIAEgA2osAABBv39KDQELIAEgAiADIAIgBBC+AgALIAAgAiADazYCBCAAIAEgA2o2AgALQwEDfwJAIAJFDQADQCAALQAAIgQgAS0AACIFRgRAIABBAWohACABQQFqIQEgAkEBayICDQEMAgsLIAQgBWshAwsgAwtMAQF/An8CQCACKAIERQ0AIAIoAggiA0UNACACKAIAIANBASABEB0MAQsgARANCyECIAAgATYCCCAAIAJBASACGzYCBCAAIAJFNgIAC0gAAkAgA0UNAAJAIAIgA00EQCACIANHDQEMAgsgASADaiwAAEG/f0oNAQsgASACQQAgAyAEEL4CAAsgACADNgIEIAAgATYCAAtQAQF/AkAgAUHhAGsiAUH/AXFBGUsEQEEAIQEMAQsgAUECdEH8B3EiAkHc4MAAaigCACEBIAJB9N/AAGooAgAhAgsgACACNgIEIAAgATYCAAtNAQJ/IAAgACgCBCIDIAJrNgIEIAAgACgCACACIANLciIENgIAQQEhAyAEBH9BAQUgACgCCCIAKAIAIAEgAiAAQQRqKAIAKAIMEQEACwtHAQN/IAEgASACIAMQmAEiBWoiBC0AACEGIAQgA6dBGXYiBDoAACABIAIgBUEIa3FqQQhqIAQ6AAAgACAGOgAEIAAgBTYCAAtHAQF/IAAoAgAgACgCCCIDayACSQRAIAAgAyACEHEgACgCCCEDCyACBEAgACgCBCADaiABIAL8CgAACyAAIAIgA2o2AghBAAtQAQF/IwBBEGsiAiQAIAJBCGogASABKAIAKAIEEQIAIAIgAigCCCACKAIMKAIYEQIAIAIoAgQhASAAIAIoAgA2AgAgACABNgIEIAJBEGokAAtNAQF/AkACQAJAQQEgACgCAEEFayIBIAFBA08bDgIBAgALIAAoAgQiABDAASAAQTRqEMABIABB7AAQqQEPCyAAQQRqEJsCDwsgABDqAQuGAQEDfyAAKAIIIgQgACgCAEYEQCMAQRBrIgMkACADQQhqIAAgACgCAEEBQQRBEBBVIAMoAggiBUGBgICAeEcEQCADKAIMGiAFIAIQpAIACyADQRBqJAALIAAgBEEBajYCCCAAKAIEIARBBHRqIgAgASkCADcCACAAQQhqIAFBCGopAgA3AgALRwEBfyAAKAIAIAAoAggiA2sgAkkEQCAAIAMgAhByIAAoAgghAwsgAgRAIAAoAgQgA2ogASAC/AoAAAsgACACIANqNgIIQQALOQAgASACEHggAAJ/QQEgAUGAAUkNABpBAiABQYAQSQ0AGkED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IAVBCGogAyAEEKMCIAUoAgwhAyAAIAEgAhAsIAMQjgIgBUEQaiQACzcBAX8jAEEQayIDJAAgA0EIaiABIAIQogIgAygCDCEBIABBxMzAAEEEECwgARCOAiADQRBqJAALPAECfyABKAIEIQIgASgCACEDQQgQDSIBRQRAAAsgASACNgIEIAEgAzYCACAAQbjbwAA2AgQgACABNgIACzcBAX8jAEEgayIBJAAgAUEANgIYIAFBATYCDCABQcyUwAA2AgggAUIENwIQIAFBCGogABDtAQALPAEBf0EBIQICQCAAKAIAIAEQVw0AIAEoAgBB7aHAAEECIAEoAgQoAgwRAQANACAAKAIEIAEQVyECCyACCy0AAkAgA2lBAUcgAUGAgICAeCADa0tyDQAgACABIAMgAhAdIgBFDQAgAA8LAAsuAQF/IwBBEGsiASQAIAFBCGpBBCAAEJECIAEoAggiAEUEQAALIAFBEGokACAACy8BAX8gACgCCCEBIAAoAgQhAANAIAEEQCABQQFrIQEgABDAASAAQThqIQAMAQsLCy0BAX8jAEEQayICJAAgAiAANgIMIAFBh8zAAEEFIAJBDGpBCBBqIAJBEGokAAstACAAKAIAQQRHBEAgABCBAg8LIAAoAgQiABCBAiAAQTBqEOoBIABB5AAQqQELMAAgACgCAEGAgICAeEcEQCAAEM8BIABBDGoQ0AEPCyAAKAIEIgAQugIgAEEMEKkBCzcCAX4BfyABKQIcIQJBCBDnASIDIAI3AgAgAUEEahCSAiABEOICIABB2JjAADYCBCAAIAM2AgAL+gECAn8BfiMAQRBrIgIkACACQQE7AQwgAiABNgIIIAIgADYCBCMAQRBrIgEkACACQQRqIgApAgAhBCABIAA2AgwgASAENwIEIwBBEGsiACQAIAFBBGoiASgCACICKAIMIQMCQAJAAkACQCACKAIEDgIAAQILIAMNAUEBIQJBACEDDAILIAMNACACKAIAIgIoAgQhAyACKAIAIQIMAQsgAEGAgICAeDYCACAAIAE2AgwgAEHk28AAIAEoAgQgASgCCCIALQAIIAAtAAkQdwALIAAgAzYCBCAAIAI2AgAgAEHI28AAIAEoAgQgASgCCCIALQAIIAAtAAkQdwALMwAgASgCACAAKAIALQAAQQJ0IgBB4N/AAGooAgAgAEHM38AAaigCACABKAIEKAIMEQEAC6wIAgh/AX4jAEEQayIEJAAjAEGQAWsiAiQAIAJBIGogACABEMsBIAIoAiQhByACKAIgIQgCQAJAAkACQAJAAkACQAJAIAICfwJAAkACQAJAAkACQAJAQfjhwAAtAABBAWsOAwQDAQALQfjhwABBAjoAAEGE4sAAKAIAQf////8HcQRAQczlwAAoAgANAgtB/OHAACgCAA0LQfjhwABBAzoAAEGA4sAAQQE2AgALIAJBGGogCCAHEEkgAkEwaiACKAIYIgAgAigCHCIBECkgAigCMEEBRw0DIAIoAjRBgICAgHhGDQQgAkHwAGogAkE0aiIDQRBqKAIANgIAIAJB6ABqIANBCGopAgA3AwAgAiADKQIANwNgIAJB+ABqIgMgACABIAJB4ABqED4gAxCTAQwFCyACQQA2AogBIAJBATYCfCACQYzbwAA2AnggAkIENwKAASACQfgAakGU28AAEO0BAAsgAkEANgKIASACQQE2AnwgAkHw3cAANgJ4DAoLIAJBADYCiAEgAkEBNgJ8IAJBsN3AADYCeAwJCyACKAJEIAJBEGogAigCNCIGIAIoAjgiCRBJIAJBPGohAyACKAIUBEAgAkHIAGoiBSAGIAkQxAIgAkH4AGoiBiAAIAEgBRA+IAIgBhCTASIANgJMIAJBgICAgHg2AkggAxC6AgwECw0CIAJB+ABqEI8CQSQQ5wEiAEGsmMAANgIAIABBDjYCICAAQdy7wAA2AhwgACACKQJ4NwIEIABBDGogAkGAAWopAgA3AgAgAEEUaiACQYgBaikCADcCACACIAA2AkwgAkGAgICAeDYCSCADELoCDAMLIAJByABqIgMgACABEMQCIAJB+ABqIgUgACABIAMQPiAFEJMBCyIANgJMIAJBgICAgHg2AkgMAQsgAkHQAGogA0EIaigCADYCACACIAMpAgAiCjcDSCAKp0GAgICAeEcNASACKAJMIQALIAIgADYCLCACQQI2AmQgAiACQSxqNgJgIAJCATcChAFBASEBIAJBATYCfCACQfzZwAA2AnggAiACQeAAajYCgAEgAkEwaiACQfgAahBfIAIgAigCNCIDIAIoAjgQowIgAigCBCEAIAIoAjAgAxDVAiACKAIsIgMgAygCACgCABEEAAwBCyACKAJMIQMgAigCSEEAIQEgAkEANgJ4IAJBCGogAkHIAGoiBiACQfgAahCmASACKAIMIQAgAigCCEEBcQ0CIAYQ6AEgAxDWAgsgByAIENUCIAQgATYCCCAEIABBACABGzYCBCAEQQAgACABGzYCACACQZABaiQADAMLAAsgAiAANgJ4QdzLwABBKyACQfgAakGAlMAAQZCUwAAQlgEACyACQgQ3AoABIAJB+ABqQfCTwAAQ7QEACyAEKAIAIAQoAgQgBCgCCCAEQRBqJAALLQEBfyAAIAMoAgQiBCADKAIIELIBIAAgAjYCECAAIAE2AgwgAygCACAEEPECCyQBAX8gACgCACAAKAIIIgJrIAFJBEAgACACIAFBBEEQEMoBCwsjACAAKAIIQQhHBEAgAEEIahDAAQ8LIAAoAgwgACgCEBCvAgsjACAAKAIIQQVHBEAgAEEIahDqAQ8LIAAoAgwgACgCEBCvAgskAQF/IAAoAgAgACgCCCICayABSQRAIAAgAiABQQFBARDKAQsLLAEBfyAAKAIAIAAoAgQQ8QIgACgCDCIBQYCAgIB4RwRAIAEgACgCEBDxAgsLKAACQAJAAkAgACgCAA4EAQEBAgALIABBBGoQ1gELDwsgAEEEahC6AgsfAQF/IAAoAgAgACgCCCICayABSQRAIAAgAiABEGILCxkBAX8gASADRgR/IAAgAiABELgBBUEBC0ULGQEBfyABIANPBH8gAiAAIAMQuAEFQQELRQshACAAKAIARQRAIABBDGoQ1gEPCyAAKAIEIAAoAggQrwILHgAgAgRAIAIgARCHAiEBCyAAIAI2AgQgACABNgIACyUAIAAoAgAtAABFBEAgAUGo1cAAQQUQNQ8LIAFBrdXAAEEEEDULJgECfyAAKAIAIgFBgICAgHhyQYCAgIB4RwRAIAAoAgQgARCpAQsLKQAgAEEcakEAIAJC7bqtts2F1PXjAFEbQQAgAUL4gpm9le7Gxbl/URsLKAAgAEEcakEAIAJCw7Hp87nrq4VJURtBACABQs6yju3ahMXGgH9RGwseACAARQRAEOgCAAsgACACIAMgBCAFIAEoAhARCQALGgAgAEEYahDrASAAKAIAQQNHBEAgABCTAgsLHAAgAEUEQBDoAgALIAAgAiADIAQgASgCEBEGAAscACAARQRAEOgCAAsgACACIAMgBCABKAIQER8ACxwAIABFBEAQ6AIACyAAIAIgAyAEIAEoAhARIQALHAAgAEUEQBDoAgALIAAgAiADIAQgASgCEBEjAAscACAARQRAEOgCAAsgACACIAMgBCABKAIQEQgACxUAIAFBCU8EQCABIAAQQw8LIAAQDQsZACAAIAEgAhAsQYIBQYMBIANBAXEbEI4CCxgBAn8gACgCACIBBEAgACgCBCABEKkBCwsZACAAQQxqIAEgAiADIAQQlwEgAEEINgIICxkAIABBDGogASACIAMgBBCXASAAQQU2AggLGQAgAEEEaiABIAIgAyAEEJcBIABBATYCAAsaACAARQRAEOgCAAsgACACIAMgASgCEBEDAAscAQFvIAAlASABJQEgARCxASACJQEgAhCxARAECx8AQfnhwAAtAABFBEBB+eHAAEEBOgAACyAAQQE2AgALIAEBbyADuBAFIQQQQCIDIAQmASAAIAEgAhAsIAMQjgILGQAgAiABEIcCIQEgACACNgIEIAAgATYCAAu/AgELfyAAKAIAQQJGBEAjAEEgayIBJAACQAJAAkAgAEEEaiIELQAQQQFrDgICAAELIAFBADYCGCABQQE2AgwgAUGUmMAANgIIIAFCBDcCECABQQhqQZyYwAAQ7QEACyAEKAIIIQkgBCgCBCEGA0AgAiAJRwRAIAYgAkEMbGoiB0EEaiIKKAIAQSRqIQAgB0EIaigCACEFA0AgBQRAIABBBGsoAgAiA0GAgICAeEcEQCADIAAoAgAQ1QILAkAgAEEUaygCACILQQJGDQAgAEEMaygCACEDIABBEGsoAgAhCCALRQRAIAggAxDVAgwBCyAIIANBAkECEKEBCyAFQQFrIQUgAEEsaiEADAELCyAHKAIAIAooAgBBBEEsEKEBIAJBAWohAgwBCwsgBCgCACAGQQRBDBChAQsgAUEgaiQACwsZACAAKAIIQYCAgIB4RwRAIABBCGoQ1gELCxwAIAAoAgAgACgCBBDxAiAAKAIMIAAoAhAQ8QILFwAgAEEEaiABIAIgAxDwASAAQQE2AgALFQAgACgCBEEFRwRAIABBBGoQ9gELCxgAIABFBEAQ6AIACyAAIAIgASgCEBEAAAscACABKAIAIAAoAgAgACgCBCABKAIEKAIMEQEACxIAIAAEQCABIABBBEEIEKEBCwsYACAAKAIAIAAoAgQgASgCACABKAIEEB4LFwAgACgC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ASACQfnGwABBFRCXAQsQACABIAAoAgQgACgCCBA1CyEAIABCrtLN0dXXqoKsfzcDCCAAQruoz4Xnl53TejcDAAshACAAQuGaz8fBkZnNmn83AwggAEK40rvBqba70Rw3AwALDwAgAEEEahCSAiAAEOICCxMAIABBlJnAADYCBCAAIAE2AgALEAAgASAAKAIAIAAoAgQQNQsTACAAQSg2AgQgAEH0uMAANgIACw4AIAAgASABIAJqEN4BCxAAIAEoAgAgASgCBCAAEC8LDgAgACABIAEgAmoQ3QELIQAgAELDsenzueurhUk3AwggAELOso7t2oTFxoB/NwMACyEAIABClK+W1LzQ5KKyfzcDCCAAQtegtZr5xPeZGzcDAAsTACAAQYC7wAA2AgQgACABNgIACyIAIABC7bqtts2F1PXjADcDCCAAQviCmb2V7sbFuX83AwALEwAgAEG428AANgIEIAAgATYCAAsgACAAQt+enZict5a4AjcDCCAAQqHtrIz59Jy4BzcDAAsNACAAIAFBAUEBEKEBCw0AIAAgAUEEQTgQoQELDQAgACABQQFBARCoAQsQACAAIAEgAkHotsAAEPYCCw8AIAAoAgAgACgCBBDVAgsQACAAIAEgAkHItsAAEPYCCw0AIAAgASACEMwCQQALDwAgACgCACAAKAIEENcCCxAAIAAgASACQZy3wAAQ9gILDwBBh6LAAEErIAAQzQEACw0AIAAgAUEEQQwQoQELDQAgACABQQRBEBChAQsNACAAIAFBBEEEEKgBCwkAIABBJBCpAQsKACAAQQRqEJICCw0AIAFB76HAAEEYEDULDAAgACgCACABEJwCCwwAIAAQswIgABDnAgsJACAAQTQQqQELDABB1MfAAEEyEAoACwwAIAAoAgAgARDFAgsNACABQfjKwABBAhA1CwwAIAAgASkCADcDAAsKACAAKAIAELsCCwkAIABBADYCAAsJACAAIAEQmgILCQAgACABEMoCC5IuAhx/AX4CfyMAQeABayICJAAgAkEgaiAAIAAoAgAoAgQRAgAgAiACKAIkIgc2AiwgAiACKAIgIgQ2AigCQAJAAkACQAJAAkACQCABIg0tAApBgAFxRQRAQQEhAyACQQE2ApQBIAJB/NnAADYCkAEgAkIBNwKcASACQQU2AmwgAiACQegAajYCmAEgAiAC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LjEwMlxzcmNcZm10LnJzAGxpYnJhcnkvYWxsb2Mvc3JjL2ZtdC5ycwBWOlwuY2FjaGVcY2FyZ29ccmVnaXN0cnlcc3JjXGluZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmXHdhc20tYmluZGdlbi0wLjIuMTAwXHNyY1xjb252ZXJ0XHNsaWNlcy5ycwBsaWJyYXJ5L3N0ZC9zcmMvc3lzL3N5bmMvbXV0ZXgvbm9fdGhyZWFkcy5ycwB+XC5ydXN0dXBcdG9vbGNoYWluc1xzdGFibGUteDg2XzY0LXBjLXdpbmRvd3MtbXN2Y1xsaWIvcnVzdGxpYi9zcmMvcnVzdFxsaWJyYXJ5L3N0ZC9zcmMvc3lzL3N5bmMvb25jZS9ub190aHJlYWRzLnJzAH5cLnJ1c3R1cFx0b29sY2hhaW5zXHN0YWJsZS14ODZfNjQtcGMtd2luZG93cy1tc3ZjXGxpYi9ydXN0bGliL3NyYy9ydXN0XGxpYnJhcnkvY29yZS9zcmMvaXRlci90cmFpdHMvaXRlcmF0b3IucnMAVjpcLmNhY2hlXGNhcmdvXHJlZ2lzdHJ5XHNyY1xpbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3Zlxhbnlob3ctMS4wLjEwMlxzcmNcZXJyb3IucnMAVjpcLmNhY2hlXGNhcmdvXGdpdFxjaGVja291dHNcZGVub190YXNrX3NoZWxsLWYyYjQyZDkxN2EwMzVjOWFcNjJkYTI5MlxzcmNccGFyc2VyLnJzAH5cLnJ1c3R1cFx0b29sY2hhaW5zXHN0YWJsZS14ODZfNjQtcGMtd2luZG93cy1tc3ZjXGxpYi9ydXN0bGliL3NyYy9ydXN0XGxpYnJhcnkvY29yZS9zcmMvc3RyL3BhdHRlcm4ucnMAL3J1c3RjLzI5NDgzODgzZWVkNjlkNWZiNGRiMDE5NjRjZGYyYWY0ZDg2ZTljYjIvbGlicmFyeS9jb3JlL3NyYy9zdHIvcGF0dGVybi5ycwAvcnVzdGMvMjk0ODM4ODNlZWQ2OWQ1ZmI0ZGIwMTk2NGNkZjJhZjRkODZlOWNiMi9saWJyYXJ5L2NvcmUvc3JjL29wcy9mdW5jdGlvbi5ycwBsaWJyYXJ5L3N0ZC9zcmMvc3luYy9sYXp5X2xvY2sucnMAflwucnVzdHVwXHRvb2xjaGFpbnNcc3RhYmxlLXg4Nl82NC1wYy13aW5kb3dzLW1zdmNcbGliL3J1c3RsaWIvc3JjL3J1c3RcbGlicmFyeS9hbGxvYy9zcmMvc3RyaW5nLnJzAGxpYnJhcnkvc3RkL3NyYy9wYW5pY2tpbmcucnMAbGlicmFyeS9jb3JlL3NyYy91bmljb2RlL3ByaW50YWJsZS5ycwB+XC5ydXN0dXBcdG9vbGNoYWluc1xzdGFibGUteDg2XzY0LXBjLXdpbmRvd3MtbXN2Y1xsaWIvcnVzdGxpYi9zcmMvcnVzdFxsaWJyYXJ5L2FsbG9jL3NyYy9zbGljZS5ycwBsaWJyYXJ5L3N0ZC9zcmMvYmFja3RyYWNlLnJzAC9ydXN0L2RlcHMvaGFzaGJyb3duLTAuMTUuNC9zcmMvcmF3L21vZC5ycwBsaWJyYXJ5L2NvcmUvc3JjL2ZtdC9tb2QucnMAbGlicmFyeS9jb3JlL3NyYy9zdHIvbW9kLnJzAGxpYnJhcnkvc3RkL3NyYy8uLi8uLi9iYWNrdHJhY2Uvc3JjL3N5bWJvbGl6ZS9tb2QucnMAflwucnVzdHVwXHRvb2xjaGFpbnNcc3RhYmxlLXg4Nl82NC1wYy13aW5kb3dzLW1zdmNcbGliL3J1c3RsaWIvc3JjL3J1c3RcbGlicmFyeS9hbGxvYy9zcmMvcmF3X3ZlYy9tb2QucnMAL3J1c3RjLzI5NDgzODgzZWVkNjlkNWZiNGRiMDE5NjRjZGYyYWY0ZDg2ZTljYjIvbGlicmFyeS9hbGxvYy9zcmMvcmF3X3ZlYy9tb2QucnMAL3J1c3QvZGVwcy9kbG1hbGxvYy0wLjIuOS9zcmMvZGxtYWxsb2MucnMAc3JjXHJzX2xpYlxzcmNcbGliLnJzAFY6XC5jYWNoZVxjYXJnb1xyZWdpc3RyeVxzcmNcaW5kZXguY3JhdGVzLmlvLTE5NDljZjhjNmI1YjU1N2ZcY29uc29sZV9lcnJvcl9wYW5pY19ob29rLTAuMS43XHNyY1xsaWIucnMAVjpcLmNhY2hlXGNhcmdvXHJlZ2lzdHJ5XHNyY1xpbmRleC5jcmF0ZXMuaW8tMTk0OWNmOGM2YjViNTU3ZlxzZXJkZS13YXNtLWJpbmRnZW4tMC42LjVcc3JjXGxpYi5ycwBWOlwuY2FjaGVcY2FyZ29ccmVnaXN0cnlcc3JjXGluZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmXG9uY2VfY2VsbC0xLjIxLjRcc3JjXGxpYi5ycwBWOlwuY2FjaGVcY2FyZ29ccmVnaXN0cnlcc3JjXGluZGV4LmNyYXRlcy5pby0xOTQ5Y2Y4YzZiNWI1NTdmXG1vbmNoLTAuNS4wXHNyY1xsaWIucnMAL3J1c3QvZGVwcy9ydXN0Yy1kZW1hbmdsZS0wLjEuMjUvc3JjL2xpYi5ycwAvcnVzdC9kZXBzL3J1c3RjLWRlbWFuZ2xlLTAuMS4yNS9zcmMvdjAucnMAAAAuBxAAYgAAADUAAAAOAAAAaXNBc3luY2VuZHNMaW5lc2VxdWVuY2VhbmRvcnN0ZG91dHN0ZG91dFN0ZGVycm5hbWV2YWx1ZXdvcmRmZENvbW1hbmRpbm5lcnJlZGlyZWN0UGlwZWxpbmVuZWdhdGVkbWF5YmVGZG9waW9GaWxlU2VxdWVuY2VTaGVsbFZhcnNoZWxsVmFycGlwZWxpbmVCb29sZWFuTGlzdGJvb2xlYW5MaXN0dGV4dHZhcmlhYmxldGlsZGVjb21tYW5kcXVvdGVkaW5wdXRvdXRwdXRjdXJyZW50bmV4dENvbW1hbmRJbm5lclNpbXBsZXNpbXBsZVN1YnNoZWxsc3Vic2hlbGxQaXBlU2VxdWVuY2VQaXBlbGluZUlubmVycGlwZVNlcXVlbmNlZW52VmFyc2FyZ3NpdGVtc292ZXJ3cml0ZWFwcGVuZAAAAMYGEABoAAAAlQAAAA4AAAAlAAAABAAAAAQAAAAmAAAAsAYQABYAAAAIAAAAOAAAACcAAAAMAAAABAAAACgAAAApAAAAKgAAAGNhcGFjaXR5IG92ZXJmbG93AAAAOAoQABEAAABlBhAAIQAAAC4CAAARAAAAVQQQABwAAADoAQAAFwBB/JTAAAvFAQEAAAArAAAAYSBmb3JtYXR0aW5nIHRyYWl0IGltcGxlbWVudGF0aW9uIHJldHVybmVkIGFuIGVycm9yIHdoZW4gdGhlIHVuZGVybHlpbmcgc3RyZWFtIGRpZCBub3QAAJ8AEAAZAAAAigIAAA4AAAApIHNob3VsZCBiZSA8IGxlbiAoaXMgcmVtb3ZhbCBpbmRleCAoaXMgAgsQABIAAADs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AFUAAACeAAAAHwAAAE5vbmVTb21lUGFyc2VFcnJvckZhaWx1cmVFcnJvcm1lc3NhZ2Vjb2RlX3NuaXBwZXQAAABQAAAAGAAAAAQAAABRAAAAUAAAABgAAAAEAAAAUgAAAFEAAAA0HRAAPQAAAFMAAAA/AAAAPQAAAEAAAABUAAAANAAAAAQAAABCAAAAVAAAADQAAAAEAAAAQwAAAEIAAABwHRAARAAAAFUAAABGAAAARwAAAEgAAABWAAAAVwAAAFgAAABZAAAAWgAAAFsAAAA6AAAA4gIQAGgAAABmBAAAJAAAACYmfHxFbXB0eSBjb21tYW5kLiAobGluZSAAAAABAAAAAAAAAOodEAAHAAAAqC8QAAEAAACNAhAAVQAAAHYBAAALAAAAjQIQAFUAAACKAQAACwAAAHwmDQpFeHBlY3RlZCBjb21tYW5kIGZvbGxvd2luZyBib29sZWFuIG9wZXJhdG9yLo0CEABVAAAA2gEAADkAAABDYW5ub3Qgc2V0IG11bHRpcGxlIGVudmlyb25tZW50IHZhcmlhYmxlcyB3aGVuIHRoZXJlIGlzIG5vIGZvbGxvd2luZyBjb21tYW5kLkV4cGVjdGVkIGNvbW1hbmQgZm9sbG93aW5nIHBpcGVsaW5lIG9wZXJhdG9yLlJlZGlyZWN0cyBpbiBwaXBlIHNlcXVlbmNlIGNvbW1hbmRzIGFyZSBjdXJyZW50bHkgbm90IHN1cHBvcnRlZC5NdWx0aXBsZSByZWRpcmVjdHMgYXJlIGN1cnJlbnRseSBub3Qgc3VwcG9ydGVkLj4+PnxJbnZhbGlkIGVudmlyb25tZW50IHZhcmlhYmxlIHZhbHVlLlVuc3VwcG9ydGVkIHJlc2VydmVkIHdvcmQuRXhwZWN0ZWQgY2xvc2luZyBzaW5nbGUgcXVvdGUujQIQAFUAAAAZAwAAJAAAAI0CEABVAAAAGwMAACAAAABGYWlsZWQgcGFyc2luZyBjb21tYW5kIHN1YnN0aXR1dGlvbiBpbiBkb3VibGUgcXVvdGVkIHN0cmluZy6NAhAAVQAAACADAAAXAAAAjQIQAFUAAAAlAwAAJAAAAI0CEABVAAAAJwMAACAAAABGYWlsZWQgcGFyc2luZyBiYWNrdGlja3MgaW4gZG91YmxlIHF1b3RlZCBzdHJpbmcuAAAAjQIQAFUAAAAsAwAAFwAAAI0CEABVAAAAMQMAACEAAACNAhAAVQAAADQDAAARAAAARXhwZWN0ZWQgY2xvc2luZyBkb3VibGUgcXVvdGUuRmFpbGVkIHBhcnNpbmcgd2l0aGluIGRvdWJsZSBxdW90ZXMuIFVuZXhwZWN0ZWQgY2hhcmFjdGVyOiAAAADCIBAAOwAAAENvdWxkIG5vdCBkZXRlcm1pbmUgZXhwcmVzc2lvbi5GYWlsZWQgcGFyc2luZyB3aXRoaW4gZG91YmxlIHF1b3Rlcy4gJyEQACUAAAAkIyokIGlzIGN1cnJlbnRseSBub3Qgc3VwcG9ydGVkLlchEAABAAAAWCEQABwAAACNAhAAVQAAAIsDAAAOAAAAXA0KXAokPwCNAhAAVQAAANoDAAASAAAAjQIQAFUAAADNAwAAFgAAAFVuc3VwcG9ydGVkIHRpbGRlIGV4cGFuc2lvbi6NAhAAVQAAANgDAAArAAAAfigpe308PnwmOyInJChFeHBlY3RlZCBjbG9zaW5nIHBhcmVudGhlc2lzIGZvciBjb21tYW5kIHN1YnN0aXR1dGlvbi5FeHBlY3RlZCBjbG9zaW5nIGJhY2t0aWNrLgAAjQIQAFUAAAD7AwAAIQAAAFxgYEZhaWxlZCBwYXJzaW5nIHdpdGhpbiBiYWNrdGlja3MuIFVuZXhwZWN0ZWQgY2hhcmFjdGVyOiAAAFsiEAA3AAAAjQIQAFUAAAAdBAAAGgAAAGJhY2t0aWNrc0ZhaWxlZCBwYXJzaW5nIHdpdGhpbiAuIAAAALUiEAAWAAAAyyIQAAIAAABFeHBlY3RlZCBjbG9zaW5nIHBhcmVudGhlc2lzIG9uIHN1YnNoZWxsLgAAAI0CEABVAAAASgQAAA0AAACNAhAAVQAAAGoEAAAaAAAAjQIQAFUAAABrBAAAJgAAAI0CEABVAAAAdQQAAA0AAABpZnRoZW5lbHNlZWxpZmZpZG9kb25lY2FzZWVzYWN3aGlsZXVudGlsZm9yaW5VbmV4cGVjdGVkIGNoYXJhY3Rlci5IYXNoIHRhYmxlIGNhcGFjaXR5IG92ZXJmbG93AACOIxAAHAAAADQFEAArAAAAJQAAACgAAAC4ABAAaQAAACQBAAAOAAAAY2xvc3VyZSBpbnZva2VkIHJlY3Vyc2l2ZWx5IG9yIGFmdGVyIGJl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");
var wasmModule2 = new WebAssembly.Module(bytes2);
var wasm4 = new WebAssembly.Instance(wasmModule2, {
  "./rs_lib.internal.js": rs_lib_internal_exports2
});
__wbg_set_wasm2(wasm4.exports);
wasm4.exports.__wbindgen_start();
function base64decode2(b64) {
  const binString = atob(b64);
  const size = binString.length;
  const bytes3 = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes3[i] = binString.charCodeAt(i);
  }
  return bytes3;
}
var cachedStdinReadable;
function getStdinReadable() {
  if (cachedStdinReadable !== void 0)
    return cachedStdinReadable;
  const abortController = new AbortController();
  return cachedStdinReadable = new import_web2.ReadableStream({
    async pull(controller) {
      const buf = new Uint8Array(16 * 1024);
      let bytesRead;
      try {
        bytesRead = await readStdin(buf, abortController.signal);
      } catch (err) {
        if (abortController.signal.aborted)
          return;
        throw err;
      }
      if (bytesRead === null)
        controller.close();
      else
        controller.enqueue(buf.subarray(0, bytesRead));
    },
    cancel() {
      abortController.abort();
      cachedStdinReadable = void 0;
    }
  });
}
var stdin = {
  read(p, options) {
    const signal = options?.signal;
    signal?.throwIfAborted();
    return readStdin(p, signal);
  },
  // todo: remove this as it's unused
  get readable() {
    return getStdinReadable();
  },
  setRaw(mode) {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(mode);
    }
  },
  isTerminal() {
    return process.stdin.isTTY ?? false;
  }
};
var stdout = {
  writeSync(p) {
    return writeSyncAll(1, p);
  },
  isTerminal() {
    return process.stdout.isTTY ?? false;
  }
};
function readStdin(p, signal) {
  const stream = process.stdin;
  return new Promise((resolve8, reject) => {
    const onReadable = () => {
      const chunk = stream.read();
      if (chunk === null)
        return;
      cleanup();
      const len = Math.min(chunk.length, p.length);
      p.set(chunk.subarray(0, len));
      if (chunk.length > len)
        stream.unshift(chunk.subarray(len));
      resolve8(len);
    };
    const onEnd = () => {
      cleanup();
      resolve8(null);
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    const cleanup = () => {
      stream.off("readable", onReadable);
      stream.off("end", onEnd);
      stream.off("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    stream.on("readable", onReadable);
    stream.on("end", onEnd);
    stream.on("error", onError);
    signal?.addEventListener("abort", onAbort, { once: true });
    onReadable();
  });
}
var stderr = {
  writeSync(p) {
    return writeSyncAll(2, p);
  },
  isTerminal() {
    return process.stderr.isTTY ?? false;
  }
};
var ShellEvaluateError = class extends Error {
};
var RealEnv = class {
  setCwd(cwd2) {
    process.chdir(cwd2);
  }
  getCwd() {
    return process.cwd();
  }
  setEnvVar(key, value) {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  getEnvVar(key) {
    return process.env[key];
  }
  getEnvVars() {
    return getRealEnvVars();
  }
  clone() {
    return cloneEnv(this);
  }
};
var ShellEnv = class {
  #cwd;
  #envVars = {};
  setCwd(cwd2) {
    this.#cwd = cwd2;
  }
  getCwd() {
    if (this.#cwd == null) {
      throw new Error("The cwd must be initialized.");
    }
    return this.#cwd;
  }
  setEnvVar(key, value) {
    if (isWindows3) {
      key = key.toUpperCase();
    }
    if (value == null) {
      delete this.#envVars[key];
    } else {
      this.#envVars[key] = value;
    }
  }
  getEnvVar(key) {
    if (isWindows3) {
      key = key.toUpperCase();
    }
    return this.#envVars[key];
  }
  getEnvVars() {
    return { ...this.#envVars };
  }
  clone() {
    return cloneEnv(this);
  }
};
var RealEnvWriteOnly = class {
  real = new RealEnv();
  shell = new ShellEnv();
  setCwd(cwd2) {
    this.real.setCwd(cwd2);
    this.shell.setCwd(cwd2);
  }
  getCwd() {
    return this.shell.getCwd();
  }
  setEnvVar(key, value) {
    this.real.setEnvVar(key, value);
    this.shell.setEnvVar(key, value);
  }
  getEnvVar(key) {
    return this.shell.getEnvVar(key);
  }
  getEnvVars() {
    return this.shell.getEnvVars();
  }
  clone() {
    return cloneEnv(this);
  }
};
function initializeEnv(env, opts) {
  env.setCwd(opts.cwd);
  for (const [key, value] of Object.entries(opts.env)) {
    env.setEnvVar(key, value);
  }
}
function cloneEnv(env) {
  const result = new ShellEnv();
  initializeEnv(result, {
    cwd: env.getCwd(),
    env: env.getEnvVars()
  });
  return result;
}
var StreamFds = class {
  #readers = /* @__PURE__ */ new Map();
  #writers = /* @__PURE__ */ new Map();
  insertReader(fd, stream) {
    this.#readers.set(fd, stream);
  }
  insertWriter(fd, stream) {
    this.#writers.set(fd, stream);
  }
  getReader(fd) {
    return this.#readers.get(fd)?.();
  }
  getWriter(fd) {
    return this.#writers.get(fd)?.();
  }
};
var Context = class _Context {
  stdin;
  stdout;
  stderr;
  #env;
  #shellVars;
  #shellOptions;
  #static;
  constructor(opts) {
    this.stdin = opts.stdin;
    this.stdout = opts.stdout;
    this.stderr = opts.stderr;
    this.#env = opts.env;
    this.#shellVars = opts.shellVars;
    this.#shellOptions = opts.shellOptions;
    this.#static = opts.static;
  }
  get signal() {
    return this.#static.signal;
  }
  applyChanges(changes) {
    if (changes == null) {
      return;
    }
    for (const change of changes) {
      switch (change.kind) {
        case "cd":
          this.#env.setCwd(change.dir);
          break;
        case "envvar":
          this.setEnvVar(change.name, change.value);
          break;
        case "shellvar":
          this.setShellVar(change.name, change.value);
          break;
        case "unsetvar":
          this.setShellVar(change.name, void 0);
          this.setEnvVar(change.name, void 0);
          break;
        case "setoption":
          this.setShellOption(change.option, change.value);
          break;
        default: {
          const _assertNever = change;
          throw new Error(`Not implemented env change: ${change}`);
        }
      }
    }
  }
  setEnvVar(key, value) {
    if (isWindows3) {
      key = key.toUpperCase();
    }
    if (key === "PWD") {
      if (value != null && path4.isAbsolute(value)) {
        this.#env.setCwd(path4.resolve(value));
      }
    } else {
      delete this.#shellVars[key];
      this.#env.setEnvVar(key, value);
    }
  }
  setShellVar(key, value) {
    if (isWindows3) {
      key = key.toUpperCase();
    }
    if (this.#env.getEnvVar(key) != null || key === "PWD") {
      this.setEnvVar(key, value);
    } else if (value == null) {
      delete this.#shellVars[key];
    } else {
      this.#shellVars[key] = value;
    }
  }
  getEnvVars() {
    return this.#env.getEnvVars();
  }
  getCwd() {
    return this.#env.getCwd();
  }
  getVar(key) {
    if (isWindows3) {
      key = key.toUpperCase();
    }
    if (key === "PWD") {
      return this.#env.getCwd();
    }
    return this.#env.getEnvVar(key) ?? this.#shellVars[key];
  }
  getCommand(command) {
    return this.#static.commands[command] ?? null;
  }
  getShellOptions() {
    return this.#shellOptions;
  }
  setShellOption(option, value) {
    this.#shellOptions[option] = value;
  }
  getFdReader(fd) {
    return this.#static.fds?.getReader(fd);
  }
  getFdWriter(fd) {
    return this.#static.fds?.getWriter(fd);
  }
  asCommandContext(args) {
    const context = this;
    return {
      get args() {
        return args;
      },
      get cwd() {
        return context.getCwd();
      },
      get env() {
        return context.getEnvVars();
      },
      get stdin() {
        return context.stdin;
      },
      get stdout() {
        return context.stdout;
      },
      get stderr() {
        return context.stderr;
      },
      get signal() {
        return context.signal;
      },
      get shellOptions() {
        return context.getShellOptions();
      },
      error(codeOrText, maybeText) {
        return context.error(codeOrText, maybeText);
      }
    };
  }
  error(codeOrText, maybeText) {
    let code2;
    let text;
    if (typeof codeOrText === "number") {
      code2 = codeOrText;
      text = maybeText;
    } else {
      code2 = 1;
      text = codeOrText;
    }
    const maybePromise = this.stderr.writeLine(text);
    if (maybePromise instanceof Promise) {
      return maybePromise.then(() => ({ code: code2 }));
    } else {
      return { code: code2 };
    }
  }
  withInner(opts) {
    return new _Context({
      stdin: opts.stdin ?? this.stdin,
      stdout: opts.stdout ?? this.stdout,
      stderr: opts.stderr ?? this.stderr,
      env: this.#env.clone(),
      shellVars: { ...this.#shellVars },
      shellOptions: this.#shellOptions,
      static: this.#static
    });
  }
  clone() {
    return new _Context({
      stdin: this.stdin,
      stdout: this.stdout,
      stderr: this.stderr,
      env: this.#env.clone(),
      shellVars: { ...this.#shellVars },
      shellOptions: this.#shellOptions,
      static: this.#static
    });
  }
};
function parseCommand(command) {
  return parse2(command);
}
function getDefaultShellOptions(list) {
  return {
    nullglob: false,
    failglob: false,
    // default: pass unmatched globs through literally
    pipefail: false,
    globstar: true,
    // default: ** matches recursively
    questionGlob: false,
    // default: ? is literal
    // on by default for multi-line input so a failing line stops the rest;
    // single-line `a; b` keeps running through failures.
    errexit: isMultiLine(list)
  };
}
function isMultiLine(list) {
  return list.items.some((item) => item.endsLine);
}
async function spawn2(list, opts) {
  const env = opts.exportEnv ? opts.clearedEnv ? new RealEnvWriteOnly() : new RealEnv() : new ShellEnv();
  initializeEnv(env, opts);
  const defaultOptions = getDefaultShellOptions(list);
  const context = new Context({
    env,
    stdin: opts.stdin,
    stdout: opts.stdout,
    stderr: opts.stderr,
    shellVars: {},
    shellOptions: {
      ...defaultOptions,
      ...opts.shellOptions
    },
    static: {
      commands: opts.commands,
      fds: opts.fds,
      signal: opts.signal
    }
  });
  const result = await executeSequentialList(list, context);
  return result.code;
}
async function executeSequentialList(list, context) {
  let finalExitCode = 0;
  const finalChanges = [];
  for (const item of list.items) {
    if (item.isAsync) {
      throw new Error("Async commands are not supported. Run a command concurrently in the JS code instead.");
    }
    const result = await executeSequence(item.sequence, context);
    switch (result.kind) {
      case void 0:
        if (result.changes) {
          context.applyChanges(result.changes);
          finalChanges.push(...result.changes);
        }
        finalExitCode = result.code;
        break;
      case "exit":
        return result;
      default: {
        const _assertNever = result;
      }
    }
    if (finalExitCode !== 0 && context.getShellOptions().errexit) {
      break;
    }
  }
  return {
    code: finalExitCode,
    changes: finalChanges
  };
}
function executeSequence(sequence, context) {
  if (context.signal.aborted) {
    return Promise.resolve(getAbortedResult());
  }
  switch (sequence.kind) {
    case "pipeline":
      return executePipeline(sequence, context);
    case "booleanList":
      return executeBooleanList(sequence, context);
    case "shellVar":
      return executeShellVar(sequence, context);
    default: {
      const _assertNever = sequence;
      throw new Error(`Not implemented: ${sequence}`);
    }
  }
}
function executePipeline(pipeline, context) {
  const output = executePipelineInner(pipeline.inner, context);
  if (pipeline.negated) {
    return Promise.resolve(output).then((result) => {
      return {
        ...result,
        code: result.code === 0 ? 1 : 0
      };
    });
  }
  return output;
}
async function executeBooleanList(list, context) {
  const changes = [];
  const firstResult = await executeSequence(list.current, context.clone());
  let exitCode = 0;
  switch (firstResult.kind) {
    case "exit":
      return firstResult;
    case void 0:
      if (firstResult.changes) {
        context.applyChanges(firstResult.changes);
        changes.push(...firstResult.changes);
      }
      exitCode = firstResult.code;
      break;
    default: {
      const _assertNever = firstResult;
      throw new Error("Not handled.");
    }
  }
  const next = findNextSequence(list, exitCode);
  if (next == null) {
    return {
      code: exitCode,
      changes
    };
  } else {
    const nextResult = await executeSequence(next, context.clone());
    switch (nextResult.kind) {
      case "exit":
        return nextResult;
      case void 0:
        if (nextResult.changes) {
          changes.push(...nextResult.changes);
        }
        return {
          code: nextResult.code,
          changes
        };
      default: {
        const _assertNever = nextResult;
        throw new Error("Not Implemented");
      }
    }
  }
  function findNextSequence(current, exitCode2) {
    if (opMovesNextForExitCode(current.op, exitCode2)) {
      return current.next;
    } else {
      let next2 = current.next;
      while (next2.kind === "booleanList") {
        if (opMovesNextForExitCode(next2.op, exitCode2)) {
          return next2.next;
        } else {
          next2 = next2.next;
        }
      }
      return void 0;
    }
  }
  function opMovesNextForExitCode(op, exitCode2) {
    switch (op) {
      case "or":
        return exitCode2 !== 0;
      case "and":
        return exitCode2 === 0;
    }
  }
}
async function executeShellVar(sequence, context) {
  const value = await evaluateWord(sequence.value, context);
  return {
    code: 0,
    changes: [{
      kind: "shellvar",
      name: sequence.name,
      value
    }]
  };
}
function executePipelineInner(inner, context) {
  switch (inner.kind) {
    case "command":
      return executeCommand(inner, context);
    case "pipeSequence":
      return executePipeSequence(inner, context);
    default: {
      const _assertNever = inner;
      throw new Error(`Not implemented: ${inner.kind}`);
    }
  }
}
async function executeCommand(command, context) {
  if (command.redirect != null) {
    const redirectResult = await resolveRedirectPipe(command.redirect, context);
    let redirectPipe;
    if (redirectResult.kind === "input") {
      const { pipe } = redirectResult;
      context = context.withInner({
        stdin: pipe
      });
      redirectPipe = pipe;
    } else if (redirectResult.kind === "output") {
      const { pipe, toFd } = redirectResult;
      const writer = new ShellPipeWriter("piped", pipe);
      redirectPipe = pipe;
      if (toFd === 1) {
        context = context.withInner({
          stdout: writer
        });
      } else if (toFd === 2) {
        context = context.withInner({
          stderr: writer
        });
      } else if (toFd === "&") {
        context = context.withInner({
          stdout: writer
        }).withInner({
          stderr: writer
        });
      } else {
        const _assertNever = toFd;
        throw new Error(`Not handled fd: ${toFd}`);
      }
    } else {
      return redirectResult;
    }
    const result = await executeCommandInner(command.inner, context);
    try {
      if (isAsyncDisposable(redirectPipe)) {
        await redirectPipe[Symbol.asyncDispose]();
      } else if (isDisposable(redirectPipe)) {
        redirectPipe[Symbol.dispose]();
      }
    } catch (err) {
      if (result.code === 0) {
        return context.error(`failed disposing redirected pipe. ${errorToString(err)}`);
      }
    }
    return result;
  } else {
    return executeCommandInner(command.inner, context);
  }
}
async function resolveRedirectPipe(redirect, context) {
  function handleFileOpenError(outputPath, err) {
    return context.error(`failed opening file for redirect (${outputPath}). ${errorToString(err)}`);
  }
  const toFd = resolveRedirectToFd(redirect, context);
  if (typeof toFd !== "number" && toFd !== "&") {
    return toFd;
  }
  const { ioFile } = redirect;
  if (ioFile.kind === "fd") {
    switch (redirect.op.kind) {
      case "input": {
        if (ioFile.value === 0) {
          return {
            kind: "input",
            pipe: getStdinReader(context.stdin)
          };
        } else if (ioFile.value === 1 || ioFile.value === 2) {
          return context.error(`redirecting stdout or stderr to a command input is not supported`);
        } else {
          const pipe = context.getFdReader(ioFile.value);
          if (pipe == null) {
            return context.error(`could not find fd reader: ${ioFile.value}`);
          } else {
            return {
              kind: "input",
              pipe
            };
          }
        }
      }
      case "output": {
        if (ioFile.value === 0) {
          return context.error(`redirecting output to stdin is not supported`);
        } else if (ioFile.value === 1) {
          return {
            kind: "output",
            pipe: context.stdout.inner,
            toFd
          };
        } else if (ioFile.value === 2) {
          return {
            kind: "output",
            pipe: context.stderr.inner,
            toFd
          };
        } else {
          const pipe = context.getFdWriter(ioFile.value);
          if (pipe == null) {
            return context.error(`could not find fd: ${ioFile.value}`);
          } else {
            return {
              kind: "output",
              pipe,
              toFd
            };
          }
        }
      }
      default: {
        const _assertNever = redirect.op;
        throw new Error("not implemented redirect op.");
      }
    }
  } else if (ioFile.kind === "word") {
    const words = await evaluateWordParts(ioFile.value, context);
    if (words.length === 0) {
      return context.error("redirect path must be 1 argument, but found 0");
    } else if (words.length > 1) {
      return context.error(`redirect path must be 1 argument, but found ${words.length} (${words.join(" ")}). Did you mean to quote it (ex. "${words.join(" ")}")?`);
    }
    switch (redirect.op.kind) {
      case "input": {
        const outputPath = path4.isAbsolute(words[0]) ? words[0] : path4.join(context.getCwd(), words[0]);
        try {
          const file = await open2(outputPath, {
            read: true
          });
          return {
            kind: "input",
            pipe: file
          };
        } catch (err) {
          return handleFileOpenError(outputPath, err);
        }
      }
      case "output": {
        if (words[0] === "/dev/null") {
          return {
            kind: "output",
            pipe: new NullPipeWriter(),
            toFd
          };
        }
        const outputPath = path4.isAbsolute(words[0]) ? words[0] : path4.join(context.getCwd(), words[0]);
        try {
          const file = await open2(outputPath, {
            write: true,
            create: true,
            append: redirect.op.value === "append",
            truncate: redirect.op.value !== "append"
          });
          return {
            kind: "output",
            pipe: file,
            toFd
          };
        } catch (err) {
          return handleFileOpenError(outputPath, err);
        }
      }
      default: {
        const _assertNever = redirect.op;
        throw new Error("not implemented redirect op.");
      }
    }
  } else {
    const _assertNever = ioFile;
    throw new Error("not implemented redirect io file.");
  }
}
function getStdinReader(stdin2) {
  if (stdin2 === "inherit") {
    return stdin;
  } else if (stdin2 === "null") {
    return new NullPipeReader();
  } else {
    return stdin2;
  }
}
function resolveRedirectToFd(redirect, context) {
  const maybeFd = redirect.maybeFd;
  if (maybeFd == null) {
    return 1;
  }
  if (maybeFd.kind === "stdoutStderr") {
    return "&";
  }
  if (maybeFd.fd !== 1 && maybeFd.fd !== 2) {
    return context.error(`only redirecting to stdout (1) and stderr (2) is supported`);
  } else {
    return maybeFd.fd;
  }
}
function executeCommandInner(command, context) {
  switch (command.kind) {
    case "simple":
      return executeSimpleCommand(command, context);
    case "subshell":
      return executeSubshell(command, context);
    default: {
      const _assertNever = command;
      throw new Error(`Not implemented: ${command.kind}`);
    }
  }
}
async function executeSimpleCommand(command, parentContext) {
  const context = parentContext.clone();
  try {
    for (const envVar of command.envVars) {
      context.setEnvVar(envVar.name, await evaluateWord(envVar.value, context));
    }
    const commandArgs = await evaluateArgs(command.args, context);
    return await executeCommandArgs(commandArgs, context);
  } catch (err) {
    if (err instanceof ShellEvaluateError) {
      return context.error(err.message);
    } else {
      throw err;
    }
  }
}
function executeCommandArgs(commandArgs, context) {
  const commandName = commandArgs.shift();
  const command = context.getCommand(commandName);
  if (command != null) {
    return Promise.resolve(command(context.asCommandContext(commandArgs)));
  }
  const unresolvedCommand = {
    name: commandName,
    baseDir: context.getCwd()
  };
  return executeUnresolvedCommand(unresolvedCommand, commandArgs, context);
}
async function executeUnresolvedCommand(unresolvedCommand, commandArgs, context) {
  const resolvedCommand = await resolveCommand(unresolvedCommand, context);
  if (resolvedCommand === false) {
    context.stderr.writeLine(`dax: ${unresolvedCommand.name}: command not found`);
    return { code: 127 };
  }
  if (resolvedCommand.kind === "shebang") {
    return executeUnresolvedCommand(resolvedCommand.command, [...resolvedCommand.args, ...commandArgs], context);
  }
  const _assertIsPath = resolvedCommand.kind;
  return createExecutableCommand(resolvedCommand.path)(context.asCommandContext(commandArgs));
}
async function executeSubshell(subshell, context) {
  const result = await executeSequentialList(subshell, context);
  return { code: result.code };
}
async function pipeReaderToWriterSync(reader, writer, signal) {
  const buffer = new Uint8Array(1024);
  while (!signal.aborted) {
    const bytesRead = await reader.read(buffer);
    if (bytesRead == null || bytesRead === 0) {
      break;
    }
    const maybePromise = writer.writeAll(buffer.slice(0, bytesRead));
    if (maybePromise) {
      await maybePromise;
    }
  }
}
function pipeCommandPipeReaderToWriterSync(reader, writer, signal) {
  switch (reader) {
    case "inherit":
      return pipeReaderToWriterSync(stdin, writer, signal);
    case "null":
      return Promise.resolve();
    default: {
      return pipeReaderToWriterSync(reader, writer, signal);
    }
  }
}
async function resolveCommand(unresolvedCommand, context) {
  if (unresolvedCommand.name.includes("/") || isWindows3 && unresolvedCommand.name.includes("\\")) {
    const absolutePath = path4.isAbsolute(unresolvedCommand.name) ? unresolvedCommand.name : path4.resolve(unresolvedCommand.baseDir, unresolvedCommand.name);
    const commandPath2 = await whichFromContext(absolutePath, context);
    if (commandPath2 == null) {
      return false;
    }
    const result = await getExecutableShebangFromPath(commandPath2);
    if (result === false) {
      return false;
    } else if (result != null) {
      const args = await parseShebangArgs(result, context);
      const name = args.shift();
      args.push(commandPath2);
      return {
        kind: "shebang",
        command: {
          name,
          baseDir: path4.dirname(commandPath2)
        },
        args
      };
    } else {
      const _assertUndefined = result;
      return {
        kind: "path",
        path: commandPath2
      };
    }
  }
  const commandPath = await whichFromContext(unresolvedCommand.name, context);
  if (commandPath == null) {
    return false;
  }
  return {
    kind: "path",
    path: commandPath
  };
}
var WhichEnv = class extends RealEnvironment {
  /** Requests read permission for the provided directory under Deno. */
  requestPermission(folderPath) {
    const denoGlobal2 = globalThis.Deno;
    denoGlobal2?.permissions?.requestSync?.({
      name: "read",
      path: folderPath
    });
  }
};
var whichRealEnv = new WhichEnv();
async function whichFromContext(commandName, context) {
  return await which(commandName, {
    isWindows: isWindows3,
    stat: whichRealEnv.stat,
    lstat: whichRealEnv.lstat,
    readLink: whichRealEnv.readLink,
    env(key) {
      return context.getVar(key);
    },
    requestPermission: whichRealEnv.requestPermission
  });
}
async function executePipeSequence(sequence, context) {
  const waitTasks = [];
  let lastOutput = context.stdin;
  let nextInner = sequence;
  while (nextInner != null) {
    let innerCommand;
    switch (nextInner.kind) {
      case "pipeSequence":
        switch (nextInner.op) {
          case "stdout": {
            innerCommand = nextInner.current;
            break;
          }
          case "stdoutstderr": {
            return context.error(`piping to both stdout and stderr is not implemented (ex. |&)`);
          }
          default: {
            const _assertNever = nextInner.op;
            return context.error(`not implemented pipe sequence op: ${nextInner.op}`);
          }
        }
        nextInner = nextInner.next;
        break;
      case "command":
        innerCommand = nextInner;
        nextInner = void 0;
        break;
    }
    const buffer = new PipeSequencePipe();
    const newContext = context.withInner({
      stdout: new ShellPipeWriter("piped", buffer),
      stdin: lastOutput
    });
    const commandPromise = executeCommand(innerCommand, newContext);
    waitTasks.push(commandPromise);
    commandPromise.finally(() => {
      buffer.close();
    });
    lastOutput = buffer;
  }
  waitTasks.push(pipeCommandPipeReaderToWriterSync(lastOutput, context.stdout, context.signal).then(() => ({ code: 0 })));
  const results = await Promise.all(waitTasks);
  const shellOptions = context.getShellOptions();
  let exitCode;
  if (shellOptions.pipefail) {
    exitCode = 0;
    for (let i = results.length - 1; i >= 0; i--) {
      const code2 = results[i].code;
      if (code2 !== 0) {
        exitCode = code2;
        break;
      }
    }
  } else {
    exitCode = results[results.length - 2].code;
  }
  return { code: exitCode };
}
async function parseShebangArgs(info2, context) {
  function throwUnsupported() {
    throw new Error("Unsupported shebang. Please report this as a bug.");
  }
  if (!info2.stringSplit) {
    return [info2.command];
  }
  const command = parseCommand(info2.command);
  if (command.items.length !== 1) {
    throwUnsupported();
  }
  const item = command.items[0];
  if (item.sequence.kind !== "pipeline" || item.isAsync) {
    throwUnsupported();
  }
  const sequence = item.sequence;
  if (sequence.negated) {
    throwUnsupported();
  }
  if (sequence.inner.kind !== "command" || sequence.inner.redirect != null) {
    throwUnsupported();
  }
  const innerCommand = sequence.inner.inner;
  if (innerCommand.kind !== "simple") {
    throwUnsupported();
  }
  if (innerCommand.envVars.length > 0) {
    throwUnsupported();
  }
  return await evaluateArgs(innerCommand.args, context);
}
async function evaluateArgs(args, context) {
  const result = [];
  for (const arg of args) {
    result.push(...await evaluateWordParts(arg, context));
  }
  return result;
}
async function evaluateWord(word, context) {
  const result = await evaluateWordParts(word, context);
  return result.join(" ");
}
async function evaluateWordParts(wordParts, context, quoted = false) {
  function hasGlobChar2(text, questionGlob) {
    for (let i = 0; i < text.length; i++) {
      switch (text[i]) {
        case "?":
          if (questionGlob)
            return true;
          break;
        case "*":
        case "[":
          return true;
        default:
          break;
      }
    }
    return false;
  }
  function textPartsToString(textParts) {
    return textParts.map((p) => p.value).join("");
  }
  async function evaluateWordText(textParts, isQuoted) {
    const questionGlob = context.getShellOptions().questionGlob;
    if (!isQuoted && textParts.some((part) => part.kind === "text" && hasGlobChar2(part.value, questionGlob))) {
      let currentText2 = "";
      const globEscapeChar = isWindows3 ? "`" : "\\";
      for (const textPart of textParts) {
        switch (textPart.kind) {
          case "quoted":
            for (let i = 0; i < textPart.value.length; i++) {
              const char = textPart.value[i];
              switch (char) {
                case "?":
                case "*":
                case "[":
                case "]":
                case "{":
                case "}":
                  currentText2 += `${globEscapeChar}${char}`;
                  break;
                default:
                  currentText2 += char;
                  break;
              }
            }
            break;
          case "text": {
            const textPartValue = textPart.value.replaceAll("[]]", `${globEscapeChar}]`).replaceAll("[[]", `${globEscapeChar}[`);
            for (let i = 0; i < textPartValue.length; i++) {
              const char = textPartValue[i];
              switch (char) {
                case "?":
                  if (!questionGlob) {
                    currentText2 += `${globEscapeChar}${char}`;
                  } else {
                    currentText2 += char;
                  }
                  break;
                case "{":
                case "}":
                  currentText2 += `${globEscapeChar}${char}`;
                  break;
                default:
                  currentText2 += char;
                  break;
              }
            }
            break;
          }
          default: {
            const _assertNever = textPart;
            break;
          }
        }
      }
      const cwd2 = context.getCwd();
      const shellOptions = context.getShellOptions();
      const isAbsolute7 = path4.isAbsolute(currentText2);
      let patternText = currentText2;
      if (!shellOptions.globstar && currentText2.includes("**")) {
        while (patternText.includes("**")) {
          patternText = patternText.replace("**", "*");
        }
      }
      const pattern = isAbsolute7 ? patternText : path4.join(cwd2, patternText);
      const entries = await Array.fromAsync(expandGlob(pattern, {
        // be the same on all operating systems
        caseInsensitive: true,
        followSymlinks: false,
        globstar: shellOptions.globstar,
        root: cwd2,
        includeDirs: false
      }));
      entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
      if (entries.length === 0) {
        if (shellOptions.failglob) {
          throw new ShellEvaluateError(`glob: no matches found '${pattern}' (run \`shopt -u failglob\` to pass unmatched glob patterns literally)`);
        } else if (shellOptions.nullglob) {
          return [];
        } else {
          return [textPartsToString(textParts)];
        }
      }
      if (isAbsolute7) {
        return entries.map((e) => e.path);
      } else {
        return entries.map((e) => path4.relative(cwd2, e.path));
      }
    } else {
      return [textPartsToString(textParts)];
    }
  }
  const result = [];
  let currentText = [];
  for (const stringPart of wordParts) {
    let evaluationResult = void 0;
    switch (stringPart.kind) {
      case "text":
        currentText.push(stringPart);
        break;
      case "variable":
        evaluationResult = context.getVar(stringPart.value);
        break;
      case "quoted": {
        const text = (await evaluateWordParts(stringPart.value, context, true)).join(" ");
        currentText.push({
          kind: "quoted",
          value: text
        });
        continue;
      }
      case "tilde": {
        const envVarName = isWindows3 ? "USERPROFILE" : "HOME";
        const homeDirEnv = context.getVar(envVarName);
        if (homeDirEnv == null) {
          throw new Error(`Failed resolving home directory for tilde expansion ('${envVarName}' env var not set).`);
        }
        evaluationResult = homeDirEnv;
        break;
      }
      case "command":
        throw new Error(`Not implemented: ${stringPart.kind}`);
    }
    if (evaluationResult != null) {
      const parts = evaluationResult.split(" ").map((t) => ({
        kind: "text",
        value: t.trim()
      })).filter((t) => t.value.length > 0);
      if (parts.length > 0) {
        currentText.push(...parts.splice(0, 1));
        if (parts.length > 0) {
          result.push(...await evaluateWordText(currentText, quoted));
          for (const part of parts.splice(0, parts.length - 1)) {
            result.push(...await evaluateWordText([part], quoted));
          }
          currentText = parts;
        }
      }
    }
  }
  if (currentText.length !== 0) {
    result.push(...await evaluateWordText(currentText, quoted));
  }
  return result;
}
function isDisposable(value) {
  return value != null && typeof value[Symbol.dispose] === "function";
}
function isAsyncDisposable(value) {
  return value != null && typeof value[Symbol.asyncDispose] === "function";
}
async function whichCommand(context) {
  try {
    return await executeWhich(context);
  } catch (err) {
    return context.error(`which: ${errorToString(err)}`);
  }
}
async function executeWhich(context) {
  let flags;
  try {
    flags = parseArgs9(context.args);
  } catch (err) {
    return await context.error(2, `which: ${errorToString(err)}`);
  }
  if (flags.commandName == null) {
    return { code: 1 };
  }
  const path62 = await whichFromContext(flags.commandName, {
    getVar(key) {
      return context.env[key];
    }
  });
  if (path62 != null) {
    await context.stdout.writeLine(path62);
    return { code: 0 };
  } else {
    return { code: 1 };
  }
}
function parseArgs9(args) {
  let commandName;
  for (const arg of parseArgKinds(args)) {
    if (arg.kind === "Arg") {
      if (commandName != null) {
        throw Error("unsupported too many arguments");
      }
      commandName = arg.arg;
    } else {
      bailUnsupported3(arg);
    }
  }
  return {
    commandName
  };
}
function bailUnsupported3(arg) {
  switch (arg.kind) {
    case "Arg":
      throw Error(`unsupported argument: ${arg.arg}`);
    case "ShortFlag":
      throw Error(`unsupported flag: -${arg.arg}`);
    case "LongFlag":
      throw Error(`unsupported flag: --${arg.arg}`);
  }
}
var ByteRingBuffer = class {
  capacity;
  #buffer;
  #size = 0;
  /** Index of the next byte to write — equivalently, the oldest retained
   * byte once the ring has wrapped. */
  #head = 0;
  constructor(capacity) {
    this.capacity = Math.max(1, Math.floor(capacity));
    this.#buffer = new Uint8Array(this.capacity);
  }
  get size() {
    return this.#size;
  }
  push(data) {
    if (data.length === 0)
      return;
    if (data.length >= this.capacity) {
      this.#buffer.set(data.subarray(data.length - this.capacity), 0);
      this.#size = this.capacity;
      this.#head = 0;
      return;
    }
    const tail = this.capacity - this.#head;
    if (data.length <= tail) {
      this.#buffer.set(data, this.#head);
    } else {
      this.#buffer.set(data.subarray(0, tail), this.#head);
      this.#buffer.set(data.subarray(tail), 0);
    }
    this.#head = (this.#head + data.length) % this.capacity;
    this.#size = Math.min(this.#size + data.length, this.capacity);
  }
  /** Return the retained bytes, oldest first, as a freshly allocated array. */
  toBytes() {
    const out = new Uint8Array(this.#size);
    if (this.#size === 0)
      return out;
    const start = this.#size < this.capacity ? 0 : this.#head;
    const tail = this.capacity - start;
    if (this.#size <= tail) {
      out.set(this.#buffer.subarray(start, start + this.#size));
    } else {
      out.set(this.#buffer.subarray(start, this.capacity), 0);
      out.set(this.#buffer.subarray(0, this.#size - tail), tail);
    }
    return out;
  }
};
var _a;
var Deferred = class {
  #create;
  constructor(create2) {
    this.#create = create2;
  }
  create() {
    return this.#create();
  }
};
var textDecoder = new import_node_util2.TextDecoder();
var builtInCommands = {
  cd: cdCommand,
  printenv: printEnvCommand,
  echo: echoCommand,
  cat: catCommand,
  exit: exitCommand,
  export: exportCommand,
  set: setCommand,
  shopt: shoptCommand,
  sleep: sleepCommand,
  test: testCommand,
  rm: rmCommand,
  mkdir: mkdirCommand,
  cp: cpCommand,
  mv: mvCommand,
  pwd: pwdCommand,
  touch: touchCommand,
  true: () => ({ code: 0 }),
  false: () => ({ code: 1 }),
  // POSIX null command: discards its arguments and always exits 0
  ":": () => ({ code: 0 }),
  unset: unsetCommand,
  which: whichCommand
};
var getRegisteredCommandNamesSymbol = /* @__PURE__ */ Symbol();
var setCommandTextStateSymbol = /* @__PURE__ */ Symbol();
var CommandBuilder = class {
  #state = {
    command: void 0,
    combinedStdoutStderr: false,
    stdin: "inherit",
    stdout: {
      kind: "inherit"
    },
    stderr: {
      kind: "inherit"
    },
    tailDisplay: false,
    errorTail: false,
    noThrow: false,
    env: {},
    cwd: void 0,
    commands: { ...builtInCommands },
    clearEnv: false,
    exportEnv: false,
    printCommand: false,
    printCommandLogger: new LoggerTreeBox(
      // deno-lint-ignore no-console
      (cmd) => console.error(white(">"), blue(cmd))
    ),
    timeout: void 0,
    signal: void 0,
    encoding: void 0,
    shellOptions: {},
    beforeCommand: void 0,
    beforeCommandSync: void 0
  };
  #getClonedState() {
    const state = this.#state;
    return {
      // be explicit here in order to evaluate each property on a case by case basis
      command: state.command,
      combinedStdoutStderr: state.combinedStdoutStderr,
      stdin: state.stdin,
      stdout: {
        kind: state.stdout.kind,
        options: state.stdout.options
      },
      stderr: {
        kind: state.stderr.kind,
        options: state.stderr.options
      },
      tailDisplay: state.tailDisplay === false ? false : { ...state.tailDisplay },
      errorTail: state.errorTail === false ? false : { ...state.errorTail },
      noThrow: state.noThrow instanceof Array ? [...state.noThrow] : state.noThrow,
      env: { ...state.env },
      cwd: state.cwd,
      commands: { ...state.commands },
      clearEnv: state.clearEnv,
      exportEnv: state.exportEnv,
      printCommand: state.printCommand,
      printCommandLogger: state.printCommandLogger.createChild(),
      timeout: state.timeout,
      signal: state.signal,
      encoding: state.encoding,
      shellOptions: { ...state.shellOptions },
      beforeCommand: state.beforeCommand,
      beforeCommandSync: state.beforeCommandSync
    };
  }
  #newWithState(action) {
    const builder = new _a();
    const state = this.#getClonedState();
    action(state);
    builder.#state = state;
    return builder;
  }
  /** Spawns the command and returns a promise resolving to the command result.
   *
   * Allows awaiting a `CommandBuilder` directly without calling `.spawn()`.
   */
  then(onfulfilled, onrejected) {
    const callerStack = captureCallerStack(this.then);
    return this.#resolveStateForSpawn().then((state) => parseAndSpawnCommand(state, callerStack).then(onfulfilled).catch(onrejected));
  }
  /**
   * Explicit way to spawn a command.
   *
   * This is an alias for awaiting the command builder or calling `.then(...)`
   */
  spawn() {
    if (this.#state.beforeCommand != null && this.#state.beforeCommand.length > 0) {
      throw new Error(".spawn() cannot be used when .beforeCommand() hooks are registered; await the builder, call .then(), or use .beforeCommandSync() instead.");
    }
    const callerStack = captureCallerStack(this.spawn);
    return parseAndSpawnCommand(this.#runSyncHooks(), callerStack);
  }
  #runSyncHooks() {
    const callbacks = this.#state.beforeCommandSync;
    if (callbacks == null || callbacks.length === 0) {
      return this.#getClonedState();
    }
    let builder = this.#newWithState((state) => {
      state.beforeCommandSync = void 0;
    });
    for (const cb of callbacks) {
      const result = cb(builder);
      if (result instanceof _a) {
        builder = result;
      }
    }
    return builder.#getClonedState();
  }
  async #resolveStateForSpawn() {
    let builder;
    {
      const syncState = this.#runSyncHooks();
      builder = new _a();
      builder.#state = syncState;
    }
    const callbacks = this.#state.beforeCommand;
    if (callbacks == null || callbacks.length === 0) {
      return builder.#getClonedState();
    }
    builder = builder.#newWithState((state) => {
      state.beforeCommand = void 0;
    });
    for (const cb of callbacks) {
      const proxy = wrapCommandBuilderNonThenable(builder);
      const result = await cb(proxy);
      builder = unwrapCommandBuilder(result) ?? builder;
    }
    return builder.#getClonedState();
  }
  /**
   * Register a command.
   */
  registerCommand(command, handleFn) {
    validateCommandName(command);
    return this.#newWithState((state) => {
      state.commands[command] = handleFn;
    });
  }
  /**
   * Register multilple commands.
   */
  registerCommands(commands) {
    let command = this;
    for (const [key, value] of Object.entries(commands)) {
      command = command.registerCommand(key, value);
    }
    return command;
  }
  /**
   * Unregister a command.
   */
  unregisterCommand(command) {
    return this.#newWithState((state) => {
      delete state.commands[command];
    });
  }
  /** Sets the raw command to execute. */
  command(command) {
    return this.#newWithState((state) => {
      if (command instanceof Array) {
        command = command.map(escapeArg).join(" ");
      }
      state.command = {
        text: command,
        fds: void 0
      };
    });
  }
  noThrow(value, ...additional) {
    return this.#newWithState((state) => {
      if (typeof value === "boolean" || value == null) {
        state.noThrow = value ?? true;
      } else {
        state.noThrow = [value, ...additional];
      }
    });
  }
  /** Registers a callback that runs just before each command is spawned.
   *
   * The callback receives the current builder and may return a (possibly
   * modified) builder to use for the spawn. Useful for asynchronously
   * resolving values such as auth tokens or env vars.
   *
   * ```ts
   * $`./build.sh`.beforeCommand(async (builder) => {
   *   return builder.env("AUTH_TOKEN", await getAccessToken());
   * });
   * ```
   *
   * Multiple `.beforeCommand(...)` calls compose: each registered callback runs
   * in the order it was added, with the builder produced by the previous one.
   *
   * The builder passed to the callback is in a special "passthrough" mode so
   * its `.then(...)` resolves with the builder itself (instead of spawning) —
   * this is what makes `return builder.env(...)` from an `async` function
   * safe. If you construct a fresh `new CommandBuilder()` inside the callback,
   * return it as `{ commandBuilder: ... }` to avoid an accidental spawn.
   *
   * Hooks are only resolved when the builder is awaited (or `.then()` is
   * called). Calling `.spawn()` on a builder with registered hooks throws.
   */
  beforeCommand(callback) {
    return this.#newWithState((state) => {
      state.beforeCommand = state.beforeCommand == null ? [callback] : [...state.beforeCommand, callback];
    });
  }
  /** Synchronous variant of {@link beforeCommand}. Unlike `.beforeCommand`,
   * sync hooks also run on the `.spawn()` path, so they're suitable when you
   * need streaming via `.spawn().stdout()` etc.
   *
   * The callback must return synchronously (`CommandBuilder` or nothing). The
   * thenable-unwrapping concern doesn't apply here because the return value
   * never passes through Promise machinery — `return builder.env(...)` is just
   * a function return.
   *
   * ```ts
   * const child = $`./build.sh`
   *   .beforeCommandSync((builder) => builder.env("BUILD_ID", crypto.randomUUID()))
   *   .spawn();
   * ```
   *
   * Sync hooks always run before async hooks during a single resolution pass.
   */
  beforeCommandSync(callback) {
    return this.#newWithState((state) => {
      state.beforeCommandSync = state.beforeCommandSync == null ? [callback] : [...state.beforeCommandSync, callback];
    });
  }
  /** Sets the signal that will be passed to all commands
   * created with this command builder.
   *
   * Accepts a `KillSignal` or a standard `AbortSignal`. When an
   * `AbortSignal` is provided it is internally bridged to a
   * `KillSignal` that sends `SIGTERM` on abort.
   */
  signal(signal) {
    return this.#newWithState((state) => {
      const killSignal = signal instanceof KillSignal ? signal : killSignalFromAbortSignal(signal);
      if (state.signal != null) {
        state.signal.linkChild(killSignal);
      }
      state.signal = killSignal;
    });
  }
  /**
   * Whether to capture a combined buffer of both stdout and stderr.
   *
   * This will set both stdout and stderr to "piped" if not already "piped"
   * or "inheritPiped".
   */
  captureCombined(value = true) {
    return this.#newWithState((state) => {
      state.combinedStdoutStderr = value;
      if (value) {
        if (state.stdout.kind !== "piped" && state.stdout.kind !== "inheritPiped") {
          state.stdout.kind = "piped";
        }
        if (state.stderr.kind !== "piped" && state.stderr.kind !== "inheritPiped") {
          state.stderr.kind = "piped";
        }
      }
    });
  }
  /**
   * Sets the stdin to use for the command.
   *
   * @remarks If multiple launches of a command occurs, then stdin will only be
   * read from the first consumed reader or readable stream and error otherwise.
   * For this reason, if you are setting stdin to something other than "inherit" or
   * "null", then it's recommended to set this each time you spawn a command.
   */
  stdin(reader) {
    return this.#newWithState((state) => {
      if (reader === "inherit" || reader === "null") {
        state.stdin = reader;
      } else if (reader instanceof Uint8Array) {
        state.stdin = new Deferred(() => new Buffer2(reader));
      } else if (reader instanceof Path) {
        state.stdin = new Deferred(async () => {
          const file = await reader.open();
          return file.readable;
        });
      } else if (reader instanceof _a) {
        state.stdin = new Deferred(() => {
          return reader.stdout("piped").spawn().stdout();
        });
      } else if (isAwaitableReadable(reader)) {
        const awaitable = reader;
        state.stdin = new Deferred(async () => {
          const body = await awaitable;
          if (!(body?.readable instanceof import_web2.ReadableStream)) {
            throw new TypeError("When passing an awaitable to stdin, the resolved value must have a `readable` ReadableStream.");
          }
          return body.readable;
        });
      } else {
        state.stdin = new Box(reader);
      }
    });
  }
  /**
   * Sets the stdin string to use for a command.
   *
   * @remarks See the remarks on stdin. The same applies here.
   */
  stdinText(text) {
    return this.stdin(new TextEncoder().encode(text));
  }
  stdout(kind, options) {
    return this.#newWithState((state) => {
      if (state.combinedStdoutStderr && kind !== "piped" && kind !== "inheritPiped") {
        throw new TypeError("Cannot set stdout's kind to anything but 'piped' or 'inheritPiped' when combined is true.");
      }
      if (options?.signal != null) {
        throw new TypeError("Setting a signal for a stdout WritableStream is not yet supported.");
      }
      state.stdout = {
        kind,
        options
      };
    });
  }
  stderr(kind, options) {
    return this.#newWithState((state) => {
      if (state.combinedStdoutStderr && kind !== "piped" && kind !== "inheritPiped") {
        throw new TypeError("Cannot set stderr's kind to anything but 'piped' or 'inheritPiped' when combined is true.");
      }
      if (options?.signal != null) {
        throw new TypeError("Setting a signal for a stderr WritableStream is not yet supported.");
      }
      state.stderr = {
        kind,
        options
      };
    });
  }
  tailDisplay(valueOrOptions = true) {
    return this.#newWithState((state) => {
      if (valueOrOptions === false) {
        state.tailDisplay = false;
      } else if (valueOrOptions === true) {
        state.tailDisplay = {};
      } else {
        state.tailDisplay = { ...valueOrOptions };
      }
    });
  }
  errorTail(valueOrOptions = true) {
    return this.#newWithState((state) => {
      if (valueOrOptions === false) {
        state.errorTail = false;
      } else if (valueOrOptions === true) {
        state.errorTail = {};
      } else {
        state.errorTail = { ...valueOrOptions };
      }
    });
  }
  /** Pipes the current command to the provided command returning the
   * provided command builder. When chaining, it's important to call this
   * after you are done configuring the current command or else you will
   * start modifying the provided command instead.
   *
   * @example
   * ```ts
   * const lineCount = await $`echo 1 && echo 2`
   *  .pipe($`wc -l`)
   *  .text();
   * ```
   */
  pipe(builder) {
    return builder.stdin(this.stdout("piped"));
  }
  env(nameOrItems, value) {
    return this.#newWithState((state) => {
      if (typeof nameOrItems === "string") {
        setEnv(state, nameOrItems, value);
      } else {
        for (const [key, value2] of Object.entries(nameOrItems)) {
          setEnv(state, key, value2);
        }
      }
    });
    function setEnv(state, key, value2) {
      if (isWindows3) {
        key = key.toUpperCase();
      }
      state.env[key] = value2;
    }
  }
  /** Sets the current working directory to use when executing this command. */
  cwd(dirPath) {
    return this.#newWithState((state) => {
      state.cwd = dirPath instanceof URL ? (0, import_node_url.fileURLToPath)(dirPath) : dirPath instanceof Path ? dirPath.resolve().toString() : path5.resolve(dirPath);
    });
  }
  /**
   * Exports the environment of the command to the executing process.
   *
   * So for example, changing the directory in a command or exporting
   * an environment variable will actually change the environment
   * of the executing process.
   *
   * ```ts
   * await $`cd src && export SOME_VALUE=5`;
   * console.log(process.env["SOME_VALUE"]); // 5
   * console.log(process.cwd()); // will be in the src directory
   * ```
   */
  exportEnv(value = true) {
    return this.#newWithState((state) => {
      state.exportEnv = value;
    });
  }
  /**
   * Clear environmental variables from parent process.
   *
   * Doesn't guarantee that only `env` variables are present, as the OS may
   * set environmental variables for processes.
   */
  clearEnv(value = true) {
    return this.#newWithState((state) => {
      state.clearEnv = value;
    });
  }
  /**
   * Prints the command text before executing the command.
   *
   * For example:
   *
   * ```ts
   * const text = "example";
   * await $`echo ${text}`.printCommand();
   * ```
   *
   * Outputs:
   *
   * ```
   * > echo example
   * example
   * ```
   */
  printCommand(value = true) {
    return this.#newWithState((state) => {
      state.printCommand = value;
    });
  }
  /**
   * Mutates the command builder to change the logger used
   * for `printCommand()`.
   */
  setPrintCommandLogger(logger2) {
    this.#state.printCommandLogger.setValue(logger2);
  }
  /**
   * Ensures stdout and stderr are piped if they have the default behaviour or are inherited.
   *
   * ```ts
   * // ensure both stdout and stderr is not logged to the console
   * await $`echo 1`.quiet();
   * // ensure stdout is not logged to the console
   * await $`echo 1`.quiet("stdout");
   * // ensure stderr is not logged to the console
   * await $`echo 1`.quiet("stderr");
   * ```
   */
  quiet(kind = "combined") {
    kind = kind === "both" ? "combined" : kind;
    return this.#newWithState((state) => {
      if (kind === "combined" || kind === "stdout") {
        state.stdout.kind = getQuietKind(state.stdout.kind);
      }
      if (kind === "combined" || kind === "stderr") {
        state.stderr.kind = getQuietKind(state.stderr.kind);
      }
    });
    function getQuietKind(kind2) {
      if (typeof kind2 === "object") {
        return kind2;
      }
      switch (kind2) {
        case "inheritPiped":
        case "inherit":
          return "piped";
        case "null":
        case "piped":
          return kind2;
        default: {
          const _assertNever = kind2;
          throw new TypeError(`Unhandled kind ${kind2}.`);
        }
      }
    }
  }
  /**
   * Specifies a timeout for the command. The command will exit with
   * exit code `124` (timeout) if it times out.
   *
   * Note that when using `.noThrow()` this won't cause an error to
   * be thrown when timing out.
   */
  timeout(delay) {
    return this.#newWithState((state) => {
      state.timeout = delay == null ? void 0 : delayToMs(delay);
    });
  }
  /**
   * Sets stdout as quiet, spawns the command, and gets stdout as a Uint8Array.
   *
   * Shorthand for:
   *
   * ```ts
   * const data = (await $`command`.quiet("stdout")).stdoutBytes;
   * ```
   */
  async bytes(kind = "stdout") {
    const command = kind === "combined" ? this.quiet(kind).captureCombined() : this.quiet(kind);
    return (await command)[`${kind}Bytes`];
  }
  /**
   * Sets the text decoder encoding to use for decoding stdout and stderr.
   *
   * This can be useful when the command output uses a specific character encoding
   * that differs from the default UTF-8 encoding.
   */
  encoding(encoding) {
    return this.#newWithState((state) => {
      state.encoding = encoding;
    });
  }
  /**
   * Sets whether pipefail is enabled. When enabled, a pipeline's exit code
   * is the rightmost non-zero exit code, or 0 if all commands succeed.
   *
   * ```ts
   * // without pipefail (default): exit code is from the last command (grep)
   * const code1 = await $`false | grep foo`.noThrow().code(); // 1 (grep's exit code)
   *
   * // with pipefail: exit code is from the first failing command
   * const code2 = await $`false | grep foo`.pipefail().noThrow().code(); // 1 (false's exit code)
   * ```
   */
  pipefail(value = true) {
    return this.#newWithState((state) => {
      state.shellOptions.pipefail = value;
    });
  }
  /**
   * Sets whether nullglob is enabled. When enabled, a glob pattern that
   * matches no files expands to nothing (empty) rather than being passed
   * through literally.
   *
   * Note: This also disables failglob since nullglob and failglob are
   * mutually exclusive behaviors.
   *
   * ```ts
   * // without nullglob (default): passes pattern literally
   * await $`echo *.nonexistent`; // outputs "*.nonexistent"
   *
   * // with nullglob: expands to nothing
   * await $`echo *.nonexistent`.nullglob(); // outputs empty line
   * ```
   */
  nullglob(value = true) {
    return this.#newWithState((state) => {
      state.shellOptions.nullglob = value;
      if (value) {
        state.shellOptions.failglob = false;
      }
    });
  }
  /**
   * Sets whether failglob is enabled. When enabled, a glob pattern
   * that matches no files causes an error. When disabled (the default),
   * unmatched patterns are passed through literally.
   *
   * ```ts
   * // without failglob (default): passes pattern literally
   * await $`echo *.nonexistent`; // outputs "*.nonexistent"
   *
   * // with failglob: throws error if no matches
   * await $`echo *.nonexistent`.failglob(); // Error: glob: no matches found
   * ```
   */
  failglob(value = true) {
    return this.#newWithState((state) => {
      state.shellOptions.failglob = value;
    });
  }
  /**
   * Sets whether globstar is enabled. When enabled (the default), the pattern `**`
   * used in a pathname expansion context will match all files and zero or more
   * directories and subdirectories. When disabled, `**` is treated as `*`.
   *
   * ```ts
   * // with globstar (default): ** matches recursively
   * await $`echo **\/*.ts`; // matches all .ts files in all subdirectories
   *
   * // without globstar: ** is treated as *
   * await $`echo **\/*.ts`.globstar(false); // matches only .ts files one level deep
   * ```
   */
  globstar(value = true) {
    return this.#newWithState((state) => {
      state.shellOptions.globstar = value;
    });
  }
  /**
   * Sets whether questionGlob is enabled. When enabled, `?` matches any
   * single character in glob patterns. When disabled (the default), `?` is
   * treated literally.
   *
   * This option is only available via the builder API, not via `shopt` or `set`.
   *
   * ```ts
   * // without questionGlob (default): ? is literal
   * await $`echo a?c`; // outputs "a?c"
   *
   * // with questionGlob: ? matches any single character
   * await $`echo a?c`.questionGlob(); // matches files like "abc", "axc", etc.
   * ```
   */
  questionGlob(value = true) {
    return this.#newWithState((state) => {
      state.shellOptions.questionGlob = value;
    });
  }
  /**
   * Sets the provided stream (stdout by default) as quiet, spawns the command, and gets the stream as a string without the last newline.
   * Can be used to get stdout, stderr, or both.
   *
   * Shorthand for:
   *
   * ```ts
   * const data = (await $`command`.quiet("stdout")).stdout.replace(/\r?\n$/, "");
   * ```
   */
  async text(kind = "stdout") {
    return (await this.#textRaw(kind)).replace(/\r?\n$/, "");
  }
  /**
   * Gets the text as an array of lines.
   *
   * Lines are split the same way as {@link CommandBuilder.linesIter} (matches
   * [Rust's `str::lines`](https://doc.rust-lang.org/std/primitive.str.html#method.lines)):
   * line terminators are not included, a trailing blank line caused by a final
   * line ending is excluded, and empty output yields no lines.
   */
  async lines(kind = "stdout") {
    return splitLines2(await this.#textRaw(kind));
  }
  async #textRaw(kind) {
    const command = kind === "combined" ? this.quiet(kind).captureCombined() : this.quiet(kind);
    return (await command)[kind];
  }
  /**
   * Streams the command's output and iterates over its lines without
   * buffering everything into memory.
   *
   * Lines are split at `\n` or `\r\n`. Line terminators are not included.
   * A trailing blank line caused by a final line ending is excluded (matches
   * [Rust's `str::lines`](https://doc.rust-lang.org/std/primitive.str.html#method.lines)).
   *
   * If iteration is abandoned before the end of the output is reached, the
   * child process is killed.
   *
   * ```ts
   * for await (const line of $`cat big.txt`.linesIter()) {
   *   console.log(line);
   * }
   * ```
   */
  linesIter(kind = "stdout") {
    const child = this.quiet(kind).spawn();
    return iterateLines(child, kind);
  }
  /**
   * Sets stream (stdout by default) as quiet, spawns the command, and gets stream as JSON.
   *
   * Shorthand for:
   *
   * ```ts
   * const data = (await $`command`.quiet("stdout")).stdoutJson;
   * ```
   */
  async json(kind = "stdout") {
    return (await this.quiet(kind))[`${kind}Json`];
  }
  /**
   * Helper to get the exit code without throwing on non-zero exit codes.
   *
   * Shorthand for:
   *
   * ```ts
   * const code = (await $`command`.noThrow()).code;
   * ```
   */
  async code() {
    const result = await this.noThrow();
    return result.code;
  }
  /** @internal */
  [getRegisteredCommandNamesSymbol]() {
    return Object.keys(this.#state.commands);
  }
  /** @internal */
  [setCommandTextStateSymbol](textState) {
    return this.#newWithState((state) => {
      state.command = textState;
    });
  }
};
_a = CommandBuilder;
var CommandChild = class extends Promise {
  #pipedStdoutBuffer;
  #pipedStderrBuffer;
  #killSignalController;
  /** @internal */
  constructor(executor, options = { pipedStderrBuffer: void 0, pipedStdoutBuffer: void 0, killSignalController: void 0 }) {
    super(executor);
    this.#pipedStdoutBuffer = options.pipedStdoutBuffer;
    this.#pipedStderrBuffer = options.pipedStderrBuffer;
    this.#killSignalController = options.killSignalController;
  }
  /** Send a signal to the executing command's child process. Note that SIGTERM,
   * SIGKILL, SIGABRT, SIGQUIT, SIGINT, or SIGSTOP will cause the entire command
   * to be considered "aborted" and if part of a command runs after this has occurred
   * it will return a 124 exit code. Other signals will just be forwarded to the command.
   *
   * Defaults to "SIGTERM".
   */
  kill(signal) {
    this.#killSignalController?.kill(signal);
  }
  /** Returns a `ReadableStream` of the running child's stdout. Requires the
   * stdout to have been set to `"piped"`. May only be consumed once. */
  stdout() {
    const buffer = this.#pipedStdoutBuffer;
    this.#assertBufferStreamable("stdout", buffer);
    this.#pipedStdoutBuffer = "consumed";
    this.catch(() => {
    });
    return this.#bufferToStream(buffer);
  }
  /** Returns a `ReadableStream` of the running child's stderr. Requires the
   * stderr to have been set to `"piped"`. May only be consumed once. */
  stderr() {
    const buffer = this.#pipedStderrBuffer;
    this.#assertBufferStreamable("stderr", buffer);
    this.#pipedStderrBuffer = "consumed";
    this.catch(() => {
    });
    return this.#bufferToStream(buffer);
  }
  #assertBufferStreamable(name, buffer) {
    if (buffer == null) {
      throw new Error(`No pipe available. Ensure ${name} is "piped" (not "inheritPiped") and combinedOutput is not enabled.`);
    }
    if (buffer === "consumed") {
      throw new Error(`Streamable ${name} was already consumed. Use the previously acquired stream instead.`);
    }
  }
  #bufferToStream(buffer) {
    const self = this;
    return new import_web2.ReadableStream({
      start(controller) {
        buffer.setListener({
          writeSync(data) {
            controller.enqueue(data);
            return data.length;
          },
          setError(err) {
            controller.error(err);
          },
          close() {
            controller.close();
          }
        });
      },
      cancel(_reason) {
        self.kill();
      }
    });
  }
};
function parseAndSpawnCommand(state, callerStack) {
  if (state.command == null) {
    throw new Error("A command must be set before it can be spawned.");
  }
  if (state.printCommand) {
    const tailHidesCommand = state.tailDisplay !== false && state.tailDisplay.header !== false;
    if (!tailHidesCommand) {
      state.printCommandLogger.getValue()(state.command.text);
    }
  }
  const disposables = [];
  const asyncDisposables = [];
  const parentSignal = state.signal;
  const killSignalController = new KillController();
  if (parentSignal != null) {
    const parentSignalListener = (signal2) => {
      killSignalController.kill(signal2);
    };
    parentSignal.addListener(parentSignalListener);
    if (parentSignal.aborted) {
      killSignalController.kill("SIGTERM");
    }
    disposables.push({
      [Symbol.dispose]() {
        parentSignal.removeListener(parentSignalListener);
      }
    });
  }
  let timedOut = false;
  if (state.timeout != null) {
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killSignalController.kill();
    }, state.timeout);
    disposables.push({
      [Symbol.dispose]() {
        clearTimeout(timeoutId);
      }
    });
  }
  const resolvedTailWriterOptions = state.tailDisplay !== false ? resolveTailWriterOptions(state.tailDisplay, state.command.text, Boolean(state.printCommand)) : void 0;
  const [stdoutBuffer, stderrBuffer, combinedBuffer, tailWriters] = getBuffers();
  const errorTail = state.errorTail;
  const errorTailMaxBytes = errorTail === false ? 0 : errorTail.maxBytes ?? DEFAULT_ERROR_TAIL_BYTES;
  const errorTailCombined = errorTail !== false && errorTail.combined === true;
  const captureStdout = shouldCaptureForErrorTail(errorTail, "stdout", state.stdout.kind);
  const captureStderr = shouldCaptureForErrorTail(errorTail, "stderr", state.stderr.kind);
  let stdoutErrorRing;
  let stderrErrorRing;
  let combinedErrorRing;
  if (errorTailCombined && (captureStdout || captureStderr)) {
    combinedErrorRing = new ByteRingBuffer(errorTailMaxBytes);
    if (captureStdout)
      stdoutErrorRing = combinedErrorRing;
    if (captureStderr)
      stderrErrorRing = combinedErrorRing;
  } else {
    if (captureStdout)
      stdoutErrorRing = new ByteRingBuffer(errorTailMaxBytes);
    if (captureStderr)
      stderrErrorRing = new ByteRingBuffer(errorTailMaxBytes);
  }
  const tailEnabled = state.tailDisplay !== false;
  const stdoutShellKind = resolveShellKind(state.stdout.kind, tailEnabled, stdoutErrorRing != null);
  const stderrShellKind = resolveShellKind(state.stderr.kind, tailEnabled, stderrErrorRing != null);
  const stdoutInner = stdoutBuffer === "null" ? new NullPipeWriter() : stdoutBuffer === "inherit" ? stdout : stdoutBuffer;
  const stderrInner = stderrBuffer === "null" ? new NullPipeWriter() : stderrBuffer === "inherit" ? stderr : stderrBuffer;
  const stdout2 = new ShellPipeWriter(stdoutShellKind, stdoutErrorRing != null ? wrapWithErrorTailCapture(stdoutInner, stdoutErrorRing) : stdoutInner);
  const stderr2 = new ShellPipeWriter(stderrShellKind, stderrErrorRing != null ? wrapWithErrorTailCapture(stderrInner, stderrErrorRing) : stderrInner);
  const { text: commandText, fds } = state.command;
  const signal = killSignalController.signal;
  return new CommandChild(async (resolve8, reject) => {
    try {
      const list = parseCommand(commandText);
      const stdin2 = await takeStdin();
      let code2 = await spawn2(list, {
        stdin: stdin2 instanceof import_web2.ReadableStream ? readerFromStreamReader(stdin2.getReader()) : stdin2,
        stdout: stdout2,
        stderr: stderr2,
        env: buildEnv(state.env, state.clearEnv),
        commands: state.commands,
        cwd: state.cwd ?? process.cwd(),
        exportEnv: state.exportEnv,
        clearedEnv: state.clearEnv,
        signal,
        fds,
        shellOptions: state.shellOptions
      });
      if (code2 !== 0) {
        if (timedOut) {
          code2 = 124;
        }
        const noThrow = state.noThrow instanceof Array ? state.noThrow.includes(code2) : state.noThrow;
        if (!noThrow) {
          if (stdin2 instanceof import_web2.ReadableStream) {
            if (!stdin2.locked) {
              stdin2.cancel();
            }
          }
          throw new ShellError({
            exitCode: code2,
            timedOut,
            aborted: signal.aborted,
            stdoutRing: stdoutErrorRing,
            stderrRing: stderrErrorRing,
            combinedRing: combinedErrorRing
          });
        }
      }
      for (const tw of tailWriters)
        tw.finalize();
      const result = new CommandResult(code2, finalizeCommandResultBuffer(stdoutBuffer), finalizeCommandResultBuffer(stderrBuffer), combinedBuffer instanceof Buffer2 ? combinedBuffer : void 0, state.encoding);
      const maybeError = await cleanupDisposablesAndMaybeGetError(void 0);
      if (maybeError) {
        attachCallerStack(maybeError, callerStack);
        reject(maybeError);
      } else {
        resolve8(result);
      }
    } catch (err) {
      for (const tw of tailWriters)
        tw.finalizeForError();
      finalizeCommandResultBufferForError(stdoutBuffer, err);
      finalizeCommandResultBufferForError(stderrBuffer, err);
      const rejectErr = await cleanupDisposablesAndMaybeGetError(err);
      attachCallerStack(rejectErr, callerStack);
      reject(rejectErr);
    }
  }, {
    pipedStdoutBuffer: stdoutBuffer instanceof PipedBuffer ? stdoutBuffer : void 0,
    pipedStderrBuffer: stderrBuffer instanceof PipedBuffer ? stderrBuffer : void 0,
    killSignalController
  });
  async function cleanupDisposablesAndMaybeGetError(maybeError) {
    const errors = [];
    if (maybeError) {
      errors.push(maybeError);
    }
    for (const disposable of disposables) {
      try {
        disposable[Symbol.dispose]();
      } catch (err) {
        errors.push(err);
      }
    }
    if (asyncDisposables.length > 0) {
      await Promise.all(asyncDisposables.map(async (d) => {
        try {
          await d[Symbol.asyncDispose]();
        } catch (err) {
          errors.push(err);
        }
      }));
    }
    if (errors.length === 1) {
      return errors[0];
    } else if (errors.length > 1) {
      return new AggregateError(errors);
    } else {
      return void 0;
    }
  }
  async function takeStdin() {
    if (state.stdin instanceof Box) {
      const stdin2 = state.stdin.value;
      if (stdin2 === "consumed") {
        throw new Error("Cannot spawn command. Stdin was already consumed when a previous command using the same stdin was spawned. You need to call `.stdin(...)` again with a new value before spawning.");
      }
      state.stdin.value = "consumed";
      return stdin2;
    } else if (state.stdin instanceof Deferred) {
      const stdin2 = await state.stdin.create();
      if (stdin2 instanceof import_web2.ReadableStream) {
        asyncDisposables.push({
          async [Symbol.asyncDispose]() {
            if (!stdin2.locked) {
              await stdin2.cancel();
            }
          }
        });
      }
      return stdin2;
    } else {
      return state.stdin;
    }
  }
  function getBuffers() {
    const hasProgressBars = staticText.hasText();
    const tailOpts = resolvedTailWriterOptions;
    const stdoutTail = tailOpts && canTail(state.stdout.kind) ? new InheritTailWriter(stdout, tailOpts) : void 0;
    const stderrTail = tailOpts && canTail(state.stderr.kind) ? stdoutTail != null ? new InheritTailWriter(stderr, stdoutTail) : new InheritTailWriter(stderr, tailOpts) : void 0;
    const tailWriters2 = [];
    if (stdoutTail != null)
      tailWriters2.push(stdoutTail);
    if (stderrTail != null)
      tailWriters2.push(stderrTail);
    const stdoutBuffer2 = getOutputBuffer(stdout, state.stdout, stdoutTail);
    const stderrBuffer2 = getOutputBuffer(stderr, state.stderr, stderrTail);
    if (state.combinedStdoutStderr) {
      if (typeof stdoutBuffer2 === "string" || typeof stderrBuffer2 === "string") {
        throw new Error("Internal programming error. Expected writers for stdout and stderr.");
      }
      const combinedBuffer2 = new Buffer2();
      return [
        getCapturingBuffer(stdoutBuffer2, combinedBuffer2),
        getCapturingBuffer(stderrBuffer2, combinedBuffer2),
        combinedBuffer2,
        tailWriters2
      ];
    }
    return [stdoutBuffer2, stderrBuffer2, void 0, tailWriters2];
    function canTail(kind) {
      return kind === "inherit" || kind === "inheritPiped";
    }
    function getCapturingBuffer(buffer, combinedBuffer2) {
      if ("write" in buffer) {
        return new CapturingBufferWriter(buffer, combinedBuffer2);
      } else {
        return new CapturingBufferWriterSync(buffer, combinedBuffer2);
      }
    }
    function getOutputBuffer(inheritWriter, { kind, options }, tail) {
      if (typeof kind === "object") {
        if (kind instanceof Path) {
          const file = kind.openSync({ write: true, truncate: true, create: true });
          disposables.push({
            [Symbol.dispose]() {
              file.close();
            }
          });
          return file;
        } else if (kind instanceof import_web2.WritableStream) {
          const streamWriter = kind.getWriter();
          asyncDisposables.push({
            async [Symbol.asyncDispose]() {
              streamWriter.releaseLock();
              if (!options?.preventClose) {
                try {
                  await kind.close();
                } catch {
                }
              }
            }
          });
          return writerFromStreamWriter(streamWriter);
        } else {
          return kind;
        }
      }
      switch (kind) {
        case "inherit":
          if (tail != null) {
            return tail;
          } else if (hasProgressBars) {
            return new InheritStaticTextBypassWriter(inheritWriter);
          } else {
            return "inherit";
          }
        case "piped":
          return new PipedBuffer();
        case "inheritPiped":
          return new CapturingBufferWriterSync(tail ?? inheritWriter, new Buffer2());
        case "null":
          return "null";
        default: {
          const _assertNever = kind;
          throw new TypeError("Unhandled.");
        }
      }
    }
  }
  function finalizeCommandResultBuffer(buffer) {
    if (buffer instanceof CapturingBufferWriterSync || buffer instanceof CapturingBufferWriter) {
      return buffer.getBuffer();
    } else if (buffer instanceof InheritStaticTextBypassWriter) {
      buffer.flush();
      return "inherit";
    } else if (buffer instanceof InheritTailWriter) {
      return "inherit";
    } else if (buffer instanceof PipedBuffer) {
      buffer.close();
      return buffer.getBuffer() ?? "streamed";
    } else if (typeof buffer === "object") {
      return "streamed";
    } else {
      return buffer;
    }
  }
  function finalizeCommandResultBufferForError(buffer, error) {
    if (buffer instanceof InheritStaticTextBypassWriter) {
      buffer.flush();
    } else if (buffer instanceof PipedBuffer) {
      buffer.setError(error);
    }
  }
}
var ShellError = class extends Error {
  name = "ShellError";
  /** The process exit code. */
  exitCode;
  /** Whether the command was killed because its timeout elapsed. */
  timedOut;
  /** Whether the command was aborted via its kill signal. */
  aborted;
  /** Captured trailing stdout text from the error-tail ring buffer.
   * Empty string when stdout was not captured (e.g. routed to the
   * terminal, or errorTail disabled for stdout). */
  stdout;
  /** Captured trailing stderr text from the error-tail ring buffer.
   * Empty string when stderr was not captured. */
  stderr;
  #cachedMessage;
  #baseMessage;
  /** @internal */
  constructor(options) {
    super();
    this.exitCode = options.exitCode;
    this.timedOut = options.timedOut;
    this.aborted = options.aborted;
    if (options.timedOut) {
      this.#baseMessage = `Timed out with exit code: ${options.exitCode}`;
    } else if (options.aborted) {
      this.#baseMessage = `Aborted with exit code: ${options.exitCode}`;
    } else {
      this.#baseMessage = `Exited with code: ${options.exitCode}`;
    }
    if (options.combinedRing != null && options.combinedRing.size > 0) {
      const combined = textDecoder.decode(options.combinedRing.toBytes());
      this.stdout = combined;
      this.stderr = combined;
    } else {
      this.stdout = options.stdoutRing != null && options.stdoutRing.size > 0 ? textDecoder.decode(options.stdoutRing.toBytes()) : "";
      this.stderr = options.stderrRing != null && options.stderrRing.size > 0 ? textDecoder.decode(options.stderrRing.toBytes()) : "";
    }
    delete this.message;
  }
  get message() {
    if (this.#cachedMessage == null) {
      this.#cachedMessage = this.#baseMessage + formatErrorTailSuffix(this.stdout, this.stderr);
    }
    return this.#cachedMessage;
  }
  set message(value) {
    this.#cachedMessage = value;
  }
};
var CommandResult = class {
  #stdout;
  #stderr;
  #combined;
  #textDecoder;
  /** The exit code. */
  code;
  /** @internal */
  constructor(code2, stdout2, stderr2, combined, encoding) {
    this.code = code2;
    this.#stdout = stdout2;
    this.#stderr = stderr2;
    this.#combined = combined;
    this.#textDecoder = encoding ? new import_node_util2.TextDecoder(encoding) : textDecoder;
  }
  #memoizedStdout;
  /** Raw decoded stdout text. */
  get stdout() {
    if (!this.#memoizedStdout) {
      this.#memoizedStdout = this.#textDecoder.decode(this.stdoutBytes);
    }
    return this.#memoizedStdout;
  }
  #memoizedStdoutJson;
  /**
   * Stdout text as JSON.
   *
   * @remarks Will throw if it can't be parsed as JSON.
   */
  get stdoutJson() {
    if (this.#memoizedStdoutJson == null) {
      this.#memoizedStdoutJson = JSON.parse(this.stdout);
    }
    return this.#memoizedStdoutJson;
  }
  /** Raw stdout bytes. */
  get stdoutBytes() {
    if (this.#stdout === "streamed") {
      throw new Error(`Stdout was streamed to another source and is no longer available.`);
    }
    if (typeof this.#stdout === "string") {
      throw new Error(`Stdout was not piped (was ${this.#stdout}). Call .stdout("piped") or .stdout("inheritPiped") when building the command.`);
    }
    return this.#stdout.bytes({ copy: false });
  }
  #memoizedStderr;
  /** Raw decoded stdout text. */
  get stderr() {
    if (!this.#memoizedStderr) {
      this.#memoizedStderr = this.#textDecoder.decode(this.stderrBytes);
    }
    return this.#memoizedStderr;
  }
  #memoizedStderrJson;
  /**
   * Stderr text as JSON.
   *
   * @remarks Will throw if it can't be parsed as JSON.
   */
  get stderrJson() {
    if (this.#memoizedStderrJson == null) {
      this.#memoizedStderrJson = JSON.parse(this.stderr);
    }
    return this.#memoizedStderrJson;
  }
  /** Raw stderr bytes. */
  get stderrBytes() {
    if (this.#stderr === "streamed") {
      throw new Error(`Stderr was streamed to another source and is no longer available.`);
    }
    if (typeof this.#stderr === "string") {
      throw new Error(`Stderr was not piped (was ${this.#stderr}). Call .stderr("piped") or .stderr("inheritPiped") when building the command.`);
    }
    return this.#stderr.bytes({ copy: false });
  }
  #memoizedCombined;
  /** Raw combined stdout and stderr text. */
  get combined() {
    if (!this.#memoizedCombined) {
      this.#memoizedCombined = textDecoder.decode(this.combinedBytes);
    }
    return this.#memoizedCombined;
  }
  /** Raw combined stdout and stderr bytes. */
  get combinedBytes() {
    if (this.#combined == null) {
      throw new Error("Stdout and stderr were not combined. Call .captureCombined() when building the command.");
    }
    return this.#combined.bytes({ copy: false });
  }
};
function shouldCaptureForErrorTail(errorTail, stream, kind) {
  if (errorTail === false)
    return false;
  if (errorTail[stream] === false)
    return false;
  if (kind === "inherit" || kind === "inheritPiped")
    return false;
  return true;
}
function resolveShellKind(userKind, tailEnabled, errorTailEnabled) {
  if (!tailEnabled && !errorTailEnabled)
    return userKind;
  if (userKind === "inherit")
    return "inheritPiped";
  if (userKind === "null" && errorTailEnabled)
    return "piped";
  return userKind;
}
function wrapWithErrorTailCapture(inner, ring) {
  if ("write" in inner) {
    return new ErrorTailCaptureWriter(inner, ring);
  }
  return new ErrorTailCaptureWriterSync(inner, ring);
}
function formatErrorTailSuffix(stdoutText, stderrText) {
  if (stdoutText.length === 0 && stderrText.length === 0)
    return "";
  if (stdoutText === stderrText) {
    return `

${stripTrailingNewline(stdoutText)}`;
  }
  let suffix = "";
  if (stderrText.length > 0 && stdoutText.length > 0) {
    suffix += `

stderr:
${stripTrailingNewline(stderrText)}`;
    suffix += `

stdout:
${stripTrailingNewline(stdoutText)}`;
  } else if (stderrText.length > 0) {
    suffix += `

${stripTrailingNewline(stderrText)}`;
  } else {
    suffix += `

${stripTrailingNewline(stdoutText)}`;
  }
  return suffix;
}
function stripTrailingNewline(text) {
  if (text.endsWith("\r\n"))
    return text.slice(0, -2);
  if (text.endsWith("\n"))
    return text.slice(0, -1);
  return text;
}
function resolveTailWriterOptions(display, command, promoteHeaderOnSuccess) {
  const headerOpt = display.header;
  let header;
  let headerVerbatim = false;
  if (headerOpt === false) {
    header = void 0;
  } else if (typeof headerOpt === "function") {
    header = ({ size }) => headerOpt({ command, size });
    headerVerbatim = true;
  } else if (typeof headerOpt === "string") {
    header = headerOpt;
    headerVerbatim = true;
  } else {
    header = command;
  }
  return {
    maxLines: display.maxLines,
    header,
    headerVerbatim,
    errorHeader: command,
    promoteHeaderOnSuccess
  };
}
function buildEnv(env, clearEnv) {
  const result = clearEnv ? {} : getRealEnvVars();
  for (const [key, value] of Object.entries(env)) {
    if (value == null) {
      delete result[key];
    } else {
      result[key] = value;
    }
  }
  return result;
}
function escapeArg(arg) {
  if (/^[A-Za-z0-9]+$/.test(arg)) {
    return arg;
  } else {
    return `'${arg.replaceAll("'", `'"'"'`)}'`;
  }
}
var RawArg = class {
  #value;
  /** Creates a new `RawArg` wrapping the provided value. */
  constructor(value) {
    this.#value = value;
  }
  /** The wrapped value that will be used as-is during template substitution. */
  get value() {
    return this.#value;
  }
};
function rawArg(arg) {
  return new RawArg(arg);
}
function validateCommandName(command) {
  if (command.match(/^[a-zA-Z0-9-_]+$/) == null) {
    throw new TypeError("Invalid command name");
  }
}
var SHELL_SIGNAL_CTOR_SYMBOL = /* @__PURE__ */ Symbol();
var KillController = class {
  #state;
  #killSignal;
  constructor() {
    this.#state = {
      abortedCode: void 0,
      listeners: []
    };
    this.#killSignal = new KillSignal(SHELL_SIGNAL_CTOR_SYMBOL, this.#state);
  }
  /** The associated `KillSignal` to attach to commands. */
  get signal() {
    return this.#killSignal;
  }
  /** Send a signal to the downstream child process. Note that SIGTERM,
   * SIGKILL, SIGABRT, SIGQUIT, SIGINT, or SIGSTOP will cause all the commands
   * to be considered "aborted" and will return a 124 exit code, while other
   * signals will just be forwarded to the commands.
   */
  kill(signal = "SIGTERM") {
    sendSignalToState(this.#state, signal);
  }
};
var KillSignal = class {
  #state;
  /** @internal */
  constructor(symbol, state) {
    if (symbol !== SHELL_SIGNAL_CTOR_SYMBOL) {
      throw new Error("Constructing instances of KillSignal is not permitted.");
    }
    this.#state = state;
  }
  /** Returns if the command signal has ever received a SIGTERM,
   * SIGKILL, SIGABRT, SIGQUIT, SIGINT, or SIGSTOP
   */
  get aborted() {
    return this.#state.abortedCode !== void 0;
  }
  /** Gets the exit code to use if aborted. */
  get abortedExitCode() {
    return this.#state.abortedCode;
  }
  /**
   * Causes the provided kill signal to be triggered when this
   * signal receives a signal.
   */
  linkChild(killSignal) {
    const listener = (signal) => {
      sendSignalToState(killSignal.#state, signal);
    };
    this.addListener(listener);
    return {
      unsubscribe: () => {
        this.removeListener(listener);
      }
    };
  }
  /** Registers a listener that will be invoked whenever a signal is sent. */
  addListener(listener) {
    this.#state.listeners.push(listener);
  }
  /** Removes a previously registered listener. */
  removeListener(listener) {
    const index = this.#state.listeners.indexOf(listener);
    if (index >= 0) {
      this.#state.listeners.splice(index, 1);
    }
  }
};
function killSignalFromAbortSignal(abortSignal) {
  const controller = new KillController();
  if (abortSignal.aborted) {
    controller.kill("SIGTERM");
  } else {
    abortSignal.addEventListener("abort", () => {
      controller.kill("SIGTERM");
    }, { once: true });
  }
  return controller.signal;
}
function sendSignalToState(state, signal) {
  const code2 = getSignalAbortCode(signal);
  if (code2 !== void 0) {
    state.abortedCode = code2;
  }
  for (const listener of state.listeners) {
    listener(signal);
  }
}
function getSignalAbortCode(signal) {
  switch (signal) {
    case "SIGTERM":
      return 128 + 15;
    case "SIGKILL":
      return 128 + 9;
    case "SIGABRT":
      return 128 + 6;
    case "SIGQUIT":
      return 128 + 3;
    case "SIGINT":
      return 128 + 2;
    case "SIGSTOP":
      return 128 + 19;
    default:
      return void 0;
  }
}
function template(strings, exprs) {
  return templateInner(strings, exprs, escapeArg);
}
function templateRaw(strings, exprs) {
  return templateInner(strings, exprs, void 0);
}
function templateInner(strings, exprs, escape) {
  let nextStreamFd = 3;
  let text = "";
  let streams;
  const exprsCount = exprs.length;
  for (let i = 0; i < Math.max(strings.length, exprs.length); i++) {
    if (strings.length > i) {
      text += strings[i];
    }
    if (exprs.length > i) {
      try {
        const expr = exprs[i];
        if (expr == null) {
          throw "Expression was null or undefined.";
        }
        const inputOrOutputRedirect = detectInputOrOutputRedirect(text);
        if (inputOrOutputRedirect === "<") {
          if (expr instanceof Path) {
            text += templateLiteralExprToString(expr, escape);
          } else if (typeof expr === "string") {
            handleReadableStream(() => new import_web2.ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(expr));
                controller.close();
              }
            }));
          } else if (expr instanceof import_web2.ReadableStream) {
            handleReadableStream(() => expr);
          } else if (expr?.[symbols.readable]) {
            handleReadableStream(() => {
              const stream = expr[symbols.readable]?.();
              if (!(stream instanceof import_web2.ReadableStream)) {
                throw new TypeError(`Expected a ReadableStream or an object with a [$.symbols.readable] method that returns a ReadableStream at expression ${i + 1}/${exprsCount}.`);
              }
              return stream;
            });
          } else if (expr instanceof FsFileWrapper) {
            handleReadableStream(() => expr.readable);
          } else if (expr instanceof Uint8Array) {
            handleReadableStream(() => {
              return new import_web2.ReadableStream({
                start(controller) {
                  controller.enqueue(expr);
                  controller.close();
                }
              });
            });
          } else if (expr instanceof Response) {
            handleReadableStream(() => {
              return expr.body ?? new import_web2.ReadableStream({
                start(controller) {
                  controller.close();
                }
              });
            });
          } else if (expr instanceof Function) {
            handleReadableStream(() => {
              try {
                const result = expr();
                if (!(result instanceof import_web2.ReadableStream)) {
                  throw new TypeError("Function did not return a ReadableStream.");
                }
                return result;
              } catch (err) {
                throw new Error(`Error getting ReadableStream from function at expression ${i + 1}/${exprsCount}. ${errorToString(err)}`);
              }
            });
          } else {
            throw new TypeError("Unsupported object provided to input redirect.");
          }
        } else if (inputOrOutputRedirect === ">") {
          if (expr instanceof Path) {
            text += templateLiteralExprToString(expr, escape);
          } else if (expr instanceof import_web2.WritableStream) {
            handleWritableStream(() => expr);
          } else if (expr instanceof Uint8Array) {
            let pos = 0;
            handleWritableStream(() => {
              return new import_web2.WritableStream({
                write(chunk) {
                  const nextPos = chunk.length + pos;
                  if (nextPos > expr.length) {
                    const chunkLength = expr.length - pos;
                    expr.set(chunk.slice(0, chunkLength), pos);
                    throw new Error(`Overflow writing ${nextPos} bytes to Uint8Array (length: ${exprsCount}).`);
                  }
                  expr.set(chunk, pos);
                  pos = nextPos;
                }
              });
            });
          } else if (expr instanceof FsFileWrapper) {
            handleWritableStream(() => expr.writable);
          } else if (expr?.[symbols.writable]) {
            handleWritableStream(() => {
              const stream = expr[symbols.writable]?.();
              if (!(stream instanceof import_web2.WritableStream)) {
                throw new TypeError(`Expected a WritableStream or an object with a [$.symbols.writable] method that returns a WritableStream at expression ${i + 1}/${exprsCount}.`);
              }
              return stream;
            });
          } else if (expr instanceof Function) {
            handleWritableStream(() => {
              try {
                const result = expr();
                if (!(result instanceof import_web2.WritableStream)) {
                  throw new TypeError("Function did not return a WritableStream.");
                }
                return result;
              } catch (err) {
                throw new Error(`Error getting WritableStream from function at expression ${i + 1}/${exprsCount}. ${errorToString(err)}`);
              }
            });
          } else if (typeof expr === "string") {
            throw new TypeError("Cannot provide strings to output redirects. Did you mean to provide a path instead via the `$.path(...)` API?");
          } else {
            throw new TypeError("Unsupported object provided to output redirect.");
          }
        } else {
          text += templateLiteralExprToString(expr, escape);
        }
      } catch (err) {
        const startMessage = exprsCount === 1 ? "Failed resolving expression in command." : `Failed resolving expression ${i + 1}/${exprsCount} in command.`;
        const message = `${startMessage} ${errorToString(err)}`;
        if (err instanceof TypeError) {
          throw new TypeError(message);
        } else {
          throw new Error(message);
        }
      }
    }
  }
  return {
    text,
    fds: streams
  };
  function handleReadableStream(createStream) {
    streams ??= new StreamFds();
    const fd = nextStreamFd++;
    streams.insertReader(fd, () => {
      const reader = createStream().getReader();
      return {
        ...readerFromStreamReader(reader),
        [Symbol.dispose]() {
          reader.releaseLock();
        }
      };
    });
    text = text.trimEnd() + "&" + fd;
  }
  function handleWritableStream(createStream) {
    streams ??= new StreamFds();
    const fd = nextStreamFd++;
    streams.insertWriter(fd, () => {
      const stream = createStream();
      const writer = stream.getWriter();
      return {
        ...writerFromStreamWriter(writer),
        async [Symbol.asyncDispose]() {
          writer.releaseLock();
          try {
            await stream.close();
          } catch {
          }
        }
      };
    });
    text = text.trimEnd() + "&" + fd;
  }
}
function detectInputOrOutputRedirect(text) {
  text = text.trimEnd();
  if (text.endsWith(">")) {
    return ">";
  } else if (text.endsWith("<")) {
    return "<";
  } else {
    return void 0;
  }
}
function templateLiteralExprToString(expr, escape) {
  let result;
  if (typeof expr === "string") {
    result = expr;
  } else if (expr instanceof Array) {
    return expr.map((e) => templateLiteralExprToString(e, escape)).join(" ");
  } else if (expr instanceof CommandResult) {
    result = expr.stdout.replace(/\r?\n$/, "");
  } else if (expr instanceof CommandBuilder) {
    throw new TypeError("Providing a command builder is not yet supported (https://github.com/dsherret/dax/issues/239). Await the command builder's text before using it in an expression (ex. await $`cmd`.text()).");
  } else if (expr instanceof RawArg) {
    return templateLiteralExprToString(expr.value, void 0);
  } else if (typeof expr === "object" && expr.toString === Object.prototype.toString) {
    if (expr instanceof Promise) {
      throw new TypeError("Provided object was a Promise. Please await it before providing it.");
    } else {
      throw new TypeError("Provided object does not override `toString()`.");
    }
  } else {
    result = `${expr}`;
  }
  return escape ? escape(result) : result;
}
function writerFromStreamWriter(streamWriter) {
  return {
    async write(p) {
      await streamWriter.ready;
      await streamWriter.write(p);
      return p.length;
    }
  };
}
function isAwaitableReadable(value) {
  return value != null && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}
function captureCallerStack(skipUpTo) {
  const captureFn = Error.captureStackTrace;
  if (captureFn == null) {
    return new Error().stack;
  }
  const holder = {};
  captureFn(holder, skipUpTo);
  return holder.stack;
}
var proxyToCommandBuilder = /* @__PURE__ */ new WeakMap();
function wrapCommandBuilderNonThenable(builder) {
  const proxy = new Proxy(builder, {
    get(target, prop, _receiver) {
      if (prop === "then")
        return void 0;
      const value = Reflect.get(target, prop, target);
      if (typeof value === "function") {
        return (...args) => {
          const result = value.apply(target, args);
          if (result instanceof CommandBuilder) {
            return wrapCommandBuilderNonThenable(result);
          }
          return result;
        };
      }
      return value;
    }
  });
  proxyToCommandBuilder.set(proxy, builder);
  return proxy;
}
function unwrapCommandBuilder(result) {
  if (!(result instanceof CommandBuilder))
    return void 0;
  return proxyToCommandBuilder.get(result) ?? result;
}
function attachCallerStack(err, callerStack) {
  if (callerStack == null || !(err instanceof Error)) {
    return;
  }
  const newlineIdx = callerStack.indexOf("\n");
  if (newlineIdx === -1)
    return;
  const frames = callerStack.slice(newlineIdx + 1);
  if (frames.length === 0)
    return;
  err.stack = err.stack == null ? frames : `${err.stack}
${frames}`;
}
function splitLines2(text) {
  const lines = [];
  let start = 0;
  while (true) {
    const nl = text.indexOf("\n", start);
    if (nl === -1)
      break;
    const end = nl > start && text.charCodeAt(nl - 1) === 13 ? nl - 1 : nl;
    lines.push(text.substring(start, end));
    start = nl + 1;
  }
  if (start < text.length)
    lines.push(text.substring(start));
  return lines;
}
async function* iterateLines(child, kind) {
  const stream = kind === "stdout" ? child.stdout() : child.stderr();
  const reader = stream.getReader();
  const decoder2 = new import_node_util2.TextDecoder();
  let buffer = "";
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      if (value.length === 0)
        continue;
      buffer += decoder2.decode(value, { stream: true });
      let start = 0;
      while (true) {
        const nl = buffer.indexOf("\n", start);
        if (nl === -1)
          break;
        const end = nl > start && buffer.charCodeAt(nl - 1) === 13 ? nl - 1 : nl;
        yield buffer.substring(start, end);
        start = nl + 1;
      }
      if (start > 0)
        buffer = buffer.substring(start);
    }
    buffer += decoder2.decode();
    if (buffer !== "")
      yield buffer;
    completed = true;
  } finally {
    try {
      await reader.cancel();
    } catch {
    }
    if (!completed) {
      child.kill();
      try {
        await child;
      } catch {
      }
    } else {
      await child;
    }
  }
}
function build$FromState(state) {
  const tag = (strings, ...exprs) => state.commandBuilder.getValue()[setCommandTextStateSymbol](template(strings, exprs));
  const result = Object.assign(tag, {
    escapeArg,
    rawArg,
    raw(strings, ...exprs) {
      return state.commandBuilder.getValue()[setCommandTextStateSymbol](templateRaw(strings, exprs));
    },
    build$(opts = {}) {
      return build$FromState({
        commandBuilder: resolveCommandBuilder(opts.commandBuilder, state.commandBuilder),
        extras: { ...state.extras, ...opts.extras }
      });
    }
  }, state.extras ?? {});
  return result;
}
function resolveCommandBuilder(value, parent) {
  if (value instanceof CommandBuilder) {
    return new TreeBox(value);
  } else if (typeof value === "function") {
    const base = parent != null ? parent.getValue() : new CommandBuilder();
    return new TreeBox(value(base));
  } else {
    return parent != null ? parent.createChild() : new TreeBox(new CommandBuilder());
  }
}
function build$(opts = {}) {
  return build$FromState({
    commandBuilder: resolveCommandBuilder(opts.commandBuilder, void 0),
    extras: opts.extras
  });
}
var $ = build$();
var TimeoutError = class extends Error {
  constructor(message) {
    super(message);
  }
  get name() {
    return "TimeoutError";
  }
};
function delayToIterator(delay) {
  if (typeof delay !== "number" && typeof delay !== "string") {
    return delay;
  }
  const ms = delayToMs(delay);
  return {
    next() {
      return ms;
    }
  };
}
function formatMillis(ms) {
  if (ms < 1e3) {
    return `${formatValue(ms)} millisecond${ms === 1 ? "" : "s"}`;
  } else if (ms < 60 * 1e3) {
    const s = ms / 1e3;
    return `${formatValue(s)} ${pluralize("second", s)}`;
  } else {
    const mins = ms / 60 / 1e3;
    return `${formatValue(mins)} ${pluralize("minute", mins)}`;
  }
  function formatValue(value) {
    const text = value.toFixed(2);
    if (text.endsWith(".00")) {
      return value.toFixed(0);
    } else if (text.endsWith("0")) {
      return value.toFixed(1);
    } else {
      return text;
    }
  }
  function pluralize(text, value) {
    const suffix = value === 1 ? "" : "s";
    return text + suffix;
  }
}
function filterEmptyRecordValues(record) {
  const result = {};
  for (const [key, value] of Object.entries(record)) {
    if (value != null) {
      result[key] = value;
    }
  }
  return result;
}
function getFileNameFromUrl(url) {
  const parsedUrl = url instanceof URL ? url : new URL(url);
  const fileName = parsedUrl.pathname.split("/").at(-1);
  return fileName?.length === 0 ? void 0 : fileName;
}
var staticTextScope = staticText.createScope();
var _renderScope = renderInterval.start();
var LoggerRefreshItemKind;
(function(LoggerRefreshItemKind2) {
  LoggerRefreshItemKind2[LoggerRefreshItemKind2["ProgressBars"] = 0] = "ProgressBars";
  LoggerRefreshItemKind2[LoggerRefreshItemKind2["Selection"] = 1] = "Selection";
})(LoggerRefreshItemKind || (LoggerRefreshItemKind = {}));
var refreshItems = {
  [LoggerRefreshItemKind.ProgressBars]: void 0,
  [LoggerRefreshItemKind.Selection]: void 0
};
function setItems(kind, items, size) {
  refreshItems[kind] = items;
  refresh(size);
}
function refresh(size) {
  if (!isOutputTty) {
    return;
  }
  const items = Object.values(refreshItems).flatMap((items2) => items2 ?? []);
  staticTextScope.setText(items);
  staticText.refresh(size);
}
var logger = {
  setItems,
  logOnce(items, size) {
    staticTextScope.logAbove(items, size);
  },
  withTempClear(action) {
    staticText.withTempClear(action);
  }
};
var cached;
function tryOpen() {
  if (cached !== void 0)
    return cached;
  try {
    const path62 = import_node_process.default.platform === "win32" ? "\\\\.\\CONIN$" : "/dev/tty";
    const fd = fs10.openSync(path62, "r+");
    const stream = new tty.ReadStream(fd);
    cached = { fd, stream };
  } catch {
    cached = null;
  }
  return cached;
}
function hasFallbackTty() {
  return tryOpen() != null;
}
var ttyStdin = {
  read(p, options) {
    const signal = options?.signal;
    signal?.throwIfAborted();
    const handle = tryOpen();
    if (handle == null)
      return Promise.reject(new Error("No controlling terminal available."));
    return readTty(handle.stream, p, signal);
  },
  setRaw(mode) {
    const handle = tryOpen();
    if (handle == null)
      return;
    handle.stream.setRawMode(mode);
  }
};
function readTty(stream, p, signal) {
  return new Promise((resolve8, reject) => {
    const onReadable = () => {
      const chunk = stream.read();
      if (chunk === null)
        return;
      cleanup();
      const len = Math.min(chunk.length, p.length);
      p.set(chunk.subarray(0, len));
      if (chunk.length > len)
        stream.unshift(chunk.subarray(len));
      resolve8(len);
    };
    const onEnd = () => {
      cleanup();
      resolve8(null);
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    const cleanup = () => {
      stream.off("readable", onReadable);
      stream.off("end", onEnd);
      stream.off("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    stream.on("readable", onReadable);
    stream.on("end", onEnd);
    stream.on("error", onError);
    signal?.addEventListener("abort", onAbort, { once: true });
    onReadable();
  });
}
var encoder3 = new TextEncoder();
function resolvePromptInput() {
  if (isTerminal(stdin))
    return stdin;
  if (hasFallbackTty())
    return ttyStdin;
  return void 0;
}
var Keys;
(function(Keys2) {
  Keys2[Keys2["Up"] = 0] = "Up";
  Keys2[Keys2["Down"] = 1] = "Down";
  Keys2[Keys2["Left"] = 2] = "Left";
  Keys2[Keys2["Right"] = 3] = "Right";
  Keys2[Keys2["Enter"] = 4] = "Enter";
  Keys2[Keys2["Space"] = 5] = "Space";
  Keys2[Keys2["Backspace"] = 6] = "Backspace";
})(Keys || (Keys = {}));
async function* readKeys(reader, signal) {
  const decoder2 = new import_node_util2.TextDecoder();
  while (true) {
    const buf = new Uint8Array(8);
    const byteCount = await reader.read(buf, { signal });
    if (byteCount == null) {
      break;
    }
    if (byteCount === 3) {
      if (buf[0] === 27 && buf[1] === 91) {
        if (buf[2] === 65) {
          yield Keys.Up;
          continue;
        } else if (buf[2] === 66) {
          yield Keys.Down;
          continue;
        } else if (buf[2] === 67) {
          yield Keys.Right;
          continue;
        } else if (buf[2] === 68) {
          yield Keys.Left;
          continue;
        }
      }
    } else if (byteCount === 1) {
      if (buf[0] === 3) {
        break;
      } else if (buf[0] === 13) {
        yield Keys.Enter;
        continue;
      } else if (buf[0] === 14) {
        yield Keys.Down;
        continue;
      } else if (buf[0] === 16) {
        yield Keys.Up;
        continue;
      } else if (buf[0] === 32) {
        yield Keys.Space;
        continue;
      } else if (buf[0] === 127) {
        yield Keys.Backspace;
        continue;
      }
    }
    const text = stripAnsiCodes(decoder2.decode(buf.slice(0, byteCount ?? 0), { stream: true }));
    if (text.length > 0) {
      yield text;
    }
  }
}
function hideCursor() {
  stderr.writeSync(encoder3.encode("\x1B[?25l"));
}
function showCursor() {
  stderr.writeSync(encoder3.encode("\x1B[?25h"));
}
var isOutputTty = maybeConsoleSize() != null && isTerminal(stderr);
function isTerminal(pipe) {
  if (typeof pipe.isTerminal === "function") {
    return pipe.isTerminal();
  } else {
    throw new Error("Unsupported pipe.");
  }
}
function resultOrExit(result) {
  if (result == null) {
    process.exit(130);
  } else {
    return result;
  }
}
function undefinedOnAbort(signal, p) {
  if (signal == null)
    return p;
  return p.catch((err) => {
    if (signal.aborted && err === signal.reason)
      return void 0;
    throw err;
  });
}
var SelectionItem = class {
  index;
  value;
  constructor(index, value) {
    this.index = index;
    this.value = value;
  }
  [Symbol.toPrimitive](hint) {
    return hint === "string" ? String(this.index) : this.index;
  }
  toString() {
    return String(this.index);
  }
  valueOf() {
    return this.index;
  }
};
function createSelection(options) {
  const input = isOutputTty ? resolvePromptInput() : void 0;
  if (input == null) {
    throw new Error(`Cannot prompt when not a tty. (Prompt: '${options.message}')`);
  }
  if (maybeConsoleSize() == null) {
    throw new Error(`Cannot prompt when can't get console size. (Prompt: '${options.message}')`);
  }
  const { signal } = options;
  if (signal?.aborted) {
    return Promise.reject(signal.reason);
  }
  return ensureSingleSelection(input, async () => {
    logger.setItems(LoggerRefreshItemKind.Selection, options.render());
    try {
      for await (const key of readKeys(input, signal)) {
        const keyResult = options.onKey(key);
        if (keyResult != null)
          return keyResult;
        logger.setItems(LoggerRefreshItemKind.Selection, options.render());
      }
      return void 0;
    } finally {
      const size = {
        columns: process.stdout.columns ?? 80,
        rows: process.stdout.rows ?? 24
      };
      logger.setItems(LoggerRefreshItemKind.Selection, [], size);
      if (options.noClear) {
        logger.logOnce(options.render(), size);
      }
    }
  });
}
var lastPromise = Promise.resolve();
function ensureSingleSelection(input, action) {
  const currentLastPromise = lastPromise;
  const currentPromise = (async () => {
    try {
      await currentLastPromise;
    } catch {
    }
    hideCursor();
    try {
      input.setRaw(true);
      try {
        return await action();
      } finally {
        input.setRaw(false);
      }
    } finally {
      showCursor();
    }
  })();
  lastPromise = currentPromise;
  return currentPromise;
}
function alert(optsOrMessage, options) {
  const opts = typeof optsOrMessage === "string" ? { message: optsOrMessage, ...options } : optsOrMessage;
  return createSelection({
    message: opts.message,
    noClear: opts.noClear,
    signal: opts.signal,
    ...innerAlert(opts)
  }).then(resultOrExit).then(() => void 0);
}
function innerAlert(opts) {
  const requireEnter = opts.requireEnter ?? false;
  const drawState = {
    title: opts.message,
    requireEnter,
    hasCompleted: false
  };
  return {
    render: () => render(drawState),
    onKey: (key) => {
      if (!requireEnter || key === Keys.Enter) {
        drawState.hasCompleted = true;
        return true;
      }
      return void 0;
    }
  };
}
function render(state) {
  const hint = state.hasCompleted ? "" : state.requireEnter ? " [press enter]" : " [press any key]";
  return [
    bold(blue(state.title)) + dim(hint)
  ];
}
function confirm(optsOrMessage, options) {
  return maybeConfirm(optsOrMessage, options).then(resultOrExit);
}
function maybeConfirm(optsOrMessage, options) {
  const opts = typeof optsOrMessage === "string" ? { message: optsOrMessage, ...options } : optsOrMessage;
  return undefinedOnAbort(opts.signal, createSelection({
    message: opts.message,
    noClear: opts.noClear,
    signal: opts.signal,
    ...innerConfirm(opts)
  }));
}
function innerConfirm(opts) {
  const drawState = {
    title: opts.message,
    default: opts.default,
    inputText: "",
    hasCompleted: false
  };
  return {
    render: () => render2(drawState),
    onKey: (key) => {
      switch (key) {
        case "Y":
        case "y":
          drawState.inputText = "Y";
          break;
        case "N":
        case "n":
          drawState.inputText = "N";
          break;
        case Keys.Backspace:
          drawState.inputText = "";
          break;
        case Keys.Enter:
          if (drawState.inputText.length === 0) {
            if (drawState.default == null) {
              return void 0;
            }
            drawState.inputText = drawState.default ? "Y" : "N";
          }
          drawState.hasCompleted = true;
          return drawState.inputText === "Y" ? true : drawState.inputText === "N" ? false : drawState.default;
      }
    }
  };
}
function render2(state) {
  return [
    bold(blue(state.title)) + " " + (state.hasCompleted ? "" : state.default == null ? "(Y/N) " : state.default ? "(Y/n) " : "(y/N) ") + state.inputText + (state.hasCompleted ? "" : "\u2588")
    // (block character)
  ];
}
function multiSelect(opts) {
  return maybeMultiSelect(opts).then(resultOrExit);
}
function maybeMultiSelect(opts) {
  if (opts.options.length === 0) {
    throw new Error(`You must provide at least one option. (Prompt: '${opts.message}')`);
  }
  return undefinedOnAbort(opts.signal, createSelection({
    message: opts.message,
    noClear: opts.noClear,
    signal: opts.signal,
    ...innerMultiSelect(opts)
  }));
}
function innerMultiSelect(opts) {
  const drawState = {
    title: opts.message,
    activeIndex: 0,
    items: opts.options.map((option) => {
      if (typeof option === "string") {
        option = {
          text: option
        };
      }
      return {
        selected: option.selected ?? false,
        text: option.text
      };
    }),
    hasCompleted: false
  };
  return {
    render: () => render3(drawState),
    onKey: (key) => {
      switch (key) {
        case Keys.Up:
          if (drawState.activeIndex === 0) {
            drawState.activeIndex = drawState.items.length - 1;
          } else {
            drawState.activeIndex--;
          }
          break;
        case Keys.Down:
          drawState.activeIndex = (drawState.activeIndex + 1) % drawState.items.length;
          break;
        case Keys.Space: {
          const item = drawState.items[drawState.activeIndex];
          item.selected = !item.selected;
          break;
        }
        case Keys.Enter:
          drawState.hasCompleted = true;
          return drawState.items.map((item, index) => [item, index]).filter(([item]) => item.selected).map(([item, index]) => new SelectionItem(index, item.text));
      }
      return void 0;
    }
  };
}
function render3(state) {
  const items = [];
  items.push(bold(blue(state.title)));
  if (state.hasCompleted) {
    if (state.items.some((i) => i.selected)) {
      for (const item of state.items) {
        if (item.selected) {
          items.push({
            text: ` - ${item.text}`,
            indent: 3
          });
        }
      }
    } else {
      items.push(italic(" <None>"));
    }
  } else {
    for (const [i, item] of state.items.entries()) {
      const prefix = i === state.activeIndex ? "> " : "  ";
      items.push({
        text: `${prefix}[${item.selected ? "x" : " "}] ${item.text}`,
        indent: 6
      });
    }
  }
  return items;
}
var ProgressBar = class {
  #state;
  #pb;
  #withCount = 0;
  #onLog;
  #noClear;
  /** @internal */
  constructor(onLog, opts) {
    if (arguments.length !== 2) {
      throw new Error("Invalid usage. Create the progress bar via `$.progress`.");
    }
    this.#onLog = onLog;
    this.#state = {
      message: opts.message,
      prefix: opts.prefix,
      length: opts.length,
      currentPos: 0,
      tickCount: 0,
      hasCompleted: false,
      kind: "raw"
    };
    this.#pb = addProgressBar((size) => {
      this.#state.tickCount++;
      return renderProgressBar(this.#state, size);
    });
    this.#noClear = opts.noClear ?? false;
    this.#logIfNonInteractive();
  }
  /** Sets the prefix message/word, which will be displayed in green. */
  prefix(prefix) {
    this.#state.prefix = prefix;
    if (prefix != null && prefix.length > 0) {
      this.#logIfNonInteractive();
    }
    return this;
  }
  /** Sets the message the progress bar will display after the prefix in white. */
  message(message) {
    this.#state.message = message;
    if (message != null && message.length > 0) {
      this.#logIfNonInteractive();
    }
    return this;
  }
  /** Sets how to format the length values. */
  kind(kind) {
    this.#state.kind = kind;
    return this;
  }
  #logIfNonInteractive() {
    if (isOutputTty) {
      return;
    }
    let text = this.#state.prefix ?? "";
    if (text.length > 0) {
      text += " ";
    }
    text += this.#state.message ?? "";
    if (text.length > 0) {
      this.#onLog(text);
    }
  }
  /** Sets the current position of the progress bar. */
  position(position) {
    this.#state.currentPos = position;
    return this;
  }
  /** Increments the position of the progress bar. */
  increment(inc = 1) {
    this.#state.currentPos += inc;
    return this;
  }
  /** Sets the total length of the progress bar. */
  length(size) {
    this.#state.length = size;
    return this;
  }
  /** Whether the progress bar should output a summary when finished. */
  noClear(value = true) {
    this.#noClear = value;
    return this;
  }
  /** Forces a render to the console. */
  forceRender() {
    return staticText.refresh();
  }
  /** Finish showing the progress bar. */
  finish() {
    if (removeProgressBar(this.#pb)) {
      this.#state.hasCompleted = true;
      if (this.#noClear) {
        const size = maybeConsoleSize();
        const text = renderTextItems(renderProgressBar(this.#state, size), size);
        this.#onLog(text);
      }
    }
  }
  with(action) {
    this.#withCount++;
    let wasAsync = false;
    try {
      const result = action();
      if (result instanceof Promise) {
        wasAsync = true;
        return result.finally(() => {
          this.#decrementWith();
        });
      } else {
        return result;
      }
    } finally {
      if (!wasAsync) {
        this.#decrementWith();
      }
    }
  }
  #decrementWith() {
    this.#withCount--;
    if (this.#withCount === 0) {
      this.finish();
    }
  }
};
var tickStrings = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
function renderProgressBar(state, size) {
  if (state.hasCompleted) {
    let text = "";
    if (state.prefix != null) {
      text += green(state.prefix);
    }
    if (state.message != null) {
      if (text.length > 0) {
        text += " ";
      }
      text += state.message;
    }
    return text.length > 0 ? [text] : [];
  } else if (state.length == null || state.length === 0) {
    let text = green(tickStrings[Math.abs(state.tickCount) % tickStrings.length]);
    if (state.prefix != null) {
      text += ` ${green(state.prefix)}`;
    }
    if (state.message != null) {
      text += ` ${state.message}`;
    }
    if (state.currentPos > 0) {
      const currentPosText = state.kind === "bytes" ? humanDownloadSize(state.currentPos) : state.currentPos.toString();
      text += ` (${currentPosText}/?)`;
    }
    return [text];
  } else {
    let firstLine = "";
    if (state.prefix != null) {
      firstLine += green(state.prefix);
    }
    if (state.message != null) {
      if (firstLine.length > 0) {
        firstLine += " ";
      }
      firstLine += state.message;
    }
    const percent = Math.min(state.currentPos / state.length, 1);
    const currentPosText = state.kind === "bytes" ? humanDownloadSize(state.currentPos, state.length) : state.currentPos.toString();
    const lengthText = state.kind === "bytes" ? humanDownloadSize(state.length) : state.length.toString();
    const maxWidth = size == null ? 75 : Math.max(10, Math.min(75, size.columns - 5));
    const sameLineTextWidth = 6 + lengthText.length * 2 + state.length.toString().length * 2;
    const totalBars = Math.max(1, maxWidth - sameLineTextWidth);
    const completedBars = Math.floor(totalBars * percent);
    let secondLine = "";
    secondLine += "[";
    if (completedBars != totalBars) {
      if (completedBars > 0) {
        secondLine += cyan("#".repeat(completedBars - 1) + ">");
      }
      secondLine += blue("-".repeat(totalBars - completedBars));
    } else {
      secondLine += cyan("#".repeat(completedBars));
    }
    secondLine += `] (${currentPosText}/${lengthText})`;
    const result = [];
    if (firstLine.length > 0) {
      result.push(firstLine);
    }
    result.push(secondLine);
    return result;
  }
}
var progressBars = [];
function addProgressBar(render6) {
  progressBars.push(render6);
  refresh2();
  return render6;
}
function removeProgressBar(pb) {
  const index = progressBars.indexOf(pb);
  if (index === -1) {
    return false;
  }
  progressBars.splice(index, 1);
  refresh2();
  return true;
}
function refresh2() {
  logger.setItems(LoggerRefreshItemKind.ProgressBars, progressBars);
}
var units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
function humanDownloadSize(byteCount, totalBytes) {
  const exponentBasis = totalBytes ?? byteCount;
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(exponentBasis) / Math.log(1024)));
  const unit = units[exponent];
  const prettyBytes = (Math.floor(byteCount / Math.pow(1024, exponent) * 100) / 100).toFixed(exponent === 0 ? 0 : 2);
  return `${prettyBytes} ${unit}`;
}
var defaultMask = { char: "*", lastVisible: false };
function prompt(optsOrMessage, options) {
  return maybePrompt(optsOrMessage, options).then(resultOrExit);
}
function maybePrompt(optsOrMessage, options) {
  const opts = typeof optsOrMessage === "string" ? {
    message: optsOrMessage,
    ...options
  } : optsOrMessage;
  return undefinedOnAbort(opts.signal, createSelection({
    message: opts.message,
    noClear: opts.noClear,
    signal: opts.signal,
    ...innerPrompt(opts)
  }));
}
function innerPrompt(opts) {
  let mask = opts.mask ?? false;
  if (mask && typeof mask === "boolean") {
    mask = defaultMask;
  }
  const drawState = {
    title: opts.message,
    inputText: opts.default ?? "",
    mask,
    hasCompleted: false
  };
  return {
    render: () => render4(drawState),
    onKey: (key) => {
      if (typeof key === "string") {
        drawState.inputText += key;
      } else {
        switch (key) {
          case Keys.Space:
            drawState.inputText += " ";
            break;
          case Keys.Backspace:
            drawState.inputText = drawState.inputText.slice(0, -1);
            break;
          case Keys.Enter:
            drawState.hasCompleted = true;
            return drawState.inputText;
        }
      }
      return void 0;
    }
  };
}
function render4(state) {
  let { inputText } = state;
  if (state.mask) {
    const char = state.mask.char ?? defaultMask.char;
    const lastVisible = state.mask.lastVisible ?? defaultMask.lastVisible;
    const shouldShowLast = lastVisible && !state.hasCompleted;
    const safeLengthMinusOne = Math.max(0, inputText.length - 1);
    const masked = char.repeat(shouldShowLast ? safeLengthMinusOne : inputText.length);
    const unmasked = shouldShowLast ? inputText.slice(safeLengthMinusOne) : "";
    inputText = `${masked}${unmasked}`;
  }
  return [
    bold(blue(state.title)) + " " + inputText + (state.hasCompleted ? "" : "\u2588")
    // (block character)
  ];
}
function select(opts) {
  return maybeSelect(opts).then(resultOrExit);
}
function maybeSelect(opts) {
  if (opts.options.length < 1) {
    throw new Error(`You must provide at least one option. (Prompt: '${opts.message}')`);
  }
  return undefinedOnAbort(opts.signal, createSelection({
    message: opts.message,
    noClear: opts.noClear,
    signal: opts.signal,
    ...innerSelect(opts)
  }));
}
function innerSelect(opts) {
  const drawState = {
    title: opts.message,
    activeIndex: (opts.initialIndex ?? 0) % opts.options.length,
    items: opts.options,
    hasCompleted: false
  };
  return {
    render: () => render5(drawState),
    onKey: (key) => {
      switch (key) {
        case Keys.Up:
          if (drawState.activeIndex === 0) {
            drawState.activeIndex = drawState.items.length - 1;
          } else {
            drawState.activeIndex--;
          }
          break;
        case Keys.Down:
          drawState.activeIndex = (drawState.activeIndex + 1) % drawState.items.length;
          break;
        case Keys.Enter:
          drawState.hasCompleted = true;
          return new SelectionItem(drawState.activeIndex, drawState.items[drawState.activeIndex]);
      }
    }
  };
}
function render5(state) {
  const items = [];
  items.push(bold(blue(state.title)));
  if (state.hasCompleted) {
    items.push({
      text: ` - ${state.items[state.activeIndex]}`,
      indent: 3
    });
  } else {
    for (const [i, text] of state.items.entries()) {
      const prefix = i === state.activeIndex ? "> " : "  ";
      items.push({
        text: `${prefix}${text}`,
        indent: 4
      });
    }
  }
  return items;
}
var _a2;
var withProgressBarFactorySymbol = /* @__PURE__ */ Symbol();
var RequestBuilder = class {
  #state = void 0;
  #getClonedState() {
    const state = this.#state;
    if (state == null) {
      return this.#getDefaultState();
    }
    return {
      // be explicit here in order to force evaluation
      // of each property on a case by case basis
      noThrow: typeof state.noThrow === "boolean" ? state.noThrow : [...state.noThrow],
      url: state.url,
      body: state.body,
      cache: state.cache,
      headers: state.headers,
      integrity: state.integrity,
      keepalive: state.keepalive,
      method: state.method,
      mode: state.mode,
      redirect: state.redirect,
      referrer: state.referrer,
      referrerPolicy: state.referrerPolicy,
      progressBarFactory: state.progressBarFactory,
      progressOptions: state.progressOptions == null ? void 0 : {
        ...state.progressOptions
      },
      onProgress: [...state.onProgress],
      timeout: state.timeout,
      signal: state.signal,
      beforeRequest: state.beforeRequest
    };
  }
  #getDefaultState() {
    return {
      noThrow: false,
      url: void 0,
      body: void 0,
      cache: void 0,
      headers: {},
      integrity: void 0,
      keepalive: void 0,
      method: void 0,
      mode: void 0,
      redirect: void 0,
      referrer: void 0,
      referrerPolicy: void 0,
      progressBarFactory: void 0,
      progressOptions: void 0,
      onProgress: [],
      timeout: void 0,
      signal: void 0,
      beforeRequest: void 0
    };
  }
  #newWithState(action) {
    const builder = new _a2();
    const state = this.#getClonedState();
    action(state);
    builder.#state = state;
    return builder;
  }
  [symbols.readable]() {
    const self = this;
    let streamReader;
    let response;
    let wasCancelled = false;
    let cancelledReason;
    return new import_web2.ReadableStream({
      async start() {
        response = await self.fetch();
        const readable = response.readable;
        if (wasCancelled) {
          await readable.cancel(cancelledReason);
        } else {
          streamReader = readable.getReader();
        }
      },
      async pull(controller) {
        try {
          const { done, value } = await streamReader.read();
          if (done || value == null) {
            if (response?.signal?.aborted) {
              controller.error(response?.signal?.reason);
            } else {
              controller.close();
            }
          } else {
            controller.enqueue(value);
          }
        } catch (err) {
          try {
            streamReader?.releaseLock();
          } catch {
          }
          try {
            await response?.cancelBody();
          } catch {
          }
          throw err;
        }
      },
      async cancel(reason) {
        wasCancelled = true;
        cancelledReason = reason;
        try {
          if (streamReader != null) {
            await streamReader.cancel(reason);
          }
        } catch {
        }
        try {
          await response?.cancelBody();
        } catch {
        }
      }
    });
  }
  then(onfulfilled, onrejected) {
    return this.fetch().then(onfulfilled).catch(onrejected);
  }
  /** Fetches and gets the response. */
  fetch() {
    return this.#resolveStateForRequest().then(makeRequest).catch((err) => {
      if (err instanceof TimeoutError) {
        Error.captureStackTrace(err, TimeoutError);
      }
      return Promise.reject(err);
    });
  }
  async #resolveStateForRequest() {
    const callbacks = this.#state?.beforeRequest;
    if (callbacks == null || callbacks.length === 0) {
      return this.#getClonedState();
    }
    let builder = this.#newWithState((state) => {
      state.beforeRequest = void 0;
    });
    for (const cb of callbacks) {
      const proxy = wrapNonThenable(builder);
      const result = await cb(proxy);
      builder = unwrapBuilder(result) ?? builder;
    }
    return builder.#getClonedState();
  }
  /** Specifies the URL to send the request to. */
  url(value) {
    return this.#newWithState((state) => {
      state.url = value;
    });
  }
  header(nameOrItems, value) {
    return this.#newWithState((state) => {
      if (typeof nameOrItems === "string") {
        setHeader(state, nameOrItems, value);
      } else {
        for (const [name, value2] of Object.entries(nameOrItems)) {
          setHeader(state, name, value2);
        }
      }
    });
    function setHeader(state, name, value2) {
      name = name.toUpperCase();
      state.headers[name] = value2;
    }
  }
  noThrow(value, ...additional) {
    return this.#newWithState((state) => {
      if (typeof value === "boolean" || value == null) {
        state.noThrow = value ?? true;
      } else {
        state.noThrow = [value, ...additional];
      }
    });
  }
  body(value) {
    return this.#newWithState((state) => {
      state.body = value;
    });
  }
  cache(value) {
    return this.#newWithState((state) => {
      state.cache = value;
    });
  }
  integrity(value) {
    return this.#newWithState((state) => {
      state.integrity = value;
    });
  }
  keepalive(value) {
    return this.#newWithState((state) => {
      state.keepalive = value;
    });
  }
  method(value) {
    return this.#newWithState((state) => {
      state.method = value;
    });
  }
  mode(value) {
    return this.#newWithState((state) => {
      state.mode = value;
    });
  }
  /** @internal */
  [withProgressBarFactorySymbol](factory) {
    return this.#newWithState((state) => {
      state.progressBarFactory = factory;
    });
  }
  redirect(value) {
    return this.#newWithState((state) => {
      state.redirect = value;
    });
  }
  referrer(value) {
    return this.#newWithState((state) => {
      state.referrer = value;
    });
  }
  referrerPolicy(value) {
    return this.#newWithState((state) => {
      state.referrerPolicy = value;
    });
  }
  showProgress(value) {
    return this.#newWithState((state) => {
      if (value === true || value == null) {
        state.progressOptions = { noClear: false };
      } else if (value === false) {
        state.progressOptions = void 0;
      } else {
        state.progressOptions = {
          noClear: value.noClear ?? false
        };
      }
    });
  }
  /** Adds a callback that is invoked as bytes are received from the response body.
   *
   * The callback fires once per chunk read from the network with the cumulative
   * number of bytes received and the total expected size (from the `content-length`
   * header, or `undefined` if the server didn't provide one). Multiple callbacks
   * may be registered by calling this method repeatedly; each is invoked in the
   * order it was added.
   */
  onProgress(callback) {
    return this.#newWithState((state) => {
      state.onProgress.push(callback);
    });
  }
  /** Timeout the request after the specified delay throwing a `TimeoutError`. */
  timeout(delay) {
    return this.#newWithState((state) => {
      state.timeout = delay == null ? void 0 : delayToMs(delay);
    });
  }
  /** Sets an abort signal for the request. When the signal is
   * aborted, the request will be cancelled.
   */
  signal(signal) {
    return this.#newWithState((state) => {
      state.signal = signal;
    });
  }
  /** Registers a callback that runs just before each request is sent.
   *
   * The callback receives the current builder and may return a (possibly
   * modified) builder to use for the request. Useful for asynchronously
   * resolving values such as auth tokens.
   *
   * ```ts
   * $.request(url).beforeRequest(async (builder) => {
   *   return builder.header("Authorization", `Bearer ${await getAccessToken()}`);
   * });
   * ```
   *
   * Multiple `.beforeRequest(...)` calls compose: each registered callback runs
   * in the order it was added, with the builder produced by the previous one.
   *
   * The builder passed to the callback is in a special "passthrough" mode so
   * its `.then(...)` resolves with the builder itself (instead of fetching) —
   * this is what makes `return builder.header(...)` from an `async` function
   * safe. If you construct a fresh `new RequestBuilder()` inside the callback,
   * return it as `{ requestBuilder: ... }` to avoid accidental fetching.
   */
  beforeRequest(callback) {
    return this.#newWithState((state) => {
      state.beforeRequest = state.beforeRequest == null ? [callback] : [...state.beforeRequest, callback];
    });
  }
  /** Fetches and gets the response as an array buffer. */
  async arrayBuffer() {
    const response = await this.fetch();
    return response.arrayBuffer();
  }
  /** Fetches and gets the response as a blob. */
  async blob() {
    const response = await this.fetch();
    return response.blob();
  }
  /** Fetches and gets the response as form data. */
  async formData() {
    const response = await this.fetch();
    return response.formData();
  }
  /** Fetches and gets the response as JSON additionally setting
   * a JSON accept header if not set. */
  async json() {
    let builder = this;
    const acceptHeaderName = "ACCEPT";
    if (builder.#state == null || !Object.hasOwn(builder.#state.headers, acceptHeaderName)) {
      builder = builder.header(acceptHeaderName, "application/json");
    }
    const response = await builder.fetch();
    return response.json();
  }
  /** Fetches and gets the response as text. */
  async text() {
    const response = await this.fetch();
    return response.text();
  }
  /** Pipes the response body to the provided writable stream. */
  async pipeTo(dest, options) {
    const response = await this.fetch();
    return await response.pipeTo(dest, options);
  }
  async pipeToPath(filePathOrOptions, maybeOptions) {
    const { filePath, options } = resolvePipeToPathParams(filePathOrOptions, maybeOptions, this.#state?.url);
    const response = await this.fetch();
    return await response.pipeToPath(filePath, options);
  }
  /** Pipes the response body through the provided transform. */
  async pipeThrough(transform) {
    const response = await this.fetch();
    return response.pipeThrough(transform);
  }
};
_a2 = RequestBuilder;
var RequestResponse = class {
  #response;
  #downloadResponse;
  #originalUrl;
  #abortController;
  /** @internal */
  constructor(opts) {
    this.#originalUrl = opts.originalUrl;
    this.#response = opts.response;
    this.#abortController = opts.abortController;
    if (opts.response.body == null) {
      opts.abortController.clearTimeout();
    }
    if (opts.progressBar != null || opts.onProgress.length > 0) {
      const pb = opts.progressBar;
      const onProgress = opts.onProgress;
      const total = opts.contentLength;
      this.#downloadResponse = new Response(new import_web2.ReadableStream({
        async start(controller) {
          const reader = opts.response.body?.getReader();
          if (reader == null) {
            return;
          }
          let loaded = 0;
          let lockReleased = false;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done || value == null) {
                break;
              }
              loaded += value.byteLength;
              pb?.increment(value.byteLength);
              if (onProgress.length > 0) {
                const event = { loaded, total };
                for (const callback of onProgress) {
                  callback(event);
                }
              }
              controller.enqueue(value);
            }
            const signal = opts.abortController.controller.signal;
            if (signal.aborted) {
              controller.error(signal.reason);
            } else {
              controller.close();
            }
          } catch (err) {
            try {
              reader.releaseLock();
              lockReleased = true;
            } catch {
            }
            try {
              await opts.response.body?.cancel(err);
            } catch {
            }
            throw err;
          } finally {
            if (!lockReleased) {
              try {
                reader.releaseLock();
              } catch {
              }
            }
            pb?.finish();
          }
        },
        async cancel(reason) {
          try {
            await opts.response.body?.cancel(reason);
          } catch {
          }
        }
      }));
    } else {
      this.#downloadResponse = opts.response;
    }
  }
  /** Raw response. */
  get response() {
    return this.#response;
  }
  /** Response headers. */
  get headers() {
    return this.#response.headers;
  }
  /** If the response had a 2xx code. */
  get ok() {
    return this.#response.ok;
  }
  /** If the response is the result of a redirect. */
  get redirected() {
    return this.#response.redirected;
  }
  /** The underlying `AbortSignal` used to abort the request body
   * when a timeout is reached or when the `.abort()` method is called. */
  get signal() {
    return this.#abortController.controller.signal;
  }
  /** Status code of the response. */
  get status() {
    return this.#response.status;
  }
  /** Status text of the response. */
  get statusText() {
    return this.#response.statusText;
  }
  /** URL of the response. */
  get url() {
    return this.#response.url;
  }
  /** Aborts  */
  abort(reason) {
    this.#abortController?.controller.abort(reason);
  }
  /**
   * Throws if the response doesn't have a 2xx code.
   *
   * This might be useful if the request was built with `.noThrow()`, but
   * otherwise this is called automatically for any non-2xx response codes.
   *
   * Note: this does not consume the body. If you don't intend to read the
   * body, call `cancelBody()` first to release the underlying resources.
   */
  throwIfNotOk() {
    if (!this.ok) {
      throw new Error(`Error making request to ${this.#originalUrl}: ${this.statusText}`);
    }
  }
  /**
   * Cancels the response body, releasing the underlying resources.
   *
   * Useful in conjunction with `.noThrow()` and `throwIfNotOk()` when you
   * don't intend to read the body.
   */
  cancelBody() {
    return this.#withReturnHandling(async () => {
      await this.#response.body?.cancel();
    });
  }
  /**
   * Respose body as an array buffer.
   *
   * Note: Returns `undefined` when `.noThrow(404)` and status code is 404.
   */
  arrayBuffer() {
    return this.#withReturnHandling(async () => {
      if (this.#response.status === 404) {
        await this.#response.body?.cancel();
        return void 0;
      }
      return this.#downloadResponse.arrayBuffer();
    });
  }
  /**
   * Response body as a blog.
   *
   * Note: Returns `undefined` when `.noThrow(404)` and status code is 404.
   */
  blob() {
    return this.#withReturnHandling(async () => {
      if (this.#response.status === 404) {
        await this.#response.body?.cancel();
        return void 0;
      }
      return await this.#downloadResponse.blob();
    });
  }
  /**
   * Response body as a form data.
   *
   * Note: Returns `undefined` when `.noThrow(404)` and status code is 404.
   */
  formData() {
    return this.#withReturnHandling(async () => {
      if (this.#response.status === 404) {
        await this.#response.body?.cancel();
        return void 0;
      }
      return await this.#downloadResponse.formData();
    });
  }
  /**
   * Respose body as JSON.
   *
   * Note: Returns `undefined` when `.noThrow(404)` and status code is 404.
   */
  json() {
    return this.#withReturnHandling(async () => {
      if (this.#response.status === 404) {
        await this.#response.body?.cancel();
        return void 0;
      }
      return await this.#downloadResponse.json();
    });
  }
  /**
   * Respose body as text.
   *
   * Note: Returns `undefined` when `.noThrow(404)` and status code is 404.
   */
  text() {
    return this.#withReturnHandling(async () => {
      if (this.#response.status === 404) {
        await this.#response.body?.cancel();
        return void 0;
      }
      return await this.#downloadResponse.text();
    });
  }
  /** Pipes the response body to the provided writable stream. */
  pipeTo(dest, options) {
    return this.#withReturnHandling(() => this.readable.pipeTo(dest, options));
  }
  async pipeToPath(filePathOrOptions, maybeOptions) {
    const { filePath, options } = resolvePipeToPathParams(filePathOrOptions, maybeOptions, this.#originalUrl);
    const body = this.readable;
    try {
      const file = await filePath.open({
        write: true,
        create: true,
        truncate: true,
        ...options ?? {}
      });
      try {
        await body.pipeTo(file.writable, {
          preventClose: true
        });
        await file.writable.close();
      } finally {
        try {
          file.close();
        } catch {
        }
        this.#abortController?.clearTimeout();
      }
    } catch (err) {
      await this.#response.body?.cancel();
      throw err;
    }
    return filePath;
  }
  /** Pipes the response body through the provided transform. */
  pipeThrough(transform) {
    return this.readable.pipeThrough(transform);
  }
  get readable() {
    const body = this.#downloadResponse.body;
    if (body == null) {
      throw new Error("Response had no body.");
    }
    return body;
  }
  async #withReturnHandling(action) {
    try {
      return await action();
    } catch (err) {
      if (err instanceof TimeoutError) {
        Error.captureStackTrace(err);
      }
      try {
        await this.#response.body?.cancel(err);
      } catch {
      }
      throw err;
    } finally {
      this.#abortController.clearTimeout();
    }
  }
};
async function makeRequest(state) {
  if (state.url == null) {
    throw new Error("You must specify a URL before fetching.");
  }
  const abortController = getAbortController();
  let response;
  try {
    response = await fetch(state.url, {
      body: state.body,
      // @ts-ignore not supported in Node.js yet?
      cache: state.cache,
      headers: filterEmptyRecordValues(state.headers),
      integrity: state.integrity,
      keepalive: state.keepalive,
      method: state.method,
      mode: state.mode,
      redirect: state.redirect,
      referrer: state.referrer,
      referrerPolicy: state.referrerPolicy,
      signal: abortController.controller.signal
    });
  } catch (err) {
    abortController.clearTimeout();
    throw err;
  }
  const contentLength = getContentLength();
  const result = new RequestResponse({
    response,
    originalUrl: state.url.toString(),
    progressBar: getProgressBar(contentLength),
    onProgress: state.onProgress,
    contentLength,
    abortController
  });
  const shouldThrowOnError = !response.ok && (!state.noThrow || state.noThrow instanceof Array && !state.noThrow.includes(response.status));
  if (shouldThrowOnError) {
    try {
      await result.cancelBody();
    } catch {
    }
    result.throwIfNotOk();
  }
  return result;
  function getProgressBar(contentLength2) {
    if (state.progressOptions == null || state.progressBarFactory == null) {
      return void 0;
    }
    return state.progressBarFactory(`Download ${state.url}`).noClear(state.progressOptions.noClear).kind("bytes").length(contentLength2);
  }
  function getContentLength() {
    const contentLength2 = response.headers.get("content-length");
    if (contentLength2 == null) {
      return void 0;
    }
    const length = parseInt(contentLength2, 10);
    return isNaN(length) ? void 0 : length;
  }
  function getAbortController() {
    const baseController = getTimeoutAbortController() ?? {
      controller: new AbortController(),
      clearTimeout() {
      }
    };
    if (state.signal == null) {
      return baseController;
    }
    if (state.signal.aborted) {
      baseController.controller.abort(state.signal.reason);
      return baseController;
    }
    const onAbort = () => {
      baseController.controller.abort(state.signal.reason);
    };
    state.signal.addEventListener("abort", onAbort, { once: true });
    const originalClearTimeout = baseController.clearTimeout;
    return {
      controller: baseController.controller,
      clearTimeout() {
        originalClearTimeout();
        state.signal?.removeEventListener("abort", onAbort);
      }
    };
  }
  function getTimeoutAbortController() {
    if (state.timeout == null) {
      return void 0;
    }
    const timeout = state.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new TimeoutError(`Request timed out after ${formatMillis(timeout)}.`)), timeout);
    return {
      controller,
      clearTimeout() {
        clearTimeout(timeoutId);
      }
    };
  }
}
var proxyToBuilder = /* @__PURE__ */ new WeakMap();
function wrapNonThenable(builder) {
  const proxy = new Proxy(builder, {
    get(target, prop, _receiver) {
      if (prop === "then")
        return void 0;
      const value = Reflect.get(target, prop, target);
      if (typeof value === "function") {
        return (...args) => {
          const result = value.apply(target, args);
          if (result instanceof RequestBuilder) {
            return wrapNonThenable(result);
          }
          return result;
        };
      }
      return value;
    }
  });
  proxyToBuilder.set(proxy, builder);
  return proxy;
}
function unwrapBuilder(result) {
  if (!(result instanceof RequestBuilder))
    return void 0;
  return proxyToBuilder.get(result) ?? result;
}
function resolvePipeToPathParams(pathOrOptions, maybeOptions, originalUrl) {
  let filePath;
  let options;
  if (typeof pathOrOptions === "string" || pathOrOptions instanceof URL) {
    filePath = new Path(pathOrOptions).resolve();
    options = maybeOptions;
  } else if (pathOrOptions instanceof Path) {
    filePath = pathOrOptions.resolve();
    options = maybeOptions;
  } else if (typeof pathOrOptions === "object") {
    options = pathOrOptions;
  } else if (pathOrOptions === void 0) {
    options = maybeOptions;
  }
  if (filePath === void 0) {
    filePath = new Path(getFileNameFromUrlOrThrow(originalUrl));
  } else if (filePath.isDirSync()) {
    filePath = filePath.join(getFileNameFromUrlOrThrow(originalUrl));
  }
  filePath = filePath.resolve();
  return {
    filePath,
    options
  };
  function getFileNameFromUrlOrThrow(url) {
    const fileName = url == null ? void 0 : getFileNameFromUrl(url);
    if (fileName == null) {
      throw new Error("Could not derive the path from the request URL. Please explicitly provide a path.");
    }
    return fileName;
  }
}
function extend(target, source) {
  for (const prop in source) {
    if (Object.hasOwn(source, prop)) {
      target[prop] = source[prop];
    }
  }
  return target;
}
var reLeadingNewline = /^[ \t]*(?:\r\n|\r|\n)/;
var reTrailingNewline = /(?:\r\n|\r|\n)[ \t]*$/;
var reStartsWithNewlineOrIsEmpty = /^(?:[\r\n]|$)/;
var reDetectIndentation = /(?:\r\n|\r|\n)([ \t]*)(?:[^ \t\r\n]|$)/;
var reOnlyWhitespaceWithAtLeastOneNewline = /^[ \t]*[\r\n][ \t\r\n]*$/;
function _outdentArray(strings, firstInterpolatedValueSetsIndentationLevel, options) {
  let indentationLevel = 0;
  const match = strings[0].match(reDetectIndentation);
  if (match) {
    indentationLevel = match[1].length;
  }
  const reSource = `(\\r\\n|\\r|\\n).{0,${indentationLevel}}`;
  const reMatchIndent = new RegExp(reSource, "g");
  if (firstInterpolatedValueSetsIndentationLevel) {
    strings = strings.slice(1);
  }
  const { newline, trimLeadingNewline, trimTrailingNewline } = options;
  const normalizeNewlines = typeof newline === "string";
  const l = strings.length;
  const outdentedStrings = strings.map((v, i) => {
    v = v.replace(reMatchIndent, "$1");
    if (i === 0 && trimLeadingNewline) {
      v = v.replace(reLeadingNewline, "");
    }
    if (i === l - 1 && trimTrailingNewline) {
      v = v.replace(reTrailingNewline, "");
    }
    if (normalizeNewlines) {
      v = v.replace(/\r\n|\n|\r/g, (_) => newline);
    }
    return v;
  });
  return outdentedStrings;
}
function concatStringsAndValues(strings, values) {
  let ret = "";
  for (let i = 0, l = strings.length; i < l; i++) {
    ret += strings[i];
    if (i < l - 1) {
      ret += values[i];
    }
  }
  return ret;
}
function isTemplateStringsArray(v) {
  return Object.hasOwn(v, "raw") && Object.hasOwn(v, "length");
}
function createInstance(options) {
  const arrayAutoIndentCache = /* @__PURE__ */ new WeakMap();
  const arrayFirstInterpSetsIndentCache = /* @__PURE__ */ new WeakMap();
  function outdent(stringsOrOptions, ...values) {
    if (isTemplateStringsArray(stringsOrOptions)) {
      const strings = stringsOrOptions;
      const firstInterpolatedValueSetsIndentationLevel = (values[0] === outdent || values[0] === defaultOutdent) && reOnlyWhitespaceWithAtLeastOneNewline.test(strings[0]) && reStartsWithNewlineOrIsEmpty.test(strings[1]);
      const cache = firstInterpolatedValueSetsIndentationLevel ? arrayFirstInterpSetsIndentCache : arrayAutoIndentCache;
      let renderedArray = cache.get(strings);
      if (!renderedArray) {
        renderedArray = _outdentArray(strings, firstInterpolatedValueSetsIndentationLevel, options);
        cache.set(strings, renderedArray);
      }
      if (values.length === 0) {
        return renderedArray[0];
      }
      const rendered = concatStringsAndValues(renderedArray, firstInterpolatedValueSetsIndentationLevel ? values.slice(1) : values);
      return rendered;
    } else {
      return createInstance(extend(extend({}, options), stringsOrOptions || {}));
    }
  }
  const fullOutdent = extend(outdent, {
    string(str) {
      return _outdentArray([str], false, options)[0];
    }
  });
  return fullOutdent;
}
var defaultOutdent = createInstance({
  trimLeadingNewline: true,
  trimTrailingNewline: true
});
function sleep(delay) {
  const ms = delayToMs(delay);
  return new Promise((resolve8) => setTimeout(resolve8, ms));
}
async function withRetries($local, errorLogger, opts) {
  const delayIterator = delayToIterator(opts.delay);
  for (let i = 0; i < opts.count; i++) {
    if (i > 0) {
      const nextDelay = delayIterator.next();
      if (!opts.quiet) {
        $local.logWarn(`Failed. Trying again in ${formatMillis(nextDelay)}...`);
      }
      await sleep(nextDelay);
      if (!opts.quiet) {
        $local.logStep(`Retrying attempt ${i + 1}/${opts.count}...`);
      }
    }
    try {
      return await opts.action();
    } catch (err) {
      errorLogger(err);
    }
  }
  throw new Error(`Failed after ${opts.count} attempts.`);
}
function buildInitial$State(opts) {
  return {
    commandBuilder: new TreeBox(resolveCommandBuilder2()),
    requestBuilder: resolveRequestBuilder(),
    // deno-lint-ignore no-console
    infoLogger: new LoggerTreeBox(console.error),
    // deno-lint-ignore no-console
    warnLogger: new LoggerTreeBox(console.error),
    // deno-lint-ignore no-console
    errorLogger: new LoggerTreeBox(console.error),
    indentLevel: new Box(0),
    extras: opts.extras
  };
  function resolveCommandBuilder2() {
    if (opts.commandBuilder instanceof CommandBuilder) {
      return opts.commandBuilder;
    } else if (opts.commandBuilder instanceof Function) {
      return opts.commandBuilder(new CommandBuilder());
    } else {
      const _assertUndefined = opts.commandBuilder;
      return new CommandBuilder();
    }
  }
  function resolveRequestBuilder() {
    if (opts.requestBuilder instanceof RequestBuilder) {
      return opts.requestBuilder;
    } else if (opts.requestBuilder instanceof Function) {
      return opts.requestBuilder(new RequestBuilder());
    } else {
      const _assertUndefined = opts.requestBuilder;
      return new RequestBuilder();
    }
  }
}
var helperObject = {
  path: createPath,
  escapeArg,
  stripAnsi(text) {
    return stripAnsiCodes(text);
  },
  dedent: defaultOutdent,
  sleep,
  which(commandName) {
    return which(commandName, whichRealEnv);
  },
  whichSync(commandName) {
    return whichSync(commandName, whichRealEnv);
  }
};
function build$FromState2(state) {
  const logDepthObj = {
    get logDepth() {
      return state.indentLevel.value;
    },
    set logDepth(value) {
      if (value < 0 || value % 1 !== 0) {
        throw new Error("Expected a positive integer.");
      }
      state.indentLevel.value = value;
    }
  };
  const result = Object.assign((strings, ...exprs) => {
    const textState = template(strings, exprs);
    return state.commandBuilder.getValue()[setCommandTextStateSymbol](textState);
  }, helperObject, logDepthObj, {
    build$(opts = {}) {
      return build$FromState2({
        commandBuilder: resolveCommandBuilder2(),
        requestBuilder: resolveRequestBuilder(),
        errorLogger: state.errorLogger.createChild(),
        infoLogger: state.infoLogger.createChild(),
        warnLogger: state.warnLogger.createChild(),
        indentLevel: state.indentLevel,
        extras: {
          ...state.extras,
          ...opts.extras
        }
      });
      function resolveCommandBuilder2() {
        if (opts.commandBuilder instanceof CommandBuilder) {
          return new TreeBox(opts.commandBuilder);
        } else if (opts.commandBuilder instanceof Function) {
          return new TreeBox(opts.commandBuilder(state.commandBuilder.getValue()));
        } else {
          const _assertUndefined = opts.commandBuilder;
          return state.commandBuilder.createChild();
        }
      }
      function resolveRequestBuilder() {
        if (opts.requestBuilder instanceof RequestBuilder) {
          return opts.requestBuilder;
        } else if (opts.requestBuilder instanceof Function) {
          return opts.requestBuilder(state.requestBuilder);
        } else {
          const _assertUndefined = opts.requestBuilder;
          return state.requestBuilder;
        }
      }
    },
    log(...data) {
      state.infoLogger.getValue()(getLogText(data));
    },
    logLight(...data) {
      state.infoLogger.getValue()(gray(getLogText(data)));
    },
    logStep(firstArg, ...data) {
      logStep(firstArg, data, (t) => bold(green(t)), state.infoLogger.getValue());
    },
    logError(firstArg, ...data) {
      logStep(firstArg, data, (t) => bold(red(t)), state.errorLogger.getValue());
    },
    logWarn(firstArg, ...data) {
      logStep(firstArg, data, (t) => bold(yellow(t)), state.warnLogger.getValue());
    },
    logGroup(labelOrAction, maybeAction) {
      const label = typeof labelOrAction === "string" ? labelOrAction : void 0;
      if (label) {
        state.infoLogger.getValue()(getLogText([label]));
      }
      state.indentLevel.value++;
      const action = label != null ? maybeAction : labelOrAction;
      if (action != null) {
        let wasPromise = false;
        try {
          const result2 = action();
          if (result2 instanceof Promise) {
            wasPromise = true;
            return result2.finally(() => {
              if (state.indentLevel.value > 0) {
                state.indentLevel.value--;
              }
            });
          } else {
            return result2;
          }
        } finally {
          if (!wasPromise) {
            if (state.indentLevel.value > 0) {
              state.indentLevel.value--;
            }
          }
        }
      }
    },
    logGroupEnd() {
      if (state.indentLevel.value > 0) {
        state.indentLevel.value--;
      }
    },
    commandExists(commandName) {
      if (state.commandBuilder.getValue()[getRegisteredCommandNamesSymbol]().includes(commandName)) {
        return Promise.resolve(true);
      }
      return helperObject.which(commandName).then((c) => c != null);
    },
    commandExistsSync(commandName) {
      if (state.commandBuilder.getValue()[getRegisteredCommandNamesSymbol]().includes(commandName)) {
        return true;
      }
      return helperObject.whichSync(commandName) != null;
    },
    alert,
    maybeConfirm,
    confirm,
    maybeSelect,
    select,
    maybeMultiSelect,
    multiSelect,
    maybePrompt,
    prompt,
    progress(messageOrText, options) {
      const opts = typeof messageOrText === "string" ? (() => {
        const words = messageOrText.split(" ");
        return {
          prefix: words[0],
          message: words.length > 1 ? words.slice(1).join(" ") : void 0,
          ...options
        };
      })() : messageOrText;
      return new ProgressBar((...data) => {
        state.infoLogger.getValue()(...data);
      }, opts);
    },
    setInfoLogger(logger2) {
      state.infoLogger.setValue(logger2);
    },
    setWarnLogger(logger2) {
      state.warnLogger.setValue(logger2);
    },
    setErrorLogger(logger2) {
      state.errorLogger.setValue(logger2);
      const commandBuilder = state.commandBuilder.getValue();
      commandBuilder.setPrintCommandLogger((cmd) => logger2(white(">"), blue(cmd)));
      state.commandBuilder.setValue(commandBuilder);
    },
    setPrintCommand(value) {
      const commandBuilder = state.commandBuilder.getValue().printCommand(value);
      state.commandBuilder.setValue(commandBuilder);
    },
    setTailDisplay(value) {
      const builder = state.commandBuilder.getValue();
      const commandBuilder = typeof value === "boolean" ? builder.tailDisplay(value) : builder.tailDisplay(value);
      state.commandBuilder.setValue(commandBuilder);
    },
    setErrorTail(value) {
      const builder = state.commandBuilder.getValue();
      const commandBuilder = typeof value === "boolean" ? builder.errorTail(value) : builder.errorTail(value);
      state.commandBuilder.setValue(commandBuilder);
    },
    symbols,
    request(url) {
      return state.requestBuilder.url(url);
    },
    raw(strings, ...exprs) {
      const textState = templateRaw(strings, exprs);
      return state.commandBuilder.getValue()[setCommandTextStateSymbol](textState);
    },
    rawArg,
    withRetries(opts) {
      return withRetries(result, state.errorLogger.getValue(), opts);
    },
    all(values, transform) {
      const items = Array.from(values);
      const count = Math.max(1, items.length);
      const maxLines = ({ size }) => Math.max(3, Math.floor((size?.rows ?? 24) * 0.9 / count));
      return Promise.all(items.map((value) => {
        if (value instanceof CommandBuilder) {
          const configured = value.tailDisplay({ maxLines });
          return transform ? transform(configured) : configured;
        }
        return value;
      }));
    }
  }, state.extras);
  const keyName = "logDepth";
  Object.defineProperty(result, keyName, Object.getOwnPropertyDescriptor(logDepthObj, keyName));
  state.requestBuilder = state.requestBuilder[withProgressBarFactorySymbol]((message) => result.progress(message));
  return result;
  function getLogText(data) {
    const combinedText = data.map((d) => {
      const typeofD = typeof d;
      if (typeofD !== "object" && typeofD !== "undefined") {
        return d;
      } else {
        return (0, import_node_util3.inspect)(d, { colors: true });
      }
    }).join(" ");
    if (state.indentLevel.value === 0) {
      return combinedText;
    } else {
      const indentText = "  ".repeat(state.indentLevel.value);
      return combinedText.split(/\n/).map((l) => `${indentText}${l}`).join("\n");
    }
  }
  function logStep(firstArg, data, colourize, logger2) {
    if (data.length === 0) {
      let i = 0;
      while (i < firstArg.length && firstArg[i] === " ") {
        i++;
      }
      while (i < firstArg.length && firstArg[i] !== " ") {
        i++;
      }
      firstArg = colourize(firstArg.substring(0, i)) + firstArg.substring(i);
    } else {
      firstArg = colourize(firstArg);
    }
    logger2(getLogText([firstArg, ...data]));
  }
}
var $2 = build$FromState2(buildInitial$State({
  isGlobal: true
}));
function createPath(path62) {
  if (path62 instanceof Path) {
    return path62;
  } else {
    return new Path(path62);
  }
}

// src/common.ts
var PROJEN_DIR = ".projen";
var TASKS_MANIFEST_VERSION = 3;
var IS_TEST_RUN = process.env.NODE_ENV === "test";
var packageVersion = require_package().version;

// src/logging.ts
var import_chalk = __toESM(require_source());
var ICON = "\u{1F47E}";
var enabled2 = IS_TEST_RUN ? false : true;
function log(isError, color, ...text) {
  if (!enabled2 && !isError) {
    return;
  }
  console.error(`${ICON} ${color(...text)}`);
}
function debug(...text) {
  if (process.env.DEBUG) {
    log(false, import_chalk.default.gray, ...text);
  }
}
function verbose(...text) {
  log(false, import_chalk.default.white, ...text);
}
function info(...text) {
  log(false, import_chalk.default.cyan, ...text);
}
function warn(...text) {
  log(false, import_chalk.default.yellow, ...text);
}

// src/util/exec.ts
var child_process = __toESM(require("child_process"));
var MAX_BUFFER = 10 * 1024 * 1024;
function spawnOpts(options) {
  return {
    maxBuffer: MAX_BUFFER,
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : void 0,
    // run the program directly, without going through a shell
    shell: false
  };
}
function run2(file, args, options) {
  debug(`${file} ${args.join(" ")} (cwd: ${options.cwd})`);
  child_process.execFileSync(file, args, {
    ...spawnOpts(options),
    // By default the child's stdout is redirected to STDERR (to keep the
    // parent's STDOUT clean) and its STDERR is piped so it surfaces in
    // exceptions. `inheritStdio` instead streams both straight to the parent.
    stdio: options.inheritStdio ? "inherit" : ["inherit", 2, "pipe"]
  });
}
function capture(file, args, options) {
  debug(`${file} ${args.join(" ")} (cwd: ${options.cwd})`);
  return child_process.execFileSync(file, args, {
    ...spawnOpts(options),
    stdio: ["inherit", "pipe", "pipe"]
    // "pipe" for STDERR means it appears in exceptions
  }).toString("utf-8").trim();
}
function tryCapture(file, args, options) {
  debug(`${file} ${args.join(" ")} (cwd: ${options.cwd})`);
  try {
    const value = child_process.execFileSync(file, args, {
      ...spawnOpts(options),
      stdio: ["inherit", "pipe", "pipe"]
      // "pipe" for STDERR means it appears in exceptions
    }).toString("utf-8").trim();
    return value || void 0;
  } catch {
    return void 0;
  }
}
function tool(file) {
  return {
    run: (args, options) => run2(file, args, options),
    capture: (args, options) => capture(file, args, options),
    tryCapture: (args, options) => tryCapture(file, args, options)
  };
}
var git = tool("git");
var uv = tool("uv");
var poetry = tool("poetry");
var node = tool(process.execPath);
function shimTool(file) {
  const build = (args, options) => {
    const cmd = $2`${file} ${args}`.cwd(options.cwd).stderr("piped").noThrow();
    return options.env ? cmd.env(options.env) : cmd;
  };
  const ensureOk = (args, result) => {
    if (result.code !== 0) {
      const error = new Error(
        `Command failed (exit code ${result.code}): ${file} ${args.join(" ")}`
      );
      error.status = result.code;
      error.stderr = Buffer.from(result.stderr);
      throw error;
    }
  };
  return {
    run: async (args, options) => {
      debug(`${file} ${args.join(" ")} (cwd: ${options.cwd})`);
      ensureOk(args, await build(args, options));
    },
    capture: async (args, options) => {
      debug(`${file} ${args.join(" ")} (cwd: ${options.cwd})`);
      const result = await build(args, options).stdout("piped");
      ensureOk(args, result);
      return result.stdout.trim();
    }
  };
}
var npm = shimTool("npm");
var npx = shimTool("npx");
function systemShell(command, options) {
  debug(`${command} (cwd: ${options.cwd})`);
  const result = child_process.spawnSync(command, {
    cwd: options.cwd,
    shell: true,
    maxBuffer: MAX_BUFFER,
    env: options.env,
    // "pipe" for STDERR (when capturing) means it appears in exceptions.
    stdio: options.capture ? ["inherit", "pipe", "pipe"] : "inherit"
  });
  return {
    status: result.status,
    stdout: result.stdout ?? null,
    stderr: result.stderr ?? null,
    error: result.error
  };
}

// src/cli/task-runtime.ts
var parseConflictJSONModule = require_lib2();
var parseConflictJSON = parseConflictJSONModule?.default ?? parseConflictJSONModule;
var ENV_TRIM_LEN = 20;
var ARGS_MARKER = "$@";
var QUOTED_ARGS_MARKER = `"${ARGS_MARKER}"`;
function quoteArg(arg) {
  return '"' + arg.replace(/(["$`\\])/g, "\\$1") + '"';
}
function enrichBuiltinShellError(error, command) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/Not implemented:/.test(message)) {
    return error;
  }
  const commandLine = Array.isArray(command) ? command.join(" ") : command;
  return new Error(
    `projen's built-in shell can't run this command:
  ${commandLine}
To use your system's shell instead, set this task to TaskShell.system().`
  );
}
var TaskRuntime = class _TaskRuntime {
  /**
   * The project-relative path of the tasks manifest file.
   */
  static MANIFEST_FILE = path6.posix.join(
    PROJEN_DIR,
    "tasks.json"
  );
  /**
   * One-shot entrypoint for the standalone task runner.
   *
   * Creates a runtime rooted at the current working directory, runs the named
   * task, and converts any failure into a non-zero process exit code. This is
   * the single line invoked by the bundled `scripts/run-task.cjs` that
   * "projen eject" emits, which keeps the generated bundle footer trivial.
   *
   * @param name The name of the task to run. Defaults to `process.argv[2]`.
   */
  static async main(name = process.argv[2]) {
    try {
      await new _TaskRuntime(".").runTask(name);
    } catch (e) {
      console.error(e?.stack ?? String(e));
      process.exit(1);
    }
  }
  /**
   * The contents of tasks.json
   */
  _manifest = { tasks: {} };
  /**
   * The raw contents of the currently loaded manifest, used to detect changes
   * on disk so the runtime can reload a regenerated manifest mid-run.
   */
  _identity;
  /**
   * The root directory of the project and the cwd for executing tasks.
   */
  workdir;
  constructor(workdir) {
    this.workdir = (0, import_path.resolve)(workdir);
    this.reloadManifestIfChanged();
  }
  /**
   * The contents of tasks.json
   */
  get manifest() {
    return this._manifest;
  }
  /**
   * The absolute path of the tasks manifest file.
   */
  get manifestPath() {
    return (0, import_path.join)(this.workdir, _TaskRuntime.MANIFEST_FILE);
  }
  /**
   * The tasks in this project.
   */
  get tasks() {
    return Object.values(this.manifest.tasks ?? {});
  }
  /**
   * Find a task by name, or `undefined` if not found.
   */
  tryFindTask(name) {
    if (!this.manifest.tasks) {
      return void 0;
    }
    return this.manifest.tasks[name];
  }
  /**
   * Runs the task.
   * @param name The task name.
   */
  async runTask(name, parents = [], args = [], env = {}) {
    this.reloadManifestIfChanged();
    const task = this.tryFindTask(name);
    if (!task) {
      throw new Error(`cannot find command ${name}`);
    }
    await new RunTask(this, task, parents, args, env).run();
  }
  /**
   * Re-reads the tasks manifest from disk if its contents changed since it was
   * last loaded, verifying its schema version along the way.
   *
   * Change detection compares the raw file contents, so an unchanged manifest
   * is not re-verified or re-adopted.
   */
  reloadManifestIfChanged() {
    if (!(0, import_fs.existsSync)(this.manifestPath)) {
      this._manifest = { tasks: {} };
      this._identity = void 0;
      return;
    }
    const raw = (0, import_fs.readFileSync)(this.manifestPath, "utf-8");
    if (raw === this._identity) {
      return;
    }
    const manifest = parseConflictJSON(raw, void 0, "theirs");
    const isReload = this._identity !== void 0;
    this.verifyManifest(manifest);
    this._manifest = manifest;
    this._identity = raw;
    if (isReload) {
      debug(
        `${_TaskRuntime.MANIFEST_FILE} changed on disk; successfully loaded the new tasks manifest.`
      );
    }
  }
  /**
   * Validates a freshly read manifest:
   *
   * - Legacy manifests (no `manifestVersion`) are accepted as-is for backwards
   *   compatibility.
   * - Manifests from a newer projen (a higher `manifestVersion`) are accepted
   *   with a warning, since this runtime may not understand the schema.
   */
  verifyManifest(manifest) {
    if (manifest.manifestVersion === void 0) {
      return;
    }
    if (manifest.manifestVersion > TASKS_MANIFEST_VERSION) {
      warn(
        `${_TaskRuntime.MANIFEST_FILE} was generated by a newer version of projen (manifest version ${manifest.manifestVersion}, this projen supports up to ${TASKS_MANIFEST_VERSION}). Some tasks may not behave as expected; consider upgrading projen.`
      );
    }
  }
};
var RunTask = class {
  constructor(runtime, task, parents = [], args = [], envParam = {}) {
    this.runtime = runtime;
    this.task = task;
    this.args = args;
    this.envParam = envParam;
    this.workdir = task.cwd ?? this.runtime.workdir;
    this.parents = parents;
  }
  runtime;
  task;
  args;
  envParam;
  env = {};
  parents;
  workdir;
  /**
   * Executes the task. This was previously done in the constructor, but is now
   * an async method since shell execution is asynchronous (e.g. dax on
   * Windows).
   */
  async run() {
    const { task, args, parents } = this;
    if (!task.steps || task.steps.length === 0) {
      this.logDebug((0, import_chalk2.gray)("No actions have been specified for this task."));
      return;
    }
    this.env = await this.resolveEnvironment(
      this.envParam,
      parents,
      this.resolveShell()
    );
    const envlogs = [];
    for (const [k, v] of Object.entries(this.env)) {
      const vv = v ?? "";
      const trimmed = vv.length > ENV_TRIM_LEN ? vv.substring(0, ENV_TRIM_LEN) + "..." : vv;
      envlogs.push(`${k}=${trimmed}`);
    }
    if (envlogs.length) {
      this.logDebug((0, import_chalk2.gray)(`${(0, import_chalk2.underline)("env")}: ${envlogs.join(" ")}`));
    }
    if (!await this.evalCondition(task, this.resolveShell())) {
      this.log("condition exited with non-zero - skipping");
      return;
    }
    const merged = { ...process.env, ...this.env };
    const missing = new Array();
    for (const name of task.requiredEnv ?? []) {
      if (!(name in merged)) {
        missing.push(name);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `missing required environment variables: ${missing.join(",")}`
      );
    }
    for (const step of task.steps) {
      const stepShell = this.resolveShell(step);
      if (!await this.evalCondition(step, stepShell)) {
        this.log("condition exited with non-zero - skipping");
        continue;
      }
      const argsList = [
        ...step.args || [],
        ...step.receiveArgs ? args : []
      ].map((a) => a.toString());
      if (step.say) {
        info(this.fmtLog(step.say));
      }
      if (step.spawn) {
        await this.runtime.runTask(
          step.spawn,
          [...this.parents, this.task.name],
          argsList,
          step.env
        );
      }
      const execs = step.exec ? [step.exec] : [];
      const env = await this.evalEnvironment(step.env ?? {}, stepShell);
      if (step.builtin) {
        execs.push(this.renderBuiltin(step.builtin));
      }
      if (step.execArgs) {
        const argv = [];
        let placed = false;
        for (const element of step.execArgs) {
          if (element === ARGS_MARKER) {
            argv.push(...argsList);
            placed = true;
          } else {
            argv.push(element);
          }
        }
        if (!placed) {
          argv.push(...argsList);
        }
        execs.push(argv);
      }
      for (const exec of execs) {
        let command = exec;
        if (typeof command === "string") {
          if (command.includes(QUOTED_ARGS_MARKER)) {
            command = command.replace(
              QUOTED_ARGS_MARKER,
              argsList.map(quoteArg).join(" ")
            );
          } else if (command.includes(ARGS_MARKER)) {
            command = command.replace(ARGS_MARKER, argsList.join(" "));
          } else {
            command = [command, ...argsList].join(" ");
          }
        }
        const cwd2 = step.cwd;
        const result = await this.shell({
          command,
          cwd: cwd2,
          extraEnv: env,
          shell: stepShell
        });
        if (result.status !== 0) {
          throw new Error(
            `Task "${this.fullname}" failed when executing "${Array.isArray(command) ? command.join(" ") : command}" (cwd: ${(0, import_path.resolve)(cwd2 ?? this.workdir)})`
          );
        }
      }
    }
  }
  /**
   * Determines if a task should be executed based on "condition".
   *
   * @returns true if the task should be executed or false if the condition
   * evaluates to false (exits with non-zero), indicating that the task should
   * be skipped.
   */
  async evalCondition(taskOrStep, shell) {
    if (!taskOrStep.condition) {
      return true;
    }
    this.log((0, import_chalk2.gray)(`${(0, import_chalk2.underline)("condition")}: ${taskOrStep.condition}`));
    const result = await this.shell({
      command: taskOrStep.condition,
      quiet: true,
      shell
    });
    if (result.status === 0) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Evaluates environment variables from shell commands (e.g. `$(xx)`)
   */
  async evalEnvironment(env, shell) {
    const output = {};
    for (const [key, value] of Object.entries(env ?? {})) {
      if (String(value).startsWith("$(") && String(value).endsWith(")")) {
        const query = value.substring(2, value.length - 1);
        const result = await this.shell({
          command: query,
          quiet: true,
          captureOutput: true,
          shell
        });
        if (result.status !== 0) {
          const error = result.error ? result.error.stack : result.stderr?.toString().trim() || result.stdout?.toString().trim() || `command exited with code ${result.status}`;
          warn(
            this.fmtLog(
              `${(0, import_chalk2.underline)(key)}: unable to evaluate "${query}". Environment variable will be skipped. Check that the command exists and runs successfully.`
            )
          );
          warn(this.fmtLog(`${(0, import_chalk2.underline)(key)}: ${error}`));
        } else {
          output[key] = result.stdout?.toString("utf-8").trim() ?? "";
        }
      } else {
        output[key] = value;
      }
    }
    return output;
  }
  /**
   * Renders the runtime environment for a task. Namely, it supports this syntax
   * `$(xx)` for allowing environment to be evaluated by executing a shell
   * command and obtaining its result.
   */
  async resolveEnvironment(envParam, parents, shell) {
    let env = this.runtime.manifest.env ?? {};
    for (const parent of parents) {
      env = {
        ...env,
        ...this.runtime.tryFindTask(parent)?.env ?? {}
      };
    }
    env = {
      ...env,
      ...this.task.env ?? {},
      ...envParam
    };
    return this.evalEnvironment(env, shell);
  }
  /**
   * Resolves the shell for a step's command (or the task's, when no step is
   * given): step, then task, then project default, then "projen".
   */
  resolveShell(step) {
    return step?.shell ?? this.task.shell ?? this.runtime.manifest.shell ?? "projen";
  }
  /**
   * Returns the "full name" of the task which includes all it's parent task names concatenated by chevrons.
   */
  get fullname() {
    return [...this.parents, this.task.name].join(" \xBB ");
  }
  log(...args) {
    verbose(this.fmtLog(...args));
  }
  logDebug(...args) {
    debug(this.fmtLog(...args));
  }
  fmtLog(...args) {
    return (0, import_util.format)(`${(0, import_chalk2.underline)(this.fullname)} |`, ...args);
  }
  async shell(options) {
    const quiet = options.quiet ?? false;
    if (!quiet) {
      const log2 = new Array();
      log2.push(
        Array.isArray(options.command) ? options.command.join(" ") : options.command
      );
      if (options.cwd) {
        log2.push(`(cwd: ${options.cwd})`);
      }
      this.log(log2.join(" "));
    }
    const cwd2 = options.cwd ?? this.workdir;
    if (!(0, import_fs.existsSync)(cwd2) || !(0, import_fs.statSync)(cwd2).isDirectory()) {
      throw new Error(
        `invalid workdir (cwd): ${cwd2} must be an existing directory`
      );
    }
    const shell = options.shell ?? "projen";
    if (typeof shell === "string" && shell !== "projen" && shell !== "system") {
      throw new Error(
        `unknown built-in shell ${JSON.stringify(
          shell
        )}; use the built-in "projen" or "system" shells, or a TaskShell.command([...]) invocation`
      );
    }
    const capture2 = options.captureOutput ?? false;
    const command = options.command;
    const env = {
      ...process.env,
      ...this.env,
      ...options.extraEnv
    };
    if (shell === "system") {
      if (Array.isArray(command)) {
        const [program, ...args] = command;
        try {
          tool(program).run(args, { cwd: cwd2, env, inheritStdio: true });
          return { status: 0 };
        } catch (e) {
          if (typeof e?.status === "number") {
            return { status: e.status };
          }
          throw e;
        }
      }
      return systemShell(command, { cwd: cwd2, env, capture: capture2 });
    }
    const builder = this.buildDaxCommand(command, shell);
    let result;
    try {
      result = await builder.cwd(cwd2).env(env).stdout(capture2 ? "piped" : "inherit").stderr(capture2 ? "piped" : "inherit").noThrow();
    } catch (e) {
      throw enrichBuiltinShellError(e, command);
    }
    return {
      status: result.code,
      stdout: capture2 ? Buffer.from(result.stdoutBytes) : null,
      stderr: capture2 ? Buffer.from(result.stderrBytes) : null
    };
  }
  /**
   * Builds the dax command for the "projen" shell or an explicit invocation.
   * (The "system" shell is handled host-side, not here.) `command` is a shell
   * line (string) or an `execArgs` argv (string[]); `shell` is `"projen"` or an
   * invocation argv such as `["bash", "-c"]`.
   */
  buildDaxCommand(command, shell) {
    if (Array.isArray(shell)) {
      const [program, ...flags] = shell;
      const commandLine = Array.isArray(command) ? command.map(quoteArg).join(" ") : command;
      return $2`${program} ${[...flags, commandLine]}`;
    }
    return Array.isArray(command) ? (
      // execArgs: shell-free argv (each element escaped; `.cmd` shims resolved).
      $2`${command[0]} ${command.slice(1)}`
    ) : (
      // string command, parsed in-process by dax's cross-platform shell.
      $2.raw`${command}`
    );
  }
  renderBuiltin(builtin) {
    let moduleRoot = __dirname;
    while (!(0, import_fs.existsSync)((0, import_path.join)(moduleRoot, "package.json"))) {
      const parent = (0, import_path.dirname)(moduleRoot);
      if (parent === moduleRoot) {
        throw new Error("unable to locate the projen package root");
      }
      moduleRoot = parent;
    }
    const program = require.resolve((0, import_path.join)(moduleRoot, "lib", `${builtin}.task.js`));
    return `"${process.execPath}" "${program}"`;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TaskRuntime
});
TaskRuntime.main();
