// add more river points on 1/3 and 2/3 of length
function amendRiver(dataRiver, rndFactor) {
  const riverAmended = [];
  let side = 1;
  for (let r = 0; r < dataRiver.length; r++) {
    const dX = dataRiver[r].x;
    const dY = dataRiver[r].y;
    const cell = dataRiver[r].cell;
    const c = cells[cell].confluence || 0;
    riverAmended.push([dX, dY, c]);
    if (r + 1 < dataRiver.length) {
      const eX = dataRiver[r + 1].x;
      const eY = dataRiver[r + 1].y;
      const angle = Math.atan2(eY - dY, eX - dX);
      const serpentine = 1 / (r + 1);
      const meandr = serpentine + 0.3 + Math.random() * 0.3 * rndFactor;
      if (Math.random() > 0.5) {
        side *= -1;
      }
      const dist = Math.hypot(eX - dX, eY - dY);
      // if dist is big or river is small add 2 extra points
      if (dist > 8 || (dist > 4 && dataRiver.length < 6)) {
        let stX = (dX * 2 + eX) / 3;
        let stY = (dY * 2 + eY) / 3;
        let enX = (dX + eX * 2) / 3;
        let enY = (dY + eY * 2) / 3;
        stX += -Math.sin(angle) * meandr * side;
        stY += Math.cos(angle) * meandr * side;
        if (Math.random() > 0.8) {
          side *= -1;
        }
        enX += Math.sin(angle) * meandr * side;
        enY += -Math.cos(angle) * meandr * side;
        riverAmended.push([stX, stY], [enX, enY]);
        // if dist is medium or river is small add 1 extra point
      } else if (dist > 4 || dataRiver.length < 6) {
        let scX = (dX + eX) / 2;
        let scY = (dY + eY) / 2;
        scX += -Math.sin(angle) * meandr * side;
        scY += Math.cos(angle) * meandr * side;
        riverAmended.push([scX, scY]);
      }
    }
  }
  return riverAmended;
}

export default amendRiver;
