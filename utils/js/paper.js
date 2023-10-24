paper.setup('myCanvas');

var points = [
    new paper.Point(100, 100),
    new paper.Point(200, 200),
    new paper.Point(300, 150),
    new paper.Point(400, 300),
    new paper.Point(500, 200)
];

var path = new paper.Path();
path.strokeColor = 'red';
path.strokeWidth = 5;
for (p in points) {
    path.add(points[p]);
    var circle = new paper.Path.Circle(points[p], 10);
    circle.fillColor = 'blue';
}

paper.view.draw();