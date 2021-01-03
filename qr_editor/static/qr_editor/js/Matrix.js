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

function matrixMult(a, b){
        /*
         * This function Multiplies two Matrices (a, b)
         */
        let aNumRows = a.length, aNumCols = a[0].length,
        bNumRows = b.length, bNumCols = b[0].length,
        m = new Array(aNumRows);  // initialize array of rows
        for (let r = 0; r < aNumRows; ++r) {
                 m[r] = new Array(bNumCols); // initialize the current row
                 for (let c = 0; c < bNumCols; ++c) {
                         m[r][c] = 0;             // initialize the current cell
                         for (let i = 0; i < aNumCols; ++i) {
                                m[r][c] += a[r][i] * b[i][c];
                        }
                }
        }
        return m;
}

//console.log(matrixMult([[1,2,3],[1,2,3],[1,2,3]], [[1,0,0], [0,1,0],[0,0,1]]));
