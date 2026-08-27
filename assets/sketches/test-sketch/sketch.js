let intensity = 1;
let newIntensity = 1;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);
  
  let newIntensity = 1;
  if(mouseIsPressed) {
    newIntensity = -1;
  }
  
  intensity += (newIntensity - intensity) * 0.05;
  
  noFill();
  stroke(255, 150);
  strokeWeight(2);

  let amount = 100;

  for (let i = 0; i < amount; i++) {
    let spacing = 4;
    let maxSize = amount * spacing;
    let x = i * spacing * 0.5;
    let y = sin((frameCount + i * intensity) * 0.1) * 20;
    let s = maxSize - i * spacing;

    let t = map(i, 0, amount, 0, 1);
    let col = lerpColor(color(0, 0, 0), color(255, 255, 255), t);

    push();
    translate(width / 2, height / 2);
    translate(x, y);
    stroke(col);
    ellipse(0, 0, s);
    pop();
    
  }
}


function keyPressed() {
  switch(key) {
      case('1'): intensity = 0; break;
      case('2'): intensity = -1; break;
      case('3'): intensity = 2; break;
      case('4'): intensity = 3; break;
      case('5'): intensity = -2; break;
  }
}
