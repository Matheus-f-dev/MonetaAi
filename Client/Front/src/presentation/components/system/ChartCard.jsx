import { Line } from 'react-chartjs-2';

export function ChartCard({ chartData, chartOptions }) {
  return (
    <div className="sys-card sys-card-big">
      <div className="sys-card-head">
        <div>
          <div className="sys-card-title">Visão Geral</div>
          <div className="sys-small">Acompanhe suas receitas e despesas</div>
        </div>
        <div className="sys-segmented">
          <button className="sys-seg sys-active">Semana</button>
          <button className="sys-seg">Mês</button>
          <button className="sys-seg">Ano</button>
        </div>
      </div>

      <div className="sys-chart">
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}