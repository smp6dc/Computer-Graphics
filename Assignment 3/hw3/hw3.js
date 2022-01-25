//This file includes WebGL program that creates symmetric sine wave animation....

var VSHADER_SOURCE = `#version 300 es
  in vec4 a_Position;				//xyzw
  uniform mat4 u_ModelMatrix;			//Model matrix
  void main(){
    gl_Position = u_ModelMatrix * a_Position;
  }`;

 var FSHADER_SOURCE = `#version 300 es
 precision mediump float;
 uniform vec4 u_Color;
 out vec4 sp_FragColor;				//user defined fragment color
 void main(){
   sp_FragColor = u_Color;
 }`;

function Polygon(){
  this.vert = 0;				// how many vertices this polygon has
  this.color = [0,0,0];				// color of this polygon
  this.center = [0,0];				// center (x, y) of this Rectangle
  this.offset = 0;				// how many vertices before this polygon
  this.s = 0;					// scale factor for this bar
}

let polygons = [];				// polygons array
let half = 9;					// half of total bars
let PI = 3.14159265;				

function main(){
  var canvas = document.getElementById('canvas');	
  var gl =canvas.getContext('webgl2');			// Get the rendering context for WebGL
  initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE);	// Initialize shaders
  
  initVertexBuffers(gl);

  var modelMatrix = new Matrix4();
  var u_ModelMatrix = gl.getUniformLocation(gl.program,'u_ModelMatrix');	// Pass the model matrix to the vertex shader

  (function update(){
    animate();						// Update the rotation angle
    drawPolygons(gl,modelMatrix,u_ModelMatrix);		// Draw the triangle
    requestAnimationFrame(update);			// Request that the browser calls tick
  })();
}

function drawPolygons(gl,modelMatrix,u_ModelMatrix)
{

  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let u_Color = gl.getUniformLocation(gl.program, 'u_Color');  
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; 	// 4 bytes per float

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);  

  let maxD = PI;

  for (let i = -half; i <= half; i++)			// draw all bars   
  {
      
      let x = i/half;		// [-1, 1]  
      
      if(x<0){			// [-1,0) loop between -1 and 0
      
      x *= maxD ;		
      let dist = x  ;
      let sy = Math.sin(-iTime*2 + dist);
      sy = sy + 1.5;					// [0.5, 2.5] make sure height stay positive
      let h = polygons[i+half].h;

      modelMatrix.setIdentity();  			// Set identity matrix
      modelMatrix.translate(0, h * 0.5 * sy - 0.6, 0);  // make all bars align horizontally
      modelMatrix.scale(1, sy, 1); 			// scaling up and down
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      // stride = 0, offset = FSIZE * 2 * polgons[i].offset 
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, FSIZE*2*polygons[i+half].offset);
      gl.enableVertexAttribArray(a_Position);

      gl.uniform4f(u_Color, 0.3, 0.9, 0.8, 1.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, polygons[i+half].vert); 	// TRIANGLE_STRIP for quad       
      x = i/half;							// Normalize x value
      
      }


      else if(x==0){				// Draw bar for the position when x==0
       
      x *= maxD ;
      let dist = x + maxD ;
      let sy = Math.sin(iTime*2 + dist);
      sy = sy + 1.5; 				// [0.5, 2.5] make sure height stay positive
      let h = polygons[i+half].h;

      modelMatrix.setIdentity();  		// Set identity matrix
      modelMatrix.translate(0, h * 0.5 * sy - 0.6, 0); 	// make all bars align horizontally
      modelMatrix.scale(1, sy, 1); 			// scaling up and down
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      // stride = 0, offset = FSIZE * 2 * polgons[i].offset 
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, FSIZE*2*polygons[i+half].offset);
      gl.enableVertexAttribArray(a_Position);

      gl.uniform4f(u_Color, 0.3, 0.9, 0.8, 1.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, polygons[i+half].vert); 	// TRIANGLE_STRIP for quad       
          
      x = i/half;					// Normalize x value
      }
      
      else if(x>=0.1){		// [0.1,0.9] because half=9 so it will loop between +0.1 to +0.9
          
      x *= maxD ;
      let dist = x + maxD ;
      let sy = Math.sin(iTime*2 + dist);
      sy = sy + 1.5; 				// [0.5, 2.5] make sure height stay positive
      let h = polygons[i+half].h;

      modelMatrix.setIdentity();  		// Set identity matrix
      modelMatrix.translate(0, h * 0.5 * sy - 0.6, 0); 	// make all bars align horizontally
      modelMatrix.scale(1, sy, 1); 			// scaling up and down
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      // stride = 0, offset = FSIZE * 2 * polgons[i].offset 
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, FSIZE*2*polygons[i+half].offset);
      gl.enableVertexAttribArray(a_Position);

      gl.uniform4f(u_Color, 0.3, 0.9, 0.8, 1.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, polygons[i+half].vert); 	// TRIANGLE_STRIP for quad       
      x = i/half;							// Normalize
  }
  }
}

let iTime = 0; 			// total time
var prv = Date.now();
function animate() {
  				// Calculate the elapsed time
  var now = Date.now();
  var deltaTime = (now - prv) * 0.001; 	// how many seconds have elapsed
  iTime += deltaTime; 			// update current time
  prv = now;
}

function initVertexBuffers(gl){
  let g_Points = [];	// store bar vertices
  let h = 0.5;		// bar width
  let w = 0.1;		// bar height

  for (let i = -half; i <= half; i++){		// loop between lower bound(-9) to upper bound(+9)
    let cx,cy;
    let x1,y1,x2,y2,x3,y3,x4,y4;
    let ratio = 0.8;

    cx = i*w;			// x-point - center of bar
    cy = 0;			// y-point - center of bar

    x1 = cx - w * 0.5 * ratio; y1 = cy - h * 0.5 ; 	//lower left
    x2 = cx - w * 0.5 * ratio; y2 = cy + h * 0.5 ; 	//upper left
    x3 = cx + w * 0.5 * ratio; y3 = cy - h * 0.5 ; 	//lower right
    x4 = cx + w * 0.5 * ratio; y4 = cy + h * 0.5 ; 	//upper right
    g_Points.push(x1); g_Points.push(y1);
    g_Points.push(x2); g_Points.push(y2);
    g_Points.push(x3); g_Points.push(y3);
    g_Points.push(x4); g_Points.push(y4);

    polygons.push(new Polygon());
    polygons[i + half].vert = 4;		//quad
    polygons[i + half].center = [cx, cy];
    polygons[i + half].h = h;
    polygons[i + half].w = w;

    if(i> -half){       
      polygons[i + half].offset = polygons[i + half - 1].offset + polygons[i + half -1 ].vert;
    }
  }
  let vertices = new Float32Array(g_Points);
  var vertexBuffer = gl.createBuffer();			// Create a buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);		// Bind the buffer object to target
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);	// Write date into the buffer object
}