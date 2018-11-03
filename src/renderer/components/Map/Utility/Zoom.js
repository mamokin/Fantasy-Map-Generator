// Manually update viewbox
function zoomUpdate(duration) {
  const dur = duration || 0;
  const transform = d3.zoomIdentity.translate(viewX, viewY).scale(scale);
  svg.transition().duration(dur).call(zoom.transform, transform);
}

// Zoom to specific point (x,y - coods, z - scale, d - duration)
function zoomTo(x, y, z, d) {
  const transform = d3.zoomIdentity.translate(x * -z + graphWidth / 2, y * -z + graphHeight / 2).scale(z);
  svg.transition().duration(d).call(zoom.transform, transform);
}

function zoomed() {
  const scaleDiff = Math.abs(scale - d3.event.transform.k);
  scale = d3.event.transform.k;
  viewX = d3.event.transform.x;
  viewY = d3.event.transform.y;
  viewbox.attr('transform', d3.event.transform);
  // rescale only if zoom is significally changed
  if (scaleDiff > 0.001) {
    invokeActiveZooming();
    drawScaleBar();
  }
}

const zoom = d3.zoom().scaleExtent([1, 20]).on('zoom', zoomed);
svg.call(zoom);

// Reset zoom to initial
function resetZoom(duration) {
  zoom.transform(svg, d3.zoomIdentity);
}