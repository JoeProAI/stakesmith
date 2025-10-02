'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function NFLHeatmap() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const w = 540,
      h = 260;
    svg.attr('viewBox', `0 0 ${w} ${h}`);
    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', w)
      .attr('height', h)
      .attr('rx', 14)
      .attr('fill', '#093a50')
      .attr('stroke', '#0f7a9c')
      .attr('opacity', 0.9);
    for (let i = 0; i <= 10; i++) {
      svg
        .append('line')
        .attr('x1', (w / 10) * i)
        .attr('y1', 0)
        .attr('x2', (w / 10) * i)
        .attr('y2', h)
        .attr('stroke', '#0ea5b7')
        .attr('opacity', 0.2);
    }
    const zones = [
      { x: w * 0.48, y: h * 0.1, r: 40, v: 0.75 },
      { x: w * 0.5, y: h * 0.5, r: 50, v: 0.55 },
      { x: w * 0.52, y: h * 0.9, r: 40, v: 0.72 }
    ];
    const color = d3.scaleLinear<string>().domain([0, 1]).range(['#1e293b', '#22d3ee']);
    svg
      .selectAll('circle.hot')
      .data(zones)
      .enter()
      .append('circle')
      .attr('class', 'hot')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => d.r)
      .attr('fill', (d) => color(d.v))
      .attr('opacity', 0.35);
  }, []);
  return <svg ref={ref} className="w-full h-auto" role="img" aria-label="NFL Heatmap" />;
}
