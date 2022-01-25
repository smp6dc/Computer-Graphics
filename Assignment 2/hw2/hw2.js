//This file includes WebGL program that creates and visualizes random polygons (n-gons)...

let VSHADER_SOURCE = `#version 300 es
    in vec4 a_Position;  			//xyzw
    uniform mat4 u_Modelmatrix;			//Model matrix
    void main(){
        gl_Position = u_Modelmatrix * a_Position;

    }`;

let FSHADER_SOURCE = `#version 300 es
    precision highp float;
    uniform vec4 u_color; 			
    out vec4 sp_FragColor;			//user defined fragment color
    void main(){
        sp_FragColor = u_color;  		//rgba
    }`;



let stars = [];	// n-gons array
let gl,canvas;
let u_Modelmatrix;
let Modlematrix;
let angle=0;
let speed=100;
let speed1 = 0.5;
let sign = 1.0;
let s=1.0;
let m =10

function main(){

	// Retrieve <canvas> element
    canvas = document.getElementById('canvas');
	// Get the rendering context for WebGL2 
    gl = canvas.getContext("webgl2");
	 // Initialize shaders
    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    
    initVertexBuffer(gl);	//
	// Specify the color for clearing <canvas>
    gl.clearColor(0.0,0.0,0.0,1.0);
	// Pass the model matrix to the vertex shader
    u_Modelmatrix = gl.getUniformLocation(gl.program,'u_Modelmatrix');
    Modlematrix = new Matrix4();		// class representing a 4x4 matrix.

    let update = function() {
    animate();				// Animate n-gons with angle
    draw();                             // Draw n-gons
    animate2();                         // Animate n-gons through scale
    requestAnimationFrame(update);	// Request that browser call update
    };

    update();

}

function draw(){
	
    let a_Position = gl.getAttribLocation(gl.program,'a_Position');	// Get storage location of a_Position, assign VBO and enable
    let u_color = gl.getUniformLocation(gl.program,'u_color');		

    const FSIZE = Float32Array.BYTES_PER_ELEMENT;		// Define size Bytes Per Element(4)
    
    gl.clear(gl.COLOR_BUFFER_BIT);			// Clear <canvas>

    for(let i = 0; i < polygons.length;i++){
        gl.vertexAttribPointer(a_Position,2,gl.FLOAT,false,0,FSIZE*2*polygons[i].offset);	// Assign buffer object a_Position variable
        gl.enableVertexAttribArray(a_Position);			 // enable assignment to a_Position variable

        let cx = polygons[i].center[0];		
        let cy = polygons[i].center[1];

        Modlematrix.setIdentity();		// Set identity matrix
       
        Modlematrix.translate(cx,cy,0);		//  Translate n-gons to the origin
        Modlematrix.scale(s,s,1);		//  Scale n-gons
        Modlematrix.rotate(angle,0,0,1);       	//  Rotate n-gons 
        Modlematrix.translate(-cx,-cy,1);	//  Translate n-gons reverse on its center
       
        gl.uniformMatrix4fv(u_Modelmatrix,false,Modlematrix.elements);  // pass the metrix to the vertex shader
        let c = polygons[i].color;		

        gl.uniform4f(u_color,c[0],c[1],c[2],1);  
        gl.drawArrays(gl.TRIANGLE_FAN,0,polygons[i].vert);	// Draw n-gons
    }   
}

let prev=Date.now();	// Last time when this function is called

function animate(){
	
    let now = Date.now();	// calculate elapsed time
    let DeltaTime = (now - prev) * 0.001;	
    prev = now;
	
    angle += DeltaTime * speed;		// update angle

    angle %= 360;

    
}

let prev1=Date.now();		// Last time when this function is called
function animate2(){
    let now = Date.now();	// calculate elapsed time
    let DeltaTime = (now - prev1) * 0.001;
    prev1 = now;

    s += sign * DeltaTime * speed1;	// update scale

    if(Math.abs(s) > 1.0){ s = sign*1.0; sign*=-1; }
}

function Polygon() {   
  this.vert = 0; 		// number of vertices for this polygon 
  this.color = [0, 0, 0]; 	// color of this star
  this.center = [0, 0]; 	// center (x, y) of this star
  this.offset = 0; 		// how many vertices before this star
}

let polygons = []; 		// polygons array


function initVertexBuffer(gl){
    let g_points = [];		
    let m = 20;		// total number of n-gons
    for(let k = 0; k < m ; k++){
        let n = Math.round(Math.random()*10);   // number of vertices
    if(n<=2 && n>9){break;} 			// Limit vertices between 3 and 9

    
    let angle = 360.0 / n;  
    angle = (Math.PI * angle) / 180.0; 		// radian
    let radius = 0.15; 				// radius of polygon 

    let cx = Math.random()*2  - 1.0  ; 		// center x in [-1, 1]
    let cy = Math.random()*2  - 1.0 ; 		// center y in [-1, 1]
    
    g_points.push(cx); g_points.push(cy); 	// center
    
    for (let i = 0; i < n; i++) {    
      let x = cx + Math.cos(angle * i) * radius; 
      let y = cy + Math.sin(angle * i) * radius; 
      g_points.push(x); 				// store x-vertices position into g_points array
      g_points.push(y); 				// store y-vertices position into g_points array  
    }

    g_points.push(cx + radius); g_points.push(cy); 	// st_vertex

    polygons.push(new Polygon());     
    polygons[k].vert = n + 2; 				// add center and last vertex   
    polygons[k].color = [Math.random(), Math.random(), Math.random()]; // add rgb color
    polygons[k].center = [cx, cy];			// add center position
    
    if (k > 0) polygons[k].offset = polygons[k-1].offset + polygons[k-1].vert; 
    }
    
    let vertices = new Float32Array(g_points);      

    let vertexBuffer = gl.createBuffer();		// Create VBO

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);	// Bind VBO to ARRAY_BUFFER

    gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);  // Write data position of vertices to Buffer object

}