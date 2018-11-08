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

// Active zooming
function invokeActiveZooming() {
  // toggle shade/blur filter on zoom
  let filter = scale > 2.6 ? 'url(#blurFilter)' : 'url(#dropShadow)';
  if (scale > 1.5 && scale <= 2.6) {
    filter = null;
  }
  coastline.attr('filter', filter);
  // rescale lables on zoom (active zooming)
  labels.selectAll('g').each(() => {
    const el = d3.select(this);
    if (el.attr('id') === 'burgLabels') {
      return;
    }
    const desired = +el.attr('data-size');
    const doubledD = desired + desired;
    let relative = rn((doubledD / scale) / 2, 2);
    if (relative < 2) {
      relative = 2;
    }
    el.attr('font-size', relative);
    if (hideLabels.checked) {
      el.classed('hidden', relative * scale < 6);
      Update.labelGroups();
    }
  });

  // rescale map markers
  markers.selectAll('use').each(() => {
    const el = d3.select(this);
    const x = +el.attr('data-x');
    const y = +el.attr('data-y');
    const desired = +el.attr('data-size');
    let size = (desired * 5) + (25 / scale);
    if (size < 1) {
      size = 1;
    }
    el
      .attr('x', x - (size / 2))
      .attr('y', y - size)
      .attr('width', size)
      .attr('height', size);
  });

  if (ruler.size()) {
    if (ruler.style('display') !== 'none') {
      if (ruler.selectAll('g').size() < 1) {
        return;
      }
      const factor = rn(1 / Math.pow(scale, 0.3), 1);
      ruler
        .selectAll('circle:not(.center)')
        .attr('r', 2 * factor)
        .attr('stroke-width', 0.5 * factor);
      ruler
        .selectAll('circle.center')
        .attr('r', 1.2 * factor)
        .attr('stroke-width', 0.3 * factor);
      ruler
        .selectAll('text')
        .attr('font-size', 10 * factor);
      ruler
        .selectAll('line, path')
        .attr('stroke-width', factor);
    }
  }
}

export {
  zoomUpdate,
  zoomTo,
  zoomed,
  resetZoom,
  invokeActiveZooming
};
