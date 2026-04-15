module.exports = {
  resolve: {
    fallback: {
      // ubl-builder uses Node's crypto for DIAN-specific hashing which we don't need in the browser
      crypto: false
    }
  }
}
