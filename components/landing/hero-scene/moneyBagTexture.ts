import * as THREE from 'three'

/**
 * Loads coin.webp, removes the white background, and returns a CanvasTexture.
 * White/near-white pixels become transparent so the coin floats cleanly in the scene.
 */
export function createMoneyBagTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  // Load the coin image and process it
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)

    // Remove white background — make near-white pixels transparent
    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // If pixel is white or near-white, make it transparent
      if (r > 220 && g > 220 && b > 220) {
        data[i + 3] = 0 // alpha = 0
      }
    }
    ctx.putImageData(imageData, 0, 0)
    texture.needsUpdate = true
  }
  img.src = '/icons/coin.webp'

  return texture
}
