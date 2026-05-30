const enc = new TextEncoder()
const dec = new TextDecoder()

async function deriveKey(workspaceKey: string, salt: Uint8Array) {
  const raw = await crypto.subtle.importKey("raw", enc.encode(workspaceKey), "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

function toBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

export namespace Crypto {
  export async function encrypt(plaintext: string, workspaceKey: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(workspaceKey, salt)
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext))
    const out = new Uint8Array(salt.byteLength + iv.byteLength + cipher.byteLength)
    out.set(salt, 0)
    out.set(iv, 16)
    out.set(new Uint8Array(cipher), 28)
    return toBase64(out.buffer)
  }

  export async function decrypt(ciphertext: string, workspaceKey: string) {
    const buf = fromBase64(ciphertext)
    const salt = buf.slice(0, 16)
    const iv = buf.slice(16, 28)
    const data = buf.slice(28)
    const key = await deriveKey(workspaceKey, salt)
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)
    return dec.decode(plain)
  }
}
