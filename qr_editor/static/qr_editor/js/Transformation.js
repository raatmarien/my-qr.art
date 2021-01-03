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

/*
 * 
 *  function Template
 *
 *  function transformation_name(points, others){
 *	//points -> array of point of object
 *	//others -> any othee parameters the specific transformation requires
 *
 *	return points;//This is the tranaformed Points
 *  }
 *
 *  example:
 *  	function translation(points, tPoint){
 *  	  //points -> array of point of Object
 *	  //tPoint -> Points to be Translated
 *
 *	  //Do Processing
 *
 *	  return points;//This is translated points
 *	}
 *
 */


function translate(points, pt){
	/* This function translates the object to the new co-ords by pt units */

	for(let p of points){
		let a = [
			[p.x],
			[p.y],
			[1]
		];
		let transMatrix = [
			[1, 0, pt.x],
			[0, 1, pt.y],
			[0, 0, 1]
		];
		let ans = matrixMult(transMatrix, a);

		p.x = ans[0][0];
		p.y = ans[1][0];
	}
	return points;
}

//console.log(translation([{"x": 1, "y":1}],{"x": 1, "y":5}));

function scale(points, sx, sy, pf){
	/* This function Scales the object  with sx along x-axis and sy along y-axis with a fixed point pf */
	for(let p of points){
		let a = [
			[p.x],
			[p.y],
			[1]
		];
		let scaMatrix = [
			[sx, 0, 0],
			[0, sy, 0],
			[0, 0, 1]
		];

		let transToMatrix = [
			[1, 0, -pf.x],
			[0, 1, -pf.y],
			[0, 0, 1]
		];

		let transBackMatrix = [
			[1, 0, pf.x],
			[0, 1, pf.y],
			[0, 0, 1]
		];
		let ans = matrixMult(transToMatrix, a);
		ans = matrixMult(scaMatrix, ans);
		ans = matrixMult(transBackMatrix, ans);

		p.x = ans[0][0];
		p.y = ans[1][0];
	}
	return points;
}

//console.log(scale([{"x": 0, "y": 3},{"x": 3, "y": 3},{"x": 3, "y": 0},{"x": 0, "y": 0}], 2, 3, {"x": 0, "y": 0}));


function rotate(points, angle, pf){
	/* This function rotates the object with angle with respect to fixed Point pf */
	angle = angle * (Math.PI /180.0);	
	for(let p of points){
		let a = [
			[p.x],
			[p.y],
			[1]
		];
		let rotMatrix = [
			[Math.cos(angle), -Math.sin(angle), 0],
			[Math.sin(angle),  Math.cos(angle), 0],
			[0, 0, 1]
		];

		let transToMatrix = [
			[1, 0, -pf.x],
			[0, 1, -pf.y],
			[0, 0, 1]
		];

		let transBackMatrix = [
			[1, 0, pf.x],
			[0, 1, pf.y],
			[0, 0, 1]
		];
		let ans = matrixMult(transToMatrix, a);
		ans = matrixMult(rotMatrix, ans);
		ans = matrixMult(transBackMatrix, ans);

		p.x = ans[0][0];
		p.y = ans[1][0];
	}

	return points;
}
//console.log(rotate([{"x": 20, "y": 20},{"x": 80, "y": 20},{"x": 50, "y": 50}], 90, {"x": 50, "y": 30}));

