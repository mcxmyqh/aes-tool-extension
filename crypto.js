// AES-256-CBC 使用 Web Crypto API + PBKDF2 + Base64

// 将字符串转为 ArrayBuffer
function str2ab(str) {
  return new TextEncoder().encode(str);
}

// 将 ArrayBuffer 转为字符串
function ab2str(buf) {
  return new TextDecoder().decode(buf);
}

// 将 ArrayBuffer 转为 Base64
function ab2b64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 转 ArrayBuffer
function b642ab(b64) {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buf[i] = binary.charCodeAt(i);
  }
  return buf.buffer;
}

// 派生密钥
async function deriveKey(password, salt) {
  const pwKey = await crypto.subtle.importKey(
    'raw',
    str2ab(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    pwKey,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// 加密文本
async function encryptText(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, str2ab(plaintext));

  // 拼接 salt + iv + cipher 再 Base64
  const total = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  total.set(salt, 0);
  total.set(iv, salt.byteLength);
  total.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
  return ab2b64(total.buffer);
}

// 解密文本
async function decryptText(cipherB64, password) {
  const total = b642ab(cipherB64);
  const totalBytes = new Uint8Array(total);
  const salt = totalBytes.slice(0, 16);
  const iv = totalBytes.slice(16, 32);
  const ciphertext = totalBytes.slice(32);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, ciphertext.buffer);
  return ab2str(decrypted);
}

// 加密文件 (ArrayBuffer)
async function encryptBytes(buffer, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, buffer);

  const total = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  total.set(salt, 0);
  total.set(iv, salt.byteLength);
  total.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
  return ab2b64(total.buffer);
}

// 解密文件 (ArrayBuffer)
async function decryptToBytes(cipherB64, password) {
  const total = b642ab(cipherB64);
  const totalBytes = new Uint8Array(total);
  const salt = totalBytes.slice(0, 16);
  const iv = totalBytes.slice(16, 32);
  const ciphertext = totalBytes.slice(32);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, ciphertext.buffer);
  return decrypted; // ArrayBuffer
}
