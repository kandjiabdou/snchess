paper.setup('myCanvas');

// var points = [
//     new paper.Point(100, 100),
//     new paper.Point(200, 200),
//     new paper.Point(300, 150),
//     new paper.Point(400, 300),
//     new paper.Point(500, 200)
// ];

// var path = new paper.Path();
// path.strokeColor = 'red';
// path.strokeWidth = 5;
// for (p in points) {
//     path.add(points[p]);
//     var circle = new paper.Path.Circle(points[p], 10);
//     circle.fillColor = 'blue';
// }

// paper.view.draw();

// const path = new paper.Path();
// path.strokeColor = couleur;
// path.strokeWidth = 5;

// function drawPathPointByPoint(points, currentIndex) {
//   if (currentIndex < points.length) {
//     const point = new paper.Point(points[currentIndex]['position'][0], points[currentIndex]['position'][1]);
//     path.add(point);
//     const circle = new paper.Path.Circle(point, 10);
//     circle.fillColor = couleur;
//     this.circles.push(circle);

//     setTimeout(() => {
//       drawPathPointByPoint(points, currentIndex + 1);
//     }, 100);

//   } else {
//     // Animation terminée, vous pouvez ajouter du code ici pour gérer la fin de l'animation
//   }
// }

// drawPathPointByPoint(points, 0);

// this.paths.push(path);

