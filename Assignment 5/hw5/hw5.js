//This file includes WebGL program that models a 3D cylinder and displays it using wireframe rendering...

var VSHADER_SOURCE = `#version 300 es
  in vec4 a_Position;   
  uniform mat4 u_MvpMatrix;

  void main() {
    gl_Position = u_MvpMatrix * a_Position;     
  }
`;

var FSHADER_SOURCE =  `#version 300 es
  precision mediump float;

  out vec4 cg_FragColor;
  
  void main() {
    cg_FragColor = vec4(0.93, 0.4, 0.79, 1.0);
  }
`;

function main() {
  var canvas = document.getElementById('canvas');

  var gl = canvas.getContext('webgl2');

  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  // Set the vertex coordinates and color
  var n = initVertexBuffers(gl);
  
  // Set clear color 
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  
  // Set the eye point and the viewing volume
  var mvpMatrix = new Matrix4();
  mvpMatrix.setPerspective(30, 1, 1, 100);
  mvpMatrix.lookAt(0, 0,20, 0, 0, 0, 0, 1, 0);
  
  function update() {
    mvpMatrix.rotate(0.5, 0, 1, 0); // 0.5 degree y-roll
    mvpMatrix.rotate(1, 1, 0, 0); // 1 degree x-roll

    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Clear color buffer
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw polyhedron using vertex indices, instead of positions
    // n: total number of indices we'll use to draw triangles
    // gl.UNSIGNED_SHORT: data type of index
    // total number of indices could be over 256 (thus SHORT instead of BYTE)
    // 0: starting offset in bytes 
    gl.drawElements(gl.LINE_LOOP, n, gl.UNSIGNED_SHORT, 0); 

    requestAnimationFrame(update);
  }
  update();
}

function initVertexBuffers(gl) {
  const RES = 20; // n in n-gon 
  let height = 4; // height of cone
  let radius = 2.0; // radius of base circle

  let vertices = [];
  let indices = [];
 
  // store the top side verticies
  for (let i = 0; i <= RES; ++i) {
    let theta = i * (2*Math.PI) / RES; // horizontal angle [0, 360]
    let cosTheta = Math.cos(theta); // rotating from z to x axis
    let sinTheta = Math.sin(theta); // rotating from z to x axis 

    let x = sinTheta; // sinPhi: radius of circle at that latitude
    let y = height/2; // base circle's y coord
    let z = cosTheta;  // sinPhi: radius of circle at that latitude

    vertices.push(radius * x);
    vertices.push(radius * y);
    vertices.push(radius * z);
  }

  // store the top center vertices
  vertices.push(0); // x
  vertices.push(height); // y
  vertices.push(0); // z
  
  //  store the bottom side verticies
  for (let j = 0; j <= RES; ++j) {
    let phi = j * (2*Math.PI) / RES; // horizontal angle [0, 360]
    let cosPhi = Math.cos(phi); // rotating from z to x axis
    let sinPhi = Math.sin(phi); // rotating from z to x axis 

    let x = sinPhi; // sinPhi: radius of circle at that latitude
    let y = -height/2; // base circle's y coord
    let z = cosPhi;  // sinPhi: radius of circle at that latitude

    vertices.push(radius * x);
    vertices.push(radius * y);
    vertices.push(radius * z);
  }

  //  bottom center vertices specification
  for (let j = 0; j <= RES; ++j) { 
    let phi = j * (Math.PI) / RES; // vertical angle [0, 180]
    let cosPhi = Math.cos(phi);
    let sinPhi = Math.sin(phi);

    for (let i = 0; i <= RES; ++i) { 
      let theta = i* (Math.PI) / 2* RES; // horizontal angle [0, 360]
      let cosTheta = Math.cos(theta); // rotating from z to x axis
      let sinTheta = Math.sin(theta);  

      let x = sinPhi * sinTheta; // sinPhi: radius of current n-gon
      let y = -height/2; // height of current n-gon
      let z = sinPhi * cosTheta;  // sinPhi: radius of current n-gon
      
      vertices.push(radius * x);
      vertices.push(radius * y);
      vertices.push(radius * z);   
    }
  }
  
for (let i = 0; i < RES; ++i) {
  indices.push(i);
  indices.push(i + 1);
  indices.push(RES + 1); // top vertex 
  
  indices.push(i);
  indices.push(i + RES);
  indices.push(RES + i + 1); // side vertex
}

for (let j = 0; j < RES; ++j) { // vertical vertices
    for (let i = 0; i < RES; ++i) { // horizontal vertices

      let down = j * (RES) + i;
      let up = (j+1) * (RES) + i + 1;

      // lower triangle of quadrangle cell
      indices.push(down);
      indices.push(down + 1);
      indices.push(up + 1);       // bottom center triangle
    }
  }
 
  vertexData = new Float32Array(vertices);
  indexData = new Uint16Array(indices); // indices may be more than 256
    
  // Write the vertex coordinates and color to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
  
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

  return indices.length;
}