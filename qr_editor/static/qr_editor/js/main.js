var Tool = {
  "pen": 0,
  "fillBucket": 1,
  // "line": 3,
  // "circle": 4,
  // "ellipse": 5,
  // "addFrame": 6,
  "undo": 2,
  "redo": 3,
  "clearCanvas": 4
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
    this.steps = [];
    this.redo_arr = [];
    this.frames = [];
    this.canvas.addEventListener("click", e => {
      var rect = this.canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      x = Math.floor(this.width * x / this.canvas.clientWidth);
      y = Math.floor(this.height * y / this.canvas.clientHeight);
      let tool = this.getTool(tools);
      let color = this.color;
      let step = [x, y, tool, color];
      if (this.doStep(step)) {
        this.steps.push(step);
        this.redo_arr = [];
      }
    });

    this.canvas.addEventListener("mousemove", e => {
      if (this.active) {
        var rect = this.canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        x = Math.floor(this.width * x / this.canvas.clientWidth);
        y = Math.floor(this.height * y / this.canvas.clientHeight);
        let tool = this.getTool(tools);
        let color = this.color;
        let step = [x, y, tool, color];
        if (tool == Tool.pen && this.doStep(step)) {
          this.steps.push(step);
          this.redo_arr = [];
        }
      }
    });

    this.canvas.addEventListener("touchmove", e => {
      var rect = this.canvas.getBoundingClientRect();
      var x = e.touches[0].clientX - rect.left;
      var y = e.touches[0].clientY - rect.top;
      x = Math.floor(this.width * x / this.canvas.clientWidth);
      y = Math.floor(this.height * y / this.canvas.clientHeight);
      let tool = this.getTool(tools);
      let color = this.color;
      let step = [x, y, tool, color];
      if (tool == tool.Tool.pen && this.doStep(step)) {
        this.steps.push(step);
        this.redo_arr = [];
      }
    })

    this.canvas.addEventListener("mousedown", e => {
      this.active = true;
    });
    this.canvas.addEventListener("mouseup", e => {
      this.active = false;
    });
  }

  getTool(tools) {
    for (var i = 0; i < tools.length; i++)
      if (tools[i]) return i;
  }

  doStep(step) {
    let x = step[0], y = step[1],
        tool = step[2], color = step[3];
    if (tool == Tool.clearCanvas) {
      this.doClear();
    } else if (tool == Tool.pen) {
      return this.draw(x, y, color);
    } else if (tool == Tool.fillBucket) {
      this.floodFill(x, y, this.data[x][y], color);
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

  floodFill(x, y, targetColor, replacementColor) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    if (this.colorEquals(targetColor, replacementColor)) {
      return;
    }
    if (!this.colorEquals(this.data[x][y], targetColor)) {
      return;
    }
    this.draw(x, y, replacementColor);
    this.floodFill(x + 1, y, targetColor, replacementColor);
    this.floodFill(x, y + 1, targetColor, replacementColor);
    this.floodFill(x - 1, y, targetColor, replacementColor);
    this.floodFill(x, y - 1, targetColor, replacementColor);
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
      this.redo_arr.push(this.steps.pop());
      this.steps.forEach(step => {
        this.doStep(step);
      });
    }
  }

  redo() {
    if (this.redo_arr.length > 0) {
      this.doClear();
      this.steps.push(this.redo_arr.pop());
      this.steps.forEach(step => {
        this.doStep(step);
      });
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
    }
    localStorage.setItem('pc-canvas-data', JSON.stringify(d));
  }

  addImage() {
    var _this = this;
    var fp = document.createElement("input");
    fp.type = "file";
    fp.click();
    fp.onchange = function(e) {
      var reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = function() {
        var uimg = new Image();
        uimg.src = reader.result;
        uimg.width = _this.w;
        uimg.height = _this.h;
        uimg.onload = function() {
          var pxc = document.createElement("canvas");
          pxc.width = _this.w;
          pxc.height = _this.h;
          var pxctx = pxc.getContext("2d");
          pxctx.drawImage(uimg,0,0,_this.w,_this.h);
          var i,j;
          for (i=0; i<_this.width; i++) {
            for (j=0; j<_this.height; j++) {
              var ctr = 0;
              var avg = [0,0,0,0];
              var pix = pxctx.getImageData(10*i, 10*j, 10, 10).data;
              pix.forEach((x,k) => {avg[k%4]+=x; if (k%4==0) ctr++;});
              avg = avg.map(x=>~~(x/ctr));
              _this.draw(i,j, avg);
            }
    	  }
        }
      }
    }
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

    let version = $('#version').val();
    let csrf_token = $("[name='csrfmiddlewaretoken']").val();
    let postData = { csrfmiddlewaretoken: csrf_token, version: 10 };

    $.post("/editor/get_qr_template", postData, function (data) {
      window.board = new Canvas(data.width, data.height);
      window.board.setcolor([0, 0, 0, 255]);
      window.dim.close();
      $('#close').attr("disabled", false);
    }, "json");
  });

  $(".menubtn").click(function () {
    document.querySelector(".menu").style.display = document.querySelector(".menu").style.display != "block" ? "block" : "none";
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

  window.onerror = function (errorMsg, url, lineNumber) {
    alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
  }

  let canvasData = localStorage.getItem('pc-canvas-data');
  if(canvasData){
    data = JSON.parse(canvasData);
    console.log(data);
    window.colors = data.colors;
    window.board = new Canvas(data.width, data.height);
    let img = new Image();
    img.setAttribute('src', data.url);
    img.addEventListener("load", function () {
      window.board.ctx.drawImage(img, 0, 0);
    });

    window.board.steps = data.steps;
    window.board.setcolor([0, 0, 0, 255]);
    window.board.steps.forEach(s => window.board.doStep(s));
    window.board.redo_arr = data.redo_arr;
  }
  else {
    newProject();
  }
});

