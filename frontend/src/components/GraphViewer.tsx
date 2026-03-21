'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { DependencyGraph, GraphNode, GraphEdge } from '@/services/graph.service';

interface GraphViewerProps {
  graph: DependencyGraph;
  onNodeClick?: (node: GraphNode) => void;
}

const NODE_COLORS: Record<string, string> = {
  File: '#3b82f6',
  Function: '#10b981',
  Class: '#f59e0b',
  Module: '#8b5cf6',
  Repository: '#ef4444',
};

interface SimNode extends d3.SimulationNodeDatum, GraphNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> { type: string }

export function GraphViewer({ graph, onNodeClick }: GraphViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on('zoom', (e) => g.attr('transform', e.transform)) as never);

    const g = svg.append('g');

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = graph.edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({ source: nodeMap.get(e.source)!, target: nodeMap.get(e.target)!, type: e.type }));

    svg.append('defs').append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#4b5563');

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(20));

    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', '#374151').attr('stroke-width', 1.2).attr('marker-end', 'url(#arrow)');

    const node = g.append('g').selectAll('circle').data(nodes).join('circle')
      .attr('r', (d) => d.type === 'Repository' ? 14 : d.type === 'File' ? 10 : 7)
      .attr('fill', (d) => NODE_COLORS[d.type] ?? '#6b7280')
      .attr('stroke', '#1f2937').attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (_e, d) => onNodeClick?.(d))
      .call(d3.drag<SVGCircleElement, SimNode>()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as never);

    const label = g.append('g').selectAll('text').data(nodes).join('text')
      .text((d) => {
        const name = d.name || d.filePath || d.id?.slice(0, 8) || 'Unknown';
        return name.length > 20 ? name.slice(0, 18) + '…' : name;
      })
      .attr('font-size', 10).attr('fill', '#9ca3af').attr('dx', 12).attr('dy', 4)
      .style('pointer-events', 'none');

    node.append('title').text((d) => `${d.type}: ${d.name}${d.filePath ? `\n${d.filePath}` : ''}`);

    simulation.on('tick', () => {
      link.attr('x1', (d) => (d.source as SimNode).x!).attr('y1', (d) => (d.source as SimNode).y!)
        .attr('x2', (d) => (d.target as SimNode).x!).attr('y2', (d) => (d.target as SimNode).y!);
      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
      label.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
    });

    return () => { simulation.stop(); };
  }, [graph, onNodeClick]);

  return (
    <div className="w-full h-full bg-gray-950 relative">
      <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />{type}
          </div>
        ))}
      </div>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
