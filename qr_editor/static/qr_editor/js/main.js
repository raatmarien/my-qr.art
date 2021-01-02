var Tool = {
  "pen": 0,
  "eraser": 1,
  "fillBucket": 2,
  "line": 3,
  "circle": 4,
  "ellipse": 5,
  "addFrame": 6,
  "undo": 7,
  "redo": 8,
  "clearCanvas": 9
};
var tools = [true, false, false, false, false, false];
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
      if (tools[Tool.fillBucket]) {
        filler(x, y, this.data[x][y]);
      } else if (tools[Tool.eraser]) {
        var temp = this.color;
        var tga = this.ctx.globalAlpha;
        this.setcolor([255, 255, 255, 255]);
        this.draw(x, y);
        this.setcolor(temp);
        this.ctx.globalAlpha = tga;
      } else if (tools[Tool.line]) {
        lc.push(new Point(x, y));
        if (lc.length == 2) {
          var lp = line(lc[0], lc[1]);
          lc = [];
          var p;
          for (p of lp) this.draw(p.x, p.y);
        }
      } else if (tools[Tool.circle]) {
        var centre = new Point(x, y);
        var radius = +prompt("radius?");
        var lp = circle(radius, centre);
        var p;
        for (p of lp) this.draw(p.x, p.y);
      } else if (tools[Tool.ellipse]) {
        var center = new Point(x, y);
        var radiusX = +prompt("X radius?");
        var radiusY = +prompt("Y radius?");
        var lp = ellipse(radiusX, radiusY, center);
        for (p of lp)
          this.draw(p.x, p.y);
      } else {
        this.draw(x, y);
      }

    });

    this.canvas.addEventListener("mousemove", e => {
      if (this.active) {
        var rect = this.canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        x = Math.floor(this.width * x / this.canvas.clientWidth);
        y = Math.floor(this.height * y / this.canvas.clientHeight);
        if(tools[Tool.pen]){
          this.draw(x, y)
        }
        else if(tools[Tool.eraser]){
          this.erase(x, y);
        }
      }
    });

    this.canvas.addEventListener("touchmove", e => {
      var rect = this.canvas.getBoundingClientRect();
      var x = e.touches[0].clientX - rect.left;
      var y = e.touches[0].clientY - rect.top;
      x = Math.floor(this.width * x / this.canvas.clientWidth);
      y = Math.floor(this.height * y / this.canvas.clientHeight);
      if(tools[Tool.pen]){
        this.draw(x, y);
      }
      else if(tools[Tool.eraser]){
        this.erase(x, y);
      }
    })

    this.canvas.addEventListener("mousedown", e => {
      this.active = true;
    });
    this.canvas.addEventListener("mouseup", e => {
      this.active = false;
    });
  }
  draw(x, y, count) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.data[x][y] = this.color;
      this.ctx.fillRect(Math.floor(x * (this.w / this.width)), Math.floor(y * (this.h / this.height)), Math.floor(this.w / this.width), Math.floor(this.h / this.height));
      if (!count && JSON.stringify(this.steps[this.steps.length-1])!==JSON.stringify([x,y,this.color,this.ctx.globalAlpha])) this.steps.push([x,y,this.color,this.ctx.globalAlpha]);
    }
  }
  erase(x, y){
    var temp = this.color;
    var tga = this.ctx.globalAlpha;
    this.setcolor([255, 255, 255, 255]);
    this.draw(x, y);
    this.setcolor(temp);
    this.ctx.globalAlpha = tga;
  }
  setcolor(color) {
    this.ctx.globalAlpha = 1;
    this.color = color;
    this.ctx.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")";
  }
  setmode(i) {
    tools = [false, false, false, false, false, false];
    tools[i] = true;
    document.querySelectorAll("#toolbar .item").forEach((x, i) => {
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
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.data = [...Array(this.width)].map(e => Array(this.height).fill([255, 255, 255, 255]));
    this.setcolor(this.color);
    this.setmode(Tool.pen);
  }

  addFrame(data=null) {
    var img = new Image();
    img.src = data || this.canvas.toDataURL();
    this.frames.push([img,this.data.map(inner => inner.slice())]);
  }

  deleteFrame(f) {
    this.frames.splice(f,1);
  }

  loadFrame(f) {
    this.clear();
    var img = this.frames[f][1];
    var tmp_color = this.color;
    var tmp_alpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = 1;
    var i,j;
    for (i=0; i<this.width; i++) {
      for (j=0; j<this.height; j++) {
  	this.setcolor(img[i][j]);
  	this.draw(i,j);
      }
    }
    this.setcolor(tmp_color);
    this.ctx.globalAlpha = tmp_alpha;
  }

  undo() {
    this.clear();
    this.redo_arr.push(this.steps.pop());
    var step;
    this.steps.forEach(step => {
      this.setcolor(step[2]);
      this.ctx.globalAlpha = step[3];
      this.draw(step[0],step[1],true);
    });
  }

  redo() {
    this.steps.push(this.redo_arr.pop());
    var step;
    this.steps.forEach(step => {
      this.setcolor(step[2]);
      this.ctx.globalAlpha = step[3];
      this.draw(step[0],step[1],true);
    });
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
              _this.setcolor(avg);
              _this.draw(i,j);
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

window.onload = function () {
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
    window.board.redo_arr = data.redo_arr;
    window.board.setcolor(data.currColor);
  }
  else {
    newProject();
  }
  document.querySelector("#palette").innerHTML = colors.map(x => `<span class="item" style="background-color: rgb(${x[0]},${x[1]},${x[2]})" onclick="board.setcolor([${x}]);act(this);" oncontextmenu="board.setcolor([${x}]);act(this);board.ctx.globalAlpha=+prompt('Transparency(0-1)?')"></span>`).join("\n");

  document.querySelector("#palette").addEventListener("contextmenu",e=>e.preventDefault());
}

document.querySelector("#close").onclick = function () {
  var width = +document.querySelector("#width").value;
  var height = +document.querySelector("#height").value;
  window.board = new Canvas(width, height);
  window.board.setcolor([0, 0, 0, 255]);
  window.dim.close();
}

document.querySelector(".menubtn").onclick = function () {
  document.querySelector(".menu").style.display = document.querySelector(".menu").style.display != "block" ? "block" : "none";
}

function newProject(){
  document.querySelector(".menu").style.display = "none";
  localStorage.removeItem('pc-canvas-data');
  window.dim = new Popup("#popup");
  window.colors = [
    [0, 0, 0, 255],
    [127, 127, 127, 255],
    [136, 0, 21, 255],
    [237, 28, 36, 255],
    [255, 127, 39, 255],
    [255, 242, 0, 255],
    [34, 177, 36, 255],
    [0, 162, 232, 255],
    [63, 72, 204, 255],
    [163, 73, 164, 255],
    [255, 255, 255, 255],
    [195, 195, 195, 255],
    [185, 122, 87, 255],
    [255, 174, 201, 255],
    [255, 201, 14, 255],
    [239, 228, 176, 255],
    [181, 230, 29, 255],
    [153, 217, 234, 255],
    [112, 146, 190, 255],
    [200, 191, 231, 255]
  ];
}
function filler(x, y, cc) {
  if (x >= 0 && x < board.width && y >= 0 && y < board.height) {
    if (JSON.stringify(board.data[x][y]) == JSON.stringify(cc) && JSON.stringify(board.data[x][y]) != JSON.stringify(board.color)) {
      board.draw(x, y);
      filler(x + 1, y, cc);
      filler(x, y + 1, cc);
      filler(x - 1, y, cc);
      filler(x, y - 1, cc);
    }
  }
}

function act(clr) {
  document.querySelectorAll("#palette .item").forEach(x => x.style.boxShadow = "");
  clr.style.boxShadow = "10px 10px 10px 10px rgba(0,0,0,0.5)";
}

window.onbeforeunload = function () {
  board.saveInLocal();
  return "Data will be lost if you leave the page, are you sure?";
};	

var msg;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  msg = e;
});

function install() {
  msg.prompt();
}

window.onerror = function (errorMsg, url, lineNumber) {
  alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
}
