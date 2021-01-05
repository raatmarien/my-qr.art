// Adapted from https://github.com/rgab1508/PixelCraft
// Licensed under the MIT License:
// MIT License

// Copyright (c) 2021 PixelCraft

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Changes applied by Marien Raat, to make it suitable for the current use. All changes are licensed
// under the GNU Affero General Public License Version 3 or Later, see the COPYING file in the root
// of this repository.

var Tool = {
  "pen": 0,
  "fillBucket": 1,
  // "line": 3,
  // "circle": 4,
  // "ellipse": 5,
  // "addFrame": 6,
  "undo": 2,
  "redo": 3,
  "clearCanvas": 4,
};
var tools = [true, false, false, false, false];
var lc = [];
class Canvas {
  constructor(width, height) {
    this.canvas = document.querySelector("#canvas");
    this.canvas.width = 10 * width;
    this.canvas.height = 10 * height;
    this.width = width;
    this.height = height;
    this.canvas.style.display = "block";
    this.canvas.style.height = Math.floor((height / width) * this.canvas.clientWidth) + "px";
    this.w = +this.canvas.width;
    this.h = +this.canvas.height;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.fillStyle = "white";
    this.ctx.globalAlpha = 1;
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.data = [...Array(this.width)].map(e => Array(this.height).fill([255, 255, 255, 255]));
    this.reserved = [...Array(this.width)].map(e => Array(this.height).fill(false));
    this.reservedSet = false;
    this.steps = [];
    this.redo_arr = [];
    this.frames = [];
    this.prevStep = null;
    this.downListener =  e => {
      this.active = true;
      this.steps.push([0, 0, "down", 0]);
      var rect = this.canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      x = Math.floor(this.width * x / this.canvas.clientWidth);
      y = Math.floor(this.height * y / this.canvas.clientHeight);
      let tool = this.getTool(tools);
      let color = this.color;
      let step = [x, y, tool, color];
      this.doStep(step)
      this.steps.push(step);
      this.redo_arr = [];
      this.drawReserved();
      this.prevStep = step;
    };
    this.canvas.addEventListener("mousedown", this.downListener);
    this.canvas.addEventListener("touchstart", this.downListener);
    this.moveListener = e => {
      if (this.active) {
        var rect = this.canvas.getBoundingClientRect();
        var placeX, placeY;
        if (e.clientX) {
          placeX = e.clientX;
          placeY = e.clientY;
        } else {
          placeX = e.touches[0].clientX;
          placeY = e.touches[0].clientY;
        }
        var x = placeX - rect.left;
        var y = placeY - rect.top;
        x = Math.floor(this.width * x / this.canvas.clientWidth);
        y = Math.floor(this.height * y / this.canvas.clientHeight);
        let tool = this.getTool(tools);
        let color = this.color;
        let step = [x, y, tool, color];


        this.doStep(step);
        this.steps.push(step);
        this.redo_arr = [];
        this.drawReserved();
        this.prevStep = step;
      }
    };
    this.canvas.addEventListener("mousemove", this.moveListener);
    this.canvas.addEventListener("touchmove", this.moveListener)

    this.upListener = e => {
      if (this.active) {
        this.prevStep = null;
        this.steps.push([0, 0, "up", 0]);
        this.active = false;
      }
    };
    this.canvas.addEventListener("mouseup", this.upListener);
    this.canvas.addEventListener("touchend", this.upListener);
    window.addEventListener("mouseup", this.upListener);
    window.addEventListener("touchend", this.upListener);
  }

  setQrMap(map) {
    if (this.reservedSet) return;
    this.reservedSet = true;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let i = y * this.width + x;
        if (map[i] != 1) {
          this.reserved[x][y] = true;
        }
      }
    }
    this.drawReserved();
  }

  drawReserved() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.reserved[x][y]) {
          this.draw(x, y, [128, 128, 128, 255]);
        }
      }
    }
  }

  getTool(tools) {
    for (var i = 0; i < tools.length; i++)
      if (tools[i]) return i;
  }

  redraw() {
    this.steps.forEach(s => {
      this.doStep(s)
      this.prevStep = s;
    });
    this.active = false;
    this.drawReserved();
  }

  doStep(step) {
    let x = step[0], y = step[1],
        tool = step[2], color = step[3];
    if (tool == Tool.clearCanvas) {
      this.doClear();
    } else if (tool == Tool.pen) {
      if (this.active && tool == Tool.pen && this.prevStep && this.prevStep[2] == Tool.pen) {
        let prevX = this.prevStep[0],
            prevY = this.prevStep[1];
        let minX = Math.min(prevX, x);
        let minY = Math.min(prevY, y);
        let maxX = Math.max(prevX, x);
        let maxY = Math.max(prevY, y);
        let difX = maxX - minX;
        let difY = maxY - minY;
        if (difX > difY && difX > 1) {
          let fromY = prevY, toY = y;
          if (prevX > x) {
            fromY = y;
            toY = prevY;
          }
          for (let fillX = minX; fillX <= maxX; fillX++) {
            let fillY = Math.round(fromY + (((fillX - minX) / difX) * (toY - fromY)))
            this.draw(fillX, fillY, color);
          }
        } else if (difY > 1) {
          let fromX = prevX, toX = x;
          if (prevY > y) {
            fromX = x;
            toX = prevX;
          }
          for (let fillY = minY; fillY <= maxY; fillY++) {
            let fillX = Math.round(fromX + (((fillY - minY) / difY) * (toX - fromX)))
            this.draw(fillX, fillY, color);
          }
        }
      }
      let result = this.draw(x, y, color);
      return result;
    } else if (tool == Tool.fillBucket) {
      this.fastFloodFill(x, y, this.data[x][y], color);
    } else if (tool == "down") {
      this.active = true;
    } else if (tool == "up") {
      this.active = false;
    } else if (tool == "addImage") {
      this.doImageStep(color);
    }
    return true;
  }
  
  draw(x, y, color) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      let changed = !this.colorEquals(this.data[x][y], color);
      this.data[x][y] = color;
      this.ctx.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")";
      this.ctx.fillRect(Math.floor(x * (this.w / this.width)), Math.floor(y * (this.h / this.height)), Math.floor(this.w / this.width), Math.floor(this.h / this.height));
      return changed;
    }
  }

  colorEquals(c1, c2) {
    return JSON.stringify(c1) == JSON.stringify(c2);
  }

  doImageStep(imageSteps) {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        let color = [0, 0, 0, 255];
        if (imageSteps[x*this.width + y] > 0) {
          color = [255, 255, 255, 255];
        }
        this.draw(x, y, color);
      }
    }
  }

  // This function adapted from. Changed several things to work with my data structures
  // https://github.com/williammalone/HTML5-Paint-Bucket-Tool/blob/master/html5-canvas-paint-bucket.js
  // Under the following license:
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //   http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.
  //
  // Copyright 2010 William Malone (www.williammalone.com)
  //
  fastFloodFill = function (startX, startY, startC, replC) {
    var newPos,
	x,
	y,
	pixelPos,
	reachLeft,
	reachRight,
	drawingBoundLeft = 0,
	drawingBoundTop = 0,
	drawingBoundRight = this.width,
	drawingBoundBottom = this.height,
	pixelStack = [[startX, startY]];

    if (startX < 0 || startX >= this.width || startY < 0 || startY >= this.height) {
      return;
    }
    if (this.colorEquals(startC, replC)) {
      return;
    }
    if (!this.colorEquals(this.data[startX][startY], startC) || this.reserved[startX][startY]) {
      return;
    }

    while (pixelStack.length) {

      newPos = pixelStack.pop();
      x = newPos[0];
      y = newPos[1];

      // Go up as long as the color matches and are inside the canvas
      while (y >= drawingBoundTop && this.colorEquals(this.data[x][y], startC) && !this.reserved[x][y]) {
	y -= 1;
      }
      y += 1;

      reachLeft = false;
      reachRight = false;

      // Go down as long as the color matches and in inside the canvas
      while (y <= drawingBoundBottom && this.colorEquals(this.data[x][y], startC) && !this.reserved[x][y]) {

        this.draw(x, y, replC);

	if (x > drawingBoundLeft) {
	  if (this.colorEquals(this.data[x-1][y], startC) && !this.reserved[x-1][y]) {
	    if (!reachLeft) {
	      // Add pixel to stack
	      pixelStack.push([x - 1, y]);
	      reachLeft = true;
	    }
	  } else if (reachLeft) {
	    reachLeft = false;
	  }
	}

	if (x < (drawingBoundRight-1)) {
	  if (this.colorEquals(this.data[x+1][y], startC) && !this.reserved[x+1][y]) {
	    if (!reachRight) {
	      // Add pixel to stack
	      pixelStack.push([x + 1, y]);
	      reachRight = true;
	    }
	  } else if (reachRight) {
	    reachRight = false;
	  }
	}
	y += 1;
      }
    }
  }

  setcolor(color) {
    this.ctx.globalAlpha = 1;
    this.color = color;
    this.ctx.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")";
  }
  setmode(i) {
    tools = [false, false, false, false, false, false];
    tools[i] = true;
    document.querySelectorAll("#toolbar .tool-item").forEach((x, i) => {
      if (tools[i]) x.style.backgroundColor = "grey";
      else x.style.backgroundColor = "";
    })
  }
  save() {
    this.canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.download = 'canvas.png';
      link.href = url;
      link.click();
    })
  }

  clear() {
    let step = [0, 0, Tool.clearCanvas, [255, 255, 255, 255]];
    this.doStep(step);
    this.steps.push(step);
  }

  doClear() {
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.data = [...Array(this.width)].map(e => Array(this.height).fill([255, 255, 255, 255]));
    this.setcolor(this.color);
    this.setmode(Tool.pen);
  }

  undo() {
    if (this.steps.length > 0) {
      this.doClear();
      while (this.steps.length > 0) {
        let popStep = this.steps.pop();
        this.redo_arr.push(popStep);
        if (popStep[2] == "down" || popStep[2] == 'addImage') break;
      }
      this.redraw();
    }
  }

  redo() {
    if (this.redo_arr.length > 0) {
      this.doClear();
      while (this.redo_arr.length > 0) {
        let popStep = this.redo_arr.pop();
        this.steps.push(popStep);
        if (popStep[2] == "up" || popStep[2] == 'addImage') break;
      }
      this.redraw();
    }
  }

  saveInLocal(){
    /*let a = this.frames.map(frame=> [frame[0].src,frame[1]]);
      let f =  JSON.stringify(a);*/
    let d = {
      'colors': window.colors,
      'currColor': this.color,
      'width': this.width,
      'height': this.height,
      'url': this.canvas.toDataURL(),
      'steps': this.steps,
      'redo_arr': this.redo_arr,
      'dim': window.dim,
      'reserved': this.reserved,
    }
    localStorage.setItem('pc-canvas-data', JSON.stringify(d));
  }

  removeListeners() {
    this.canvas.removeEventListener('mousedown', this.downListener, false);
    this.canvas.removeEventListener('touchstart', this.downListener, false);
    this.canvas.removeEventListener('mousemove', this.moveListener, false);
    this.canvas.removeEventListener('touchmove', this.moveListener, false);
    this.canvas.removeEventListener('mouseup', this.upListener, false);
    this.canvas.removeEventListener('touchend', this.upListener, false);
    window.removeEventListener("mouseup", this.upListener);
    window.removeEventListener("touchend", this.upListener);
  }

  getCanvasWidth() {
    let i = 0;
    for (let x = 0; x < this.width; x++) {
      if (!this.reserved[x][0]) {
        i = x;
        break;
      }
    }
    
    return this.w - (i * 10);
  }

  generateImageStep(file) {
    var _this = this;
    let imageSteps = [];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
      var uimg = new Image();
      uimg.src = reader.result;
      uimg.onload = function() {
        var pxc = document.createElement("canvas");
        pxc.width = _this.width;
        pxc.height = _this.height;
        var pxctx = pxc.getContext("2d");
        var canvasWidth = _this.getCanvasWidth() / 10;
        var factor = Math.min(canvasWidth / uimg.width, _this.height / uimg.height);
        let drawWidth = factor * uimg.width;
        let drawHeight = factor * uimg.height;
        let x = _this.width - drawWidth;
        let y = (_this.height - drawHeight) / 2;
        pxctx.drawImage(uimg, x, y, drawWidth, drawHeight);
        var i,j;
        for (i=0; i<_this.width; i++) {
          for (j=0; j<_this.height; j++) {
            var ctr = 0;
            var avg = [0,0,0,0];
            var pix = pxctx.getImageData(i, j, 1, 1).data;
            var color = 0;
            if ((pix[0]+pix[1]+pix[2]) > (128*3) && pix[3] > 0) {
              color = 1;
            }
            imageSteps.push(color);
          }
    	}
        let step = [0, 0, "addImage", imageSteps];
        _this.steps.push(step);
        _this.redraw();
      }
    }
  }
  
  addImage() {
    var _this = this;
    var fp = document.createElement("input");
    fp.type = "file";
    fp.click();
    fp.onchange = e => {
      let file = e.target.files[0]
      this.generateImageStep(file);
    };
  }
}
class Popup {
  constructor(s) {
    this.s = s;
    document.querySelector(this.s).style.display = "block";
    document.querySelector(this.s).style.transform = "translate(-50%,-50%) scale(1,1)";
  }
  close() {
    document.querySelector(this.s).style.transform = "translate(-50%,-50%) scale(0,0)";
  }
}

class Frames {
  static open() {
    document.querySelector("#frames").style.display = "block";
    document.querySelector("#frames").style.transform = "translate(-50%,-50%) scale(1,1)";
    document.querySelector("#frames").focus();
    document.querySelector("#frames #gallery").innerHTML="";
    for (var frame of board.frames) document.querySelector("#frames #gallery").appendChild(frame[0]);
    document.querySelectorAll("#frames #gallery img").forEach((x,i) => {
      x.onclick = (e) => {
    	board.loadFrame(i);
    	Frames.close();
      };
      x.oncontextmenu = (e) => {
    	e.preventDefault();
    	var del_confirmation = confirm("Delete?");
    	if (del_confirmation) {
    	  board.deleteFrame(i);
    	  Frames.open();
    	}
      };
    });
  }
  static close() {
    document.querySelector("#frames").style.transform = "translate(-50%,-50%) scale(0,0)";
  }
}

$(document).ready(function() {
  $("#close").click(function () { 
    $('#close').attr("disabled", true);

    if (window.board) {
      board.removeListeners();
    }

    let version = $('#version').val();
    let csrf_token = $("#popup").find("[name='csrfmiddlewaretoken']").val();
    let postData = { csrfmiddlewaretoken: csrf_token, version: version };

    $.post("/editor/get_qr_template", postData, function (data) {
      window.board = new Canvas(data.width, data.height);
      window.board.setQrMap(data.map);
      window.board.setcolor([0, 0, 0, 255]);
      window.board.redraw();
      window.dim.close();
      $('#close').attr("disabled", false);
    }, "json");
  });

  $(".menubtn").click(function () {
    document.querySelector(".menu").style.display = document.querySelector(".menu").style.display != "block" ? "block" : "none";
  });

  $("#create-qr").click(function() {
    let csrf_token = $(".create-buttons").find("[name='csrfmiddlewaretoken']").val();
    let url = $("#to-url").val();
    let design = window.board.data;
    let postData = { csrfmiddlewaretoken: csrf_token, qrurl: url, qrdesign: JSON.stringify(design) };
    
    $.post("/create_qr_arr/", postData, function(data) {
      if (data.success) {
        var img = document.getElementById('qr-result');
        img.src = 'data:image/png;base64,' + data.encoded;
        img.style.display = "block";
      } else {
        alert(data.error);
      }
    }, "json");
  });

  window.newProject = function () {
    document.querySelector(".menu").style.display = "none";
    localStorage.removeItem('pc-canvas-data');
    window.dim = new Popup("#popup");
    window.colors = [
      [0, 0, 0, 255],
      [255, 255, 255, 255]
    ];
  }

  window.onbeforeunload = function () {
    board.saveInLocal();
    return;
  };	

  var msg;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    msg = e;
  });

  let canvasData = localStorage.getItem('pc-canvas-data');
  if(canvasData){
    data = JSON.parse(canvasData);
    window.colors = data.colors;
    window.board = new Canvas(data.width, data.height);
    window.board.reserved = data.reserved;
    let img = new Image();
    img.setAttribute('src', data.url);
    img.addEventListener("load", function () {
      window.board.ctx.drawImage(img, 0, 0);
    });

    window.board.steps = data.steps;
    window.board.setcolor([0, 0, 0, 255]);
    window.board.redraw();
    window.board.redo_arr = data.redo_arr;
  }
  else {
    newProject();
  }
});

