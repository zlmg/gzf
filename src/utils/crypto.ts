/**
 * 密码加密工具
 * 使用 PBKDF2 + SHA-256 进行密码哈希
 */

/** 生成随机盐值 */
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 将字符串转换为 Uint8Array */
function textToBuffer(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

/** 导入密钥 */
async function importKey(password: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textToBuffer(password).buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  return keyMaterial
}

/**
 * 使用 PBKDF2 对密码进行哈希
 * @param password 原始密码
 * @param salt 盐值
 * @returns 哈希后的密码（十六进制字符串）
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await importKey(password)
  const saltBuffer = textToBuffer(salt).buffer as ArrayBuffer
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256,
  )
  return Array.from(new Uint8Array(derivedBits), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 验证密码
 * @param password 待验证的密码
 * @param hash 存储的哈希值
 * @param salt 盐值
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const newHash = await hashPassword(password, salt)
  return newHash === hash
}