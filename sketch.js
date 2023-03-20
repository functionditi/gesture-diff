class drawGraph {
  constructor() {
    this.val_x = 0; // x value of sample graph
    this.valueArray = []; //stores x and y values of graph
    this.val_min = 1023;
    this.val_max = 0;
    this.rect_stop = graph_w;
    this.status_thresh = [];
    this.imageModelURL =
      "https://teachablemachine.withgoogle.com/models/br_dLBfzk/";
    this.threshold = 0;
    this.classifier = ml5.imageClassifier(this.imageModelURL + "model.json");
    this.currentLabel = "LOADING!";
    this.sample = createGraphics(graph_w, graph_h); // sample is abuffer that draws the graph and the model samples it
    this.theDisplay = createGraphics((14 * windowWidth) / 20, graph_h); //display for words/text
    this.label = ""; //label for current plant gesture
  }

  // Get a prediction for the current video frame
  classifyImage() {
    this.classifier.classify(this.sample, (err, result) => {
      this.label = result[0].label;
    });
  }

  drawLocalGraph(value, x, y, w, h) {
    this.threshold = h - 15; //if the graph goes above this threshold, means plant is 'active' or touched

    push();
    translate(x, y);
    this.sample.fill(colors[2]);
    this.sample.stroke(colors[1]);
    this.sample.strokeWeight(3);
    this.sample.rect(0, 0, w, h);

    //setting max and min
    if (value > this.val_max && value <= 1023) this.val_max = value;
    if (value < this.val_min) this.val_min = value;

    let val_normalised = norm(value, this.val_min, this.val_max); //normalising the value to something between 0-1

    this.valueArray.push({ x1: this.val_x, y1: val_normalised * h }); //pushing the x, y values to the array containing all graph values for the current instance

    this.sample.strokeWeight(1);
    this.sample.fill(colors[0]);
    this.sample.line(0, this.threshold, w, this.threshold);

    this.sample.stroke(colors[0]);
    this.sample.noFill();
    this.sample.strokeWeight(3);

    this.sample.beginShape();
    for (let i = 0; i < this.valueArray.length; i++) {
      if (this.valueArray[i].y1 < this.threshold) {
        //checking if current value is 'active', aka plant is being touched
        this.status_thresh.push(1);
      } else this.status_thresh.push(0);

      let currentStatus = this.status_thresh[this.status_thresh.length - 1];
      let prevStatus = this.status_thresh[this.status_thresh.length - 2];

      //checking if the value has recently crossed that threshold or no
      if (currentStatus > prevStatus) {
        this.sample.fill(255, 0, 0);
        this.sample.ellipse(this.valueArray[i].x1, this.valueArray[i].y1, 10);
        this.rect_stop = w;
      }

      if (currentStatus < prevStatus) {
        this.sample.fill(0, 0, 255);
        this.sample.ellipse(this.valueArray[i].x1, this.valueArray[i].y1, 10);
        this.rect_stop = this.valueArray[i].x1; //stopping graph at that value if it dips below threshold (aka current plant touch gesture is finished)
      }

      this.sample.noFill();
      this.sample.vertex(this.valueArray[i].x1, this.valueArray[i].y1);
    }
    this.sample.endShape();

    strokeWeight(1);
    fill(colors[0]);
    text(this.label, this.val_x - 15, h + 20); //say what current identified gesture is

    this.val_x++;

    if (this.val_x > this.rect_stop) {
      //if gesture complete, reset and start again

      this.currentLabel = this.label;
      this.val_x = 0;
      this.valueArray.length = 0;
      this.rect_stop = w;
    }

    this.updateDisplay(this.currentLabel);
    //text(currentLabel, 0, 0)
    image(this.sample, 0, 0); //draw sample buffer onto main canvas
    this.classifyImage();
    pop();
  }

  updateDisplay(theText) {
    this.theDisplay.textFont(redaction);
    this.theDisplay.background(255);
    this.theDisplay.fill(colors[1]);
    this.theDisplay.stroke(colors[1]);
    this.theDisplay.strokeWeight(3);
    this.theDisplay.rect(
      0,
      0,
      this.theDisplay.width - 1,
      this.theDisplay.height
    );
    this.theDisplay.fill(colors[2]);
    this.theDisplay.noStroke();
    this.theDisplay.textSize(120);

    let displayText = "";
    if (theText == "inactive") {
      displayText = "inactive";
    } else if (theText == "single tap") {
      displayText = "single tap?";
    } else if (theText == "double tap") {
      displayText = "double tap";
    } else if (theText == "triple tap") {
      displayText = "triple tap";
    } else if (theText == "prolonged") {
      displayText = "prolonged";
    }

    let tw = textWidth(displayText);
    this.theDisplay.text(
      displayText,
      this.theDisplay.width / 20,
      this.theDisplay.height - 15
    );
    image(this.theDisplay, (2.5 * windowWidth) / 20, 0);
  }

  resizeBuffers() {
    var newSample = createGraphics((3 * windowWidth) / 20, 150);
    newSample.image(this.sample, 0, 0, newSample.width, newSample.height);
    this.sample = newSample;

    var newDisp = createGraphics((14 * windowWidth) / 20, 150);
    newDisp.image(this.theDisplay, 0, 0, newDisp.width, newDisp.height);
    this.theDisplay = newDisp;
  }
}

let readings = []; //readings from serial input. E0-E11 array
let graph_w, graph_h;
let redaction;
let colors = [];
let font;
let objects=[];
let n=4;


function preload() {
  font = loadFont("NeueMontreal-Regular.otf");
  redaction = loadFont("Redaction50-Regular.otf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  graph_w = (2 * windowWidth) / 20;
  graph_h = 120;

  colors.push("#27df34"); //green
  colors.push("#056CF2"); //blue
  colors.push("whitesmoke"); //whitesmoke

  textFont(font);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  for (let i=0; i<n; i++){
    objects[i] = new drawGraph();
    objects[i].classifyImage();
  }

 
 
}

function draw() {
  clear();
  for (let i=0; i<n; i++){
    objects[i].sample.clear();
  }
  
 

  if (inData) {
    readings = inData.split(","); //reading from serialport and splitting the string (values from port E0-E11) into an array
  }

  fill(colors[1]);
  noStroke();
  textSize(12);
  text("ELECTRODE 1", width / 20, 45);
  text("ELECTRODE 2", width / 20, 195);

  objects[0].drawLocalGraph(int(readings[0]), width / 20, 25, graph_w, graph_h);

  objects[1].drawLocalGraph(int(readings[1]), width / 20, 175, graph_w, graph_h);
  
   objects[2].drawLocalGraph(int(readings[2]), width / 20, 325, graph_w, graph_h);
  
  objects[3].drawLocalGraph(int(readings[3]), width / 20, 475, graph_w, graph_h);
}


// go to fullscreen
// copy lines below to add fullscreen toggle to
// your sketch. Notice that if you are already using
// the keyPressed function, add lines 20-22 to it.

function keyPressed() {
  if (key === "f" || key === "F") {
    enterFullscreen();
  }
}

/* enter fullscreen-mode via
 * https://editor.p5js.org/kjhollentoo/sketches/H199a0c-x
 */
function enterFullscreen() {
  var fs = fullscreen();
  if (!fs) {
    fullscreen(true);
  } else fullscreen(false);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  object.resizeBuffers();
  plswork.resizeBuffers();
}
