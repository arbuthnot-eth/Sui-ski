// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/utils/suins.mjs
var SUI_NS_NAME_REGEX = /^(?!.*(^(?!@)|[-.@])($|[-.@]))(?:[a-z0-9-]{0,63}(?:\.[a-z0-9-]{0,63})*)?@[a-z0-9-]{0,63}$/i;
var SUI_NS_DOMAIN_REGEX = /^(?!.*(^|[-.])($|[-.]))(?:[a-z0-9-]{0,63}\.)+sui$/i;
var MAX_SUI_NS_NAME_LENGTH = 235;
function isValidSuiNSName(name) {
  if (name.length > MAX_SUI_NS_NAME_LENGTH)
    return false;
  if (name.includes("@"))
    return SUI_NS_NAME_REGEX.test(name);
  return SUI_NS_DOMAIN_REGEX.test(name);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/utils/move-registry.mjs
var NAME_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*)$/;
var VERSION_REGEX = /^\d+$/;
var MAX_APP_SIZE = 64;
var NAME_SEPARATOR = "/";
var isValidNamedPackage = (name) => {
  const parts = name.split(NAME_SEPARATOR);
  if (parts.length < 2 || parts.length > 3)
    return false;
  const [org, app, version] = parts;
  if (version !== undefined && !VERSION_REGEX.test(version))
    return false;
  if (!isValidSuiNSName(org))
    return false;
  return NAME_PATTERN.test(app) && app.length < MAX_APP_SIZE;
};
var isValidNamedType = (type) => {
  const splitType = type.split(/::|<|>|,/);
  for (const t of splitType)
    if (t.includes(NAME_SEPARATOR) && !isValidNamedPackage(t))
      return false;
  return isValidStructTag(type);
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+bcs@2.0.2/node_modules/@mysten/bcs/dist/uleb.mjs
function ulebEncode(num) {
  let bigNum = BigInt(num);
  const arr = [];
  let len = 0;
  if (bigNum === 0n)
    return [0];
  while (bigNum > 0) {
    arr[len] = Number(bigNum & 127n);
    bigNum >>= 7n;
    if (bigNum > 0n)
      arr[len] |= 128;
    len += 1;
  }
  return arr;
}
function ulebDecode(arr) {
  let total = 0n;
  let shift = 0n;
  let len = 0;
  while (true) {
    if (len >= arr.length)
      throw new Error("ULEB decode error: buffer overflow");
    const byte = arr[len];
    len += 1;
    total += BigInt(byte & 127) << shift;
    if ((byte & 128) === 0)
      break;
    shift += 7n;
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("ULEB decode error: value exceeds MAX_SAFE_INTEGER");
  return {
    value: Number(total),
    length: len
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+bcs@2.0.2/node_modules/@mysten/bcs/dist/reader.mjs
var BcsReader = class {
  constructor(data) {
    this.bytePosition = 0;
    this.dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }
  shift(bytes) {
    this.bytePosition += bytes;
    return this;
  }
  read8() {
    const value = this.dataView.getUint8(this.bytePosition);
    this.shift(1);
    return value;
  }
  read16() {
    const value = this.dataView.getUint16(this.bytePosition, true);
    this.shift(2);
    return value;
  }
  read32() {
    const value = this.dataView.getUint32(this.bytePosition, true);
    this.shift(4);
    return value;
  }
  read64() {
    const value1 = this.read32();
    const result = this.read32().toString(16) + value1.toString(16).padStart(8, "0");
    return BigInt("0x" + result).toString(10);
  }
  read128() {
    const value1 = BigInt(this.read64());
    const result = BigInt(this.read64()).toString(16) + value1.toString(16).padStart(16, "0");
    return BigInt("0x" + result).toString(10);
  }
  read256() {
    const value1 = BigInt(this.read128());
    const result = BigInt(this.read128()).toString(16) + value1.toString(16).padStart(32, "0");
    return BigInt("0x" + result).toString(10);
  }
  readBytes(num) {
    const start = this.bytePosition + this.dataView.byteOffset;
    const value = new Uint8Array(this.dataView.buffer, start, num);
    this.shift(num);
    return value;
  }
  readULEB() {
    const start = this.bytePosition + this.dataView.byteOffset;
    const { value, length } = ulebDecode(new Uint8Array(this.dataView.buffer, start));
    this.shift(length);
    return value;
  }
  readVec(cb) {
    const length = this.readULEB();
    const result = [];
    for (let i = 0;i < length; i++)
      result.push(cb(this, i, length));
    return result;
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@scure+base@2.0.0/node_modules/@scure/base/index.js
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(b) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
}
function isArrayOf(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn(input) {
  if (typeof input !== "function")
    throw new Error("function expected");
  return true;
}
function astr(label, input) {
  if (typeof input !== "string")
    throw new Error(`${label}: string expected`);
  return true;
}
function anumber(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new Error("array expected");
}
function astrArr(label, input) {
  if (!isArrayOf(true, input))
    throw new Error(`${label}: array of strings expected`);
}
function anumArr(label, input) {
  if (!isArrayOf(false, input))
    throw new Error(`${label}: array of numbers expected`);
}
function chain(...args) {
  const id = (a) => a;
  const wrap = (a, b) => (c) => a(b(c));
  const encode = args.map((x) => x.encode).reduceRight(wrap, id);
  const decode = args.map((x) => x.decode).reduce(wrap, id);
  return { encode, decode };
}
function alphabet(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === undefined)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
function join(separator = "") {
  astr("join", separator);
  return {
    encode: (from) => {
      astrArr("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr("join.decode", to);
      return to.split(separator);
    }
  };
}
function padding(bits, chr = "=") {
  anumber(bits);
  astr("padding", chr);
  return {
    encode(data) {
      astrArr("padding.encode", data);
      while (data.length * bits % 8)
        data.push(chr);
      return data;
    },
    decode(input) {
      astrArr("padding.decode", input);
      let end = input.length;
      if (end * bits % 8)
        throw new Error("padding: invalid, string should have whole number of bytes");
      for (;end > 0 && input[end - 1] === chr; end--) {
        const last = end - 1;
        const byte = last * bits;
        if (byte % 8 === 0)
          throw new Error("padding: invalid, string has too much padding");
      }
      return input.slice(0, end);
    }
  };
}
function normalize(fn) {
  afn(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
function convertRadix(data, from, to) {
  if (from < 2)
    throw new Error(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new Error(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos;i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0;i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
var radix2carry = (from, to) => from + (to - gcd(from, to));
var powers = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0;i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix2(data, from, to, padding2) {
  aArr(data);
  if (from <= 0 || from > 32)
    throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new Error(`convertRadix2: wrong to=${to}`);
  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers[from];
  const mask = powers[to] - 1;
  const res = [];
  for (const n of data) {
    anumber(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (;pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers[pos];
    if (pow === undefined)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding2 && pos >= from)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
function radix(num) {
  anumber(num);
  const _256 = 2 ** 8;
  return {
    encode: (bytes) => {
      if (!isBytes(bytes))
        throw new Error("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes), _256, num);
    },
    decode: (digits) => {
      anumArr("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num, _256));
    }
  };
}
function radix2(bits, revPadding = false) {
  anumber(bits);
  if (bits <= 0 || bits > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (bytes) => {
      if (!isBytes(bytes))
        throw new Error("radix2.encode input should be Uint8Array");
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr("radix2.decode", digits);
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  afn(fn);
  return function(...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
var base16 = chain(radix2(4), alphabet("0123456789ABCDEF"), join(""));
var base32 = chain(radix2(5), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), padding(5), join(""));
var base32nopad = chain(radix2(5), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), join(""));
var base32hex = chain(radix2(5), alphabet("0123456789ABCDEFGHIJKLMNOPQRSTUV"), padding(5), join(""));
var base32hexnopad = chain(radix2(5), alphabet("0123456789ABCDEFGHIJKLMNOPQRSTUV"), join(""));
var base32crockford = chain(radix2(5), alphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZ"), join(""), normalize((s) => s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")));
var hasBase64Builtin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toBase64 === "function" && typeof Uint8Array.fromBase64 === "function")();
var decodeBase64Builtin = (s, isUrl) => {
  astr("base64", s);
  const re = isUrl ? /^[A-Za-z0-9=_-]+$/ : /^[A-Za-z0-9=+/]+$/;
  const alphabet2 = isUrl ? "base64url" : "base64";
  if (s.length > 0 && !re.test(s))
    throw new Error("invalid base64");
  return Uint8Array.fromBase64(s, { alphabet: alphabet2, lastChunkHandling: "strict" });
};
var base64 = hasBase64Builtin ? {
  encode(b) {
    abytes(b);
    return b.toBase64();
  },
  decode(s) {
    return decodeBase64Builtin(s, false);
  }
} : chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), padding(6), join(""));
var base64nopad = chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), join(""));
var base64url = hasBase64Builtin ? {
  encode(b) {
    abytes(b);
    return b.toBase64({ alphabet: "base64url" });
  },
  decode(s) {
    return decodeBase64Builtin(s, true);
  }
} : chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), padding(6), join(""));
var base64urlnopad = chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), join(""));
var genBase58 = (abc) => chain(radix(58), alphabet(abc), join(""));
var base58 = genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
var base58flickr = genBase58("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ");
var base58xrp = genBase58("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz");
var BECH_ALPHABET = chain(alphabet("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), join(""));
var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 33554431) << 5;
  for (let i = 0;i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1)
      chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;
  for (let i = 0;i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126)
      throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0;i < len; i++)
    chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 31;
  for (let v of words)
    chk = bech32Polymod(chk) ^ v;
  for (let i = 0;i < 6; i++)
    chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % powers[30]], 30, 5, false));
}
function genBech32(encoding) {
  const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
  const _words = radix2(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode(prefix, words, limit = 90) {
    astr("bech32.encode prefix", prefix);
    if (isBytes(words))
      words = Array.from(words);
    anumArr("bech32.encode", words);
    const plen = prefix.length;
    if (plen === 0)
      throw new TypeError(`Invalid prefix length ${plen}`);
    const actualLength = plen + 7 + words.length;
    if (limit !== false && actualLength > limit)
      throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    const lowered = prefix.toLowerCase();
    const sum = bechChecksum(lowered, words, ENCODING_CONST);
    return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
  }
  function decode(str, limit = 90) {
    astr("bech32.decode input", str);
    const slen = str.length;
    if (slen < 8 || limit !== false && slen > limit)
      throw new TypeError(`invalid string length: ${slen} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase())
      throw new Error(`String must be lowercase or uppercase`);
    const sepIndex = lowered.lastIndexOf("1");
    if (sepIndex === 0 || sepIndex === -1)
      throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = lowered.slice(0, sepIndex);
    const data = lowered.slice(sepIndex + 1);
    if (data.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const words = BECH_ALPHABET.decode(data).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!data.endsWith(sum))
      throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return { prefix, words };
  }
  const decodeUnsafe = unsafeWrapper(decode);
  function decodeToBytes(str) {
    const { prefix, words } = decode(str, false);
    return { prefix, words, bytes: fromWords(words) };
  }
  function encodeFromBytes(prefix, bytes) {
    return encode(prefix, toWords(bytes));
  }
  return {
    encode,
    decode,
    encodeFromBytes,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
var bech32 = genBech32("bech32");
var bech32m = genBech32("bech32m");
var hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
var hexBuiltin = {
  encode(data) {
    abytes(data);
    return data.toHex();
  },
  decode(s) {
    astr("hex", s);
    return Uint8Array.fromHex(s);
  }
};
var hex = hasHexBuiltin ? hexBuiltin : chain(radix2(4), alphabet("0123456789abcdef"), join(""), normalize((s) => {
  if (typeof s !== "string" || s.length % 2 !== 0)
    throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+utils@0.3.1/node_modules/@mysten/utils/dist/b58.mjs
var toBase58 = (buffer) => base58.encode(buffer);
var fromBase58 = (str) => base58.decode(str);

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+utils@0.3.1/node_modules/@mysten/utils/dist/b64.mjs
function fromBase64(base64String) {
  return Uint8Array.from(atob(base64String), (char) => char.charCodeAt(0));
}
var CHUNK_SIZE = 8192;
function toBase64(bytes) {
  if (bytes.length < CHUNK_SIZE)
    return btoa(String.fromCharCode(...bytes));
  let output = "";
  for (var i = 0;i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    output += String.fromCharCode(...chunk);
  }
  return btoa(output);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+utils@0.3.1/node_modules/@mysten/utils/dist/hex.mjs
function fromHex(hexStr) {
  const normalized = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
  const padded = normalized.length % 2 === 0 ? normalized : `0${normalized}`;
  const intArr = padded.match(/[0-9a-fA-F]{2}/g)?.map((byte) => parseInt(byte, 16)) ?? [];
  if (intArr.length !== padded.length / 2)
    throw new Error(`Invalid hex string ${hexStr}`);
  return Uint8Array.from(intArr);
}
function toHex(bytes) {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+utils@0.3.1/node_modules/@mysten/utils/dist/chunk.mjs
function chunk(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => {
    return array.slice(i * size, (i + 1) * size);
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+utils@0.3.1/node_modules/@mysten/utils/dist/dataloader.mjs
var DataLoader = class {
  constructor(batchLoadFn, options) {
    if (typeof batchLoadFn !== "function")
      throw new TypeError(`DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but got: ${batchLoadFn}.`);
    this._batchLoadFn = batchLoadFn;
    this._maxBatchSize = getValidMaxBatchSize(options);
    this._batchScheduleFn = getValidBatchScheduleFn(options);
    this._cacheKeyFn = getValidCacheKeyFn(options);
    this._cacheMap = getValidCacheMap(options);
    this._batch = null;
    this.name = getValidName(options);
  }
  load(key) {
    if (key === null || key === undefined)
      throw new TypeError(`The loader.load() function must be called with a value, but got: ${String(key)}.`);
    const batch = getCurrentBatch(this);
    const cacheMap = this._cacheMap;
    let cacheKey;
    if (cacheMap) {
      cacheKey = this._cacheKeyFn(key);
      const cachedPromise = cacheMap.get(cacheKey);
      if (cachedPromise) {
        const cacheHits = batch.cacheHits || (batch.cacheHits = []);
        return new Promise((resolve) => {
          cacheHits.push(() => {
            resolve(cachedPromise);
          });
        });
      }
    }
    batch.keys.push(key);
    const promise = new Promise((resolve, reject) => {
      batch.callbacks.push({
        resolve,
        reject
      });
    });
    if (cacheMap)
      cacheMap.set(cacheKey, promise);
    return promise;
  }
  loadMany(keys) {
    if (!isArrayLike(keys))
      throw new TypeError(`The loader.loadMany() function must be called with Array<key>, but got: ${keys}.`);
    const loadPromises = [];
    for (let i = 0;i < keys.length; i++)
      loadPromises.push(this.load(keys[i]).catch((error) => error));
    return Promise.all(loadPromises);
  }
  clear(key) {
    const cacheMap = this._cacheMap;
    if (cacheMap) {
      const cacheKey = this._cacheKeyFn(key);
      cacheMap.delete(cacheKey);
    }
    return this;
  }
  clearAll() {
    const cacheMap = this._cacheMap;
    if (cacheMap)
      cacheMap.clear();
    return this;
  }
  prime(key, value) {
    const cacheMap = this._cacheMap;
    if (cacheMap) {
      const cacheKey = this._cacheKeyFn(key);
      if (cacheMap.get(cacheKey) === undefined) {
        let promise;
        if (value instanceof Error) {
          promise = Promise.reject(value);
          promise.catch(() => {});
        } else
          promise = Promise.resolve(value);
        cacheMap.set(cacheKey, promise);
      }
    }
    return this;
  }
};
var enqueuePostPromiseJob = typeof process === "object" && typeof process.nextTick === "function" ? function(fn) {
  if (!resolvedPromise)
    resolvedPromise = Promise.resolve();
  resolvedPromise.then(() => {
    process.nextTick(fn);
  });
} : typeof setImmediate === "function" ? function(fn) {
  setImmediate(fn);
} : function(fn) {
  setTimeout(fn);
};
var resolvedPromise;
function getCurrentBatch(loader) {
  const existingBatch = loader._batch;
  if (existingBatch !== null && !existingBatch.hasDispatched && existingBatch.keys.length < loader._maxBatchSize)
    return existingBatch;
  const newBatch = {
    hasDispatched: false,
    keys: [],
    callbacks: []
  };
  loader._batch = newBatch;
  loader._batchScheduleFn(() => {
    dispatchBatch(loader, newBatch);
  });
  return newBatch;
}
function dispatchBatch(loader, batch) {
  batch.hasDispatched = true;
  if (batch.keys.length === 0) {
    resolveCacheHits(batch);
    return;
  }
  let batchPromise;
  try {
    batchPromise = loader._batchLoadFn(batch.keys);
  } catch (e) {
    return failedDispatch(loader, batch, /* @__PURE__ */ new TypeError(`DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function errored synchronously: ${String(e)}.`));
  }
  if (!batchPromise || typeof batchPromise.then !== "function")
    return failedDispatch(loader, batch, /* @__PURE__ */ new TypeError(`DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise: ${String(batchPromise)}.`));
  Promise.resolve(batchPromise).then((values) => {
    if (!isArrayLike(values))
      throw new TypeError(`DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array: ${String(values)}.`);
    if (values.length !== batch.keys.length)
      throw new TypeError(`DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array of the same length as the Array of keys.

Keys:
${String(batch.keys)}

Values:
${String(values)}`);
    resolveCacheHits(batch);
    for (let i = 0;i < batch.callbacks.length; i++) {
      const value = values[i];
      if (value instanceof Error)
        batch.callbacks[i].reject(value);
      else
        batch.callbacks[i].resolve(value);
    }
  }).catch((error) => {
    failedDispatch(loader, batch, error);
  });
}
function failedDispatch(loader, batch, error) {
  resolveCacheHits(batch);
  for (let i = 0;i < batch.keys.length; i++) {
    loader.clear(batch.keys[i]);
    batch.callbacks[i].reject(error);
  }
}
function resolveCacheHits(batch) {
  if (batch.cacheHits)
    for (let i = 0;i < batch.cacheHits.length; i++)
      batch.cacheHits[i]();
}
function getValidMaxBatchSize(options) {
  if (!(!options || options.batch !== false))
    return 1;
  const maxBatchSize = options && options.maxBatchSize;
  if (maxBatchSize === undefined)
    return Infinity;
  if (typeof maxBatchSize !== "number" || maxBatchSize < 1)
    throw new TypeError(`maxBatchSize must be a positive number: ${maxBatchSize}`);
  return maxBatchSize;
}
function getValidBatchScheduleFn(options) {
  const batchScheduleFn = options && options.batchScheduleFn;
  if (batchScheduleFn === undefined)
    return enqueuePostPromiseJob;
  if (typeof batchScheduleFn !== "function")
    throw new TypeError(`batchScheduleFn must be a function: ${batchScheduleFn}`);
  return batchScheduleFn;
}
function getValidCacheKeyFn(options) {
  const cacheKeyFn = options && options.cacheKeyFn;
  if (cacheKeyFn === undefined)
    return (key) => key;
  if (typeof cacheKeyFn !== "function")
    throw new TypeError(`cacheKeyFn must be a function: ${cacheKeyFn}`);
  return cacheKeyFn;
}
function getValidCacheMap(options) {
  if (!(!options || options.cache !== false))
    return null;
  const cacheMap = options && options.cacheMap;
  if (cacheMap === undefined)
    return /* @__PURE__ */ new Map;
  if (cacheMap !== null) {
    const missingFunctions = [
      "get",
      "set",
      "delete",
      "clear"
    ].filter((fnName) => cacheMap && typeof cacheMap[fnName] !== "function");
    if (missingFunctions.length !== 0)
      throw new TypeError("Custom cacheMap missing methods: " + missingFunctions.join(", "));
  }
  return cacheMap;
}
function getValidName(options) {
  if (options && options.name)
    return options.name;
  return null;
}
function isArrayLike(x) {
  return typeof x === "object" && x !== null && "length" in x && typeof x.length === "number" && (x.length === 0 || x.length > 0 && Object.prototype.hasOwnProperty.call(x, x.length - 1));
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+bcs@2.0.2/node_modules/@mysten/bcs/dist/utils.mjs
function encodeStr(data, encoding) {
  switch (encoding) {
    case "base58":
      return toBase58(data);
    case "base64":
      return toBase64(data);
    case "hex":
      return toHex(data);
    default:
      throw new Error("Unsupported encoding, supported values are: base64, hex");
  }
}
function splitGenericParameters(str, genericSeparators = ["<", ">"]) {
  const [left, right] = genericSeparators;
  const tok = [];
  let word = "";
  let nestedAngleBrackets = 0;
  for (let i = 0;i < str.length; i++) {
    const char = str[i];
    if (char === left)
      nestedAngleBrackets++;
    if (char === right)
      nestedAngleBrackets--;
    if (nestedAngleBrackets === 0 && char === ",") {
      tok.push(word.trim());
      word = "";
      continue;
    }
    word += char;
  }
  tok.push(word.trim());
  return tok;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+bcs@2.0.2/node_modules/@mysten/bcs/dist/writer.mjs
var BcsWriter = class {
  constructor({ initialSize = 1024, maxSize = Infinity, allocateSize = 1024 } = {}) {
    this.bytePosition = 0;
    this.size = initialSize;
    this.maxSize = maxSize;
    this.allocateSize = allocateSize;
    this.dataView = new DataView(new ArrayBuffer(initialSize));
  }
  ensureSizeOrGrow(bytes) {
    const requiredSize = this.bytePosition + bytes;
    if (requiredSize > this.size) {
      const nextSize = Math.min(this.maxSize, Math.max(this.size + requiredSize, this.size + this.allocateSize));
      if (requiredSize > nextSize)
        throw new Error(`Attempting to serialize to BCS, but buffer does not have enough size. Allocated size: ${this.size}, Max size: ${this.maxSize}, Required size: ${requiredSize}`);
      this.size = nextSize;
      const nextBuffer = new ArrayBuffer(this.size);
      new Uint8Array(nextBuffer).set(new Uint8Array(this.dataView.buffer));
      this.dataView = new DataView(nextBuffer);
    }
  }
  shift(bytes) {
    this.bytePosition += bytes;
    return this;
  }
  write8(value) {
    this.ensureSizeOrGrow(1);
    this.dataView.setUint8(this.bytePosition, Number(value));
    return this.shift(1);
  }
  writeBytes(bytes) {
    this.ensureSizeOrGrow(bytes.length);
    for (let i = 0;i < bytes.length; i++)
      this.dataView.setUint8(this.bytePosition + i, bytes[i]);
    return this.shift(bytes.length);
  }
  write16(value) {
    this.ensureSizeOrGrow(2);
    this.dataView.setUint16(this.bytePosition, Number(value), true);
    return this.shift(2);
  }
  write32(value) {
    this.ensureSizeOrGrow(4);
    this.dataView.setUint32(this.bytePosition, Number(value), true);
    return this.shift(4);
  }
  write64(value) {
    toLittleEndian(BigInt(value), 8).forEach((el) => this.write8(el));
    return this;
  }
  write128(value) {
    toLittleEndian(BigInt(value), 16).forEach((el) => this.write8(el));
    return this;
  }
  write256(value) {
    toLittleEndian(BigInt(value), 32).forEach((el) => this.write8(el));
    return this;
  }
  writeULEB(value) {
    ulebEncode(value).forEach((el) => this.write8(el));
    return this;
  }
  writeVec(vector, cb) {
    this.writeULEB(vector.length);
    Array.from(vector).forEach((el, i) => cb(this, el, i, vector.length));
    return this;
  }
  *[Symbol.iterator]() {
    for (let i = 0;i < this.bytePosition; i++)
      yield this.dataView.getUint8(i);
    return this.toBytes();
  }
  toBytes() {
    return new Uint8Array(this.dataView.buffer.slice(0, this.bytePosition));
  }
  toString(encoding) {
    return encodeStr(this.toBytes(), encoding);
  }
};
function toLittleEndian(bigint, size) {
  const result = new Uint8Array(size);
  let i = 0;
  while (bigint > 0) {
    result[i] = Number(bigint % BigInt(256));
    bigint = bigint / BigInt(256);
    i += 1;
  }
  return result;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+bcs@2.0.2/node_modules/@mysten/bcs/dist/bcs-type.mjs
var BcsType = class BcsType2 {
  #write;
  #serialize;
  constructor(options) {
    this.name = options.name;
    this.read = options.read;
    this.serializedSize = options.serializedSize ?? (() => null);
    this.#write = options.write;
    this.#serialize = options.serialize ?? ((value, options$1) => {
      const writer = new BcsWriter({
        initialSize: this.serializedSize(value) ?? undefined,
        ...options$1
      });
      this.#write(value, writer);
      return writer.toBytes();
    });
    this.validate = options.validate ?? (() => {});
  }
  write(value, writer) {
    this.validate(value);
    this.#write(value, writer);
  }
  serialize(value, options) {
    this.validate(value);
    return new SerializedBcs(this, this.#serialize(value, options));
  }
  parse(bytes) {
    const reader = new BcsReader(bytes);
    return this.read(reader);
  }
  fromHex(hex2) {
    return this.parse(fromHex(hex2));
  }
  fromBase58(b64) {
    return this.parse(fromBase58(b64));
  }
  fromBase64(b64) {
    return this.parse(fromBase64(b64));
  }
  transform({ name, input, output, validate }) {
    return new BcsType2({
      name: name ?? this.name,
      read: (reader) => output ? output(this.read(reader)) : this.read(reader),
      write: (value, writer) => this.#write(input ? input(value) : value, writer),
      serializedSize: (value) => this.serializedSize(input ? input(value) : value),
      serialize: (value, options) => this.#serialize(input ? input(value) : value, options),
      validate: (value) => {
        validate?.(value);
        this.validate(input ? input(value) : value);
      }
    });
  }
};
var SERIALIZED_BCS_BRAND = Symbol.for("@mysten/serialized-bcs");
function isSerializedBcs(obj) {
  return !!obj && typeof obj === "object" && obj[SERIALIZED_BCS_BRAND] === true;
}
var SerializedBcs = class {
  #schema;
  #bytes;
  get [SERIALIZED_BCS_BRAND]() {
    return true;
  }
  constructor(schema, bytes) {
    this.#schema = schema;
    this.#bytes = bytes;
  }
  toBytes() {
    return this.#bytes;
  }
  toHex() {
    return toHex(this.#bytes);
  }
  toBase64() {
    return toBase64(this.#bytes);
  }
  toBase58() {
    return toBase58(this.#bytes);
  }
  parse() {
    return this.#schema.parse(this.#bytes);
  }
};
function fixedSizeBcsType({ size, ...options }) {
  return new BcsType({
    ...options,
    serializedSize: () => size
  });
}
function uIntBcsType({ readMethod, writeMethod, ...options }) {
  return fixedSizeBcsType({
    ...options,
    read: (reader) => reader[readMethod](),
    write: (value, writer) => writer[writeMethod](value),
    validate: (value) => {
      if (value < 0 || value > options.maxValue)
        throw new TypeError(`Invalid ${options.name} value: ${value}. Expected value in range 0-${options.maxValue}`);
      options.validate?.(value);
    }
  });
}
function bigUIntBcsType({ readMethod, writeMethod, ...options }) {
  return fixedSizeBcsType({
    ...options,
    read: (reader) => reader[readMethod](),
    write: (value, writer) => writer[writeMethod](BigInt(value)),
    validate: (val) => {
      const value = BigInt(val);
      if (value < 0 || value > options.maxValue)
        throw new TypeError(`Invalid ${options.name} value: ${value}. Expected value in range 0-${options.maxValue}`);
      options.validate?.(value);
    }
  });
}
function dynamicSizeBcsType({ serialize, ...options }) {
  const type = new BcsType({
    ...options,
    serialize,
    write: (value, writer) => {
      for (const byte of type.serialize(value).toBytes())
        writer.write8(byte);
    }
  });
  return type;
}
function stringLikeBcsType({ toBytes, fromBytes, ...options }) {
  return new BcsType({
    ...options,
    read: (reader) => {
      const length = reader.readULEB();
      return fromBytes(reader.readBytes(length));
    },
    write: (hex2, writer) => {
      const bytes = toBytes(hex2);
      writer.writeULEB(bytes.length);
      for (let i = 0;i < bytes.length; i++)
        writer.write8(bytes[i]);
    },
    serialize: (value) => {
      const bytes = toBytes(value);
      const size = ulebEncode(bytes.length);
      const result = new Uint8Array(size.length + bytes.length);
      result.set(size, 0);
      result.set(bytes, size.length);
      return result;
    },
    validate: (value) => {
      if (typeof value !== "string")
        throw new TypeError(`Invalid ${options.name} value: ${value}. Expected string`);
      options.validate?.(value);
    }
  });
}
function lazyBcsType(cb) {
  let lazyType = null;
  function getType() {
    if (!lazyType)
      lazyType = cb();
    return lazyType;
  }
  return new BcsType({
    name: "lazy",
    read: (data) => getType().read(data),
    serializedSize: (value) => getType().serializedSize(value),
    write: (value, writer) => getType().write(value, writer),
    serialize: (value, options) => getType().serialize(value, options).toBytes()
  });
}
var BcsStruct = class extends BcsType {
  constructor({ name, fields, ...options }) {
    const canonicalOrder = Object.entries(fields);
    super({
      name,
      serializedSize: (values) => {
        let total = 0;
        for (const [field, type] of canonicalOrder) {
          const size = type.serializedSize(values[field]);
          if (size == null)
            return null;
          total += size;
        }
        return total;
      },
      read: (reader) => {
        const result = {};
        for (const [field, type] of canonicalOrder)
          result[field] = type.read(reader);
        return result;
      },
      write: (value, writer) => {
        for (const [field, type] of canonicalOrder)
          type.write(value[field], writer);
      },
      ...options,
      validate: (value) => {
        options?.validate?.(value);
        if (typeof value !== "object" || value == null)
          throw new TypeError(`Expected object, found ${typeof value}`);
      }
    });
  }
};
var BcsEnum = class extends BcsType {
  constructor({ fields, ...options }) {
    const canonicalOrder = Object.entries(fields);
    super({
      read: (reader) => {
        const index = reader.readULEB();
        const enumEntry = canonicalOrder[index];
        if (!enumEntry)
          throw new TypeError(`Unknown value ${index} for enum ${options.name}`);
        const [kind, type] = enumEntry;
        return {
          [kind]: type?.read(reader) ?? true,
          $kind: kind
        };
      },
      write: (value, writer) => {
        const [name, val] = Object.entries(value).filter(([name$1]) => Object.hasOwn(fields, name$1))[0];
        for (let i = 0;i < canonicalOrder.length; i++) {
          const [optionName, optionType] = canonicalOrder[i];
          if (optionName === name) {
            writer.writeULEB(i);
            optionType?.write(val, writer);
            return;
          }
        }
      },
      ...options,
      validate: (value) => {
        options?.validate?.(value);
        if (typeof value !== "object" || value == null)
          throw new TypeError(`Expected object, found ${typeof value}`);
        const keys = Object.keys(value).filter((k) => value[k] !== undefined && Object.hasOwn(fields, k));
        if (keys.length !== 1)
          throw new TypeError(`Expected object with one key, but found ${keys.length} for type ${options.name}}`);
        const [variant] = keys;
        if (!Object.hasOwn(fields, variant))
          throw new TypeError(`Invalid enum variant ${variant}`);
      }
    });
  }
};
var BcsTuple = class extends BcsType {
  constructor({ fields, name, ...options }) {
    super({
      name: name ?? `(${fields.map((t) => t.name).join(", ")})`,
      serializedSize: (values) => {
        let total = 0;
        for (let i = 0;i < fields.length; i++) {
          const size = fields[i].serializedSize(values[i]);
          if (size == null)
            return null;
          total += size;
        }
        return total;
      },
      read: (reader) => {
        const result = [];
        for (const field of fields)
          result.push(field.read(reader));
        return result;
      },
      write: (value, writer) => {
        for (let i = 0;i < fields.length; i++)
          fields[i].write(value[i], writer);
      },
      ...options,
      validate: (value) => {
        options?.validate?.(value);
        if (!Array.isArray(value))
          throw new TypeError(`Expected array, found ${typeof value}`);
        if (value.length !== fields.length)
          throw new TypeError(`Expected array of length ${fields.length}, found ${value.length}`);
      }
    });
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+bcs@2.0.2/node_modules/@mysten/bcs/dist/bcs.mjs
function fixedArray(size, type, options) {
  return new BcsType({
    read: (reader) => {
      const result = new Array(size);
      for (let i = 0;i < size; i++)
        result[i] = type.read(reader);
      return result;
    },
    write: (value, writer) => {
      for (const item of value)
        type.write(item, writer);
    },
    ...options,
    name: options?.name ?? `${type.name}[${size}]`,
    validate: (value) => {
      options?.validate?.(value);
      if (!value || typeof value !== "object" || !("length" in value))
        throw new TypeError(`Expected array, found ${typeof value}`);
      if (value.length !== size)
        throw new TypeError(`Expected array of length ${size}, found ${value.length}`);
    }
  });
}
function option(type) {
  return bcs.enum(`Option<${type.name}>`, {
    None: null,
    Some: type
  }).transform({
    input: (value) => {
      if (value == null)
        return { None: true };
      return { Some: value };
    },
    output: (value) => {
      if (value.$kind === "Some")
        return value.Some;
      return null;
    }
  });
}
function vector(type, options) {
  return new BcsType({
    read: (reader) => {
      const length = reader.readULEB();
      const result = new Array(length);
      for (let i = 0;i < length; i++)
        result[i] = type.read(reader);
      return result;
    },
    write: (value, writer) => {
      writer.writeULEB(value.length);
      for (const item of value)
        type.write(item, writer);
    },
    ...options,
    name: options?.name ?? `vector<${type.name}>`,
    validate: (value) => {
      options?.validate?.(value);
      if (!value || typeof value !== "object" || !("length" in value))
        throw new TypeError(`Expected array, found ${typeof value}`);
    }
  });
}
function compareBcsBytes(a, b) {
  for (let i = 0;i < Math.min(a.length, b.length); i++)
    if (a[i] !== b[i])
      return a[i] - b[i];
  return a.length - b.length;
}
function map(keyType, valueType) {
  return new BcsType({
    name: `Map<${keyType.name}, ${valueType.name}>`,
    read: (reader) => {
      const length = reader.readULEB();
      const result = /* @__PURE__ */ new Map;
      for (let i = 0;i < length; i++)
        result.set(keyType.read(reader), valueType.read(reader));
      return result;
    },
    write: (value, writer) => {
      const entries = [...value.entries()].map(([key, val]) => [keyType.serialize(key).toBytes(), val]);
      entries.sort(([a], [b]) => compareBcsBytes(a, b));
      writer.writeULEB(entries.length);
      for (const [keyBytes, val] of entries) {
        writer.writeBytes(keyBytes);
        valueType.write(val, writer);
      }
    }
  });
}
var bcs = {
  u8(options) {
    return uIntBcsType({
      readMethod: "read8",
      writeMethod: "write8",
      size: 1,
      maxValue: 2 ** 8 - 1,
      ...options,
      name: options?.name ?? "u8"
    });
  },
  u16(options) {
    return uIntBcsType({
      readMethod: "read16",
      writeMethod: "write16",
      size: 2,
      maxValue: 2 ** 16 - 1,
      ...options,
      name: options?.name ?? "u16"
    });
  },
  u32(options) {
    return uIntBcsType({
      readMethod: "read32",
      writeMethod: "write32",
      size: 4,
      maxValue: 2 ** 32 - 1,
      ...options,
      name: options?.name ?? "u32"
    });
  },
  u64(options) {
    return bigUIntBcsType({
      readMethod: "read64",
      writeMethod: "write64",
      size: 8,
      maxValue: 2n ** 64n - 1n,
      ...options,
      name: options?.name ?? "u64"
    });
  },
  u128(options) {
    return bigUIntBcsType({
      readMethod: "read128",
      writeMethod: "write128",
      size: 16,
      maxValue: 2n ** 128n - 1n,
      ...options,
      name: options?.name ?? "u128"
    });
  },
  u256(options) {
    return bigUIntBcsType({
      readMethod: "read256",
      writeMethod: "write256",
      size: 32,
      maxValue: 2n ** 256n - 1n,
      ...options,
      name: options?.name ?? "u256"
    });
  },
  bool(options) {
    return fixedSizeBcsType({
      size: 1,
      read: (reader) => reader.read8() === 1,
      write: (value, writer) => writer.write8(value ? 1 : 0),
      ...options,
      name: options?.name ?? "bool",
      validate: (value) => {
        options?.validate?.(value);
        if (typeof value !== "boolean")
          throw new TypeError(`Expected boolean, found ${typeof value}`);
      }
    });
  },
  uleb128(options) {
    return dynamicSizeBcsType({
      read: (reader) => reader.readULEB(),
      serialize: (value) => {
        return Uint8Array.from(ulebEncode(value));
      },
      ...options,
      name: options?.name ?? "uleb128"
    });
  },
  bytes(size, options) {
    return fixedSizeBcsType({
      size,
      read: (reader) => reader.readBytes(size),
      write: (value, writer) => {
        writer.writeBytes(new Uint8Array(value));
      },
      ...options,
      name: options?.name ?? `bytes[${size}]`,
      validate: (value) => {
        options?.validate?.(value);
        if (!value || typeof value !== "object" || !("length" in value))
          throw new TypeError(`Expected array, found ${typeof value}`);
        if (value.length !== size)
          throw new TypeError(`Expected array of length ${size}, found ${value.length}`);
      }
    });
  },
  byteVector(options) {
    return new BcsType({
      read: (reader) => {
        const length = reader.readULEB();
        return reader.readBytes(length);
      },
      write: (value, writer) => {
        const array = new Uint8Array(value);
        writer.writeULEB(array.length);
        writer.writeBytes(array);
      },
      ...options,
      name: options?.name ?? "vector<u8>",
      serializedSize: (value) => {
        const length = "length" in value ? value.length : null;
        return length == null ? null : ulebEncode(length).length + length;
      },
      validate: (value) => {
        options?.validate?.(value);
        if (!value || typeof value !== "object" || !("length" in value))
          throw new TypeError(`Expected array, found ${typeof value}`);
      }
    });
  },
  string(options) {
    return stringLikeBcsType({
      toBytes: (value) => new TextEncoder().encode(value),
      fromBytes: (bytes) => new TextDecoder().decode(bytes),
      ...options,
      name: options?.name ?? "string"
    });
  },
  fixedArray,
  option,
  vector,
  tuple(fields, options) {
    return new BcsTuple({
      fields,
      ...options
    });
  },
  struct(name, fields, options) {
    return new BcsStruct({
      name,
      fields,
      ...options
    });
  },
  enum(name, fields, options) {
    return new BcsEnum({
      name,
      fields,
      ...options
    });
  },
  map,
  lazy(cb) {
    return lazyBcsType(cb);
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/utils/sui-types.mjs
var SUI_ADDRESS_LENGTH = 32;
function isValidSuiAddress(value) {
  return isHex(value) && getHexByteLength(value) === SUI_ADDRESS_LENGTH;
}
function isValidSuiObjectId(value) {
  return isValidSuiAddress(value);
}
var MOVE_IDENTIFIER_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;
function isValidMoveIdentifier(name) {
  return MOVE_IDENTIFIER_REGEX.test(name);
}
var PRIMITIVE_TYPE_TAGS = [
  "bool",
  "u8",
  "u16",
  "u32",
  "u64",
  "u128",
  "u256",
  "address",
  "signer"
];
var VECTOR_TYPE_REGEX = /^vector<(.+)>$/;
function isValidTypeTag(type) {
  if (PRIMITIVE_TYPE_TAGS.includes(type))
    return true;
  const vectorMatch = type.match(VECTOR_TYPE_REGEX);
  if (vectorMatch)
    return isValidTypeTag(vectorMatch[1]);
  if (type.includes("::"))
    return isValidStructTag(type);
  return false;
}
function isValidParsedStructTag(tag) {
  if (!isValidSuiAddress(tag.address) && !isValidNamedPackage(tag.address))
    return false;
  if (!isValidMoveIdentifier(tag.module) || !isValidMoveIdentifier(tag.name))
    return false;
  return tag.typeParams.every((param) => {
    if (typeof param === "string")
      return isValidTypeTag(param);
    return isValidParsedStructTag(param);
  });
}
function isValidStructTag(type) {
  try {
    return isValidParsedStructTag(parseStructTag(type));
  } catch {
    return false;
  }
}
function parseTypeTag(type) {
  if (!type.includes("::"))
    return type;
  return parseStructTag(type);
}
function parseStructTag(type) {
  const parts = type.split("::");
  if (parts.length < 3)
    throw new Error(`Invalid struct tag: ${type}`);
  const [address, module] = parts;
  const isMvrPackage = isValidNamedPackage(address);
  const rest = type.slice(address.length + module.length + 4);
  const name = rest.includes("<") ? rest.slice(0, rest.indexOf("<")) : rest;
  const typeParams = rest.includes("<") ? splitGenericParameters(rest.slice(rest.indexOf("<") + 1, rest.lastIndexOf(">"))).map((typeParam) => parseTypeTag(typeParam.trim())) : [];
  return {
    address: isMvrPackage ? address : normalizeSuiAddress(address),
    module,
    name,
    typeParams
  };
}
function normalizeStructTag(type) {
  const { address, module, name, typeParams } = typeof type === "string" ? parseStructTag(type) : type;
  return `${address}::${module}::${name}${typeParams?.length > 0 ? `<${typeParams.map((typeParam) => typeof typeParam === "string" ? typeParam : normalizeStructTag(typeParam)).join(",")}>` : ""}`;
}
function normalizeSuiAddress(value, forceAdd0x = false) {
  let address = value.toLowerCase();
  if (!forceAdd0x && address.startsWith("0x"))
    address = address.slice(2);
  return `0x${address.padStart(SUI_ADDRESS_LENGTH * 2, "0")}`;
}
function normalizeSuiObjectId(value, forceAdd0x = false) {
  return normalizeSuiAddress(value, forceAdd0x);
}
function isHex(value) {
  return /^(0x|0X)?[a-fA-F0-9]+$/.test(value) && value.length % 2 === 0;
}
function getHexByteLength(value) {
  return /^(0x|0X)/.test(value) ? (value.length - 2) / 2 : value.length / 2;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/valibot@1.2.0_typescript@5.9.3/node_modules/valibot/dist/index.mjs
var store$4;
function getGlobalConfig(config$1) {
  return {
    lang: config$1?.lang ?? store$4?.lang,
    message: config$1?.message,
    abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
    abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
  };
}
var store$3;
function getGlobalMessage(lang) {
  return store$3?.get(lang);
}
var store$2;
function getSchemaMessage(lang) {
  return store$2?.get(lang);
}
var store$1;
function getSpecificMessage(reference, lang) {
  return store$1?.get(reference)?.get(lang);
}
function _stringify(input) {
  const type = typeof input;
  if (type === "string")
    return `"${input}"`;
  if (type === "number" || type === "bigint" || type === "boolean")
    return `${input}`;
  if (type === "object" || type === "function")
    return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
  return type;
}
function _addIssue(context, label, dataset, config$1, other) {
  const input = other && "input" in other ? other.input : dataset.value;
  const expected = other?.expected ?? context.expects ?? null;
  const received = other?.received ?? /* @__PURE__ */ _stringify(input);
  const issue = {
    kind: context.kind,
    type: context.type,
    input,
    expected,
    received,
    message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
    requirement: context.requirement,
    path: other?.path,
    issues: other?.issues,
    lang: config$1.lang,
    abortEarly: config$1.abortEarly,
    abortPipeEarly: config$1.abortPipeEarly
  };
  const isSchema = context.kind === "schema";
  const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
  if (message$1 !== undefined)
    issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
  if (isSchema)
    dataset.typed = false;
  if (dataset.issues)
    dataset.issues.push(issue);
  else
    dataset.issues = [issue];
}
function _getStandardProps(context) {
  return {
    version: 1,
    vendor: "valibot",
    validate(value$1) {
      return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
    }
  };
}
function _isValidObjectKey(object$1, key) {
  return Object.hasOwn(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
function _joinExpects(values$1, separator) {
  const list = [...new Set(values$1)];
  if (list.length > 1)
    return `(${list.join(` ${separator} `)})`;
  return list[0] ?? "never";
}
var ValiError = class extends Error {
  constructor(issues) {
    super(issues[0].message);
    this.name = "ValiError";
    this.issues = issues;
  }
};
function check(requirement, message$1) {
  return {
    kind: "validation",
    type: "check",
    reference: check,
    async: false,
    expects: null,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value))
        _addIssue(this, "input", dataset, config$1);
      return dataset;
    }
  };
}
function integer(message$1) {
  return {
    kind: "validation",
    type: "integer",
    reference: integer,
    async: false,
    expects: null,
    requirement: Number.isInteger,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value))
        _addIssue(this, "integer", dataset, config$1);
      return dataset;
    }
  };
}
function transform(operation) {
  return {
    kind: "transformation",
    type: "transform",
    reference: transform,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = this.operation(dataset.value);
      return dataset;
    }
  };
}
function getFallback(schema, dataset, config$1) {
  return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
}
function getDefault(schema, dataset, config$1) {
  return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
}
function is(schema, input) {
  return !schema["~run"]({ value: input }, { abortEarly: true }).issues;
}
function array(item, message$1) {
  return {
    kind: "schema",
    type: "array",
    reference: array,
    expects: "Array",
    async: false,
    item,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0;key < input.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path)
                issue.path.unshift(pathItem);
              else
                issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues)
              dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed)
            dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function bigint(message$1) {
  return {
    kind: "schema",
    type: "bigint",
    reference: bigint,
    expects: "bigint",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "bigint")
        dataset.typed = true;
      else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function boolean(message$1) {
  return {
    kind: "schema",
    type: "boolean",
    reference: boolean,
    expects: "boolean",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "boolean")
        dataset.typed = true;
      else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function lazy(getter) {
  return {
    kind: "schema",
    type: "lazy",
    reference: lazy,
    expects: "unknown",
    async: false,
    getter,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      return this.getter(dataset.value)["~run"](dataset, config$1);
    }
  };
}
function literal(literal_, message$1) {
  return {
    kind: "schema",
    type: "literal",
    reference: literal,
    expects: /* @__PURE__ */ _stringify(literal_),
    async: false,
    literal: literal_,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === this.literal)
        dataset.typed = true;
      else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function nullable(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullable",
    reference: nullable,
    expects: `(${wrapped.expects} | null)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === null) {
        if (this.default !== undefined)
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
function nullish(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullish",
    reference: nullish,
    expects: `(${wrapped.expects} | null | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === null || dataset.value === undefined) {
        if (this.default !== undefined)
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null || dataset.value === undefined) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
function number(message$1) {
  return {
    kind: "schema",
    type: "number",
    reference: number,
    expects: "number",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "number" && !isNaN(dataset.value))
        dataset.typed = true;
      else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function object(entries$1, message$1) {
  return {
    kind: "schema",
    type: "object",
    reference: object,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== undefined) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path)
                  issue.path.unshift(pathItem);
                else
                  issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues)
                dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed)
              dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== undefined)
            dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: undefined,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly)
              break;
          }
        }
      } else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function optional(wrapped, default_) {
  return {
    kind: "schema",
    type: "optional",
    reference: optional,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === undefined) {
        if (this.default !== undefined)
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === undefined) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
function record(key, value$1, message$1) {
  return {
    kind: "schema",
    type: "record",
    reference: record,
    expects: "Object",
    async: false,
    key,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const entryKey in input)
          if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
            const entryValue = input[entryKey];
            const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
            if (keyDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "key",
                input,
                key: entryKey,
                value: entryValue
              };
              for (const issue of keyDataset.issues) {
                issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues)
                dataset.issues = keyDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key: entryKey,
                value: entryValue
              };
              for (const issue of valueDataset.issues) {
                if (issue.path)
                  issue.path.unshift(pathItem);
                else
                  issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues)
                dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!keyDataset.typed || !valueDataset.typed)
              dataset.typed = false;
            if (keyDataset.typed)
              dataset.value[keyDataset.value] = valueDataset.value;
          }
      } else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function string(message$1) {
  return {
    kind: "schema",
    type: "string",
    reference: string,
    expects: "string",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "string")
        dataset.typed = true;
      else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function tuple(items, message$1) {
  return {
    kind: "schema",
    type: "tuple",
    reference: tuple,
    expects: "Array",
    async: false,
    items,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0;key < this.items.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.items[key]["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path)
                issue.path.unshift(pathItem);
              else
                issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues)
              dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed)
            dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function _subIssues(datasets) {
  let issues;
  if (datasets)
    for (const dataset of datasets)
      if (issues)
        issues.push(...dataset.issues);
      else
        issues = dataset.issues;
  return issues;
}
function union(options, message$1) {
  return {
    kind: "schema",
    type: "union",
    reference: union,
    expects: /* @__PURE__ */ _joinExpects(options.map((option2) => option2.expects), "|"),
    async: false,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      let validDataset;
      let typedDatasets;
      let untypedDatasets;
      for (const schema of this.options) {
        const optionDataset = schema["~run"]({ value: dataset.value }, config$1);
        if (optionDataset.typed)
          if (optionDataset.issues)
            if (typedDatasets)
              typedDatasets.push(optionDataset);
            else
              typedDatasets = [optionDataset];
          else {
            validDataset = optionDataset;
            break;
          }
        else if (untypedDatasets)
          untypedDatasets.push(optionDataset);
        else
          untypedDatasets = [optionDataset];
      }
      if (validDataset)
        return validDataset;
      if (typedDatasets) {
        if (typedDatasets.length === 1)
          return typedDatasets[0];
        _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
        dataset.typed = true;
      } else if (untypedDatasets?.length === 1)
        return untypedDatasets[0];
      else
        _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
      return dataset;
    }
  };
}
function unknown() {
  return {
    kind: "schema",
    type: "unknown",
    reference: unknown,
    expects: "unknown",
    async: false,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset) {
      dataset.typed = true;
      return dataset;
    }
  };
}
function parse(schema, input, config$1) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  if (dataset.issues)
    throw new ValiError(dataset.issues);
  return dataset.value;
}
function pipe(...pipe$1) {
  return {
    ...pipe$1[0],
    pipe: pipe$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      for (const item of pipe$1)
        if (item.kind !== "metadata") {
          if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
            dataset.typed = false;
            break;
          }
          if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly)
            dataset = item["~run"](dataset, config$1);
        }
      return dataset;
    }
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/data/internal.mjs
function safeEnum(options) {
  return union(Object.keys(options).map((key) => withKind(key, object({ [key]: options[key] }))));
}
function withKind(key, schema) {
  return pipe(object({
    ...schema.entries,
    $kind: optional(literal(key))
  }), transform((value) => ({
    ...value,
    $kind: key
  })));
}
var SuiAddress = pipe(string(), transform((value) => normalizeSuiAddress(value)), check(isValidSuiAddress));
var ObjectID = SuiAddress;
var BCSBytes = string();
var JsonU64 = pipe(union([string(), pipe(number(), integer())]), check((val) => {
  try {
    BigInt(val);
    return BigInt(val) >= 0 && BigInt(val) <= 18446744073709551615n;
  } catch {
    return false;
  }
}, "Invalid u64"));
var U32 = pipe(number(), integer(), check((val) => val >= 0 && val < 2 ** 32, "Invalid u32"));
var ObjectRefSchema = object({
  objectId: SuiAddress,
  version: JsonU64,
  digest: string()
});
var ArgumentSchema = union([
  withKind("GasCoin", object({ GasCoin: literal(true) })),
  withKind("Input", object({
    Input: pipe(number(), integer()),
    type: optional(union([
      literal("pure"),
      literal("object"),
      literal("withdrawal")
    ]))
  })),
  withKind("Result", object({ Result: pipe(number(), integer()) })),
  withKind("NestedResult", object({ NestedResult: tuple([pipe(number(), integer()), pipe(number(), integer())]) }))
]);
var GasDataSchema = object({
  budget: nullable(JsonU64),
  price: nullable(JsonU64),
  owner: nullable(SuiAddress),
  payment: nullable(array(ObjectRefSchema))
});
var StructTagSchema = object({
  address: string(),
  module: string(),
  name: string(),
  typeParams: array(string())
});
var OpenSignatureBodySchema = union([
  object({ $kind: literal("address") }),
  object({ $kind: literal("bool") }),
  object({ $kind: literal("u8") }),
  object({ $kind: literal("u16") }),
  object({ $kind: literal("u32") }),
  object({ $kind: literal("u64") }),
  object({ $kind: literal("u128") }),
  object({ $kind: literal("u256") }),
  object({ $kind: literal("unknown") }),
  object({
    $kind: literal("vector"),
    vector: lazy(() => OpenSignatureBodySchema)
  }),
  object({
    $kind: literal("datatype"),
    datatype: object({
      typeName: string(),
      typeParameters: array(lazy(() => OpenSignatureBodySchema))
    })
  }),
  object({
    $kind: literal("typeParameter"),
    index: pipe(number(), integer())
  })
]);
var OpenSignatureSchema = object({
  reference: nullable(union([
    literal("mutable"),
    literal("immutable"),
    literal("unknown")
  ])),
  body: OpenSignatureBodySchema
});
var ProgrammableMoveCallSchema = object({
  package: ObjectID,
  module: string(),
  function: string(),
  typeArguments: array(string()),
  arguments: array(ArgumentSchema),
  _argumentTypes: optional(nullable(array(OpenSignatureSchema)))
});
var $Intent = object({
  name: string(),
  inputs: record(string(), union([ArgumentSchema, array(ArgumentSchema)])),
  data: record(string(), unknown())
});
var CommandSchema = safeEnum({
  MoveCall: ProgrammableMoveCallSchema,
  TransferObjects: object({
    objects: array(ArgumentSchema),
    address: ArgumentSchema
  }),
  SplitCoins: object({
    coin: ArgumentSchema,
    amounts: array(ArgumentSchema)
  }),
  MergeCoins: object({
    destination: ArgumentSchema,
    sources: array(ArgumentSchema)
  }),
  Publish: object({
    modules: array(BCSBytes),
    dependencies: array(ObjectID)
  }),
  MakeMoveVec: object({
    type: nullable(string()),
    elements: array(ArgumentSchema)
  }),
  Upgrade: object({
    modules: array(BCSBytes),
    dependencies: array(ObjectID),
    package: ObjectID,
    ticket: ArgumentSchema
  }),
  $Intent
});
var ObjectArgSchema = safeEnum({
  ImmOrOwnedObject: ObjectRefSchema,
  SharedObject: object({
    objectId: ObjectID,
    initialSharedVersion: JsonU64,
    mutable: boolean()
  }),
  Receiving: ObjectRefSchema
});
var ReservationSchema = safeEnum({ MaxAmountU64: JsonU64 });
var WithdrawalTypeArgSchema = safeEnum({ Balance: string() });
var WithdrawFromSchema = safeEnum({
  Sender: literal(true),
  Sponsor: literal(true)
});
var FundsWithdrawalArgSchema = object({
  reservation: ReservationSchema,
  typeArg: WithdrawalTypeArgSchema,
  withdrawFrom: WithdrawFromSchema
});
var CallArgSchema = safeEnum({
  Object: ObjectArgSchema,
  Pure: object({ bytes: BCSBytes }),
  UnresolvedPure: object({ value: unknown() }),
  UnresolvedObject: object({
    objectId: ObjectID,
    version: optional(nullable(JsonU64)),
    digest: optional(nullable(string())),
    initialSharedVersion: optional(nullable(JsonU64)),
    mutable: optional(nullable(boolean()))
  }),
  FundsWithdrawal: FundsWithdrawalArgSchema
});
var NormalizedCallArg = safeEnum({
  Object: ObjectArgSchema,
  Pure: object({ bytes: BCSBytes })
});
var ValidDuringSchema = object({
  minEpoch: nullable(JsonU64),
  maxEpoch: nullable(JsonU64),
  minTimestamp: nullable(JsonU64),
  maxTimestamp: nullable(JsonU64),
  chain: string(),
  nonce: U32
});
var TransactionExpiration = safeEnum({
  None: literal(true),
  Epoch: JsonU64,
  ValidDuring: ValidDuringSchema
});
var TransactionDataSchema = object({
  version: literal(2),
  sender: nullish(SuiAddress),
  expiration: nullish(TransactionExpiration),
  gasData: GasDataSchema,
  inputs: array(CallArgSchema),
  commands: array(CommandSchema)
});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/utils.mjs
function getIdFromCallArg(arg) {
  if (typeof arg === "string")
    return normalizeSuiAddress(arg);
  if (arg.Object) {
    if (arg.Object.ImmOrOwnedObject)
      return normalizeSuiAddress(arg.Object.ImmOrOwnedObject.objectId);
    if (arg.Object.Receiving)
      return normalizeSuiAddress(arg.Object.Receiving.objectId);
    return normalizeSuiAddress(arg.Object.SharedObject.objectId);
  }
  if (arg.UnresolvedObject)
    return normalizeSuiAddress(arg.UnresolvedObject.objectId);
}
function isArgument(value) {
  return is(ArgumentSchema, value);
}
function remapCommandArguments(command, inputMapping, commandMapping) {
  const remapArg = (arg) => {
    switch (arg.$kind) {
      case "Input": {
        const newInputIndex = inputMapping.get(arg.Input);
        if (newInputIndex === undefined)
          throw new Error(`Input ${arg.Input} not found in input mapping`);
        return {
          ...arg,
          Input: newInputIndex
        };
      }
      case "Result": {
        const newCommandIndex = commandMapping.get(arg.Result);
        if (newCommandIndex !== undefined)
          return {
            ...arg,
            Result: newCommandIndex
          };
        return arg;
      }
      case "NestedResult": {
        const newCommandIndex = commandMapping.get(arg.NestedResult[0]);
        if (newCommandIndex !== undefined)
          return {
            ...arg,
            NestedResult: [newCommandIndex, arg.NestedResult[1]]
          };
        return arg;
      }
      default:
        return arg;
    }
  };
  switch (command.$kind) {
    case "MoveCall":
      command.MoveCall.arguments = command.MoveCall.arguments.map(remapArg);
      break;
    case "TransferObjects":
      command.TransferObjects.objects = command.TransferObjects.objects.map(remapArg);
      command.TransferObjects.address = remapArg(command.TransferObjects.address);
      break;
    case "SplitCoins":
      command.SplitCoins.coin = remapArg(command.SplitCoins.coin);
      command.SplitCoins.amounts = command.SplitCoins.amounts.map(remapArg);
      break;
    case "MergeCoins":
      command.MergeCoins.destination = remapArg(command.MergeCoins.destination);
      command.MergeCoins.sources = command.MergeCoins.sources.map(remapArg);
      break;
    case "MakeMoveVec":
      command.MakeMoveVec.elements = command.MakeMoveVec.elements.map(remapArg);
      break;
    case "Upgrade":
      command.Upgrade.ticket = remapArg(command.Upgrade.ticket);
      break;
    case "$Intent": {
      const inputs = command.$Intent.inputs;
      command.$Intent.inputs = {};
      for (const [key, value] of Object.entries(inputs))
        command.$Intent.inputs[key] = Array.isArray(value) ? value.map(remapArg) : remapArg(value);
      break;
    }
    case "Publish":
      break;
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/bcs/type-tag-serializer.mjs
var VECTOR_REGEX = /^vector<(.+)>$/;
var STRUCT_REGEX = /^([^:]+)::([^:]+)::([^<]+)(<(.+)>)?/;
var TypeTagSerializer = class TypeTagSerializer2 {
  static parseFromStr(str, normalizeAddress = false) {
    if (str === "address")
      return { address: null };
    else if (str === "bool")
      return { bool: null };
    else if (str === "u8")
      return { u8: null };
    else if (str === "u16")
      return { u16: null };
    else if (str === "u32")
      return { u32: null };
    else if (str === "u64")
      return { u64: null };
    else if (str === "u128")
      return { u128: null };
    else if (str === "u256")
      return { u256: null };
    else if (str === "signer")
      return { signer: null };
    const vectorMatch = str.match(VECTOR_REGEX);
    if (vectorMatch)
      return { vector: TypeTagSerializer2.parseFromStr(vectorMatch[1], normalizeAddress) };
    const structMatch = str.match(STRUCT_REGEX);
    if (structMatch)
      return { struct: {
        address: normalizeAddress ? normalizeSuiAddress(structMatch[1]) : structMatch[1],
        module: structMatch[2],
        name: structMatch[3],
        typeParams: structMatch[5] === undefined ? [] : TypeTagSerializer2.parseStructTypeArgs(structMatch[5], normalizeAddress)
      } };
    throw new Error(`Encountered unexpected token when parsing type args for ${str}`);
  }
  static parseStructTypeArgs(str, normalizeAddress = false) {
    return splitGenericParameters(str).map((tok) => TypeTagSerializer2.parseFromStr(tok, normalizeAddress));
  }
  static tagToString(tag) {
    if ("bool" in tag)
      return "bool";
    if ("u8" in tag)
      return "u8";
    if ("u16" in tag)
      return "u16";
    if ("u32" in tag)
      return "u32";
    if ("u64" in tag)
      return "u64";
    if ("u128" in tag)
      return "u128";
    if ("u256" in tag)
      return "u256";
    if ("address" in tag)
      return "address";
    if ("signer" in tag)
      return "signer";
    if ("vector" in tag)
      return `vector<${TypeTagSerializer2.tagToString(tag.vector)}>`;
    if ("struct" in tag) {
      const struct = tag.struct;
      const typeParams = struct.typeParams.map(TypeTagSerializer2.tagToString).join(", ");
      return `${struct.address}::${struct.module}::${struct.name}${typeParams ? `<${typeParams}>` : ""}`;
    }
    throw new Error("Invalid TypeTag");
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/bcs/bcs.mjs
function unsafe_u64(options) {
  return bcs.u64({
    name: "unsafe_u64",
    ...options
  }).transform({
    input: (val) => val,
    output: (val) => Number(val)
  });
}
function optionEnum(type) {
  return bcs.enum("Option", {
    None: null,
    Some: type
  });
}
var Address = bcs.bytes(SUI_ADDRESS_LENGTH).transform({
  validate: (val) => {
    const address = typeof val === "string" ? val : toHex(val);
    if (!address || !isValidSuiAddress(normalizeSuiAddress(address)))
      throw new Error(`Invalid Sui address ${address}`);
  },
  input: (val) => typeof val === "string" ? fromHex(normalizeSuiAddress(val)) : val,
  output: (val) => normalizeSuiAddress(toHex(val))
});
var ObjectDigest = bcs.byteVector().transform({
  name: "ObjectDigest",
  input: (value) => fromBase58(value),
  output: (value) => toBase58(new Uint8Array(value)),
  validate: (value) => {
    if (fromBase58(value).length !== 32)
      throw new Error("ObjectDigest must be 32 bytes");
  }
});
var SuiObjectRef = bcs.struct("SuiObjectRef", {
  objectId: Address,
  version: bcs.u64(),
  digest: ObjectDigest
});
var SharedObjectRef = bcs.struct("SharedObjectRef", {
  objectId: Address,
  initialSharedVersion: bcs.u64(),
  mutable: bcs.bool()
});
var ObjectArg = bcs.enum("ObjectArg", {
  ImmOrOwnedObject: SuiObjectRef,
  SharedObject: SharedObjectRef,
  Receiving: SuiObjectRef
});
var Owner = bcs.enum("Owner", {
  AddressOwner: Address,
  ObjectOwner: Address,
  Shared: bcs.struct("Shared", { initialSharedVersion: bcs.u64() }),
  Immutable: null,
  ConsensusAddressOwner: bcs.struct("ConsensusAddressOwner", {
    startVersion: bcs.u64(),
    owner: Address
  })
});
var Reservation = bcs.enum("Reservation", { MaxAmountU64: bcs.u64() });
var WithdrawalType = bcs.enum("WithdrawalType", { Balance: bcs.lazy(() => TypeTag) });
var WithdrawFrom = bcs.enum("WithdrawFrom", {
  Sender: null,
  Sponsor: null
});
var FundsWithdrawal = bcs.struct("FundsWithdrawal", {
  reservation: Reservation,
  typeArg: WithdrawalType,
  withdrawFrom: WithdrawFrom
});
var CallArg = bcs.enum("CallArg", {
  Pure: bcs.struct("Pure", { bytes: bcs.byteVector().transform({
    input: (val) => typeof val === "string" ? fromBase64(val) : val,
    output: (val) => toBase64(new Uint8Array(val))
  }) }),
  Object: ObjectArg,
  FundsWithdrawal
});
var InnerTypeTag = bcs.enum("TypeTag", {
  bool: null,
  u8: null,
  u64: null,
  u128: null,
  address: null,
  signer: null,
  vector: bcs.lazy(() => InnerTypeTag),
  struct: bcs.lazy(() => StructTag),
  u16: null,
  u32: null,
  u256: null
});
var TypeTag = InnerTypeTag.transform({
  input: (typeTag) => typeof typeTag === "string" ? TypeTagSerializer.parseFromStr(typeTag, true) : typeTag,
  output: (typeTag) => TypeTagSerializer.tagToString(typeTag)
});
var Argument = bcs.enum("Argument", {
  GasCoin: null,
  Input: bcs.u16(),
  Result: bcs.u16(),
  NestedResult: bcs.tuple([bcs.u16(), bcs.u16()])
});
var ProgrammableMoveCall = bcs.struct("ProgrammableMoveCall", {
  package: Address,
  module: bcs.string(),
  function: bcs.string(),
  typeArguments: bcs.vector(TypeTag),
  arguments: bcs.vector(Argument)
});
var Command = bcs.enum("Command", {
  MoveCall: ProgrammableMoveCall,
  TransferObjects: bcs.struct("TransferObjects", {
    objects: bcs.vector(Argument),
    address: Argument
  }),
  SplitCoins: bcs.struct("SplitCoins", {
    coin: Argument,
    amounts: bcs.vector(Argument)
  }),
  MergeCoins: bcs.struct("MergeCoins", {
    destination: Argument,
    sources: bcs.vector(Argument)
  }),
  Publish: bcs.struct("Publish", {
    modules: bcs.vector(bcs.byteVector().transform({
      input: (val) => typeof val === "string" ? fromBase64(val) : val,
      output: (val) => toBase64(new Uint8Array(val))
    })),
    dependencies: bcs.vector(Address)
  }),
  MakeMoveVec: bcs.struct("MakeMoveVec", {
    type: optionEnum(TypeTag).transform({
      input: (val) => val === null ? { None: true } : { Some: val },
      output: (val) => val.Some ?? null
    }),
    elements: bcs.vector(Argument)
  }),
  Upgrade: bcs.struct("Upgrade", {
    modules: bcs.vector(bcs.byteVector().transform({
      input: (val) => typeof val === "string" ? fromBase64(val) : val,
      output: (val) => toBase64(new Uint8Array(val))
    })),
    dependencies: bcs.vector(Address),
    package: Address,
    ticket: Argument
  })
});
var ProgrammableTransaction = bcs.struct("ProgrammableTransaction", {
  inputs: bcs.vector(CallArg),
  commands: bcs.vector(Command)
});
var TransactionKind = bcs.enum("TransactionKind", {
  ProgrammableTransaction,
  ChangeEpoch: null,
  Genesis: null,
  ConsensusCommitPrologue: null
});
var ValidDuring = bcs.struct("ValidDuring", {
  minEpoch: bcs.option(bcs.u64()),
  maxEpoch: bcs.option(bcs.u64()),
  minTimestamp: bcs.option(bcs.u64()),
  maxTimestamp: bcs.option(bcs.u64()),
  chain: ObjectDigest,
  nonce: bcs.u32()
});
var TransactionExpiration2 = bcs.enum("TransactionExpiration", {
  None: null,
  Epoch: unsafe_u64(),
  ValidDuring
});
var StructTag = bcs.struct("StructTag", {
  address: Address,
  module: bcs.string(),
  name: bcs.string(),
  typeParams: bcs.vector(InnerTypeTag)
});
var GasData = bcs.struct("GasData", {
  payment: bcs.vector(SuiObjectRef),
  owner: Address,
  price: bcs.u64(),
  budget: bcs.u64()
});
var TransactionDataV1 = bcs.struct("TransactionDataV1", {
  kind: TransactionKind,
  sender: Address,
  gasData: GasData,
  expiration: TransactionExpiration2
});
var TransactionData = bcs.enum("TransactionData", { V1: TransactionDataV1 });
var IntentScope = bcs.enum("IntentScope", {
  TransactionData: null,
  TransactionEffects: null,
  CheckpointSummary: null,
  PersonalMessage: null
});
var IntentVersion = bcs.enum("IntentVersion", { V0: null });
var AppId = bcs.enum("AppId", { Sui: null });
var Intent = bcs.struct("Intent", {
  scope: IntentScope,
  version: IntentVersion,
  appId: AppId
});
function IntentMessage(T) {
  return bcs.struct(`IntentMessage<${T.name}>`, {
    intent: Intent,
    value: T
  });
}
var CompressedSignature = bcs.enum("CompressedSignature", {
  ED25519: bcs.bytes(64),
  Secp256k1: bcs.bytes(64),
  Secp256r1: bcs.bytes(64),
  ZkLogin: bcs.byteVector(),
  Passkey: bcs.byteVector()
});
var PublicKey = bcs.enum("PublicKey", {
  ED25519: bcs.bytes(32),
  Secp256k1: bcs.bytes(33),
  Secp256r1: bcs.bytes(33),
  ZkLogin: bcs.byteVector(),
  Passkey: bcs.bytes(33)
});
var MultiSigPkMap = bcs.struct("MultiSigPkMap", {
  pubKey: PublicKey,
  weight: bcs.u8()
});
var MultiSigPublicKey = bcs.struct("MultiSigPublicKey", {
  pk_map: bcs.vector(MultiSigPkMap),
  threshold: bcs.u16()
});
var MultiSig = bcs.struct("MultiSig", {
  sigs: bcs.vector(CompressedSignature),
  bitmap: bcs.u16(),
  multisig_pk: MultiSigPublicKey
});
var base64String = bcs.byteVector().transform({
  input: (val) => typeof val === "string" ? fromBase64(val) : val,
  output: (val) => toBase64(new Uint8Array(val))
});
var SenderSignedTransaction = bcs.struct("SenderSignedTransaction", {
  intentMessage: IntentMessage(TransactionData),
  txSignatures: bcs.vector(base64String)
});
var SenderSignedData = bcs.vector(SenderSignedTransaction, { name: "SenderSignedData" });
var PasskeyAuthenticator = bcs.struct("PasskeyAuthenticator", {
  authenticatorData: bcs.byteVector(),
  clientDataJson: bcs.string(),
  userSignature: bcs.byteVector()
});
var MoveObjectType = bcs.enum("MoveObjectType", {
  Other: StructTag,
  GasCoin: null,
  StakedSui: null,
  Coin: TypeTag,
  AccumulatorBalanceWrapper: null
});
var TypeOrigin = bcs.struct("TypeOrigin", {
  moduleName: bcs.string(),
  datatypeName: bcs.string(),
  package: Address
});
var UpgradeInfo = bcs.struct("UpgradeInfo", {
  upgradedId: Address,
  upgradedVersion: bcs.u64()
});
var MovePackage = bcs.struct("MovePackage", {
  id: Address,
  version: bcs.u64(),
  moduleMap: bcs.map(bcs.string(), bcs.byteVector()),
  typeOriginTable: bcs.vector(TypeOrigin),
  linkageTable: bcs.map(Address, UpgradeInfo)
});
var MoveObject = bcs.struct("MoveObject", {
  type: MoveObjectType,
  hasPublicTransfer: bcs.bool(),
  version: bcs.u64(),
  contents: bcs.byteVector()
});
var Data = bcs.enum("Data", {
  Move: MoveObject,
  Package: MovePackage
});
var ObjectInner = bcs.struct("ObjectInner", {
  data: Data,
  owner: Owner,
  previousTransaction: ObjectDigest,
  storageRebate: bcs.u64()
});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/bcs/effects.mjs
var PackageUpgradeError = bcs.enum("PackageUpgradeError", {
  UnableToFetchPackage: bcs.struct("UnableToFetchPackage", { packageId: Address }),
  NotAPackage: bcs.struct("NotAPackage", { objectId: Address }),
  IncompatibleUpgrade: null,
  DigestDoesNotMatch: bcs.struct("DigestDoesNotMatch", { digest: bcs.byteVector() }),
  UnknownUpgradePolicy: bcs.struct("UnknownUpgradePolicy", { policy: bcs.u8() }),
  PackageIDDoesNotMatch: bcs.struct("PackageIDDoesNotMatch", {
    packageId: Address,
    ticketId: Address
  })
});
var ModuleId = bcs.struct("ModuleId", {
  address: Address,
  name: bcs.string()
});
var MoveLocation = bcs.struct("MoveLocation", {
  module: ModuleId,
  function: bcs.u16(),
  instruction: bcs.u16(),
  functionName: bcs.option(bcs.string())
});
var CommandArgumentError = bcs.enum("CommandArgumentError", {
  TypeMismatch: null,
  InvalidBCSBytes: null,
  InvalidUsageOfPureArg: null,
  InvalidArgumentToPrivateEntryFunction: null,
  IndexOutOfBounds: bcs.struct("IndexOutOfBounds", { idx: bcs.u16() }),
  SecondaryIndexOutOfBounds: bcs.struct("SecondaryIndexOutOfBounds", {
    resultIdx: bcs.u16(),
    secondaryIdx: bcs.u16()
  }),
  InvalidResultArity: bcs.struct("InvalidResultArity", { resultIdx: bcs.u16() }),
  InvalidGasCoinUsage: null,
  InvalidValueUsage: null,
  InvalidObjectByValue: null,
  InvalidObjectByMutRef: null,
  SharedObjectOperationNotAllowed: null,
  InvalidArgumentArity: null,
  InvalidTransferObject: null,
  InvalidMakeMoveVecNonObjectArgument: null,
  ArgumentWithoutValue: null,
  CannotMoveBorrowedValue: null,
  CannotWriteToExtendedReference: null,
  InvalidReferenceArgument: null
});
var TypeArgumentError = bcs.enum("TypeArgumentError", {
  TypeNotFound: null,
  ConstraintNotSatisfied: null
});
var ExecutionFailureStatus = bcs.enum("ExecutionFailureStatus", {
  InsufficientGas: null,
  InvalidGasObject: null,
  InvariantViolation: null,
  FeatureNotYetSupported: null,
  MoveObjectTooBig: bcs.struct("MoveObjectTooBig", {
    objectSize: bcs.u64(),
    maxObjectSize: bcs.u64()
  }),
  MovePackageTooBig: bcs.struct("MovePackageTooBig", {
    objectSize: bcs.u64(),
    maxObjectSize: bcs.u64()
  }),
  CircularObjectOwnership: bcs.struct("CircularObjectOwnership", { object: Address }),
  InsufficientCoinBalance: null,
  CoinBalanceOverflow: null,
  PublishErrorNonZeroAddress: null,
  SuiMoveVerificationError: null,
  MovePrimitiveRuntimeError: bcs.option(MoveLocation),
  MoveAbort: bcs.tuple([MoveLocation, bcs.u64()]),
  VMVerificationOrDeserializationError: null,
  VMInvariantViolation: null,
  FunctionNotFound: null,
  ArityMismatch: null,
  TypeArityMismatch: null,
  NonEntryFunctionInvoked: null,
  CommandArgumentError: bcs.struct("CommandArgumentError", {
    argIdx: bcs.u16(),
    kind: CommandArgumentError
  }),
  TypeArgumentError: bcs.struct("TypeArgumentError", {
    argumentIdx: bcs.u16(),
    kind: TypeArgumentError
  }),
  UnusedValueWithoutDrop: bcs.struct("UnusedValueWithoutDrop", {
    resultIdx: bcs.u16(),
    secondaryIdx: bcs.u16()
  }),
  InvalidPublicFunctionReturnType: bcs.struct("InvalidPublicFunctionReturnType", { idx: bcs.u16() }),
  InvalidTransferObject: null,
  EffectsTooLarge: bcs.struct("EffectsTooLarge", {
    currentSize: bcs.u64(),
    maxSize: bcs.u64()
  }),
  PublishUpgradeMissingDependency: null,
  PublishUpgradeDependencyDowngrade: null,
  PackageUpgradeError: bcs.struct("PackageUpgradeError", { upgradeError: PackageUpgradeError }),
  WrittenObjectsTooLarge: bcs.struct("WrittenObjectsTooLarge", {
    currentSize: bcs.u64(),
    maxSize: bcs.u64()
  }),
  CertificateDenied: null,
  SuiMoveVerificationTimedout: null,
  SharedObjectOperationNotAllowed: null,
  InputObjectDeleted: null,
  ExecutionCancelledDueToSharedObjectCongestion: bcs.struct("ExecutionCancelledDueToSharedObjectCongestion", { congested_objects: bcs.vector(Address) }),
  AddressDeniedForCoin: bcs.struct("AddressDeniedForCoin", {
    address: Address,
    coinType: bcs.string()
  }),
  CoinTypeGlobalPause: bcs.struct("CoinTypeGlobalPause", { coinType: bcs.string() }),
  ExecutionCancelledDueToRandomnessUnavailable: null,
  MoveVectorElemTooBig: bcs.struct("MoveVectorElemTooBig", {
    valueSize: bcs.u64(),
    maxScaledSize: bcs.u64()
  }),
  MoveRawValueTooBig: bcs.struct("MoveRawValueTooBig", {
    valueSize: bcs.u64(),
    maxScaledSize: bcs.u64()
  }),
  InvalidLinkage: null,
  InsufficientBalanceForWithdraw: null,
  NonExclusiveWriteInputObjectModified: bcs.struct("NonExclusiveWriteInputObjectModified", { id: Address })
});
var ExecutionStatus = bcs.enum("ExecutionStatus", {
  Success: null,
  Failure: bcs.struct("Failure", {
    error: ExecutionFailureStatus,
    command: bcs.option(bcs.u64())
  })
});
var GasCostSummary = bcs.struct("GasCostSummary", {
  computationCost: bcs.u64(),
  storageCost: bcs.u64(),
  storageRebate: bcs.u64(),
  nonRefundableStorageFee: bcs.u64()
});
var TransactionEffectsV1 = bcs.struct("TransactionEffectsV1", {
  status: ExecutionStatus,
  executedEpoch: bcs.u64(),
  gasUsed: GasCostSummary,
  modifiedAtVersions: bcs.vector(bcs.tuple([Address, bcs.u64()])),
  sharedObjects: bcs.vector(SuiObjectRef),
  transactionDigest: ObjectDigest,
  created: bcs.vector(bcs.tuple([SuiObjectRef, Owner])),
  mutated: bcs.vector(bcs.tuple([SuiObjectRef, Owner])),
  unwrapped: bcs.vector(bcs.tuple([SuiObjectRef, Owner])),
  deleted: bcs.vector(SuiObjectRef),
  unwrappedThenDeleted: bcs.vector(SuiObjectRef),
  wrapped: bcs.vector(SuiObjectRef),
  gasObject: bcs.tuple([SuiObjectRef, Owner]),
  eventsDigest: bcs.option(ObjectDigest),
  dependencies: bcs.vector(ObjectDigest)
});
var VersionDigest = bcs.tuple([bcs.u64(), ObjectDigest]);
var ObjectIn = bcs.enum("ObjectIn", {
  NotExist: null,
  Exist: bcs.tuple([VersionDigest, Owner])
});
var AccumulatorAddress = bcs.struct("AccumulatorAddress", {
  address: Address,
  ty: TypeTag
});
var AccumulatorOperation = bcs.enum("AccumulatorOperation", {
  Merge: null,
  Split: null
});
var AccumulatorValue = bcs.enum("AccumulatorValue", {
  Integer: bcs.u64(),
  IntegerTuple: bcs.tuple([bcs.u64(), bcs.u64()]),
  EventDigest: bcs.vector(bcs.tuple([bcs.u64(), ObjectDigest]))
});
var AccumulatorWriteV1 = bcs.struct("AccumulatorWriteV1", {
  address: AccumulatorAddress,
  operation: AccumulatorOperation,
  value: AccumulatorValue
});
var ObjectOut = bcs.enum("ObjectOut", {
  NotExist: null,
  ObjectWrite: bcs.tuple([ObjectDigest, Owner]),
  PackageWrite: VersionDigest,
  AccumulatorWriteV1
});
var IDOperation = bcs.enum("IDOperation", {
  None: null,
  Created: null,
  Deleted: null
});
var EffectsObjectChange = bcs.struct("EffectsObjectChange", {
  inputState: ObjectIn,
  outputState: ObjectOut,
  idOperation: IDOperation
});
var UnchangedConsensusKind = bcs.enum("UnchangedConsensusKind", {
  ReadOnlyRoot: VersionDigest,
  MutateConsensusStreamEnded: bcs.u64(),
  ReadConsensusStreamEnded: bcs.u64(),
  Cancelled: bcs.u64(),
  PerEpochConfig: null
});
var TransactionEffectsV2 = bcs.struct("TransactionEffectsV2", {
  status: ExecutionStatus,
  executedEpoch: bcs.u64(),
  gasUsed: GasCostSummary,
  transactionDigest: ObjectDigest,
  gasObjectIndex: bcs.option(bcs.u32()),
  eventsDigest: bcs.option(ObjectDigest),
  dependencies: bcs.vector(ObjectDigest),
  lamportVersion: bcs.u64(),
  changedObjects: bcs.vector(bcs.tuple([Address, EffectsObjectChange])),
  unchangedConsensusObjects: bcs.vector(bcs.tuple([Address, UnchangedConsensusKind])),
  auxDataDigest: bcs.option(ObjectDigest)
});
var TransactionEffects = bcs.enum("TransactionEffects", {
  V1: TransactionEffectsV1,
  V2: TransactionEffectsV2
});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/bcs/pure.mjs
function pureBcsSchemaFromTypeName(name) {
  switch (name) {
    case "u8":
      return bcs.u8();
    case "u16":
      return bcs.u16();
    case "u32":
      return bcs.u32();
    case "u64":
      return bcs.u64();
    case "u128":
      return bcs.u128();
    case "u256":
      return bcs.u256();
    case "bool":
      return bcs.bool();
    case "string":
      return bcs.string();
    case "id":
    case "address":
      return Address;
  }
  const generic = name.match(/^(vector|option)<(.+)>$/);
  if (generic) {
    const [kind, inner] = generic.slice(1);
    if (kind === "vector")
      return bcs.vector(pureBcsSchemaFromTypeName(inner));
    else
      return bcs.option(pureBcsSchemaFromTypeName(inner));
  }
  throw new Error(`Invalid Pure type name: ${name}`);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/bcs/index.mjs
var suiBcs = {
  ...bcs,
  U8: bcs.u8(),
  U16: bcs.u16(),
  U32: bcs.u32(),
  U64: bcs.u64(),
  U128: bcs.u128(),
  U256: bcs.u256(),
  ULEB128: bcs.uleb128(),
  Bool: bcs.bool(),
  String: bcs.string(),
  Address,
  AppId,
  Argument,
  CallArg,
  Command,
  CompressedSignature,
  Data,
  GasData,
  Intent,
  IntentMessage,
  IntentScope,
  IntentVersion,
  MoveObject,
  MoveObjectType,
  MovePackage,
  MultiSig,
  MultiSigPkMap,
  MultiSigPublicKey,
  Object: ObjectInner,
  ObjectArg,
  ObjectDigest,
  Owner,
  PasskeyAuthenticator,
  ProgrammableMoveCall,
  ProgrammableTransaction,
  PublicKey,
  SenderSignedData,
  SenderSignedTransaction,
  SharedObjectRef,
  StructTag,
  SuiObjectRef,
  TransactionData,
  TransactionDataV1,
  TransactionEffects,
  TransactionExpiration: TransactionExpiration2,
  TransactionKind,
  TypeOrigin,
  TypeTag,
  UpgradeInfo
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/data/v1.mjs
var ObjectRef = object({
  digest: string(),
  objectId: string(),
  version: union([
    pipe(number(), integer()),
    string(),
    bigint()
  ])
});
var ObjectArg2 = safeEnum({
  ImmOrOwned: ObjectRef,
  Shared: object({
    objectId: ObjectID,
    initialSharedVersion: JsonU64,
    mutable: boolean()
  }),
  Receiving: ObjectRef
});
var NormalizedCallArg2 = safeEnum({
  Object: ObjectArg2,
  Pure: array(pipe(number(), integer()))
});
var TransactionInput = union([object({
  kind: literal("Input"),
  index: pipe(number(), integer()),
  value: unknown(),
  type: optional(literal("object"))
}), object({
  kind: literal("Input"),
  index: pipe(number(), integer()),
  value: unknown(),
  type: literal("pure")
})]);
var TransactionExpiration3 = union([object({ Epoch: pipe(number(), integer()) }), object({ None: nullable(literal(true)) })]);
var StringEncodedBigint = pipe(union([
  number(),
  string(),
  bigint()
]), check((val) => {
  if (![
    "string",
    "number",
    "bigint"
  ].includes(typeof val))
    return false;
  try {
    BigInt(val);
    return true;
  } catch {
    return false;
  }
}));
var TypeTag2 = union([
  object({ bool: nullable(literal(true)) }),
  object({ u8: nullable(literal(true)) }),
  object({ u64: nullable(literal(true)) }),
  object({ u128: nullable(literal(true)) }),
  object({ address: nullable(literal(true)) }),
  object({ signer: nullable(literal(true)) }),
  object({ vector: lazy(() => TypeTag2) }),
  object({ struct: lazy(() => StructTag2) }),
  object({ u16: nullable(literal(true)) }),
  object({ u32: nullable(literal(true)) }),
  object({ u256: nullable(literal(true)) })
]);
var StructTag2 = object({
  address: string(),
  module: string(),
  name: string(),
  typeParams: array(TypeTag2)
});
var GasConfig = object({
  budget: optional(StringEncodedBigint),
  price: optional(StringEncodedBigint),
  payment: optional(array(ObjectRef)),
  owner: optional(string())
});
var TransactionArgumentTypes = [
  TransactionInput,
  object({ kind: literal("GasCoin") }),
  object({
    kind: literal("Result"),
    index: pipe(number(), integer())
  }),
  object({
    kind: literal("NestedResult"),
    index: pipe(number(), integer()),
    resultIndex: pipe(number(), integer())
  })
];
var TransactionArgument = union([...TransactionArgumentTypes]);
var MoveCallTransaction = object({
  kind: literal("MoveCall"),
  target: pipe(string(), check((target) => target.split("::").length === 3)),
  typeArguments: array(string()),
  arguments: array(TransactionArgument)
});
var TransferObjectsTransaction = object({
  kind: literal("TransferObjects"),
  objects: array(TransactionArgument),
  address: TransactionArgument
});
var SplitCoinsTransaction = object({
  kind: literal("SplitCoins"),
  coin: TransactionArgument,
  amounts: array(TransactionArgument)
});
var MergeCoinsTransaction = object({
  kind: literal("MergeCoins"),
  destination: TransactionArgument,
  sources: array(TransactionArgument)
});
var MakeMoveVecTransaction = object({
  kind: literal("MakeMoveVec"),
  type: union([object({ Some: TypeTag2 }), object({ None: nullable(literal(true)) })]),
  objects: array(TransactionArgument)
});
var TransactionType = union([...[
  MoveCallTransaction,
  TransferObjectsTransaction,
  SplitCoinsTransaction,
  MergeCoinsTransaction,
  object({
    kind: literal("Publish"),
    modules: array(array(pipe(number(), integer()))),
    dependencies: array(string())
  }),
  object({
    kind: literal("Upgrade"),
    modules: array(array(pipe(number(), integer()))),
    dependencies: array(string()),
    packageId: string(),
    ticket: TransactionArgument
  }),
  MakeMoveVecTransaction
]]);
var SerializedTransactionDataV1 = object({
  version: literal(1),
  sender: optional(string()),
  expiration: nullish(TransactionExpiration3),
  gasConfig: GasConfig,
  inputs: array(TransactionInput),
  transactions: array(TransactionType)
});
function serializeV1TransactionData(transactionData) {
  const inputs = transactionData.inputs.map((input, index) => {
    if (input.Object)
      return {
        kind: "Input",
        index,
        value: { Object: input.Object.ImmOrOwnedObject ? { ImmOrOwned: input.Object.ImmOrOwnedObject } : input.Object.Receiving ? { Receiving: {
          digest: input.Object.Receiving.digest,
          version: input.Object.Receiving.version,
          objectId: input.Object.Receiving.objectId
        } } : { Shared: {
          mutable: input.Object.SharedObject.mutable,
          initialSharedVersion: input.Object.SharedObject.initialSharedVersion,
          objectId: input.Object.SharedObject.objectId
        } } },
        type: "object"
      };
    if (input.Pure)
      return {
        kind: "Input",
        index,
        value: { Pure: Array.from(fromBase64(input.Pure.bytes)) },
        type: "pure"
      };
    if (input.UnresolvedPure)
      return {
        kind: "Input",
        type: "pure",
        index,
        value: input.UnresolvedPure.value
      };
    if (input.UnresolvedObject)
      return {
        kind: "Input",
        type: "object",
        index,
        value: input.UnresolvedObject.objectId
      };
    throw new Error("Invalid input");
  });
  return {
    version: 1,
    sender: transactionData.sender ?? undefined,
    expiration: transactionData.expiration?.$kind === "Epoch" ? { Epoch: Number(transactionData.expiration.Epoch) } : transactionData.expiration ? { None: true } : null,
    gasConfig: {
      owner: transactionData.gasData.owner ?? undefined,
      budget: transactionData.gasData.budget ?? undefined,
      price: transactionData.gasData.price ?? undefined,
      payment: transactionData.gasData.payment ?? undefined
    },
    inputs,
    transactions: transactionData.commands.map((command) => {
      if (command.MakeMoveVec)
        return {
          kind: "MakeMoveVec",
          type: command.MakeMoveVec.type === null ? { None: true } : { Some: TypeTagSerializer.parseFromStr(command.MakeMoveVec.type) },
          objects: command.MakeMoveVec.elements.map((arg) => convertTransactionArgument(arg, inputs))
        };
      if (command.MergeCoins)
        return {
          kind: "MergeCoins",
          destination: convertTransactionArgument(command.MergeCoins.destination, inputs),
          sources: command.MergeCoins.sources.map((arg) => convertTransactionArgument(arg, inputs))
        };
      if (command.MoveCall)
        return {
          kind: "MoveCall",
          target: `${command.MoveCall.package}::${command.MoveCall.module}::${command.MoveCall.function}`,
          typeArguments: command.MoveCall.typeArguments,
          arguments: command.MoveCall.arguments.map((arg) => convertTransactionArgument(arg, inputs))
        };
      if (command.Publish)
        return {
          kind: "Publish",
          modules: command.Publish.modules.map((mod) => Array.from(fromBase64(mod))),
          dependencies: command.Publish.dependencies
        };
      if (command.SplitCoins)
        return {
          kind: "SplitCoins",
          coin: convertTransactionArgument(command.SplitCoins.coin, inputs),
          amounts: command.SplitCoins.amounts.map((arg) => convertTransactionArgument(arg, inputs))
        };
      if (command.TransferObjects)
        return {
          kind: "TransferObjects",
          objects: command.TransferObjects.objects.map((arg) => convertTransactionArgument(arg, inputs)),
          address: convertTransactionArgument(command.TransferObjects.address, inputs)
        };
      if (command.Upgrade)
        return {
          kind: "Upgrade",
          modules: command.Upgrade.modules.map((mod) => Array.from(fromBase64(mod))),
          dependencies: command.Upgrade.dependencies,
          packageId: command.Upgrade.package,
          ticket: convertTransactionArgument(command.Upgrade.ticket, inputs)
        };
      throw new Error(`Unknown transaction ${Object.keys(command)}`);
    })
  };
}
function convertTransactionArgument(arg, inputs) {
  if (arg.$kind === "GasCoin")
    return { kind: "GasCoin" };
  if (arg.$kind === "Result")
    return {
      kind: "Result",
      index: arg.Result
    };
  if (arg.$kind === "NestedResult")
    return {
      kind: "NestedResult",
      index: arg.NestedResult[0],
      resultIndex: arg.NestedResult[1]
    };
  if (arg.$kind === "Input")
    return inputs[arg.Input];
  throw new Error(`Invalid argument ${Object.keys(arg)}`);
}
function transactionDataFromV1(data) {
  return parse(TransactionDataSchema, {
    version: 2,
    sender: data.sender ?? null,
    expiration: data.expiration ? "Epoch" in data.expiration ? { Epoch: data.expiration.Epoch } : { None: true } : null,
    gasData: {
      owner: data.gasConfig.owner ?? null,
      budget: data.gasConfig.budget?.toString() ?? null,
      price: data.gasConfig.price?.toString() ?? null,
      payment: data.gasConfig.payment?.map((ref) => ({
        digest: ref.digest,
        objectId: ref.objectId,
        version: ref.version.toString()
      })) ?? null
    },
    inputs: data.inputs.map((input) => {
      if (input.kind === "Input") {
        if (is(NormalizedCallArg2, input.value)) {
          const value = parse(NormalizedCallArg2, input.value);
          if (value.Object) {
            if (value.Object.ImmOrOwned)
              return { Object: { ImmOrOwnedObject: {
                objectId: value.Object.ImmOrOwned.objectId,
                version: String(value.Object.ImmOrOwned.version),
                digest: value.Object.ImmOrOwned.digest
              } } };
            if (value.Object.Shared)
              return { Object: { SharedObject: {
                mutable: value.Object.Shared.mutable ?? null,
                initialSharedVersion: value.Object.Shared.initialSharedVersion,
                objectId: value.Object.Shared.objectId
              } } };
            if (value.Object.Receiving)
              return { Object: { Receiving: {
                digest: value.Object.Receiving.digest,
                version: String(value.Object.Receiving.version),
                objectId: value.Object.Receiving.objectId
              } } };
            throw new Error("Invalid object input");
          }
          return { Pure: { bytes: toBase64(new Uint8Array(value.Pure)) } };
        }
        if (input.type === "object")
          return { UnresolvedObject: { objectId: input.value } };
        return { UnresolvedPure: { value: input.value } };
      }
      throw new Error("Invalid input");
    }),
    commands: data.transactions.map((transaction) => {
      switch (transaction.kind) {
        case "MakeMoveVec":
          return { MakeMoveVec: {
            type: "Some" in transaction.type ? TypeTagSerializer.tagToString(transaction.type.Some) : null,
            elements: transaction.objects.map((arg) => parseV1TransactionArgument(arg))
          } };
        case "MergeCoins":
          return { MergeCoins: {
            destination: parseV1TransactionArgument(transaction.destination),
            sources: transaction.sources.map((arg) => parseV1TransactionArgument(arg))
          } };
        case "MoveCall": {
          const [pkg, mod, fn] = transaction.target.split("::");
          return { MoveCall: {
            package: pkg,
            module: mod,
            function: fn,
            typeArguments: transaction.typeArguments,
            arguments: transaction.arguments.map((arg) => parseV1TransactionArgument(arg))
          } };
        }
        case "Publish":
          return { Publish: {
            modules: transaction.modules.map((mod) => toBase64(Uint8Array.from(mod))),
            dependencies: transaction.dependencies
          } };
        case "SplitCoins":
          return { SplitCoins: {
            coin: parseV1TransactionArgument(transaction.coin),
            amounts: transaction.amounts.map((arg) => parseV1TransactionArgument(arg))
          } };
        case "TransferObjects":
          return { TransferObjects: {
            objects: transaction.objects.map((arg) => parseV1TransactionArgument(arg)),
            address: parseV1TransactionArgument(transaction.address)
          } };
        case "Upgrade":
          return { Upgrade: {
            modules: transaction.modules.map((mod) => toBase64(Uint8Array.from(mod))),
            dependencies: transaction.dependencies,
            package: transaction.packageId,
            ticket: parseV1TransactionArgument(transaction.ticket)
          } };
      }
      throw new Error(`Unknown transaction ${Object.keys(transaction)}`);
    })
  });
}
function parseV1TransactionArgument(arg) {
  switch (arg.kind) {
    case "GasCoin":
      return { GasCoin: true };
    case "Result":
      return { Result: arg.index };
    case "NestedResult":
      return { NestedResult: [arg.index, arg.resultIndex] };
    case "Input":
      return { Input: arg.index };
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/utils.js
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber2(n, title = "") {
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix = title && `"${title}" `;
    throw new Error(`${prefix}expected integer >= 0, got ${n}`);
  }
}
function abytes2(value, length, title = "") {
  const bytes = isBytes2(value);
  const len = value?.length;
  const needsLen = length !== undefined;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash must wrapped by utils.createHasher");
  anumber2(h.outputLen);
  anumber2(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes2(out, undefined, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0;i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
var swap8IfBE = isLE ? (n) => n : (n) => byteSwap(n);
function byteSwap32(arr) {
  for (let i = 0;i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
var swap32IfBE = isLE ? (u) => u : byteSwap32;
var hasHexBuiltin2 = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes2(bytes);
  if (hasHexBuiltin2)
    return bytes.toHex();
  let hex2 = "";
  for (let i = 0;i < bytes.length; i++) {
    hex2 += hexes[bytes[i]];
  }
  return hex2;
}
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex2) {
  if (typeof hex2 !== "string")
    throw new Error("hex string expected, got " + typeof hex2);
  if (hasHexBuiltin2)
    return Uint8Array.fromHex(hex2);
  const hl = hex2.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array2 = new Uint8Array(al);
  for (let ai = 0, hi = 0;ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex2.charCodeAt(hi));
    const n2 = asciiToBase16(hex2.charCodeAt(hi + 1));
    if (n1 === undefined || n2 === undefined) {
      const char = hex2[hi] + hex2[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array2[ai] = n1 * 16 + n2;
  }
  return array2;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function kdfInputToBytes(data, errorTitle = "") {
  if (typeof data === "string")
    return utf8ToBytes(data);
  return abytes2(data, undefined, errorTitle);
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0;i < arrays.length; i++) {
    const a = arrays[i];
    abytes2(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0;i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function checkOpts(defaults, opts) {
  if (opts !== undefined && {}.toString.call(opts) !== "[object Object]")
    throw new Error("options must be object or undefined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(undefined);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var oidNist = (suffix) => ({
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/_blake.js
var BSIGMA = /* @__PURE__ */ Uint8Array.from([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9
]);
function G1s(a, b, c, d, x) {
  a = a + b + x | 0;
  d = rotr(d ^ a, 16);
  c = c + d | 0;
  b = rotr(b ^ c, 12);
  return { a, b, c, d };
}
function G2s(a, b, c, d, x) {
  a = a + b + x | 0;
  d = rotr(d ^ a, 8);
  c = c + d | 0;
  b = rotr(b ^ c, 7);
  return { a, b, c, d };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}

class HashMD {
  blockLen;
  outputLen;
  padOffset;
  isLE;
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE2) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes2(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0;pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (;blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos;i < blockLen; i++)
      buffer[i] = 0;
    view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE2);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0;i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor;
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
}
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA224_IV = /* @__PURE__ */ Uint32Array.from([
  3238371032,
  914150663,
  812702999,
  4144912697,
  4290775857,
  1750603025,
  1694076839,
  3204075428
]);
var SHA384_IV = /* @__PURE__ */ Uint32Array.from([
  3418070365,
  3238371032,
  1654270250,
  914150663,
  2438529370,
  812702999,
  355462360,
  4144912697,
  1731405415,
  4290775857,
  2394180231,
  1750603025,
  3675008525,
  1694076839,
  1203062813,
  3204075428
]);
var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  4089235720,
  3144134277,
  2227873595,
  1013904242,
  4271175723,
  2773480762,
  1595750129,
  1359893119,
  2917565137,
  2600822924,
  725511199,
  528734635,
  4215389547,
  1541459225,
  327033209
]);

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0;i < len; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var shrSH = (h, _l, s) => h >>> s;
var shrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
var rotr32H = (_h, l) => l;
var rotr32L = (h, _l) => h;
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/blake2.js
var B2B_IV = /* @__PURE__ */ Uint32Array.from([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var BBUF = /* @__PURE__ */ new Uint32Array(32);
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber2(keyLen);
  if (outputLen < 0 || outputLen > keyLen)
    throw new Error("outputLen bigger than keyLen");
  const { key, salt, personalization } = opts;
  if (key !== undefined && (key.length < 1 || key.length > keyLen))
    throw new Error('"key" expected to be undefined or of length=1..' + keyLen);
  if (salt !== undefined)
    abytes2(salt, saltLen, "salt");
  if (personalization !== undefined)
    abytes2(personalization, persLen, "personalization");
}

class _BLAKE2 {
  buffer;
  buffer32;
  finished = false;
  destroyed = false;
  length = 0;
  pos = 0;
  blockLen;
  outputLen;
  constructor(blockLen, outputLen) {
    anumber2(blockLen);
    anumber2(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u32(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes2(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0;pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE(data32);
        for (let pos32 = 0;pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE(data32);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean(this.buffer.subarray(pos));
    swap32IfBE(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE(buffer32);
    const out32 = u32(out);
    this.get().forEach((v, i) => out32[i] = swap8IfBE(v));
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to ||= new this.constructor({ dkLen: outputLen });
    to.set(...this.get());
    to.buffer.set(buffer);
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    to.outputLen = outputLen;
    return to;
  }
  clone() {
    return this._cloneInto();
  }
}

class _BLAKE2b extends _BLAKE2 {
  v0l = B2B_IV[0] | 0;
  v0h = B2B_IV[1] | 0;
  v1l = B2B_IV[2] | 0;
  v1h = B2B_IV[3] | 0;
  v2l = B2B_IV[4] | 0;
  v2h = B2B_IV[5] | 0;
  v3l = B2B_IV[6] | 0;
  v3h = B2B_IV[7] | 0;
  v4l = B2B_IV[8] | 0;
  v4h = B2B_IV[9] | 0;
  v5l = B2B_IV[10] | 0;
  v5h = B2B_IV[11] | 0;
  v6l = B2B_IV[12] | 0;
  v6h = B2B_IV[13] | 0;
  v7l = B2B_IV[14] | 0;
  v7h = B2B_IV[15] | 0;
  constructor(opts = {}) {
    const olen = opts.dkLen === undefined ? 64 : opts.dkLen;
    super(128, olen);
    checkBlake2Opts(olen, opts, 64, 16, 16);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== undefined) {
      abytes2(key, undefined, "key");
      keyLength = key.length;
    }
    this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== undefined) {
      abytes2(salt, undefined, "salt");
      const slt = u32(salt);
      this.v4l ^= swap8IfBE(slt[0]);
      this.v4h ^= swap8IfBE(slt[1]);
      this.v5l ^= swap8IfBE(slt[2]);
      this.v5h ^= swap8IfBE(slt[3]);
    }
    if (personalization !== undefined) {
      abytes2(personalization, undefined, "personalization");
      const pers = u32(personalization);
      this.v6l ^= swap8IfBE(pers[0]);
      this.v6h ^= swap8IfBE(pers[1]);
      this.v7l ^= swap8IfBE(pers[2]);
      this.v7h ^= swap8IfBE(pers[3]);
    }
    if (key !== undefined) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
    }
  }
  get() {
    let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
  }
  set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
    this.v0l = v0l | 0;
    this.v0h = v0h | 0;
    this.v1l = v1l | 0;
    this.v1h = v1h | 0;
    this.v2l = v2l | 0;
    this.v2h = v2h | 0;
    this.v3l = v3l | 0;
    this.v3h = v3h | 0;
    this.v4l = v4l | 0;
    this.v4h = v4h | 0;
    this.v5l = v5l | 0;
    this.v5h = v5h | 0;
    this.v6l = v6l | 0;
    this.v6h = v6h | 0;
    this.v7l = v7l | 0;
    this.v7h = v7h | 0;
  }
  compress(msg, offset, isLast) {
    this.get().forEach((v, i) => BBUF[i] = v);
    BBUF.set(B2B_IV, 16);
    let { h, l } = fromBig(BigInt(this.length));
    BBUF[24] = B2B_IV[8] ^ l;
    BBUF[25] = B2B_IV[9] ^ h;
    if (isLast) {
      BBUF[28] = ~BBUF[28];
      BBUF[29] = ~BBUF[29];
    }
    let j = 0;
    const s = BSIGMA;
    for (let i = 0;i < 12; i++) {
      G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
      G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
    }
    this.v0l ^= BBUF[0] ^ BBUF[16];
    this.v0h ^= BBUF[1] ^ BBUF[17];
    this.v1l ^= BBUF[2] ^ BBUF[18];
    this.v1h ^= BBUF[3] ^ BBUF[19];
    this.v2l ^= BBUF[4] ^ BBUF[20];
    this.v2h ^= BBUF[5] ^ BBUF[21];
    this.v3l ^= BBUF[6] ^ BBUF[22];
    this.v3h ^= BBUF[7] ^ BBUF[23];
    this.v4l ^= BBUF[8] ^ BBUF[24];
    this.v4h ^= BBUF[9] ^ BBUF[25];
    this.v5l ^= BBUF[10] ^ BBUF[26];
    this.v5h ^= BBUF[11] ^ BBUF[27];
    this.v6l ^= BBUF[12] ^ BBUF[28];
    this.v6h ^= BBUF[13] ^ BBUF[29];
    this.v7l ^= BBUF[14] ^ BBUF[30];
    this.v7h ^= BBUF[15] ^ BBUF[31];
    clean(BBUF);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
}
var blake2b = /* @__PURE__ */ createHasher((opts) => new _BLAKE2b(opts));
function compress(s, offset, msg, rounds, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  let j = 0;
  for (let i = 0;i < rounds; i++) {
    ({ a: v0, b: v4, c: v8, d: v12 } = G1s(v0, v4, v8, v12, msg[offset + s[j++]]));
    ({ a: v0, b: v4, c: v8, d: v12 } = G2s(v0, v4, v8, v12, msg[offset + s[j++]]));
    ({ a: v1, b: v5, c: v9, d: v13 } = G1s(v1, v5, v9, v13, msg[offset + s[j++]]));
    ({ a: v1, b: v5, c: v9, d: v13 } = G2s(v1, v5, v9, v13, msg[offset + s[j++]]));
    ({ a: v2, b: v6, c: v10, d: v14 } = G1s(v2, v6, v10, v14, msg[offset + s[j++]]));
    ({ a: v2, b: v6, c: v10, d: v14 } = G2s(v2, v6, v10, v14, msg[offset + s[j++]]));
    ({ a: v3, b: v7, c: v11, d: v15 } = G1s(v3, v7, v11, v15, msg[offset + s[j++]]));
    ({ a: v3, b: v7, c: v11, d: v15 } = G2s(v3, v7, v11, v15, msg[offset + s[j++]]));
    ({ a: v0, b: v5, c: v10, d: v15 } = G1s(v0, v5, v10, v15, msg[offset + s[j++]]));
    ({ a: v0, b: v5, c: v10, d: v15 } = G2s(v0, v5, v10, v15, msg[offset + s[j++]]));
    ({ a: v1, b: v6, c: v11, d: v12 } = G1s(v1, v6, v11, v12, msg[offset + s[j++]]));
    ({ a: v1, b: v6, c: v11, d: v12 } = G2s(v1, v6, v11, v12, msg[offset + s[j++]]));
    ({ a: v2, b: v7, c: v8, d: v13 } = G1s(v2, v7, v8, v13, msg[offset + s[j++]]));
    ({ a: v2, b: v7, c: v8, d: v13 } = G2s(v2, v7, v8, v13, msg[offset + s[j++]]));
    ({ a: v3, b: v4, c: v9, d: v14 } = G1s(v3, v4, v9, v14, msg[offset + s[j++]]));
    ({ a: v3, b: v4, c: v9, d: v14 } = G2s(v3, v4, v9, v14, msg[offset + s[j++]]));
  }
  return { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 };
}
var B2S_IV = /* @__PURE__ */ SHA256_IV.slice();

class _BLAKE2s extends _BLAKE2 {
  v0 = B2S_IV[0] | 0;
  v1 = B2S_IV[1] | 0;
  v2 = B2S_IV[2] | 0;
  v3 = B2S_IV[3] | 0;
  v4 = B2S_IV[4] | 0;
  v5 = B2S_IV[5] | 0;
  v6 = B2S_IV[6] | 0;
  v7 = B2S_IV[7] | 0;
  constructor(opts = {}) {
    const olen = opts.dkLen === undefined ? 32 : opts.dkLen;
    super(64, olen);
    checkBlake2Opts(olen, opts, 32, 8, 8);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== undefined) {
      abytes2(key, undefined, "key");
      keyLength = key.length;
    }
    this.v0 ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== undefined) {
      abytes2(salt, undefined, "salt");
      const slt = u32(salt);
      this.v4 ^= swap8IfBE(slt[0]);
      this.v5 ^= swap8IfBE(slt[1]);
    }
    if (personalization !== undefined) {
      abytes2(personalization, undefined, "personalization");
      const pers = u32(personalization);
      this.v6 ^= swap8IfBE(pers[0]);
      this.v7 ^= swap8IfBE(pers[1]);
    }
    if (key !== undefined) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
    }
  }
  get() {
    const { v0, v1, v2, v3, v4, v5, v6, v7 } = this;
    return [v0, v1, v2, v3, v4, v5, v6, v7];
  }
  set(v0, v1, v2, v3, v4, v5, v6, v7) {
    this.v0 = v0 | 0;
    this.v1 = v1 | 0;
    this.v2 = v2 | 0;
    this.v3 = v3 | 0;
    this.v4 = v4 | 0;
    this.v5 = v5 | 0;
    this.v6 = v6 | 0;
    this.v7 = v7 | 0;
  }
  compress(msg, offset, isLast) {
    const { h, l } = fromBig(BigInt(this.length));
    const { v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15 } = compress(BSIGMA, offset, msg, 10, this.v0, this.v1, this.v2, this.v3, this.v4, this.v5, this.v6, this.v7, B2S_IV[0], B2S_IV[1], B2S_IV[2], B2S_IV[3], l ^ B2S_IV[4], h ^ B2S_IV[5], isLast ? ~B2S_IV[6] : B2S_IV[6], B2S_IV[7]);
    this.v0 ^= v0 ^ v8;
    this.v1 ^= v1 ^ v9;
    this.v2 ^= v2 ^ v10;
    this.v3 ^= v3 ^ v11;
    this.v4 ^= v4 ^ v12;
    this.v5 ^= v5 ^ v13;
    this.v6 ^= v6 ^ v14;
    this.v7 ^= v7 ^ v15;
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/hash.mjs
function hashTypedData(typeTag, data) {
  const typeTagBytes = Array.from(`${typeTag}::`).map((e) => e.charCodeAt(0));
  const dataWithTag = new Uint8Array(typeTagBytes.length + data.length);
  dataWithTag.set(typeTagBytes);
  dataWithTag.set(data, typeTagBytes.length);
  return blake2b(dataWithTag, { dkLen: 32 });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/TransactionData.mjs
function prepareSuiAddress(address) {
  return normalizeSuiAddress(address).replace("0x", "");
}
var TransactionDataBuilder = class TransactionDataBuilder2 {
  static fromKindBytes(bytes) {
    const programmableTx = suiBcs.TransactionKind.parse(bytes).ProgrammableTransaction;
    if (!programmableTx)
      throw new Error("Unable to deserialize from bytes.");
    return TransactionDataBuilder2.restore({
      version: 2,
      sender: null,
      expiration: null,
      gasData: {
        budget: null,
        owner: null,
        payment: null,
        price: null
      },
      inputs: programmableTx.inputs,
      commands: programmableTx.commands
    });
  }
  static fromBytes(bytes) {
    const data = suiBcs.TransactionData.parse(bytes)?.V1;
    const programmableTx = data.kind.ProgrammableTransaction;
    if (!data || !programmableTx)
      throw new Error("Unable to deserialize from bytes.");
    return TransactionDataBuilder2.restore({
      version: 2,
      sender: data.sender,
      expiration: data.expiration,
      gasData: data.gasData,
      inputs: programmableTx.inputs,
      commands: programmableTx.commands
    });
  }
  static restore(data) {
    if (data.version === 2)
      return new TransactionDataBuilder2(parse(TransactionDataSchema, data));
    else
      return new TransactionDataBuilder2(parse(TransactionDataSchema, transactionDataFromV1(data)));
  }
  static getDigestFromBytes(bytes) {
    return toBase58(hashTypedData("TransactionData", bytes));
  }
  constructor(clone) {
    this.version = 2;
    this.sender = clone?.sender ?? null;
    this.expiration = clone?.expiration ?? null;
    this.inputs = clone?.inputs ?? [];
    this.commands = clone?.commands ?? [];
    this.gasData = clone?.gasData ?? {
      budget: null,
      price: null,
      owner: null,
      payment: null
    };
  }
  build({ maxSizeBytes = Infinity, overrides, onlyTransactionKind } = {}) {
    const inputs = this.inputs;
    const commands = this.commands;
    const kind = { ProgrammableTransaction: {
      inputs,
      commands
    } };
    if (onlyTransactionKind)
      return suiBcs.TransactionKind.serialize(kind, { maxSize: maxSizeBytes }).toBytes();
    const expiration = overrides?.expiration ?? this.expiration;
    const sender = overrides?.sender ?? this.sender;
    const gasData = {
      ...this.gasData,
      ...overrides?.gasData
    };
    if (!sender)
      throw new Error("Missing transaction sender");
    if (!gasData.budget)
      throw new Error("Missing gas budget");
    if (!gasData.payment)
      throw new Error("Missing gas payment");
    if (!gasData.price)
      throw new Error("Missing gas price");
    const transactionData = {
      sender: prepareSuiAddress(sender),
      expiration: expiration ? expiration : { None: true },
      gasData: {
        payment: gasData.payment,
        owner: prepareSuiAddress(this.gasData.owner ?? sender),
        price: BigInt(gasData.price),
        budget: BigInt(gasData.budget)
      },
      kind: { ProgrammableTransaction: {
        inputs,
        commands
      } }
    };
    return suiBcs.TransactionData.serialize({ V1: transactionData }, { maxSize: maxSizeBytes }).toBytes();
  }
  addInput(type, arg) {
    const index = this.inputs.length;
    this.inputs.push(arg);
    return {
      Input: index,
      type,
      $kind: "Input"
    };
  }
  getInputUses(index, fn) {
    this.mapArguments((arg, command) => {
      if (arg.$kind === "Input" && arg.Input === index)
        fn(arg, command);
      return arg;
    });
  }
  mapCommandArguments(index, fn) {
    const command = this.commands[index];
    switch (command.$kind) {
      case "MoveCall":
        command.MoveCall.arguments = command.MoveCall.arguments.map((arg) => fn(arg, command, index));
        break;
      case "TransferObjects":
        command.TransferObjects.objects = command.TransferObjects.objects.map((arg) => fn(arg, command, index));
        command.TransferObjects.address = fn(command.TransferObjects.address, command, index);
        break;
      case "SplitCoins":
        command.SplitCoins.coin = fn(command.SplitCoins.coin, command, index);
        command.SplitCoins.amounts = command.SplitCoins.amounts.map((arg) => fn(arg, command, index));
        break;
      case "MergeCoins":
        command.MergeCoins.destination = fn(command.MergeCoins.destination, command, index);
        command.MergeCoins.sources = command.MergeCoins.sources.map((arg) => fn(arg, command, index));
        break;
      case "MakeMoveVec":
        command.MakeMoveVec.elements = command.MakeMoveVec.elements.map((arg) => fn(arg, command, index));
        break;
      case "Upgrade":
        command.Upgrade.ticket = fn(command.Upgrade.ticket, command, index);
        break;
      case "$Intent":
        const inputs = command.$Intent.inputs;
        command.$Intent.inputs = {};
        for (const [key, value] of Object.entries(inputs))
          command.$Intent.inputs[key] = Array.isArray(value) ? value.map((arg) => fn(arg, command, index)) : fn(value, command, index);
        break;
      case "Publish":
        break;
      default:
        throw new Error(`Unexpected transaction kind: ${command.$kind}`);
    }
  }
  mapArguments(fn) {
    for (const commandIndex of this.commands.keys())
      this.mapCommandArguments(commandIndex, fn);
  }
  replaceCommand(index, replacement, resultIndex = index) {
    if (!Array.isArray(replacement)) {
      this.commands[index] = replacement;
      return;
    }
    const sizeDiff = replacement.length - 1;
    this.commands.splice(index, 1, ...structuredClone(replacement));
    this.mapArguments((arg, _command, commandIndex) => {
      if (commandIndex < index + replacement.length)
        return arg;
      if (typeof resultIndex !== "number") {
        if (arg.$kind === "Result" && arg.Result === index || arg.$kind === "NestedResult" && arg.NestedResult[0] === index)
          if (!("NestedResult" in arg) || arg.NestedResult[1] === 0)
            return parse(ArgumentSchema, structuredClone(resultIndex));
          else
            throw new Error(`Cannot replace command ${index} with a specific result type: NestedResult[${index}, ${arg.NestedResult[1]}] references a nested element that cannot be mapped to the replacement result`);
      }
      switch (arg.$kind) {
        case "Result":
          if (arg.Result === index && typeof resultIndex === "number")
            arg.Result = resultIndex;
          if (arg.Result > index)
            arg.Result += sizeDiff;
          break;
        case "NestedResult":
          if (arg.NestedResult[0] === index && typeof resultIndex === "number")
            return {
              $kind: "NestedResult",
              NestedResult: [resultIndex, arg.NestedResult[1]]
            };
          if (arg.NestedResult[0] > index)
            arg.NestedResult[0] += sizeDiff;
          break;
      }
      return arg;
    });
  }
  replaceCommandWithTransaction(index, otherTransaction, result) {
    if (result.$kind !== "Result" && result.$kind !== "NestedResult")
      throw new Error("Result must be of kind Result or NestedResult");
    this.insertTransaction(index, otherTransaction);
    this.replaceCommand(index + otherTransaction.commands.length, [], "Result" in result ? { NestedResult: [result.Result + index, 0] } : { NestedResult: [result.NestedResult[0] + index, result.NestedResult[1]] });
  }
  insertTransaction(atCommandIndex, otherTransaction) {
    const inputMapping = /* @__PURE__ */ new Map;
    const commandMapping = /* @__PURE__ */ new Map;
    for (let i = 0;i < otherTransaction.inputs.length; i++) {
      const otherInput = otherTransaction.inputs[i];
      const id = getIdFromCallArg(otherInput);
      let existingIndex = -1;
      if (id !== undefined) {
        existingIndex = this.inputs.findIndex((input) => getIdFromCallArg(input) === id);
        if (existingIndex !== -1 && this.inputs[existingIndex].Object?.SharedObject && otherInput.Object?.SharedObject)
          this.inputs[existingIndex].Object.SharedObject.mutable = this.inputs[existingIndex].Object.SharedObject.mutable || otherInput.Object.SharedObject.mutable;
      }
      if (existingIndex !== -1)
        inputMapping.set(i, existingIndex);
      else {
        const newIndex = this.inputs.length;
        this.inputs.push(otherInput);
        inputMapping.set(i, newIndex);
      }
    }
    for (let i = 0;i < otherTransaction.commands.length; i++)
      commandMapping.set(i, atCommandIndex + i);
    const remappedCommands = [];
    for (let i = 0;i < otherTransaction.commands.length; i++) {
      const command = structuredClone(otherTransaction.commands[i]);
      remapCommandArguments(command, inputMapping, commandMapping);
      remappedCommands.push(command);
    }
    this.commands.splice(atCommandIndex, 0, ...remappedCommands);
    const sizeDiff = remappedCommands.length;
    if (sizeDiff > 0)
      this.mapArguments((arg, _command, commandIndex) => {
        if (commandIndex >= atCommandIndex && commandIndex < atCommandIndex + remappedCommands.length)
          return arg;
        switch (arg.$kind) {
          case "Result":
            if (arg.Result >= atCommandIndex)
              arg.Result += sizeDiff;
            break;
          case "NestedResult":
            if (arg.NestedResult[0] >= atCommandIndex)
              arg.NestedResult[0] += sizeDiff;
            break;
        }
        return arg;
      });
  }
  getDigest() {
    const bytes = this.build({ onlyTransactionKind: false });
    return TransactionDataBuilder2.getDigestFromBytes(bytes);
  }
  snapshot() {
    return parse(TransactionDataSchema, this);
  }
  shallowClone() {
    return new TransactionDataBuilder2({
      version: this.version,
      sender: this.sender,
      expiration: this.expiration,
      gasData: { ...this.gasData },
      inputs: [...this.inputs],
      commands: [...this.commands]
    });
  }
  applyResolvedData(resolved) {
    if (!this.sender)
      this.sender = resolved.sender ?? null;
    if (!this.expiration)
      this.expiration = resolved.expiration ?? null;
    if (!this.gasData.budget)
      this.gasData.budget = resolved.gasData.budget;
    if (!this.gasData.owner)
      this.gasData.owner = resolved.gasData.owner ?? null;
    if (!this.gasData.payment)
      this.gasData.payment = resolved.gasData.payment;
    if (!this.gasData.price)
      this.gasData.price = resolved.gasData.price;
    for (let i = 0;i < this.inputs.length; i++) {
      const input = this.inputs[i];
      const resolvedInput = resolved.inputs[i];
      switch (input.$kind) {
        case "UnresolvedPure":
          if (resolvedInput.$kind !== "Pure")
            throw new Error(`Expected input at index ${i} to resolve to a Pure argument, but got ${JSON.stringify(resolvedInput)}`);
          this.inputs[i] = resolvedInput;
          break;
        case "UnresolvedObject":
          if (resolvedInput.$kind !== "Object")
            throw new Error(`Expected input at index ${i} to resolve to an Object argument, but got ${JSON.stringify(resolvedInput)}`);
          if (resolvedInput.Object.$kind === "ImmOrOwnedObject" || resolvedInput.Object.$kind === "Receiving") {
            const original = input.UnresolvedObject;
            const resolved$1 = resolvedInput.Object.ImmOrOwnedObject ?? resolvedInput.Object.Receiving;
            if (normalizeSuiAddress(original.objectId) !== normalizeSuiAddress(resolved$1.objectId) || original.version != null && original.version !== resolved$1.version || original.digest != null && original.digest !== resolved$1.digest || original.mutable != null || original.initialSharedVersion != null)
              throw new Error(`Input at index ${i} did not match unresolved object. ${JSON.stringify(original)} is not compatible with ${JSON.stringify(resolved$1)}`);
          } else if (resolvedInput.Object.$kind === "SharedObject") {
            const original = input.UnresolvedObject;
            const resolved$1 = resolvedInput.Object.SharedObject;
            if (normalizeSuiAddress(original.objectId) !== normalizeSuiAddress(resolved$1.objectId) || original.initialSharedVersion != null && original.initialSharedVersion !== resolved$1.initialSharedVersion || original.mutable != null && original.mutable !== resolved$1.mutable || original.version != null || original.digest != null)
              throw new Error(`Input at index ${i} did not match unresolved object. ${JSON.stringify(original)} is not compatible with ${JSON.stringify(resolved$1)}`);
          } else
            throw new Error(`Input at index ${i} resolved to an unexpected Object kind: ${JSON.stringify(resolvedInput.Object)}`);
          this.inputs[i] = resolvedInput;
          break;
      }
    }
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/Commands.mjs
var TransactionCommands = {
  MoveCall(input) {
    const [pkg, mod = "", fn = ""] = "target" in input ? input.target.split("::") : [
      input.package,
      input.module,
      input.function
    ];
    return {
      $kind: "MoveCall",
      MoveCall: {
        package: pkg,
        module: mod,
        function: fn,
        typeArguments: input.typeArguments ?? [],
        arguments: input.arguments ?? []
      }
    };
  },
  TransferObjects(objects, address) {
    return {
      $kind: "TransferObjects",
      TransferObjects: {
        objects: objects.map((o) => parse(ArgumentSchema, o)),
        address: parse(ArgumentSchema, address)
      }
    };
  },
  SplitCoins(coin, amounts) {
    return {
      $kind: "SplitCoins",
      SplitCoins: {
        coin: parse(ArgumentSchema, coin),
        amounts: amounts.map((o) => parse(ArgumentSchema, o))
      }
    };
  },
  MergeCoins(destination, sources) {
    return {
      $kind: "MergeCoins",
      MergeCoins: {
        destination: parse(ArgumentSchema, destination),
        sources: sources.map((o) => parse(ArgumentSchema, o))
      }
    };
  },
  Publish({ modules, dependencies }) {
    return {
      $kind: "Publish",
      Publish: {
        modules: modules.map((module) => typeof module === "string" ? module : toBase64(new Uint8Array(module))),
        dependencies: dependencies.map((dep) => normalizeSuiObjectId(dep))
      }
    };
  },
  Upgrade({ modules, dependencies, package: packageId, ticket }) {
    return {
      $kind: "Upgrade",
      Upgrade: {
        modules: modules.map((module) => typeof module === "string" ? module : toBase64(new Uint8Array(module))),
        dependencies: dependencies.map((dep) => normalizeSuiObjectId(dep)),
        package: packageId,
        ticket: parse(ArgumentSchema, ticket)
      }
    };
  },
  MakeMoveVec({ type, elements }) {
    return {
      $kind: "MakeMoveVec",
      MakeMoveVec: {
        type: type ?? null,
        elements: elements.map((o) => parse(ArgumentSchema, o))
      }
    };
  },
  Intent({ name, inputs = {}, data = {} }) {
    return {
      $kind: "$Intent",
      $Intent: {
        name,
        inputs: Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, Array.isArray(value) ? value.map((o) => parse(ArgumentSchema, o)) : parse(ArgumentSchema, value)])),
        data
      }
    };
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/Inputs.mjs
function Pure(data) {
  return {
    $kind: "Pure",
    Pure: { bytes: data instanceof Uint8Array ? toBase64(data) : data.toBase64() }
  };
}
var Inputs = {
  Pure,
  ObjectRef({ objectId, digest, version }) {
    return {
      $kind: "Object",
      Object: {
        $kind: "ImmOrOwnedObject",
        ImmOrOwnedObject: {
          digest,
          version,
          objectId: normalizeSuiAddress(objectId)
        }
      }
    };
  },
  SharedObjectRef({ objectId, mutable, initialSharedVersion }) {
    return {
      $kind: "Object",
      Object: {
        $kind: "SharedObject",
        SharedObject: {
          mutable,
          initialSharedVersion,
          objectId: normalizeSuiAddress(objectId)
        }
      }
    };
  },
  ReceivingRef({ objectId, digest, version }) {
    return {
      $kind: "Object",
      Object: {
        $kind: "Receiving",
        Receiving: {
          digest,
          version,
          objectId: normalizeSuiAddress(objectId)
        }
      }
    };
  },
  FundsWithdrawal({ reservation, typeArg, withdrawFrom }) {
    return {
      $kind: "FundsWithdrawal",
      FundsWithdrawal: {
        reservation,
        typeArg,
        withdrawFrom
      }
    };
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/utils/constants.mjs
var MIST_PER_SUI = BigInt(1e9);
var MOVE_STDLIB_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000001";
var SUI_FRAMEWORK_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000002";
var SUI_CLOCK_OBJECT_ID = "0x0000000000000000000000000000000000000000000000000000000000000006";
var SUI_TYPE_ARG = `${SUI_FRAMEWORK_ADDRESS}::sui::SUI`;
var SUI_SYSTEM_STATE_OBJECT_ID = "0x0000000000000000000000000000000000000000000000000000000000000005";
var SUI_RANDOM_OBJECT_ID = "0x0000000000000000000000000000000000000000000000000000000000000008";
var SUI_DENY_LIST_OBJECT_ID = "0x0000000000000000000000000000000000000000000000000000000000000403";

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/serializer.mjs
function parseTypeName(typeName) {
  const parts = typeName.split("::");
  if (parts.length !== 3)
    throw new Error(`Invalid type name format: ${typeName}`);
  return {
    package: parts[0],
    module: parts[1],
    name: parts[2]
  };
}
function isTxContext(param) {
  if (param.body.$kind !== "datatype")
    return false;
  const { package: pkg, module, name } = parseTypeName(param.body.datatype.typeName);
  return normalizeSuiAddress(pkg) === SUI_FRAMEWORK_ADDRESS && module === "tx_context" && name === "TxContext";
}
function getPureBcsSchema(typeSignature) {
  switch (typeSignature.$kind) {
    case "address":
      return suiBcs.Address;
    case "bool":
      return suiBcs.Bool;
    case "u8":
      return suiBcs.U8;
    case "u16":
      return suiBcs.U16;
    case "u32":
      return suiBcs.U32;
    case "u64":
      return suiBcs.U64;
    case "u128":
      return suiBcs.U128;
    case "u256":
      return suiBcs.U256;
    case "vector": {
      if (typeSignature.vector.$kind === "u8")
        return suiBcs.byteVector().transform({
          input: (val) => typeof val === "string" ? new TextEncoder().encode(val) : val,
          output: (val) => val
        });
      const type = getPureBcsSchema(typeSignature.vector);
      return type ? suiBcs.vector(type) : null;
    }
    case "datatype": {
      const { package: pkg, module, name } = parseTypeName(typeSignature.datatype.typeName);
      const normalizedPkg = normalizeSuiAddress(pkg);
      if (normalizedPkg === MOVE_STDLIB_ADDRESS) {
        if (module === "ascii" && name === "String")
          return suiBcs.String;
        if (module === "string" && name === "String")
          return suiBcs.String;
        if (module === "option" && name === "Option") {
          const type = getPureBcsSchema(typeSignature.datatype.typeParameters[0]);
          return type ? suiBcs.vector(type) : null;
        }
      }
      if (normalizedPkg === SUI_FRAMEWORK_ADDRESS) {
        if (module === "object" && name === "ID")
          return suiBcs.Address;
      }
      return null;
    }
    case "typeParameter":
    case "unknown":
      return null;
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/intents/CoinWithBalance.mjs
var COIN_WITH_BALANCE = "CoinWithBalance";
var SUI_TYPE = normalizeStructTag("0x2::sui::SUI");
var CoinWithBalanceData = object({
  type: string(),
  balance: bigint()
});
async function resolveCoinBalance(transactionData, buildOptions, next) {
  const coinTypes = /* @__PURE__ */ new Set;
  const totalByType = /* @__PURE__ */ new Map;
  if (!transactionData.sender)
    throw new Error("Sender must be set to resolve CoinWithBalance");
  for (const command of transactionData.commands)
    if (command.$kind === "$Intent" && command.$Intent.name === COIN_WITH_BALANCE) {
      const { type, balance } = parse(CoinWithBalanceData, command.$Intent.data);
      if (type !== "gas" && balance > 0n)
        coinTypes.add(type);
      totalByType.set(type, (totalByType.get(type) ?? 0n) + balance);
    }
  const usedIds = /* @__PURE__ */ new Set;
  for (const input of transactionData.inputs) {
    if (input.Object?.ImmOrOwnedObject)
      usedIds.add(input.Object.ImmOrOwnedObject.objectId);
    if (input.UnresolvedObject?.objectId)
      usedIds.add(input.UnresolvedObject.objectId);
  }
  const coinsByType = /* @__PURE__ */ new Map;
  const addressBalanceByType = /* @__PURE__ */ new Map;
  const client = buildOptions.client;
  if (!client)
    throw new Error("Client must be provided to build or serialize transactions with CoinWithBalance intents");
  await Promise.all([...[...coinTypes].map(async (coinType) => {
    const { coins, addressBalance } = await getCoinsAndBalanceOfType({
      coinType,
      balance: totalByType.get(coinType),
      client,
      owner: transactionData.sender,
      usedIds
    });
    coinsByType.set(coinType, coins);
    addressBalanceByType.set(coinType, addressBalance);
  }), totalByType.has("gas") ? await client.core.getBalance({
    owner: transactionData.sender,
    coinType: SUI_TYPE
  }).then(({ balance }) => {
    addressBalanceByType.set("gas", BigInt(balance.addressBalance));
  }) : null]);
  const mergedCoins = /* @__PURE__ */ new Map;
  for (const [index, transaction] of transactionData.commands.entries()) {
    if (transaction.$kind !== "$Intent" || transaction.$Intent.name !== COIN_WITH_BALANCE)
      continue;
    const { type, balance } = transaction.$Intent.data;
    if (balance === 0n) {
      transactionData.replaceCommand(index, TransactionCommands.MoveCall({
        target: "0x2::coin::zero",
        typeArguments: [type === "gas" ? SUI_TYPE : type]
      }));
      continue;
    }
    const commands = [];
    if (addressBalanceByType.get(type) >= totalByType.get(type))
      commands.push(TransactionCommands.MoveCall({
        target: "0x2::coin::redeem_funds",
        typeArguments: [type === "gas" ? SUI_TYPE : type],
        arguments: [transactionData.addInput("withdrawal", Inputs.FundsWithdrawal({
          reservation: {
            $kind: "MaxAmountU64",
            MaxAmountU64: String(balance)
          },
          typeArg: {
            $kind: "Balance",
            Balance: type === "gas" ? SUI_TYPE : type
          },
          withdrawFrom: {
            $kind: "Sender",
            Sender: true
          }
        }))]
      }));
    else {
      if (!mergedCoins.has(type)) {
        const addressBalance = addressBalanceByType.get(type) ?? 0n;
        const coinType = type === "gas" ? SUI_TYPE : type;
        let baseCoin;
        let restCoins;
        if (type === "gas") {
          baseCoin = {
            $kind: "GasCoin",
            GasCoin: true
          };
          restCoins = [];
        } else
          [baseCoin, ...restCoins] = coinsByType.get(type).map((coin) => transactionData.addInput("object", Inputs.ObjectRef({
            objectId: coin.objectId,
            digest: coin.digest,
            version: coin.version
          })));
        if (addressBalance > 0n) {
          commands.push(TransactionCommands.MoveCall({
            target: "0x2::coin::redeem_funds",
            typeArguments: [coinType],
            arguments: [transactionData.addInput("withdrawal", Inputs.FundsWithdrawal({
              reservation: {
                $kind: "MaxAmountU64",
                MaxAmountU64: String(addressBalance)
              },
              typeArg: {
                $kind: "Balance",
                Balance: coinType
              },
              withdrawFrom: {
                $kind: "Sender",
                Sender: true
              }
            }))]
          }));
          commands.push(TransactionCommands.MergeCoins(baseCoin, [{
            $kind: "Result",
            Result: index + commands.length - 1
          }, ...restCoins]));
        } else if (restCoins.length > 0)
          commands.push(TransactionCommands.MergeCoins(baseCoin, restCoins));
        mergedCoins.set(type, baseCoin);
      }
      commands.push(TransactionCommands.SplitCoins(mergedCoins.get(type), [transactionData.addInput("pure", Inputs.Pure(suiBcs.u64().serialize(balance)))]));
    }
    transactionData.replaceCommand(index, commands);
    transactionData.mapArguments((arg, _command, commandIndex) => {
      if (commandIndex >= index && commandIndex < index + commands.length)
        return arg;
      if (arg.$kind === "Result" && arg.Result === index)
        return {
          $kind: "NestedResult",
          NestedResult: [index + commands.length - 1, 0]
        };
      return arg;
    });
  }
  return next();
}
async function getCoinsAndBalanceOfType({ coinType, balance, client, owner, usedIds }) {
  let remainingBalance = balance;
  const coins = [];
  const balanceRequest = client.core.getBalance({
    owner,
    coinType
  }).then(({ balance: balance$1 }) => {
    remainingBalance -= BigInt(balance$1.addressBalance);
    return balance$1;
  });
  const [allCoins, balanceResponse] = await Promise.all([loadMoreCoins(), balanceRequest]);
  if (BigInt(balanceResponse.balance) < balance)
    throw new Error(`Insufficient balance of ${coinType} for owner ${owner}. Required: ${balance}, Available: ${balance - remainingBalance}`);
  return {
    coins: allCoins,
    balance: BigInt(balanceResponse.coinBalance),
    addressBalance: BigInt(balanceResponse.addressBalance),
    coinBalance: BigInt(balanceResponse.coinBalance)
  };
  async function loadMoreCoins(cursor = null) {
    const { objects, hasNextPage, cursor: nextCursor } = await client.core.listCoins({
      owner,
      coinType,
      cursor
    });
    await balanceRequest;
    if (remainingBalance > 0n) {
      for (const coin of objects) {
        if (usedIds.has(coin.objectId))
          continue;
        const coinBalance = BigInt(coin.balance);
        coins.push(coin);
        remainingBalance -= coinBalance;
        if (remainingBalance <= 0)
          break;
      }
      if (hasNextPage)
        return loadMoreCoins(nextCursor);
    }
    return coins;
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/data/v2.mjs
function enumUnion(options) {
  return union(Object.entries(options).map(([key, value]) => object({ [key]: value })));
}
var Argument2 = enumUnion({
  GasCoin: literal(true),
  Input: pipe(number(), integer()),
  Result: pipe(number(), integer()),
  NestedResult: tuple([pipe(number(), integer()), pipe(number(), integer())])
});
var GasData2 = object({
  budget: nullable(JsonU64),
  price: nullable(JsonU64),
  owner: nullable(SuiAddress),
  payment: nullable(array(ObjectRefSchema))
});
var ProgrammableMoveCall2 = object({
  package: ObjectID,
  module: string(),
  function: string(),
  typeArguments: array(string()),
  arguments: array(Argument2)
});
var $Intent2 = object({
  name: string(),
  inputs: record(string(), union([Argument2, array(Argument2)])),
  data: record(string(), unknown())
});
var Command2 = enumUnion({
  MoveCall: ProgrammableMoveCall2,
  TransferObjects: object({
    objects: array(Argument2),
    address: Argument2
  }),
  SplitCoins: object({
    coin: Argument2,
    amounts: array(Argument2)
  }),
  MergeCoins: object({
    destination: Argument2,
    sources: array(Argument2)
  }),
  Publish: object({
    modules: array(BCSBytes),
    dependencies: array(ObjectID)
  }),
  MakeMoveVec: object({
    type: nullable(string()),
    elements: array(Argument2)
  }),
  Upgrade: object({
    modules: array(BCSBytes),
    dependencies: array(ObjectID),
    package: ObjectID,
    ticket: Argument2
  }),
  $Intent: $Intent2
});
var CallArg2 = enumUnion({
  Object: enumUnion({
    ImmOrOwnedObject: ObjectRefSchema,
    SharedObject: object({
      objectId: ObjectID,
      initialSharedVersion: JsonU64,
      mutable: boolean()
    }),
    Receiving: ObjectRefSchema
  }),
  Pure: object({ bytes: BCSBytes }),
  UnresolvedPure: object({ value: unknown() }),
  UnresolvedObject: object({
    objectId: ObjectID,
    version: optional(nullable(JsonU64)),
    digest: optional(nullable(string())),
    initialSharedVersion: optional(nullable(JsonU64)),
    mutable: optional(nullable(boolean()))
  }),
  FundsWithdrawal: FundsWithdrawalArgSchema
});
var TransactionExpiration4 = enumUnion({
  None: literal(true),
  Epoch: JsonU64,
  ValidDuring: ValidDuringSchema
});
var SerializedTransactionDataV2Schema = object({
  version: literal(2),
  sender: nullish(SuiAddress),
  expiration: nullish(TransactionExpiration4),
  gasData: GasData2,
  inputs: array(CallArg2),
  commands: array(Command2),
  digest: optional(nullable(string()))
});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/client/errors.mjs
var SuiClientError = class extends Error {
};
var SimulationError = class extends SuiClientError {
  constructor(message, options) {
    super(message, { cause: options?.cause });
    this.executionError = options?.executionError;
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/client/core-resolver.mjs
var MAX_OBJECTS_PER_FETCH = 50;
var GAS_SAFE_OVERHEAD = 1000n;
var MAX_GAS = 50000000000;
function getClient(options) {
  if (!options.client)
    throw new Error(`No sui client passed to Transaction#build, but transaction data was not sufficient to build offline.`);
  return options.client;
}
async function coreClientResolveTransactionPlugin(transactionData, options, next) {
  const client = getClient(options);
  await normalizeInputs(transactionData, client);
  await resolveObjectReferences(transactionData, client);
  if (!options.onlyTransactionKind)
    await setGasData(transactionData, client);
  return await next();
}
async function setGasData(transactionData, client) {
  let systemState = null;
  if (!transactionData.gasData.price) {
    systemState = (await client.core.getCurrentSystemState()).systemState;
    transactionData.gasData.price = systemState.referenceGasPrice;
  }
  await setGasBudget(transactionData, client);
  await setGasPayment(transactionData, client);
  if (!transactionData.expiration)
    await setExpiration(transactionData, client, systemState);
}
async function setGasBudget(transactionData, client) {
  if (transactionData.gasData.budget)
    return;
  const simulateResult = await client.core.simulateTransaction({
    transaction: transactionData.build({ overrides: { gasData: {
      budget: String(MAX_GAS),
      payment: []
    } } }),
    include: { effects: true }
  });
  if (simulateResult.$kind === "FailedTransaction") {
    const executionError = simulateResult.FailedTransaction.status.error ?? undefined;
    throw new SimulationError(`Transaction resolution failed: ${executionError?.message ?? "Unknown error"}`, {
      cause: simulateResult,
      executionError
    });
  }
  const gasUsed = simulateResult.Transaction.effects.gasUsed;
  const safeOverhead = GAS_SAFE_OVERHEAD * BigInt(transactionData.gasData.price || 1n);
  const baseComputationCostWithOverhead = BigInt(gasUsed.computationCost) + safeOverhead;
  const gasBudget = baseComputationCostWithOverhead + BigInt(gasUsed.storageCost) - BigInt(gasUsed.storageRebate);
  transactionData.gasData.budget = String(gasBudget > baseComputationCostWithOverhead ? gasBudget : baseComputationCostWithOverhead);
}
async function setGasPayment(transactionData, client) {
  if (!transactionData.gasData.payment) {
    const gasPayer = transactionData.gasData.owner ?? transactionData.sender;
    let usesGasCoin = false;
    let withdrawals = 0n;
    transactionData.mapArguments((arg) => {
      if (arg.$kind === "GasCoin")
        usesGasCoin = true;
      else if (arg.$kind === "Input") {
        const input = transactionData.inputs[arg.Input];
        if (input.$kind === "FundsWithdrawal") {
          if ((input.FundsWithdrawal.withdrawFrom.Sender ? transactionData.sender : gasPayer) === gasPayer) {
            if (input.FundsWithdrawal.reservation.$kind === "MaxAmountU64")
              withdrawals += BigInt(input.FundsWithdrawal.reservation.MaxAmountU64);
          }
        }
      }
      return arg;
    });
    const [suiBalance, coins] = await Promise.all([usesGasCoin || !transactionData.gasData.owner ? null : client.core.getBalance({ owner: transactionData.gasData.owner }), client.core.listCoins({
      owner: transactionData.gasData.owner || transactionData.sender,
      coinType: SUI_TYPE_ARG
    })]);
    if (suiBalance?.balance.addressBalance && BigInt(suiBalance.balance.addressBalance) >= BigInt(transactionData.gasData.budget || "0") + withdrawals) {
      transactionData.gasData.payment = [];
      return;
    }
    const paymentCoins = coins.objects.filter((coin) => {
      return !transactionData.inputs.find((input) => {
        if (input.Object?.ImmOrOwnedObject)
          return coin.objectId === input.Object.ImmOrOwnedObject.objectId;
        return false;
      });
    }).map((coin) => parse(ObjectRefSchema, {
      objectId: coin.objectId,
      digest: coin.digest,
      version: coin.version
    }));
    if (!paymentCoins.length)
      throw new Error("No valid gas coins found for the transaction.");
    transactionData.gasData.payment = paymentCoins;
  }
}
async function setExpiration(transactionData, client, existingSystemState) {
  const [systemState, { chainIdentifier }] = await Promise.all([existingSystemState ?? client.core.getCurrentSystemState().then((r) => r.systemState), client.core.getChainIdentifier()]);
  const currentEpoch = BigInt(systemState.epoch);
  transactionData.expiration = {
    $kind: "ValidDuring",
    ValidDuring: {
      minEpoch: String(currentEpoch),
      maxEpoch: String(currentEpoch + 1n),
      minTimestamp: null,
      maxTimestamp: null,
      chain: chainIdentifier,
      nonce: Math.random() * 4294967296 >>> 0
    }
  };
}
async function resolveObjectReferences(transactionData, client) {
  const objectsToResolve = transactionData.inputs.filter((input) => {
    return input.UnresolvedObject && !(input.UnresolvedObject.version || input.UnresolvedObject?.initialSharedVersion);
  });
  const dedupedIds = [...new Set(objectsToResolve.map((input) => normalizeSuiObjectId(input.UnresolvedObject.objectId)))];
  const objectChunks = dedupedIds.length ? chunk(dedupedIds, MAX_OBJECTS_PER_FETCH) : [];
  const resolved = (await Promise.all(objectChunks.map((chunkIds) => client.core.getObjects({ objectIds: chunkIds })))).flatMap((result) => result.objects);
  const responsesById = new Map(dedupedIds.map((id, index) => {
    return [id, resolved[index]];
  }));
  const invalidObjects = Array.from(responsesById).filter(([_, obj]) => obj instanceof Error).map(([_, obj]) => obj.message);
  if (invalidObjects.length)
    throw new Error(`The following input objects are invalid: ${invalidObjects.join(", ")}`);
  const objects = resolved.map((object$1) => {
    if (object$1 instanceof Error)
      throw new Error(`Failed to fetch object: ${object$1.message}`);
    const owner = object$1.owner;
    const initialSharedVersion = owner && typeof owner === "object" ? owner.$kind === "Shared" ? owner.Shared.initialSharedVersion : owner.$kind === "ConsensusAddressOwner" ? owner.ConsensusAddressOwner.startVersion : null : null;
    return {
      objectId: object$1.objectId,
      digest: object$1.digest,
      version: object$1.version,
      initialSharedVersion
    };
  });
  const objectsById = new Map(dedupedIds.map((id, index) => {
    return [id, objects[index]];
  }));
  for (const [index, input] of transactionData.inputs.entries()) {
    if (!input.UnresolvedObject)
      continue;
    let updated;
    const id = normalizeSuiAddress(input.UnresolvedObject.objectId);
    const object$1 = objectsById.get(id);
    if (input.UnresolvedObject.initialSharedVersion ?? object$1?.initialSharedVersion)
      updated = Inputs.SharedObjectRef({
        objectId: id,
        initialSharedVersion: input.UnresolvedObject.initialSharedVersion || object$1?.initialSharedVersion,
        mutable: input.UnresolvedObject.mutable || isUsedAsMutable(transactionData, index)
      });
    else if (isUsedAsReceiving(transactionData, index))
      updated = Inputs.ReceivingRef({
        objectId: id,
        digest: input.UnresolvedObject.digest ?? object$1?.digest,
        version: input.UnresolvedObject.version ?? object$1?.version
      });
    transactionData.inputs[transactionData.inputs.indexOf(input)] = updated ?? Inputs.ObjectRef({
      objectId: id,
      digest: input.UnresolvedObject.digest ?? object$1?.digest,
      version: input.UnresolvedObject.version ?? object$1?.version
    });
  }
}
async function normalizeInputs(transactionData, client) {
  const { inputs, commands } = transactionData;
  const moveCallsToResolve = [];
  const moveFunctionsToResolve = /* @__PURE__ */ new Set;
  commands.forEach((command) => {
    if (command.MoveCall) {
      if (command.MoveCall._argumentTypes)
        return;
      if (command.MoveCall.arguments.map((arg) => {
        if (arg.$kind === "Input")
          return transactionData.inputs[arg.Input];
        return null;
      }).some((input) => input?.UnresolvedPure || input?.UnresolvedObject && typeof input?.UnresolvedObject.mutable !== "boolean")) {
        const functionName = `${command.MoveCall.package}::${command.MoveCall.module}::${command.MoveCall.function}`;
        moveFunctionsToResolve.add(functionName);
        moveCallsToResolve.push(command.MoveCall);
      }
    }
  });
  const moveFunctionParameters = /* @__PURE__ */ new Map;
  if (moveFunctionsToResolve.size > 0)
    await Promise.all([...moveFunctionsToResolve].map(async (functionName) => {
      const [packageId, moduleName, name] = functionName.split("::");
      const { function: def } = await client.core.getMoveFunction({
        packageId,
        moduleName,
        name
      });
      moveFunctionParameters.set(functionName, def.parameters);
    }));
  if (moveCallsToResolve.length)
    await Promise.all(moveCallsToResolve.map(async (moveCall) => {
      const parameters = moveFunctionParameters.get(`${moveCall.package}::${moveCall.module}::${moveCall.function}`);
      if (!parameters)
        return;
      moveCall._argumentTypes = parameters.length > 0 && isTxContext(parameters.at(-1)) ? parameters.slice(0, parameters.length - 1) : parameters;
    }));
  commands.forEach((command) => {
    if (!command.MoveCall)
      return;
    const moveCall = command.MoveCall;
    const fnName = `${moveCall.package}::${moveCall.module}::${moveCall.function}`;
    const params = moveCall._argumentTypes;
    if (!params)
      return;
    if (params.length !== command.MoveCall.arguments.length)
      throw new Error(`Incorrect number of arguments for ${fnName}`);
    params.forEach((param, i) => {
      const arg = moveCall.arguments[i];
      if (arg.$kind !== "Input")
        return;
      const input = inputs[arg.Input];
      if (!input.UnresolvedPure && !input.UnresolvedObject)
        return;
      const inputValue = input.UnresolvedPure?.value ?? input.UnresolvedObject?.objectId;
      const schema = getPureBcsSchema(param.body);
      if (schema) {
        arg.type = "pure";
        inputs[inputs.indexOf(input)] = Inputs.Pure(schema.serialize(inputValue));
        return;
      }
      if (typeof inputValue !== "string")
        throw new Error(`Expect the argument to be an object id string, got ${JSON.stringify(inputValue, null, 2)}`);
      arg.type = "object";
      const unresolvedObject = input.UnresolvedPure ? {
        $kind: "UnresolvedObject",
        UnresolvedObject: { objectId: inputValue }
      } : input;
      inputs[arg.Input] = unresolvedObject;
    });
  });
}
function isUsedAsMutable(transactionData, index) {
  let usedAsMutable = false;
  transactionData.getInputUses(index, (arg, tx) => {
    if (tx.MoveCall && tx.MoveCall._argumentTypes) {
      const argIndex = tx.MoveCall.arguments.indexOf(arg);
      usedAsMutable = tx.MoveCall._argumentTypes[argIndex].reference !== "immutable" || usedAsMutable;
    }
    if (tx.$kind === "MakeMoveVec" || tx.$kind === "MergeCoins" || tx.$kind === "SplitCoins" || tx.$kind === "TransferObjects")
      usedAsMutable = true;
  });
  return usedAsMutable;
}
function isUsedAsReceiving(transactionData, index) {
  let usedAsReceiving = false;
  transactionData.getInputUses(index, (arg, tx) => {
    if (tx.MoveCall && tx.MoveCall._argumentTypes) {
      const argIndex = tx.MoveCall.arguments.indexOf(arg);
      usedAsReceiving = isReceivingType(tx.MoveCall._argumentTypes[argIndex]) || usedAsReceiving;
    }
  });
  return usedAsReceiving;
}
var RECEIVING_TYPE = "0x0000000000000000000000000000000000000000000000000000000000000002::transfer::Receiving";
function isReceivingType(type) {
  if (type.body.$kind !== "datatype")
    return false;
  return type.body.datatype.typeName === RECEIVING_TYPE;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/resolve.mjs
function needsTransactionResolution(data, options) {
  if (data.inputs.some((input) => {
    return input.UnresolvedObject || input.UnresolvedPure;
  }))
    return true;
  if (!options.onlyTransactionKind) {
    if (!data.gasData.price || !data.gasData.budget || !data.gasData.payment)
      return true;
    if (data.gasData.payment.length === 0 && !data.expiration)
      return true;
  }
  return false;
}
async function resolveTransactionPlugin(transactionData, options, next) {
  normalizeRawArguments(transactionData);
  if (!needsTransactionResolution(transactionData, options)) {
    await validate(transactionData);
    return next();
  }
  return (getClient2(options).core?.resolveTransactionPlugin() ?? coreClientResolveTransactionPlugin)(transactionData, options, async () => {
    await validate(transactionData);
    await next();
  });
}
function validate(transactionData) {
  transactionData.inputs.forEach((input, index) => {
    if (input.$kind !== "Object" && input.$kind !== "Pure" && input.$kind !== "FundsWithdrawal")
      throw new Error(`Input at index ${index} has not been resolved.  Expected a Pure, Object, or FundsWithdrawal input, but found ${JSON.stringify(input)}`);
  });
}
function getClient2(options) {
  if (!options.client)
    throw new Error(`No sui client passed to Transaction#build, but transaction data was not sufficient to build offline.`);
  return options.client;
}
function normalizeRawArguments(transactionData) {
  for (const command of transactionData.commands)
    switch (command.$kind) {
      case "SplitCoins":
        command.SplitCoins.amounts.forEach((amount) => {
          normalizeRawArgument(amount, suiBcs.U64, transactionData);
        });
        break;
      case "TransferObjects":
        normalizeRawArgument(command.TransferObjects.address, suiBcs.Address, transactionData);
        break;
    }
}
function normalizeRawArgument(arg, schema, transactionData) {
  if (arg.$kind !== "Input")
    return;
  const input = transactionData.inputs[arg.Input];
  if (input.$kind !== "UnresolvedPure")
    return;
  transactionData.inputs[arg.Input] = Inputs.Pure(schema.serialize(input.UnresolvedPure.value));
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/object.mjs
function createObjectMethods(makeObject) {
  function object2(value) {
    return makeObject(value);
  }
  object2.system = (options) => {
    const mutable = options?.mutable;
    if (mutable !== undefined)
      return object2(Inputs.SharedObjectRef({
        objectId: SUI_SYSTEM_STATE_OBJECT_ID,
        initialSharedVersion: 1,
        mutable
      }));
    return object2({
      $kind: "UnresolvedObject",
      UnresolvedObject: {
        objectId: SUI_SYSTEM_STATE_OBJECT_ID,
        initialSharedVersion: 1
      }
    });
  };
  object2.clock = () => object2(Inputs.SharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    initialSharedVersion: 1,
    mutable: false
  }));
  object2.random = () => object2({
    $kind: "UnresolvedObject",
    UnresolvedObject: {
      objectId: SUI_RANDOM_OBJECT_ID,
      mutable: false
    }
  });
  object2.denyList = (options) => {
    return object2({
      $kind: "UnresolvedObject",
      UnresolvedObject: {
        objectId: SUI_DENY_LIST_OBJECT_ID,
        mutable: options?.mutable
      }
    });
  };
  object2.option = ({ type, value }) => (tx) => tx.moveCall({
    typeArguments: [type],
    target: `${MOVE_STDLIB_ADDRESS}::option::${value === null ? "none" : "some"}`,
    arguments: value === null ? [] : [tx.object(value)]
  });
  return object2;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/pure.mjs
function createPure(makePure) {
  function pure(typeOrSerializedValue, value) {
    if (typeof typeOrSerializedValue === "string")
      return makePure(pureBcsSchemaFromTypeName(typeOrSerializedValue).serialize(value));
    if (typeOrSerializedValue instanceof Uint8Array || isSerializedBcs(typeOrSerializedValue))
      return makePure(typeOrSerializedValue);
    throw new Error("tx.pure must be called either a bcs type name, or a serialized bcs value");
  }
  pure.u8 = (value) => makePure(suiBcs.U8.serialize(value));
  pure.u16 = (value) => makePure(suiBcs.U16.serialize(value));
  pure.u32 = (value) => makePure(suiBcs.U32.serialize(value));
  pure.u64 = (value) => makePure(suiBcs.U64.serialize(value));
  pure.u128 = (value) => makePure(suiBcs.U128.serialize(value));
  pure.u256 = (value) => makePure(suiBcs.U256.serialize(value));
  pure.bool = (value) => makePure(suiBcs.Bool.serialize(value));
  pure.string = (value) => makePure(suiBcs.String.serialize(value));
  pure.address = (value) => makePure(suiBcs.Address.serialize(value));
  pure.id = pure.address;
  pure.vector = (type, value) => {
    return makePure(suiBcs.vector(pureBcsSchemaFromTypeName(type)).serialize(value));
  };
  pure.option = (type, value) => {
    return makePure(suiBcs.option(pureBcsSchemaFromTypeName(type)).serialize(value));
  };
  return pure;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/version.mjs
var PACKAGE_VERSION = "2.4.0";

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/client/mvr.mjs
var NAME_SEPARATOR2 = "/";
var MVR_API_HEADER = { "Mvr-Source": `@mysten/sui@${PACKAGE_VERSION}` };
var MvrClient = class {
  #cache;
  #url;
  #pageSize;
  #overrides;
  constructor({ cache, url, pageSize = 50, overrides }) {
    this.#cache = cache;
    this.#url = url;
    this.#pageSize = pageSize;
    this.#overrides = {
      packages: overrides?.packages,
      types: overrides?.types
    };
    validateOverrides(this.#overrides);
  }
  get #mvrPackageDataLoader() {
    return this.#cache.readSync(["#mvrPackageDataLoader", this.#url ?? ""], () => {
      const loader = new DataLoader(async (packages) => {
        if (!this.#url)
          throw new Error(`MVR Api URL is not set for the current client (resolving ${packages.join(", ")})`);
        const resolved = await this.#resolvePackages(packages);
        return packages.map((pkg) => resolved[pkg] ?? /* @__PURE__ */ new Error(`Failed to resolve package: ${pkg}`));
      });
      const overrides = this.#overrides?.packages;
      if (overrides)
        for (const [pkg, id] of Object.entries(overrides))
          loader.prime(pkg, id);
      return loader;
    });
  }
  get #mvrTypeDataLoader() {
    return this.#cache.readSync(["#mvrTypeDataLoader", this.#url ?? ""], () => {
      const loader = new DataLoader(async (types) => {
        if (!this.#url)
          throw new Error(`MVR Api URL is not set for the current client (resolving ${types.join(", ")})`);
        const resolved = await this.#resolveTypes(types);
        return types.map((type) => resolved[type] ?? /* @__PURE__ */ new Error(`Failed to resolve type: ${type}`));
      });
      const overrides = this.#overrides?.types;
      if (overrides)
        for (const [type, id] of Object.entries(overrides))
          loader.prime(type, id);
      return loader;
    });
  }
  async#resolvePackages(packages) {
    if (packages.length === 0)
      return {};
    const batches = chunk(packages, this.#pageSize);
    const results = {};
    await Promise.all(batches.map(async (batch) => {
      const data = await this.#fetch("/v1/resolution/bulk", { names: batch });
      if (!data?.resolution)
        return;
      for (const pkg of Object.keys(data?.resolution)) {
        const pkgData = data.resolution[pkg]?.package_id;
        if (!pkgData)
          continue;
        results[pkg] = pkgData;
      }
    }));
    return results;
  }
  async#resolveTypes(types) {
    if (types.length === 0)
      return {};
    const batches = chunk(types, this.#pageSize);
    const results = {};
    await Promise.all(batches.map(async (batch) => {
      const data = await this.#fetch("/v1/struct-definition/bulk", { types: batch });
      if (!data?.resolution)
        return;
      for (const type of Object.keys(data?.resolution)) {
        const typeData = data.resolution[type]?.type_tag;
        if (!typeData)
          continue;
        results[type] = typeData;
      }
    }));
    return results;
  }
  async#fetch(url, body) {
    if (!this.#url)
      throw new Error("MVR Api URL is not set for the current client");
    const response = await fetch(`${this.#url}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...MVR_API_HEADER
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Failed to resolve types: ${errorBody?.message}`);
    }
    return response.json();
  }
  async resolvePackage({ package: name }) {
    if (!hasMvrName(name))
      return { package: name };
    return { package: await this.#mvrPackageDataLoader.load(name) };
  }
  async resolveType({ type }) {
    if (!hasMvrName(type))
      return { type };
    const mvrTypes = [...extractMvrTypes(type)];
    const resolvedTypes = await this.#mvrTypeDataLoader.loadMany(mvrTypes);
    const typeMap = {};
    for (let i = 0;i < mvrTypes.length; i++) {
      const resolvedType = resolvedTypes[i];
      if (resolvedType instanceof Error)
        throw resolvedType;
      typeMap[mvrTypes[i]] = resolvedType;
    }
    return { type: replaceMvrNames(type, typeMap) };
  }
  async resolve({ types = [], packages = [] }) {
    const mvrTypes = /* @__PURE__ */ new Set;
    for (const type of types ?? [])
      extractMvrTypes(type, mvrTypes);
    const typesArray = [...mvrTypes];
    const [resolvedTypes, resolvedPackages] = await Promise.all([typesArray.length > 0 ? this.#mvrTypeDataLoader.loadMany(typesArray) : [], packages.length > 0 ? this.#mvrPackageDataLoader.loadMany(packages) : []]);
    const typeMap = { ...this.#overrides?.types };
    for (const [i, type] of typesArray.entries()) {
      const resolvedType = resolvedTypes[i];
      if (resolvedType instanceof Error)
        throw resolvedType;
      typeMap[type] = resolvedType;
    }
    const replacedTypes = {};
    for (const type of types ?? [])
      replacedTypes[type] = { type: replaceMvrNames(type, typeMap) };
    const replacedPackages = {};
    for (const [i, pkg] of (packages ?? []).entries()) {
      const resolvedPkg = this.#overrides?.packages?.[pkg] ?? resolvedPackages[i];
      if (resolvedPkg instanceof Error)
        throw resolvedPkg;
      replacedPackages[pkg] = { package: resolvedPkg };
    }
    return {
      types: replacedTypes,
      packages: replacedPackages
    };
  }
};
function validateOverrides(overrides) {
  if (overrides?.packages)
    for (const [pkg, id] of Object.entries(overrides.packages)) {
      if (!isValidNamedPackage(pkg))
        throw new Error(`Invalid package name: ${pkg}`);
      if (!isValidSuiAddress(normalizeSuiAddress(id)))
        throw new Error(`Invalid package ID: ${id}`);
    }
  if (overrides?.types)
    for (const [type, val] of Object.entries(overrides.types)) {
      if (parseStructTag(type).typeParams.length > 0)
        throw new Error("Type overrides must be first-level only. If you want to supply generic types, just pass each type individually.");
      if (!isValidSuiAddress(parseStructTag(val).address))
        throw new Error(`Invalid type: ${val}`);
    }
}
function extractMvrTypes(type, types = /* @__PURE__ */ new Set) {
  if (typeof type === "string" && !hasMvrName(type))
    return types;
  const tag = isStructTag(type) ? type : parseStructTag(type);
  if (hasMvrName(tag.address))
    types.add(`${tag.address}::${tag.module}::${tag.name}`);
  for (const param of tag.typeParams)
    extractMvrTypes(param, types);
  return types;
}
function replaceMvrNames(tag, typeCache) {
  const type = isStructTag(tag) ? tag : parseStructTag(tag);
  const cacheHit = typeCache[`${type.address}::${type.module}::${type.name}`];
  return normalizeStructTag({
    ...type,
    address: cacheHit ? cacheHit.split("::")[0] : type.address,
    typeParams: type.typeParams.map((param) => replaceMvrNames(param, typeCache))
  });
}
function hasMvrName(nameOrType) {
  return nameOrType.includes(NAME_SEPARATOR2) || nameOrType.includes("@") || nameOrType.includes(".sui");
}
function isStructTag(type) {
  return typeof type === "object" && "address" in type && "module" in type && "name" in type && "typeParams" in type;
}
function findNamesInTransaction(builder) {
  const packages = /* @__PURE__ */ new Set;
  const types = /* @__PURE__ */ new Set;
  for (const command of builder.commands)
    switch (command.$kind) {
      case "MakeMoveVec":
        if (command.MakeMoveVec.type)
          getNamesFromTypeList([command.MakeMoveVec.type]).forEach((type) => {
            types.add(type);
          });
        break;
      case "MoveCall":
        const moveCall = command.MoveCall;
        const pkg = moveCall.package.split("::")[0];
        if (hasMvrName(pkg)) {
          if (!isValidNamedPackage(pkg))
            throw new Error(`Invalid package name: ${pkg}`);
          packages.add(pkg);
        }
        getNamesFromTypeList(moveCall.typeArguments ?? []).forEach((type) => {
          types.add(type);
        });
        break;
      default:
        break;
    }
  return {
    packages: [...packages],
    types: [...types]
  };
}
function replaceNames(builder, resolved) {
  for (const command of builder.commands) {
    if (command.MakeMoveVec?.type) {
      if (!hasMvrName(command.MakeMoveVec.type))
        continue;
      if (!resolved.types[command.MakeMoveVec.type])
        throw new Error(`No resolution found for type: ${command.MakeMoveVec.type}`);
      command.MakeMoveVec.type = resolved.types[command.MakeMoveVec.type].type;
    }
    const tx = command.MoveCall;
    if (!tx)
      continue;
    const nameParts = tx.package.split("::");
    const name = nameParts[0];
    if (hasMvrName(name) && !resolved.packages[name])
      throw new Error(`No address found for package: ${name}`);
    if (hasMvrName(name)) {
      nameParts[0] = resolved.packages[name].package;
      tx.package = nameParts.join("::");
    }
    const types = tx.typeArguments;
    if (!types)
      continue;
    for (let i = 0;i < types.length; i++) {
      if (!hasMvrName(types[i]))
        continue;
      if (!resolved.types[types[i]])
        throw new Error(`No resolution found for type: ${types[i]}`);
      types[i] = resolved.types[types[i]].type;
    }
    tx.typeArguments = types;
  }
}
function getNamesFromTypeList(types) {
  const names = /* @__PURE__ */ new Set;
  for (const type of types)
    if (hasMvrName(type)) {
      if (!isValidNamedType(type))
        throw new Error(`Invalid type with names: ${type}`);
      names.add(type);
    }
  return names;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/plugins/NamedPackagesPlugin.mjs
function namedPackagesPlugin() {
  return async (transactionData, buildOptions, next) => {
    const names = findNamesInTransaction(transactionData);
    if (names.types.length === 0 && names.packages.length === 0)
      return next();
    if (!buildOptions.client)
      throw new Error(`Transaction contains MVR names but no client was provided to resolve them. Please pass a client to Transaction#build()`);
    replaceNames(transactionData, await buildOptions.client.core.mvr.resolve({
      types: names.types,
      packages: names.packages
    }));
    await next();
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/transactions/Transaction.mjs
function createTransactionResult(index, length = Infinity) {
  const baseResult = {
    $kind: "Result",
    get Result() {
      return typeof index === "function" ? index() : index;
    }
  };
  const nestedResults = [];
  const nestedResultFor = (resultIndex) => nestedResults[resultIndex] ??= {
    $kind: "NestedResult",
    get NestedResult() {
      return [typeof index === "function" ? index() : index, resultIndex];
    }
  };
  return new Proxy(baseResult, {
    set() {
      throw new Error("The transaction result is a proxy, and does not support setting properties directly");
    },
    get(target, property) {
      if (property in target)
        return Reflect.get(target, property);
      if (property === Symbol.iterator)
        return function* () {
          let i = 0;
          while (i < length) {
            yield nestedResultFor(i);
            i++;
          }
        };
      if (typeof property === "symbol")
        return;
      const resultIndex = parseInt(property, 10);
      if (Number.isNaN(resultIndex) || resultIndex < 0)
        return;
      return nestedResultFor(resultIndex);
    }
  });
}
var TRANSACTION_BRAND = Symbol.for("@mysten/transaction");
function isTransaction(obj) {
  return !!obj && typeof obj === "object" && obj[TRANSACTION_BRAND] === true;
}
var Transaction = class Transaction2 {
  #serializationPlugins;
  #buildPlugins;
  #intentResolvers = /* @__PURE__ */ new Map;
  #inputSection = [];
  #commandSection = [];
  #availableResults = /* @__PURE__ */ new Set;
  #pendingPromises = /* @__PURE__ */ new Set;
  #added = /* @__PURE__ */ new Map;
  static fromKind(serialized) {
    const tx = new Transaction2;
    tx.#data = TransactionDataBuilder.fromKindBytes(typeof serialized === "string" ? fromBase64(serialized) : serialized);
    tx.#inputSection = tx.#data.inputs.slice();
    tx.#commandSection = tx.#data.commands.slice();
    tx.#availableResults = new Set(tx.#commandSection.map((_, i) => i));
    return tx;
  }
  static from(transaction) {
    const newTransaction = new Transaction2;
    if (isTransaction(transaction))
      newTransaction.#data = TransactionDataBuilder.restore(transaction.getData());
    else if (typeof transaction !== "string" || !transaction.startsWith("{"))
      newTransaction.#data = TransactionDataBuilder.fromBytes(typeof transaction === "string" ? fromBase64(transaction) : transaction);
    else
      newTransaction.#data = TransactionDataBuilder.restore(JSON.parse(transaction));
    newTransaction.#inputSection = newTransaction.#data.inputs.slice();
    newTransaction.#commandSection = newTransaction.#data.commands.slice();
    newTransaction.#availableResults = new Set(newTransaction.#commandSection.map((_, i) => i));
    if (!newTransaction.isPreparedForSerialization({ supportedIntents: [COIN_WITH_BALANCE] }))
      throw new Error("Transaction has unresolved intents or async thunks. Call `prepareForSerialization` before copying.");
    if (newTransaction.#data.commands.some((cmd) => cmd.$Intent?.name === COIN_WITH_BALANCE))
      newTransaction.addIntentResolver(COIN_WITH_BALANCE, resolveCoinBalance);
    return newTransaction;
  }
  addSerializationPlugin(step) {
    this.#serializationPlugins.push(step);
  }
  addBuildPlugin(step) {
    this.#buildPlugins.push(step);
  }
  addIntentResolver(intent, resolver) {
    if (this.#intentResolvers.has(intent) && this.#intentResolvers.get(intent) !== resolver)
      throw new Error(`Intent resolver for ${intent} already exists`);
    this.#intentResolvers.set(intent, resolver);
  }
  setSender(sender) {
    this.#data.sender = sender;
  }
  setSenderIfNotSet(sender) {
    if (!this.#data.sender)
      this.#data.sender = sender;
  }
  setExpiration(expiration) {
    this.#data.expiration = expiration ? parse(TransactionExpiration, expiration) : null;
  }
  setGasPrice(price) {
    this.#data.gasData.price = String(price);
  }
  setGasBudget(budget) {
    this.#data.gasData.budget = String(budget);
  }
  setGasBudgetIfNotSet(budget) {
    if (this.#data.gasData.budget == null)
      this.#data.gasData.budget = String(budget);
  }
  setGasOwner(owner) {
    this.#data.gasData.owner = owner;
  }
  setGasPayment(payments) {
    this.#data.gasData.payment = payments.map((payment) => parse(ObjectRefSchema, payment));
  }
  #data;
  getData() {
    return this.#data.snapshot();
  }
  get [TRANSACTION_BRAND]() {
    return true;
  }
  get pure() {
    Object.defineProperty(this, "pure", {
      enumerable: false,
      value: createPure((value) => {
        if (isSerializedBcs(value))
          return this.#addInput("pure", {
            $kind: "Pure",
            Pure: { bytes: value.toBase64() }
          });
        return this.#addInput("pure", is(NormalizedCallArg, value) ? parse(NormalizedCallArg, value) : value instanceof Uint8Array ? Inputs.Pure(value) : {
          $kind: "UnresolvedPure",
          UnresolvedPure: { value }
        });
      })
    });
    return this.pure;
  }
  constructor() {
    this.object = createObjectMethods((value) => {
      if (typeof value === "function")
        return this.object(this.add(value));
      if (typeof value === "object" && is(ArgumentSchema, value))
        return value;
      const id = getIdFromCallArg(value);
      const inserted = this.#data.inputs.find((i) => id === getIdFromCallArg(i));
      if (inserted?.Object?.SharedObject && typeof value === "object" && value.Object?.SharedObject)
        inserted.Object.SharedObject.mutable = inserted.Object.SharedObject.mutable || value.Object.SharedObject.mutable;
      return inserted ? {
        $kind: "Input",
        Input: this.#data.inputs.indexOf(inserted),
        type: "object"
      } : this.#addInput("object", typeof value === "string" ? {
        $kind: "UnresolvedObject",
        UnresolvedObject: { objectId: normalizeSuiAddress(value) }
      } : value);
    });
    this.#data = new TransactionDataBuilder;
    this.#buildPlugins = [];
    this.#serializationPlugins = [];
  }
  get gas() {
    return {
      $kind: "GasCoin",
      GasCoin: true
    };
  }
  objectRef(...args) {
    return this.object(Inputs.ObjectRef(...args));
  }
  receivingRef(...args) {
    return this.object(Inputs.ReceivingRef(...args));
  }
  sharedObjectRef(...args) {
    return this.object(Inputs.SharedObjectRef(...args));
  }
  #fork() {
    const fork = new Transaction2;
    fork.#data = this.#data;
    fork.#serializationPlugins = this.#serializationPlugins;
    fork.#buildPlugins = this.#buildPlugins;
    fork.#intentResolvers = this.#intentResolvers;
    fork.#pendingPromises = this.#pendingPromises;
    fork.#availableResults = new Set(this.#availableResults);
    fork.#added = this.#added;
    this.#inputSection.push(fork.#inputSection);
    this.#commandSection.push(fork.#commandSection);
    return fork;
  }
  add(command) {
    if (typeof command === "function") {
      if (this.#added.has(command))
        return this.#added.get(command);
      const fork = this.#fork();
      const result = command(fork);
      if (!(result && typeof result === "object" && ("then" in result))) {
        this.#availableResults = fork.#availableResults;
        this.#added.set(command, result);
        return result;
      }
      const placeholder = this.#addCommand({
        $kind: "$Intent",
        $Intent: {
          name: "AsyncTransactionThunk",
          inputs: {},
          data: {
            resultIndex: this.#data.commands.length,
            result: null
          }
        }
      });
      this.#pendingPromises.add(Promise.resolve(result).then((result$1) => {
        placeholder.$Intent.data.result = result$1;
      }));
      const txResult = createTransactionResult(() => placeholder.$Intent.data.resultIndex);
      this.#added.set(command, txResult);
      return txResult;
    } else
      this.#addCommand(command);
    return createTransactionResult(this.#data.commands.length - 1);
  }
  #addCommand(command) {
    const resultIndex = this.#data.commands.length;
    this.#commandSection.push(command);
    this.#availableResults.add(resultIndex);
    this.#data.commands.push(command);
    this.#data.mapCommandArguments(resultIndex, (arg) => {
      if (arg.$kind === "Result" && !this.#availableResults.has(arg.Result))
        throw new Error(`Result { Result: ${arg.Result} } is not available to use in the current transaction`);
      if (arg.$kind === "NestedResult" && !this.#availableResults.has(arg.NestedResult[0]))
        throw new Error(`Result { NestedResult: [${arg.NestedResult[0]}, ${arg.NestedResult[1]}] } is not available to use in the current transaction`);
      if (arg.$kind === "Input" && arg.Input >= this.#data.inputs.length)
        throw new Error(`Input { Input: ${arg.Input} } references an input that does not exist in the current transaction`);
      return arg;
    });
    return command;
  }
  #addInput(type, input) {
    this.#inputSection.push(input);
    return this.#data.addInput(type, input);
  }
  #normalizeTransactionArgument(arg) {
    if (isSerializedBcs(arg))
      return this.pure(arg);
    return this.#resolveArgument(arg);
  }
  #resolveArgument(arg) {
    if (typeof arg === "function") {
      const resolved = this.add(arg);
      if (typeof resolved === "function")
        return this.#resolveArgument(resolved);
      return parse(ArgumentSchema, resolved);
    }
    return parse(ArgumentSchema, arg);
  }
  splitCoins(coin, amounts) {
    const command = TransactionCommands.SplitCoins(typeof coin === "string" ? this.object(coin) : this.#resolveArgument(coin), amounts.map((amount) => typeof amount === "number" || typeof amount === "bigint" || typeof amount === "string" ? this.pure.u64(amount) : this.#normalizeTransactionArgument(amount)));
    this.#addCommand(command);
    return createTransactionResult(this.#data.commands.length - 1, amounts.length);
  }
  mergeCoins(destination, sources) {
    return this.add(TransactionCommands.MergeCoins(this.object(destination), sources.map((src) => this.object(src))));
  }
  publish({ modules, dependencies }) {
    return this.add(TransactionCommands.Publish({
      modules,
      dependencies
    }));
  }
  upgrade({ modules, dependencies, package: packageId, ticket }) {
    return this.add(TransactionCommands.Upgrade({
      modules,
      dependencies,
      package: packageId,
      ticket: this.object(ticket)
    }));
  }
  moveCall({ arguments: args, ...input }) {
    return this.add(TransactionCommands.MoveCall({
      ...input,
      arguments: args?.map((arg) => this.#normalizeTransactionArgument(arg))
    }));
  }
  transferObjects(objects, address) {
    return this.add(TransactionCommands.TransferObjects(objects.map((obj) => this.object(obj)), typeof address === "string" ? this.pure.address(address) : this.#normalizeTransactionArgument(address)));
  }
  makeMoveVec({ type, elements }) {
    return this.add(TransactionCommands.MakeMoveVec({
      type,
      elements: elements.map((obj) => this.object(obj))
    }));
  }
  withdrawal({ amount, type }) {
    const input = {
      $kind: "FundsWithdrawal",
      FundsWithdrawal: {
        reservation: {
          $kind: "MaxAmountU64",
          MaxAmountU64: String(amount)
        },
        typeArg: {
          $kind: "Balance",
          Balance: type ?? "0x2::sui::SUI"
        },
        withdrawFrom: {
          $kind: "Sender",
          Sender: true
        }
      }
    };
    return this.#addInput("object", input);
  }
  serialize() {
    return JSON.stringify(serializeV1TransactionData(this.#data.snapshot()));
  }
  async toJSON(options = {}) {
    await this.prepareForSerialization(options);
    const fullyResolved = this.isFullyResolved();
    return JSON.stringify(parse(SerializedTransactionDataV2Schema, fullyResolved ? {
      ...this.#data.snapshot(),
      digest: this.#data.getDigest()
    } : this.#data.snapshot()), (_key, value) => typeof value === "bigint" ? value.toString() : value, 2);
  }
  async sign(options) {
    const { signer, ...buildOptions } = options;
    const bytes = await this.build(buildOptions);
    return signer.signTransaction(bytes);
  }
  isPreparedForSerialization(options = {}) {
    if (this.#pendingPromises.size > 0)
      return false;
    if (this.#data.commands.some((cmd) => cmd.$Intent && !options.supportedIntents?.includes(cmd.$Intent.name)))
      return false;
    return true;
  }
  isFullyResolved() {
    if (!this.isPreparedForSerialization())
      return false;
    if (!this.#data.sender)
      return false;
    if (needsTransactionResolution(this.#data, {}))
      return false;
    return true;
  }
  async build(options = {}) {
    await this.prepareForSerialization(options);
    await this.#prepareBuild(options);
    return this.#data.build({ onlyTransactionKind: options.onlyTransactionKind });
  }
  async getDigest(options = {}) {
    await this.prepareForSerialization(options);
    await this.#prepareBuild(options);
    return this.#data.getDigest();
  }
  async#prepareBuild(options) {
    if (!options.onlyTransactionKind && !this.#data.sender)
      throw new Error("Missing transaction sender");
    await this.#runPlugins([...this.#buildPlugins, resolveTransactionPlugin], options);
  }
  async#runPlugins(plugins, options) {
    try {
      const createNext = (i) => {
        if (i >= plugins.length)
          return () => {};
        const plugin = plugins[i];
        return async () => {
          const next = createNext(i + 1);
          let calledNext = false;
          let nextResolved = false;
          await plugin(this.#data, options, async () => {
            if (calledNext)
              throw new Error(`next() was call multiple times in TransactionPlugin ${i}`);
            calledNext = true;
            await next();
            nextResolved = true;
          });
          if (!calledNext)
            throw new Error(`next() was not called in TransactionPlugin ${i}`);
          if (!nextResolved)
            throw new Error(`next() was not awaited in TransactionPlugin ${i}`);
        };
      };
      await createNext(0)();
    } finally {
      this.#inputSection = this.#data.inputs.slice();
      this.#commandSection = this.#data.commands.slice();
      this.#availableResults = new Set(this.#commandSection.map((_, i) => i));
    }
  }
  async#waitForPendingTasks() {
    while (this.#pendingPromises.size > 0) {
      const newPromise = Promise.all(this.#pendingPromises);
      this.#pendingPromises.clear();
      this.#pendingPromises.add(newPromise);
      await newPromise;
      this.#pendingPromises.delete(newPromise);
    }
  }
  #sortCommandsAndInputs() {
    const unorderedCommands = this.#data.commands;
    const unorderedInputs = this.#data.inputs;
    const orderedCommands = this.#commandSection.flat(Infinity);
    const orderedInputs = this.#inputSection.flat(Infinity);
    if (orderedCommands.length !== unorderedCommands.length)
      throw new Error("Unexpected number of commands found in transaction data");
    if (orderedInputs.length !== unorderedInputs.length)
      throw new Error("Unexpected number of inputs found in transaction data");
    const filteredCommands = orderedCommands.filter((cmd) => cmd.$Intent?.name !== "AsyncTransactionThunk");
    this.#data.commands = filteredCommands;
    this.#data.inputs = orderedInputs;
    this.#commandSection = filteredCommands;
    this.#inputSection = orderedInputs;
    this.#availableResults = new Set(filteredCommands.map((_, i) => i));
    function getOriginalIndex(index) {
      const command = unorderedCommands[index];
      if (command.$Intent?.name === "AsyncTransactionThunk") {
        const result = command.$Intent.data.result;
        if (result == null)
          throw new Error("AsyncTransactionThunk has not been resolved");
        return getOriginalIndex(result.Result);
      }
      const updated = filteredCommands.indexOf(command);
      if (updated === -1)
        throw new Error("Unable to find original index for command");
      return updated;
    }
    this.#data.mapArguments((arg) => {
      if (arg.$kind === "Input") {
        const updated = orderedInputs.indexOf(unorderedInputs[arg.Input]);
        if (updated === -1)
          throw new Error("Input has not been resolved");
        return {
          ...arg,
          Input: updated
        };
      } else if (arg.$kind === "Result") {
        const updated = getOriginalIndex(arg.Result);
        return {
          ...arg,
          Result: updated
        };
      } else if (arg.$kind === "NestedResult") {
        const updated = getOriginalIndex(arg.NestedResult[0]);
        return {
          ...arg,
          NestedResult: [updated, arg.NestedResult[1]]
        };
      }
      return arg;
    });
    for (const [i, cmd] of unorderedCommands.entries())
      if (cmd.$Intent?.name === "AsyncTransactionThunk")
        try {
          cmd.$Intent.data.resultIndex = getOriginalIndex(i);
        } catch {}
  }
  async prepareForSerialization(options) {
    await this.#waitForPendingTasks();
    this.#sortCommandsAndInputs();
    const intents = /* @__PURE__ */ new Set;
    for (const command of this.#data.commands)
      if (command.$Intent)
        intents.add(command.$Intent.name);
    const steps = [...this.#serializationPlugins];
    for (const intent of intents) {
      if (options.supportedIntents?.includes(intent))
        continue;
      if (!this.#intentResolvers.has(intent))
        throw new Error(`Missing intent resolver for ${intent}`);
      steps.push(this.#intentResolvers.get(intent));
    }
    steps.push(namedPackagesPlugin());
    await this.#runPlugins(steps, options);
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/utils/dynamic-fields.mjs
function deriveDynamicFieldID(parentId, typeTag, key) {
  const address = suiBcs.Address.serialize(parentId).toBytes();
  const tag = suiBcs.TypeTag.serialize(typeTag).toBytes();
  const keyLength = suiBcs.u64().serialize(key.length).toBytes();
  const hash = blake2b.create({ dkLen: 32 });
  hash.update(new Uint8Array([240]));
  hash.update(address);
  hash.update(keyLength);
  hash.update(key);
  hash.update(tag);
  return `0x${toHex(hash.digest().slice(0, 32))}`;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@logtape+logtape@1.2.2/node_modules/@logtape/logtape/dist/level.js
var logLevels = [
  "trace",
  "debug",
  "info",
  "warning",
  "error",
  "fatal"
];
function compareLogLevel(a, b) {
  const aIndex = logLevels.indexOf(a);
  if (aIndex < 0)
    throw new TypeError(`Invalid log level: ${JSON.stringify(a)}.`);
  const bIndex = logLevels.indexOf(b);
  if (bIndex < 0)
    throw new TypeError(`Invalid log level: ${JSON.stringify(b)}.`);
  return aIndex - bIndex;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@logtape+logtape@1.2.2/node_modules/@logtape/logtape/dist/logger.js
function getLogger(category = []) {
  return LoggerImpl.getLogger(category);
}
var globalRootLoggerSymbol = Symbol.for("logtape.rootLogger");
var LoggerImpl = class LoggerImpl2 {
  parent;
  children;
  category;
  sinks;
  parentSinks = "inherit";
  filters;
  lowestLevel = "trace";
  contextLocalStorage;
  static getLogger(category = []) {
    let rootLogger = globalRootLoggerSymbol in globalThis ? globalThis[globalRootLoggerSymbol] ?? null : null;
    if (rootLogger == null) {
      rootLogger = new LoggerImpl2(null, []);
      globalThis[globalRootLoggerSymbol] = rootLogger;
    }
    if (typeof category === "string")
      return rootLogger.getChild(category);
    if (category.length === 0)
      return rootLogger;
    return rootLogger.getChild(category);
  }
  constructor(parent, category) {
    this.parent = parent;
    this.children = {};
    this.category = category;
    this.sinks = [];
    this.filters = [];
  }
  getChild(subcategory) {
    const name = typeof subcategory === "string" ? subcategory : subcategory[0];
    const childRef = this.children[name];
    let child = childRef instanceof LoggerImpl2 ? childRef : childRef?.deref();
    if (child == null) {
      child = new LoggerImpl2(this, [...this.category, name]);
      this.children[name] = "WeakRef" in globalThis ? new WeakRef(child) : child;
    }
    if (typeof subcategory === "string" || subcategory.length === 1)
      return child;
    return child.getChild(subcategory.slice(1));
  }
  reset() {
    while (this.sinks.length > 0)
      this.sinks.shift();
    this.parentSinks = "inherit";
    while (this.filters.length > 0)
      this.filters.shift();
    this.lowestLevel = "trace";
  }
  resetDescendants() {
    for (const child of Object.values(this.children)) {
      const logger = child instanceof LoggerImpl2 ? child : child.deref();
      if (logger != null)
        logger.resetDescendants();
    }
    this.reset();
  }
  with(properties) {
    return new LoggerCtx(this, { ...properties });
  }
  filter(record2) {
    for (const filter of this.filters)
      if (!filter(record2))
        return false;
    if (this.filters.length < 1)
      return this.parent?.filter(record2) ?? true;
    return true;
  }
  *getSinks(level) {
    if (this.lowestLevel === null || compareLogLevel(level, this.lowestLevel) < 0)
      return;
    if (this.parent != null && this.parentSinks === "inherit")
      for (const sink of this.parent.getSinks(level))
        yield sink;
    for (const sink of this.sinks)
      yield sink;
  }
  emit(record2, bypassSinks) {
    const fullRecord = "category" in record2 ? record2 : {
      ...record2,
      category: this.category
    };
    if (this.lowestLevel === null || compareLogLevel(fullRecord.level, this.lowestLevel) < 0 || !this.filter(fullRecord))
      return;
    for (const sink of this.getSinks(fullRecord.level)) {
      if (bypassSinks?.has(sink))
        continue;
      try {
        sink(fullRecord);
      } catch (error) {
        const bypassSinks2 = new Set(bypassSinks);
        bypassSinks2.add(sink);
        metaLogger.log("fatal", "Failed to emit a log record to sink {sink}: {error}", {
          sink,
          error,
          record: fullRecord
        }, bypassSinks2);
      }
    }
  }
  log(level, rawMessage, properties, bypassSinks) {
    const implicitContext = LoggerImpl2.getLogger().contextLocalStorage?.getStore() ?? {};
    let cachedProps = undefined;
    const record2 = typeof properties === "function" ? {
      category: this.category,
      level,
      timestamp: Date.now(),
      get message() {
        return parseMessageTemplate(rawMessage, this.properties);
      },
      rawMessage,
      get properties() {
        if (cachedProps == null)
          cachedProps = {
            ...implicitContext,
            ...properties()
          };
        return cachedProps;
      }
    } : {
      category: this.category,
      level,
      timestamp: Date.now(),
      message: parseMessageTemplate(rawMessage, {
        ...implicitContext,
        ...properties
      }),
      rawMessage,
      properties: {
        ...implicitContext,
        ...properties
      }
    };
    this.emit(record2, bypassSinks);
  }
  logLazily(level, callback, properties = {}) {
    const implicitContext = LoggerImpl2.getLogger().contextLocalStorage?.getStore() ?? {};
    let rawMessage = undefined;
    let msg = undefined;
    function realizeMessage() {
      if (msg == null || rawMessage == null) {
        msg = callback((tpl, ...values) => {
          rawMessage = tpl;
          return renderMessage(tpl, values);
        });
        if (rawMessage == null)
          throw new TypeError("No log record was made.");
      }
      return [msg, rawMessage];
    }
    this.emit({
      category: this.category,
      level,
      get message() {
        return realizeMessage()[0];
      },
      get rawMessage() {
        return realizeMessage()[1];
      },
      timestamp: Date.now(),
      properties: {
        ...implicitContext,
        ...properties
      }
    });
  }
  logTemplate(level, messageTemplate, values, properties = {}) {
    const implicitContext = LoggerImpl2.getLogger().contextLocalStorage?.getStore() ?? {};
    this.emit({
      category: this.category,
      level,
      message: renderMessage(messageTemplate, values),
      rawMessage: messageTemplate,
      timestamp: Date.now(),
      properties: {
        ...implicitContext,
        ...properties
      }
    });
  }
  trace(message, ...values) {
    if (typeof message === "string")
      this.log("trace", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("trace", message);
    else if (!Array.isArray(message))
      this.log("trace", "{*}", message);
    else
      this.logTemplate("trace", message, values);
  }
  debug(message, ...values) {
    if (typeof message === "string")
      this.log("debug", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("debug", message);
    else if (!Array.isArray(message))
      this.log("debug", "{*}", message);
    else
      this.logTemplate("debug", message, values);
  }
  info(message, ...values) {
    if (typeof message === "string")
      this.log("info", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("info", message);
    else if (!Array.isArray(message))
      this.log("info", "{*}", message);
    else
      this.logTemplate("info", message, values);
  }
  warn(message, ...values) {
    if (typeof message === "string")
      this.log("warning", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("warning", message);
    else if (!Array.isArray(message))
      this.log("warning", "{*}", message);
    else
      this.logTemplate("warning", message, values);
  }
  warning(message, ...values) {
    this.warn(message, ...values);
  }
  error(message, ...values) {
    if (typeof message === "string")
      this.log("error", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("error", message);
    else if (!Array.isArray(message))
      this.log("error", "{*}", message);
    else
      this.logTemplate("error", message, values);
  }
  fatal(message, ...values) {
    if (typeof message === "string")
      this.log("fatal", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("fatal", message);
    else if (!Array.isArray(message))
      this.log("fatal", "{*}", message);
    else
      this.logTemplate("fatal", message, values);
  }
};
var LoggerCtx = class LoggerCtx2 {
  logger;
  properties;
  constructor(logger, properties) {
    this.logger = logger;
    this.properties = properties;
  }
  get category() {
    return this.logger.category;
  }
  get parent() {
    return this.logger.parent;
  }
  getChild(subcategory) {
    return this.logger.getChild(subcategory).with(this.properties);
  }
  with(properties) {
    return new LoggerCtx2(this.logger, {
      ...this.properties,
      ...properties
    });
  }
  log(level, message, properties, bypassSinks) {
    this.logger.log(level, message, typeof properties === "function" ? () => ({
      ...this.properties,
      ...properties()
    }) : {
      ...this.properties,
      ...properties
    }, bypassSinks);
  }
  logLazily(level, callback) {
    this.logger.logLazily(level, callback, this.properties);
  }
  logTemplate(level, messageTemplate, values) {
    this.logger.logTemplate(level, messageTemplate, values, this.properties);
  }
  emit(record2) {
    const recordWithContext = {
      ...record2,
      properties: {
        ...this.properties,
        ...record2.properties
      }
    };
    this.logger.emit(recordWithContext);
  }
  trace(message, ...values) {
    if (typeof message === "string")
      this.log("trace", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("trace", message);
    else if (!Array.isArray(message))
      this.log("trace", "{*}", message);
    else
      this.logTemplate("trace", message, values);
  }
  debug(message, ...values) {
    if (typeof message === "string")
      this.log("debug", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("debug", message);
    else if (!Array.isArray(message))
      this.log("debug", "{*}", message);
    else
      this.logTemplate("debug", message, values);
  }
  info(message, ...values) {
    if (typeof message === "string")
      this.log("info", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("info", message);
    else if (!Array.isArray(message))
      this.log("info", "{*}", message);
    else
      this.logTemplate("info", message, values);
  }
  warn(message, ...values) {
    if (typeof message === "string")
      this.log("warning", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("warning", message);
    else if (!Array.isArray(message))
      this.log("warning", "{*}", message);
    else
      this.logTemplate("warning", message, values);
  }
  warning(message, ...values) {
    this.warn(message, ...values);
  }
  error(message, ...values) {
    if (typeof message === "string")
      this.log("error", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("error", message);
    else if (!Array.isArray(message))
      this.log("error", "{*}", message);
    else
      this.logTemplate("error", message, values);
  }
  fatal(message, ...values) {
    if (typeof message === "string")
      this.log("fatal", message, values[0] ?? {});
    else if (typeof message === "function")
      this.logLazily("fatal", message);
    else if (!Array.isArray(message))
      this.log("fatal", "{*}", message);
    else
      this.logTemplate("fatal", message, values);
  }
};
var metaLogger = LoggerImpl.getLogger(["logtape", "meta"]);
function isNestedAccess(key) {
  return key.includes(".") || key.includes("[") || key.includes("?.");
}
function getOwnProperty(obj, key) {
  if (key === "__proto__" || key === "prototype" || key === "constructor")
    return;
  if ((typeof obj === "object" || typeof obj === "function") && obj !== null)
    return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
  return;
}
function parseNextSegment(path, fromIndex) {
  const len = path.length;
  let i = fromIndex;
  if (i >= len)
    return null;
  let segment;
  if (path[i] === "[") {
    i++;
    if (i >= len)
      return null;
    if (path[i] === '"' || path[i] === "'") {
      const quote = path[i];
      i++;
      let segmentStr = "";
      while (i < len && path[i] !== quote)
        if (path[i] === "\\") {
          i++;
          if (i < len) {
            const escapeChar = path[i];
            switch (escapeChar) {
              case "n":
                segmentStr += `
`;
                break;
              case "t":
                segmentStr += "\t";
                break;
              case "r":
                segmentStr += "\r";
                break;
              case "b":
                segmentStr += "\b";
                break;
              case "f":
                segmentStr += "\f";
                break;
              case "v":
                segmentStr += "\v";
                break;
              case "0":
                segmentStr += "\x00";
                break;
              case "\\":
                segmentStr += "\\";
                break;
              case '"':
                segmentStr += '"';
                break;
              case "'":
                segmentStr += "'";
                break;
              case "u":
                if (i + 4 < len) {
                  const hex2 = path.slice(i + 1, i + 5);
                  const codePoint = Number.parseInt(hex2, 16);
                  if (!Number.isNaN(codePoint)) {
                    segmentStr += String.fromCharCode(codePoint);
                    i += 4;
                  } else
                    segmentStr += escapeChar;
                } else
                  segmentStr += escapeChar;
                break;
              default:
                segmentStr += escapeChar;
            }
            i++;
          }
        } else {
          segmentStr += path[i];
          i++;
        }
      if (i >= len)
        return null;
      segment = segmentStr;
      i++;
    } else {
      const startIndex = i;
      while (i < len && path[i] !== "]" && path[i] !== "'" && path[i] !== '"')
        i++;
      if (i >= len)
        return null;
      const indexStr = path.slice(startIndex, i);
      if (indexStr.length === 0)
        return null;
      const indexNum = Number(indexStr);
      segment = Number.isNaN(indexNum) ? indexStr : indexNum;
    }
    while (i < len && path[i] !== "]")
      i++;
    if (i < len)
      i++;
  } else {
    const startIndex = i;
    while (i < len && path[i] !== "." && path[i] !== "[" && path[i] !== "?" && path[i] !== "]")
      i++;
    segment = path.slice(startIndex, i);
    if (segment.length === 0)
      return null;
  }
  if (i < len && path[i] === ".")
    i++;
  return {
    segment,
    nextIndex: i
  };
}
function accessProperty(obj, segment) {
  if (typeof segment === "string")
    return getOwnProperty(obj, segment);
  if (Array.isArray(obj) && segment >= 0 && segment < obj.length)
    return obj[segment];
  return;
}
function resolvePropertyPath(obj, path) {
  if (obj == null)
    return;
  if (path.length === 0 || path.endsWith("."))
    return;
  let current = obj;
  let i = 0;
  const len = path.length;
  while (i < len) {
    const isOptional = path.slice(i, i + 2) === "?.";
    if (isOptional) {
      i += 2;
      if (current == null)
        return;
    } else if (current == null)
      return;
    const result = parseNextSegment(path, i);
    if (result === null)
      return;
    const { segment, nextIndex } = result;
    i = nextIndex;
    current = accessProperty(current, segment);
    if (current === undefined)
      return;
  }
  return current;
}
function parseMessageTemplate(template, properties) {
  const length = template.length;
  if (length === 0)
    return [""];
  if (!template.includes("{"))
    return [template];
  const message = [];
  let startIndex = 0;
  for (let i = 0;i < length; i++) {
    const char = template[i];
    if (char === "{") {
      const nextChar = i + 1 < length ? template[i + 1] : "";
      if (nextChar === "{") {
        i++;
        continue;
      }
      const closeIndex = template.indexOf("}", i + 1);
      if (closeIndex === -1)
        continue;
      const beforeText = template.slice(startIndex, i);
      message.push(beforeText.replace(/{{/g, "{").replace(/}}/g, "}"));
      const key = template.slice(i + 1, closeIndex);
      let prop;
      const trimmedKey = key.trim();
      if (trimmedKey === "*")
        prop = key in properties ? properties[key] : ("*" in properties) ? properties["*"] : properties;
      else {
        if (key !== trimmedKey)
          prop = key in properties ? properties[key] : properties[trimmedKey];
        else
          prop = properties[key];
        if (prop === undefined && isNestedAccess(trimmedKey))
          prop = resolvePropertyPath(properties, trimmedKey);
      }
      message.push(prop);
      i = closeIndex;
      startIndex = i + 1;
    } else if (char === "}" && i + 1 < length && template[i + 1] === "}")
      i++;
  }
  const remainingText = template.slice(startIndex);
  message.push(remainingText.replace(/{{/g, "{").replace(/}}/g, "}"));
  return message;
}
function renderMessage(template, values) {
  const args = [];
  for (let i = 0;i < template.length; i++) {
    args.push(template[i]);
    if (i < values.length)
      args.push(values[i]);
  }
  return args;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/logging/categories.js
var LOG_CATEGORIES = {
  ROOT: ["@mysten/messaging"],
  CLIENT_READS: ["@mysten/messaging", "client", "reads"],
  CLIENT_WRITES: ["@mysten/messaging", "client", "writes"],
  ENCRYPTION: ["@mysten/messaging", "encryption"],
  STORAGE: ["@mysten/messaging", "storage"],
  STORAGE_WALRUS: ["@mysten/messaging", "storage", "walrus"]
};

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/logging/index.js
function getLogger2(category) {
  return getLogger(category);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/utils/index.js
var MOVE_STDLIB_ADDRESS2 = normalizeSuiAddress("0x1");
var SUI_FRAMEWORK_ADDRESS2 = normalizeSuiAddress("0x2");
var SUI_SYSTEM_ADDRESS = normalizeSuiAddress("0x3");
function getPureBcsSchema2(typeTag) {
  const parsedTag = typeof typeTag === "string" ? TypeTagSerializer.parseFromStr(typeTag) : typeTag;
  if ("u8" in parsedTag) {
    return suiBcs.U8;
  } else if ("u16" in parsedTag) {
    return suiBcs.U16;
  } else if ("u32" in parsedTag) {
    return suiBcs.U32;
  } else if ("u64" in parsedTag) {
    return suiBcs.U64;
  } else if ("u128" in parsedTag) {
    return suiBcs.U128;
  } else if ("u256" in parsedTag) {
    return suiBcs.U256;
  } else if ("address" in parsedTag) {
    return suiBcs.Address;
  } else if ("bool" in parsedTag) {
    return suiBcs.Bool;
  } else if ("vector" in parsedTag) {
    const type = getPureBcsSchema2(parsedTag.vector);
    return type ? suiBcs.vector(type) : null;
  } else if ("struct" in parsedTag) {
    const structTag = parsedTag.struct;
    const pkg = normalizeSuiAddress(parsedTag.struct.address);
    if (pkg === MOVE_STDLIB_ADDRESS2) {
      if ((structTag.module === "ascii" || structTag.module === "string") && structTag.name === "String") {
        return suiBcs.String;
      }
      if (structTag.module === "option" && structTag.name === "Option") {
        const type = getPureBcsSchema2(structTag.typeParams[0]);
        return type ? suiBcs.vector(type) : null;
      }
    }
    if (pkg === SUI_FRAMEWORK_ADDRESS2 && structTag.module === "Object" && structTag.name === "ID") {
      return suiBcs.Address;
    }
  }
  return null;
}
function normalizeMoveArguments(args, argTypes, parameterNames) {
  if (parameterNames && argTypes.length !== parameterNames.length) {
    throw new Error(`Invalid number of parameterNames, expected ${argTypes.length}, got ${parameterNames.length}`);
  }
  const normalizedArgs = [];
  let index = 0;
  for (const [i, argType] of argTypes.entries()) {
    if (argType === `${SUI_FRAMEWORK_ADDRESS2}::deny_list::DenyList`) {
      normalizedArgs.push((tx) => tx.object.denyList());
      continue;
    }
    if (argType === `${SUI_FRAMEWORK_ADDRESS2}::random::Random`) {
      normalizedArgs.push((tx) => tx.object.random());
      continue;
    }
    if (argType === `${SUI_FRAMEWORK_ADDRESS2}::clock::Clock`) {
      normalizedArgs.push((tx) => tx.object.clock());
      continue;
    }
    if (argType === `${SUI_SYSTEM_ADDRESS}::sui_system::SuiSystemState`) {
      normalizedArgs.push((tx) => tx.object.system());
      continue;
    }
    let arg;
    if (Array.isArray(args)) {
      if (index >= args.length) {
        throw new Error(`Invalid number of arguments, expected at least ${index + 1}, got ${args.length}`);
      }
      arg = args[index];
    } else {
      if (!parameterNames) {
        throw new Error(`Expected arguments to be passed as an array`);
      }
      const name = parameterNames[index];
      arg = args[name];
      if (arg == null) {
        throw new Error(`Parameter ${name} is required`);
      }
    }
    index += 1;
    if (typeof arg === "function" || isArgument(arg)) {
      normalizedArgs.push(arg);
      continue;
    }
    const type = argTypes[i];
    const bcsType = getPureBcsSchema2(type);
    if (bcsType) {
      const bytes = bcsType.serialize(arg);
      normalizedArgs.push((tx) => tx.pure(bytes));
      continue;
    } else if (typeof arg === "string") {
      normalizedArgs.push((tx) => tx.object(arg));
      continue;
    }
    throw new Error(`Invalid argument ${stringify(arg)} for type ${type}`);
  }
  return normalizedArgs;
}

class MoveStruct extends BcsStruct {
}
class MoveTuple extends BcsTuple {
}
function stringify(val) {
  if (typeof val === "object") {
    return JSON.stringify(val, (val2) => val2);
  }
  if (typeof val === "bigint") {
    return val.toString();
  }
  return val;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/deps/sui/object.js
var $moduleName = "0x2::object";
var UID = new MoveStruct({
  name: `${$moduleName}::UID`,
  fields: {
    id: suiBcs.Address
  }
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/deps/sui/vec_map.js
var $moduleName2 = "0x2::vec_map";
function Entry(...typeParameters) {
  return new MoveStruct({
    name: `${$moduleName2}::Entry<${typeParameters[0].name}, ${typeParameters[1].name}>`,
    fields: {
      key: typeParameters[0],
      value: typeParameters[1]
    }
  });
}
function VecMap(...typeParameters) {
  return new MoveStruct({
    name: `${$moduleName2}::VecMap<${typeParameters[0].name}, ${typeParameters[1].name}>`,
    fields: {
      contents: suiBcs.vector(Entry(typeParameters[0], typeParameters[1]))
    }
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/deps/sui/vec_set.js
var $moduleName3 = "0x2::vec_set";
function VecSet(...typeParameters) {
  return new MoveStruct({
    name: `${$moduleName3}::VecSet<${typeParameters[0].name}>`,
    fields: {
      contents: suiBcs.vector(typeParameters[0])
    }
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/deps/std/type_name.js
var $moduleName4 = "std::type_name";
var TypeName = new MoveStruct({
  name: `${$moduleName4}::TypeName`,
  fields: {
    name: suiBcs.string()
  }
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/deps/sui/versioned.js
var $moduleName5 = "0x2::versioned";
var Versioned = new MoveStruct({
  name: `${$moduleName5}::Versioned`,
  fields: {
    id: UID,
    version: suiBcs.u64()
  }
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/auth.js
var $moduleName6 = "@local-pkg/sui-stack-messaging::auth";
var Auth = new MoveStruct({
  name: `${$moduleName6}::Auth`,
  fields: {
    member_permissions: VecMap(suiBcs.Address, VecSet(TypeName)),
    config: Versioned
  }
});
var EditPermissions = new MoveTuple({
  name: `${$moduleName6}::EditPermissions`,
  fields: [suiBcs.bool()]
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/deps/sui/table.js
var $moduleName7 = "0x2::table";
var Table = new MoveStruct({
  name: `${$moduleName7}::Table`,
  fields: {
    id: UID,
    size: suiBcs.u64()
  }
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/deps/sui/table_vec.js
var $moduleName8 = "0x2::table_vec";
var TableVec = new MoveStruct({
  name: `${$moduleName8}::TableVec`,
  fields: {
    contents: Table
  }
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/attachment.js
var $moduleName9 = "@local-pkg/sui-stack-messaging::attachment";
var Attachment = new MoveStruct({
  name: `${$moduleName9}::Attachment`,
  fields: {
    blob_ref: suiBcs.string(),
    encrypted_metadata: suiBcs.vector(suiBcs.u8()),
    data_nonce: suiBcs.vector(suiBcs.u8()),
    metadata_nonce: suiBcs.vector(suiBcs.u8()),
    key_version: suiBcs.u32()
  }
});
function _new(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    "0x0000000000000000000000000000000000000000000000000000000000000001::string::String",
    "vector<u8>",
    "vector<u8>",
    "vector<u8>",
    "u32"
  ];
  const parameterNames = [
    "blobRef",
    "encryptedMetadata",
    "dataNonce",
    "metadataNonce",
    "keyVersion"
  ];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "attachment",
    function: "new",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/message.js
var $moduleName10 = "@local-pkg/sui-stack-messaging::message";
var Message = new MoveStruct({
  name: `${$moduleName10}::Message`,
  fields: {
    sender: suiBcs.Address,
    ciphertext: suiBcs.vector(suiBcs.u8()),
    nonce: suiBcs.vector(suiBcs.u8()),
    key_version: suiBcs.u32(),
    attachments: suiBcs.vector(Attachment),
    created_at_ms: suiBcs.u64()
  }
});
var MessageAddedEvent = new MoveStruct({
  name: `${$moduleName10}::MessageAddedEvent`,
  fields: {
    channel_id: suiBcs.Address,
    message_index: suiBcs.u64(),
    sender: suiBcs.Address,
    ciphertext: suiBcs.vector(suiBcs.u8()),
    nonce: suiBcs.vector(suiBcs.u8()),
    key_version: suiBcs.u32(),
    attachment_refs: suiBcs.vector(suiBcs.string()),
    attachment_nonces: suiBcs.vector(suiBcs.vector(suiBcs.u8())),
    created_at_ms: suiBcs.u64()
  }
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/encryption_key_history.js
var $moduleName11 = "@local-pkg/sui-stack-messaging::encryption_key_history";
var EncryptionKeyHistory = new MoveStruct({
  name: `${$moduleName11}::EncryptionKeyHistory`,
  fields: {
    latest: suiBcs.vector(suiBcs.u8()),
    latest_version: suiBcs.u32(),
    history: TableVec
  }
});
var EditEncryptionKey = new MoveTuple({
  name: `${$moduleName11}::EditEncryptionKey`,
  fields: [suiBcs.bool()]
});

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/channel.js
var $moduleName12 = "@local-pkg/sui-stack-messaging::channel";
var Channel = new MoveStruct({
  name: `${$moduleName12}::Channel`,
  fields: {
    id: UID,
    version: suiBcs.u64(),
    auth: Auth,
    messages: TableVec,
    messages_count: suiBcs.u64(),
    last_message: suiBcs.option(Message),
    created_at_ms: suiBcs.u64(),
    updated_at_ms: suiBcs.u64(),
    encryption_key_history: EncryptionKeyHistory
  }
});
var SimpleMessenger = new MoveTuple({
  name: `${$moduleName12}::SimpleMessenger`,
  fields: [suiBcs.bool()]
});
function _new2(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    `0x0000000000000000000000000000000000000000000000000000000000000001::option::Option<${packageAddress}::config::Config>`,
    "0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock"
  ];
  const parameterNames = ["config", "clock"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "channel",
    function: "new",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}
function share(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    `${packageAddress}::channel::Channel`,
    `${packageAddress}::creator_cap::CreatorCap`
  ];
  const parameterNames = ["self", "creatorCap"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "channel",
    function: "share",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}
function addEncryptedKey(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    `${packageAddress}::channel::Channel`,
    `${packageAddress}::member_cap::MemberCap`,
    "vector<u8>"
  ];
  const parameterNames = ["self", "memberCap", "newEncryptionKeyBytes"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "channel",
    function: "add_encrypted_key",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}
function addMembers(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    `${packageAddress}::channel::Channel`,
    `${packageAddress}::member_cap::MemberCap`,
    "u64",
    "0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock"
  ];
  const parameterNames = ["self", "memberCap", "n", "clock"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "channel",
    function: "add_members",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}
function sendMessage(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    `${packageAddress}::channel::Channel`,
    `${packageAddress}::member_cap::MemberCap`,
    "vector<u8>",
    "vector<u8>",
    `vector<${packageAddress}::attachment::Attachment>`,
    "0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock"
  ];
  const parameterNames = ["self", "memberCap", "ciphertext", "nonce", "attachments", "clock"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "channel",
    function: "send_message",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/constants.js
var FALLBACK_PACKAGE_ID = "0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d";
var DEFAULT_SEAL_APPROVE_CONTRACT = {
  module: "seal_policies",
  functionName: "seal_approve"
};
var TESTNET_MESSAGING_PACKAGE_CONFIG = {
  packageId: FALLBACK_PACKAGE_ID
};
var MAINNET_MESSAGING_PACKAGE_CONFIG = {
  packageId: FALLBACK_PACKAGE_ID
};

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/error.js
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _MessagingAPIError_static;
var generate_fn;

class MessagingClientError extends Error {
}

class UserError extends MessagingClientError {
}
var _MessagingAPIError = class _MessagingAPIError2 extends MessagingClientError {
  constructor(message, requestId, status) {
    super(message);
    this.requestId = requestId;
    this.status = status;
  }
  static async assertResponse(response, requestId) {
    var _a;
    if (response.ok) {
      return;
    }
    let errorInstance;
    try {
      const text = await response.text();
      const error = JSON.parse(text)["error"];
      const message = JSON.parse(text)["message"];
      errorInstance = __privateMethod(_a = _MessagingAPIError2, _MessagingAPIError_static, generate_fn).call(_a, error, message, requestId);
    } catch {
      errorInstance = new GeneralError(response.statusText, requestId, response.status);
    }
    throw errorInstance;
  }
};
_MessagingAPIError_static = new WeakSet;
generate_fn = function(error, message, requestId, status) {
  switch (error) {
    case "NotImplementedFeature":
      return new ApiNotImplementedFeatureError(requestId);
    default:
      return new GeneralError(message, requestId, status);
  }
};
__privateAdd(_MessagingAPIError, _MessagingAPIError_static);
var MessagingAPIError = _MessagingAPIError;

class ApiNotImplementedFeatureError extends MessagingAPIError {
  constructor(requestId) {
    super("API: Not implemented yet", requestId);
  }
}

class GeneralError extends MessagingAPIError {
}

class NotImplementedFeatureError extends UserError {
  constructor() {
    super("SDK: Not implemented yet");
  }
}
function toMajorityError(errors) {
  let maxCount = 0;
  let majorityError = errors[0];
  const counts = /* @__PURE__ */ new Map;
  for (const error of errors) {
    const errorName = error.constructor.name;
    const newCount = (counts.get(errorName) || 0) + 1;
    counts.set(errorName, newCount);
    if (newCount > maxCount) {
      maxCount = newCount;
      majorityError = error;
    }
  }
  return majorityError;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/storage/adapters/walrus/walrus.js
var __typeError2 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck2 = (obj, member, msg) => member.has(obj) || __typeError2("Cannot " + msg);
var __privateAdd2 = (obj, member, value) => member.has(obj) ? __typeError2("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod2 = (obj, member, method) => (__accessCheck2(obj, member, "access private method"), method);
var _WalrusStorageAdapter_instances;
var uploadQuilts_fn;
var downloadQuilts_fn;
var extractBlobId_fn;
var extractQuiltsPatchIds_fn;

class WalrusStorageAdapter {
  constructor(_client, config) {
    this._client = _client;
    this.config = config;
    __privateAdd2(this, _WalrusStorageAdapter_instances);
  }
  async upload(data, _options) {
    const logger = getLogger2(LOG_CATEGORIES.STORAGE_WALRUS);
    const totalBytes = data.reduce((sum, d) => sum + d.length, 0);
    logger.debug("Uploading to Walrus", {
      count: data.length,
      totalBytes,
      publisherUrl: this.config.publisher,
      epochs: this.config.epochs
    });
    const result = await __privateMethod2(this, _WalrusStorageAdapter_instances, uploadQuilts_fn).call(this, data);
    logger.info("Uploaded to Walrus", {
      count: result.ids.length,
      blobIds: result.ids,
      totalBytes
    });
    return result;
  }
  async download(ids) {
    const logger = getLogger2(LOG_CATEGORIES.STORAGE_WALRUS);
    logger.debug("Downloading from Walrus", {
      count: ids.length,
      ids,
      aggregatorUrl: this.config.aggregator
    });
    if (ids.length === 0) {
      return [];
    }
    const result = await __privateMethod2(this, _WalrusStorageAdapter_instances, downloadQuilts_fn).call(this, ids);
    logger.info("Downloaded from Walrus", {
      count: result.length,
      totalBytes: result.reduce((sum, d) => sum + d.length, 0)
    });
    return result;
  }
}
_WalrusStorageAdapter_instances = new WeakSet;
uploadQuilts_fn = async function(data) {
  const formData = new FormData;
  for (let i = 0;i < data.length; i++) {
    const identifier = `attachment${i}`;
    const blob = new Blob([new Uint8Array(data[i])]);
    formData.append(identifier, blob);
  }
  const response = await fetch(`${this.config.publisher}/v1/quilts?epochs=${this.config.epochs}`, {
    method: "PUT",
    body: formData
  });
  if (!response.ok) {
    const errorText = await response.text();
    const logger = getLogger2(LOG_CATEGORIES.STORAGE_WALRUS);
    logger.error("Walrus upload failed", {
      status: response.status,
      statusText: response.statusText,
      errorText,
      publisherUrl: this.config.publisher
    });
    throw new Error(`Walrus upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  const result = await response.json();
  return { ids: __privateMethod2(this, _WalrusStorageAdapter_instances, extractQuiltsPatchIds_fn).call(this, result) };
};
downloadQuilts_fn = async function(patchIds) {
  const response = await Promise.all(patchIds.map(async (id) => await fetch(`${this.config.aggregator}/v1/blobs/by-quilt-patch-id/${id}`)));
  const data = await Promise.all(response.map(async (response2) => await response2.arrayBuffer()));
  return data.map((data2) => new Uint8Array(data2));
};
extractBlobId_fn = function(response) {
  if (response.newlyCreated?.blobObject?.blobId) {
    return response.newlyCreated.blobObject.blobId;
  }
  if (response.alreadyCertified?.blobId) {
    return response.alreadyCertified.blobId;
  }
  if (response.blobStoreResult?.newlyCreated?.blobObject?.blobId) {
    return response.blobStoreResult.newlyCreated.blobObject.blobId;
  }
  throw new Error("Unable to extract blob ID from response");
};
extractQuiltsPatchIds_fn = function(response) {
  if (response.storedQuiltBlobs) {
    return response.storedQuiltBlobs.map((quilt) => quilt.quiltPatchId);
  }
  throw new Error("Unable to extract quilt patch IDs from response");
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/bcs.mjs
var IBEEncryptions = suiBcs.enum("IBEEncryptions", { BonehFranklinBLS12381: suiBcs.struct("BonehFranklinBLS12381", {
  nonce: suiBcs.bytes(96),
  encryptedShares: suiBcs.vector(suiBcs.bytes(32)),
  encryptedRandomness: suiBcs.bytes(32)
}) });
var Ciphertext = suiBcs.enum("Ciphertext", {
  Aes256Gcm: suiBcs.struct("Aes256Gcm", {
    blob: suiBcs.byteVector(),
    aad: suiBcs.option(suiBcs.byteVector())
  }),
  Hmac256Ctr: suiBcs.struct("Hmac256Ctr", {
    blob: suiBcs.byteVector(),
    aad: suiBcs.option(suiBcs.byteVector()),
    mac: suiBcs.bytes(32)
  }),
  Plain: suiBcs.struct("Plain", {})
});
var EncryptedObject = suiBcs.struct("EncryptedObject", {
  version: suiBcs.u8(),
  packageId: suiBcs.Address,
  id: suiBcs.byteVector().transform({
    output: (val) => toHex(val),
    input: (val) => fromHex(val)
  }),
  services: suiBcs.vector(suiBcs.tuple([suiBcs.Address, suiBcs.u8()])),
  threshold: suiBcs.u8(),
  encryptedShares: IBEEncryptions,
  ciphertext: Ciphertext
});
var KeyServerMoveV1 = suiBcs.struct("KeyServerV1", {
  name: suiBcs.string(),
  url: suiBcs.string(),
  keyType: suiBcs.u8(),
  pk: suiBcs.byteVector()
});
var PartialKeyServer = suiBcs.struct("PartialKeyServer", {
  name: suiBcs.string(),
  url: suiBcs.string(),
  partialPk: suiBcs.byteVector(),
  partyId: suiBcs.u16()
});
var ServerType = suiBcs.enum("ServerType", {
  Independent: suiBcs.struct("Independent", { url: suiBcs.string() }),
  Committee: suiBcs.struct("Committee", {
    version: suiBcs.u32(),
    threshold: suiBcs.u16(),
    partialKeyServers: suiBcs.vector(suiBcs.struct("VecMapEntry", {
      key: suiBcs.Address,
      value: PartialKeyServer
    }))
  })
});
var KeyServerMoveV2 = suiBcs.struct("KeyServerV2", {
  name: suiBcs.string(),
  keyType: suiBcs.u8(),
  pk: suiBcs.byteVector(),
  serverType: ServerType
});
var KeyServerMove = suiBcs.struct("KeyServer", {
  id: suiBcs.Address,
  firstVersion: suiBcs.u64(),
  lastVersion: suiBcs.u64()
});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/error.mjs
var SealError = class extends Error {
};
var UserError2 = class extends SealError {
};
var SealAPIError = class SealAPIError2 extends SealError {
  constructor(message, requestId, status) {
    super(message);
    this.requestId = requestId;
    this.status = status;
  }
  static #generate(error, message, requestId, status) {
    switch (error) {
      case "InvalidPTB":
        return new InvalidPTBError(requestId, message);
      case "InvalidPackage":
        return new InvalidPackageError(requestId);
      case "NoAccess":
        return new NoAccessError(requestId);
      case "InvalidSignature":
        return new InvalidUserSignatureError(requestId);
      case "InvalidSessionSignature":
        return new InvalidSessionKeySignatureError(requestId);
      case "InvalidCertificate":
        return new ExpiredSessionKeyError(requestId);
      case "InvalidSDKVersion":
        return new InvalidSDKVersionError(requestId);
      case "InvalidSDKType":
        return new InvalidSDKTypeError(requestId);
      case "DeprecatedSDKVersion":
        return new DeprecatedSDKVersionError(requestId);
      case "InvalidParameter":
        return new InvalidParameterError(requestId);
      case "InvalidMVRName":
        return new InvalidMVRNameError(requestId);
      case "InvalidServiceId":
        return new InvalidKeyServerObjectIdError(requestId);
      case "UnsupportedPackageId":
        return new UnsupportedPackageIdError(requestId);
      case "Failure":
        return new InternalError(requestId);
      default:
        return new GeneralError2(message, requestId, status);
    }
  }
  static async assertResponse(response, requestId) {
    if (response.ok)
      return;
    let errorInstance;
    try {
      const text = await response.text();
      const error = JSON.parse(text)["error"];
      const message = JSON.parse(text)["message"];
      errorInstance = SealAPIError2.#generate(error, message, requestId);
    } catch {
      errorInstance = new GeneralError2(response.statusText, requestId, response.status);
    }
    throw errorInstance;
  }
};
var InvalidPTBError = class extends SealAPIError {
  constructor(requestId, message) {
    super("PTB does not conform to the expected format " + message, requestId);
  }
};
var InvalidPackageError = class extends SealAPIError {
  constructor(requestId) {
    super("Package ID used in PTB is invalid", requestId);
  }
};
var InvalidParameterError = class extends SealAPIError {
  constructor(requestId) {
    super("PTB contains an invalid parameter, possibly a newly created object that the FN has not yet seen", requestId);
  }
};
var InvalidUserSignatureError = class extends SealAPIError {
  constructor(requestId) {
    super("User signature on the session key is invalid", requestId);
  }
};
var InvalidSessionKeySignatureError = class extends SealAPIError {
  constructor(requestId) {
    super("Session key signature is invalid", requestId);
  }
};
var InvalidMVRNameError = class extends SealAPIError {
  constructor(requestId) {
    super("MVR name is invalid or not consistent with the first version of the package", requestId);
  }
};
var InvalidKeyServerObjectIdError = class extends SealAPIError {
  constructor(requestId) {
    super("Key server object ID is invalid", requestId);
  }
};
var UnsupportedPackageIdError = class extends SealAPIError {
  constructor(requestId) {
    super("Requested package is not supported", requestId);
  }
};
var InvalidSDKVersionError = class extends SealAPIError {
  constructor(requestId) {
    super("SDK version is invalid", requestId);
  }
};
var InvalidSDKTypeError = class extends SealAPIError {
  constructor(requestId) {
    super("SDK type is invalid", requestId);
  }
};
var DeprecatedSDKVersionError = class extends SealAPIError {
  constructor(requestId) {
    super("SDK version is deprecated", requestId);
  }
};
var NoAccessError = class extends SealAPIError {
  constructor(requestId) {
    super("User does not have access to one or more of the requested keys", requestId);
  }
};
var ExpiredSessionKeyError = class extends SealAPIError {
  constructor(requestId) {
    super("Session key has expired", requestId);
  }
};
var InternalError = class extends SealAPIError {
  constructor(requestId) {
    super("Internal server error, caller should retry", requestId);
  }
};
var GeneralError2 = class extends SealAPIError {
};
var InvalidPersonalMessageSignatureError = class extends UserError2 {
};
var UnsupportedFeatureError = class extends UserError2 {
};
var InvalidKeyServerError = class extends UserError2 {
};
var InvalidKeyServerVersionError = class extends UserError2 {
};
var InvalidCiphertextError = class extends UserError2 {
};
var InvalidThresholdError = class extends UserError2 {
};
var InconsistentKeyServersError = class extends UserError2 {
};
var DecryptionError = class extends UserError2 {
};
var InvalidClientOptionsError = class extends UserError2 {
};
var TooManyFailedFetchKeyRequestsError = class extends UserError2 {
};
function toMajorityError2(errors) {
  let maxCount = 0;
  let majorityError = errors[0];
  const counts = /* @__PURE__ */ new Map;
  for (const error of errors) {
    const errorName = error.constructor.name;
    const newCount = (counts.get(errorName) || 0) + 1;
    counts.set(errorName, newCount);
    if (newCount > maxCount) {
      maxCount = newCount;
      majorityError = error;
    }
  }
  return majorityError;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/utils.mjs
var MAX_U8 = 255;
var SUI_ADDRESS_LENGTH2 = 32;
var ENCRYPTED_SHARE_LENGTH = 32;
var KEY_LENGTH = 32;
function xor(a, b) {
  if (a.length !== b.length)
    throw new Error("Invalid input");
  return xorUnchecked(a, b);
}
function xorUnchecked(a, b) {
  return a.map((ai, i) => ai ^ b[i]);
}
function createFullId(packageId, innerId) {
  if (!isValidSuiObjectId(packageId))
    throw new UserError2(`Invalid package ID ${packageId}`);
  return toHex(flatten([fromHex(packageId), fromHex(innerId)]));
}
function flatten(arrays) {
  const length = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(length);
  arrays.reduce((offset, array2) => {
    result.set(array2, offset);
    return offset + array2.length;
  }, 0);
  return result;
}
function count(array2, value) {
  return array2.reduce((count$1, item) => item === value ? count$1 + 1 : count$1, 0);
}
function hasDuplicates(array2) {
  return new Set(array2).size !== array2.length;
}
function allEqual(array2) {
  if (array2.length === 0)
    return true;
  return array2.every((item) => item === array2[0]);
}
function equals(a, b) {
  if (a.length !== b.length)
    return false;
  return a.every((ai, i) => ai === b[i]);
}
var Version = class {
  constructor(version) {
    const parts = version.split(".").map(Number);
    if (parts.length !== 3 || parts.some((part) => isNaN(part) || !Number.isInteger(part) || part < 0))
      throw new UserError2(`Invalid version format: ${version}`);
    this.major = parts[0];
    this.minor = parts[1];
    this.patch = parts[2];
  }
  older_than(other) {
    if (this.major !== other.major)
      return this.major < other.major;
    else if (this.minor !== other.minor)
      return this.minor < other.minor;
    return this.patch < other.patch;
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);

class SHA2_32B extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0;i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16;i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0;i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
}

class _SHA256 extends SHA2_32B {
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
}

class _SHA224 extends SHA2_32B {
  A = SHA224_IV[0] | 0;
  B = SHA224_IV[1] | 0;
  C = SHA224_IV[2] | 0;
  D = SHA224_IV[3] | 0;
  E = SHA224_IV[4] | 0;
  F = SHA224_IV[5] | 0;
  G = SHA224_IV[6] | 0;
  H = SHA224_IV[7] | 0;
  constructor() {
    super(28);
  }
}
var K512 = /* @__PURE__ */ (() => split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n) => BigInt(n))))();
var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);

class SHA2_64B extends HashMD {
  constructor(outputLen) {
    super(128, outputLen, 16, false);
  }
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
  }
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  process(view, offset) {
    for (let i = 0;i < 16; i++, offset += 4) {
      SHA512_W_H[i] = view.getUint32(offset);
      SHA512_W_L[i] = view.getUint32(offset += 4);
    }
    for (let i = 16;i < 80; i++) {
      const W15h = SHA512_W_H[i - 15] | 0;
      const W15l = SHA512_W_L[i - 15] | 0;
      const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
      const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i - 2] | 0;
      const W2l = SHA512_W_L[i - 2] | 0;
      const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
      const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
      const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
      const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
      SHA512_W_H[i] = SUMh | 0;
      SHA512_W_L[i] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i = 0;i < 80; i++) {
      const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
      const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
      const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
      const T1l = T1ll | 0;
      const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
      const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = add3L(T1l, sigma0l, MAJl);
      Ah = add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    clean(SHA512_W_H, SHA512_W_L);
  }
  destroy() {
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
}

class _SHA512 extends SHA2_64B {
  Ah = SHA512_IV[0] | 0;
  Al = SHA512_IV[1] | 0;
  Bh = SHA512_IV[2] | 0;
  Bl = SHA512_IV[3] | 0;
  Ch = SHA512_IV[4] | 0;
  Cl = SHA512_IV[5] | 0;
  Dh = SHA512_IV[6] | 0;
  Dl = SHA512_IV[7] | 0;
  Eh = SHA512_IV[8] | 0;
  El = SHA512_IV[9] | 0;
  Fh = SHA512_IV[10] | 0;
  Fl = SHA512_IV[11] | 0;
  Gh = SHA512_IV[12] | 0;
  Gl = SHA512_IV[13] | 0;
  Hh = SHA512_IV[14] | 0;
  Hl = SHA512_IV[15] | 0;
  constructor() {
    super(64);
  }
}

class _SHA384 extends SHA2_64B {
  Ah = SHA384_IV[0] | 0;
  Al = SHA384_IV[1] | 0;
  Bh = SHA384_IV[2] | 0;
  Bl = SHA384_IV[3] | 0;
  Ch = SHA384_IV[4] | 0;
  Cl = SHA384_IV[5] | 0;
  Dh = SHA384_IV[6] | 0;
  Dl = SHA384_IV[7] | 0;
  Eh = SHA384_IV[8] | 0;
  El = SHA384_IV[9] | 0;
  Fh = SHA384_IV[10] | 0;
  Fl = SHA384_IV[11] | 0;
  Gh = SHA384_IV[12] | 0;
  Gl = SHA384_IV[13] | 0;
  Hh = SHA384_IV[14] | 0;
  Hl = SHA384_IV[15] | 0;
  constructor() {
    super(48);
  }
}
var T224_IV = /* @__PURE__ */ Uint32Array.from([
  2352822216,
  424955298,
  1944164710,
  2312950998,
  502970286,
  855612546,
  1738396948,
  1479516111,
  258812777,
  2077511080,
  2011393907,
  79989058,
  1067287976,
  1780299464,
  286451373,
  2446758561
]);
var T256_IV = /* @__PURE__ */ Uint32Array.from([
  573645204,
  4230739756,
  2673172387,
  3360449730,
  596883563,
  1867755857,
  2520282905,
  1497426621,
  2519219938,
  2827943907,
  3193839141,
  1401305490,
  721525244,
  746961066,
  246885852,
  2177182882
]);

class _SHA512_224 extends SHA2_64B {
  Ah = T224_IV[0] | 0;
  Al = T224_IV[1] | 0;
  Bh = T224_IV[2] | 0;
  Bl = T224_IV[3] | 0;
  Ch = T224_IV[4] | 0;
  Cl = T224_IV[5] | 0;
  Dh = T224_IV[6] | 0;
  Dl = T224_IV[7] | 0;
  Eh = T224_IV[8] | 0;
  El = T224_IV[9] | 0;
  Fh = T224_IV[10] | 0;
  Fl = T224_IV[11] | 0;
  Gh = T224_IV[12] | 0;
  Gl = T224_IV[13] | 0;
  Hh = T224_IV[14] | 0;
  Hl = T224_IV[15] | 0;
  constructor() {
    super(28);
  }
}

class _SHA512_256 extends SHA2_64B {
  Ah = T256_IV[0] | 0;
  Al = T256_IV[1] | 0;
  Bh = T256_IV[2] | 0;
  Bl = T256_IV[3] | 0;
  Ch = T256_IV[4] | 0;
  Cl = T256_IV[5] | 0;
  Dh = T256_IV[6] | 0;
  Dl = T256_IV[7] | 0;
  Eh = T256_IV[8] | 0;
  El = T256_IV[9] | 0;
  Fh = T256_IV[10] | 0;
  Fl = T256_IV[11] | 0;
  Gh = T256_IV[12] | 0;
  Gl = T256_IV[13] | 0;
  Hh = T256_IV[14] | 0;
  Hl = T256_IV[15] | 0;
  constructor() {
    super(32);
  }
}
var sha256 = /* @__PURE__ */ createHasher(() => new _SHA256, /* @__PURE__ */ oidNist(1));
var sha512 = /* @__PURE__ */ createHasher(() => new _SHA512, /* @__PURE__ */ oidNist(3));

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/utils.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
function abool(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix = title && `"${title}" `;
    throw new Error(prefix + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new Error("positive bigint expected, got " + n);
  } else
    anumber2(n);
  return n;
}
function asafenumber(value, title = "") {
  if (!Number.isSafeInteger(value)) {
    const prefix = title && `"${title}" `;
    throw new Error(prefix + "expected safe integer, got type=" + typeof value);
  }
}
function numberToHexUnpadded(num) {
  const hex2 = abignumber(num).toString(16);
  return hex2.length & 1 ? "0" + hex2 : hex2;
}
function hexToNumber(hex2) {
  if (typeof hex2 !== "string")
    throw new Error("hex string expected, got " + typeof hex2);
  return hex2 === "" ? _0n : BigInt("0x" + hex2);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  return hexToNumber(bytesToHex(copyBytes(abytes2(bytes)).reverse()));
}
function numberToBytesBE(n, len) {
  anumber2(len);
  n = abignumber(n);
  const res = hexToBytes(n.toString(16).padStart(len * 2, "0"));
  if (res.length !== len)
    throw new Error("number too large");
  return res;
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0;i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function copyBytes(bytes) {
  return Uint8Array.from(bytes);
}
function asciiToBytes(ascii) {
  return Uint8Array.from(ascii, (c, i) => {
    const charCode = c.charCodeAt(0);
    if (c.length !== 1 || charCode > 127) {
      throw new Error(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
    }
    return charCode;
  });
}
var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0;n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
function bitGet(n, pos) {
  return n >> BigInt(pos) & _1n;
}
var bitMask = (n) => (_1n << BigInt(n)) - _1n;
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  anumber2(hashLen, "hashLen");
  anumber2(qByteLen, "qByteLen");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  const u8n = (len) => new Uint8Array(len);
  const NULL = Uint8Array.of();
  const byte0 = Uint8Array.of(0);
  const byte1 = Uint8Array.of(1);
  const _maxDrbgIters = 1000;
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...msgs) => hmacFn(k, concatBytes(v, ...msgs));
  const reseed = (seed = NULL) => {
    k = h(byte0, seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(byte1, seed);
    v = h();
  };
  const gen = () => {
    if (i++ >= _maxDrbgIters)
      throw new Error("drbg: tried max amount of iterations");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = undefined;
    while (!(res = pred(gen())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object2, fields = {}, optFields = {}) {
  if (!object2 || typeof object2 !== "object")
    throw new Error("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    const val = object2[fieldName];
    if (isOpt && val === undefined)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}
var notImplemented = () => {
  throw new Error("not implemented");
};
function memoized(fn) {
  const map2 = new WeakMap;
  return (arg, ...args) => {
    const val = map2.get(arg);
    if (val !== undefined)
      return val;
    const computed = fn(arg, ...args);
    map2.set(arg, computed);
    return computed;
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/abstract/modular.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _16n = /* @__PURE__ */ BigInt(16);
function mod(a, b) {
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number2, modulo) {
  if (number2 === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number2, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd2 = b;
  if (gcd2 !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n2) / _4n;
  const root = Fp.pow(n, p1div4);
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i = Fp.mul(Fp.mul(nv, _2n), v);
  const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return (Fp, n) => {
    let tv1 = Fp.pow(n, c4);
    let tv2 = Fp.mul(tv1, c1);
    const tv3 = Fp.mul(tv1, c2);
    const tv4 = Fp.mul(tv1, c3);
    const e1 = Fp.eql(Fp.sqr(tv2), n);
    const e2 = Fp.eql(Fp.sqr(tv3), n);
    tv1 = Fp.cmov(tv1, tv2, e1);
    tv2 = Fp.cmov(tv4, tv3, e2);
    const e3 = Fp.eql(Fp.sqr(tv2), n);
    const root = Fp.cmov(tv1, tv2, e3);
    assertIsSquare(Fp, root, n);
    return root;
  };
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1000)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i++;
        t_tmp = Fp.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = Fp.pow(c, exponent);
      M = i;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map2, val) => {
    map2[val] = "function";
    return map2;
  }, initial);
  validateObject(field, opts);
  return field;
}
function FpPow(Fp, num, power) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return Fp.ONE;
  if (power === _1n2)
    return num;
  let p = Fp.ONE;
  let d = num;
  while (power > _0n2) {
    if (power & _1n2)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : undefined);
  const multipliedAcc = nums.reduce((acc, num, i) => {
    if (Fp.is0(num))
      return acc;
    inverted[i] = acc;
    return Fp.mul(acc, num);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num, i) => {
    if (Fp.is0(num))
      return acc;
    inverted[i] = Fp.mul(acc, inverted[i]);
    return Fp.mul(acc, num);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n2) / _2n;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== undefined)
    anumber2(nBitLength);
  const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}

class _Field {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _sqrt;
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _0n2)
      throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
    let _nbitLength = undefined;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        this.sqrt = opts.sqrt;
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = opts.allowedLengths?.slice();
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    this._sqrt = undefined;
    Object.preventExtensions(this);
  }
  create(num) {
    return mod(num, this.ORDER);
  }
  isValid(num) {
    if (typeof num !== "bigint")
      throw new Error("invalid field element: expected bigint, got " + typeof num);
    return _0n2 <= num && num < this.ORDER;
  }
  is0(num) {
    return num === _0n2;
  }
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  isOdd(num) {
    return (num & _1n2) === _1n2;
  }
  neg(num) {
    return mod(-num, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num) {
    return mod(num * num, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num, power) {
    return FpPow(this, num, power);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  sqrN(num) {
    return num * num;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num) {
    return invert(num, this.ORDER);
  }
  sqrt(num) {
    if (!this._sqrt)
      this._sqrt = FpSqrt(this.ORDER);
    return this._sqrt(this, num);
  }
  toBytes(num) {
    return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
  }
  fromBytes(bytes, skipValidation = false) {
    abytes2(bytes);
    const { _lengths: allowedLengths, BYTES, isLE: isLE2, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes, isLE2 ? 0 : padded.length - bytes.length);
      bytes = padded;
    }
    if (bytes.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
    let scalar = isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    if (modFromBytes)
      scalar = mod(scalar, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar;
  }
  invertBatch(lst) {
    return FpInvertBatch(this, lst);
  }
  cmov(a, b, condition) {
    return condition ? b : a;
  }
}
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE2 = false) {
  abytes2(key);
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num = isLE2 ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num, fieldOrder - _1n2) + _1n2;
  return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/abstract/curve.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
var pointPrecomputes = new WeakMap;
var pointWindowSizes = new WeakMap;
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}

class wNAF {
  BASE;
  ZERO;
  Fn;
  bits;
  constructor(Point, bits) {
    this.BASE = Point.BASE;
    this.ZERO = Point.ZERO;
    this.Fn = Point.Fn;
    this.bits = bits;
  }
  _unsafeLadder(elm, n, p = this.ZERO) {
    let d = elm;
    while (n > _0n3) {
      if (n & _1n3)
        p = p.add(d);
      d = d.double();
      n >>= _1n3;
    }
    return p;
  }
  precomputeWindow(point, W) {
    const { windows, windowSize } = calcWOpts(W, this.bits);
    const points = [];
    let p = point;
    let base = p;
    for (let window = 0;window < windows; window++) {
      base = p;
      points.push(base);
      for (let i = 1;i < windowSize; i++) {
        base = base.add(p);
        points.push(base);
      }
      p = base.double();
    }
    return points;
  }
  wNAF(W, precomputes, n) {
    if (!this.Fn.isValid(n))
      throw new Error("invalid scalar");
    let p = this.ZERO;
    let f = this.BASE;
    const wo = calcWOpts(W, this.bits);
    for (let window = 0;window < wo.windows; window++) {
      const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero) {
        f = f.add(negateCt(isNegF, precomputes[offsetF]));
      } else {
        p = p.add(negateCt(isNeg, precomputes[offset]));
      }
    }
    assert0(n);
    return { p, f };
  }
  wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
    const wo = calcWOpts(W, this.bits);
    for (let window = 0;window < wo.windows; window++) {
      if (n === _0n3)
        break;
      const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero) {
        continue;
      } else {
        const item = precomputes[offset];
        acc = acc.add(isNeg ? item.negate() : item);
      }
    }
    assert0(n);
    return acc;
  }
  getPrecomputes(W, point, transform2) {
    let comp = pointPrecomputes.get(point);
    if (!comp) {
      comp = this.precomputeWindow(point, W);
      if (W !== 1) {
        if (typeof transform2 === "function")
          comp = transform2(comp);
        pointPrecomputes.set(point, comp);
      }
    }
    return comp;
  }
  cached(point, scalar, transform2) {
    const W = getW(point);
    return this.wNAF(W, this.getPrecomputes(W, point, transform2), scalar);
  }
  unsafe(point, scalar, transform2, prev) {
    const W = getW(point);
    if (W === 1)
      return this._unsafeLadder(point, scalar, prev);
    return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform2), scalar, prev);
  }
  createCache(P, W) {
    validateW(W, this.bits);
    pointWindowSizes.set(P, W);
    pointPrecomputes.delete(P);
  }
  hasCache(elm) {
    return getW(elm) !== 1;
  }
}
function mulEndoUnsafe(Point, point, k1, k2) {
  let acc = point;
  let p1 = Point.ZERO;
  let p2 = Point.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function createField(order, field, isLE2) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE: isLE2 });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === undefined)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn };
}
function createKeygen(randomSecretKey, getPublicKey) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/abstract/hash-to-curve.js
var os2ip = bytesToNumberBE;
function i2osp(value, length) {
  asafenumber(value);
  asafenumber(length);
  if (value < 0 || value >= 1 << 8 * length)
    throw new Error("invalid I2OSP input: " + value);
  const res = Array.from({ length }).fill(0);
  for (let i = length - 1;i >= 0; i--) {
    res[i] = value & 255;
    value >>>= 8;
  }
  return new Uint8Array(res);
}
function strxor(a, b) {
  const arr = new Uint8Array(a.length);
  for (let i = 0;i < a.length; i++) {
    arr[i] = a[i] ^ b[i];
  }
  return arr;
}
function normDST(DST) {
  if (!isBytes2(DST) && typeof DST !== "string")
    throw new Error("DST must be Uint8Array or ascii string");
  return typeof DST === "string" ? asciiToBytes(DST) : DST;
}
function expand_message_xmd(msg, DST, lenInBytes, H) {
  abytes2(msg);
  asafenumber(lenInBytes);
  DST = normDST(DST);
  if (DST.length > 255)
    DST = H(concatBytes(asciiToBytes("H2C-OVERSIZE-DST-"), DST));
  const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
  const ell = Math.ceil(lenInBytes / b_in_bytes);
  if (lenInBytes > 65535 || ell > 255)
    throw new Error("expand_message_xmd: invalid lenInBytes");
  const DST_prime = concatBytes(DST, i2osp(DST.length, 1));
  const Z_pad = i2osp(0, r_in_bytes);
  const l_i_b_str = i2osp(lenInBytes, 2);
  const b = new Array(ell);
  const b_0 = H(concatBytes(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
  b[0] = H(concatBytes(b_0, i2osp(1, 1), DST_prime));
  for (let i = 1;i <= ell; i++) {
    const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
    b[i] = H(concatBytes(...args));
  }
  const pseudo_random_bytes = concatBytes(...b);
  return pseudo_random_bytes.slice(0, lenInBytes);
}
function expand_message_xof(msg, DST, lenInBytes, k, H) {
  abytes2(msg);
  asafenumber(lenInBytes);
  DST = normDST(DST);
  if (DST.length > 255) {
    const dkLen = Math.ceil(2 * k / 8);
    DST = H.create({ dkLen }).update(asciiToBytes("H2C-OVERSIZE-DST-")).update(DST).digest();
  }
  if (lenInBytes > 65535 || DST.length > 255)
    throw new Error("expand_message_xof: invalid lenInBytes");
  return H.create({ dkLen: lenInBytes }).update(msg).update(i2osp(lenInBytes, 2)).update(DST).update(i2osp(DST.length, 1)).digest();
}
function hash_to_field(msg, count2, options) {
  validateObject(options, {
    p: "bigint",
    m: "number",
    k: "number",
    hash: "function"
  });
  const { p, k, m, hash, expand, DST } = options;
  asafenumber(hash.outputLen, "valid hash");
  abytes2(msg);
  asafenumber(count2);
  const log2p = p.toString(2).length;
  const L = Math.ceil((log2p + k) / 8);
  const len_in_bytes = count2 * m * L;
  let prb;
  if (expand === "xmd") {
    prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
  } else if (expand === "xof") {
    prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
  } else if (expand === "_internal_pass") {
    prb = msg;
  } else {
    throw new Error('expand must be "xmd" or "xof"');
  }
  const u = new Array(count2);
  for (let i = 0;i < count2; i++) {
    const e = new Array(m);
    for (let j = 0;j < m; j++) {
      const elm_offset = L * (j + i * m);
      const tv = prb.subarray(elm_offset, elm_offset + L);
      e[j] = mod(os2ip(tv), p);
    }
    u[i] = e;
  }
  return u;
}
function isogenyMap(field, map2) {
  const coeff = map2.map((i) => Array.from(i).reverse());
  return (x, y) => {
    const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
    const [xd_inv, yd_inv] = FpInvertBatch(field, [xd, yd], true);
    x = field.mul(xn, xd_inv);
    y = field.mul(y, field.mul(yn, yd_inv));
    return { x, y };
  };
}
var _DST_scalar = asciiToBytes("HashToScalar-");
function createHasher2(Point, mapToCurve, defaults) {
  if (typeof mapToCurve !== "function")
    throw new Error("mapToCurve() must be defined");
  function map2(num) {
    return Point.fromAffine(mapToCurve(num));
  }
  function clear(initial) {
    const P = initial.clearCofactor();
    if (P.equals(Point.ZERO))
      return Point.ZERO;
    P.assertValidity();
    return P;
  }
  return {
    defaults: Object.freeze(defaults),
    Point,
    hashToCurve(msg, options) {
      const opts = Object.assign({}, defaults, options);
      const u = hash_to_field(msg, 2, opts);
      const u0 = map2(u[0]);
      const u1 = map2(u[1]);
      return clear(u0.add(u1));
    },
    encodeToCurve(msg, options) {
      const optsDst = defaults.encodeDST ? { DST: defaults.encodeDST } : {};
      const opts = Object.assign({}, defaults, optsDst, options);
      const u = hash_to_field(msg, 1, opts);
      const u0 = map2(u[0]);
      return clear(u0);
    },
    mapToCurve(scalars) {
      if (defaults.m === 1) {
        if (typeof scalars !== "bigint")
          throw new Error("expected bigint (m=1)");
        return clear(map2([scalars]));
      }
      if (!Array.isArray(scalars))
        throw new Error("expected array of bigints");
      for (const i of scalars)
        if (typeof i !== "bigint")
          throw new Error("expected array of bigints");
      return clear(map2(scalars));
    },
    hashToScalar(msg, options) {
      const N = Point.Fn.ORDER;
      const opts = Object.assign({}, defaults, { p: N, m: 1, DST: _DST_scalar }, options);
      return hash_to_field(msg, 1, opts)[0][0];
    }
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/hmac.js
class _HMAC {
  oHash;
  iHash;
  blockLen;
  outputLen;
  finished = false;
  destroyed = false;
  constructor(hash, key) {
    ahash(hash);
    abytes2(key, undefined, "key");
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i = 0;i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i = 0;i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    abytes2(out, this.outputLen, "output");
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
}
var hmac = (hash, key, message) => new _HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new _HMAC(hash, key);

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/abstract/weierstrass.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var divNearest = (num, den) => (num + (num >= 0 ? den : -den) / _2n2) / den;
function _splitEndoScalar(k, basis, n) {
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n4;
  const k2neg = k2 < _0n4;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
  if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed, k=" + k);
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def) {
  const optsn = {};
  for (let optName of Object.keys(def)) {
    optsn[optName] = opts[optName] === undefined ? def[optName] : opts[optName];
  }
  abool(optsn.lowS, "lowS");
  abool(optsn.prehash, "prehash");
  if (optsn.format !== undefined)
    validateSigFormat(optsn.format);
  return optsn;
}

class DERErr extends Error {
  constructor(m = "") {
    super(m);
  }
}
var DER = {
  Err: DERErr,
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = DER;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t = numberToHexUnpadded(tag);
      return t + lenLen + len + data;
    },
    decode(tag, data) {
      const { Err: E } = DER;
      let pos = 0;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length = 0;
      if (!isLong)
        length = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length = length << 8 | b;
        pos += lenLen;
        if (length < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length);
      if (v.length !== length)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length) };
    }
  },
  _int: {
    encode(num) {
      const { Err: E } = DER;
      if (num < _0n4)
        throw new E("integer: negative integers are not allowed");
      let hex2 = numberToHexUnpadded(num);
      if (Number.parseInt(hex2[0], 16) & 8)
        hex2 = "00" + hex2;
      if (hex2.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex2;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return bytesToNumberBE(data);
    }
  },
  toSig(bytes) {
    const { Err: E, _int: int, _tlv: tlv } = DER;
    const data = abytes2(bytes, undefined, "signature");
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = DER;
    const rs = tlv.encode(2, int.encode(sig.r));
    const ss = tlv.encode(2, int.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
var _0n4 = BigInt(0);
var _1n4 = BigInt(1);
var _2n2 = BigInt(2);
var _3n2 = BigInt(3);
var _4n2 = BigInt(4);
function weierstrass(params, extraOpts = {}) {
  const validated = createCurveFields("weierstrass", params, extraOpts);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER } = CURVE;
  validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object"
  });
  const { endo } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths = getWLengths(Fp, Fn);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes(_c, point, isCompressed) {
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    abool(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes(pprefix(hasEvenY), bx);
    } else {
      return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes) {
    abytes2(bytes, undefined, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    if (length === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const evenY = Fp.isOdd(y);
      const evenH = (head & 1) === 1;
      if (evenH !== evenY)
        y = Fp.neg(y);
      return { x, y };
    } else if (length === uncomp && head === 4) {
      const L = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L));
      const y = Fp.fromBytes(tail.subarray(L, L * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = extraOpts.toBytes || pointToBytes;
  const decodePoint = extraOpts.fromBytes || pointFromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return n;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point))
      throw new Error("Weierstrass Point expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn.ORDER);
  }
  const toAffineMemo = memoized((p, iz) => {
    const { X, Y, Z } = p;
    if (Fp.eql(Z, Fp.ONE))
      return { x: X, y: Y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(Z);
    const x = Fp.mul(X, iz);
    const y = Fp.mul(Y, iz);
    const zz = Fp.mul(Z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (extraOpts.allowInfinityPoint && !Fp.is0(p.Y))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not field elements");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }

  class Point {
    static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    static Fp = Fp;
    static Fn = Fn;
    X;
    Y;
    Z;
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P = Point.fromAffine(decodePoint(abytes2(bytes, undefined, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex2) {
      return Point.fromBytes(hexToBytes(hex2));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n2);
      return this;
    }
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    negate() {
      return new Point(this.X, Fp.neg(this.Y), this.Z);
    }
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let { ZERO: X3, ZERO: Y3, ZERO: Z3 } = Fp;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let { ZERO: X3, ZERO: Y3, ZERO: Z3 } = Fp;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    multiply(scalar) {
      const { endo: endo2 } = extraOpts;
      if (!Fn.isValidNot0(scalar))
        throw new Error("invalid scalar: out of range");
      let point, fake;
      const mul = (n) => wnaf.cached(this, n, (p) => normalizeZ(Point, p));
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p, f } = mul(scalar);
        point = p;
        fake = f;
      }
      return normalizeZ(Point, [point, fake])[0];
    }
    multiplyUnsafe(sc) {
      const { endo: endo2 } = extraOpts;
      const p = this;
      if (!Fn.isValid(sc))
        throw new Error("invalid scalar: out of range");
      if (sc === _0n4 || p.is0())
        return Point.ZERO;
      if (sc === _1n4)
        return p;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2 } = mulEndoUnsafe(Point, p, k1, k2);
        return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p, sc);
      }
    }
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      return wnaf.unsafe(this, CURVE_ORDER).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    toBytes(isCompressed = true) {
      abool(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const bits = Fn.BITS;
  const wnaf = new wNAF(Point, extraOpts.endo ? Math.ceil(bits / 2) : bits);
  Point.BASE.precompute(8);
  return Point;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function SWUFpSqrtRatio(Fp, Z) {
  const q = Fp.ORDER;
  let l = _0n4;
  for (let o = q - _1n4;o % _2n2 === _0n4; o /= _2n2)
    l += _1n4;
  const c1 = l;
  const _2n_pow_c1_1 = _2n2 << c1 - _1n4 - _1n4;
  const _2n_pow_c1 = _2n_pow_c1_1 * _2n2;
  const c2 = (q - _1n4) / _2n_pow_c1;
  const c3 = (c2 - _1n4) / _2n2;
  const c4 = _2n_pow_c1 - _1n4;
  const c5 = _2n_pow_c1_1;
  const c6 = Fp.pow(Z, c2);
  const c7 = Fp.pow(Z, (c2 + _1n4) / _2n2);
  let sqrtRatio = (u, v) => {
    let tv1 = c6;
    let tv2 = Fp.pow(v, c4);
    let tv3 = Fp.sqr(tv2);
    tv3 = Fp.mul(tv3, v);
    let tv5 = Fp.mul(u, tv3);
    tv5 = Fp.pow(tv5, c3);
    tv5 = Fp.mul(tv5, tv2);
    tv2 = Fp.mul(tv5, v);
    tv3 = Fp.mul(tv5, u);
    let tv4 = Fp.mul(tv3, tv2);
    tv5 = Fp.pow(tv4, c5);
    let isQR = Fp.eql(tv5, Fp.ONE);
    tv2 = Fp.mul(tv3, c7);
    tv5 = Fp.mul(tv4, tv1);
    tv3 = Fp.cmov(tv2, tv3, isQR);
    tv4 = Fp.cmov(tv5, tv4, isQR);
    for (let i = c1;i > _1n4; i--) {
      let tv52 = i - _2n2;
      tv52 = _2n2 << tv52 - _1n4;
      let tvv5 = Fp.pow(tv4, tv52);
      const e1 = Fp.eql(tvv5, Fp.ONE);
      tv2 = Fp.mul(tv3, tv1);
      tv1 = Fp.mul(tv1, tv1);
      tvv5 = Fp.mul(tv4, tv1);
      tv3 = Fp.cmov(tv2, tv3, e1);
      tv4 = Fp.cmov(tvv5, tv4, e1);
    }
    return { isValid: isQR, value: tv3 };
  };
  if (Fp.ORDER % _4n2 === _3n2) {
    const c12 = (Fp.ORDER - _3n2) / _4n2;
    const c22 = Fp.sqrt(Fp.neg(Z));
    sqrtRatio = (u, v) => {
      let tv1 = Fp.sqr(v);
      const tv2 = Fp.mul(u, v);
      tv1 = Fp.mul(tv1, tv2);
      let y1 = Fp.pow(tv1, c12);
      y1 = Fp.mul(y1, tv2);
      const y2 = Fp.mul(y1, c22);
      const tv3 = Fp.mul(Fp.sqr(y1), v);
      const isQR = Fp.eql(tv3, u);
      let y = Fp.cmov(y2, y1, isQR);
      return { isValid: isQR, value: y };
    };
  }
  return sqrtRatio;
}
function mapToCurveSimpleSWU(Fp, opts) {
  validateField(Fp);
  const { A, B, Z } = opts;
  if (!Fp.isValid(A) || !Fp.isValid(B) || !Fp.isValid(Z))
    throw new Error("mapToCurveSimpleSWU: invalid opts");
  const sqrtRatio = SWUFpSqrtRatio(Fp, Z);
  if (!Fp.isOdd)
    throw new Error("Field does not have .isOdd()");
  return (u) => {
    let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
    tv1 = Fp.sqr(u);
    tv1 = Fp.mul(tv1, Z);
    tv2 = Fp.sqr(tv1);
    tv2 = Fp.add(tv2, tv1);
    tv3 = Fp.add(tv2, Fp.ONE);
    tv3 = Fp.mul(tv3, B);
    tv4 = Fp.cmov(Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO));
    tv4 = Fp.mul(tv4, A);
    tv2 = Fp.sqr(tv3);
    tv6 = Fp.sqr(tv4);
    tv5 = Fp.mul(tv6, A);
    tv2 = Fp.add(tv2, tv5);
    tv2 = Fp.mul(tv2, tv3);
    tv6 = Fp.mul(tv6, tv4);
    tv5 = Fp.mul(tv6, B);
    tv2 = Fp.add(tv2, tv5);
    x = Fp.mul(tv1, tv3);
    const { isValid, value } = sqrtRatio(tv2, tv6);
    y = Fp.mul(tv1, u);
    y = Fp.mul(y, value);
    x = Fp.cmov(x, tv3, isValid);
    y = Fp.cmov(y, value, isValid);
    const e1 = Fp.isOdd(u) === Fp.isOdd(y);
    y = Fp.cmov(Fp.neg(y), y, e1);
    const tv4_inv = FpInvertBatch(Fp, [tv4], true)[0];
    x = Fp.mul(x, tv4_inv);
    return { x, y };
  };
}
function getWLengths(Fp, Fn) {
  return {
    secretKey: Fn.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * Fn.BYTES
  };
}
function ecdh(Point, ecdhOpts = {}) {
  const { Fn } = Point;
  const randomBytes_ = ecdhOpts.randomBytes || randomBytes;
  const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: getMinHashLength(Fn.ORDER) });
  function isValidSecretKey(secretKey) {
    try {
      const num = Fn.fromBytes(secretKey);
      return Fn.isValidNot0(num);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !!Point.fromBytes(publicKey);
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey(seed = randomBytes_(lengths.seed)) {
    return mapHashToField(abytes2(seed, lengths.seed, "seed"), Fn.ORDER);
  }
  function getPublicKey(secretKey, isCompressed = true) {
    return Point.BASE.multiply(Fn.fromBytes(secretKey)).toBytes(isCompressed);
  }
  function isProbPub(item) {
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    if (!isBytes2(item))
      return;
    if ("_lengths" in Fn && Fn._lengths || secretKey === publicKey)
      return;
    const l = abytes2(item, undefined, "key").length;
    return l === publicKey || l === publicKeyUncompressed;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = Fn.fromBytes(secretKeyA);
    const b = Point.fromBytes(publicKeyB);
    return b.multiply(s).toBytes(isCompressed);
  }
  const utils = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey
  };
  const keygen = createKeygen(randomSecretKey, getPublicKey);
  return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point, utils, lengths });
}
function ecdsa(Point, hash, ecdsaOpts = {}) {
  ahash(hash);
  validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  ecdsaOpts = Object.assign({}, ecdsaOpts);
  const randomBytes2 = ecdsaOpts.randomBytes || randomBytes;
  const hmac2 = ecdsaOpts.hmac || ((key, msg) => hmac(hash, key, msg));
  const { Fp, Fn } = Point;
  const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
  const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, ecdsaOpts);
  const defaultSigOpts = {
    prehash: true,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : true,
    format: "compact",
    extraEntropy: false
  };
  const hasLargeCofactor = CURVE_ORDER * _2n2 < Fp.ORDER;
  function isBiggerThanHalfOrder(number2) {
    const HALF = CURVE_ORDER >> _1n4;
    return number2 > HALF;
  }
  function validateRS(title, num) {
    if (!Fn.isValidNot0(num))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num;
  }
  function assertSmallCofactor() {
    if (hasLargeCofactor)
      throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
  }
  function validateSigLength(bytes, format) {
    validateSigFormat(format);
    const size = lengths.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : undefined;
    return abytes2(bytes, sizer);
  }

  class Signature {
    r;
    s;
    recovery;
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null) {
        assertSmallCofactor();
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("invalid recovery id");
        this.recovery = recovery;
      }
      Object.freeze(this);
    }
    static fromBytes(bytes, format = defaultSigOpts.format) {
      validateSigLength(bytes, format);
      let recid;
      if (format === "der") {
        const { r: r2, s: s2 } = DER.toSig(abytes2(bytes));
        return new Signature(r2, s2);
      }
      if (format === "recovered") {
        recid = bytes[0];
        format = "compact";
        bytes = bytes.subarray(1);
      }
      const L = lengths.signature / 2;
      const r = bytes.subarray(0, L);
      const s = bytes.subarray(L, L * 2);
      return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
    }
    static fromHex(hex2, format) {
      return this.fromBytes(hexToBytes(hex2), format);
    }
    assertRecovery() {
      const { recovery } = this;
      if (recovery == null)
        throw new Error("invalid recovery id: must be present");
      return recovery;
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(messageHash) {
      const { r, s } = this;
      const recovery = this.assertRecovery();
      const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER : r;
      if (!Fp.isValid(radj))
        throw new Error("invalid recovery id: sig.r+curve.n != R.x");
      const x = Fp.toBytes(radj);
      const R = Point.fromBytes(concatBytes(pprefix((recovery & 1) === 0), x));
      const ir = Fn.inv(radj);
      const h = bits2int_modN(abytes2(messageHash, undefined, "msgHash"));
      const u1 = Fn.create(-h * ir);
      const u2 = Fn.create(s * ir);
      const Q = Point.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("invalid recovery: point at infinify");
      Q.assertValidity();
      return Q;
    }
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts.format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes(DER.hexFromSig(this));
      const { r, s } = this;
      const rb = Fn.toBytes(r);
      const sb = Fn.toBytes(s);
      if (format === "recovered") {
        assertSmallCofactor();
        return concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
      }
      return concatBytes(rb, sb);
    }
    toHex(format) {
      return bytesToHex(this.toBytes(format));
    }
  }
  const bits2int = ecdsaOpts.bits2int || function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num >> BigInt(delta) : num;
  };
  const bits2int_modN = ecdsaOpts.bits2int_modN || function bits2int_modN_def(bytes) {
    return Fn.create(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num) {
    aInRange("num < 2^" + fnBits, num, _0n4, ORDER_MASK);
    return Fn.toBytes(num);
  }
  function validateMsgAndHash(message, prehash) {
    abytes2(message, undefined, "message");
    return prehash ? abytes2(hash(message), undefined, "prehashed message") : message;
  }
  function prepSig(message, secretKey, opts) {
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN(message);
    const d = Fn.fromBytes(secretKey);
    if (!Fn.isValidNot0(d))
      throw new Error("invalid private key");
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e = extraEntropy === true ? randomBytes2(lengths.secretKey) : extraEntropy;
      seedArgs.push(abytes2(e, undefined, "extraEntropy"));
    }
    const seed = concatBytes(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn.isValidNot0(k))
        return;
      const ik = Fn.inv(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r = Fn.create(q.x);
      if (r === _0n4)
        return;
      const s = Fn.create(ik * Fn.create(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn.neg(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, hasLargeCofactor ? undefined : recovery);
    }
    return { seed, k2sig };
  }
  function sign(message, secretKey, opts = {}) {
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash.outputLen, Fn.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig.toBytes(opts.format);
  }
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = abytes2(publicKey, undefined, "publicKey");
    message = validateMsgAndHash(message, prehash);
    if (!isBytes2(signature)) {
      const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
      throw new Error("verify expects Uint8Array signature" + end);
    }
    validateSigLength(signature, format);
    try {
      const sig = Signature.fromBytes(signature, format);
      const P = Point.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN(message);
      const is2 = Fn.inv(s);
      const u1 = Fn.create(h * is2);
      const u2 = Fn.create(r * is2);
      const R = Point.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn.create(R.x);
      return v === r;
    } catch (e) {
      return false;
    }
  }
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils,
    lengths,
    Point,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/abstract/bls.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n5 = BigInt(0);
var _1n5 = BigInt(1);
var _2n3 = BigInt(2);
var _3n3 = BigInt(3);
function NAfDecomposition(a) {
  const res = [];
  for (;a > _1n5; a >>= _1n5) {
    if ((a & _1n5) === _0n5)
      res.unshift(0);
    else if ((a & _3n3) === _3n3) {
      res.unshift(-1);
      a += _1n5;
    } else
      res.unshift(1);
  }
  return res;
}
function aNonEmpty(arr) {
  if (!Array.isArray(arr) || arr.length === 0)
    throw new Error("expected non-empty array");
}
function createBlsPairing(fields, G1, G2, params) {
  const { Fr, Fp2, Fp12 } = fields;
  const { twistType, ateLoopSize, xNegative, postPrecompute } = params;
  let lineFunction;
  if (twistType === "multiplicative") {
    lineFunction = (c0, c1, c2, f, Px, Py) => Fp12.mul014(f, c0, Fp2.mul(c1, Px), Fp2.mul(c2, Py));
  } else if (twistType === "divisive") {
    lineFunction = (c0, c1, c2, f, Px, Py) => Fp12.mul034(f, Fp2.mul(c2, Py), Fp2.mul(c1, Px), c0);
  } else
    throw new Error("bls: unknown twist type");
  const Fp2div2 = Fp2.div(Fp2.ONE, Fp2.mul(Fp2.ONE, _2n3));
  function pointDouble(ell, Rx, Ry, Rz) {
    const t0 = Fp2.sqr(Ry);
    const t1 = Fp2.sqr(Rz);
    const t2 = Fp2.mulByB(Fp2.mul(t1, _3n3));
    const t3 = Fp2.mul(t2, _3n3);
    const t4 = Fp2.sub(Fp2.sub(Fp2.sqr(Fp2.add(Ry, Rz)), t1), t0);
    const c0 = Fp2.sub(t2, t0);
    const c1 = Fp2.mul(Fp2.sqr(Rx), _3n3);
    const c2 = Fp2.neg(t4);
    ell.push([c0, c1, c2]);
    Rx = Fp2.mul(Fp2.mul(Fp2.mul(Fp2.sub(t0, t3), Rx), Ry), Fp2div2);
    Ry = Fp2.sub(Fp2.sqr(Fp2.mul(Fp2.add(t0, t3), Fp2div2)), Fp2.mul(Fp2.sqr(t2), _3n3));
    Rz = Fp2.mul(t0, t4);
    return { Rx, Ry, Rz };
  }
  function pointAdd(ell, Rx, Ry, Rz, Qx, Qy) {
    const t0 = Fp2.sub(Ry, Fp2.mul(Qy, Rz));
    const t1 = Fp2.sub(Rx, Fp2.mul(Qx, Rz));
    const c0 = Fp2.sub(Fp2.mul(t0, Qx), Fp2.mul(t1, Qy));
    const c1 = Fp2.neg(t0);
    const c2 = t1;
    ell.push([c0, c1, c2]);
    const t2 = Fp2.sqr(t1);
    const t3 = Fp2.mul(t2, t1);
    const t4 = Fp2.mul(t2, Rx);
    const t5 = Fp2.add(Fp2.sub(t3, Fp2.mul(t4, _2n3)), Fp2.mul(Fp2.sqr(t0), Rz));
    Rx = Fp2.mul(t1, t5);
    Ry = Fp2.sub(Fp2.mul(Fp2.sub(t4, t5), t0), Fp2.mul(t3, Ry));
    Rz = Fp2.mul(Rz, t3);
    return { Rx, Ry, Rz };
  }
  const ATE_NAF = NAfDecomposition(ateLoopSize);
  const calcPairingPrecomputes = memoized((point) => {
    const p = point;
    const { x, y } = p.toAffine();
    const Qx = x, Qy = y, negQy = Fp2.neg(y);
    let Rx = Qx, Ry = Qy, Rz = Fp2.ONE;
    const ell = [];
    for (const bit of ATE_NAF) {
      const cur = [];
      ({ Rx, Ry, Rz } = pointDouble(cur, Rx, Ry, Rz));
      if (bit)
        ({ Rx, Ry, Rz } = pointAdd(cur, Rx, Ry, Rz, Qx, bit === -1 ? negQy : Qy));
      ell.push(cur);
    }
    if (postPrecompute) {
      const last = ell[ell.length - 1];
      postPrecompute(Rx, Ry, Rz, Qx, Qy, pointAdd.bind(null, last));
    }
    return ell;
  });
  function millerLoopBatch(pairs, withFinalExponent = false) {
    let f12 = Fp12.ONE;
    if (pairs.length) {
      const ellLen = pairs[0][0].length;
      for (let i = 0;i < ellLen; i++) {
        f12 = Fp12.sqr(f12);
        for (const [ell, Px, Py] of pairs) {
          for (const [c0, c1, c2] of ell[i])
            f12 = lineFunction(c0, c1, c2, f12, Px, Py);
        }
      }
    }
    if (xNegative)
      f12 = Fp12.conjugate(f12);
    return withFinalExponent ? Fp12.finalExponentiate(f12) : f12;
  }
  function pairingBatch(pairs, withFinalExponent = true) {
    const res = [];
    normalizeZ(G1, pairs.map(({ g1 }) => g1));
    normalizeZ(G2, pairs.map(({ g2 }) => g2));
    for (const { g1, g2 } of pairs) {
      if (g1.is0() || g2.is0())
        throw new Error("pairing is not available for ZERO point");
      g1.assertValidity();
      g2.assertValidity();
      const Qa = g1.toAffine();
      res.push([calcPairingPrecomputes(g2), Qa.x, Qa.y]);
    }
    return millerLoopBatch(res, withFinalExponent);
  }
  function pairing(Q, P, withFinalExponent = true) {
    return pairingBatch([{ g1: Q, g2: P }], withFinalExponent);
  }
  const lengths = {
    seed: getMinHashLength(Fr.ORDER)
  };
  const rand = params.randomBytes || randomBytes;
  const randomSecretKey = (seed = rand(lengths.seed)) => {
    abytes2(seed, lengths.seed, "seed");
    return mapHashToField(seed, Fr.ORDER);
  };
  return {
    lengths,
    Fr,
    Fp12,
    millerLoopBatch,
    pairing,
    pairingBatch,
    calcPairingPrecomputes,
    randomSecretKey
  };
}
function createBlsSig(blsPairing, PubPoint, SigPoint, isSigG1, hashToSigCurve, SignatureCoder) {
  const { Fr, Fp12, pairingBatch, randomSecretKey, lengths } = blsPairing;
  if (!SignatureCoder) {
    SignatureCoder = {
      fromBytes: notImplemented,
      fromHex: notImplemented,
      toBytes: notImplemented,
      toHex: notImplemented
    };
  }
  function normPub(point) {
    return point instanceof PubPoint ? point : PubPoint.fromBytes(point);
  }
  function normSig(point) {
    return point instanceof SigPoint ? point : SigPoint.fromBytes(point);
  }
  function amsg(m) {
    if (!(m instanceof SigPoint))
      throw new Error(`expected valid message hashed to ${!isSigG1 ? "G2" : "G1"} curve`);
    return m;
  }
  const pair = !isSigG1 ? (a, b) => ({ g1: a, g2: b }) : (a, b) => ({ g1: b, g2: a });
  return Object.freeze({
    lengths: { ...lengths, secretKey: Fr.BYTES },
    keygen(seed) {
      const secretKey = randomSecretKey(seed);
      const publicKey = this.getPublicKey(secretKey);
      return { secretKey, publicKey };
    },
    getPublicKey(secretKey) {
      let sec;
      try {
        sec = PubPoint.Fn.fromBytes(secretKey);
      } catch (error) {
        throw new Error("invalid private key: " + typeof secretKey, { cause: error });
      }
      return PubPoint.BASE.multiply(sec);
    },
    sign(message, secretKey, unusedArg) {
      if (unusedArg != null)
        throw new Error("sign() expects 2 arguments");
      const sec = PubPoint.Fn.fromBytes(secretKey);
      amsg(message).assertValidity();
      return message.multiply(sec);
    },
    verify(signature, message, publicKey, unusedArg) {
      if (unusedArg != null)
        throw new Error("verify() expects 3 arguments");
      signature = normSig(signature);
      publicKey = normPub(publicKey);
      const P = publicKey.negate();
      const G = PubPoint.BASE;
      const Hm = amsg(message);
      const S = signature;
      try {
        const exp = pairingBatch([pair(P, Hm), pair(G, S)]);
        return Fp12.eql(exp, Fp12.ONE);
      } catch {
        return false;
      }
    },
    verifyBatch(signature, items) {
      aNonEmpty(items);
      const sig = normSig(signature);
      const nMessages = items.map((i) => i.message);
      const nPublicKeys = items.map((i) => normPub(i.publicKey));
      const messagePubKeyMap = new Map;
      for (let i = 0;i < nPublicKeys.length; i++) {
        const pub = nPublicKeys[i];
        const msg = nMessages[i];
        let keys = messagePubKeyMap.get(msg);
        if (keys === undefined) {
          keys = [];
          messagePubKeyMap.set(msg, keys);
        }
        keys.push(pub);
      }
      const paired = [];
      const G = PubPoint.BASE;
      try {
        for (const [msg, keys] of messagePubKeyMap) {
          const groupPublicKey = keys.reduce((acc, msg2) => acc.add(msg2));
          paired.push(pair(groupPublicKey, msg));
        }
        paired.push(pair(G.negate(), sig));
        return Fp12.eql(pairingBatch(paired), Fp12.ONE);
      } catch {
        return false;
      }
    },
    aggregatePublicKeys(publicKeys) {
      aNonEmpty(publicKeys);
      publicKeys = publicKeys.map((pub) => normPub(pub));
      const agg = publicKeys.reduce((sum, p) => sum.add(p), PubPoint.ZERO);
      agg.assertValidity();
      return agg;
    },
    aggregateSignatures(signatures) {
      aNonEmpty(signatures);
      signatures = signatures.map((sig) => normSig(sig));
      const agg = signatures.reduce((sum, s) => sum.add(s), SigPoint.ZERO);
      agg.assertValidity();
      return agg;
    },
    hash(messageBytes, DST) {
      abytes2(messageBytes);
      const opts = DST ? { DST } : undefined;
      return hashToSigCurve(messageBytes, opts);
    },
    Signature: SignatureCoder
  });
}
function blsBasic(fields, G1_Point, G2_Point, params) {
  const { Fp, Fr, Fp2, Fp6, Fp12 } = fields;
  const G1 = { Point: G1_Point };
  const G2 = { Point: G2_Point };
  const pairingRes = createBlsPairing(fields, G1_Point, G2_Point, params);
  const { millerLoopBatch, pairing, pairingBatch, calcPairingPrecomputes, randomSecretKey, lengths } = pairingRes;
  G1.Point.BASE.precompute(4);
  return Object.freeze({
    lengths,
    millerLoopBatch,
    pairing,
    pairingBatch,
    G1,
    G2,
    fields: { Fr, Fp, Fp2, Fp6, Fp12 },
    params: {
      ateLoopSize: params.ateLoopSize,
      twistType: params.twistType
    },
    utils: {
      randomSecretKey,
      calcPairingPrecomputes
    }
  });
}
function blsHashers(fields, G1_Point, G2_Point, params, hasherParams) {
  const base = blsBasic(fields, G1_Point, G2_Point, params);
  const G1Hasher = createHasher2(G1_Point, hasherParams.mapToG1 || notImplemented, {
    ...hasherParams.hasherOpts,
    ...hasherParams.hasherOptsG1
  });
  const G2Hasher = createHasher2(G2_Point, hasherParams.mapToG2 || notImplemented, {
    ...hasherParams.hasherOpts,
    ...hasherParams.hasherOptsG2
  });
  return Object.freeze({ ...base, G1: G1Hasher, G2: G2Hasher });
}
function bls(fields, G1_Point, G2_Point, params, hasherParams, signatureCoders) {
  const base = blsHashers(fields, G1_Point, G2_Point, params, hasherParams);
  const pairingRes = {
    ...base,
    Fr: base.fields.Fr,
    Fp12: base.fields.Fp12,
    calcPairingPrecomputes: base.utils.calcPairingPrecomputes,
    randomSecretKey: base.utils.randomSecretKey
  };
  const longSignatures = createBlsSig(pairingRes, G1_Point, G2_Point, false, base.G2.hashToCurve, signatureCoders?.LongSignature);
  const shortSignatures = createBlsSig(pairingRes, G2_Point, G1_Point, true, base.G1.hashToCurve, signatureCoders?.ShortSignature);
  return Object.freeze({ ...base, longSignatures, shortSignatures });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/abstract/tower.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n6 = BigInt(0);
var _1n6 = BigInt(1);
var _2n4 = BigInt(2);
var _3n4 = BigInt(3);
function calcFrobeniusCoefficients(Fp, nonResidue, modulus, degree, num = 1, divisor) {
  const _divisor = BigInt(divisor === undefined ? degree : divisor);
  const towerModulus = modulus ** BigInt(degree);
  const res = [];
  for (let i = 0;i < num; i++) {
    const a = BigInt(i + 1);
    const powers2 = [];
    for (let j = 0, qPower = _1n6;j < degree; j++) {
      const power = (a * qPower - a) / _divisor % towerModulus;
      powers2.push(Fp.pow(nonResidue, power));
      qPower *= modulus;
    }
    res.push(powers2);
  }
  return res;
}
function psiFrobenius(Fp, Fp2, base) {
  const PSI_X = Fp2.pow(base, (Fp.ORDER - _1n6) / _3n4);
  const PSI_Y = Fp2.pow(base, (Fp.ORDER - _1n6) / _2n4);
  function psi(x, y) {
    const x2 = Fp2.mul(Fp2.frobeniusMap(x, 1), PSI_X);
    const y2 = Fp2.mul(Fp2.frobeniusMap(y, 1), PSI_Y);
    return [x2, y2];
  }
  const PSI2_X = Fp2.pow(base, (Fp.ORDER ** _2n4 - _1n6) / _3n4);
  const PSI2_Y = Fp2.pow(base, (Fp.ORDER ** _2n4 - _1n6) / _2n4);
  if (!Fp2.eql(PSI2_Y, Fp2.neg(Fp2.ONE)))
    throw new Error("psiFrobenius: PSI2_Y!==-1");
  function psi2(x, y) {
    return [Fp2.mul(x, PSI2_X), Fp2.neg(y)];
  }
  const mapAffine = (fn) => (c, P) => {
    const affine = P.toAffine();
    const p = fn(affine.x, affine.y);
    return c.fromAffine({ x: p[0], y: p[1] });
  };
  const G2psi = mapAffine(psi);
  const G2psi2 = mapAffine(psi2);
  return { psi, psi2, G2psi, G2psi2, PSI_X, PSI_Y, PSI2_X, PSI2_Y };
}
var Fp2fromBigTuple = (Fp, tuple2) => {
  if (tuple2.length !== 2)
    throw new Error("invalid tuple");
  const fps = tuple2.map((n) => Fp.create(n));
  return { c0: fps[0], c1: fps[1] };
};

class _Field2 {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO;
  ONE;
  Fp;
  NONRESIDUE;
  mulByB;
  Fp_NONRESIDUE;
  Fp_div2;
  FROBENIUS_COEFFICIENTS;
  constructor(Fp, opts = {}) {
    const ORDER = Fp.ORDER;
    const FP2_ORDER = ORDER * ORDER;
    this.Fp = Fp;
    this.ORDER = FP2_ORDER;
    this.BITS = bitLen(FP2_ORDER);
    this.BYTES = Math.ceil(bitLen(FP2_ORDER) / 8);
    this.isLE = Fp.isLE;
    this.ZERO = { c0: Fp.ZERO, c1: Fp.ZERO };
    this.ONE = { c0: Fp.ONE, c1: Fp.ZERO };
    this.Fp_NONRESIDUE = Fp.create(opts.NONRESIDUE || BigInt(-1));
    this.Fp_div2 = Fp.div(Fp.ONE, _2n4);
    this.NONRESIDUE = Fp2fromBigTuple(Fp, opts.FP2_NONRESIDUE);
    this.FROBENIUS_COEFFICIENTS = calcFrobeniusCoefficients(Fp, this.Fp_NONRESIDUE, Fp.ORDER, 2)[0];
    this.mulByB = opts.Fp2mulByB;
    Object.seal(this);
  }
  fromBigTuple(tuple2) {
    return Fp2fromBigTuple(this.Fp, tuple2);
  }
  create(num) {
    return num;
  }
  isValid({ c0, c1 }) {
    function isValidC(num, ORDER) {
      return typeof num === "bigint" && _0n6 <= num && num < ORDER;
    }
    return isValidC(c0, this.ORDER) && isValidC(c1, this.ORDER);
  }
  is0({ c0, c1 }) {
    return this.Fp.is0(c0) && this.Fp.is0(c1);
  }
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  eql({ c0, c1 }, { c0: r0, c1: r1 }) {
    return this.Fp.eql(c0, r0) && this.Fp.eql(c1, r1);
  }
  neg({ c0, c1 }) {
    return { c0: this.Fp.neg(c0), c1: this.Fp.neg(c1) };
  }
  pow(num, power) {
    return FpPow(this, num, power);
  }
  invertBatch(nums) {
    return FpInvertBatch(this, nums);
  }
  add(f1, f2) {
    const { c0, c1 } = f1;
    const { c0: r0, c1: r1 } = f2;
    return {
      c0: this.Fp.add(c0, r0),
      c1: this.Fp.add(c1, r1)
    };
  }
  sub({ c0, c1 }, { c0: r0, c1: r1 }) {
    return {
      c0: this.Fp.sub(c0, r0),
      c1: this.Fp.sub(c1, r1)
    };
  }
  mul({ c0, c1 }, rhs) {
    const { Fp } = this;
    if (typeof rhs === "bigint")
      return { c0: Fp.mul(c0, rhs), c1: Fp.mul(c1, rhs) };
    const { c0: r0, c1: r1 } = rhs;
    let t1 = Fp.mul(c0, r0);
    let t2 = Fp.mul(c1, r1);
    const o0 = Fp.sub(t1, t2);
    const o1 = Fp.sub(Fp.mul(Fp.add(c0, c1), Fp.add(r0, r1)), Fp.add(t1, t2));
    return { c0: o0, c1: o1 };
  }
  sqr({ c0, c1 }) {
    const { Fp } = this;
    const a = Fp.add(c0, c1);
    const b = Fp.sub(c0, c1);
    const c = Fp.add(c0, c0);
    return { c0: Fp.mul(a, b), c1: Fp.mul(c, c1) };
  }
  addN(a, b) {
    return this.add(a, b);
  }
  subN(a, b) {
    return this.sub(a, b);
  }
  mulN(a, b) {
    return this.mul(a, b);
  }
  sqrN(a) {
    return this.sqr(a);
  }
  div(lhs, rhs) {
    const { Fp } = this;
    return this.mul(lhs, typeof rhs === "bigint" ? Fp.inv(Fp.create(rhs)) : this.inv(rhs));
  }
  inv({ c0: a, c1: b }) {
    const { Fp } = this;
    const factor = Fp.inv(Fp.create(a * a + b * b));
    return { c0: Fp.mul(factor, Fp.create(a)), c1: Fp.mul(factor, Fp.create(-b)) };
  }
  sqrt(num) {
    const { Fp } = this;
    const Fp2 = this;
    const { c0, c1 } = num;
    if (Fp.is0(c1)) {
      if (FpLegendre(Fp, c0) === 1)
        return Fp2.create({ c0: Fp.sqrt(c0), c1: Fp.ZERO });
      else
        return Fp2.create({ c0: Fp.ZERO, c1: Fp.sqrt(Fp.div(c0, this.Fp_NONRESIDUE)) });
    }
    const a = Fp.sqrt(Fp.sub(Fp.sqr(c0), Fp.mul(Fp.sqr(c1), this.Fp_NONRESIDUE)));
    let d = Fp.mul(Fp.add(a, c0), this.Fp_div2);
    const legendre = FpLegendre(Fp, d);
    if (legendre === -1)
      d = Fp.sub(d, a);
    const a0 = Fp.sqrt(d);
    const candidateSqrt = Fp2.create({ c0: a0, c1: Fp.div(Fp.mul(c1, this.Fp_div2), a0) });
    if (!Fp2.eql(Fp2.sqr(candidateSqrt), num))
      throw new Error("Cannot find square root");
    const x1 = candidateSqrt;
    const x2 = Fp2.neg(x1);
    const { re: re1, im: im1 } = Fp2.reim(x1);
    const { re: re2, im: im2 } = Fp2.reim(x2);
    if (im1 > im2 || im1 === im2 && re1 > re2)
      return x1;
    return x2;
  }
  isOdd(x) {
    const { re: x0, im: x1 } = this.reim(x);
    const sign_0 = x0 % _2n4;
    const zero_0 = x0 === _0n6;
    const sign_1 = x1 % _2n4;
    return BigInt(sign_0 || zero_0 && sign_1) == _1n6;
  }
  fromBytes(b) {
    const { Fp } = this;
    if (b.length !== this.BYTES)
      throw new Error("fromBytes invalid length=" + b.length);
    return { c0: Fp.fromBytes(b.subarray(0, Fp.BYTES)), c1: Fp.fromBytes(b.subarray(Fp.BYTES)) };
  }
  toBytes({ c0, c1 }) {
    return concatBytes(this.Fp.toBytes(c0), this.Fp.toBytes(c1));
  }
  cmov({ c0, c1 }, { c0: r0, c1: r1 }, c) {
    return {
      c0: this.Fp.cmov(c0, r0, c),
      c1: this.Fp.cmov(c1, r1, c)
    };
  }
  reim({ c0, c1 }) {
    return { re: c0, im: c1 };
  }
  Fp4Square(a, b) {
    const Fp2 = this;
    const a2 = Fp2.sqr(a);
    const b2 = Fp2.sqr(b);
    return {
      first: Fp2.add(Fp2.mulByNonresidue(b2), a2),
      second: Fp2.sub(Fp2.sub(Fp2.sqr(Fp2.add(a, b)), a2), b2)
    };
  }
  mulByNonresidue({ c0, c1 }) {
    return this.mul({ c0, c1 }, this.NONRESIDUE);
  }
  frobeniusMap({ c0, c1 }, power) {
    return {
      c0,
      c1: this.Fp.mul(c1, this.FROBENIUS_COEFFICIENTS[power % 2])
    };
  }
}

class _Field6 {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO;
  ONE;
  Fp2;
  FROBENIUS_COEFFICIENTS_1;
  FROBENIUS_COEFFICIENTS_2;
  constructor(Fp2) {
    this.Fp2 = Fp2;
    this.ORDER = Fp2.ORDER;
    this.BITS = 3 * Fp2.BITS;
    this.BYTES = 3 * Fp2.BYTES;
    this.isLE = Fp2.isLE;
    this.ZERO = { c0: Fp2.ZERO, c1: Fp2.ZERO, c2: Fp2.ZERO };
    this.ONE = { c0: Fp2.ONE, c1: Fp2.ZERO, c2: Fp2.ZERO };
    const { Fp } = Fp2;
    const frob = calcFrobeniusCoefficients(Fp2, Fp2.NONRESIDUE, Fp.ORDER, 6, 2, 3);
    this.FROBENIUS_COEFFICIENTS_1 = frob[0];
    this.FROBENIUS_COEFFICIENTS_2 = frob[1];
    Object.seal(this);
  }
  add({ c0, c1, c2 }, { c0: r0, c1: r1, c2: r2 }) {
    const { Fp2 } = this;
    return {
      c0: Fp2.add(c0, r0),
      c1: Fp2.add(c1, r1),
      c2: Fp2.add(c2, r2)
    };
  }
  sub({ c0, c1, c2 }, { c0: r0, c1: r1, c2: r2 }) {
    const { Fp2 } = this;
    return {
      c0: Fp2.sub(c0, r0),
      c1: Fp2.sub(c1, r1),
      c2: Fp2.sub(c2, r2)
    };
  }
  mul({ c0, c1, c2 }, rhs) {
    const { Fp2 } = this;
    if (typeof rhs === "bigint") {
      return {
        c0: Fp2.mul(c0, rhs),
        c1: Fp2.mul(c1, rhs),
        c2: Fp2.mul(c2, rhs)
      };
    }
    const { c0: r0, c1: r1, c2: r2 } = rhs;
    const t0 = Fp2.mul(c0, r0);
    const t1 = Fp2.mul(c1, r1);
    const t2 = Fp2.mul(c2, r2);
    return {
      c0: Fp2.add(t0, Fp2.mulByNonresidue(Fp2.sub(Fp2.mul(Fp2.add(c1, c2), Fp2.add(r1, r2)), Fp2.add(t1, t2)))),
      c1: Fp2.add(Fp2.sub(Fp2.mul(Fp2.add(c0, c1), Fp2.add(r0, r1)), Fp2.add(t0, t1)), Fp2.mulByNonresidue(t2)),
      c2: Fp2.sub(Fp2.add(t1, Fp2.mul(Fp2.add(c0, c2), Fp2.add(r0, r2))), Fp2.add(t0, t2))
    };
  }
  sqr({ c0, c1, c2 }) {
    const { Fp2 } = this;
    let t0 = Fp2.sqr(c0);
    let t1 = Fp2.mul(Fp2.mul(c0, c1), _2n4);
    let t3 = Fp2.mul(Fp2.mul(c1, c2), _2n4);
    let t4 = Fp2.sqr(c2);
    return {
      c0: Fp2.add(Fp2.mulByNonresidue(t3), t0),
      c1: Fp2.add(Fp2.mulByNonresidue(t4), t1),
      c2: Fp2.sub(Fp2.sub(Fp2.add(Fp2.add(t1, Fp2.sqr(Fp2.add(Fp2.sub(c0, c1), c2))), t3), t0), t4)
    };
  }
  addN(a, b) {
    return this.add(a, b);
  }
  subN(a, b) {
    return this.sub(a, b);
  }
  mulN(a, b) {
    return this.mul(a, b);
  }
  sqrN(a) {
    return this.sqr(a);
  }
  create(num) {
    return num;
  }
  isValid({ c0, c1, c2 }) {
    const { Fp2 } = this;
    return Fp2.isValid(c0) && Fp2.isValid(c1) && Fp2.isValid(c2);
  }
  is0({ c0, c1, c2 }) {
    const { Fp2 } = this;
    return Fp2.is0(c0) && Fp2.is0(c1) && Fp2.is0(c2);
  }
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  neg({ c0, c1, c2 }) {
    const { Fp2 } = this;
    return { c0: Fp2.neg(c0), c1: Fp2.neg(c1), c2: Fp2.neg(c2) };
  }
  eql({ c0, c1, c2 }, { c0: r0, c1: r1, c2: r2 }) {
    const { Fp2 } = this;
    return Fp2.eql(c0, r0) && Fp2.eql(c1, r1) && Fp2.eql(c2, r2);
  }
  sqrt(_) {
    return notImplemented();
  }
  div(lhs, rhs) {
    const { Fp2 } = this;
    const { Fp } = Fp2;
    return this.mul(lhs, typeof rhs === "bigint" ? Fp.inv(Fp.create(rhs)) : this.inv(rhs));
  }
  pow(num, power) {
    return FpPow(this, num, power);
  }
  invertBatch(nums) {
    return FpInvertBatch(this, nums);
  }
  inv({ c0, c1, c2 }) {
    const { Fp2 } = this;
    let t0 = Fp2.sub(Fp2.sqr(c0), Fp2.mulByNonresidue(Fp2.mul(c2, c1)));
    let t1 = Fp2.sub(Fp2.mulByNonresidue(Fp2.sqr(c2)), Fp2.mul(c0, c1));
    let t2 = Fp2.sub(Fp2.sqr(c1), Fp2.mul(c0, c2));
    let t4 = Fp2.inv(Fp2.add(Fp2.mulByNonresidue(Fp2.add(Fp2.mul(c2, t1), Fp2.mul(c1, t2))), Fp2.mul(c0, t0)));
    return { c0: Fp2.mul(t4, t0), c1: Fp2.mul(t4, t1), c2: Fp2.mul(t4, t2) };
  }
  fromBytes(b) {
    const { Fp2 } = this;
    if (b.length !== this.BYTES)
      throw new Error("fromBytes invalid length=" + b.length);
    const B2 = Fp2.BYTES;
    return {
      c0: Fp2.fromBytes(b.subarray(0, B2)),
      c1: Fp2.fromBytes(b.subarray(B2, B2 * 2)),
      c2: Fp2.fromBytes(b.subarray(2 * B2))
    };
  }
  toBytes({ c0, c1, c2 }) {
    const { Fp2 } = this;
    return concatBytes(Fp2.toBytes(c0), Fp2.toBytes(c1), Fp2.toBytes(c2));
  }
  cmov({ c0, c1, c2 }, { c0: r0, c1: r1, c2: r2 }, c) {
    const { Fp2 } = this;
    return {
      c0: Fp2.cmov(c0, r0, c),
      c1: Fp2.cmov(c1, r1, c),
      c2: Fp2.cmov(c2, r2, c)
    };
  }
  fromBigSix(t) {
    const { Fp2 } = this;
    if (!Array.isArray(t) || t.length !== 6)
      throw new Error("invalid Fp6 usage");
    return {
      c0: Fp2.fromBigTuple(t.slice(0, 2)),
      c1: Fp2.fromBigTuple(t.slice(2, 4)),
      c2: Fp2.fromBigTuple(t.slice(4, 6))
    };
  }
  frobeniusMap({ c0, c1, c2 }, power) {
    const { Fp2 } = this;
    return {
      c0: Fp2.frobeniusMap(c0, power),
      c1: Fp2.mul(Fp2.frobeniusMap(c1, power), this.FROBENIUS_COEFFICIENTS_1[power % 6]),
      c2: Fp2.mul(Fp2.frobeniusMap(c2, power), this.FROBENIUS_COEFFICIENTS_2[power % 6])
    };
  }
  mulByFp2({ c0, c1, c2 }, rhs) {
    const { Fp2 } = this;
    return {
      c0: Fp2.mul(c0, rhs),
      c1: Fp2.mul(c1, rhs),
      c2: Fp2.mul(c2, rhs)
    };
  }
  mulByNonresidue({ c0, c1, c2 }) {
    const { Fp2 } = this;
    return { c0: Fp2.mulByNonresidue(c2), c1: c0, c2: c1 };
  }
  mul1({ c0, c1, c2 }, b1) {
    const { Fp2 } = this;
    return {
      c0: Fp2.mulByNonresidue(Fp2.mul(c2, b1)),
      c1: Fp2.mul(c0, b1),
      c2: Fp2.mul(c1, b1)
    };
  }
  mul01({ c0, c1, c2 }, b0, b1) {
    const { Fp2 } = this;
    let t0 = Fp2.mul(c0, b0);
    let t1 = Fp2.mul(c1, b1);
    return {
      c0: Fp2.add(Fp2.mulByNonresidue(Fp2.sub(Fp2.mul(Fp2.add(c1, c2), b1), t1)), t0),
      c1: Fp2.sub(Fp2.sub(Fp2.mul(Fp2.add(b0, b1), Fp2.add(c0, c1)), t0), t1),
      c2: Fp2.add(Fp2.sub(Fp2.mul(Fp2.add(c0, c2), b0), t0), t1)
    };
  }
}

class _Field12 {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO;
  ONE;
  Fp6;
  FROBENIUS_COEFFICIENTS;
  X_LEN;
  finalExponentiate;
  constructor(Fp6, opts) {
    const { Fp2 } = Fp6;
    const { Fp } = Fp2;
    this.Fp6 = Fp6;
    this.ORDER = Fp2.ORDER;
    this.BITS = 2 * Fp6.BITS;
    this.BYTES = 2 * Fp6.BYTES;
    this.isLE = Fp6.isLE;
    this.ZERO = { c0: Fp6.ZERO, c1: Fp6.ZERO };
    this.ONE = { c0: Fp6.ONE, c1: Fp6.ZERO };
    this.FROBENIUS_COEFFICIENTS = calcFrobeniusCoefficients(Fp2, Fp2.NONRESIDUE, Fp.ORDER, 12, 1, 6)[0];
    this.X_LEN = opts.X_LEN;
    this.finalExponentiate = opts.Fp12finalExponentiate;
  }
  create(num) {
    return num;
  }
  isValid({ c0, c1 }) {
    const { Fp6 } = this;
    return Fp6.isValid(c0) && Fp6.isValid(c1);
  }
  is0({ c0, c1 }) {
    const { Fp6 } = this;
    return Fp6.is0(c0) && Fp6.is0(c1);
  }
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  neg({ c0, c1 }) {
    const { Fp6 } = this;
    return { c0: Fp6.neg(c0), c1: Fp6.neg(c1) };
  }
  eql({ c0, c1 }, { c0: r0, c1: r1 }) {
    const { Fp6 } = this;
    return Fp6.eql(c0, r0) && Fp6.eql(c1, r1);
  }
  sqrt(_) {
    notImplemented();
  }
  inv({ c0, c1 }) {
    const { Fp6 } = this;
    let t = Fp6.inv(Fp6.sub(Fp6.sqr(c0), Fp6.mulByNonresidue(Fp6.sqr(c1))));
    return { c0: Fp6.mul(c0, t), c1: Fp6.neg(Fp6.mul(c1, t)) };
  }
  div(lhs, rhs) {
    const { Fp6 } = this;
    const { Fp2 } = Fp6;
    const { Fp } = Fp2;
    return this.mul(lhs, typeof rhs === "bigint" ? Fp.inv(Fp.create(rhs)) : this.inv(rhs));
  }
  pow(num, power) {
    return FpPow(this, num, power);
  }
  invertBatch(nums) {
    return FpInvertBatch(this, nums);
  }
  add({ c0, c1 }, { c0: r0, c1: r1 }) {
    const { Fp6 } = this;
    return {
      c0: Fp6.add(c0, r0),
      c1: Fp6.add(c1, r1)
    };
  }
  sub({ c0, c1 }, { c0: r0, c1: r1 }) {
    const { Fp6 } = this;
    return {
      c0: Fp6.sub(c0, r0),
      c1: Fp6.sub(c1, r1)
    };
  }
  mul({ c0, c1 }, rhs) {
    const { Fp6 } = this;
    if (typeof rhs === "bigint")
      return { c0: Fp6.mul(c0, rhs), c1: Fp6.mul(c1, rhs) };
    let { c0: r0, c1: r1 } = rhs;
    let t1 = Fp6.mul(c0, r0);
    let t2 = Fp6.mul(c1, r1);
    return {
      c0: Fp6.add(t1, Fp6.mulByNonresidue(t2)),
      c1: Fp6.sub(Fp6.mul(Fp6.add(c0, c1), Fp6.add(r0, r1)), Fp6.add(t1, t2))
    };
  }
  sqr({ c0, c1 }) {
    const { Fp6 } = this;
    let ab = Fp6.mul(c0, c1);
    return {
      c0: Fp6.sub(Fp6.sub(Fp6.mul(Fp6.add(Fp6.mulByNonresidue(c1), c0), Fp6.add(c0, c1)), ab), Fp6.mulByNonresidue(ab)),
      c1: Fp6.add(ab, ab)
    };
  }
  addN(a, b) {
    return this.add(a, b);
  }
  subN(a, b) {
    return this.sub(a, b);
  }
  mulN(a, b) {
    return this.mul(a, b);
  }
  sqrN(a) {
    return this.sqr(a);
  }
  fromBytes(b) {
    const { Fp6 } = this;
    if (b.length !== this.BYTES)
      throw new Error("fromBytes invalid length=" + b.length);
    return {
      c0: Fp6.fromBytes(b.subarray(0, Fp6.BYTES)),
      c1: Fp6.fromBytes(b.subarray(Fp6.BYTES))
    };
  }
  toBytes({ c0, c1 }) {
    const { Fp6 } = this;
    return concatBytes(Fp6.toBytes(c0), Fp6.toBytes(c1));
  }
  cmov({ c0, c1 }, { c0: r0, c1: r1 }, c) {
    const { Fp6 } = this;
    return {
      c0: Fp6.cmov(c0, r0, c),
      c1: Fp6.cmov(c1, r1, c)
    };
  }
  fromBigTwelve(t) {
    const { Fp6 } = this;
    return {
      c0: Fp6.fromBigSix(t.slice(0, 6)),
      c1: Fp6.fromBigSix(t.slice(6, 12))
    };
  }
  frobeniusMap(lhs, power) {
    const { Fp6 } = this;
    const { Fp2 } = Fp6;
    const { c0, c1, c2 } = Fp6.frobeniusMap(lhs.c1, power);
    const coeff = this.FROBENIUS_COEFFICIENTS[power % 12];
    return {
      c0: Fp6.frobeniusMap(lhs.c0, power),
      c1: Fp6.create({
        c0: Fp2.mul(c0, coeff),
        c1: Fp2.mul(c1, coeff),
        c2: Fp2.mul(c2, coeff)
      })
    };
  }
  mulByFp2({ c0, c1 }, rhs) {
    const { Fp6 } = this;
    return {
      c0: Fp6.mulByFp2(c0, rhs),
      c1: Fp6.mulByFp2(c1, rhs)
    };
  }
  conjugate({ c0, c1 }) {
    return { c0, c1: this.Fp6.neg(c1) };
  }
  mul014({ c0, c1 }, o0, o1, o4) {
    const { Fp6 } = this;
    const { Fp2 } = Fp6;
    let t0 = Fp6.mul01(c0, o0, o1);
    let t1 = Fp6.mul1(c1, o4);
    return {
      c0: Fp6.add(Fp6.mulByNonresidue(t1), t0),
      c1: Fp6.sub(Fp6.sub(Fp6.mul01(Fp6.add(c1, c0), o0, Fp2.add(o1, o4)), t0), t1)
    };
  }
  mul034({ c0, c1 }, o0, o3, o4) {
    const { Fp6 } = this;
    const { Fp2 } = Fp6;
    const a = Fp6.create({
      c0: Fp2.mul(c0.c0, o0),
      c1: Fp2.mul(c0.c1, o0),
      c2: Fp2.mul(c0.c2, o0)
    });
    const b = Fp6.mul01(c1, o3, o4);
    const e = Fp6.mul01(Fp6.add(c0, c1), Fp2.add(o0, o3), o4);
    return {
      c0: Fp6.add(Fp6.mulByNonresidue(b), a),
      c1: Fp6.sub(e, Fp6.add(a, b))
    };
  }
  _cyclotomicSquare({ c0, c1 }) {
    const { Fp6 } = this;
    const { Fp2 } = Fp6;
    const { c0: c0c0, c1: c0c1, c2: c0c2 } = c0;
    const { c0: c1c0, c1: c1c1, c2: c1c2 } = c1;
    const { first: t3, second: t4 } = Fp2.Fp4Square(c0c0, c1c1);
    const { first: t5, second: t6 } = Fp2.Fp4Square(c1c0, c0c2);
    const { first: t7, second: t8 } = Fp2.Fp4Square(c0c1, c1c2);
    const t9 = Fp2.mulByNonresidue(t8);
    return {
      c0: Fp6.create({
        c0: Fp2.add(Fp2.mul(Fp2.sub(t3, c0c0), _2n4), t3),
        c1: Fp2.add(Fp2.mul(Fp2.sub(t5, c0c1), _2n4), t5),
        c2: Fp2.add(Fp2.mul(Fp2.sub(t7, c0c2), _2n4), t7)
      }),
      c1: Fp6.create({
        c0: Fp2.add(Fp2.mul(Fp2.add(t9, c1c0), _2n4), t9),
        c1: Fp2.add(Fp2.mul(Fp2.add(t4, c1c1), _2n4), t4),
        c2: Fp2.add(Fp2.mul(Fp2.add(t6, c1c2), _2n4), t6)
      })
    };
  }
  _cyclotomicExp(num, n) {
    let z = this.ONE;
    for (let i = this.X_LEN - 1;i >= 0; i--) {
      z = this._cyclotomicSquare(z);
      if (bitGet(n, i))
        z = this.mul(z, num);
    }
    return z;
  }
}
function tower12(opts) {
  const Fp = Field(opts.ORDER);
  const Fp2 = new _Field2(Fp, opts);
  const Fp6 = new _Field6(Fp2);
  const Fp12 = new _Field12(Fp6, opts);
  return { Fp, Fp2, Fp6, Fp12 };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/bls12-381.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n7 = BigInt(0);
var _1n7 = BigInt(1);
var _2n5 = BigInt(2);
var _3n5 = BigInt(3);
var _4n3 = BigInt(4);
var BLS_X = BigInt("0xd201000000010000");
var BLS_X_LEN = bitLen(BLS_X);
var bls12_381_CURVE_G1 = {
  p: BigInt("0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab"),
  n: BigInt("0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001"),
  h: BigInt("0x396c8c005555e1568c00aaab0000aaab"),
  a: _0n7,
  b: _4n3,
  Gx: BigInt("0x17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb"),
  Gy: BigInt("0x08b3f481e3aaa0f1a09e30ed741d8ae4fcf5e095d5d00af600db18cb2c04b3edd03cc744a2888ae40caa232946c5e7e1")
};
var bls12_381_Fr = Field(bls12_381_CURVE_G1.n, {
  modFromBytes: true
});
var { Fp, Fp2, Fp6, Fp12 } = tower12({
  ORDER: bls12_381_CURVE_G1.p,
  X_LEN: BLS_X_LEN,
  FP2_NONRESIDUE: [_1n7, _1n7],
  Fp2mulByB: ({ c0, c1 }) => {
    const t0 = Fp.mul(c0, _4n3);
    const t1 = Fp.mul(c1, _4n3);
    return { c0: Fp.sub(t0, t1), c1: Fp.add(t0, t1) };
  },
  Fp12finalExponentiate: (num) => {
    const x = BLS_X;
    const t0 = Fp12.div(Fp12.frobeniusMap(num, 6), num);
    const t1 = Fp12.mul(Fp12.frobeniusMap(t0, 2), t0);
    const t2 = Fp12.conjugate(Fp12._cyclotomicExp(t1, x));
    const t3 = Fp12.mul(Fp12.conjugate(Fp12._cyclotomicSquare(t1)), t2);
    const t4 = Fp12.conjugate(Fp12._cyclotomicExp(t3, x));
    const t5 = Fp12.conjugate(Fp12._cyclotomicExp(t4, x));
    const t6 = Fp12.mul(Fp12.conjugate(Fp12._cyclotomicExp(t5, x)), Fp12._cyclotomicSquare(t2));
    const t7 = Fp12.conjugate(Fp12._cyclotomicExp(t6, x));
    const t2_t5_pow_q2 = Fp12.frobeniusMap(Fp12.mul(t2, t5), 2);
    const t4_t1_pow_q3 = Fp12.frobeniusMap(Fp12.mul(t4, t1), 3);
    const t6_t1c_pow_q1 = Fp12.frobeniusMap(Fp12.mul(t6, Fp12.conjugate(t1)), 1);
    const t7_t3c_t1 = Fp12.mul(Fp12.mul(t7, Fp12.conjugate(t3)), t1);
    return Fp12.mul(Fp12.mul(Fp12.mul(t2_t5_pow_q2, t4_t1_pow_q3), t6_t1c_pow_q1), t7_t3c_t1);
  }
});
var { G2psi, G2psi2 } = psiFrobenius(Fp, Fp2, Fp2.div(Fp2.ONE, Fp2.NONRESIDUE));
var hasher_opts = Object.freeze({
  DST: "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_",
  encodeDST: "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_",
  p: Fp.ORDER,
  m: 2,
  k: 128,
  expand: "xmd",
  hash: sha256
});
var bls12_381_CURVE_G2 = {
  p: Fp2.ORDER,
  n: bls12_381_CURVE_G1.n,
  h: BigInt("0x5d543a95414e7f1091d50792876a202cd91de4547085abaa68a205b2e5a7ddfa628f1cb4d9e82ef21537e293a6691ae1616ec6e786f0c70cf1c38e31c7238e5"),
  a: Fp2.ZERO,
  b: Fp2.fromBigTuple([_4n3, _4n3]),
  Gx: Fp2.fromBigTuple([
    BigInt("0x024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8"),
    BigInt("0x13e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e")
  ]),
  Gy: Fp2.fromBigTuple([
    BigInt("0x0ce5d527727d6e118cc9cdc6da2e351aadfd9baa8cbdd3a76d429a695160d12c923ac9cc3baca289e193548608b82801"),
    BigInt("0x0606c4a02ea734cc32acd2b02bc28b99cb3e287e85a763af267492ab572e99ab3f370d275cec1da1aaa9075ff05f79be")
  ])
};
var COMPZERO = setMask(Fp.toBytes(_0n7), { infinity: true, compressed: true });
function parseMask(bytes) {
  bytes = copyBytes(bytes);
  const mask = bytes[0] & 224;
  const compressed = !!(mask >> 7 & 1);
  const infinity = !!(mask >> 6 & 1);
  const sort = !!(mask >> 5 & 1);
  bytes[0] &= 31;
  return { compressed, infinity, sort, value: bytes };
}
function setMask(bytes, mask) {
  if (bytes[0] & 224)
    throw new Error("setMask: non-empty mask");
  if (mask.compressed)
    bytes[0] |= 128;
  if (mask.infinity)
    bytes[0] |= 64;
  if (mask.sort)
    bytes[0] |= 32;
  return bytes;
}
function pointG1ToBytes(_c, point, isComp) {
  const { BYTES: L, ORDER: P } = Fp;
  const is0 = point.is0();
  const { x, y } = point.toAffine();
  if (isComp) {
    if (is0)
      return COMPZERO.slice();
    const sort = Boolean(y * _2n5 / P);
    return setMask(numberToBytesBE(x, L), { compressed: true, sort });
  } else {
    if (is0) {
      return concatBytes(Uint8Array.of(64), new Uint8Array(2 * L - 1));
    } else {
      return concatBytes(numberToBytesBE(x, L), numberToBytesBE(y, L));
    }
  }
}
function signatureG1ToBytes(point) {
  point.assertValidity();
  const { BYTES: L, ORDER: P } = Fp;
  const { x, y } = point.toAffine();
  if (point.is0())
    return COMPZERO.slice();
  const sort = Boolean(y * _2n5 / P);
  return setMask(numberToBytesBE(x, L), { compressed: true, sort });
}
function pointG1FromBytes(bytes) {
  const { compressed, infinity, sort, value } = parseMask(bytes);
  const { BYTES: L, ORDER: P } = Fp;
  if (value.length === 48 && compressed) {
    const compressedValue = bytesToNumberBE(value);
    const x = Fp.create(compressedValue & bitMask(Fp.BITS));
    if (infinity) {
      if (x !== _0n7)
        throw new Error("invalid G1 point: non-empty, at infinity, with compression");
      return { x: _0n7, y: _0n7 };
    }
    const right = Fp.add(Fp.pow(x, _3n5), Fp.create(bls12_381_CURVE_G1.b));
    let y = Fp.sqrt(right);
    if (!y)
      throw new Error("invalid G1 point: compressed point");
    if (y * _2n5 / P !== BigInt(sort))
      y = Fp.neg(y);
    return { x: Fp.create(x), y: Fp.create(y) };
  } else if (value.length === 96 && !compressed) {
    const x = bytesToNumberBE(value.subarray(0, L));
    const y = bytesToNumberBE(value.subarray(L));
    if (infinity) {
      if (x !== _0n7 || y !== _0n7)
        throw new Error("G1: non-empty point at infinity");
      return bls12_381.G1.Point.ZERO.toAffine();
    }
    return { x: Fp.create(x), y: Fp.create(y) };
  } else {
    throw new Error("invalid G1 point: expected 48/96 bytes");
  }
}
function signatureG1FromBytes(bytes) {
  const { infinity, sort, value } = parseMask(abytes2(bytes, 48, "signature"));
  const P = Fp.ORDER;
  const Point = bls12_381.G1.Point;
  const compressedValue = bytesToNumberBE(value);
  if (infinity)
    return Point.ZERO;
  const x = Fp.create(compressedValue & bitMask(Fp.BITS));
  const right = Fp.add(Fp.pow(x, _3n5), Fp.create(bls12_381_CURVE_G1.b));
  let y = Fp.sqrt(right);
  if (!y)
    throw new Error("invalid G1 point: compressed");
  const aflag = BigInt(sort);
  if (y * _2n5 / P !== aflag)
    y = Fp.neg(y);
  const point = Point.fromAffine({ x, y });
  point.assertValidity();
  return point;
}
function pointG2ToBytes(_c, point, isComp) {
  const { BYTES: L, ORDER: P } = Fp;
  const is0 = point.is0();
  const { x, y } = point.toAffine();
  if (isComp) {
    if (is0)
      return concatBytes(COMPZERO, numberToBytesBE(_0n7, L));
    const flag = Boolean(y.c1 === _0n7 ? y.c0 * _2n5 / P : y.c1 * _2n5 / P);
    return concatBytes(setMask(numberToBytesBE(x.c1, L), { compressed: true, sort: flag }), numberToBytesBE(x.c0, L));
  } else {
    if (is0)
      return concatBytes(Uint8Array.of(64), new Uint8Array(4 * L - 1));
    const { re: x0, im: x1 } = Fp2.reim(x);
    const { re: y0, im: y1 } = Fp2.reim(y);
    return concatBytes(numberToBytesBE(x1, L), numberToBytesBE(x0, L), numberToBytesBE(y1, L), numberToBytesBE(y0, L));
  }
}
function signatureG2ToBytes(point) {
  point.assertValidity();
  const { BYTES: L } = Fp;
  if (point.is0())
    return concatBytes(COMPZERO, numberToBytesBE(_0n7, L));
  const { x, y } = point.toAffine();
  const { re: x0, im: x1 } = Fp2.reim(x);
  const { re: y0, im: y1 } = Fp2.reim(y);
  const tmp = y1 > _0n7 ? y1 * _2n5 : y0 * _2n5;
  const sort = Boolean(tmp / Fp.ORDER & _1n7);
  const z2 = x0;
  return concatBytes(setMask(numberToBytesBE(x1, L), { sort, compressed: true }), numberToBytesBE(z2, L));
}
function pointG2FromBytes(bytes) {
  const { BYTES: L, ORDER: P } = Fp;
  const { compressed, infinity, sort, value } = parseMask(bytes);
  if (!compressed && !infinity && sort || !compressed && infinity && sort || sort && infinity && compressed) {
    throw new Error("invalid encoding flag: " + (bytes[0] & 224));
  }
  const slc = (b, from, to) => bytesToNumberBE(b.slice(from, to));
  if (value.length === 96 && compressed) {
    if (infinity) {
      if (value.reduce((p, c) => p !== 0 ? c + 1 : c, 0) > 0) {
        throw new Error("invalid G2 point: compressed");
      }
      return { x: Fp2.ZERO, y: Fp2.ZERO };
    }
    const x_1 = slc(value, 0, L);
    const x_0 = slc(value, L, 2 * L);
    const x = Fp2.create({ c0: Fp.create(x_0), c1: Fp.create(x_1) });
    const right = Fp2.add(Fp2.pow(x, _3n5), bls12_381_CURVE_G2.b);
    let y = Fp2.sqrt(right);
    const Y_bit = y.c1 === _0n7 ? y.c0 * _2n5 / P : y.c1 * _2n5 / P ? _1n7 : _0n7;
    y = sort && Y_bit > 0 ? y : Fp2.neg(y);
    return { x, y };
  } else if (value.length === 192 && !compressed) {
    if (infinity) {
      if (value.reduce((p, c) => p !== 0 ? c + 1 : c, 0) > 0) {
        throw new Error("invalid G2 point: uncompressed");
      }
      return { x: Fp2.ZERO, y: Fp2.ZERO };
    }
    const x1 = slc(value, 0 * L, 1 * L);
    const x0 = slc(value, 1 * L, 2 * L);
    const y1 = slc(value, 2 * L, 3 * L);
    const y0 = slc(value, 3 * L, 4 * L);
    return { x: Fp2.fromBigTuple([x0, x1]), y: Fp2.fromBigTuple([y0, y1]) };
  } else {
    throw new Error("invalid G2 point: expected 96/192 bytes");
  }
}
function signatureG2FromBytes(bytes) {
  const { ORDER: P } = Fp;
  const { infinity, sort, value } = parseMask(abytes2(bytes));
  const Point = bls12_381.G2.Point;
  const half = value.length / 2;
  if (half !== 48 && half !== 96)
    throw new Error("invalid compressed signature length, expected 96/192 bytes");
  const z1 = bytesToNumberBE(value.slice(0, half));
  const z2 = bytesToNumberBE(value.slice(half));
  if (infinity)
    return Point.ZERO;
  const x1 = Fp.create(z1 & bitMask(Fp.BITS));
  const x2 = Fp.create(z2);
  const x = Fp2.create({ c0: x2, c1: x1 });
  const y2 = Fp2.add(Fp2.pow(x, _3n5), bls12_381_CURVE_G2.b);
  let y = Fp2.sqrt(y2);
  if (!y)
    throw new Error("Failed to find a square root");
  const { re: y0, im: y1 } = Fp2.reim(y);
  const aflag1 = BigInt(sort);
  const isGreater = y1 > _0n7 && y1 * _2n5 / P !== aflag1;
  const is0 = y1 === _0n7 && y0 * _2n5 / P !== aflag1;
  if (isGreater || is0)
    y = Fp2.neg(y);
  const point = Point.fromAffine({ x, y });
  point.assertValidity();
  return point;
}
var signatureCoders = {
  ShortSignature: {
    fromBytes(bytes) {
      return signatureG1FromBytes(abytes2(bytes));
    },
    fromHex(hex2) {
      return signatureG1FromBytes(hexToBytes(hex2));
    },
    toBytes(point) {
      return signatureG1ToBytes(point);
    },
    toRawBytes(point) {
      return signatureG1ToBytes(point);
    },
    toHex(point) {
      return bytesToHex(signatureG1ToBytes(point));
    }
  },
  LongSignature: {
    fromBytes(bytes) {
      return signatureG2FromBytes(abytes2(bytes));
    },
    fromHex(hex2) {
      return signatureG2FromBytes(hexToBytes(hex2));
    },
    toBytes(point) {
      return signatureG2ToBytes(point);
    },
    toRawBytes(point) {
      return signatureG2ToBytes(point);
    },
    toHex(point) {
      return bytesToHex(signatureG2ToBytes(point));
    }
  }
};
var fields = {
  Fp,
  Fp2,
  Fp6,
  Fp12,
  Fr: bls12_381_Fr
};
var G1_Point = weierstrass(bls12_381_CURVE_G1, {
  allowInfinityPoint: true,
  Fn: bls12_381_Fr,
  fromBytes: pointG1FromBytes,
  toBytes: pointG1ToBytes,
  isTorsionFree: (c, point) => {
    const beta = BigInt("0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffe");
    const phi = new c(Fp.mul(point.X, beta), point.Y, point.Z);
    const xP = point.multiplyUnsafe(BLS_X).negate();
    const u2P = xP.multiplyUnsafe(BLS_X);
    return u2P.equals(phi);
  },
  clearCofactor: (_c, point) => {
    return point.multiplyUnsafe(BLS_X).add(point);
  }
});
var G2_Point = weierstrass(bls12_381_CURVE_G2, {
  Fp: Fp2,
  allowInfinityPoint: true,
  Fn: bls12_381_Fr,
  fromBytes: pointG2FromBytes,
  toBytes: pointG2ToBytes,
  isTorsionFree: (c, P) => {
    return P.multiplyUnsafe(BLS_X).negate().equals(G2psi(c, P));
  },
  clearCofactor: (c, P) => {
    const x = BLS_X;
    let t1 = P.multiplyUnsafe(x).negate();
    let t2 = G2psi(c, P);
    let t3 = P.double();
    t3 = G2psi2(c, t3);
    t3 = t3.subtract(t2);
    t2 = t1.add(t2);
    t2 = t2.multiplyUnsafe(x).negate();
    t3 = t3.add(t2);
    t3 = t3.subtract(t1);
    const Q = t3.subtract(P);
    return Q;
  }
});
var bls12_hasher_opts = {
  mapToG1,
  mapToG2,
  hasherOpts: hasher_opts,
  hasherOptsG1: { ...hasher_opts, m: 1, DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_" },
  hasherOptsG2: { ...hasher_opts }
};
var bls12_params = {
  ateLoopSize: BLS_X,
  xNegative: true,
  twistType: "multiplicative",
  randomBytes
};
var bls12_381 = bls(fields, G1_Point, G2_Point, bls12_params, bls12_hasher_opts, signatureCoders);
var isogenyMapG2 = isogenyMap(Fp2, [
  [
    [
      "0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97d6",
      "0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97d6"
    ],
    [
      "0x0",
      "0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71a"
    ],
    [
      "0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71e",
      "0x8ab05f8bdd54cde190937e76bc3e447cc27c3d6fbd7063fcd104635a790520c0a395554e5c6aaaa9354ffffffffe38d"
    ],
    [
      "0x171d6541fa38ccfaed6dea691f5fb614cb14b4e7f4e810aa22d6108f142b85757098e38d0f671c7188e2aaaaaaaa5ed1",
      "0x0"
    ]
  ],
  [
    [
      "0x0",
      "0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa63"
    ],
    [
      "0xc",
      "0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa9f"
    ],
    ["0x1", "0x0"]
  ],
  [
    [
      "0x1530477c7ab4113b59a4c18b076d11930f7da5d4a07f649bf54439d87d27e500fc8c25ebf8c92f6812cfc71c71c6d706",
      "0x1530477c7ab4113b59a4c18b076d11930f7da5d4a07f649bf54439d87d27e500fc8c25ebf8c92f6812cfc71c71c6d706"
    ],
    [
      "0x0",
      "0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97be"
    ],
    [
      "0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71c",
      "0x8ab05f8bdd54cde190937e76bc3e447cc27c3d6fbd7063fcd104635a790520c0a395554e5c6aaaa9354ffffffffe38f"
    ],
    [
      "0x124c9ad43b6cf79bfbf7043de3811ad0761b0f37a1e26286b0e977c69aa274524e79097a56dc4bd9e1b371c71c718b10",
      "0x0"
    ]
  ],
  [
    [
      "0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa8fb",
      "0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa8fb"
    ],
    [
      "0x0",
      "0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa9d3"
    ],
    [
      "0x12",
      "0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa99"
    ],
    ["0x1", "0x0"]
  ]
].map((i) => i.map((pair) => Fp2.fromBigTuple(pair.map(BigInt)))));
var isogenyMapG1 = isogenyMap(Fp, [
  [
    "0x11a05f2b1e833340b809101dd99815856b303e88a2d7005ff2627b56cdb4e2c85610c2d5f2e62d6eaeac1662734649b7",
    "0x17294ed3e943ab2f0588bab22147a81c7c17e75b2f6a8417f565e33c70d1e86b4838f2a6f318c356e834eef1b3cb83bb",
    "0xd54005db97678ec1d1048c5d10a9a1bce032473295983e56878e501ec68e25c958c3e3d2a09729fe0179f9dac9edcb0",
    "0x1778e7166fcc6db74e0609d307e55412d7f5e4656a8dbf25f1b33289f1b330835336e25ce3107193c5b388641d9b6861",
    "0xe99726a3199f4436642b4b3e4118e5499db995a1257fb3f086eeb65982fac18985a286f301e77c451154ce9ac8895d9",
    "0x1630c3250d7313ff01d1201bf7a74ab5db3cb17dd952799b9ed3ab9097e68f90a0870d2dcae73d19cd13c1c66f652983",
    "0xd6ed6553fe44d296a3726c38ae652bfb11586264f0f8ce19008e218f9c86b2a8da25128c1052ecaddd7f225a139ed84",
    "0x17b81e7701abdbe2e8743884d1117e53356de5ab275b4db1a682c62ef0f2753339b7c8f8c8f475af9ccb5618e3f0c88e",
    "0x80d3cf1f9a78fc47b90b33563be990dc43b756ce79f5574a2c596c928c5d1de4fa295f296b74e956d71986a8497e317",
    "0x169b1f8e1bcfa7c42e0c37515d138f22dd2ecb803a0c5c99676314baf4bb1b7fa3190b2edc0327797f241067be390c9e",
    "0x10321da079ce07e272d8ec09d2565b0dfa7dccdde6787f96d50af36003b14866f69b771f8c285decca67df3f1605fb7b",
    "0x6e08c248e260e70bd1e962381edee3d31d79d7e22c837bc23c0bf1bc24c6b68c24b1b80b64d391fa9c8ba2e8ba2d229"
  ],
  [
    "0x8ca8d548cff19ae18b2e62f4bd3fa6f01d5ef4ba35b48ba9c9588617fc8ac62b558d681be343df8993cf9fa40d21b1c",
    "0x12561a5deb559c4348b4711298e536367041e8ca0cf0800c0126c2588c48bf5713daa8846cb026e9e5c8276ec82b3bff",
    "0xb2962fe57a3225e8137e629bff2991f6f89416f5a718cd1fca64e00b11aceacd6a3d0967c94fedcfcc239ba5cb83e19",
    "0x3425581a58ae2fec83aafef7c40eb545b08243f16b1655154cca8abc28d6fd04976d5243eecf5c4130de8938dc62cd8",
    "0x13a8e162022914a80a6f1d5f43e7a07dffdfc759a12062bb8d6b44e833b306da9bd29ba81f35781d539d395b3532a21e",
    "0xe7355f8e4e667b955390f7f0506c6e9395735e9ce9cad4d0a43bcef24b8982f7400d24bc4228f11c02df9a29f6304a5",
    "0x772caacf16936190f3e0c63e0596721570f5799af53a1894e2e073062aede9cea73b3538f0de06cec2574496ee84a3a",
    "0x14a7ac2a9d64a8b230b3f5b074cf01996e7f63c21bca68a81996e1cdf9822c580fa5b9489d11e2d311f7d99bbdcc5a5e",
    "0xa10ecf6ada54f825e920b3dafc7a3cce07f8d1d7161366b74100da67f39883503826692abba43704776ec3a79a1d641",
    "0x95fc13ab9e92ad4476d6e3eb3a56680f682b4ee96f7d03776df533978f31c1593174e4b4b7865002d6384d168ecdd0a",
    "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
  ],
  [
    "0x90d97c81ba24ee0259d1f094980dcfa11ad138e48a869522b52af6c956543d3cd0c7aee9b3ba3c2be9845719707bb33",
    "0x134996a104ee5811d51036d776fb46831223e96c254f383d0f906343eb67ad34d6c56711962fa8bfe097e75a2e41c696",
    "0xcc786baa966e66f4a384c86a3b49942552e2d658a31ce2c344be4b91400da7d26d521628b00523b8dfe240c72de1f6",
    "0x1f86376e8981c217898751ad8746757d42aa7b90eeb791c09e4a3ec03251cf9de405aba9ec61deca6355c77b0e5f4cb",
    "0x8cc03fdefe0ff135caf4fe2a21529c4195536fbe3ce50b879833fd221351adc2ee7f8dc099040a841b6daecf2e8fedb",
    "0x16603fca40634b6a2211e11db8f0a6a074a7d0d4afadb7bd76505c3d3ad5544e203f6326c95a807299b23ab13633a5f0",
    "0x4ab0b9bcfac1bbcb2c977d027796b3ce75bb8ca2be184cb5231413c4d634f3747a87ac2460f415ec961f8855fe9d6f2",
    "0x987c8d5333ab86fde9926bd2ca6c674170a05bfe3bdd81ffd038da6c26c842642f64550fedfe935a15e4ca31870fb29",
    "0x9fc4018bd96684be88c9e221e4da1bb8f3abd16679dc26c1e8b6e6a1f20cabe69d65201c78607a360370e577bdba587",
    "0xe1bba7a1186bdb5223abde7ada14a23c42a0ca7915af6fe06985e7ed1e4d43b9b3f7055dd4eba6f2bafaaebca731c30",
    "0x19713e47937cd1be0dfd0b8f1d43fb93cd2fcbcb6caf493fd1183e416389e61031bf3a5cce3fbafce813711ad011c132",
    "0x18b46a908f36f6deb918c143fed2edcc523559b8aaf0c2462e6bfe7f911f643249d9cdf41b44d606ce07c8a4d0074d8e",
    "0xb182cac101b9399d155096004f53f447aa7b12a3426b08ec02710e807b4633f06c851c1919211f20d4c04f00b971ef8",
    "0x245a394ad1eca9b72fc00ae7be315dc757b3b080d4c158013e6632d3c40659cc6cf90ad1c232a6442d9d3f5db980133",
    "0x5c129645e44cf1102a159f748c4a3fc5e673d81d7e86568d9ab0f5d396a7ce46ba1049b6579afb7866b1e715475224b",
    "0x15e6be4e990f03ce4ea50b3b42df2eb5cb181d8f84965a3957add4fa95af01b2b665027efec01c7704b456be69c8b604"
  ],
  [
    "0x16112c4c3a9c98b252181140fad0eae9601a6de578980be6eec3232b5be72e7a07f3688ef60c206d01479253b03663c1",
    "0x1962d75c2381201e1a0cbd6c43c348b885c84ff731c4d59ca4a10356f453e01f78a4260763529e3532f6102c2e49a03d",
    "0x58df3306640da276faaae7d6e8eb15778c4855551ae7f310c35a5dd279cd2eca6757cd636f96f891e2538b53dbf67f2",
    "0x16b7d288798e5395f20d23bf89edb4d1d115c5dbddbcd30e123da489e726af41727364f2c28297ada8d26d98445f5416",
    "0xbe0e079545f43e4b00cc912f8228ddcc6d19c9f0f69bbb0542eda0fc9dec916a20b15dc0fd2ededda39142311a5001d",
    "0x8d9e5297186db2d9fb266eaac783182b70152c65550d881c5ecd87b6f0f5a6449f38db9dfa9cce202c6477faaf9b7ac",
    "0x166007c08a99db2fc3ba8734ace9824b5eecfdfa8d0cf8ef5dd365bc400a0051d5fa9c01a58b1fb93d1a1399126a775c",
    "0x16a3ef08be3ea7ea03bcddfabba6ff6ee5a4375efa1f4fd7feb34fd206357132b920f5b00801dee460ee415a15812ed9",
    "0x1866c8ed336c61231a1be54fd1d74cc4f9fb0ce4c6af5920abc5750c4bf39b4852cfe2f7bb9248836b233d9d55535d4a",
    "0x167a55cda70a6e1cea820597d94a84903216f763e13d87bb5308592e7ea7d4fbc7385ea3d529b35e346ef48bb8913f55",
    "0x4d2f259eea405bd48f010a01ad2911d9c6dd039bb61a6290e591b36e636a5c871a5c29f4f83060400f8b49cba8f6aa8",
    "0xaccbb67481d033ff5852c1e48c50c477f94ff8aefce42d28c0f9a88cea7913516f968986f7ebbea9684b529e2561092",
    "0xad6b9514c767fe3c3613144b45f1496543346d98adf02267d5ceef9a00d9b8693000763e3b90ac11e99b138573345cc",
    "0x2660400eb2e4f3b628bdd0d53cd76f2bf565b94e72927c1cb748df27942480e420517bd8714cc80d1fadc1326ed06f7",
    "0xe0fa1d816ddc03e6b24255e0d7819c171c40f65e273b853324efcd6356caa205ca2f570f13497804415473a1d634b8f",
    "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
  ]
].map((i) => i.map((j) => BigInt(j))));
var G1_SWU = mapToCurveSimpleSWU(Fp, {
  A: Fp.create(BigInt("0x144698a3b8e9433d693a02c96d4982b0ea985383ee66a8d8e8981aefd881ac98936f8da0e0f97f5cf428082d584c1d")),
  B: Fp.create(BigInt("0x12e2908d11688030018b12e8753eee3b2016c1f0f24f4070a0b9c14fcef35ef55a23215a316ceaa5d1cc48e98e172be0")),
  Z: Fp.create(BigInt(11))
});
var G2_SWU = mapToCurveSimpleSWU(Fp2, {
  A: Fp2.create({ c0: Fp.create(_0n7), c1: Fp.create(BigInt(240)) }),
  B: Fp2.create({ c0: Fp.create(BigInt(1012)), c1: Fp.create(BigInt(1012)) }),
  Z: Fp2.create({ c0: Fp.create(BigInt(-2)), c1: Fp.create(BigInt(-1)) })
});
function mapToG1(scalars) {
  const { x, y } = G1_SWU(Fp.create(scalars[0]));
  return isogenyMapG1(x, y);
}
function mapToG2(scalars) {
  const { x, y } = G2_SWU(Fp2.fromBigTuple(scalars));
  return isogenyMapG2(x, y);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/bls12381.mjs
var G1Element = class G1Element2 {
  static {
    this.SIZE = 48;
  }
  constructor(point) {
    this.point = point;
  }
  static generator() {
    return new G1Element2(bls12_381.G1.Point.BASE);
  }
  static fromBytes(bytes) {
    try {
      return new G1Element2(bls12_381.G1.Point.fromBytes(bytes));
    } catch {
      throw new Error("Invalid G1 point");
    }
  }
  toBytes() {
    return this.point.toBytes();
  }
  multiply(scalar) {
    return new G1Element2(this.point.multiply(scalar.scalar));
  }
  add(other) {
    return new G1Element2(this.point.add(other.point));
  }
  subtract(other) {
    return new G1Element2(this.point.subtract(other.point));
  }
  static hashToCurve(data) {
    return new G1Element2(bls12_381.G1.Point.fromAffine(bls12_381.G1.hashToCurve(data).toAffine()));
  }
  pairing(other) {
    return new GTElement(bls12_381.pairing(this.point, other.point));
  }
};
var G2Element = class G2Element2 {
  static {
    this.SIZE = 96;
  }
  constructor(point) {
    this.point = point;
  }
  static generator() {
    return new G2Element2(bls12_381.G2.Point.BASE);
  }
  static fromBytes(bytes) {
    try {
      return new G2Element2(bls12_381.G2.Point.fromBytes(bytes));
    } catch {
      throw new Error("Invalid G2 point");
    }
  }
  toBytes() {
    return this.point.toBytes();
  }
  multiply(scalar) {
    return new G2Element2(this.point.multiply(scalar.scalar));
  }
  add(other) {
    return new G2Element2(this.point.add(other.point));
  }
  static hashToCurve(data) {
    return new G2Element2(bls12_381.G2.Point.fromAffine(bls12_381.G2.hashToCurve(data).toAffine()));
  }
  equals(other) {
    return this.point.equals(other.point);
  }
};
var GTElement = class GTElement2 {
  static {
    this.SIZE = 576;
  }
  constructor(element) {
    this.element = element;
  }
  toBytes() {
    const P = [
      0,
      3,
      1,
      4,
      2,
      5
    ];
    const PAIR_SIZE = GTElement2.SIZE / P.length;
    const bytes = bls12_381.fields.Fp12.toBytes(this.element);
    const result = new Uint8Array(GTElement2.SIZE);
    for (let i = 0;i < P.length; i++) {
      const sourceStart = P[i] * PAIR_SIZE;
      const sourceEnd = sourceStart + PAIR_SIZE;
      const targetStart = i * PAIR_SIZE;
      result.set(bytes.subarray(sourceStart, sourceEnd), targetStart);
    }
    return result;
  }
  equals(other) {
    return bls12_381.fields.Fp12.eql(this.element, other.element);
  }
};
var Scalar = class Scalar2 {
  static {
    this.SIZE = 32;
  }
  constructor(scalar) {
    this.scalar = scalar;
  }
  static fromBigint(scalar) {
    if (scalar < 0n || scalar >= bls12_381.fields.Fr.ORDER)
      throw new Error("Scalar out of range");
    return new Scalar2(scalar);
  }
  static random() {
    const randomSecretKey = bls12_381.utils.randomSecretKey();
    return Scalar2.fromBytes(randomSecretKey);
  }
  toBytes() {
    return numberToBytesBE(this.scalar, Scalar2.SIZE);
  }
  static fromBytes(bytes) {
    if (bytes.length !== Scalar2.SIZE)
      throw new Error("Invalid scalar length");
    return this.fromBigint(bytesToNumberBE(bytes));
  }
  static fromBytesLE(bytes) {
    if (bytes.length !== Scalar2.SIZE)
      throw new Error("Invalid scalar length");
    return this.fromBigint(bytesToNumberLE(bytes));
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/sha3.js
var _0n8 = BigInt(0);
var _1n8 = BigInt(1);
var _2n6 = BigInt(2);
var _7n2 = BigInt(7);
var _256n = BigInt(256);
var _0x71n = BigInt(113);
var SHA3_PI = [];
var SHA3_ROTL = [];
var _SHA3_IOTA = [];
for (let round = 0, R = _1n8, x = 1, y = 0;round < 24; round++) {
  [x, y] = [y, (2 * x + 3 * y) % 5];
  SHA3_PI.push(2 * (5 * y + x));
  SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
  let t = _0n8;
  for (let j = 0;j < 7; j++) {
    R = (R << _1n8 ^ (R >> _7n2) * _0x71n) % _256n;
    if (R & _2n6)
      t ^= _1n8 << (_1n8 << BigInt(j)) - _1n8;
  }
  _SHA3_IOTA.push(t);
}
var IOTAS = split(_SHA3_IOTA, true);
var SHA3_IOTA_H = IOTAS[0];
var SHA3_IOTA_L = IOTAS[1];
var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
function keccakP(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds;round < 24; round++) {
    for (let x = 0;x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0;x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0;y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0;t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0;y < 50; y += 10) {
      for (let x = 0;x < 10; x++)
        B[x] = s[y + x];
      for (let x = 0;x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  clean(B);
}

class Keccak {
  state;
  pos = 0;
  posOut = 0;
  finished = false;
  state32;
  destroyed = false;
  blockLen;
  suffix;
  outputLen;
  enableXOF = false;
  rounds;
  constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
    this.blockLen = blockLen;
    this.suffix = suffix;
    this.outputLen = outputLen;
    this.enableXOF = enableXOF;
    this.rounds = rounds;
    anumber2(outputLen, "outputLen");
    if (!(0 < blockLen && blockLen < 200))
      throw new Error("only keccak-f1600 function is supported");
    this.state = new Uint8Array(200);
    this.state32 = u32(this.state);
  }
  clone() {
    return this._cloneInto();
  }
  keccak() {
    swap32IfBE(this.state32);
    keccakP(this.state32, this.rounds);
    swap32IfBE(this.state32);
    this.posOut = 0;
    this.pos = 0;
  }
  update(data) {
    aexists(this);
    abytes2(data);
    const { blockLen, state } = this;
    const len = data.length;
    for (let pos = 0;pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      for (let i = 0;i < take; i++)
        state[this.pos++] ^= data[pos++];
      if (this.pos === blockLen)
        this.keccak();
    }
    return this;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = true;
    const { state, suffix, pos, blockLen } = this;
    state[pos] ^= suffix;
    if ((suffix & 128) !== 0 && pos === blockLen - 1)
      this.keccak();
    state[blockLen - 1] ^= 128;
    this.keccak();
  }
  writeInto(out) {
    aexists(this, false);
    abytes2(out);
    this.finish();
    const bufferOut = this.state;
    const { blockLen } = this;
    for (let pos = 0, len = out.length;pos < len; ) {
      if (this.posOut >= blockLen)
        this.keccak();
      const take = Math.min(blockLen - this.posOut, len - pos);
      out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
      this.posOut += take;
      pos += take;
    }
    return out;
  }
  xofInto(out) {
    if (!this.enableXOF)
      throw new Error("XOF is not possible for this instance");
    return this.writeInto(out);
  }
  xof(bytes) {
    anumber2(bytes);
    return this.xofInto(new Uint8Array(bytes));
  }
  digestInto(out) {
    aoutput(out, this);
    if (this.finished)
      throw new Error("digest() was already called");
    this.writeInto(out);
    this.destroy();
    return out;
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen));
  }
  destroy() {
    this.destroyed = true;
    clean(this.state);
  }
  _cloneInto(to) {
    const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
    to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
    to.state32.set(this.state32);
    to.pos = this.pos;
    to.posOut = this.posOut;
    to.finished = this.finished;
    to.rounds = rounds;
    to.suffix = suffix;
    to.outputLen = outputLen;
    to.enableXOF = enableXOF;
    to.destroyed = this.destroyed;
    return to;
  }
}
var genKeccak = (suffix, blockLen, outputLen, info = {}) => createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
var sha3_256 = /* @__PURE__ */ genKeccak(6, 136, 32, /* @__PURE__ */ oidNist(8));

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/kdf.mjs
var DST = new TextEncoder().encode("SUI-SEAL-IBE-BLS12381-00");
var KDF_DST = new TextEncoder().encode("SUI-SEAL-IBE-BLS12381-H2-00");
var DERIVE_KEY_DST = new TextEncoder().encode("SUI-SEAL-IBE-BLS12381-H3-00");
function hashToG1(id) {
  return G1Element.hashToCurve(flatten([DST, id]));
}
function kdf(element, nonce, id, objectId, index) {
  if (!Number.isInteger(index) || index < 0 || index > MAX_U8)
    throw new Error(`Invalid index ${index}`);
  const objectIdBytes = fromHex(objectId);
  if (objectIdBytes.length !== SUI_ADDRESS_LENGTH2)
    throw new Error(`Invalid object id ${objectId}`);
  const hash = sha3_256.create();
  hash.update(KDF_DST);
  hash.update(element.toBytes());
  hash.update(nonce.toBytes());
  hash.update(hashToG1(id).toBytes());
  hash.update(objectIdBytes);
  hash.update(new Uint8Array([index]));
  return hash.digest();
}
var KeyPurpose = /* @__PURE__ */ function(KeyPurpose$1) {
  KeyPurpose$1[KeyPurpose$1["EncryptedRandomness"] = 0] = "EncryptedRandomness";
  KeyPurpose$1[KeyPurpose$1["DEM"] = 1] = "DEM";
  return KeyPurpose$1;
}({});
function tag(purpose) {
  switch (purpose) {
    case KeyPurpose.EncryptedRandomness:
      return new Uint8Array([0]);
    case KeyPurpose.DEM:
      return new Uint8Array([1]);
    default:
      throw new Error(`Invalid key purpose ${purpose}`);
  }
}
function deriveKey(purpose, baseKey, encryptedShares, threshold, keyServers) {
  if (!Number.isInteger(threshold) || threshold <= 0 || threshold > MAX_U8)
    throw new Error(`Invalid threshold ${threshold}`);
  if (encryptedShares.length !== keyServers.length)
    throw new Error(`Mismatched shares ${encryptedShares.length} and key servers ${keyServers.length}`);
  const keyServerBytes = keyServers.map((keyServer) => fromHex(keyServer));
  if (keyServerBytes.some((keyServer) => keyServer.length !== SUI_ADDRESS_LENGTH2))
    throw new Error(`Invalid key servers ${keyServers}`);
  if (encryptedShares.some((share2) => share2.length !== ENCRYPTED_SHARE_LENGTH))
    throw new Error(`Invalid encrypted shares ${encryptedShares}`);
  if (baseKey.length !== KEY_LENGTH)
    throw new Error(`Invalid base key ${baseKey}`);
  const hash = sha3_256.create();
  hash.update(DERIVE_KEY_DST);
  hash.update(baseKey);
  hash.update(tag(purpose));
  hash.update(new Uint8Array([threshold]));
  encryptedShares.forEach((share2) => hash.update(share2));
  keyServerBytes.forEach((keyServer) => hash.update(keyServer));
  return hash.digest();
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/ibe.mjs
var DST_POP = new TextEncoder().encode("SUI-SEAL-IBE-BLS12381-POP-00");
var IBEServers = class {
  constructor(objectIds) {
    this.objectIds = objectIds;
  }
};
var BonehFranklinBLS12381Services = class extends IBEServers {
  constructor(services) {
    super(services.map((service) => service.objectId));
    this.publicKeys = services.map((service) => G2Element.fromBytes(service.pk));
  }
  encryptBatched(id, shares, baseKey, threshold) {
    if (this.publicKeys.length === 0 || this.publicKeys.length !== shares.length)
      throw new Error("Invalid public keys");
    const [r, nonce, keys] = encapBatched(this.publicKeys, id);
    const encryptedShares = shares.map(({ share: share2, index }, i) => xor(share2, kdf(keys[i], nonce, id, this.objectIds[i], index)));
    const encryptedRandomness = xor(deriveKey(KeyPurpose.EncryptedRandomness, baseKey, encryptedShares, threshold, this.objectIds), r.toBytes());
    return {
      BonehFranklinBLS12381: {
        nonce: nonce.toBytes(),
        encryptedShares,
        encryptedRandomness
      },
      $kind: "BonehFranklinBLS12381"
    };
  }
  static verifyUserSecretKey(userSecretKey, id, publicKey) {
    const lhs = userSecretKey.pairing(G2Element.generator());
    const rhs = hashToG1(fromHex(id)).pairing(publicKey);
    return lhs.equals(rhs);
  }
  static decrypt(nonce, sk, ciphertext, id, [objectId, index]) {
    return xor(ciphertext, kdf(decap(nonce, sk), nonce, id, objectId, index));
  }
  static decryptAllSharesUsingRandomness(randomness, encryptedShares, services, publicKeys, nonce, id) {
    if (publicKeys.length !== encryptedShares.length || publicKeys.length !== services.length)
      throw new Error("The number of public keys, encrypted shares and services must be the same");
    let r;
    try {
      r = Scalar.fromBytes(randomness);
    } catch {
      throw new InvalidCiphertextError("Invalid randomness");
    }
    const gid_r = hashToG1(id).multiply(r);
    return services.map(([objectId, index], i) => {
      return {
        index,
        share: xor(encryptedShares[i], kdf(gid_r.pairing(publicKeys[i]), nonce, id, objectId, index))
      };
    });
  }
};
function encapBatched(publicKeys, id) {
  if (publicKeys.length === 0)
    throw new Error("No public keys provided");
  const r = Scalar.random();
  const nonce = G2Element.generator().multiply(r);
  const gid_r = hashToG1(id).multiply(r);
  return [
    r,
    nonce,
    publicKeys.map((public_key) => gid_r.pairing(public_key))
  ];
}
function decap(nonce, usk) {
  return usk.pairing(nonce);
}
function verifyNonce(nonce, randomness, useBE = true) {
  try {
    const r = decodeRandomness(randomness, useBE);
    return G2Element.generator().multiply(r).equals(nonce);
  } catch {
    throw new InvalidCiphertextError("Invalid randomness");
  }
}
function decodeRandomness(bytes, useBE) {
  if (useBE)
    return Scalar.fromBytes(bytes);
  else
    return Scalar.fromBytesLE(bytes);
}
function decryptRandomness(encryptedRandomness, randomnessKey) {
  return xor(encryptedRandomness, randomnessKey);
}
function verifyNonceWithLE(nonce, randomness) {
  try {
    if (verifyNonce(nonce, randomness, false))
      return true;
  } catch {}
  return verifyNonce(nonce, randomness, true);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/shamir.mjs
var GF256_SIZE = 256;
var GF256 = class GF2562 {
  constructor(value) {
    if (value < 0 || value >= GF256_SIZE)
      throw new Error(`Invalid value ${value} for GF256`);
    this.value = value;
  }
  log() {
    if (this.value === 0)
      throw new Error("Invalid value");
    return LOG[this.value - 1];
  }
  static exp(x) {
    return new GF2562(EXP[x % (GF256_SIZE - 1)]);
  }
  add(other) {
    return new GF2562(this.value ^ other.value);
  }
  sub(other) {
    return this.add(other);
  }
  neg() {
    return this;
  }
  mul(other) {
    if (this.value === 0 || other.value === 0)
      return new GF2562(0);
    return GF2562.exp(this.log() + other.log());
  }
  div(other) {
    return this.mul(GF2562.exp(GF256_SIZE - other.log() - 1));
  }
  equals(other) {
    return this.value === other.value;
  }
  static zero() {
    return new GF2562(0);
  }
  static one() {
    return new GF2562(1);
  }
};
var EXP = [
  1,
  3,
  5,
  15,
  17,
  51,
  85,
  255,
  26,
  46,
  114,
  150,
  161,
  248,
  19,
  53,
  95,
  225,
  56,
  72,
  216,
  115,
  149,
  164,
  247,
  2,
  6,
  10,
  30,
  34,
  102,
  170,
  229,
  52,
  92,
  228,
  55,
  89,
  235,
  38,
  106,
  190,
  217,
  112,
  144,
  171,
  230,
  49,
  83,
  245,
  4,
  12,
  20,
  60,
  68,
  204,
  79,
  209,
  104,
  184,
  211,
  110,
  178,
  205,
  76,
  212,
  103,
  169,
  224,
  59,
  77,
  215,
  98,
  166,
  241,
  8,
  24,
  40,
  120,
  136,
  131,
  158,
  185,
  208,
  107,
  189,
  220,
  127,
  129,
  152,
  179,
  206,
  73,
  219,
  118,
  154,
  181,
  196,
  87,
  249,
  16,
  48,
  80,
  240,
  11,
  29,
  39,
  105,
  187,
  214,
  97,
  163,
  254,
  25,
  43,
  125,
  135,
  146,
  173,
  236,
  47,
  113,
  147,
  174,
  233,
  32,
  96,
  160,
  251,
  22,
  58,
  78,
  210,
  109,
  183,
  194,
  93,
  231,
  50,
  86,
  250,
  21,
  63,
  65,
  195,
  94,
  226,
  61,
  71,
  201,
  64,
  192,
  91,
  237,
  44,
  116,
  156,
  191,
  218,
  117,
  159,
  186,
  213,
  100,
  172,
  239,
  42,
  126,
  130,
  157,
  188,
  223,
  122,
  142,
  137,
  128,
  155,
  182,
  193,
  88,
  232,
  35,
  101,
  175,
  234,
  37,
  111,
  177,
  200,
  67,
  197,
  84,
  252,
  31,
  33,
  99,
  165,
  244,
  7,
  9,
  27,
  45,
  119,
  153,
  176,
  203,
  70,
  202,
  69,
  207,
  74,
  222,
  121,
  139,
  134,
  145,
  168,
  227,
  62,
  66,
  198,
  81,
  243,
  14,
  18,
  54,
  90,
  238,
  41,
  123,
  141,
  140,
  143,
  138,
  133,
  148,
  167,
  242,
  13,
  23,
  57,
  75,
  221,
  124,
  132,
  151,
  162,
  253,
  28,
  36,
  108,
  180,
  199,
  82,
  246
];
var LOG = [
  0,
  25,
  1,
  50,
  2,
  26,
  198,
  75,
  199,
  27,
  104,
  51,
  238,
  223,
  3,
  100,
  4,
  224,
  14,
  52,
  141,
  129,
  239,
  76,
  113,
  8,
  200,
  248,
  105,
  28,
  193,
  125,
  194,
  29,
  181,
  249,
  185,
  39,
  106,
  77,
  228,
  166,
  114,
  154,
  201,
  9,
  120,
  101,
  47,
  138,
  5,
  33,
  15,
  225,
  36,
  18,
  240,
  130,
  69,
  53,
  147,
  218,
  142,
  150,
  143,
  219,
  189,
  54,
  208,
  206,
  148,
  19,
  92,
  210,
  241,
  64,
  70,
  131,
  56,
  102,
  221,
  253,
  48,
  191,
  6,
  139,
  98,
  179,
  37,
  226,
  152,
  34,
  136,
  145,
  16,
  126,
  110,
  72,
  195,
  163,
  182,
  30,
  66,
  58,
  107,
  40,
  84,
  250,
  133,
  61,
  186,
  43,
  121,
  10,
  21,
  155,
  159,
  94,
  202,
  78,
  212,
  172,
  229,
  243,
  115,
  167,
  87,
  175,
  88,
  168,
  80,
  244,
  234,
  214,
  116,
  79,
  174,
  233,
  213,
  231,
  230,
  173,
  232,
  44,
  215,
  117,
  122,
  235,
  22,
  11,
  245,
  89,
  203,
  95,
  176,
  156,
  169,
  81,
  160,
  127,
  12,
  246,
  111,
  23,
  196,
  73,
  236,
  216,
  67,
  31,
  45,
  164,
  118,
  123,
  183,
  204,
  187,
  62,
  90,
  251,
  96,
  177,
  134,
  59,
  82,
  161,
  108,
  170,
  85,
  41,
  157,
  151,
  178,
  135,
  144,
  97,
  190,
  220,
  252,
  188,
  149,
  207,
  205,
  55,
  63,
  91,
  209,
  83,
  57,
  132,
  60,
  65,
  162,
  109,
  71,
  20,
  42,
  158,
  93,
  86,
  242,
  211,
  171,
  68,
  17,
  146,
  217,
  35,
  32,
  46,
  137,
  180,
  124,
  184,
  38,
  119,
  153,
  227,
  165,
  103,
  74,
  237,
  222,
  197,
  49,
  254,
  24,
  13,
  99,
  140,
  128,
  192,
  247,
  112,
  7
];
var Polynomial = class Polynomial2 {
  constructor(coefficients) {
    this.coefficients = coefficients.slice();
    while (this.coefficients.length > 0 && this.coefficients[this.coefficients.length - 1].value === 0)
      this.coefficients.pop();
  }
  static fromBytes(bytes) {
    return new Polynomial2(Array.from(bytes, (b) => new GF256(b)));
  }
  degree() {
    if (this.coefficients.length === 0)
      return 0;
    return this.coefficients.length - 1;
  }
  getCoefficient(index) {
    if (index >= this.coefficients.length)
      return GF256.zero();
    return this.coefficients[index];
  }
  add(other) {
    const degree = Math.max(this.degree(), other.degree());
    return new Polynomial2(Array.from({ length: degree + 1 }, (_, i) => this.getCoefficient(i).add(other.getCoefficient(i))));
  }
  mul(other) {
    const degree = this.degree() + other.degree();
    return new Polynomial2(Array.from({ length: degree + 1 }, (_, i) => {
      let sum = GF256.zero();
      for (let j = 0;j <= i; j++)
        if (j <= this.degree() && i - j <= other.degree())
          sum = sum.add(this.getCoefficient(j).mul(other.getCoefficient(i - j)));
      return sum;
    }));
  }
  scale(s) {
    return new Polynomial2(this.coefficients.map((c) => c.mul(s)));
  }
  div(s) {
    return this.scale(new GF256(1).div(s));
  }
  static monic_linear(c) {
    return new Polynomial2([c, GF256.one()]);
  }
  static zero() {
    return new Polynomial2([]);
  }
  static one() {
    return new Polynomial2([GF256.one()]);
  }
  static interpolate(coordinates) {
    if (coordinates.length < 1)
      throw new Error("At least one coefficient is required");
    if (hasDuplicates(coordinates.map(({ x }) => x.value)))
      throw new Error("Coefficients must have unique x values");
    return coordinates.reduce((sum, { x: x_j, y: y_j }, j) => sum.add(coordinates.filter((_, i) => i !== j).reduce((product, { x: x_i }) => product.mul(Polynomial2.monic_linear(x_i.neg()).div(x_j.sub(x_i))), Polynomial2.one()).scale(y_j)), Polynomial2.zero());
  }
  static combine(coordinates) {
    if (coordinates.length < 1)
      throw new Error("At least one coefficient is required");
    if (hasDuplicates(coordinates.map(({ x }) => x.value)))
      throw new Error("Coefficients must have unique x values");
    const quotient = coordinates.reduce((sum, { x: x_j, y: y_j }, j) => {
      const denominator = x_j.mul(coordinates.filter((_, i) => i !== j).reduce((product, { x: x_i }) => product.mul(x_i.sub(x_j)), GF256.one()));
      return sum.add(y_j.div(denominator));
    }, GF256.zero());
    return coordinates.reduce((product, { x }) => product.mul(x), GF256.one()).mul(quotient);
  }
  evaluate(x) {
    return this.coefficients.toReversed().reduce((sum, coefficient) => sum.mul(x).add(coefficient), GF256.zero());
  }
};
function toInternalShare(share2) {
  return {
    index: new GF256(share2.index),
    share: Array.from(share2.share, (byte) => new GF256(byte))
  };
}
function toShare(internalShare) {
  return {
    index: internalShare.index.value,
    share: new Uint8Array(internalShare.share.map((byte) => byte.value))
  };
}
function samplePolynomial(constant, degree) {
  const randomCoefficients = new Uint8Array(degree);
  crypto.getRandomValues(randomCoefficients);
  return Polynomial.fromBytes(new Uint8Array([constant.value, ...randomCoefficients]));
}
function split2(secret, threshold, total) {
  if (threshold > total || threshold < 1 || total >= GF256_SIZE)
    throw new Error(`Invalid threshold ${threshold} or total ${total}`);
  const polynomials = Array.from(secret, (s) => samplePolynomial(new GF256(s), threshold - 1));
  return Array.from({ length: total }, (_, i) => {
    const index = new GF256(i + 1);
    return toShare({
      index,
      share: polynomials.map((p) => p.evaluate(index))
    });
  });
}
function validateShares(shares) {
  if (shares.length < 1)
    throw new Error("At least one share is required");
  if (!allEqual(shares.map(({ share: share2 }) => share2.length)))
    throw new Error("All shares must have the same length");
  if (hasDuplicates(shares.map(({ index }) => index)))
    throw new Error("Shares must have unique indices");
  const internalShares = shares.map(toInternalShare);
  return {
    internalShares,
    length: internalShares[0].share.length
  };
}
function combine(shares) {
  const { internalShares, length } = validateShares(shares);
  return new Uint8Array(Array.from({ length }, (_, i) => Polynomial.combine(internalShares.map(({ index, share: share2 }) => ({
    x: index,
    y: share2[i]
  }))).value));
}
function interpolate(shares) {
  const { internalShares, length } = validateShares(shares);
  const polynomials = Array.from({ length }, (_, i) => Polynomial.interpolate(internalShares.map(({ index, share: share2 }) => ({
    x: index,
    y: share2[i]
  }))));
  return (x) => {
    return new Uint8Array(polynomials.map((p) => p.evaluate(new GF256(x)).value));
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/encrypt.mjs
async function encrypt({ keyServers, kemType, threshold, packageId, id, encryptionInput }) {
  if (threshold <= 0 || threshold >= MAX_U8 || keyServers.length < threshold || keyServers.length >= MAX_U8)
    throw new UserError2(`Invalid key servers or threshold ${threshold} for ${keyServers.length} key servers for package ${packageId}`);
  const baseKey = await encryptionInput.generateKey();
  const shares = split2(baseKey, threshold, keyServers.length);
  const encryptedShares = encryptBatched(keyServers, kemType, fromHex(createFullId(packageId, id)), shares, baseKey, threshold);
  const demKey = deriveKey(KeyPurpose.DEM, baseKey, encryptedShares.BonehFranklinBLS12381.encryptedShares, threshold, keyServers.map(({ objectId }) => objectId));
  const ciphertext = await encryptionInput.encrypt(demKey);
  const services = keyServers.map(({ objectId }, i) => [objectId, shares[i].index]);
  return {
    encryptedObject: EncryptedObject.serialize({
      version: 0,
      packageId,
      id,
      services,
      threshold,
      encryptedShares,
      ciphertext
    }).toBytes(),
    key: new Uint8Array(demKey)
  };
}
var KemType = /* @__PURE__ */ function(KemType$1) {
  KemType$1[KemType$1["BonehFranklinBLS12381DemCCA"] = 0] = "BonehFranklinBLS12381DemCCA";
  return KemType$1;
}({});
var DemType = /* @__PURE__ */ function(DemType$1) {
  DemType$1[DemType$1["AesGcm256"] = 0] = "AesGcm256";
  DemType$1[DemType$1["Hmac256Ctr"] = 1] = "Hmac256Ctr";
  return DemType$1;
}({});
function encryptBatched(keyServers, kemType, id, shares, baseKey, threshold) {
  switch (kemType) {
    case KemType.BonehFranklinBLS12381DemCCA:
      return new BonehFranklinBLS12381Services(keyServers).encryptBatched(id, shares, baseKey, threshold);
    default:
      throw new Error(`Invalid KEM type ${kemType}`);
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/dem.mjs
var iv = Uint8Array.from([
  138,
  55,
  153,
  253,
  198,
  46,
  121,
  219,
  160,
  128,
  89,
  7,
  214,
  156,
  148,
  220
]);
async function generateAesKey() {
  const key = await crypto.subtle.generateKey({
    name: "AES-GCM",
    length: 256
  }, true, ["encrypt", "decrypt"]);
  return await crypto.subtle.exportKey("raw", key).then((keyData) => new Uint8Array(keyData));
}
var AesGcm256 = class {
  constructor(msg, aad) {
    this.plaintext = msg;
    this.aad = aad;
  }
  generateKey() {
    return generateAesKey();
  }
  async encrypt(key) {
    if (key.length !== 32)
      throw new Error("Key must be 32 bytes");
    const aesCryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
    return { Aes256Gcm: {
      blob: new Uint8Array(await crypto.subtle.encrypt({
        name: "AES-GCM",
        iv,
        additionalData: this.aad
      }, aesCryptoKey, this.plaintext)),
      aad: this.aad ?? []
    } };
  }
  static async decrypt(key, ciphertext) {
    if (!("Aes256Gcm" in ciphertext))
      throw new InvalidCiphertextError(`Invalid ciphertext ${JSON.stringify(ciphertext)}`);
    if (key.length !== 32)
      throw new Error("Key must be 32 bytes");
    try {
      const aesCryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
      return new Uint8Array(await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv,
        additionalData: new Uint8Array(ciphertext.Aes256Gcm.aad ?? [])
      }, aesCryptoKey, new Uint8Array(ciphertext.Aes256Gcm.blob)));
    } catch {
      throw new DecryptionError(`Decryption failed`);
    }
  }
};
var Hmac256Ctr = class Hmac256Ctr2 {
  constructor(msg, aad) {
    this.plaintext = msg;
    this.aad = aad;
  }
  generateKey() {
    return generateAesKey();
  }
  async encrypt(key) {
    const blob = Hmac256Ctr2.encryptInCtrMode(key, this.plaintext);
    return { Hmac256Ctr: {
      blob,
      mac: Hmac256Ctr2.computeMac(key, this.aad, blob),
      aad: this.aad ?? []
    } };
  }
  static async decrypt(key, ciphertext) {
    if (!("Hmac256Ctr" in ciphertext))
      throw new InvalidCiphertextError(`Invalid ciphertext ${JSON.stringify(ciphertext)}`);
    if (key.length !== 32)
      throw new Error("Key must be 32 bytes");
    const aad = new Uint8Array(ciphertext.Hmac256Ctr.aad ?? []);
    const blob = new Uint8Array(ciphertext.Hmac256Ctr.blob);
    const mac = Hmac256Ctr2.computeMac(key, aad, blob);
    if (!equalBytes(mac, new Uint8Array(ciphertext.Hmac256Ctr.mac)))
      throw new DecryptionError(`Invalid MAC ${mac}`);
    return Hmac256Ctr2.encryptInCtrMode(key, blob);
  }
  static computeMac(key, aad, ciphertext) {
    return hmac(sha3_256, key, flatten([
      MacKeyTag,
      toBytes(aad.length),
      aad,
      ciphertext
    ]));
  }
  static encryptInCtrMode(key, msg) {
    const blockSize = 32;
    const result = new Uint8Array(msg.length);
    for (let i = 0;i * blockSize < msg.length; i++) {
      const encryptedBlock = xorUnchecked(msg.subarray(i * blockSize, (i + 1) * blockSize), hmac(sha3_256, key, flatten([EncryptionKeyTag, toBytes(i)])));
      result.set(encryptedBlock, i * blockSize);
    }
    return result;
  }
};
function toBytes(n) {
  return bcs.u64().serialize(n).toBytes();
}
var EncryptionKeyTag = new TextEncoder().encode("HMAC-CTR-ENC");
var MacKeyTag = new TextEncoder().encode("HMAC-CTR-MAC");

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/decrypt.mjs
async function decrypt({ encryptedObject, keys, publicKeys, checkLEEncoding }) {
  if (!encryptedObject.encryptedShares.BonehFranklinBLS12381)
    throw new UnsupportedFeatureError("Encryption mode not supported");
  const fullId = createFullId(encryptedObject.packageId, encryptedObject.id);
  const inKeystore = encryptedObject.services.map((_, i) => i).filter((i) => keys.has(`${fullId}:${encryptedObject.services[i][0]}`));
  if (inKeystore.length < encryptedObject.threshold)
    throw new Error("Not enough shares. Please fetch more keys.");
  const encryptedShares = encryptedObject.encryptedShares.BonehFranklinBLS12381.encryptedShares;
  if (encryptedShares.length !== encryptedObject.services.length)
    throw new InvalidCiphertextError(`Mismatched shares ${encryptedShares.length} and services ${encryptedObject.services.length}`);
  const nonce = G2Element.fromBytes(encryptedObject.encryptedShares.BonehFranklinBLS12381.nonce);
  const shares = inKeystore.map((i) => {
    const [objectId, index] = encryptedObject.services[i];
    return {
      index,
      share: BonehFranklinBLS12381Services.decrypt(nonce, keys.get(`${fullId}:${objectId}`), encryptedShares[i], fromHex(fullId), [objectId, index])
    };
  });
  const baseKey = combine(shares);
  const randomnessKey = deriveKey(KeyPurpose.EncryptedRandomness, baseKey, encryptedShares, encryptedObject.threshold, encryptedObject.services.map(([objectIds, _]) => objectIds));
  const randomness = decryptRandomness(encryptedObject.encryptedShares.BonehFranklinBLS12381.encryptedRandomness, randomnessKey);
  if (!(checkLEEncoding ? verifyNonceWithLE(nonce, randomness) : verifyNonce(nonce, randomness)))
    throw new InvalidCiphertextError("Invalid nonce");
  if (publicKeys !== undefined) {
    const polynomial = interpolate(shares);
    if (BonehFranklinBLS12381Services.decryptAllSharesUsingRandomness(randomness, encryptedShares, encryptedObject.services, publicKeys, nonce, fromHex(fullId)).some(({ index, share: share2 }) => !equals(polynomial(index), share2)))
      throw new InvalidCiphertextError("Invalid shares");
  }
  const demKey = deriveKey(KeyPurpose.DEM, baseKey, encryptedShares, encryptedObject.threshold, encryptedObject.services.map(([objectId, _]) => objectId));
  if (encryptedObject.ciphertext.Aes256Gcm)
    return AesGcm256.decrypt(demKey, encryptedObject.ciphertext);
  else if (encryptedObject.ciphertext.Hmac256Ctr)
    return Hmac256Ctr.decrypt(demKey, encryptedObject.ciphertext);
  else
    throw new InvalidCiphertextError("Invalid ciphertext type");
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/version.mjs
var PACKAGE_VERSION2 = "1.0.1";

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/elgamal.mjs
function elgamalDecrypt(sk, [c0, c1]) {
  return decrypt2(Scalar.fromBytes(sk), [G1Element.fromBytes(c0), G1Element.fromBytes(c1)]).toBytes();
}
function decrypt2(sk, [c0, c1]) {
  return c1.subtract(c0.multiply(sk));
}
function generateSecretKey() {
  return Scalar.random().toBytes();
}
function toPublicKey(sk) {
  return G1Element.generator().multiply(Scalar.fromBytes(sk)).toBytes();
}
function toVerificationKey(sk) {
  return G2Element.generator().multiply(Scalar.fromBytes(sk)).toBytes();
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/key-server.mjs
var SUPPORTED_SERVER_VERSIONS = [2, 1];
var KeyType = /* @__PURE__ */ function(KeyType$1) {
  KeyType$1[KeyType$1["BonehFranklinBLS12381"] = 0] = "BonehFranklinBLS12381";
  return KeyType$1;
}({});
var SERVER_VERSION_REQUIREMENT = new Version("0.4.1");
async function retrieveKeyServers({ objectIds, client, configs }) {
  return await Promise.all(objectIds.map(async (objectId) => {
    const res = await client.core.getObject({
      objectId,
      include: { content: true }
    });
    const ks = KeyServerMove.parse(res.object.content);
    const firstVersion = Number(ks.firstVersion);
    const lastVersion = Number(ks.lastVersion);
    const version = SUPPORTED_SERVER_VERSIONS.find((v) => v >= firstVersion && v <= lastVersion);
    if (version === undefined)
      throw new InvalidKeyServerVersionError(`Key server ${objectId} supports versions between ${ks.firstVersion} and ${ks.lastVersion} (inclusive), but SDK expects one of ${SUPPORTED_SERVER_VERSIONS.join(", ")}`);
    const versionedKeyServer = await client.core.getDynamicField({
      parentId: objectId,
      name: {
        type: "u64",
        bcs: bcs.u64().serialize(version).toBytes()
      }
    });
    switch (version) {
      case 2: {
        const ksV2 = KeyServerMoveV2.parse(versionedKeyServer.dynamicField.value.bcs);
        if (ksV2.keyType !== KeyType.BonehFranklinBLS12381)
          throw new InvalidKeyServerError(`Server ${objectId} has invalid key type: ${ksV2.keyType}`);
        switch (ksV2.serverType.$kind) {
          case "Independent":
            if (configs.get(objectId)?.aggregatorUrl)
              throw new InvalidClientOptionsError(`Independent server ${objectId} should not have aggregatorUrl in config`);
            return {
              objectId,
              name: ksV2.name,
              url: ksV2.serverType.Independent.url,
              keyType: ksV2.keyType,
              pk: new Uint8Array(ksV2.pk),
              serverType: "Independent"
            };
          case "Committee": {
            const config = configs.get(objectId);
            if (!config?.aggregatorUrl)
              throw new InvalidClientOptionsError(`Committee server ${objectId} requires aggregatorUrl in config`);
            return {
              objectId,
              name: ksV2.name,
              url: config.aggregatorUrl,
              keyType: ksV2.keyType,
              pk: new Uint8Array(ksV2.pk),
              serverType: "Committee"
            };
          }
          default:
            throw new InvalidKeyServerError(`Unknown server type for ${objectId}`);
        }
      }
      case 1: {
        const ksV1 = KeyServerMoveV1.parse(versionedKeyServer.dynamicField.value.bcs);
        if (ksV1.keyType !== KeyType.BonehFranklinBLS12381)
          throw new InvalidKeyServerError(`Server ${objectId} has invalid key type: ${ksV1.keyType}`);
        if (configs.get(objectId)?.aggregatorUrl)
          throw new InvalidClientOptionsError(`V1 server ${objectId} is always Independent and should not have aggregatorUrl in config`);
        return {
          objectId,
          name: ksV1.name,
          url: ksV1.url,
          keyType: ksV1.keyType,
          pk: new Uint8Array(ksV1.pk),
          serverType: "Independent"
        };
      }
      default:
        throw new InvalidKeyServerVersionError(`Unsupported key server version: ${version}`);
    }
  }));
}
async function verifyKeyServer(server, timeout, apiKeyName, apiKey) {
  const requestId = crypto.randomUUID();
  const response = await fetch(server.url + "/v1/service?service_id=" + server.objectId, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Request-Id": requestId,
      "Client-Sdk-Type": "typescript",
      "Client-Sdk-Version": PACKAGE_VERSION2,
      ...apiKeyName && apiKey ? { [apiKeyName]: apiKey } : {}
    },
    signal: AbortSignal.timeout(timeout)
  });
  await SealAPIError.assertResponse(response, requestId);
  verifyKeyServerVersion(response);
  const serviceResponse = await response.json();
  if (serviceResponse.service_id !== server.objectId)
    return false;
  const fullMsg = flatten([
    DST_POP,
    server.pk,
    fromHex(server.objectId)
  ]);
  return bls12_381.shortSignatures.verify(fromBase64(serviceResponse.pop), bls12_381.shortSignatures.hash(fullMsg), server.pk);
}
function verifyKeyServerVersion(response) {
  const keyServerVersion = response.headers.get("X-KeyServer-Version");
  if (keyServerVersion == null)
    throw new InvalidKeyServerVersionError("Key server version not found");
  if (new Version(keyServerVersion).older_than(SERVER_VERSION_REQUIREMENT))
    throw new InvalidKeyServerVersionError(`Key server version ${keyServerVersion} is not supported`);
}
var BonehFranklinBLS12381DerivedKey = class {
  constructor(key) {
    this.key = key;
    this.representation = toHex(key.toBytes());
  }
  toString() {
    return this.representation;
  }
};
async function fetchKeysForAllIds({ url, requestSignature, transactionBytes, encKey, encKeyPk, encVerificationKey, certificate, timeout, apiKeyName, apiKey, signal }) {
  const body = {
    ptb: toBase64(transactionBytes.slice(1)),
    enc_key: toBase64(encKeyPk),
    enc_verification_key: toBase64(encVerificationKey),
    request_signature: requestSignature,
    certificate
  };
  const timeoutSignal = AbortSignal.timeout(timeout);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  const requestId = crypto.randomUUID();
  const response = await fetch(url + "/v1/fetch_key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Request-Id": requestId,
      "Client-Sdk-Type": "typescript",
      "Client-Sdk-Version": PACKAGE_VERSION2,
      ...apiKeyName && apiKey ? { [apiKeyName]: apiKey } : {}
    },
    body: JSON.stringify(body),
    signal: combinedSignal
  });
  await SealAPIError.assertResponse(response, requestId);
  const resp = await response.json();
  verifyKeyServerVersion(response);
  return resp.decryption_keys.map((dk) => ({
    fullId: toHex(dk.id),
    key: elgamalDecrypt(encKey, dk.encrypted_key.map(fromBase64))
  }));
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/client.mjs
var SealClient = class {
  #suiClient;
  #configs;
  #keyServers = null;
  #verifyKeyServers;
  #cachedKeys = /* @__PURE__ */ new Map;
  #cachedPublicKeys = /* @__PURE__ */ new Map;
  #timeout;
  #totalWeight;
  constructor(options) {
    this.#suiClient = options.suiClient;
    if (new Set(options.serverConfigs.map((s) => s.objectId)).size !== options.serverConfigs.length)
      throw new InvalidClientOptionsError("Duplicate object IDs");
    if (options.serverConfigs.some((s) => s.apiKeyName && !s.apiKey || !s.apiKeyName && s.apiKey))
      throw new InvalidClientOptionsError("Both apiKeyName and apiKey must be provided or not provided for all key servers");
    this.#configs = new Map(options.serverConfigs.map((server) => [server.objectId, server]));
    this.#totalWeight = options.serverConfigs.map((server) => server.weight).reduce((sum, term) => sum + term, 0);
    this.#verifyKeyServers = options.verifyKeyServers ?? true;
    this.#timeout = options.timeout ?? 1e4;
  }
  async encrypt({ kemType = KemType.BonehFranklinBLS12381DemCCA, demType = DemType.AesGcm256, threshold, packageId, id, data, aad = new Uint8Array }) {
    const packageObj = await this.#suiClient.core.getObject({ objectId: packageId });
    if (String(packageObj.object.version) !== "1")
      throw new InvalidPackageError(`Package ${packageId} is not the first version`);
    return encrypt({
      keyServers: await this.#getWeightedKeyServers(),
      kemType,
      threshold,
      packageId,
      id,
      encryptionInput: this.#createEncryptionInput(demType, data, aad)
    });
  }
  #createEncryptionInput(type, data, aad) {
    switch (type) {
      case DemType.AesGcm256:
        return new AesGcm256(data, aad);
      case DemType.Hmac256Ctr:
        return new Hmac256Ctr(data, aad);
    }
  }
  async decrypt({ data, sessionKey, txBytes, checkShareConsistency, checkLEEncoding }) {
    const encryptedObject = EncryptedObject.parse(data);
    this.#validateEncryptionServices(encryptedObject.services.map((s) => s[0]), encryptedObject.threshold);
    await this.fetchKeys({
      ids: [encryptedObject.id],
      txBytes,
      sessionKey,
      threshold: encryptedObject.threshold
    });
    if (checkShareConsistency) {
      const publicKeys = await this.getPublicKeys(encryptedObject.services.map(([objectId, _]) => objectId));
      return decrypt({
        encryptedObject,
        keys: this.#cachedKeys,
        publicKeys,
        checkLEEncoding: false
      });
    }
    return decrypt({
      encryptedObject,
      keys: this.#cachedKeys,
      checkLEEncoding
    });
  }
  #weight(objectId) {
    return this.#configs.get(objectId)?.weight ?? 0;
  }
  #validateEncryptionServices(services, threshold) {
    if (services.some((objectId) => {
      const countInClient = this.#weight(objectId);
      return countInClient > 0 && countInClient !== count(services, objectId);
    }))
      throw new InconsistentKeyServersError(`Client's key servers must be a subset of the encrypted object's key servers`);
    if (threshold > this.#totalWeight)
      throw new InvalidThresholdError(`Invalid threshold ${threshold} for ${this.#totalWeight} servers`);
  }
  async getKeyServers() {
    if (!this.#keyServers)
      this.#keyServers = this.#loadKeyServers().catch((error) => {
        this.#keyServers = null;
        throw error;
      });
    return this.#keyServers;
  }
  async getPublicKeys(services) {
    const keyServers = await this.getKeyServers();
    const missingKeyServers = services.filter((objectId) => !keyServers.has(objectId) && !this.#cachedPublicKeys.has(objectId));
    if (missingKeyServers.length > 0)
      (await retrieveKeyServers({
        objectIds: missingKeyServers,
        client: this.#suiClient,
        configs: this.#configs
      })).forEach((keyServer) => this.#cachedPublicKeys.set(keyServer.objectId, G2Element.fromBytes(keyServer.pk)));
    return services.map((objectId) => {
      const keyServer = keyServers.get(objectId);
      if (keyServer)
        return G2Element.fromBytes(keyServer.pk);
      return this.#cachedPublicKeys.get(objectId);
    });
  }
  async#getWeightedKeyServers() {
    const keyServers = await this.getKeyServers();
    const keyServersWithMultiplicity = [];
    for (const [objectId, config] of this.#configs) {
      const keyServer = keyServers.get(objectId);
      for (let i = 0;i < config.weight; i++)
        keyServersWithMultiplicity.push(keyServer);
    }
    return keyServersWithMultiplicity;
  }
  async#loadKeyServers() {
    const keyServers = await retrieveKeyServers({
      objectIds: [...this.#configs.keys()],
      client: this.#suiClient,
      configs: this.#configs
    });
    if (keyServers.length === 0)
      throw new InvalidKeyServerError("No key servers found");
    if (this.#verifyKeyServers)
      await Promise.all(keyServers.map(async (server) => {
        if (server.serverType === "Committee")
          return;
        const config = this.#configs.get(server.objectId);
        if (!await verifyKeyServer(server, this.#timeout, config?.apiKeyName, config?.apiKey))
          throw new InvalidKeyServerError(`Key server ${server.objectId} is not valid`);
      }));
    return new Map(keyServers.map((server) => [server.objectId, server]));
  }
  async fetchKeys({ ids, txBytes, sessionKey, threshold }) {
    if (threshold > this.#totalWeight || threshold < 1)
      throw new InvalidThresholdError(`Invalid threshold ${threshold} servers with weights ${JSON.stringify(this.#configs)}`);
    const keyServers = await this.getKeyServers();
    const fullIds = ids.map((id) => createFullId(sessionKey.getPackageId(), id));
    let completedWeight = 0;
    const remainingKeyServers = [];
    let remainingKeyServersWeight = 0;
    for (const objectId of keyServers.keys())
      if (fullIds.every((fullId) => this.#cachedKeys.has(`${fullId}:${objectId}`)))
        completedWeight += this.#weight(objectId);
      else {
        remainingKeyServers.push(objectId);
        remainingKeyServersWeight += this.#weight(objectId);
      }
    if (completedWeight >= threshold)
      return;
    const certificate = await sessionKey.getCertificate();
    const signedRequest = await sessionKey.createRequestParams(txBytes);
    const controller = new AbortController;
    const errors = [];
    const keyFetches = remainingKeyServers.map(async (objectId) => {
      const server = keyServers.get(objectId);
      try {
        const config = this.#configs.get(objectId);
        const allKeys = await fetchKeysForAllIds({
          url: server.url,
          requestSignature: signedRequest.requestSignature,
          transactionBytes: txBytes,
          encKey: signedRequest.encKey,
          encKeyPk: signedRequest.encKeyPk,
          encVerificationKey: signedRequest.encVerificationKey,
          certificate,
          timeout: this.#timeout,
          apiKeyName: config?.apiKeyName,
          apiKey: config?.apiKey,
          signal: controller.signal
        });
        for (const { fullId, key } of allKeys) {
          const keyElement = G1Element.fromBytes(key);
          if (!BonehFranklinBLS12381Services.verifyUserSecretKey(keyElement, fullId, G2Element.fromBytes(server.pk))) {
            console.warn("Received invalid key from key server " + server.objectId);
            continue;
          }
          this.#cachedKeys.set(`${fullId}:${server.objectId}`, keyElement);
        }
        if (fullIds.every((fullId) => this.#cachedKeys.has(`${fullId}:${server.objectId}`))) {
          completedWeight += this.#weight(objectId);
          if (completedWeight >= threshold)
            controller.abort();
        }
      } catch (error) {
        if (!controller.signal.aborted)
          errors.push(error);
      } finally {
        remainingKeyServersWeight -= this.#weight(objectId);
        if (remainingKeyServersWeight < threshold - completedWeight)
          controller.abort(new TooManyFailedFetchKeyRequestsError);
      }
    });
    await Promise.allSettled(keyFetches);
    if (completedWeight < threshold)
      throw toMajorityError2(errors);
  }
  async getDerivedKeys({ kemType = KemType.BonehFranklinBLS12381DemCCA, id, txBytes, sessionKey, threshold }) {
    switch (kemType) {
      case KemType.BonehFranklinBLS12381DemCCA:
        const keyServers = await this.getKeyServers();
        if (threshold > this.#totalWeight)
          throw new InvalidThresholdError(`Invalid threshold ${threshold} for ${this.#totalWeight} servers`);
        await this.fetchKeys({
          ids: [id],
          txBytes,
          sessionKey,
          threshold
        });
        const fullId = createFullId(sessionKey.getPackageId(), id);
        const derivedKeys = /* @__PURE__ */ new Map;
        let weight = 0;
        for (const objectId of keyServers.keys()) {
          const cachedKey = this.#cachedKeys.get(`${fullId}:${objectId}`);
          if (cachedKey) {
            derivedKeys.set(objectId, new BonehFranklinBLS12381DerivedKey(cachedKey));
            weight += this.#weight(objectId);
            if (weight >= threshold)
              break;
          }
        }
        return derivedKeys;
    }
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/cryptography/signature-scheme.mjs
var SIGNATURE_SCHEME_TO_FLAG = {
  ED25519: 0,
  Secp256k1: 1,
  Secp256r1: 2,
  MultiSig: 3,
  ZkLogin: 5,
  Passkey: 6
};
var SIGNATURE_SCHEME_TO_SIZE = {
  ED25519: 32,
  Secp256k1: 33,
  Secp256r1: 33,
  Passkey: 33
};
var SIGNATURE_FLAG_TO_SCHEME = {
  0: "ED25519",
  1: "Secp256k1",
  2: "Secp256r1",
  3: "MultiSig",
  5: "ZkLogin",
  6: "Passkey"
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/cryptography/intent.mjs
function messageWithIntent(scope, message) {
  return suiBcs.IntentMessage(suiBcs.bytes(message.length)).serialize({
    intent: {
      scope: { [scope]: true },
      version: { V0: true },
      appId: { Sui: true }
    },
    value: message
  }).toBytes();
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/cryptography/publickey.mjs
function bytesEqual(a, b) {
  if (a === b)
    return true;
  if (a.length !== b.length)
    return false;
  for (let i = 0;i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}
var PublicKey2 = class {
  equals(publicKey) {
    return bytesEqual(this.toRawBytes(), publicKey.toRawBytes());
  }
  toBase64() {
    return toBase64(this.toRawBytes());
  }
  toString() {
    throw new Error("`toString` is not implemented on public keys. Use `toBase64()` or `toRawBytes()` instead.");
  }
  toSuiPublicKey() {
    return toBase64(this.toSuiBytes());
  }
  verifyWithIntent(bytes, signature, intent) {
    const digest = blake2b(messageWithIntent(intent, bytes), { dkLen: 32 });
    return this.verify(digest, signature);
  }
  verifyPersonalMessage(message, signature) {
    return this.verifyWithIntent(suiBcs.byteVector().serialize(message).toBytes(), signature, "PersonalMessage");
  }
  verifyTransaction(transaction, signature) {
    return this.verifyWithIntent(transaction, signature, "TransactionData");
  }
  verifyAddress(address) {
    return this.toSuiAddress() === address;
  }
  toSuiBytes() {
    const rawBytes = this.toRawBytes();
    const suiBytes = new Uint8Array(rawBytes.length + 1);
    suiBytes.set([this.flag()]);
    suiBytes.set(rawBytes, 1);
    return suiBytes;
  }
  toSuiAddress() {
    return normalizeSuiAddress(bytesToHex(blake2b(this.toSuiBytes(), { dkLen: 32 })).slice(0, SUI_ADDRESS_LENGTH * 2));
  }
};
function parseSerializedKeypairSignature(serializedSignature) {
  const bytes = fromBase64(serializedSignature);
  const signatureScheme = SIGNATURE_FLAG_TO_SCHEME[bytes[0]];
  switch (signatureScheme) {
    case "ED25519":
    case "Secp256k1":
    case "Secp256r1":
      const size = SIGNATURE_SCHEME_TO_SIZE[signatureScheme];
      const signature = bytes.slice(1, bytes.length - size);
      return {
        serializedSignature,
        signatureScheme,
        signature,
        publicKey: bytes.slice(1 + signature.length),
        bytes
      };
    default:
      throw new Error("Unsupported signature scheme");
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/abstract/edwards.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n9 = BigInt(0);
var _1n9 = BigInt(1);
var _2n7 = BigInt(2);
var _8n2 = BigInt(8);
function isEdValidXY(Fp3, CURVE, x, y) {
  const x2 = Fp3.sqr(x);
  const y2 = Fp3.sqr(y);
  const left = Fp3.add(Fp3.mul(CURVE.a, x2), y2);
  const right = Fp3.add(Fp3.ONE, Fp3.mul(CURVE.d, Fp3.mul(x2, y2)));
  return Fp3.eql(left, right);
}
function edwards(params, extraOpts = {}) {
  const validated = createCurveFields("edwards", params, extraOpts, extraOpts.FpFnLE);
  const { Fp: Fp3, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor } = CURVE;
  validateObject(extraOpts, {}, { uvRatio: "function" });
  const MASK = _2n7 << BigInt(Fn.BYTES * 8) - _1n9;
  const modP = (n) => Fp3.create(n);
  const uvRatio = extraOpts.uvRatio || ((u, v) => {
    try {
      return { isValid: true, value: Fp3.sqrt(Fp3.div(u, v)) };
    } catch (e) {
      return { isValid: false, value: _0n9 };
    }
  });
  if (!isEdValidXY(Fp3, CURVE, CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  function acoord(title, n, banZero = false) {
    const min = banZero ? _1n9 : _0n9;
    aInRange("coordinate " + title, n, min, MASK);
    return n;
  }
  function aedpoint(other) {
    if (!(other instanceof Point))
      throw new Error("EdwardsPoint expected");
  }
  const toAffineMemo = memoized((p, iz) => {
    const { X, Y, Z } = p;
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? _8n2 : Fp3.inv(Z);
    const x = modP(X * iz);
    const y = modP(Y * iz);
    const zz = Fp3.mul(Z, iz);
    if (is0)
      return { x: _0n9, y: _1n9 };
    if (zz !== _1n9)
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p) => {
    const { a, d } = CURVE;
    if (p.is0())
      throw new Error("bad point: ZERO");
    const { X, Y, Z, T } = p;
    const X2 = modP(X * X);
    const Y2 = modP(Y * Y);
    const Z2 = modP(Z * Z);
    const Z4 = modP(Z2 * Z2);
    const aX2 = modP(X2 * a);
    const left = modP(Z2 * modP(aX2 + Y2));
    const right = modP(Z4 + modP(d * modP(X2 * Y2)));
    if (left !== right)
      throw new Error("bad point: equation left != right (1)");
    const XY = modP(X * Y);
    const ZT = modP(Z * T);
    if (XY !== ZT)
      throw new Error("bad point: equation left != right (2)");
    return true;
  });

  class Point {
    static BASE = new Point(CURVE.Gx, CURVE.Gy, _1n9, modP(CURVE.Gx * CURVE.Gy));
    static ZERO = new Point(_0n9, _1n9, _1n9, _0n9);
    static Fp = Fp3;
    static Fn = Fn;
    X;
    Y;
    Z;
    T;
    constructor(X, Y, Z, T) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y);
      this.Z = acoord("z", Z, true);
      this.T = acoord("t", T);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    static fromAffine(p) {
      if (p instanceof Point)
        throw new Error("extended point not allowed");
      const { x, y } = p || {};
      acoord("x", x);
      acoord("y", y);
      return new Point(x, y, _1n9, modP(x * y));
    }
    static fromBytes(bytes, zip215 = false) {
      const len = Fp3.BYTES;
      const { a, d } = CURVE;
      bytes = copyBytes(abytes2(bytes, len, "point"));
      abool(zip215, "zip215");
      const normed = copyBytes(bytes);
      const lastByte = bytes[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max = zip215 ? MASK : Fp3.ORDER;
      aInRange("point.y", y, _0n9, max);
      const y2 = modP(y * y);
      const u = modP(y2 - _1n9);
      const v = modP(d * y2 - a);
      let { isValid, value: x } = uvRatio(u, v);
      if (!isValid)
        throw new Error("bad point: invalid y coordinate");
      const isXOdd = (x & _1n9) === _1n9;
      const isLastByteOdd = (lastByte & 128) !== 0;
      if (!zip215 && x === _0n9 && isLastByteOdd)
        throw new Error("bad point: x=0 and x_0=1");
      if (isLastByteOdd !== isXOdd)
        x = modP(-x);
      return Point.fromAffine({ x, y });
    }
    static fromHex(hex2, zip215 = false) {
      return Point.fromBytes(hexToBytes(hex2), zip215);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_2n7);
      return this;
    }
    assertValidity() {
      assertValidMemo(this);
    }
    equals(other) {
      aedpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const X1Z2 = modP(X1 * Z2);
      const X2Z1 = modP(X2 * Z1);
      const Y1Z2 = modP(Y1 * Z2);
      const Y2Z1 = modP(Y2 * Z1);
      return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    negate() {
      return new Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
    }
    double() {
      const { a } = CURVE;
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const A = modP(X1 * X1);
      const B = modP(Y1 * Y1);
      const C = modP(_2n7 * modP(Z1 * Z1));
      const D = modP(a * A);
      const x1y1 = X1 + Y1;
      const E = modP(modP(x1y1 * x1y1) - A - B);
      const G = D + B;
      const F = G - C;
      const H = D - B;
      const X3 = modP(E * F);
      const Y3 = modP(G * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G);
      return new Point(X3, Y3, Z3, T3);
    }
    add(other) {
      aedpoint(other);
      const { a, d } = CURVE;
      const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
      const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
      const A = modP(X1 * X2);
      const B = modP(Y1 * Y2);
      const C = modP(T1 * d * T2);
      const D = modP(Z1 * Z2);
      const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
      const F = D - C;
      const G = D + C;
      const H = modP(B - a * A);
      const X3 = modP(E * F);
      const Y3 = modP(G * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G);
      return new Point(X3, Y3, Z3, T3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    multiply(scalar) {
      if (!Fn.isValidNot0(scalar))
        throw new Error("invalid scalar: expected 1 <= sc < curve.n");
      const { p, f } = wnaf.cached(this, scalar, (p2) => normalizeZ(Point, p2));
      return normalizeZ(Point, [p, f])[0];
    }
    multiplyUnsafe(scalar, acc = Point.ZERO) {
      if (!Fn.isValid(scalar))
        throw new Error("invalid scalar: expected 0 <= sc < curve.n");
      if (scalar === _0n9)
        return Point.ZERO;
      if (this.is0() || scalar === _1n9)
        return this;
      return wnaf.unsafe(this, scalar, (p) => normalizeZ(Point, p), acc);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    isTorsionFree() {
      return wnaf.unsafe(this, CURVE.n).is0();
    }
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    clearCofactor() {
      if (cofactor === _1n9)
        return this;
      return this.multiplyUnsafe(cofactor);
    }
    toBytes() {
      const { x, y } = this.toAffine();
      const bytes = Fp3.toBytes(y);
      bytes[bytes.length - 1] |= x & _1n9 ? 128 : 0;
      return bytes;
    }
    toHex() {
      return bytesToHex(this.toBytes());
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const wnaf = new wNAF(Point, Fn.BITS);
  Point.BASE.precompute(8);
  return Point;
}
function eddsa(Point, cHash, eddsaOpts = {}) {
  if (typeof cHash !== "function")
    throw new Error('"hash" function param is required');
  validateObject(eddsaOpts, {}, {
    adjustScalarBytes: "function",
    randomBytes: "function",
    domain: "function",
    prehash: "function",
    mapToCurve: "function"
  });
  const { prehash } = eddsaOpts;
  const { BASE, Fp: Fp3, Fn } = Point;
  const randomBytes2 = eddsaOpts.randomBytes || randomBytes;
  const adjustScalarBytes = eddsaOpts.adjustScalarBytes || ((bytes) => bytes);
  const domain = eddsaOpts.domain || ((data, ctx, phflag) => {
    abool(phflag, "phflag");
    if (ctx.length || phflag)
      throw new Error("Contexts/pre-hash are not supported");
    return data;
  });
  function modN_LE(hash) {
    return Fn.create(bytesToNumberLE(hash));
  }
  function getPrivateScalar(key) {
    const len = lengths.secretKey;
    abytes2(key, lengths.secretKey, "secretKey");
    const hashed = abytes2(cHash(key), 2 * len, "hashedSecretKey");
    const head = adjustScalarBytes(hashed.slice(0, len));
    const prefix = hashed.slice(len, 2 * len);
    const scalar = modN_LE(head);
    return { head, prefix, scalar };
  }
  function getExtendedPublicKey(secretKey) {
    const { head, prefix, scalar } = getPrivateScalar(secretKey);
    const point = BASE.multiply(scalar);
    const pointBytes = point.toBytes();
    return { head, prefix, scalar, point, pointBytes };
  }
  function getPublicKey(secretKey) {
    return getExtendedPublicKey(secretKey).pointBytes;
  }
  function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
    const msg = concatBytes(...msgs);
    return modN_LE(cHash(domain(msg, abytes2(context, undefined, "context"), !!prehash)));
  }
  function sign(msg, secretKey, options = {}) {
    msg = abytes2(msg, undefined, "message");
    if (prehash)
      msg = prehash(msg);
    const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
    const r = hashDomainToScalar(options.context, prefix, msg);
    const R = BASE.multiply(r).toBytes();
    const k = hashDomainToScalar(options.context, R, pointBytes, msg);
    const s = Fn.create(r + k * scalar);
    if (!Fn.isValid(s))
      throw new Error("sign failed: invalid s");
    const rs = concatBytes(R, Fn.toBytes(s));
    return abytes2(rs, lengths.signature, "result");
  }
  const verifyOpts = { zip215: true };
  function verify(sig, msg, publicKey, options = verifyOpts) {
    const { context, zip215 } = options;
    const len = lengths.signature;
    sig = abytes2(sig, len, "signature");
    msg = abytes2(msg, undefined, "message");
    publicKey = abytes2(publicKey, lengths.publicKey, "publicKey");
    if (zip215 !== undefined)
      abool(zip215, "zip215");
    if (prehash)
      msg = prehash(msg);
    const mid = len / 2;
    const r = sig.subarray(0, mid);
    const s = bytesToNumberLE(sig.subarray(mid, len));
    let A, R, SB;
    try {
      A = Point.fromBytes(publicKey, zip215);
      R = Point.fromBytes(r, zip215);
      SB = BASE.multiplyUnsafe(s);
    } catch (error) {
      return false;
    }
    if (!zip215 && A.isSmallOrder())
      return false;
    const k = hashDomainToScalar(context, R.toBytes(), A.toBytes(), msg);
    const RkA = R.add(A.multiplyUnsafe(k));
    return RkA.subtract(SB).clearCofactor().is0();
  }
  const _size = Fp3.BYTES;
  const lengths = {
    secretKey: _size,
    publicKey: _size,
    signature: 2 * _size,
    seed: _size
  };
  function randomSecretKey(seed = randomBytes2(lengths.seed)) {
    return abytes2(seed, lengths.seed, "seed");
  }
  function isValidSecretKey(key) {
    return isBytes2(key) && key.length === Fn.BYTES;
  }
  function isValidPublicKey(key, zip215) {
    try {
      return !!Point.fromBytes(key, zip215);
    } catch (error) {
      return false;
    }
  }
  const utils = {
    getExtendedPublicKey,
    randomSecretKey,
    isValidSecretKey,
    isValidPublicKey,
    toMontgomery(publicKey) {
      const { y } = Point.fromBytes(publicKey);
      const size = lengths.publicKey;
      const is25519 = size === 32;
      if (!is25519 && size !== 57)
        throw new Error("only defined for 25519 and 448");
      const u = is25519 ? Fp3.div(_1n9 + y, _1n9 - y) : Fp3.div(y - _1n9, y + _1n9);
      return Fp3.toBytes(u);
    },
    toMontgomerySecret(secretKey) {
      const size = lengths.secretKey;
      abytes2(secretKey, size);
      const hashed = cHash(secretKey.subarray(0, size));
      return adjustScalarBytes(hashed).subarray(0, size);
    }
  };
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, getPublicKey),
    getPublicKey,
    sign,
    verify,
    utils,
    Point,
    lengths
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/ed25519.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _1n10 = BigInt(1);
var _2n8 = BigInt(2);
var _5n2 = BigInt(5);
var _8n3 = BigInt(8);
var ed25519_CURVE_p = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
var ed25519_CURVE = /* @__PURE__ */ (() => ({
  p: ed25519_CURVE_p,
  n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
  h: _8n3,
  a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
  d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
  Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
  Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
}))();
function ed25519_pow_2_252_3(x) {
  const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
  const P = ed25519_CURVE_p;
  const x2 = x * x % P;
  const b2 = x2 * x % P;
  const b4 = pow2(b2, _2n8, P) * b2 % P;
  const b5 = pow2(b4, _1n10, P) * x % P;
  const b10 = pow2(b5, _5n2, P) * b5 % P;
  const b20 = pow2(b10, _10n, P) * b10 % P;
  const b40 = pow2(b20, _20n, P) * b20 % P;
  const b80 = pow2(b40, _40n, P) * b40 % P;
  const b160 = pow2(b80, _80n, P) * b80 % P;
  const b240 = pow2(b160, _80n, P) * b80 % P;
  const b250 = pow2(b240, _10n, P) * b10 % P;
  const pow_p_5_8 = pow2(b250, _2n8, P) * x % P;
  return { pow_p_5_8, b2 };
}
function adjustScalarBytes(bytes) {
  bytes[0] &= 248;
  bytes[31] &= 127;
  bytes[31] |= 64;
  return bytes;
}
var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
function uvRatio(u, v) {
  const P = ed25519_CURVE_p;
  const v3 = mod(v * v * v, P);
  const v7 = mod(v3 * v3 * v, P);
  const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
  let x = mod(u * v3 * pow, P);
  const vx2 = mod(v * x * x, P);
  const root1 = x;
  const root2 = mod(x * ED25519_SQRT_M1, P);
  const useRoot1 = vx2 === u;
  const useRoot2 = vx2 === mod(-u, P);
  const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
  if (useRoot1)
    x = root1;
  if (useRoot2 || noRoot)
    x = root2;
  if (isNegativeLE(x, P))
    x = mod(-x, P);
  return { isValid: useRoot1 || useRoot2, value: x };
}
var ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
function ed(opts) {
  return eddsa(ed25519_Point, sha512, Object.assign({ adjustScalarBytes }, opts));
}
var ed25519 = /* @__PURE__ */ ed({});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/keypairs/ed25519/publickey.mjs
var PUBLIC_KEY_SIZE = 32;
var Ed25519PublicKey = class extends PublicKey2 {
  static {
    this.SIZE = PUBLIC_KEY_SIZE;
  }
  constructor(value) {
    super();
    if (typeof value === "string")
      this.data = fromBase64(value);
    else if (value instanceof Uint8Array)
      this.data = value;
    else
      this.data = Uint8Array.from(value);
    if (this.data.length !== PUBLIC_KEY_SIZE)
      throw new Error(`Invalid public key input. Expected ${PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`);
  }
  equals(publicKey) {
    return super.equals(publicKey);
  }
  toRawBytes() {
    return this.data;
  }
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["ED25519"];
  }
  async verify(message, signature) {
    let bytes;
    if (typeof signature === "string") {
      const parsed = parseSerializedKeypairSignature(signature);
      if (parsed.signatureScheme !== "ED25519")
        throw new Error("Invalid signature scheme");
      if (!bytesEqual(this.toRawBytes(), parsed.publicKey))
        throw new Error("Signature does not match public key");
      bytes = parsed.signature;
    } else
      bytes = signature;
    return ed25519.verify(bytes, message, this.toRawBytes());
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+hashes@2.0.1/node_modules/@noble/hashes/pbkdf2.js
function pbkdf2Init(hash, _password, _salt, _opts) {
  ahash(hash);
  const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
  const { c, dkLen, asyncTick } = opts;
  anumber2(c, "c");
  anumber2(dkLen, "dkLen");
  anumber2(asyncTick, "asyncTick");
  if (c < 1)
    throw new Error("iterations (c) must be >= 1");
  const password = kdfInputToBytes(_password, "password");
  const salt = kdfInputToBytes(_salt, "salt");
  const DK = new Uint8Array(dkLen);
  const PRF = hmac.create(hash, password);
  const PRFSalt = PRF._cloneInto().update(salt);
  return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
  PRF.destroy();
  PRFSalt.destroy();
  if (prfW)
    prfW.destroy();
  clean(u);
  return DK;
}
function pbkdf2(hash, password, salt, opts) {
  const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
  let prfW;
  const arr = new Uint8Array(4);
  const view = createView(arr);
  const u = new Uint8Array(PRF.outputLen);
  for (let ti = 1, pos = 0;pos < dkLen; ti++, pos += PRF.outputLen) {
    const Ti = DK.subarray(pos, pos + PRF.outputLen);
    view.setInt32(0, ti, false);
    (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
    Ti.set(u.subarray(0, Ti.length));
    for (let ui = 1;ui < c; ui++) {
      PRF._cloneInto(prfW).update(u).digestInto(u);
      for (let i = 0;i < Ti.length; i++)
        Ti[i] ^= u[i];
    }
  }
  return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@scure+bip39@2.0.1/node_modules/@scure/bip39/index.js
/*! scure-bip39 - MIT License (c) 2022 Patricio Palladino, Paul Miller (paulmillr.com) */
function nfkd(str) {
  if (typeof str !== "string")
    throw new TypeError("invalid mnemonic type: " + typeof str);
  return str.normalize("NFKD");
}
function normalize2(str) {
  const norm = nfkd(str);
  const words = norm.split(" ");
  if (![12, 15, 18, 21, 24].includes(words.length))
    throw new Error("Invalid mnemonic");
  return { nfkd: norm, words };
}
var psalt = (passphrase) => nfkd("mnemonic" + passphrase);
function mnemonicToSeedSync(mnemonic, passphrase = "") {
  return pbkdf2(sha512, normalize2(mnemonic).nfkd, psalt(passphrase), { c: 2048, dkLen: 64 });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/cryptography/mnemonics.mjs
function isValidHardenedPath(path) {
  if (!(/* @__PURE__ */ new RegExp("^m\\/44'\\/784'\\/[0-9]+'\\/[0-9]+'\\/[0-9]+'+$")).test(path))
    return false;
  return true;
}
function mnemonicToSeed(mnemonics) {
  return mnemonicToSeedSync(mnemonics, "");
}
function mnemonicToSeedHex(mnemonics) {
  return toHex(mnemonicToSeed(mnemonics));
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/nist.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var p256_CURVE = /* @__PURE__ */ (() => ({
  p: BigInt("0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"),
  n: BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"),
  h: BigInt(1),
  a: BigInt("0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc"),
  b: BigInt("0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b"),
  Gx: BigInt("0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"),
  Gy: BigInt("0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5")
}))();
var p256_Point = /* @__PURE__ */ weierstrass(p256_CURVE);
var p256 = /* @__PURE__ */ ecdsa(p256_Point, sha256);

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/keypairs/passkey/publickey.mjs
var PASSKEY_PUBLIC_KEY_SIZE = 33;
var PASSKEY_SIGNATURE_SIZE = 64;
var SECP256R1_SPKI_HEADER = new Uint8Array([
  48,
  89,
  48,
  19,
  6,
  7,
  42,
  134,
  72,
  206,
  61,
  2,
  1,
  6,
  8,
  42,
  134,
  72,
  206,
  61,
  3,
  1,
  7,
  3,
  66,
  0
]);
var PasskeyPublicKey = class extends PublicKey2 {
  static {
    this.SIZE = PASSKEY_PUBLIC_KEY_SIZE;
  }
  constructor(value) {
    super();
    if (typeof value === "string")
      this.data = fromBase64(value);
    else if (value instanceof Uint8Array)
      this.data = value;
    else
      this.data = Uint8Array.from(value);
    if (this.data.length !== PASSKEY_PUBLIC_KEY_SIZE)
      throw new Error(`Invalid public key input. Expected ${PASSKEY_PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`);
  }
  equals(publicKey) {
    return super.equals(publicKey);
  }
  toRawBytes() {
    return this.data;
  }
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["Passkey"];
  }
  async verify(message, signature) {
    const parsed = parseSerializedPasskeySignature(signature);
    const clientDataJSON = JSON.parse(parsed.clientDataJson);
    if (clientDataJSON.type !== "webauthn.get")
      return false;
    if (!bytesEqual(message, fromBase64(clientDataJSON.challenge.replace(/-/g, "+").replace(/_/g, "/"))))
      return false;
    const pk = parsed.userSignature.slice(1 + PASSKEY_SIGNATURE_SIZE);
    if (!bytesEqual(this.toRawBytes(), pk))
      return false;
    const payload = new Uint8Array([...parsed.authenticatorData, ...sha256(new TextEncoder().encode(parsed.clientDataJson))]);
    const sig = parsed.userSignature.slice(1, PASSKEY_SIGNATURE_SIZE + 1);
    return p256.verify(sig, payload, pk);
  }
};
function parseSerializedPasskeySignature(signature) {
  const bytes = typeof signature === "string" ? fromBase64(signature) : signature;
  if (bytes[0] !== SIGNATURE_SCHEME_TO_FLAG.Passkey)
    throw new Error("Invalid signature scheme");
  const dec = PasskeyAuthenticator.parse(bytes.slice(1));
  return {
    signatureScheme: "Passkey",
    serializedSignature: toBase64(bytes),
    signature: bytes,
    authenticatorData: dec.authenticatorData,
    clientDataJson: dec.clientDataJson,
    userSignature: new Uint8Array(dec.userSignature),
    publicKey: new Uint8Array(dec.userSignature.slice(1 + PASSKEY_SIGNATURE_SIZE))
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/zklogin/utils.mjs
function findFirstNonZeroIndex(bytes) {
  for (let i = 0;i < bytes.length; i++)
    if (bytes[i] !== 0)
      return i;
  return -1;
}
function toPaddedBigEndianBytes(num, width) {
  return hexToBytes(num.toString(16).padStart(width * 2, "0").slice(-width * 2));
}
function toBigEndianBytes(num, width) {
  const bytes = toPaddedBigEndianBytes(num, width);
  const firstNonZeroIndex = findFirstNonZeroIndex(bytes);
  if (firstNonZeroIndex === -1)
    return new Uint8Array([0]);
  return bytes.slice(firstNonZeroIndex);
}
function normalizeZkLoginIssuer(iss) {
  if (iss === "accounts.google.com")
    return "https://accounts.google.com";
  return iss;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/zklogin/jwt-utils.mjs
function base64UrlCharTo6Bits(base64UrlChar) {
  if (base64UrlChar.length !== 1)
    throw new Error("Invalid base64Url character: " + base64UrlChar);
  const index = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(base64UrlChar);
  if (index === -1)
    throw new Error("Invalid base64Url character: " + base64UrlChar);
  const binaryString = index.toString(2).padStart(6, "0");
  return Array.from(binaryString).map(Number);
}
function base64UrlStringToBitVector(base64UrlString) {
  let bitVector = [];
  for (let i = 0;i < base64UrlString.length; i++) {
    const bits = base64UrlCharTo6Bits(base64UrlString.charAt(i));
    bitVector = bitVector.concat(bits);
  }
  return bitVector;
}
function decodeBase64URL(s, i) {
  if (s.length < 2)
    throw new Error(`Input (s = ${s}) is not tightly packed because s.length < 2`);
  let bits = base64UrlStringToBitVector(s);
  const firstCharOffset = i % 4;
  if (firstCharOffset === 0) {} else if (firstCharOffset === 1)
    bits = bits.slice(2);
  else if (firstCharOffset === 2)
    bits = bits.slice(4);
  else
    throw new Error(`Input (s = ${s}) is not tightly packed because i%4 = 3 (i = ${i}))`);
  const lastCharOffset = (i + s.length - 1) % 4;
  if (lastCharOffset === 3) {} else if (lastCharOffset === 2)
    bits = bits.slice(0, bits.length - 2);
  else if (lastCharOffset === 1)
    bits = bits.slice(0, bits.length - 4);
  else
    throw new Error(`Input (s = ${s}) is not tightly packed because (i + s.length - 1)%4 = 0 (i = ${i}))`);
  if (bits.length % 8 !== 0)
    throw new Error(`We should never reach here...`);
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  let currentByteIndex = 0;
  for (let i$1 = 0;i$1 < bits.length; i$1 += 8) {
    const bitChunk = bits.slice(i$1, i$1 + 8);
    const byte = parseInt(bitChunk.join(""), 2);
    bytes[currentByteIndex++] = byte;
  }
  return new TextDecoder().decode(bytes);
}
function verifyExtendedClaim(claim) {
  if (!(claim.slice(-1) === "}" || claim.slice(-1) === ","))
    throw new Error("Invalid claim");
  const json = JSON.parse("{" + claim.slice(0, -1) + "}");
  if (Object.keys(json).length !== 1)
    throw new Error("Invalid claim");
  const key = Object.keys(json)[0];
  return [key, json[key]];
}
function extractClaimValue(claim, claimName) {
  const [name, value] = verifyExtendedClaim(decodeBase64URL(claim.value, claim.indexMod4));
  if (name !== claimName)
    throw new Error(`Invalid field name: found ${name} expected ${claimName}`);
  return value;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/zklogin/bcs.mjs
var zkLoginSignature = bcs.struct("ZkLoginSignature", {
  inputs: bcs.struct("ZkLoginSignatureInputs", {
    proofPoints: bcs.struct("ZkLoginSignatureInputsProofPoints", {
      a: bcs.vector(bcs.string()),
      b: bcs.vector(bcs.vector(bcs.string())),
      c: bcs.vector(bcs.string())
    }),
    issBase64Details: bcs.struct("ZkLoginSignatureInputsClaim", {
      value: bcs.string(),
      indexMod4: bcs.u8()
    }),
    headerBase64: bcs.string(),
    addressSeed: bcs.string()
  }),
  maxEpoch: bcs.u64(),
  userSignature: bcs.byteVector()
});

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/zklogin/signature.mjs
function parseZkLoginSignature(signature) {
  return zkLoginSignature.parse(typeof signature === "string" ? fromBase64(signature) : signature);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/zklogin/publickey.mjs
var ZkLoginPublicIdentifier = class ZkLoginPublicIdentifier2 extends PublicKey2 {
  #data;
  #client;
  #legacyAddress;
  constructor(value, { client } = {}) {
    super();
    this.#client = client;
    if (typeof value === "string")
      this.#data = fromBase64(value);
    else if (value instanceof Uint8Array)
      this.#data = value;
    else
      this.#data = Uint8Array.from(value);
    this.#legacyAddress = this.#data.length !== this.#data[0] + 1 + 32;
    if (this.#legacyAddress)
      this.#data = normalizeZkLoginPublicKeyBytes(this.#data, false);
  }
  static fromBytes(bytes, { client, address, legacyAddress } = {}) {
    let publicKey;
    if (legacyAddress === true)
      publicKey = new ZkLoginPublicIdentifier2(normalizeZkLoginPublicKeyBytes(bytes, true), { client });
    else if (legacyAddress === false)
      publicKey = new ZkLoginPublicIdentifier2(normalizeZkLoginPublicKeyBytes(bytes, false), { client });
    else if (address) {
      publicKey = new ZkLoginPublicIdentifier2(normalizeZkLoginPublicKeyBytes(bytes, false), { client });
      if (publicKey.toSuiAddress() !== address)
        publicKey = new ZkLoginPublicIdentifier2(normalizeZkLoginPublicKeyBytes(bytes, true), { client });
    } else
      publicKey = new ZkLoginPublicIdentifier2(bytes, { client });
    if (address && publicKey.toSuiAddress() !== address)
      throw new Error("Public key bytes do not match the provided address");
    return publicKey;
  }
  static fromProof(address, proof) {
    const { issBase64Details, addressSeed } = proof;
    const iss = extractClaimValue(issBase64Details, "iss");
    const legacyPublicKey = toZkLoginPublicIdentifier(BigInt(addressSeed), iss, { legacyAddress: true });
    if (legacyPublicKey.toSuiAddress() === address)
      return legacyPublicKey;
    const publicKey = toZkLoginPublicIdentifier(BigInt(addressSeed), iss, { legacyAddress: false });
    if (publicKey.toSuiAddress() !== address)
      throw new Error("Proof does not match address");
    return publicKey;
  }
  equals(publicKey) {
    return super.equals(publicKey);
  }
  toSuiAddress() {
    if (this.#legacyAddress)
      return this.#toLegacyAddress();
    return super.toSuiAddress();
  }
  #toLegacyAddress() {
    const legacyBytes = normalizeZkLoginPublicKeyBytes(this.#data, true);
    const addressBytes = new Uint8Array(legacyBytes.length + 1);
    addressBytes[0] = this.flag();
    addressBytes.set(legacyBytes, 1);
    return normalizeSuiAddress(bytesToHex(blake2b(addressBytes, { dkLen: 32 })).slice(0, SUI_ADDRESS_LENGTH * 2));
  }
  toRawBytes() {
    return this.#data;
  }
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["ZkLogin"];
  }
  async verify(_message, _signature) {
    throw Error("does not support");
  }
  verifyPersonalMessage(message, signature) {
    const parsedSignature = parseSerializedZkLoginSignature(signature);
    return graphqlVerifyZkLoginSignature({
      address: new ZkLoginPublicIdentifier2(parsedSignature.publicKey).toSuiAddress(),
      bytes: toBase64(message),
      signature: parsedSignature.serializedSignature,
      intentScope: "PersonalMessage",
      client: this.#client
    });
  }
  verifyTransaction(transaction, signature) {
    const parsedSignature = parseSerializedZkLoginSignature(signature);
    return graphqlVerifyZkLoginSignature({
      address: new ZkLoginPublicIdentifier2(parsedSignature.publicKey).toSuiAddress(),
      bytes: toBase64(transaction),
      signature: parsedSignature.serializedSignature,
      intentScope: "TransactionData",
      client: this.#client
    });
  }
  verifyAddress(address) {
    return address === super.toSuiAddress() || address === this.#toLegacyAddress();
  }
};
function toZkLoginPublicIdentifier(addressSeed, iss, options) {
  if (options.legacyAddress === undefined)
    throw new Error("legacyAddress parameter must be specified");
  const addressSeedBytesBigEndian = options.legacyAddress ? toBigEndianBytes(addressSeed, 32) : toPaddedBigEndianBytes(addressSeed, 32);
  const issBytes = new TextEncoder().encode(normalizeZkLoginIssuer(iss));
  const tmp = new Uint8Array(1 + issBytes.length + addressSeedBytesBigEndian.length);
  tmp.set([issBytes.length], 0);
  tmp.set(issBytes, 1);
  tmp.set(addressSeedBytesBigEndian, 1 + issBytes.length);
  return new ZkLoginPublicIdentifier(tmp, options);
}
function normalizeZkLoginPublicKeyBytes(bytes, legacyAddress) {
  const issByteLength = bytes[0] + 1;
  const addressSeed = BigInt(`0x${toHex(bytes.slice(issByteLength))}`);
  const seedBytes = legacyAddress ? toBigEndianBytes(addressSeed, 32) : toPaddedBigEndianBytes(addressSeed, 32);
  const data = new Uint8Array(issByteLength + seedBytes.length);
  data.set(bytes.slice(0, issByteLength), 0);
  data.set(seedBytes, issByteLength);
  return data;
}
async function graphqlVerifyZkLoginSignature({ address, bytes, signature, intentScope, client }) {
  if (!client)
    throw new Error("A Sui Client (GRPC, GraphQL, or JSON RPC) is required to verify zkLogin signatures");
  const resp = await client.core.verifyZkLoginSignature({
    bytes,
    signature,
    intentScope,
    address
  });
  return resp.success === true && resp.errors.length === 0;
}
function parseSerializedZkLoginSignature(signature) {
  const bytes = typeof signature === "string" ? fromBase64(signature) : signature;
  if (bytes[0] !== SIGNATURE_SCHEME_TO_FLAG.ZkLogin)
    throw new Error("Invalid signature scheme");
  const { inputs, maxEpoch, userSignature } = parseZkLoginSignature(bytes.slice(1));
  const { issBase64Details, addressSeed } = inputs;
  const iss = extractClaimValue(issBase64Details, "iss");
  const publicIdentifier = toZkLoginPublicIdentifier(BigInt(addressSeed), iss, { legacyAddress: false });
  return {
    serializedSignature: toBase64(bytes),
    signatureScheme: "ZkLogin",
    zkLogin: {
      inputs,
      maxEpoch,
      userSignature,
      iss,
      addressSeed: BigInt(addressSeed)
    },
    signature: bytes,
    publicKey: publicIdentifier.toRawBytes()
  };
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/cryptography/signature.mjs
function toSerializedSignature({ signature, signatureScheme, publicKey }) {
  if (!publicKey)
    throw new Error("`publicKey` is required");
  const pubKeyBytes = publicKey.toRawBytes();
  const serializedSignature = new Uint8Array(1 + signature.length + pubKeyBytes.length);
  serializedSignature.set([SIGNATURE_SCHEME_TO_FLAG[signatureScheme]]);
  serializedSignature.set(signature, 1);
  serializedSignature.set(pubKeyBytes, 1 + signature.length);
  return toBase64(serializedSignature);
}
function parseSerializedSignature(serializedSignature) {
  const bytes = fromBase64(serializedSignature);
  const signatureScheme = SIGNATURE_FLAG_TO_SCHEME[bytes[0]];
  switch (signatureScheme) {
    case "Passkey":
      return parseSerializedPasskeySignature(serializedSignature);
    case "MultiSig":
      return {
        serializedSignature,
        signatureScheme,
        multisig: suiBcs.MultiSig.parse(bytes.slice(1)),
        bytes,
        signature: undefined
      };
    case "ZkLogin":
      return parseSerializedZkLoginSignature(serializedSignature);
    case "ED25519":
    case "Secp256k1":
    case "Secp256r1":
      return parseSerializedKeypairSignature(serializedSignature);
    default:
      throw new Error("Unsupported signature scheme");
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/cryptography/keypair.mjs
var PRIVATE_KEY_SIZE = 32;
var SUI_PRIVATE_KEY_PREFIX = "suiprivkey";
var Signer = class {
  async signWithIntent(bytes, intent) {
    const digest = blake2b(messageWithIntent(intent, bytes), { dkLen: 32 });
    return {
      signature: toSerializedSignature({
        signature: await this.sign(digest),
        signatureScheme: this.getKeyScheme(),
        publicKey: this.getPublicKey()
      }),
      bytes: toBase64(bytes)
    };
  }
  async signTransaction(bytes) {
    return this.signWithIntent(bytes, "TransactionData");
  }
  async signPersonalMessage(bytes) {
    const { signature } = await this.signWithIntent(bcs.byteVector().serialize(bytes).toBytes(), "PersonalMessage");
    return {
      bytes: toBase64(bytes),
      signature
    };
  }
  async signAndExecuteTransaction({ transaction, client }) {
    transaction.setSenderIfNotSet(this.toSuiAddress());
    const bytes = await transaction.build({ client });
    const { signature } = await this.signTransaction(bytes);
    return client.core.executeTransaction({
      transaction: bytes,
      signatures: [signature],
      include: {
        transaction: true,
        effects: true
      }
    });
  }
  toSuiAddress() {
    return this.getPublicKey().toSuiAddress();
  }
};
var Keypair = class extends Signer {
};
function decodeSuiPrivateKey(value) {
  const { prefix, words } = bech32.decode(value);
  if (prefix !== SUI_PRIVATE_KEY_PREFIX)
    throw new Error("invalid private key prefix");
  const extendedSecretKey = new Uint8Array(bech32.fromWords(words));
  const secretKey = extendedSecretKey.slice(1);
  return {
    scheme: SIGNATURE_FLAG_TO_SCHEME[extendedSecretKey[0]],
    secretKey
  };
}
function encodeSuiPrivateKey(bytes, scheme) {
  if (bytes.length !== PRIVATE_KEY_SIZE)
    throw new Error("Invalid bytes length");
  const flag = SIGNATURE_SCHEME_TO_FLAG[scheme];
  const privKeyBytes = new Uint8Array(bytes.length + 1);
  privKeyBytes.set([flag]);
  privKeyBytes.set(bytes, 1);
  return bech32.encode(SUI_PRIVATE_KEY_PREFIX, bech32.toWords(privKeyBytes));
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/keypairs/ed25519/ed25519-hd-key.mjs
var ED25519_CURVE = "ed25519 seed";
var HARDENED_OFFSET = 2147483648;
var pathRegex = /* @__PURE__ */ new RegExp("^m(\\/[0-9]+')+$");
var replaceDerive = (val) => val.replace("'", "");
var getMasterKeyFromSeed = (seed) => {
  const I = hmac.create(sha512, new TextEncoder().encode(ED25519_CURVE)).update(fromHex(seed)).digest();
  return {
    key: I.slice(0, 32),
    chainCode: I.slice(32)
  };
};
var CKDPriv = ({ key, chainCode }, index) => {
  const indexBuffer = /* @__PURE__ */ new ArrayBuffer(4);
  new DataView(indexBuffer).setUint32(0, index);
  const data = new Uint8Array(1 + key.length + indexBuffer.byteLength);
  data.set(new Uint8Array(1).fill(0));
  data.set(key, 1);
  data.set(new Uint8Array(indexBuffer, 0, indexBuffer.byteLength), key.length + 1);
  const I = hmac.create(sha512, chainCode).update(data).digest();
  return {
    key: I.slice(0, 32),
    chainCode: I.slice(32)
  };
};
var isValidPath = (path) => {
  if (!pathRegex.test(path))
    return false;
  return !path.split("/").slice(1).map(replaceDerive).some(isNaN);
};
var derivePath = (path, seed, offset = HARDENED_OFFSET) => {
  if (!isValidPath(path))
    throw new Error("Invalid derivation path");
  const { key, chainCode } = getMasterKeyFromSeed(seed);
  return path.split("/").slice(1).map(replaceDerive).map((el) => parseInt(el, 10)).reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), {
    key,
    chainCode
  });
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/keypairs/ed25519/keypair.mjs
var DEFAULT_ED25519_DERIVATION_PATH = "m/44'/784'/0'/0'/0'";
var Ed25519Keypair = class Ed25519Keypair2 extends Keypair {
  constructor(keypair) {
    super();
    if (keypair)
      this.keypair = {
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey.slice(0, 32)
      };
    else {
      const privateKey = ed25519.utils.randomSecretKey();
      this.keypair = {
        publicKey: ed25519.getPublicKey(privateKey),
        secretKey: privateKey
      };
    }
  }
  getKeyScheme() {
    return "ED25519";
  }
  static generate() {
    const secretKey = ed25519.utils.randomSecretKey();
    return new Ed25519Keypair2({
      publicKey: ed25519.getPublicKey(secretKey),
      secretKey
    });
  }
  static fromSecretKey(secretKey, options) {
    if (typeof secretKey === "string") {
      const decoded = decodeSuiPrivateKey(secretKey);
      if (decoded.scheme !== "ED25519")
        throw new Error(`Expected a ED25519 keypair, got ${decoded.scheme}`);
      return this.fromSecretKey(decoded.secretKey, options);
    }
    const secretKeyLength = secretKey.length;
    if (secretKeyLength !== PRIVATE_KEY_SIZE)
      throw new Error(`Wrong secretKey size. Expected ${PRIVATE_KEY_SIZE} bytes, got ${secretKeyLength}.`);
    const keypair = {
      publicKey: ed25519.getPublicKey(secretKey),
      secretKey
    };
    if (!options || !options.skipValidation) {
      const signData = new TextEncoder().encode("sui validation");
      const signature = ed25519.sign(signData, secretKey);
      if (!ed25519.verify(signature, signData, keypair.publicKey))
        throw new Error("provided secretKey is invalid");
    }
    return new Ed25519Keypair2(keypair);
  }
  getPublicKey() {
    return new Ed25519PublicKey(this.keypair.publicKey);
  }
  getSecretKey() {
    return encodeSuiPrivateKey(this.keypair.secretKey.slice(0, PRIVATE_KEY_SIZE), this.getKeyScheme());
  }
  async sign(data) {
    return ed25519.sign(data, this.keypair.secretKey);
  }
  static deriveKeypair(mnemonics, path) {
    if (path == null)
      path = DEFAULT_ED25519_DERIVATION_PATH;
    if (!isValidHardenedPath(path))
      throw new Error("Invalid derivation path");
    const { key } = derivePath(path, mnemonicToSeedHex(mnemonics));
    return Ed25519Keypair2.fromSecretKey(key);
  }
  static deriveKeypairFromSeed(seedHex, path) {
    if (path == null)
      path = DEFAULT_ED25519_DERIVATION_PATH;
    if (!isValidHardenedPath(path))
      throw new Error("Invalid derivation path");
    const { key } = derivePath(path, seedHex);
    return Ed25519Keypair2.fromSecretKey(key);
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@noble+curves@2.0.1/node_modules/@noble/curves/secp256k1.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var secp256k1_CURVE = {
  p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
  n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
  h: BigInt(1),
  a: BigInt(0),
  b: BigInt(7),
  Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
  Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
var secp256k1_ENDO = {
  beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
  basises: [
    [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
    [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
  ]
};
var _2n9 = /* @__PURE__ */ BigInt(2);
function sqrtMod(y) {
  const P = secp256k1_CURVE.p;
  const _3n6 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n6, P) * b3 % P;
  const b9 = pow2(b6, _3n6, P) * b3 % P;
  const b11 = pow2(b9, _2n9, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n6, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n9, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
var Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
var Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
  Fp: Fpk1,
  endo: secp256k1_ENDO
});
var secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha256);

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/keypairs/secp256k1/publickey.mjs
var SECP256K1_PUBLIC_KEY_SIZE = 33;
var Secp256k1PublicKey = class extends PublicKey2 {
  static {
    this.SIZE = SECP256K1_PUBLIC_KEY_SIZE;
  }
  constructor(value) {
    super();
    if (typeof value === "string")
      this.data = fromBase64(value);
    else if (value instanceof Uint8Array)
      this.data = value;
    else
      this.data = Uint8Array.from(value);
    if (this.data.length !== SECP256K1_PUBLIC_KEY_SIZE)
      throw new Error(`Invalid public key input. Expected ${SECP256K1_PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`);
  }
  equals(publicKey) {
    return super.equals(publicKey);
  }
  toRawBytes() {
    return this.data;
  }
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["Secp256k1"];
  }
  async verify(message, signature) {
    let bytes;
    if (typeof signature === "string") {
      const parsed = parseSerializedKeypairSignature(signature);
      if (parsed.signatureScheme !== "Secp256k1")
        throw new Error("Invalid signature scheme");
      if (!bytesEqual(this.toRawBytes(), parsed.publicKey))
        throw new Error("Signature does not match public key");
      bytes = parsed.signature;
    } else
      bytes = signature;
    return secp256k1.verify(bytes, message, this.toRawBytes());
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/keypairs/secp256r1/publickey.mjs
var SECP256R1_PUBLIC_KEY_SIZE = 33;
var Secp256r1PublicKey = class extends PublicKey2 {
  static {
    this.SIZE = SECP256R1_PUBLIC_KEY_SIZE;
  }
  constructor(value) {
    super();
    if (typeof value === "string")
      this.data = fromBase64(value);
    else if (value instanceof Uint8Array)
      this.data = value;
    else
      this.data = Uint8Array.from(value);
    if (this.data.length !== SECP256R1_PUBLIC_KEY_SIZE)
      throw new Error(`Invalid public key input. Expected ${SECP256R1_PUBLIC_KEY_SIZE} bytes, got ${this.data.length}`);
  }
  equals(publicKey) {
    return super.equals(publicKey);
  }
  toRawBytes() {
    return this.data;
  }
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["Secp256r1"];
  }
  async verify(message, signature) {
    let bytes;
    if (typeof signature === "string") {
      const parsed = parseSerializedSignature(signature);
      if (parsed.signatureScheme !== "Secp256r1")
        throw new Error("Invalid signature scheme");
      if (!bytesEqual(this.toRawBytes(), parsed.publicKey))
        throw new Error("Signature does not match public key");
      bytes = parsed.signature;
    } else
      bytes = signature;
    return p256.verify(bytes, message, this.toRawBytes());
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/multisig/signer.mjs
var MultiSigSigner = class extends Signer {
  #pubkey;
  #signers;
  constructor(pubkey, signers = []) {
    super();
    this.#pubkey = pubkey;
    this.#signers = signers;
    const uniqueKeys = /* @__PURE__ */ new Set;
    let combinedWeight = 0;
    const weights = pubkey.getPublicKeys().map(({ weight, publicKey }) => ({
      weight,
      address: publicKey.toSuiAddress()
    }));
    for (const signer of signers) {
      const address = signer.toSuiAddress();
      if (uniqueKeys.has(address))
        throw new Error(`Can't create MultiSigSigner with duplicate signers`);
      uniqueKeys.add(address);
      const weight = weights.find((w) => w.address === address)?.weight;
      if (!weight)
        throw new Error(`Signer ${address} is not part of the MultiSig public key`);
      combinedWeight += weight;
    }
    if (combinedWeight < pubkey.getThreshold())
      throw new Error(`Combined weight of signers is less than threshold`);
  }
  getKeyScheme() {
    return "MultiSig";
  }
  getPublicKey() {
    return this.#pubkey;
  }
  sign(_data) {
    throw new Error("MultiSigSigner does not support signing directly. Use signTransaction or signPersonalMessage instead");
  }
  async signTransaction(bytes) {
    return {
      signature: this.#pubkey.combinePartialSignatures(await Promise.all(this.#signers.map(async (signer) => (await signer.signTransaction(bytes)).signature))),
      bytes: toBase64(bytes)
    };
  }
  async signPersonalMessage(bytes) {
    return {
      signature: this.#pubkey.combinePartialSignatures(await Promise.all(this.#signers.map(async (signer) => (await signer.signPersonalMessage(bytes)).signature))),
      bytes: toBase64(bytes)
    };
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/multisig/publickey.mjs
var MAX_SIGNER_IN_MULTISIG = 10;
var MIN_SIGNER_IN_MULTISIG = 1;
var MultiSigPublicKey2 = class MultiSigPublicKey3 extends PublicKey2 {
  constructor(value, options = {}) {
    super();
    if (typeof value === "string") {
      this.rawBytes = fromBase64(value);
      this.multisigPublicKey = suiBcs.MultiSigPublicKey.parse(this.rawBytes);
    } else if (value instanceof Uint8Array) {
      this.rawBytes = value;
      this.multisigPublicKey = suiBcs.MultiSigPublicKey.parse(this.rawBytes);
    } else {
      this.multisigPublicKey = value;
      this.rawBytes = suiBcs.MultiSigPublicKey.serialize(value).toBytes();
    }
    if (this.multisigPublicKey.threshold < 1)
      throw new Error("Invalid threshold");
    const seenPublicKeys = /* @__PURE__ */ new Set;
    this.publicKeys = this.multisigPublicKey.pk_map.map(({ pubKey, weight }) => {
      const [scheme, bytes] = Object.entries(pubKey).filter(([name]) => name !== "$kind")[0];
      const publicKeyStr = Uint8Array.from(bytes).toString();
      if (seenPublicKeys.has(publicKeyStr))
        throw new Error(`Multisig does not support duplicate public keys`);
      seenPublicKeys.add(publicKeyStr);
      if (weight < 1)
        throw new Error(`Invalid weight`);
      return {
        publicKey: publicKeyFromRawBytes(scheme, Uint8Array.from(bytes), options),
        weight
      };
    });
    const totalWeight = this.publicKeys.reduce((sum, { weight }) => sum + weight, 0);
    if (this.multisigPublicKey.threshold > totalWeight)
      throw new Error(`Unreachable threshold`);
    if (this.publicKeys.length > MAX_SIGNER_IN_MULTISIG)
      throw new Error(`Max number of signers in a multisig is ${MAX_SIGNER_IN_MULTISIG}`);
    if (this.publicKeys.length < MIN_SIGNER_IN_MULTISIG)
      throw new Error(`Min number of signers in a multisig is ${MIN_SIGNER_IN_MULTISIG}`);
  }
  static fromPublicKeys({ threshold, publicKeys }) {
    return new MultiSigPublicKey3({
      pk_map: publicKeys.map(({ publicKey, weight }) => {
        return {
          pubKey: { [SIGNATURE_FLAG_TO_SCHEME[publicKey.flag()]]: publicKey.toRawBytes() },
          weight
        };
      }),
      threshold
    });
  }
  equals(publicKey) {
    return super.equals(publicKey);
  }
  toRawBytes() {
    return this.rawBytes;
  }
  getPublicKeys() {
    return this.publicKeys;
  }
  getThreshold() {
    return this.multisigPublicKey.threshold;
  }
  getSigner(...signers) {
    return new MultiSigSigner(this, signers);
  }
  toSuiAddress() {
    const maxLength = 1 + 65 * MAX_SIGNER_IN_MULTISIG + 2;
    const tmp = new Uint8Array(maxLength);
    tmp.set([SIGNATURE_SCHEME_TO_FLAG["MultiSig"]]);
    tmp.set(suiBcs.u16().serialize(this.multisigPublicKey.threshold).toBytes(), 1);
    let i = 3;
    for (const { publicKey, weight } of this.publicKeys) {
      const bytes = publicKey.toSuiBytes();
      tmp.set(bytes, i);
      i += bytes.length;
      tmp.set([weight], i++);
    }
    return normalizeSuiAddress(bytesToHex(blake2b(tmp.slice(0, i), { dkLen: 32 })));
  }
  flag() {
    return SIGNATURE_SCHEME_TO_FLAG["MultiSig"];
  }
  async verify(message, multisigSignature) {
    const parsed = parseSerializedSignature(multisigSignature);
    if (parsed.signatureScheme !== "MultiSig")
      throw new Error("Invalid signature scheme");
    const { multisig } = parsed;
    let signatureWeight = 0;
    if (!bytesEqual(suiBcs.MultiSigPublicKey.serialize(this.multisigPublicKey).toBytes(), suiBcs.MultiSigPublicKey.serialize(multisig.multisig_pk).toBytes()))
      return false;
    for (const { publicKey, weight, signature } of parsePartialSignatures(multisig)) {
      if (!await publicKey.verify(message, signature))
        return false;
      signatureWeight += weight;
    }
    return signatureWeight >= this.multisigPublicKey.threshold;
  }
  combinePartialSignatures(signatures) {
    if (signatures.length > MAX_SIGNER_IN_MULTISIG)
      throw new Error(`Max number of signatures in a multisig is ${MAX_SIGNER_IN_MULTISIG}`);
    let bitmap = 0;
    const compressedSignatures = new Array(signatures.length);
    for (let i = 0;i < signatures.length; i++) {
      const parsed = parseSerializedSignature(signatures[i]);
      if (parsed.signatureScheme === "MultiSig")
        throw new Error("MultiSig is not supported inside MultiSig");
      let publicKey;
      if (parsed.signatureScheme === "ZkLogin")
        publicKey = toZkLoginPublicIdentifier(parsed.zkLogin?.addressSeed, parsed.zkLogin?.iss, { legacyAddress: false }).toRawBytes();
      else
        publicKey = parsed.publicKey;
      compressedSignatures[i] = { [parsed.signatureScheme]: parsed.signature };
      let publicKeyIndex;
      for (let j = 0;j < this.publicKeys.length; j++)
        if (bytesEqual(publicKey, this.publicKeys[j].publicKey.toRawBytes())) {
          if (bitmap & 1 << j)
            throw new Error("Received multiple signatures from the same public key");
          publicKeyIndex = j;
          break;
        }
      if (publicKeyIndex === undefined)
        throw new Error("Received signature from unknown public key");
      bitmap |= 1 << publicKeyIndex;
    }
    const multisig = {
      sigs: compressedSignatures,
      bitmap,
      multisig_pk: this.multisigPublicKey
    };
    const bytes = suiBcs.MultiSig.serialize(multisig, { maxSize: 8192 }).toBytes();
    const tmp = new Uint8Array(bytes.length + 1);
    tmp.set([SIGNATURE_SCHEME_TO_FLAG["MultiSig"]]);
    tmp.set(bytes, 1);
    return toBase64(tmp);
  }
};
function parsePartialSignatures(multisig, options = {}) {
  const res = new Array(multisig.sigs.length);
  for (let i = 0;i < multisig.sigs.length; i++) {
    const [signatureScheme, signature] = Object.entries(multisig.sigs[i]).filter(([name]) => name !== "$kind")[0];
    const pkIndex = asIndices(multisig.bitmap).at(i);
    const pair = multisig.multisig_pk.pk_map[pkIndex];
    const pkBytes = Uint8Array.from(Object.values(pair.pubKey)[0]);
    if (signatureScheme === "MultiSig")
      throw new Error("MultiSig is not supported inside MultiSig");
    const publicKey = publicKeyFromRawBytes(signatureScheme, pkBytes, options);
    res[i] = {
      signatureScheme,
      signature: Uint8Array.from(signature),
      publicKey,
      weight: pair.weight
    };
  }
  return res;
}
function asIndices(bitmap) {
  if (bitmap < 0 || bitmap > 1024)
    throw new Error("Invalid bitmap");
  const res = [];
  for (let i = 0;i < 10; i++)
    if ((bitmap & 1 << i) !== 0)
      res.push(i);
  return Uint8Array.from(res);
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+sui@2.4.0_typescript@5.9.3/node_modules/@mysten/sui/dist/verify/verify.mjs
async function verifyPersonalMessageSignature(message, signature, options = {}) {
  const parsedSignature = parseSignature(signature, options);
  if (!await parsedSignature.publicKey.verifyPersonalMessage(message, parsedSignature.serializedSignature))
    throw new Error(`Signature is not valid for the provided message`);
  if (options?.address && !parsedSignature.publicKey.verifyAddress(options.address))
    throw new Error(`Signature is not valid for the provided address`);
  return parsedSignature.publicKey;
}
function parseSignature(signature, options = {}) {
  const parsedSignature = parseSerializedSignature(signature);
  if (parsedSignature.signatureScheme === "MultiSig")
    return {
      ...parsedSignature,
      publicKey: new MultiSigPublicKey2(parsedSignature.multisig.multisig_pk)
    };
  const publicKey = publicKeyFromRawBytes(parsedSignature.signatureScheme, parsedSignature.publicKey, options);
  return {
    ...parsedSignature,
    publicKey
  };
}
function publicKeyFromRawBytes(signatureScheme, bytes, options = {}) {
  let publicKey;
  switch (signatureScheme) {
    case "ED25519":
      publicKey = new Ed25519PublicKey(bytes);
      break;
    case "Secp256k1":
      publicKey = new Secp256k1PublicKey(bytes);
      break;
    case "Secp256r1":
      publicKey = new Secp256r1PublicKey(bytes);
      break;
    case "MultiSig":
      publicKey = new MultiSigPublicKey2(bytes);
      break;
    case "ZkLogin":
      publicKey = ZkLoginPublicIdentifier.fromBytes(bytes, options);
      break;
    case "Passkey":
      publicKey = new PasskeyPublicKey(bytes);
      break;
    default:
      throw new Error(`Unsupported signature scheme ${signatureScheme}`);
  }
  if (options.address && publicKey.toSuiAddress() !== options.address)
    throw new Error(`Public key bytes do not match the provided address`);
  return publicKey;
}

// ../../Contributor/sui-stack-messaging-sdk/packages/node_modules/.pnpm/@mysten+seal@1.0.1_@mysten+sui@2.4.0_typescript@5.9.3_/node_modules/@mysten/seal/dist/session-key.mjs
var RequestFormat = suiBcs.struct("RequestFormat", {
  ptb: suiBcs.byteVector(),
  encKey: suiBcs.byteVector(),
  encVerificationKey: suiBcs.byteVector()
});
var SessionKey = class SessionKey2 {
  #address;
  #packageId;
  #mvrName;
  #creationTimeMs;
  #ttlMin;
  #sessionKey;
  #personalMessageSignature;
  #signer;
  #suiClient;
  constructor({ address, packageId, mvrName, ttlMin, signer, suiClient }) {
    if (mvrName && !isValidNamedPackage(mvrName))
      throw new UserError2(`Invalid package name ${mvrName}`);
    if (!isValidSuiObjectId(packageId) || !isValidSuiAddress(address))
      throw new UserError2(`Invalid package ID ${packageId} or address ${address}`);
    if (ttlMin > 30 || ttlMin < 1)
      throw new UserError2(`Invalid TTL ${ttlMin}, must be between 1 and 30`);
    if (signer && signer.getPublicKey().toSuiAddress() !== address)
      throw new UserError2("Signer address does not match session key address");
    this.#address = address;
    this.#packageId = packageId;
    this.#mvrName = mvrName;
    this.#creationTimeMs = Date.now();
    this.#ttlMin = ttlMin;
    this.#sessionKey = Ed25519Keypair.generate();
    this.#signer = signer;
    this.#suiClient = suiClient;
  }
  static async create({ address, packageId, mvrName, ttlMin, signer, suiClient }) {
    const packageObj = await suiClient.core.getObject({ objectId: packageId });
    if (String(packageObj.object.version) !== "1")
      throw new InvalidPackageError(`Package ${packageId} is not the first version`);
    return new SessionKey2({
      address,
      packageId,
      mvrName,
      ttlMin,
      signer,
      suiClient
    });
  }
  isExpired() {
    return this.#creationTimeMs + this.#ttlMin * 60 * 1000 - 1e4 < Date.now();
  }
  getAddress() {
    return this.#address;
  }
  getPackageName() {
    if (this.#mvrName)
      return this.#mvrName;
    return this.#packageId;
  }
  getPackageId() {
    return this.#packageId;
  }
  getPersonalMessage() {
    const creationTimeUtc = new Date(this.#creationTimeMs).toISOString().slice(0, 19).replace("T", " ") + " UTC";
    const message = `Accessing keys of package ${this.getPackageName()} for ${this.#ttlMin} mins from ${creationTimeUtc}, session key ${toBase64(this.#sessionKey.getPublicKey().toRawBytes())}`;
    return new TextEncoder().encode(message);
  }
  async setPersonalMessageSignature(personalMessageSignature) {
    if (!this.#personalMessageSignature)
      try {
        await verifyPersonalMessageSignature(this.getPersonalMessage(), personalMessageSignature, {
          address: this.#address,
          client: this.#suiClient
        });
        this.#personalMessageSignature = personalMessageSignature;
      } catch {
        throw new InvalidPersonalMessageSignatureError("Not valid");
      }
  }
  async getCertificate() {
    if (!this.#personalMessageSignature)
      if (this.#signer) {
        const { signature } = await this.#signer.signPersonalMessage(this.getPersonalMessage());
        this.#personalMessageSignature = signature;
      } else
        throw new InvalidPersonalMessageSignatureError("Personal message signature is not set");
    return {
      user: this.#address,
      session_vk: toBase64(this.#sessionKey.getPublicKey().toRawBytes()),
      creation_time: this.#creationTimeMs,
      ttl_min: this.#ttlMin,
      signature: this.#personalMessageSignature,
      mvr_name: this.#mvrName
    };
  }
  async createRequestParams(txBytes) {
    if (this.isExpired())
      throw new ExpiredSessionKeyError;
    const encKey = generateSecretKey();
    const encKeyPk = toPublicKey(encKey);
    const encVerificationKey = toVerificationKey(encKey);
    const msgToSign = RequestFormat.serialize({
      ptb: txBytes.slice(1),
      encKey: encKeyPk,
      encVerificationKey
    }).toBytes();
    return {
      encKey,
      encKeyPk,
      encVerificationKey,
      requestSignature: toBase64(await this.#sessionKey.sign(msgToSign))
    };
  }
  export() {
    const obj = {
      address: this.#address,
      packageId: this.#packageId,
      mvrName: this.#mvrName,
      creationTimeMs: this.#creationTimeMs,
      ttlMin: this.#ttlMin,
      personalMessageSignature: this.#personalMessageSignature,
      sessionKey: this.#sessionKey.getSecretKey()
    };
    Object.defineProperty(obj, "toJSON", {
      enumerable: false,
      value: () => {
        throw new Error("This object is not serializable");
      }
    });
    return obj;
  }
  static import(data, suiClient, signer) {
    const instance = new SessionKey2({
      address: data.address,
      packageId: data.packageId,
      mvrName: data.mvrName,
      ttlMin: data.ttlMin,
      signer,
      suiClient
    });
    instance.#creationTimeMs = data.creationTimeMs;
    instance.#sessionKey = Ed25519Keypair.fromSecretKey(data.sessionKey);
    instance.#personalMessageSignature = data.personalMessageSignature;
    if (instance.isExpired())
      throw new ExpiredSessionKeyError;
    return instance;
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/encryption/constants.js
var ENCRYPTION_PRIMITIVES_CONFIG = {
  keySize: 256,
  nonceSize: 12,
  dekAlgorithm: "AES-GCM"
};

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/encryption/webCryptoPrimitives.js
class WebCryptoPrimitives {
  constructor(config) {
    this.config = config;
  }
  static getInstance(config) {
    if (!WebCryptoPrimitives.instance) {
      WebCryptoPrimitives.instance = new WebCryptoPrimitives(config ?? ENCRYPTION_PRIMITIVES_CONFIG);
    }
    return WebCryptoPrimitives.instance;
  }
  async generateDEK(length) {
    switch (this.config.dekAlgorithm) {
      case "AES-GCM": {
        const dek = await crypto.subtle.generateKey({ name: this.config.dekAlgorithm, length: length ?? this.config.keySize }, true, ["encrypt", "decrypt"]);
        return await crypto.subtle.exportKey("raw", dek).then((dekData) => new Uint8Array(dekData));
      }
      default:
        throw new MessagingClientError("Unsupported Data Encryption Key algorithm");
    }
  }
  generateNonce(length) {
    return crypto.getRandomValues(new Uint8Array(length ?? this.config.nonceSize));
  }
  async encryptBytes(key, nonce, aad, bytesToEncrypt) {
    switch (this.config.dekAlgorithm) {
      case "AES-GCM": {
        const importedDEK = await crypto.subtle.importKey("raw", key, { name: this.config.dekAlgorithm }, false, ["encrypt"]);
        return await crypto.subtle.encrypt({
          name: this.config.dekAlgorithm,
          iv: nonce,
          additionalData: aad
        }, importedDEK, bytesToEncrypt).then((encryptedData) => new Uint8Array(encryptedData));
      }
      default:
        throw new MessagingClientError("Unsupported encryption algorithm");
    }
  }
  async decryptBytes(key, nonce, aad, encryptedBytes) {
    switch (this.config.dekAlgorithm) {
      case "AES-GCM": {
        const importedDEK = await crypto.subtle.importKey("raw", key, { name: this.config.dekAlgorithm }, false, ["decrypt"]);
        return await crypto.subtle.decrypt({
          name: this.config.dekAlgorithm,
          iv: nonce,
          additionalData: aad
        }, importedDEK, encryptedBytes).then((decryptedData) => new Uint8Array(decryptedData));
      }
      default:
        throw new MessagingClientError("Unsupported encryption algorithm");
    }
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/encryption/sessionKeyManager.js
class SessionKeyManager {
  constructor(sessionKey, sessionKeyConfig, suiClient, sealApproveContract) {
    this.sessionKey = sessionKey;
    this.sessionKeyConfig = sessionKeyConfig;
    this.suiClient = suiClient;
    this.sealApproveContract = sealApproveContract;
    if (!sessionKey && !sessionKeyConfig) {
      throw new Error("Either sessionKey or sessionKeyConfig must be provided");
    }
    if (sessionKey && sessionKeyConfig) {
      throw new Error("Cannot provide both sessionKey and sessionKeyConfig. Choose one.");
    }
  }
  async getSessionKey() {
    if (this.sessionKey) {
      if (this.sessionKey.isExpired()) {
        throw new Error("The provided SessionKey has expired. Please provide a new SessionKey instance. When using an external SessionKey, lifecycle management is your responsibility.");
      }
      return this.sessionKey;
    }
    if (this.sessionKeyConfig) {
      if (this.managedSessionKey && !this.managedSessionKey.isExpired()) {
        return this.managedSessionKey;
      }
      this.managedSessionKey = await SessionKey.create({
        address: this.sessionKeyConfig.address,
        signer: this.sessionKeyConfig.signer,
        ttlMin: this.sessionKeyConfig.ttlMin,
        mvrName: this.sessionKeyConfig.mvrName,
        packageId: this.sealApproveContract.packageId,
        suiClient: this.suiClient
      });
      return this.managedSessionKey;
    }
    throw new Error("Invalid SessionKeyManager state");
  }
  updateExternalSessionKey(newSessionKey) {
    if (!this.sessionKey) {
      throw new Error("Cannot update external SessionKey when using managed SessionKey");
    }
    this.sessionKey = newSessionKey;
  }
  async refreshManagedSessionKey() {
    if (!this.sessionKeyConfig) {
      throw new Error("Cannot refresh managed SessionKey when using external SessionKey");
    }
    this.managedSessionKey = undefined;
    return this.getSessionKey();
  }
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/encryption/envelopeEncryption.js
var __typeError3 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck3 = (obj, member, msg) => member.has(obj) || __typeError3("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck3(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd3 = (obj, member, value) => member.has(obj) ? __typeError3("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck3(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _suiClient;
var _encryptionPrimitives;
var _sessionKeyManager;
var _sealApproveContract;
var _sealConfig;

class EnvelopeEncryption {
  constructor(config) {
    __privateAdd3(this, _suiClient);
    __privateAdd3(this, _encryptionPrimitives);
    __privateAdd3(this, _sessionKeyManager);
    __privateAdd3(this, _sealApproveContract);
    __privateAdd3(this, _sealConfig);
    __privateSet(this, _suiClient, config.suiClient);
    __privateSet(this, _sealApproveContract, config.sealApproveContract);
    __privateSet(this, _sealConfig, {
      threshold: config.sealConfig?.threshold ?? 2
    });
    __privateSet(this, _encryptionPrimitives, config.encryptionPrimitives ?? WebCryptoPrimitives.getInstance());
    __privateSet(this, _sessionKeyManager, new SessionKeyManager(config.sessionKey, config.sessionKeyConfig, __privateGet(this, _suiClient), __privateGet(this, _sealApproveContract)));
  }
  updateSessionKey(newSessionKey) {
    __privateGet(this, _sessionKeyManager).updateExternalSessionKey(newSessionKey);
  }
  async refreshSessionKey() {
    return __privateGet(this, _sessionKeyManager).refreshManagedSessionKey();
  }
  async generateEncryptedChannelDEK({
    channelId
  }) {
    const logger = getLogger2(LOG_CATEGORIES.ENCRYPTION);
    logger.debug("Generating encrypted channel DEK", { channelId });
    if (!isValidSuiObjectId(channelId)) {
      throw new Error("The channelId provided is not a valid Sui Object ID");
    }
    const dek = await __privateGet(this, _encryptionPrimitives).generateDEK();
    const nonce = __privateGet(this, _encryptionPrimitives).generateNonce();
    const sealPolicyBytes = fromHex(channelId);
    const id = toHex(new Uint8Array([...sealPolicyBytes, ...nonce]));
    const { encryptedObject: encryptedDekBytes } = await __privateGet(this, _suiClient).seal.encrypt({
      threshold: __privateGet(this, _sealConfig).threshold,
      packageId: __privateGet(this, _sealApproveContract).packageId,
      id,
      data: dek
    });
    logger.debug("Channel DEK generated and encrypted", {
      channelId,
      encryptedKeyLength: encryptedDekBytes.length
    });
    return new Uint8Array(encryptedDekBytes);
  }
  generateNonce() {
    return __privateGet(this, _encryptionPrimitives).generateNonce();
  }
  async encryptText({
    text,
    channelId,
    sender,
    encryptedKey,
    memberCapId
  }) {
    const logger = getLogger2(LOG_CATEGORIES.ENCRYPTION);
    logger.debug("Encrypting text message", {
      channelId,
      textLength: text.length,
      sender
    });
    const nonce = __privateGet(this, _encryptionPrimitives).generateNonce();
    const dek = await this.decryptChannelDEK({
      encryptedKey,
      channelId,
      memberCapId
    });
    const ciphertext = await __privateGet(this, _encryptionPrimitives).encryptBytes(dek.bytes, nonce, this.encryptionAAD(channelId, dek.version, sender), new Uint8Array(new TextEncoder().encode(text)));
    return {
      encryptedBytes: ciphertext,
      nonce
    };
  }
  async decryptText({
    encryptedBytes: ciphertext,
    nonce,
    channelId,
    encryptedKey,
    sender,
    memberCapId
  }) {
    const logger = getLogger2(LOG_CATEGORIES.ENCRYPTION);
    logger.debug("Decrypting text message", {
      channelId,
      ciphertextLength: ciphertext.length,
      sender
    });
    const dek = await this.decryptChannelDEK({
      encryptedKey,
      channelId,
      memberCapId
    });
    const decryptedBytes = await __privateGet(this, _encryptionPrimitives).decryptBytes(dek.bytes, nonce, this.encryptionAAD(channelId, encryptedKey.version, sender), ciphertext);
    return new TextDecoder().decode(decryptedBytes);
  }
  async encryptAttachment({
    file,
    channelId,
    sender,
    encryptedKey,
    memberCapId
  }) {
    const { encryptedBytes: encryptedData, nonce: dataNonce } = await this.encryptAttachmentData({
      file,
      channelId,
      sender,
      encryptedKey,
      memberCapId
    });
    const { encryptedBytes: encryptedMetadata, nonce: metadataNonce } = await this.encryptAttachmentMetadata({
      file,
      channelId,
      sender,
      encryptedKey,
      memberCapId
    });
    return {
      data: { encryptedBytes: encryptedData, nonce: dataNonce },
      metadata: { encryptedBytes: encryptedMetadata, nonce: metadataNonce }
    };
  }
  async encryptAttachmentData({
    file,
    channelId,
    sender,
    encryptedKey,
    memberCapId
  }) {
    const dek = await this.decryptChannelDEK({
      encryptedKey,
      channelId,
      memberCapId
    });
    const nonce = this.generateNonce();
    const fileData = await file.arrayBuffer();
    const encryptedData = await __privateGet(this, _encryptionPrimitives).encryptBytes(dek.bytes, nonce, this.encryptionAAD(channelId, dek.version, sender), new Uint8Array(fileData));
    return { encryptedBytes: encryptedData, nonce };
  }
  async encryptAttachmentMetadata({
    channelId,
    sender,
    encryptedKey,
    memberCapId,
    file
  }) {
    const dek = await this.decryptChannelDEK({
      encryptedKey,
      channelId,
      memberCapId
    });
    const nonce = this.generateNonce();
    const metadata = {
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size
    };
    const metadataStr = JSON.stringify(metadata);
    const encryptedMetadata = await __privateGet(this, _encryptionPrimitives).encryptBytes(dek.bytes, nonce, this.encryptionAAD(channelId, dek.version, sender), new Uint8Array(new TextEncoder().encode(metadataStr)));
    return {
      encryptedBytes: encryptedMetadata,
      nonce
    };
  }
  async decryptAttachmentMetadata({
    channelId,
    sender,
    encryptedKey,
    memberCapId,
    encryptedBytes,
    nonce
  }) {
    const dek = await this.decryptChannelDEK({
      encryptedKey,
      channelId,
      memberCapId
    });
    const decryptedMetadataBytes = await __privateGet(this, _encryptionPrimitives).decryptBytes(dek.bytes, nonce, this.encryptionAAD(channelId, dek.version, sender), encryptedBytes);
    const metadataStr = new TextDecoder().decode(decryptedMetadataBytes);
    const { fileName, mimeType, fileSize } = JSON.parse(metadataStr);
    return {
      fileName,
      mimeType,
      fileSize
    };
  }
  async decryptAttachmentData({
    channelId,
    sender,
    encryptedKey,
    memberCapId,
    encryptedBytes,
    nonce
  }) {
    const dek = await this.decryptChannelDEK({
      encryptedKey,
      channelId,
      memberCapId
    });
    const decryptedData = await __privateGet(this, _encryptionPrimitives).decryptBytes(dek.bytes, nonce, this.encryptionAAD(channelId, dek.version, sender), encryptedBytes);
    return { data: decryptedData };
  }
  async decryptAttachment({
    channelId,
    sender,
    encryptedKey,
    memberCapId,
    data,
    metadata
  }) {
    const decryptedData = await this.decryptAttachmentData({
      channelId,
      sender,
      encryptedKey,
      memberCapId,
      encryptedBytes: data.encryptedBytes,
      nonce: data.nonce
    });
    const { fileName, mimeType, fileSize } = await this.decryptAttachmentMetadata({
      channelId,
      sender,
      encryptedKey,
      memberCapId,
      encryptedBytes: metadata.encryptedBytes,
      nonce: metadata.nonce
    });
    return {
      data: decryptedData.data,
      fileName,
      mimeType,
      fileSize
    };
  }
  async encryptMessage({
    text,
    attachments,
    channelId,
    sender,
    encryptedKey,
    memberCapId
  }) {
    const { encryptedBytes: ciphertext, nonce } = await this.encryptText({
      text,
      channelId,
      sender,
      encryptedKey,
      memberCapId
    });
    if (!attachments || attachments.length === 0) {
      return { text: { encryptedBytes: ciphertext, nonce } };
    }
    const encryptedAttachments = await Promise.all(attachments.map((file) => this.encryptAttachment({
      file,
      channelId,
      sender,
      encryptedKey,
      memberCapId
    })));
    return {
      text: { encryptedBytes: ciphertext, nonce },
      attachments: encryptedAttachments
    };
  }
  async decryptMessage({
    ciphertext,
    nonce,
    attachments,
    channelId,
    sender,
    encryptedKey,
    memberCapId
  }) {
    const text = await this.decryptText({
      encryptedBytes: ciphertext,
      nonce,
      channelId,
      sender,
      encryptedKey,
      memberCapId
    });
    if (!attachments || attachments.length === 0) {
      return { text };
    }
    const decryptedAttachments = await Promise.all(attachments.map((attachment) => this.decryptAttachment({
      ...attachment,
      channelId,
      sender,
      encryptedKey,
      memberCapId
    })));
    return {
      text,
      attachments: decryptedAttachments
    };
  }
  async decryptChannelDEK({
    encryptedKey,
    channelId,
    memberCapId
  }) {
    const logger = getLogger2(LOG_CATEGORIES.ENCRYPTION);
    if (!isValidSuiObjectId(channelId)) {
      throw new Error("The channelId provided is not a valid Sui Object ID");
    }
    if (!isValidSuiObjectId(memberCapId)) {
      throw new Error("The memberCapId provided is not a valid Sui Object ID");
    }
    const channelIdBytes = EncryptedObject.parse(encryptedKey.encryptedBytes).id;
    const tx = new Transaction;
    tx.moveCall({
      target: `${__privateGet(this, _sealApproveContract).packageId}::${__privateGet(this, _sealApproveContract).module}::${__privateGet(this, _sealApproveContract).functionName}`,
      arguments: [
        tx.pure.vector("u8", fromHex(channelIdBytes)),
        tx.object(channelId),
        tx.object(memberCapId)
      ]
    });
    const txBytes = await tx.build({ client: __privateGet(this, _suiClient), onlyTransactionKind: true });
    let dekBytes;
    try {
      dekBytes = await __privateGet(this, _suiClient).seal.decrypt({
        data: encryptedKey.encryptedBytes,
        sessionKey: await __privateGet(this, _sessionKeyManager).getSessionKey(),
        txBytes,
        checkLEEncoding: true
      });
    } catch (error) {
      logger.error("Error decrypting channel DEK", { channelId, memberCapId, error });
      throw error;
    }
    return {
      $kind: "Unencrypted",
      bytes: new Uint8Array(dekBytes || new Uint8Array),
      version: encryptedKey.version
    };
  }
  encryptionAAD(channelId, keyVersion, sender) {
    return new Uint8Array(new TextEncoder().encode(channelId + keyVersion.toString() + sender));
  }
}
_suiClient = new WeakMap;
_encryptionPrimitives = new WeakMap;
_sessionKeyManager = new WeakMap;
_sealApproveContract = new WeakMap;
_sealConfig = new WeakMap;

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/creator_cap.js
var $moduleName13 = "@local-pkg/sui-stack-messaging::creator_cap";
var CreatorCap = new MoveStruct({
  name: `${$moduleName13}::CreatorCap`,
  fields: {
    id: UID,
    channel_id: suiBcs.Address
  }
});
function transferToSender(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [`${packageAddress}::creator_cap::CreatorCap`];
  const parameterNames = ["self"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "creator_cap",
    function: "transfer_to_sender",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/member_cap.js
var $moduleName14 = "@local-pkg/sui-stack-messaging::member_cap";
var MemberCap = new MoveStruct({
  name: `${$moduleName14}::MemberCap`,
  fields: {
    id: UID,
    channel_id: suiBcs.Address
  }
});
function transferToRecipient(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    `${packageAddress}::member_cap::MemberCap`,
    `${packageAddress}::creator_cap::CreatorCap`,
    "address"
  ];
  const parameterNames = ["cap", "creatorCap", "recipient"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "member_cap",
    function: "transfer_to_recipient",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}
function transferMemberCaps(options) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  const argumentsTypes = [
    "vector<address>",
    `vector<${packageAddress}::member_cap::MemberCap>`,
    `${packageAddress}::creator_cap::CreatorCap`
  ];
  const parameterNames = ["memberAddresses", "memberCaps", "creatorCap"];
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "member_cap",
    function: "transfer_member_caps",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/contracts/sui_stack_messaging/config.js
var $moduleName15 = "@local-pkg/sui-stack-messaging::config";
var EditConfig = new MoveTuple({
  name: `${$moduleName15}::EditConfig`,
  fields: [suiBcs.bool()]
});
var Config = new MoveStruct({
  name: `${$moduleName15}::Config`,
  fields: {
    max_channel_members: suiBcs.u64(),
    max_channel_roles: suiBcs.u64(),
    max_message_text_chars: suiBcs.u64(),
    max_message_attachments: suiBcs.u64(),
    require_invitation: suiBcs.bool(),
    require_request: suiBcs.bool(),
    emit_events: suiBcs.bool()
  }
});
function none(options = {}) {
  const packageAddress = options.package ?? "@local-pkg/sui-stack-messaging";
  return (tx) => tx.moveCall({
    package: packageAddress,
    module: "config",
    function: "none"
  });
}

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/client.js
var __typeError4 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck4 = (obj, member, msg) => member.has(obj) || __typeError4("Cannot " + msg);
var __privateGet2 = (obj, member, getter) => (__accessCheck4(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd4 = (obj, member, value) => member.has(obj) ? __typeError4("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet2 = (obj, member, value, setter) => (__accessCheck4(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod3 = (obj, member, method) => (__accessCheck4(obj, member, "access private method"), method);
var _suiClient2;
var _packageConfig;
var _storage;
var _envelopeEncryption;
var _sealConfig2;
var _addressResolver;
var _channelResolver;
var _SuiStackMessagingClient_instances;
var resolveAddresses_fn;
var resolveChannelId_fn;
var getUserMemberCapId_fn;
var getEncryptionKeyFromChannel_fn;
var decryptMessage_fn;
var createAttachmentsVec_fn;
var resolveCreatorCapId_fn;
var executeTransaction_fn;
var getGeneratedCaps_fn;
var getCreatedObjectsByType_fn;
var deduplicateAddresses_fn;
var deriveMessageIDsFromRange_fn;
var parseMessageObjects_fn;
var createLazyAttachmentDataPromise_fn;
var calculateFetchRange_fn;
var fetchMessagesInRange_fn;
var determineNextPagination_fn;
var createEmptyMessagesResponse_fn;
var findOwnedObjectByChannelId_fn;
var getObjectContents_fn;
var _SuiStackMessagingClient = class _SuiStackMessagingClient2 {
  constructor(options) {
    this.options = options;
    __privateAdd4(this, _SuiStackMessagingClient_instances);
    __privateAdd4(this, _suiClient2);
    __privateAdd4(this, _packageConfig);
    __privateAdd4(this, _storage);
    __privateAdd4(this, _envelopeEncryption);
    __privateAdd4(this, _sealConfig2);
    __privateAdd4(this, _addressResolver);
    __privateAdd4(this, _channelResolver);
    __privateSet2(this, _suiClient2, options.suiClient);
    __privateSet2(this, _storage, options.storage);
    __privateSet2(this, _sealConfig2, {
      threshold: options.sealConfig?.threshold ?? 2
    });
    if (!options.packageConfig) {
      const network = __privateGet2(this, _suiClient2).network;
      switch (network) {
        case "testnet":
          __privateSet2(this, _packageConfig, TESTNET_MESSAGING_PACKAGE_CONFIG);
          break;
        case "mainnet":
          __privateSet2(this, _packageConfig, MAINNET_MESSAGING_PACKAGE_CONFIG);
          break;
        default:
          __privateSet2(this, _packageConfig, TESTNET_MESSAGING_PACKAGE_CONFIG);
          break;
      }
    } else {
      __privateSet2(this, _packageConfig, options.packageConfig);
    }
    const sealApproveContract = __privateGet2(this, _packageConfig).sealApproveContract ?? {
      packageId: __privateGet2(this, _packageConfig).packageId,
      ...DEFAULT_SEAL_APPROVE_CONTRACT
    };
    __privateSet2(this, _envelopeEncryption, new EnvelopeEncryption({
      suiClient: __privateGet2(this, _suiClient2),
      sealApproveContract,
      sessionKey: options.sessionKey,
      sessionKeyConfig: options.sessionKeyConfig,
      sealConfig: __privateGet2(this, _sealConfig2)
    }));
    __privateSet2(this, _addressResolver, options.addressResolver);
    __privateSet2(this, _channelResolver, options.channelResolver);
  }
  static experimental_asClientExtension(options) {
    return {
      name: "messaging",
      register: (client) => {
        const sealClient = client.seal;
        if (!sealClient) {
          throw new MessagingClientError("SealClient extension is required for MessagingClient");
        }
        if (!("storage" in options) && !("walrusStorageConfig" in options)) {
          throw new MessagingClientError('Either a custom storage adapter via "storage" option or explicit Walrus storage configuration via "walrusStorageConfig" option must be provided. Fallback to default Walrus endpoints is not supported.');
        }
        let packageConfig = options.packageConfig;
        if (!packageConfig) {
          const network = client.network;
          switch (network) {
            case "testnet":
              packageConfig = TESTNET_MESSAGING_PACKAGE_CONFIG;
              break;
            case "mainnet":
              packageConfig = MAINNET_MESSAGING_PACKAGE_CONFIG;
              break;
            default:
              packageConfig = TESTNET_MESSAGING_PACKAGE_CONFIG;
              break;
          }
        }
        const storage = "storage" in options ? (c) => options.storage(c) : (c) => {
          return new WalrusStorageAdapter(c, options.walrusStorageConfig);
        };
        return new _SuiStackMessagingClient2({
          suiClient: client,
          storage,
          packageConfig,
          sessionKey: "sessionKey" in options ? options.sessionKey : undefined,
          sessionKeyConfig: "sessionKeyConfig" in options ? options.sessionKeyConfig : undefined,
          sealConfig: options.sealConfig,
          addressResolver: options.addressResolver,
          channelResolver: options.channelResolver
        });
      }
    };
  }
  async getChannelMemberships(request) {
    const memberCapsRes = await __privateGet2(this, _suiClient2).core.listOwnedObjects({
      ...request,
      type: MemberCap.name.replace("@local-pkg/sui-stack-messaging", __privateGet2(this, _packageConfig).packageId),
      include: { content: true }
    });
    const validObjects = memberCapsRes.objects;
    if (validObjects.length === 0) {
      return {
        hasNextPage: memberCapsRes.hasNextPage,
        cursor: memberCapsRes.cursor,
        memberships: []
      };
    }
    const contents = await __privateMethod3(this, _SuiStackMessagingClient_instances, getObjectContents_fn).call(this, validObjects);
    const memberships = await Promise.all(contents.map(async (content) => {
      const parsedMemberCap = MemberCap.parse(content);
      return { member_cap_id: parsedMemberCap.id.id, channel_id: parsedMemberCap.channel_id };
    }));
    return {
      hasNextPage: memberCapsRes.hasNextPage,
      cursor: memberCapsRes.cursor,
      memberships
    };
  }
  async getChannelObjectsByAddress(request) {
    const membershipsPaginated = await this.getChannelMemberships(request);
    const seenChannelIds = /* @__PURE__ */ new Set;
    const deduplicatedMemberships = membershipsPaginated.memberships.filter((m) => {
      if (seenChannelIds.has(m.channel_id)) {
        return false;
      }
      seenChannelIds.add(m.channel_id);
      return true;
    });
    const channelObjects = await this.getChannelObjectsByChannelIds({
      channelIds: deduplicatedMemberships.map((m) => m.channel_id),
      userAddress: request.owner,
      memberCapIds: deduplicatedMemberships.map((m) => m.member_cap_id)
    });
    return {
      hasNextPage: membershipsPaginated.hasNextPage,
      cursor: membershipsPaginated.cursor,
      channelObjects
    };
  }
  async getChannelObjectsByChannelIds(request) {
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_READS);
    const { channelIds, userAddress, memberCapIds } = request;
    logger.debug("Fetching channel objects by IDs", {
      channelCount: channelIds.length,
      userAddress
    });
    const channelObjectsRes = await __privateGet2(this, _suiClient2).core.getObjects({
      objectIds: channelIds,
      include: { content: true }
    });
    const parsedChannels = await Promise.all(channelObjectsRes.objects.map(async (object2) => {
      if (object2 instanceof Error || !object2.content) {
        throw new MessagingClientError(`Failed to parse Channel object: ${object2}`);
      }
      return Channel.parse(await object2.content);
    }));
    const decryptedChannels = await Promise.all(parsedChannels.map(async (channel, index) => {
      const decryptedChannel = {
        ...channel,
        last_message: null
      };
      if (channel.last_message) {
        try {
          const memberCapId = memberCapIds?.[index] || await __privateMethod3(this, _SuiStackMessagingClient_instances, getUserMemberCapId_fn).call(this, userAddress, channel.id.id);
          const encryptedKey = await __privateMethod3(this, _SuiStackMessagingClient_instances, getEncryptionKeyFromChannel_fn).call(this, channel);
          const decryptedMessage = await __privateMethod3(this, _SuiStackMessagingClient_instances, decryptMessage_fn).call(this, channel.last_message, channel.id.id, memberCapId, encryptedKey);
          decryptedChannel.last_message = decryptedMessage;
        } catch (error) {
          logger.warn("Failed to decrypt last message for channel", {
            channelId: channel.id.id,
            error: error instanceof Error ? error.message : String(error)
          });
          decryptedChannel.last_message = null;
        }
      }
      return decryptedChannel;
    }));
    logger.info("Retrieved channel objects", {
      channelCount: decryptedChannels.length,
      channelIds: decryptedChannels.map((c) => c.id.id),
      userAddress
    });
    return decryptedChannels;
  }
  async getCreatorCap(userAddress, channelId) {
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_READS);
    logger.debug("Fetching CreatorCap", { userAddress, channelId });
    const creatorCap = await __privateMethod3(this, _SuiStackMessagingClient_instances, findOwnedObjectByChannelId_fn).call(this, CreatorCap, userAddress, channelId);
    if (creatorCap) {
      logger.info("Found CreatorCap", {
        userAddress,
        channelId,
        creatorCapId: creatorCap.id.id
      });
    } else {
      logger.debug("CreatorCap not found", { userAddress, channelId });
    }
    return creatorCap;
  }
  async getUserMemberCap(userAddress, channelId) {
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_READS);
    logger.debug("Fetching MemberCap", { userAddress, channelId });
    const memberCap = await __privateMethod3(this, _SuiStackMessagingClient_instances, findOwnedObjectByChannelId_fn).call(this, MemberCap, userAddress, channelId);
    if (memberCap) {
      logger.info("Found MemberCap", {
        userAddress,
        channelId,
        memberCapId: memberCap.id.id
      });
    } else {
      logger.debug("MemberCap not found", { userAddress, channelId });
    }
    return memberCap;
  }
  async getChannelMembers(channelNameOrId) {
    const channelId = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveChannelId_fn).call(this, channelNameOrId);
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_READS);
    logger.debug("Fetching channel members", { channelId, originalInput: channelNameOrId });
    const channelObjectsRes = await __privateGet2(this, _suiClient2).core.getObjects({
      objectIds: [channelId],
      include: { content: true }
    });
    const channelObject = channelObjectsRes.objects[0];
    if (channelObject instanceof Error || !channelObject.content) {
      throw new MessagingClientError(`Failed to parse Channel object: ${channelObject}`);
    }
    const channel = Channel.parse(await channelObject.content);
    const memberCapIds = channel.auth.member_permissions.contents.map((entry) => entry.key);
    if (memberCapIds.length === 0) {
      return { members: [] };
    }
    const memberCapObjects = await __privateGet2(this, _suiClient2).core.getObjects({
      objectIds: memberCapIds,
      include: { content: true }
    });
    const members = [];
    for (const obj of memberCapObjects.objects) {
      if (obj instanceof Error || !obj.content) {
        logger.warn("Failed to fetch MemberCap object", {
          channelId,
          error: obj instanceof Error ? obj.message : "No content in object"
        });
        continue;
      }
      try {
        const memberCap = MemberCap.parse(await obj.content);
        if (obj.owner) {
          let memberAddress;
          if (obj.owner.$kind === "AddressOwner") {
            memberAddress = obj.owner.AddressOwner;
          } else if (obj.owner.$kind === "ObjectOwner") {
            logger.warn("MemberCap is object-owned, skipping", {
              channelId,
              memberCapId: memberCap.id.id
            });
            continue;
          } else {
            logger.warn("MemberCap has unknown ownership type", {
              channelId,
              ownerKind: obj.owner.$kind
            });
            continue;
          }
          members.push({
            memberAddress,
            memberCapId: memberCap.id.id
          });
        }
      } catch (error) {
        logger.warn("Failed to parse MemberCap object", {
          channelId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    logger.info("Retrieved channel members", {
      channelId,
      memberCount: members.length,
      memberCapIds: members.map((m) => m.memberCapId)
    });
    return { members };
  }
  async getChannelMessages({
    channelId: channelNameOrId,
    userAddress,
    cursor = null,
    limit = 50,
    direction = "backward"
  }) {
    const channelId = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveChannelId_fn).call(this, channelNameOrId);
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_READS);
    logger.debug("Fetching channel messages", { channelId, originalInput: channelNameOrId, userAddress, cursor, limit, direction });
    const channelObjectsRes = await __privateGet2(this, _suiClient2).core.getObjects({
      objectIds: [channelId],
      include: { content: true }
    });
    const channelObject = channelObjectsRes.objects[0];
    if (channelObject instanceof Error || !channelObject.content) {
      throw new MessagingClientError(`Failed to parse Channel object: ${channelObject}`);
    }
    const channel = Channel.parse(await channelObject.content);
    const messagesTableId = channel.messages.contents.id.id;
    const totalMessagesCount = BigInt(channel.messages_count);
    if (totalMessagesCount === BigInt(0)) {
      return __privateMethod3(this, _SuiStackMessagingClient_instances, createEmptyMessagesResponse_fn).call(this, direction);
    }
    if (cursor !== null && cursor >= totalMessagesCount) {
      throw new MessagingClientError(`Cursor ${cursor} is out of bounds. Channel has ${totalMessagesCount} messages.`);
    }
    const fetchRange = __privateMethod3(this, _SuiStackMessagingClient_instances, calculateFetchRange_fn).call(this, {
      cursor,
      limit,
      direction,
      totalMessagesCount
    });
    if (fetchRange.startIndex >= fetchRange.endIndex) {
      return __privateMethod3(this, _SuiStackMessagingClient_instances, createEmptyMessagesResponse_fn).call(this, direction);
    }
    const rawMessages = await __privateMethod3(this, _SuiStackMessagingClient_instances, fetchMessagesInRange_fn).call(this, messagesTableId, fetchRange);
    const memberCapId = await __privateMethod3(this, _SuiStackMessagingClient_instances, getUserMemberCapId_fn).call(this, userAddress, channelId);
    const encryptedKey = await __privateMethod3(this, _SuiStackMessagingClient_instances, getEncryptionKeyFromChannel_fn).call(this, channel);
    const decryptedMessages = await Promise.all(rawMessages.map(async (message) => {
      try {
        return await __privateMethod3(this, _SuiStackMessagingClient_instances, decryptMessage_fn).call(this, message, channelId, memberCapId, encryptedKey);
      } catch (error) {
        logger.warn("Failed to decrypt message in channel", {
          channelId,
          sender: message.sender,
          error: error instanceof Error ? error.message : String(error)
        });
        return {
          text: "[Failed to decrypt message]",
          sender: message.sender,
          createdAtMs: message.created_at_ms,
          attachments: []
        };
      }
    }));
    const nextPagination = __privateMethod3(this, _SuiStackMessagingClient_instances, determineNextPagination_fn).call(this, {
      fetchRange,
      direction,
      totalMessagesCount
    });
    logger.info("Retrieved channel messages", {
      channelId,
      messagesTableId,
      messageCount: decryptedMessages.length,
      fetchRange: `${fetchRange.startIndex}-${fetchRange.endIndex}`,
      cursor: nextPagination.cursor,
      hasNextPage: nextPagination.hasNextPage,
      direction
    });
    return {
      messages: decryptedMessages,
      cursor: nextPagination.cursor,
      hasNextPage: nextPagination.hasNextPage,
      direction
    };
  }
  async getLatestMessages({
    channelId: channelNameOrId,
    userAddress,
    pollingState,
    limit = 50
  }) {
    const channelId = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveChannelId_fn).call(this, channelNameOrId);
    const channelObjectsRes = await __privateGet2(this, _suiClient2).core.getObjects({
      objectIds: [channelId],
      include: { content: true }
    });
    const channelObject = channelObjectsRes.objects[0];
    if (channelObject instanceof Error || !channelObject.content) {
      throw new MessagingClientError(`Failed to parse Channel object: ${channelObject}`);
    }
    const channel = Channel.parse(await channelObject.content);
    const latestMessageCount = BigInt(channel.messages_count);
    const newMessagesCount = latestMessageCount - pollingState.lastMessageCount;
    if (newMessagesCount === BigInt(0)) {
      return {
        messages: [],
        cursor: pollingState.lastCursor,
        hasNextPage: pollingState.lastCursor !== null,
        direction: "backward"
      };
    }
    const fetchLimit = Math.min(Number(newMessagesCount), limit);
    const response = await this.getChannelMessages({
      channelId,
      userAddress,
      cursor: pollingState.lastCursor,
      limit: fetchLimit,
      direction: "backward"
    });
    return response;
  }
  async createChannelFlow({
    creatorAddress,
    initialMemberAddresses
  }) {
    const resolvedInitialMemberAddresses = initialMemberAddresses ? await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveAddresses_fn).call(this, initialMemberAddresses) : undefined;
    const build = () => {
      const logger = getLogger2(LOG_CATEGORIES.CLIENT_WRITES);
      const tx = new Transaction;
      const config = tx.add(none());
      const [channel, creatorCap, creatorMemberCap] = tx.add(_new2({ arguments: { config } }));
      const uniqueAddresses = resolvedInitialMemberAddresses && resolvedInitialMemberAddresses.length > 0 ? __privateMethod3(this, _SuiStackMessagingClient_instances, deduplicateAddresses_fn).call(this, resolvedInitialMemberAddresses, creatorAddress) : [];
      if (resolvedInitialMemberAddresses && uniqueAddresses.length !== resolvedInitialMemberAddresses.length) {
        logger.warn("Duplicate addresses or creator address detected in initialMemberAddresses. Creator automatically receives a MemberCap. Using unique non-creator addresses only.", {
          originalCount: resolvedInitialMemberAddresses?.length,
          uniqueCount: uniqueAddresses.length,
          creatorAddress
        });
      }
      let memberCaps = null;
      if (uniqueAddresses.length > 0) {
        memberCaps = tx.add(addMembers({
          arguments: {
            self: channel,
            memberCap: creatorMemberCap,
            n: uniqueAddresses.length
          }
        }));
      }
      tx.add(share({ arguments: { self: channel, creatorCap } }));
      tx.add(transferToRecipient({
        arguments: { cap: creatorMemberCap, creatorCap, recipient: creatorAddress }
      }));
      if (memberCaps !== null) {
        tx.add(transferMemberCaps({
          arguments: {
            memberAddresses: tx.pure.vector("address", uniqueAddresses),
            memberCaps,
            creatorCap
          }
        }));
      }
      tx.add(transferToSender({ arguments: { self: creatorCap } }));
      return tx;
    };
    const getGeneratedCaps = async ({ digest }) => {
      return await __privateMethod3(this, _SuiStackMessagingClient_instances, getGeneratedCaps_fn).call(this, digest);
    };
    const generateAndAttachEncryptionKey = async ({
      creatorCap,
      creatorMemberCap
    }) => {
      const encryptedKeyBytes = await __privateGet2(this, _envelopeEncryption).generateEncryptedChannelDEK({
        channelId: creatorCap.channel_id
      });
      const tx = new Transaction;
      tx.add(addEncryptedKey({
        arguments: {
          self: tx.object(creatorCap.channel_id),
          memberCap: tx.object(creatorMemberCap.id.id),
          newEncryptionKeyBytes: tx.pure.vector("u8", encryptedKeyBytes)
        }
      }));
      return {
        transaction: tx,
        creatorCap,
        encryptedKeyBytes
      };
    };
    const getGeneratedEncryptionKey = ({
      creatorCap,
      encryptedKeyBytes
    }) => {
      return { channelId: creatorCap.channel_id, encryptedKeyBytes };
    };
    const stepResults = {};
    function getResults(step, current) {
      if (!stepResults[step]) {
        throw new Error(`${String(step)} must be executed before calling ${String(current)}`);
      }
      return stepResults[step];
    }
    return {
      build: () => {
        if (!stepResults.build) {
          stepResults.build = build();
        }
        return stepResults.build;
      },
      getGeneratedCaps: async (opts) => {
        getResults("build", "getGeneratedCaps");
        stepResults.getGeneratedCaps = await getGeneratedCaps(opts);
        return stepResults.getGeneratedCaps;
      },
      generateAndAttachEncryptionKey: async () => {
        stepResults.generateAndAttachEncryptionKey = await generateAndAttachEncryptionKey(getResults("getGeneratedCaps", "generateAndAttachEncryptionKey"));
        return stepResults.generateAndAttachEncryptionKey.transaction;
      },
      getGeneratedEncryptionKey: () => {
        return getGeneratedEncryptionKey(getResults("generateAndAttachEncryptionKey", "getGeneratedEncryptionKey"));
      }
    };
  }
  async sendMessage(channelId, memberCapId, sender, message, encryptedKey, attachments) {
    return async (tx) => {
      const channel = tx.object(channelId);
      const memberCap = tx.object(memberCapId);
      const { encryptedBytes: ciphertext, nonce: textNonce } = await __privateGet2(this, _envelopeEncryption).encryptText({
        text: message,
        channelId,
        sender,
        memberCapId,
        encryptedKey
      });
      const attachmentsVec = await __privateMethod3(this, _SuiStackMessagingClient_instances, createAttachmentsVec_fn).call(this, tx, encryptedKey, channelId, memberCapId, sender, attachments);
      tx.add(sendMessage({
        package: __privateGet2(this, _packageConfig).packageId,
        arguments: {
          self: channel,
          memberCap,
          ciphertext: tx.pure.vector("u8", ciphertext),
          nonce: tx.pure.vector("u8", textNonce),
          attachments: attachmentsVec
        }
      }));
    };
  }
  async executeSendMessageTransaction({
    signer,
    channelId: channelNameOrId,
    memberCapId,
    message,
    attachments,
    encryptedKey
  }) {
    const channelId = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveChannelId_fn).call(this, channelNameOrId);
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_WRITES);
    const senderAddress = signer.toSuiAddress();
    logger.debug("Sending message", {
      channelId,
      originalInput: channelNameOrId,
      memberCapId,
      senderAddress,
      messageLength: message.length,
      attachmentCount: attachments?.length ?? 0
    });
    const tx = new Transaction;
    const sendMessageTxBuilder = await this.sendMessage(channelId, memberCapId, senderAddress, message, encryptedKey, attachments);
    await sendMessageTxBuilder(tx);
    const { digest, effects } = await __privateMethod3(this, _SuiStackMessagingClient_instances, executeTransaction_fn).call(this, tx, signer, "send message", true);
    const messageId = effects.changedObjects.find((obj) => obj.idOperation === "Created")?.objectId;
    if (messageId === undefined) {
      throw new MessagingClientError("Message id not found on the transaction effects");
    }
    logger.info("Message sent", {
      channelId,
      messageId,
      senderAddress,
      hasAttachments: (attachments?.length ?? 0) > 0,
      digest
    });
    return { digest, messageId };
  }
  addMembers(options) {
    return async (tx) => {
      const { memberCapId, newMemberAddresses } = options;
      const channelId = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveChannelId_fn).call(this, options.channelId);
      const logger = getLogger2(LOG_CATEGORIES.CLIENT_WRITES);
      const resolvedAddresses = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveAddresses_fn).call(this, newMemberAddresses);
      const uniqueAddresses = __privateMethod3(this, _SuiStackMessagingClient_instances, deduplicateAddresses_fn).call(this, resolvedAddresses);
      if (uniqueAddresses.length !== resolvedAddresses.length) {
        logger.warn("Duplicate addresses removed from newMemberAddresses.", {
          channelId,
          originalCount: resolvedAddresses.length,
          uniqueCount: uniqueAddresses.length
        });
      }
      if (uniqueAddresses.length === 0) {
        logger.warn("No members to add after deduplication.", { channelId });
        return;
      }
      const creatorCapId = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveCreatorCapId_fn).call(this, options);
      const memberCaps = tx.add(addMembers({
        package: __privateGet2(this, _packageConfig).packageId,
        arguments: {
          self: tx.object(channelId),
          memberCap: tx.object(memberCapId),
          n: uniqueAddresses.length
        }
      }));
      tx.add(transferMemberCaps({
        package: __privateGet2(this, _packageConfig).packageId,
        arguments: {
          memberAddresses: tx.pure.vector("address", uniqueAddresses),
          memberCaps,
          creatorCap: tx.object(creatorCapId)
        }
      }));
    };
  }
  async addMembersTransaction({
    transaction = new Transaction,
    ...options
  }) {
    const addMembersTxBuilder = this.addMembers(options);
    await addMembersTxBuilder(transaction);
    return transaction;
  }
  async executeAddMembersTransaction({
    signer,
    transaction,
    ...options
  }) {
    const channelId = await __privateMethod3(this, _SuiStackMessagingClient_instances, resolveChannelId_fn).call(this, options.channelId);
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_WRITES);
    logger.debug("Adding members to channel", {
      channelId,
      originalInput: options.channelId,
      newMemberAddresses: options.newMemberAddresses
    });
    const { memberCapId, newMemberAddresses, creatorCapId } = options;
    const addMembersOptions = creatorCapId ? { channelId, memberCapId, newMemberAddresses, creatorCapId } : { channelId, memberCapId, newMemberAddresses, address: signer.toSuiAddress() };
    const tx = transaction ?? new Transaction;
    const addMembersTxBuilder = this.addMembers(addMembersOptions);
    await addMembersTxBuilder(tx);
    const { digest, effects } = await __privateMethod3(this, _SuiStackMessagingClient_instances, executeTransaction_fn).call(this, tx, signer, "add members", true);
    const memberCapsWithOwner = await __privateMethod3(this, _SuiStackMessagingClient_instances, getCreatedObjectsByType_fn).call(this, {
      effects,
      objectTypeName: MemberCap.name,
      parseFunction: (content) => MemberCap.parse(content),
      errorMessage: `MemberCap objects not found in transaction effects for transaction (${digest})`
    });
    const addedMembers = memberCapsWithOwner.map(({ object: object2, owner }) => {
      let ownerAddress;
      if (owner.$kind === "AddressOwner") {
        ownerAddress = owner.AddressOwner;
      } else if (owner.$kind === "ObjectOwner") {
        ownerAddress = owner.ObjectOwner;
      } else if (owner.$kind === "Shared") {
        ownerAddress = "Shared";
      } else {
        ownerAddress = "Immutable";
      }
      return {
        memberCap: object2,
        ownerAddress
      };
    });
    logger.info("Members added to channel", {
      channelId: options.channelId,
      addedMemberCount: addedMembers.length,
      memberCapIds: addedMembers.map((m) => m.memberCap.id.id),
      digest
    });
    return { digest, addedMembers };
  }
  updateSessionKey(newSessionKey) {
    __privateGet2(this, _envelopeEncryption).updateSessionKey(newSessionKey);
  }
  async refreshSessionKey() {
    return __privateGet2(this, _envelopeEncryption).refreshSessionKey();
  }
  async executeCreateChannelTransaction({
    signer,
    initialMembers
  }) {
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_WRITES);
    const creatorAddress = signer.toSuiAddress();
    logger.debug("Creating channel", {
      creatorAddress,
      initialMemberCount: initialMembers?.length ?? 0
    });
    const flow = await this.createChannelFlow({
      creatorAddress,
      initialMemberAddresses: initialMembers
    });
    const channelTx = flow.build();
    const { digest: channelDigest } = await __privateMethod3(this, _SuiStackMessagingClient_instances, executeTransaction_fn).call(this, channelTx, signer, "create channel");
    const {
      creatorCap,
      creatorMemberCap,
      additionalMemberCaps: _
    } = await flow.getGeneratedCaps({
      digest: channelDigest
    });
    const attachKeyTx = await flow.generateAndAttachEncryptionKey({ creatorMemberCap });
    const { digest: keyDigest } = await __privateMethod3(this, _SuiStackMessagingClient_instances, executeTransaction_fn).call(this, attachKeyTx, signer, "attach encryption key");
    const { channelId, encryptedKeyBytes } = flow.getGeneratedEncryptionKey();
    logger.info("Channel created", {
      channelId,
      creatorCapId: creatorCap.id.id,
      creatorAddress,
      memberCount: (initialMembers?.length ?? 0) + 1,
      digest: keyDigest
    });
    return { digest: keyDigest, creatorCapId: creatorCap.id.id, channelId, encryptedKeyBytes };
  }
};
_suiClient2 = new WeakMap;
_packageConfig = new WeakMap;
_storage = new WeakMap;
_envelopeEncryption = new WeakMap;
_sealConfig2 = new WeakMap;
_addressResolver = new WeakMap;
_channelResolver = new WeakMap;
_SuiStackMessagingClient_instances = new WeakSet;
resolveAddresses_fn = async function(addresses) {
  if (!__privateGet2(this, _addressResolver) || addresses.length === 0) {
    return addresses;
  }
  return __privateGet2(this, _addressResolver).resolveMany(addresses);
};
resolveChannelId_fn = async function(channelNameOrId) {
  if (!__privateGet2(this, _channelResolver)) {
    return channelNameOrId;
  }
  return __privateGet2(this, _channelResolver).resolve(channelNameOrId);
};
getUserMemberCapId_fn = async function(userAddress, channelId) {
  const memberCap = await this.getUserMemberCap(userAddress, channelId);
  if (!memberCap) {
    throw new MessagingClientError(`User ${userAddress} is not a member of channel ${channelId}`);
  }
  return memberCap.id.id;
};
getEncryptionKeyFromChannel_fn = async function(channel) {
  const encryptedKeyBytes = channel.encryption_key_history.latest;
  const keyVersion = channel.encryption_key_history.latest_version;
  return {
    $kind: "Encrypted",
    encryptedBytes: new Uint8Array(encryptedKeyBytes),
    version: keyVersion
  };
};
decryptMessage_fn = async function(message, channelId, memberCapId, encryptedKey) {
  const text = await __privateGet2(this, _envelopeEncryption).decryptText({
    encryptedBytes: new Uint8Array(message.ciphertext),
    nonce: new Uint8Array(message.nonce),
    sender: message.sender,
    channelId,
    memberCapId,
    encryptedKey
  });
  if (!message.attachments || message.attachments.length === 0) {
    return { text, attachments: [], sender: message.sender, createdAtMs: message.created_at_ms };
  }
  const attachmentsMetadata = await Promise.all(message.attachments.map(async (attachment) => {
    const metadata = await __privateGet2(this, _envelopeEncryption).decryptAttachmentMetadata({
      encryptedBytes: new Uint8Array(attachment.encrypted_metadata),
      nonce: new Uint8Array(attachment.metadata_nonce),
      channelId,
      sender: message.sender,
      encryptedKey,
      memberCapId
    });
    return {
      metadata,
      attachment
    };
  }));
  const lazyAttachmentsDataPromises = attachmentsMetadata.map(({ metadata, attachment }) => ({
    ...metadata,
    data: __privateMethod3(this, _SuiStackMessagingClient_instances, createLazyAttachmentDataPromise_fn).call(this, {
      blobRef: attachment.blob_ref,
      nonce: new Uint8Array(attachment.data_nonce),
      channelId,
      sender: message.sender,
      encryptedKey,
      memberCapId
    })
  }));
  return {
    text,
    sender: message.sender,
    createdAtMs: message.created_at_ms,
    attachments: lazyAttachmentsDataPromises
  };
};
createAttachmentsVec_fn = async function(tx, encryptedKey, channelId, memberCapId, sender, attachments) {
  const attachmentType = __privateGet2(this, _packageConfig).packageId ? Attachment.name.replace("@local-pkg/sui-stack-messaging", __privateGet2(this, _packageConfig).packageId) : Attachment.name;
  if (!attachments || attachments.length === 0) {
    return tx.moveCall({
      package: "0x1",
      module: "vector",
      function: "empty",
      arguments: [],
      typeArguments: [attachmentType]
    });
  }
  const encryptedDataPayloads = await Promise.all(attachments.map(async (file) => {
    return __privateGet2(this, _envelopeEncryption).encryptAttachmentData({
      file,
      channelId,
      memberCapId,
      encryptedKey,
      sender
    });
  }));
  const attachmentRefs = await __privateGet2(this, _storage).call(this, __privateGet2(this, _suiClient2)).upload(encryptedDataPayloads.map((p) => p.encryptedBytes), { storageType: "quilts" });
  const encryptedMetadataPayloads = await Promise.all(attachments.map((file) => {
    return __privateGet2(this, _envelopeEncryption).encryptAttachmentMetadata({
      file,
      channelId,
      memberCapId,
      encryptedKey,
      sender
    });
  }));
  return tx.makeMoveVec({
    type: attachmentType,
    elements: attachmentRefs.ids.map((blobRef, i) => {
      const dataNonce = encryptedDataPayloads[i].nonce;
      const metadata = encryptedMetadataPayloads[i];
      const metadataNonce = metadata.nonce;
      return tx.add(_new({
        package: __privateGet2(this, _packageConfig).packageId,
        arguments: {
          blobRef: tx.pure.string(blobRef),
          encryptedMetadata: tx.pure.vector("u8", metadata.encryptedBytes),
          dataNonce: tx.pure.vector("u8", dataNonce),
          metadataNonce: tx.pure.vector("u8", metadataNonce),
          keyVersion: tx.pure("u32", encryptedKey.version)
        }
      }));
    })
  });
};
resolveCreatorCapId_fn = async function(options) {
  if (options.creatorCapId) {
    return options.creatorCapId;
  }
  const { address, channelId } = options;
  const creatorCap = await this.getCreatorCap(address, channelId);
  if (!creatorCap) {
    const logger = getLogger2(LOG_CATEGORIES.CLIENT_WRITES);
    logger.warn("CreatorCap not found for user", { address, channelId });
    throw new MessagingClientError(`User ${address} does not own a CreatorCap for channel ${channelId}`);
  }
  return creatorCap.id.id;
};
executeTransaction_fn = async function(transaction, signer, action, waitForTransaction = true) {
  transaction.setSenderIfNotSet(signer.toSuiAddress());
  const result = await signer.signAndExecuteTransaction({
    transaction,
    client: __privateGet2(this, _suiClient2)
  });
  const txn = result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
  if (!txn) {
    throw new MessagingClientError(`Failed to ${action}: no transaction in result`);
  }
  const { digest, effects } = txn;
  if (effects?.status.error) {
    throw new MessagingClientError(`Failed to ${action} (${digest}): ${effects?.status.error}`);
  }
  if (waitForTransaction) {
    await __privateGet2(this, _suiClient2).core.waitForTransaction({
      digest
    });
  }
  return { digest, effects };
};
getGeneratedCaps_fn = async function(digest) {
  const waitResult = await __privateGet2(this, _suiClient2).core.waitForTransaction({
    digest,
    include: { effects: true }
  });
  const txn = waitResult.$kind === "Transaction" ? waitResult.Transaction : waitResult.FailedTransaction;
  if (!txn) {
    throw new MessagingClientError(`Failed to get generated caps: no transaction for digest ${digest}`);
  }
  const effects = txn.effects;
  const creatorCapsWithOwner = await __privateMethod3(this, _SuiStackMessagingClient_instances, getCreatedObjectsByType_fn).call(this, {
    effects,
    objectTypeName: CreatorCap.name,
    parseFunction: (content) => CreatorCap.parse(content),
    errorMessage: `CreatorCap object not found in transaction effects for transaction (${digest})`
  });
  if (creatorCapsWithOwner.length === 0) {
    throw new MessagingClientError(`CreatorCap object not found in transaction effects for transaction (${digest})`);
  }
  const { object: creatorCap, owner: creatorCapOwner } = creatorCapsWithOwner[0];
  const allMemberCapsWithOwner = await __privateMethod3(this, _SuiStackMessagingClient_instances, getCreatedObjectsByType_fn).call(this, {
    effects,
    objectTypeName: MemberCap.name,
    parseFunction: (content) => MemberCap.parse(content),
    errorMessage: `MemberCap objects not found in transaction effects for transaction (${digest})`
  });
  const creatorMemberCapWithOwner = allMemberCapsWithOwner.find(({ owner }) => owner.$kind === "AddressOwner" && creatorCapOwner.$kind === "AddressOwner" && owner.AddressOwner === creatorCapOwner.AddressOwner);
  if (!creatorMemberCapWithOwner) {
    throw new MessagingClientError(`CreatorMemberCap object not found in transaction effects for transaction (${digest})`);
  }
  const creatorMemberCap = creatorMemberCapWithOwner.object;
  const additionalMemberCaps = allMemberCapsWithOwner.filter((item) => item.object.id.id !== creatorMemberCap.id.id).map((item) => item.object);
  return {
    creatorCap,
    creatorMemberCap,
    additionalMemberCaps
  };
};
getCreatedObjectsByType_fn = async function({
  effects,
  objectTypeName,
  parseFunction,
  errorMessage
}) {
  const objectType = objectTypeName.replace("@local-pkg/sui-stack-messaging", __privateGet2(this, _packageConfig).packageId);
  const createdObjectIds = effects.changedObjects.filter((object2) => object2.idOperation === "Created" && object2.outputState !== "DoesNotExist").map((object2) => object2.objectId);
  const createdObjects = await __privateGet2(this, _suiClient2).core.getObjects({
    objectIds: createdObjectIds,
    include: { content: true }
  });
  const matchingObjects = createdObjects.objects.filter((object2) => !(object2 instanceof Error) && object2.type === objectType);
  const parsedObjectsWithOwner = await Promise.all(matchingObjects.map(async (objectResponse) => {
    if (objectResponse instanceof Error || !objectResponse.content) {
      throw new MessagingClientError(errorMessage);
    }
    const parsedObject = parseFunction(await objectResponse.content);
    return { object: parsedObject, owner: objectResponse.owner };
  }));
  return parsedObjectsWithOwner;
};
deduplicateAddresses_fn = function(addresses, excludeAddress) {
  const uniqueAddresses = [...new Set(addresses)];
  return excludeAddress ? uniqueAddresses.filter((addr) => addr !== excludeAddress) : uniqueAddresses;
};
deriveMessageIDsFromRange_fn = function(messagesTableId, startIndex, endIndex) {
  const messageIDs = [];
  for (let i = startIndex;i < endIndex; i++) {
    messageIDs.push(deriveDynamicFieldID(messagesTableId, "u64", suiBcs.U64.serialize(i).toBytes()));
  }
  return messageIDs;
};
parseMessageObjects_fn = async function(messageObjects) {
  const DynamicFieldMessage = suiBcs.struct("DynamicFieldMessage", {
    id: suiBcs.Address,
    name: suiBcs.U64,
    value: Message
  });
  const parsedMessageObjects = await Promise.all(messageObjects.objects.map(async (object2) => {
    if (object2 instanceof Error || !object2.content) {
      throw new MessagingClientError(`Failed to parse message object: ${object2}`);
    }
    const content = await object2.content;
    const dynamicField = DynamicFieldMessage.parse(content);
    return dynamicField.value;
  }));
  return parsedMessageObjects;
};
createLazyAttachmentDataPromise_fn = async function({
  channelId,
  memberCapId,
  sender,
  encryptedKey,
  blobRef,
  nonce
}) {
  const downloadAndDecrypt = async () => {
    const [encryptedData] = await __privateGet2(this, _storage).call(this, __privateGet2(this, _suiClient2)).download([blobRef]);
    const decryptedData = await __privateGet2(this, _envelopeEncryption).decryptAttachmentData({
      encryptedBytes: new Uint8Array(encryptedData),
      nonce: new Uint8Array(nonce),
      channelId,
      memberCapId,
      sender,
      encryptedKey
    });
    return decryptedData.data;
  };
  return new Promise((resolve, reject) => {
    downloadAndDecrypt().then(resolve).catch(reject);
  });
};
calculateFetchRange_fn = function({
  cursor,
  limit,
  direction,
  totalMessagesCount
}) {
  const limitBigInt = BigInt(limit);
  if (direction === "backward") {
    if (cursor === null) {
      const startIndex3 = totalMessagesCount > limitBigInt ? totalMessagesCount - limitBigInt : BigInt(0);
      return {
        startIndex: startIndex3,
        endIndex: totalMessagesCount
      };
    }
    const endIndex2 = cursor;
    const startIndex2 = endIndex2 > limitBigInt ? endIndex2 - limitBigInt : BigInt(0);
    return {
      startIndex: startIndex2,
      endIndex: endIndex2
    };
  }
  if (cursor === null) {
    const endIndex2 = totalMessagesCount > limitBigInt ? limitBigInt : totalMessagesCount;
    return {
      startIndex: BigInt(0),
      endIndex: endIndex2
    };
  }
  const startIndex = cursor + BigInt(1);
  const endIndex = startIndex + limitBigInt > totalMessagesCount ? totalMessagesCount : startIndex + limitBigInt;
  return {
    startIndex,
    endIndex
  };
};
fetchMessagesInRange_fn = async function(messagesTableId, range) {
  const messageIds = __privateMethod3(this, _SuiStackMessagingClient_instances, deriveMessageIDsFromRange_fn).call(this, messagesTableId, range.startIndex, range.endIndex);
  if (messageIds.length === 0) {
    return [];
  }
  const messageObjects = await __privateGet2(this, _suiClient2).core.getObjects({ objectIds: messageIds, include: { content: true } });
  return await __privateMethod3(this, _SuiStackMessagingClient_instances, parseMessageObjects_fn).call(this, messageObjects);
};
determineNextPagination_fn = function({
  fetchRange,
  direction,
  totalMessagesCount
}) {
  let nextCursor = null;
  let hasNextPage = false;
  if (direction === "backward") {
    nextCursor = fetchRange.startIndex > BigInt(0) ? fetchRange.startIndex : null;
    hasNextPage = fetchRange.startIndex > BigInt(0);
  } else {
    nextCursor = fetchRange.endIndex < totalMessagesCount ? fetchRange.endIndex - BigInt(1) : null;
    hasNextPage = fetchRange.endIndex < totalMessagesCount;
  }
  return {
    cursor: nextCursor,
    hasNextPage
  };
};
createEmptyMessagesResponse_fn = function(direction) {
  return {
    messages: [],
    cursor: null,
    hasNextPage: false,
    direction
  };
};
findOwnedObjectByChannelId_fn = async function(struct, ownerAddress, channelId) {
  const objectType = struct.name.replace("@local-pkg/sui-stack-messaging", __privateGet2(this, _packageConfig).packageId);
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const response = await __privateGet2(this, _suiClient2).core.listOwnedObjects({
      owner: ownerAddress,
      cursor,
      type: objectType,
      include: { content: true }
    });
    const validObjects = response.objects;
    if (validObjects.length > 0) {
      const contents = await __privateMethod3(this, _SuiStackMessagingClient_instances, getObjectContents_fn).call(this, validObjects);
      for (const content of contents) {
        const parsed = struct.parse(content);
        if (parsed.channel_id === channelId) {
          return parsed;
        }
      }
    }
    cursor = response.cursor;
    hasNextPage = response.hasNextPage;
  }
  return null;
};
getObjectContents_fn = async function(objects) {
  const contentPromises = objects.map(async (object2) => {
    try {
      return await object2.content;
    } catch (error) {
      if (error instanceof Error && error.message.includes("GRPC does not return object contents")) {
        return null;
      }
      throw error;
    }
  });
  const contents = await Promise.all(contentPromises);
  const needsBatchFetch = contents.some((content) => content === null);
  if (needsBatchFetch) {
    const objectIds = objects.map((obj) => obj.objectId);
    const objectResponses = await __privateGet2(this, _suiClient2).core.getObjects({ objectIds, include: { content: true } });
    const batchContents = await Promise.all(objectResponses.objects.map(async (obj) => {
      if (obj instanceof Error || !obj.content) {
        throw new MessagingClientError(`Failed to fetch object content: ${obj}`);
      }
      return await obj.content;
    }));
    return batchContents;
  }
  return contents.filter((content) => content !== null);
};
var SuiStackMessagingClient = _SuiStackMessagingClient;
function messaging(options) {
  return {
    name: "messaging",
    register: (client) => {
      const sealClient = client.seal;
      if (!sealClient) {
        throw new MessagingClientError("SealClient extension is required for MessagingClient");
      }
      if (!("storage" in options) && !("walrusStorageConfig" in options)) {
        throw new MessagingClientError('Either a custom storage adapter via "storage" option or explicit Walrus storage configuration via "walrusStorageConfig" option must be provided. Fallback to default Walrus endpoints is not supported.');
      }
      let packageConfig = options.packageConfig;
      if (!packageConfig) {
        const network = client.network;
        switch (network) {
          case "testnet":
            packageConfig = TESTNET_MESSAGING_PACKAGE_CONFIG;
            break;
          case "mainnet":
            packageConfig = MAINNET_MESSAGING_PACKAGE_CONFIG;
            break;
          default:
            packageConfig = TESTNET_MESSAGING_PACKAGE_CONFIG;
            break;
        }
      }
      const storage = "storage" in options ? (c) => options.storage(c) : (c) => {
        return new WalrusStorageAdapter(c, options.walrusStorageConfig);
      };
      return new SuiStackMessagingClient({
        suiClient: client,
        storage,
        packageConfig,
        sessionKey: "sessionKey" in options ? options.sessionKey : undefined,
        sessionKeyConfig: "sessionKeyConfig" in options ? options.sessionKeyConfig : undefined,
        sealConfig: options.sealConfig,
        addressResolver: options.addressResolver,
        channelResolver: options.channelResolver
      });
    }
  };
}
// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/utils/addressResolution.js
var __typeError5 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck5 = (obj, member, msg) => member.has(obj) || __typeError5("Cannot " + msg);
var __privateGet3 = (obj, member, getter) => (__accessCheck5(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd5 = (obj, member, value) => member.has(obj) ? __typeError5("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet3 = (obj, member, value, setter) => (__accessCheck5(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _suinsClient;
function isSuiNSName(input) {
  return input.toLowerCase().endsWith(".sui");
}

class SuiNSResolver {
  constructor(suinsClient) {
    __privateAdd5(this, _suinsClient);
    __privateSet3(this, _suinsClient, suinsClient);
  }
  async resolve(nameOrAddress) {
    if (!isSuiNSName(nameOrAddress)) {
      return nameOrAddress;
    }
    const record2 = await __privateGet3(this, _suinsClient).getNameRecord(nameOrAddress);
    if (!record2 || !record2.targetAddress) {
      throw new Error(`Failed to resolve SuiNS name: ${nameOrAddress}`);
    }
    return record2.targetAddress;
  }
  async resolveMany(namesOrAddresses) {
    return Promise.all(namesOrAddresses.map((nameOrAddress) => this.resolve(nameOrAddress)));
  }
  async reverseLookup(_address) {
    return null;
  }
}
_suinsClient = new WeakMap;

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/utils/channelResolution.js
var __typeError6 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck6 = (obj, member, msg) => member.has(obj) || __typeError6("Cannot " + msg);
var __privateGet4 = (obj, member, getter) => (__accessCheck6(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd6 = (obj, member, value) => member.has(obj) ? __typeError6("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet4 = (obj, member, value, setter) => (__accessCheck6(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod4 = (obj, member, method) => (__accessCheck6(obj, member, "access private method"), method);
var _nameToId;
var _idToName;
var _storageKey;
var _storage2;
var _PersistentChannelRegistry_instances;
var persist_fn;
function isChannelName(input) {
  if (!input || input.length === 0) {
    return false;
  }
  if (input.startsWith("#")) {
    return true;
  }
  if (input.startsWith("0x")) {
    return false;
  }
  return true;
}
function normalizeChannelName(name) {
  let normalized = name.trim().toLowerCase();
  if (normalized.startsWith("#")) {
    normalized = normalized.slice(1);
  }
  return normalized;
}
function formatChannelName(name) {
  const normalized = normalizeChannelName(name);
  return `#${normalized}`;
}

class LocalChannelRegistry {
  constructor(initialMappings) {
    __privateAdd6(this, _nameToId, /* @__PURE__ */ new Map);
    __privateAdd6(this, _idToName, /* @__PURE__ */ new Map);
    if (initialMappings) {
      const entries = initialMappings instanceof Map ? initialMappings.entries() : Object.entries(initialMappings);
      for (const [name, channelId] of entries) {
        const normalized = normalizeChannelName(name);
        __privateGet4(this, _nameToId).set(normalized, channelId);
        __privateGet4(this, _idToName).set(channelId, normalized);
      }
    }
  }
  async resolve(nameOrId) {
    if (!isChannelName(nameOrId)) {
      return nameOrId;
    }
    const normalized = normalizeChannelName(nameOrId);
    const channelId = __privateGet4(this, _nameToId).get(normalized);
    if (!channelId) {
      throw new Error(`Channel name not found: ${formatChannelName(nameOrId)}`);
    }
    return channelId;
  }
  async resolveMany(namesOrIds) {
    return Promise.all(namesOrIds.map((nameOrId) => this.resolve(nameOrId)));
  }
  async reverseLookup(channelId) {
    const name = __privateGet4(this, _idToName).get(channelId);
    return name ? formatChannelName(name) : null;
  }
  async register(name, channelId) {
    const normalized = normalizeChannelName(name);
    const existingId = __privateGet4(this, _nameToId).get(normalized);
    if (existingId && existingId !== channelId) {
      throw new Error(`Channel name ${formatChannelName(name)} is already registered to ${existingId}`);
    }
    const existingName = __privateGet4(this, _idToName).get(channelId);
    if (existingName && existingName !== normalized) {
      __privateGet4(this, _nameToId).delete(existingName);
    }
    __privateGet4(this, _nameToId).set(normalized, channelId);
    __privateGet4(this, _idToName).set(channelId, normalized);
  }
  async unregister(name) {
    const normalized = normalizeChannelName(name);
    const channelId = __privateGet4(this, _nameToId).get(normalized);
    if (channelId) {
      __privateGet4(this, _nameToId).delete(normalized);
      __privateGet4(this, _idToName).delete(channelId);
    }
  }
  async list() {
    const result = /* @__PURE__ */ new Map;
    for (const [name, channelId] of __privateGet4(this, _nameToId)) {
      result.set(formatChannelName(name), channelId);
    }
    return result;
  }
  export() {
    const result = {};
    for (const [name, channelId] of __privateGet4(this, _nameToId)) {
      result[name] = channelId;
    }
    return result;
  }
  import(data, merge = true) {
    if (!merge) {
      __privateGet4(this, _nameToId).clear();
      __privateGet4(this, _idToName).clear();
    }
    for (const [name, channelId] of Object.entries(data)) {
      const normalized = normalizeChannelName(name);
      __privateGet4(this, _nameToId).set(normalized, channelId);
      __privateGet4(this, _idToName).set(channelId, normalized);
    }
  }
  clear() {
    __privateGet4(this, _nameToId).clear();
    __privateGet4(this, _idToName).clear();
  }
  get size() {
    return __privateGet4(this, _nameToId).size;
  }
}
_nameToId = new WeakMap;
_idToName = new WeakMap;

class PersistentChannelRegistry extends LocalChannelRegistry {
  constructor(storageKey = "sui-messaging-channels") {
    let initialData;
    const storage = typeof localStorage !== "undefined" ? localStorage : null;
    if (storage) {
      try {
        const stored = storage.getItem(storageKey);
        if (stored) {
          initialData = JSON.parse(stored);
        }
      } catch {}
    }
    super(initialData);
    __privateAdd6(this, _PersistentChannelRegistry_instances);
    __privateAdd6(this, _storageKey);
    __privateAdd6(this, _storage2);
    __privateSet4(this, _storageKey, storageKey);
    __privateSet4(this, _storage2, storage);
  }
  async register(name, channelId) {
    await super.register(name, channelId);
    __privateMethod4(this, _PersistentChannelRegistry_instances, persist_fn).call(this);
  }
  async unregister(name) {
    await super.unregister(name);
    __privateMethod4(this, _PersistentChannelRegistry_instances, persist_fn).call(this);
  }
  save() {
    __privateMethod4(this, _PersistentChannelRegistry_instances, persist_fn).call(this);
  }
  reload() {
    if (__privateGet4(this, _storage2)) {
      try {
        const stored = __privateGet4(this, _storage2).getItem(__privateGet4(this, _storageKey));
        if (stored) {
          this.import(JSON.parse(stored), false);
        }
      } catch {}
    }
  }
}
_storageKey = new WeakMap;
_storage2 = new WeakMap;
_PersistentChannelRegistry_instances = new WeakSet;
persist_fn = function() {
  if (__privateGet4(this, _storage2)) {
    try {
      __privateGet4(this, _storage2).setItem(__privateGet4(this, _storageKey), JSON.stringify(this.export()));
    } catch {}
  }
};

// ../../Contributor/sui-stack-messaging-sdk/packages/messaging/dist/esm/utils/seal-extension.js
function sealClientExtension(options) {
  return {
    name: "seal",
    register: (client) => {
      return new SealClient({
        suiClient: client,
        serverConfigs: options.serverConfigs,
        verifyKeyServers: options.verifyKeyServers ?? true,
        timeout: options.timeout
      });
    }
  };
}
export {
  toMajorityError,
  sealClientExtension,
  normalizeChannelName,
  messaging,
  isSuiNSName,
  isChannelName,
  getLogger2 as getLogger,
  formatChannelName,
  WalrusStorageAdapter,
  UserError,
  TESTNET_MESSAGING_PACKAGE_CONFIG,
  SuiStackMessagingClient,
  SuiNSResolver,
  PersistentChannelRegistry,
  NotImplementedFeatureError,
  MessagingClientError,
  MessagingAPIError,
  MAINNET_MESSAGING_PACKAGE_CONFIG,
  LocalChannelRegistry,
  LOG_CATEGORIES,
  GeneralError,
  DEFAULT_SEAL_APPROVE_CONTRACT,
  ApiNotImplementedFeatureError
};
