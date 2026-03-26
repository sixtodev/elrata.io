import * as THREE from 'three'

/**
 * Creates a procedural money bag geometry:
 * - Elongated oval body (balloon shape, taller than wide)
 * - Pinched neck near the top
 * - Small knot above the neck
 * - "$" sign extruded on the front face
 */
export function createMoneyBagGeometry(size = 1): THREE.BufferGeometry {
  const bodyGeo = new THREE.SphereGeometry(size, 20, 20)
  const pos = bodyGeo.getAttribute('position')
  const positions = pos.array as Float32Array

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    const z = positions[i + 2]
    const yNorm = y / size // -1 to 1

    // 1) Elongate vertically — balloon shape (1.6x taller)
    positions[i + 1] = y * 1.6

    // 2) Widen the lower-middle belly
    if (yNorm > -0.7 && yNorm < 0.2) {
      const bellyFactor = 1.0 + (1.0 - Math.abs(yNorm - (-0.25)) / 0.95) * 0.25
      positions[i] = x * bellyFactor
      positions[i + 2] = z * bellyFactor
    }

    // 3) Taper bottom slightly (not flat, more like a sack resting)
    if (yNorm < -0.6) {
      const bottomTaper = 1.0 - (Math.abs(yNorm) - 0.6) * 0.5
      positions[i] = x * Math.max(0.6, bottomTaper)
      positions[i + 2] = z * Math.max(0.6, bottomTaper)
    }

    // 4) Pinch neck near top
    if (yNorm > 0.55) {
      const pinch = Math.max(0.15, 1.0 - (yNorm - 0.55) * 2.0)
      positions[i] = x * pinch
      positions[i + 2] = z * pinch
    }

    // 5) Pull top up to form tie point
    if (yNorm > 0.85) {
      positions[i + 1] += (yNorm - 0.85) * size * 0.6
    }
  }

  bodyGeo.computeVertexNormals()

  // Knot on top
  const knotGeo = new THREE.SphereGeometry(size * 0.18, 8, 8)
  knotGeo.scale(1.2, 0.8, 1.2)
  knotGeo.translate(0, size * 1.75, 0)

  // Tie ring at the neck
  const tieGeo = new THREE.TorusGeometry(size * 0.18, size * 0.05, 6, 12)
  tieGeo.rotateX(Math.PI / 2)
  tieGeo.translate(0, size * 1.25, 0)

  const allGeos = [bodyGeo, knotGeo, tieGeo]
  const merged = mergeGeometries(allGeos)
  return merged
}

/**
 * Creates just the "$" sign geometry (separate so it can have its own material).
 */
export function createDollarSignGeometry(size = 1): THREE.BufferGeometry {
  const parts = createDollarSign(size)
  const merged = mergeGeometries(parts)
  return merged
}

/**
 * Creates a "$" sign from TubeGeometry curves, positioned on the front of the bag.
 * Made large and thick so it's clearly visible.
 */
function createDollarSign(size: number): THREE.BufferGeometry[] {
  const tubeRadius = size * 0.12
  const frontZ = size * 1.6
  const backZ = -frontZ

  const s = size

  // Points for the "S" curve
  const sPoints = [
    [s * 0.35,  s * 0.55],
    [s * 0.45,  s * 0.35],
    [s * 0.3,   s * 0.15],
    [-s * 0.1,  s * 0.08],
    [-s * 0.35, s * -0.05],
    [-s * 0.3,  s * -0.25],
    [s * 0.1,   s * -0.35],
    [s * 0.4,   s * -0.5],
    [s * 0.3,   s * -0.7],
    [-s * 0.1,  s * -0.8],
    [-s * 0.35, s * -0.7],
  ] as [number, number][]

  // Front "S"
  const sFront = new THREE.CatmullRomCurve3(
    sPoints.map(([x, y]) => new THREE.Vector3(x, y, frontZ))
  )
  const sFrontGeo = new THREE.TubeGeometry(sFront, 40, tubeRadius, 8, false)

  // Back "S" (mirrored X so it reads correctly from behind)
  const sBack = new THREE.CatmullRomCurve3(
    sPoints.map(([x, y]) => new THREE.Vector3(-x, y, backZ))
  )
  const sBackGeo = new THREE.TubeGeometry(sBack, 40, tubeRadius, 8, false)

  // Front vertical line
  const lineFront = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, s * 0.75, frontZ),
    new THREE.Vector3(0, s * -0.95, frontZ),
  ])
  const lineFrontGeo = new THREE.TubeGeometry(lineFront, 12, tubeRadius, 8, false)

  // Back vertical line
  const lineBack = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, s * 0.75, backZ),
    new THREE.Vector3(0, s * -0.95, backZ),
  ])
  const lineBackGeo = new THREE.TubeGeometry(lineBack, 12, tubeRadius, 8, false)

  return [sFrontGeo, lineFrontGeo, sBackGeo, lineBackGeo]
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVertices = 0
  let totalIndices = 0

  for (const geo of geometries) {
    totalVertices += geo.getAttribute('position').count
    const idx = geo.index
    totalIndices += idx ? idx.count : geo.getAttribute('position').count
  }

  const mergedPositions = new Float32Array(totalVertices * 3)
  const mergedNormals = new Float32Array(totalVertices * 3)
  const mergedIndices: number[] = []

  let vertexOffset = 0

  for (const geo of geometries) {
    const posAttr = geo.getAttribute('position')
    const normAttr = geo.getAttribute('normal')
    const count = posAttr.count

    for (let i = 0; i < count * 3; i++) {
      mergedPositions[vertexOffset * 3 + i] = (posAttr.array as Float32Array)[i]
      if (normAttr) {
        mergedNormals[vertexOffset * 3 + i] = (normAttr.array as Float32Array)[i]
      }
    }

    if (geo.index) {
      const idx = geo.index.array
      for (let i = 0; i < idx.length; i++) {
        mergedIndices.push(idx[i] + vertexOffset)
      }
    } else {
      for (let i = 0; i < count; i++) {
        mergedIndices.push(i + vertexOffset)
      }
    }

    vertexOffset += count
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3))

  if (totalVertices > 65535) {
    merged.setIndex(new THREE.BufferAttribute(new Uint32Array(mergedIndices), 1))
  } else {
    merged.setIndex(new THREE.BufferAttribute(new Uint16Array(mergedIndices), 1))
  }

  for (const geo of geometries) {
    geo.dispose()
  }

  return merged
}
