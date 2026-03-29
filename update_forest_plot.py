#!/usr/bin/env python3
"""
Script to update the renderForestPlot function with improved visualization
"""

import re

# Read the HTML file
with open(r'C:\Truthcert1\truthcert_v8-8-0_with_S14-HTA.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old function body (the part we want to replace)
old_pattern = r'''    const trace = \{ type: 'scatter', mode: 'markers', x, y, error_x: \{ type: 'data', symmetric: false, array: error_x\.map\(e => e\.hi\), arrayminus: error_x\.map\(e => e\.lo\), color: PLOT_COLORS\.teal, thickness: 2\.5 \}, marker: \{ size: 10, color: PLOT_COLORS\.teal \} \};
    const pooledLine = \{ type: 'scatter', mode: 'lines', x: \[transform\(pooled\.effect\), transform\(pooled\.effect\)\], y: \[y\[0\], y\[y\.length - 1\]\], line: \{ color: PLOT_COLORS\.purple, width: 2\.5, dash: 'dash' \}, name: 'Pooled Effect' \};
    const nullLine = \{ type: 'scatter', mode: 'lines', x: \[exp \? 1 : 0, exp \? 1 : 0\], y: \[y\[0\], y\[y\.length - 1\]\], line: \{ color: PLOT_COLORS\.darkGray, width: 1\.5, dash: 'dot' \}, name: 'Null Effect' \};
    Plotly\.newPlot\('forest-plot', \[trace, pooledLine, nullLine\], \{ \.\.\.plotLayout, xaxis: \{ \.\.\.plotLayout\.xaxis, title: C\.measure \}, yaxis: \{ \.\.\.plotLayout\.yaxis, automargin: true \} \}, \{ responsive: true \}\);'''

# Define the new function body
new_code = '''    // Calculate study weights (proportional to 1/variance)
    const weights = R.studies.map(s => 1 / (s.se * s.se));
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);

    // Scale marker sizes proportionally (range: 8-24 pixels)
    const markerSizes = weights.map(w => {
        const normalized = (w - minWeight) / (maxWeight - minWeight);
        return 8 + normalized * 16;
    });

    // Create alternating row backgrounds for better readability
    const shapes = y.map((_, i) => ({
        type: 'rect',
        xref: 'paper',
        yref: 'y',
        x0: 0,
        x1: 1,
        y0: i - 0.4,
        y1: i + 0.4,
        fillcolor: i % 2 === 0 ? 'rgba(44, 62, 80, 0.15)' : 'rgba(15, 15, 19, 0.15)',
        line: { width: 0 },
        layer: 'below'
    }));

    // Study markers with proportional sizes and professional colors
    const trace = {
        type: 'scatter',
        mode: 'markers',
        x,
        y,
        error_x: {
            type: 'data',
            symmetric: false,
            array: error_x.map(e => e.hi),
            arrayminus: error_x.map(e => e.lo),
            color: PLOT_COLORS.orange,
            thickness: 2.5,
            width: 5
        },
        marker: {
            size: markerSizes,
            color: PLOT_COLORS.navy,
            line: { color: PLOT_COLORS.teal, width: 1.5 }
        },
        hovertemplate: '<b>%{y}</b><br>Effect: %{x:.3f}<br>Weight: %{customdata:.1f}%<extra></extra>',
        customdata: weights.map(w => (w / weights.reduce((a, b) => a + b, 0)) * 100)
    };

    // Pooled effect as a prominent diamond
    const pooledY = -1;
    const pooledX = transform(pooled.effect);
    const pooledCI_lo = transform(pooled.effect - 1.96 * pooled.se);
    const pooledCI_hi = transform(pooled.effect + 1.96 * pooled.se);

    const diamondTrace = {
        type: 'scatter',
        mode: 'lines',
        x: [pooledCI_lo, pooledX, pooledCI_hi, pooledX, pooledCI_lo],
        y: [pooledY, pooledY + 0.35, pooledY, pooledY - 0.35, pooledY],
        fill: 'toself',
        fillcolor: 'rgba(155, 89, 182, 0.5)',
        line: { color: PLOT_COLORS.purple, width: 3 },
        hovertemplate: '<b>Pooled Effect</b><br>Effect: %{x:.3f}<extra></extra>',
        showlegend: false
    };

    // Null line with better styling
    const nullLine = {
        type: 'scatter',
        mode: 'lines',
        x: [exp ? 1 : 0, exp ? 1 : 0],
        y: [pooledY - 0.6, y.length - 0.5],
        line: { color: PLOT_COLORS.darkGray, width: 2, dash: 'dash' },
        hoverinfo: 'skip',
        showlegend: false,
        name: 'Null Effect'
    };

    // Add annotation for pooled effect label
    const annotations = [{
        x: 0,
        y: pooledY,
        xref: 'paper',
        yref: 'y',
        text: '<b>Pooled Effect</b>',
        xanchor: 'right',
        showarrow: false,
        font: { color: PLOT_COLORS.purple, size: 12, family: 'Arial, Helvetica, sans-serif', weight: 'bold' }
    }];

    const layout = {
        ...plotLayout,
        xaxis: {
            ...plotLayout.xaxis,
            title: C.measure,
            zeroline: false
        },
        yaxis: {
            ...plotLayout.yaxis,
            automargin: true,
            range: [pooledY - 0.8, y.length - 0.5],
            gridcolor: 'rgba(58, 58, 74, 0.3)'
        },
        shapes: shapes,
        annotations: annotations,
        margin: { l: 200, r: 120, t: 60, b: 80 },
        showlegend: true,
        legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            yanchor: 'top',
            bgcolor: 'rgba(36, 36, 48, 0.9)',
            bordercolor: PLOT_COLORS.gridGray,
            borderwidth: 1,
            font: { size: 11, family: 'Arial, Helvetica, sans-serif' }
        }
    };

    // Legend traces for marker size meaning
    const legendTrace1 = {
        type: 'scatter',
        mode: 'markers',
        x: [null],
        y: [null],
        marker: { size: 20, color: PLOT_COLORS.navy, line: { color: PLOT_COLORS.teal, width: 1.5 } },
        name: 'Large weight',
        showlegend: true
    };

    const legendTrace2 = {
        type: 'scatter',
        mode: 'markers',
        x: [null],
        y: [null],
        marker: { size: 10, color: PLOT_COLORS.navy, line: { color: PLOT_COLORS.teal, width: 1.5 } },
        name: 'Small weight',
        showlegend: true
    };

    Plotly.newPlot('forest-plot', [trace, diamondTrace, nullLine, legendTrace1, legendTrace2], layout, { responsive: true });'''

# Try to find and replace using regex
if re.search(old_pattern, content):
    content = re.sub(old_pattern, new_code, content)
    print("Pattern found and replaced!")
else:
    # Fallback: Try simpler string matching
    old_simple = """    const trace = { type: 'scatter', mode: 'markers', x, y, error_x: { type: 'data', symmetric: false, array: error_x.map(e => e.hi), arrayminus: error_x.map(e => e.lo), color: PLOT_COLORS.teal, thickness: 2.5 }, marker: { size: 10, color: PLOT_COLORS.teal } };
    const pooledLine = { type: 'scatter', mode: 'lines', x: [transform(pooled.effect), transform(pooled.effect)], y: [y[0], y[y.length - 1]], line: { color: PLOT_COLORS.purple, width: 2.5, dash: 'dash' }, name: 'Pooled Effect' };
    const nullLine = { type: 'scatter', mode: 'lines', x: [exp ? 1 : 0, exp ? 1 : 0], y: [y[0], y[y.length - 1]], line: { color: PLOT_COLORS.darkGray, width: 1.5, dash: 'dot' }, name: 'Null Effect' };
    Plotly.newPlot('forest-plot', [trace, pooledLine, nullLine], { ...plotLayout, xaxis: { ...plotLayout.xaxis, title: C.measure }, yaxis: { ...plotLayout.yaxis, automargin: true } }, { responsive: true });"""

    if old_simple in content:
        content = content.replace(old_simple, new_code)
        print("Simple string match found and replaced!")
    else:
        print("ERROR: Could not find the target code to replace")
        print("Looking for renderForestPlot function...")
        if 'function renderForestPlot()' in content:
            print("Function found in file!")
        else:
            print("Function NOT found!")

# Write the updated content back
with open(r'C:\Truthcert1\truthcert_v8-8-0_with_S14-HTA.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
