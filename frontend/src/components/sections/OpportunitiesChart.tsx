import { opportunityChartData } from "@/data/home";

export function OpportunitiesChart() {
  const width = 700;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 44, left: 34 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const barGap = 12;
  const barWidth = innerWidth / opportunityChartData.length - barGap;
  const maxValue = Math.max(...opportunityChartData.map((item) => item.value));

  return (
    <section id="grafico" className="section section--alt">
      <div className="container">
        <h2 className="section__title">Gráfico de Oportunidades</h2>

        <div className="chart-wrapper">
          <h3 className="chart-wrapper__title">Oportunidades por Ano</h3>
          <p className="chart-wrapper__subtitle" id="estatisticas-grafico">
            Distribuição de oportunidades em curso nos Açores
          </p>
          <div className="grafico-placeholder chart">
            <svg
              id="opportunityChart"
              viewBox={`0 0 ${width} ${height}`}
              tabIndex={0}
              role="img"
              aria-label="Gráfico de barras de oportunidades"
            >
              <g className="corpo-grafico" transform={`translate(${margin.left} ${margin.top})`}>
                {opportunityChartData.map((item, index) => {
                  const barHeight = (item.value / maxValue) * innerHeight;
                  const x = index * (barWidth + barGap);
                  const y = innerHeight - barHeight;

                  return (
                    <g key={item.label}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={8}
                        fill="var(--azul-500)"
                      >
                        <title>
                          {item.label}: {item.value} oportunidades
                        </title>
                      </rect>
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        textAnchor="middle"
                        fill="var(--azul-900)"
                        fontSize="12"
                        fontWeight="700"
                      >
                        {item.value}
                      </text>
                    </g>
                  );
                })}
              </g>
              <g className="eixo-x" transform={`translate(${margin.left} ${height - margin.bottom})`}>
                {opportunityChartData.map((item, index) => {
                  const x = index * (barWidth + barGap) + barWidth / 2;

                  return (
                    <text key={item.label} x={x} y={24} textAnchor="middle">
                      {item.label}
                    </text>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
