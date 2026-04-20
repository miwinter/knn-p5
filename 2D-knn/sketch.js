const plotWidth = 400;
const plotHeight = 400;
const minPlotScale = 0.6;
const plotScaleStep = 0.1;

let points = [];
let plotScale = 1;
let k_knn = 3;
let knn_circle = { set: false };
let kSlider;
let kValueLabel;
let bgCheckbox;

// function qui determine la catégorie d'un point en fonction de ses coordonnées
// la catégorie correspond à un secteur angulaire de 120° centré au milieu du canevas
function getCategory(x, y) {
  let angle = atan2(y - plotHeight / 2, x - plotWidth / 2);
  let category = floor((angle + PI) / (2 * PI / 3)) + 1;
  return category;
}

// function qui calcule pour un point donné en paramètre, la catégorie de la majorité des k points le plus prés, k étant également un paramètre
// s'il n'ya pas de majorité, la catégorie retournée est '0'
function getKnnCircle(x, y, k) {
  let categories = [0, 0, 0];
  let distances = [];
  for (let i = 0; i < points.length; i++) {
    let otherPoint = points[i];
    let distance = dist(x, y, otherPoint.x, otherPoint.y);
    distances.push({
      distance: distance,
      x: otherPoint.x,
      y: otherPoint.y,
      category: otherPoint.category
    });
  }

  distances.sort((a, b) => a.distance - b.distance);
  for (let i = 0; i < k; i++) {
    categories[distances[i].category - 1]++;
  }

  // calcul de la catégorie majoritaire, si elle existe
  // 0 sinon
  let maxCategory = 0;
  let maxCount1 = 0;
  let maxCount2 = 0;
  // calcul du nombre de points des 2 catégories les plus présentes
  for (let i = 0; i < 3; i++) {
    if (categories[i] > maxCount1) {
      maxCount2 = maxCount1;
      maxCount1 = categories[i];
      maxCategory = i + 1;
    } else if (categories[i] > maxCount2) {
      maxCount2 = categories[i];
    }
  }
  if(maxCount1 == maxCount2)
    maxCategory = 0;

  // on ajoute les coordonnées des k points les plus proches
  // dans le tableau distances
  let k_points = [];
  for(let i = 0; i < k; i++)
  {
    k_points.push({x: distances[i].x, y: distances[i].y});
  }

  return {
    set: true, 
    category: maxCategory, 
    radius: distances[k-1].distance, 
    x: x, y: y,
    points: k_points};
}


function getMajorityCategory(point, k) {
  let categories = [0, 0, 0];
  let distances = [];
  for (let i = 0; i < points.length; i++) {
    let otherPoint = points[i];
    let distance = dist(point.x, point.y, otherPoint.x, otherPoint.y);
    distances.push({
      distance: distance,
      category: otherPoint.category
    });
  }

  distances.sort((a, b) => a.distance - b.distance);
  for (let i = 0; i < k; i++) {
    categories[distances[i].category - 1]++;
  }

  // calcul de la catégorie majoritaire, si elle existe
  // 0 sinon
  let maxCategory = 0;
  let maxCount1 = 0;
  let maxCount2 = 0;
  // calcul du nombre de points des 2 catégories les plus présentes
  for (let i = 0; i < 3; i++) {
    if (categories[i] > maxCount1) {
      maxCount2 = maxCount1;
      maxCount1 = categories[i];
      maxCategory = i + 1;
    } else if (categories[i] > maxCount2) {
      maxCount2 = categories[i];
    }
  }
  if(maxCount1 == maxCount2)
    maxCategory = 0;

  return maxCategory;
}


// fonction qui dessine un fond de carte composé d'un ensemble de carrés dont la couleur
// est déterminée par la catégorie du point le plus proche
function drawBackground() {

  for (let x = 0; x < plotWidth; x += 5) {
    for (let y = 0; y < plotHeight; y += 5) {
      let category = getMajorityCategory({
        x: x,
        y: y
      },k_knn);
      if (category === 1) {
        fill(255, 200, 200);
      } else if (category === 2) {
        fill(200, 255, 200);
      } else if (category === 3) {
        fill(200, 200, 255);
      } else {
        fill(255, 255, 255);
      }

      // rectangle sans bordure
      noStroke();
      rect(x, y, 5, 5);
    }
  }
}

function getPlotMetrics() {
  const displayWidth = plotWidth * plotScale;
  const displayHeight = plotHeight * plotScale;

  return {
    originX: 0,
    originY: 0,
    displayWidth: displayWidth,
    displayHeight: displayHeight
  };
}

function updateCanvasSize() {
  const nextCanvasWidth = ceil(plotWidth * plotScale);
  const nextCanvasHeight = ceil(plotHeight * plotScale);

  if (width !== nextCanvasWidth || height !== nextCanvasHeight) {
    resizeCanvas(nextCanvasWidth, nextCanvasHeight);
  }
}

function updateKDisplay() {
  k_knn = Number(kSlider.value);
  kValueLabel.textContent = "k = " + k_knn;
}

function changeZoom(direction) {
  const nextScale = plotScale + direction * plotScaleStep;
  plotScale = max(minPlotScale, nextScale);
  updateCanvasSize();
}
  

// ********************************************************************************************************************
// fonction reservée à p5.js qui est appelée lorsqu'on clique sur le canevas
// fonction qui dessine un cercle lorsqu'on clique sur le canevas
function mousePressed() {
  const plot = getPlotMetrics();
  const insidePlot =
    mouseX >= plot.originX &&
    mouseX <= plot.originX + plot.displayWidth &&
    mouseY >= plot.originY &&
    mouseY <= plot.originY + plot.displayHeight;

  if (insidePlot) {
    knn_circle.set = true;
    knn_circle.x = (mouseX - plot.originX) / plotScale;
    knn_circle.y = (mouseY - plot.originY) / plotScale;
  }
}


// ********************************************************************************************************************
// fonction setup de p5.js
function setup() {
  const canvas = createCanvas(plotWidth, plotHeight);
  canvas.parent("sketch-holder");

  kSlider = document.getElementById("k-slider");
  kValueLabel = document.getElementById("k-value");
  bgCheckbox = document.getElementById("bg-checkbox");
  document.getElementById("zoom-in").addEventListener("click", () => changeZoom(1));
  document.getElementById("zoom-out").addEventListener("click", () => changeZoom(-1));
  kSlider.addEventListener("input", updateKDisplay);
  updateKDisplay();
  updateCanvasSize();

  // creation d'un tableau de 10 points en p5.js avec une catégorie parmi 1 à 3
  
  for (let i = 0; i < 25; i++) {
    let x = 5 + floor(random(plotWidth - 10));
    let y = 5 + floor(random(plotHeight - 10));
    points.push({
      x: x,
      y: y,
      category: getCategory(x, y)
    });
  }
}

// ********************************************************************************************************************
// fonction draw de p5.js
function draw() {
  const plot = getPlotMetrics();

  push();
  translate(plot.originX, plot.originY);
  scale(plotScale);

  fill(255);
  stroke(188, 198, 205);
  strokeWeight(1 / plotScale);
  rect(0, 0, plotWidth, plotHeight);

  if (bgCheckbox.checked) {
    drawBackground();
  }

  // affichage des points du tableau points
  stroke(0);
  strokeWeight(1 / plotScale);
  for (let i = 0; i < points.length; i++) {
    let point = points[i];
    if (point.category === 1) {
      fill(229, 57, 53);
    } else if (point.category === 2) {
      fill(67, 160, 71);
    } else {
      fill(30, 136, 229);
    }
    ellipse(point.x, point.y, 10, 10);
  }

  // affichage du cercle knn
  if(knn_circle.set)
  {
    knn_circle = getKnnCircle(knn_circle.x, knn_circle.y ,k_knn)

    noFill();
    strokeWeight(2);

    // affichage des droites entre les k points les plus proches et le point considéré
    stroke(150);
    for(let i = 0; i < knn_circle.points.length; i++)
    {
      let point = knn_circle.points[i];
      line(knn_circle.x, knn_circle.y, point.x, point.y);
    }

    circle(knn_circle.x, knn_circle.y, 2 * knn_circle.radius);
    if (knn_circle.category === 1) {
      fill(229, 57, 53);
    } else if (knn_circle.category === 2) {
      fill(67, 160, 71);
    } else if (knn_circle.category === 3) {
      fill(30, 136, 229);
    } else {
      fill(255, 255, 255);
    }
    ellipse(knn_circle.x, knn_circle.y, 10, 10);

    strokeWeight(1);
  }

  pop();
}
