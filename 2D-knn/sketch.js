let points = [];
let width = 400;
let height = 400;

let k_slider;
let k_knn = 1;
let knn_circle = {set: false};
let bg_checkbox;

// function qui determine la catégorie d'un point en fonction de ses coordonnées
// la catégorie correspond à un secteur angulaire de 120° centré au milieu du canevas
function getCategory(x, y) {
  let angle = atan2(y - height / 2, x - width / 2);
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
  k_points = [];
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

  for (let x = 0; x < width; x += 5) {
    for (let y = 0; y < height; y += 5) {
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
      rect(x, y, 10, 10);
    }
  }
}
  

// ********************************************************************************************************************
// fonction reservée à p5.js qui est appelée lorsqu'on clique sur le canevas
// fonction qui dessine un cercle lorsqu'on clique sur le canevas
function mousePressed() {
  if((mouseY <= height) && (mouseX <= width)){
    knn_circle.set = true;
    knn_circle.x = mouseX;
    knn_circle.y = mouseY;
  }
}


// ********************************************************************************************************************
// fonction setup de p5.js
function setup() {

  createCanvas(width, height+50);

  // creation d'un tableau de 10 points en p5.js avec une catégorie parmi 1 à 3
  
  for (let i = 0; i < 25; i++) {
    x = 5 + floor(random(width - 10));
    y = 5 + floor(random(height - 10));
    points.push({
      x: x,
      y: y,
      category: getCategory(x, y)
    });
  }

  k_slider = createSlider(1, 11, 3);
  k_slider.position( 10, height + 10);
  k_slider.size(80);

  bg_checkbox = createCheckbox();
  bg_checkbox.position(150, height + 10);
}

// ********************************************************************************************************************
// fonction draw de p5.js
function draw() {

  background(240);
  if(bg_checkbox.checked())
    drawBackground();

  // affichage de la valeur des controles
  fill(0, 0, 0);
  strokeWeight(0);
  k_knn = k_slider.value();
  text('k = ' + k_knn , 30, height + 40);
  text('afficher la carte', 175, height + 23);

  // affichage des points du tableau points
  stroke(0);
  for (let i = 0; i < points.length; i++) {
    let point = points[i];
    if (point.category === 1) {
      fill(255, 0, 0);
    } else if (point.category === 2) {
      fill(0, 255, 0);
    } else {
      fill(0, 0, 255);
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
      fill(255, 0, 0);
    } else if (knn_circle.category === 2) {
      fill(0, 255, 0);
    } else if (knn_circle.category === 3) {
      fill(0, 0, 255);
    } else {
      fill(255, 255, 255);
    }
    ellipse(knn_circle.x, knn_circle.y, 10, 10);

    strokeWeight(1);
  }
}
