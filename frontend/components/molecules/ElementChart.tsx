import { useEffect, useMemo } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LineElement,
  LinearScale,
  PointElement,
  RadarController,
  RadialLinearScale,
} from "chart.js";

import type { ElementChartProps } from "@/types/review";

const ElementChart = ({
  id,
  nameList,
  valueList,
  isHideLabel,
}: ElementChartProps) => {
  const isBarType = useMemo(() => nameList.length < 3, [nameList.length]);

  useEffect(() => {
    Chart.register(
      RadarController,
      BarController,
      RadialLinearScale,
      LinearScale,
      LineElement,
      BarElement,
      PointElement,
      CategoryScale
    );

    var myChart = new Chart(id, {
      type: isBarType ? "bar" : "radar",
      data: {
        labels: nameList,
        datasets: [
          {
            data: valueList,
            label: "Applied",
            borderColor: "#755139",
            backgroundColor: "rgb(117,81,57,0.3)",
            borderWidth: 2,
            pointBackgroundColor: "rgb(255, 99, 132)",
            pointBorderColor: "#fff",
            pointHoverBorderColor: "rgb(255, 99, 132)",
          },
        ],
      },
      options: {
        ...(isHideLabel && { animation: false }),
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 5,
            ticks: { stepSize: 1, display: isHideLabel ? false : true },
          },
          ...(isBarType && {
            y: {
              suggestedMin: 0,
              suggestedMax: 6,
              ticks: { stepSize: 1, display: isHideLabel ? false : true },
            },
          }),
        },
      },
    });

    return () => myChart.destroy();
  }, [id, isBarType, isHideLabel, nameList, valueList]);

  return <canvas id={id}></canvas>;
};
export default ElementChart;
