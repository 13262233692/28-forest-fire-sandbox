export function generateHeightMap(size: number): Float32Array {
  const data = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size
      const ny = y / size
      let h = 0
      h += Math.sin(nx * 3.0 + 0.5) * Math.cos(ny * 2.5 + 1.0) * 0.3
      h += Math.sin(nx * 7.0 + ny * 5.0) * 0.1
      h += Math.cos(nx * 12.0 - ny * 8.0 + 2.0) * 0.05
      h += Math.sin(nx * 1.5 + ny * 3.0) * 0.4
      h = (h + 1.0) * 0.5
      data[y * size + x] = h
    }
  }
  return data
}
