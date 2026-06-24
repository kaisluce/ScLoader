// A transcoding is "clean" (decodable by ffmpeg) only if it is NOT DRM-encrypted.
// SoundCloud's encrypted variants use protocols like "cbc-encrypted-hls" /
// "ctr-encrypted-hls" (Widevine/FairPlay) which we cannot decrypt.
function isEncrypted(t) {
  return typeof t.protocol === 'string' && t.protocol.includes('encrypted')
}

/**
 * Returns the clean (non-DRM) transcodings in resolve-priority order.
 * They are tried one by one because SoundCloud sometimes lists a transcoding
 * (e.g. progressive/mp3_1_0) whose stream endpoint actually 404s — typically
 * on monetized tracks, where only the encrypted streams resolve.
 *
 * Priority: progressive+mp3_1_0 → progressive → hls+mp3_1_0 → other plain hls.
 */
function getCleanTranscodings(transcodings) {
  if (!transcodings || transcodings.length === 0) return []

  const clean = transcodings.filter(t => !isEncrypted(t))
  const seen = new Set()
  const ordered = [
    ...clean.filter(t => t.protocol === 'progressive' && t.preset === 'mp3_1_0'),
    ...clean.filter(t => t.protocol === 'progressive'),
    ...clean.filter(t => t.protocol === 'hls' && t.preset === 'mp3_1_0'),
    ...clean.filter(t => t.protocol === 'hls')
  ]
  // dédoublonne en conservant l'ordre
  return ordered.filter(t => {
    if (seen.has(t)) return false
    seen.add(t)
    return true
  })
}

module.exports = {
  isEncrypted,
  getCleanTranscodings
}
