'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'monospace',
});

export default function MermaidChart({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      const cleanChart = chart.trim();
      if (!cleanChart) return;

      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      try {
        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
          setHasError(false);
        }
      } catch (err) {
        // Streaming ke waqt partial syntax parse na hone par error silently catch karein
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (hasError || !svgContent) {
    return (
      <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-500 overflow-x-auto">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div 
      className="my-4 p-4 bg-white rounded-xl border border-slate-200 overflow-x-auto flex justify-center shadow-sm"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}