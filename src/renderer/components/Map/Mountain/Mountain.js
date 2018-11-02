class Mountain {
  addMountain() {
    const x = Math.floor(Math.random() * graphWidth / 3 + graphWidth / 3);
    const y = Math.floor(Math.random() * graphHeight * 0.2 + graphHeight * 0.4);
    const cell = diagram.find(x, y).index;
    const height = Math.random() * 10 + 90; // 90-99
    add(cell, 'mountain', height);
  }
}

export default Mountain;
