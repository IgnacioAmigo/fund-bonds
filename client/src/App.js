import React from "react";
import moment from "moment";
import "./App.css";
import Chart from "./Chart";
import COLORS from "./colors";
import simplify from "simplify-js";

//TODOS
//- improve the structure of the transformations code
//- add date selectors and filters
//- line chart selectors

async function getData() {
  const res = await fetch("api/data", {
    accept: "application/json"
  });

  return res.json();
}

function charRange(charA, charZ) {
  const a = [];
  let i = charA.charCodeAt(0);
  const j = charZ.charCodeAt(0);

  for (; i <= j; ++i) {
    a.push(String.fromCharCode(i));
  }

  return a;
}

//TODO move this else where
function transform(cells) {
  const DATA_START_ROW = 8;
  const HEADERS_ROW = 7;
  const DEFAULT_OPTS = {
    fill: false,
    lineTension: 0.1,
    backgroundColor: "rgba(75,192,192,0.4)",
    //borderColor: "rgba(75,192,192,1)",
    borderCapStyle: "butt",
    borderDash: [],
    borderDashOffset: 0.0,
    borderJoinStyle: "miter",
    pointBorderColor: "rgba(75,192,192,1)",
    pointBackgroundColor: "#fff",
    pointBorderWidth: 1,
    pointHoverRadius: 5,
    pointHoverBackgroundColor: "rgba(255,0,0,1)",
    pointHoverBorderColor: "rgba(220,220,220,1)",
    pointHoverBorderWidth: 2,
    pointRadius: 1,
    pointHitRadius: 10
  };


  function getColor(index,shade){
    const startHue= 0;
    const increase=37;
    var hue,sat,light;
    
    hue = ((startHue+(increase*index)) % 360);
    sat = 100;
    light =  (shade?60:70)-((((increase*index)) / 360)*8);

    var color="hsl("+hue+","+sat+"%,"+light+"%)";
    return color;
  }

  const dates = [];
  const datasets = {};
  charRange("B", "T").forEach((colIndex, index) => {
    const header = cells[`${colIndex}${HEADERS_ROW}`].v;

    datasets[colIndex] = {
      ...DEFAULT_OPTS,
      label: header,
      data: [],
      backgroundColor: getColor(index),
      borderColor: getColor(index),
      pointBorderColor: getColor(index)
    };
  });

  for (let rowIndex = DATA_START_ROW; ; rowIndex++) {
    const dateCell = cells[`A${rowIndex}`];
    if (!dateCell) {
      break;
    }

    dates.push(moment(dateCell.w, "D-MMM-YY").format("YYYY-MM-DD"));

    const date = moment(dateCell.w, "D-MMM-YY").valueOf();

    charRange("B", "T").forEach(colIndex => {
      const cellValue = (cells[`${colIndex}${rowIndex}`] || {}).v || 0;
      datasets[colIndex].data.push({
        x: date,
        y: cellValue
      });
    });
  }

  // Reduce the amount of numbers
  Object.values(datasets).forEach(dataset => {
    dataset.data = simplify(dataset.data, 0.1).map(point => {
      return {
        ...point,
        x: moment(point.x).format("YYYY-MM-DD")
      };
    });
  });

  console.log(dates);
  console.log(datasets);
  console.log("FUCK");

  return {
    labels: dates,
    datasets: Object.values(datasets)
  };
}

export default class App extends React.Component {
  state = {
    data: {},
    loading: true
  };

  async componentDidMount() {
    const res = await getData();
    const xls = res.xls;
    const cells = xls.Sheets.Cuotaspartes;
    this.setState({
      rawData: xls,
      data: transform(cells),
      loading: false
    });
  }

  render() {
    if (this.state.loading) {
      return (
        <div className="container">
          <p>Loading ...</p>
        </div>
      );
    }

    return (
      <div className="container">
        <Chart data={this.state.data} />
      </div>
    );
  }
}
