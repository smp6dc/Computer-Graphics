//This file includes WebGL program that creates and visualizes a random triangle...

let VSHADER_SOURCE = `#version 300 es
    in vec4 a_Position;  //xyzw
    in vec4 a_Color;    // attribute variable
    out vec4 v_Color; //Varing variable
    void main(){
        gl_Position = a_Position;  
        v_Color = a_Color;  // pass color to fragment shader
    }`;

let FSHADER_SOURCE = `#version 300 es
    precision highp float;
    in vec4 v_Color;  // per-fragment color (linearly interpolated)
    out vec4 sp_FragColor; //user defined fragment color
    void main() {

        sp_FragColor = v_Color; // rgba
    }`;

function main(){
        // Retrieve <canvas> element
    var canvas = document.getElementById("canvas");
        // Get the rendering context for WebGL2 
    var gl = canvas.getContext("webgl2");
        // Initialize shaders
    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    initVertexBuffer(gl);
        // Specify the color for clearing <canvas>
    gl.clearColor(0.0,0.0,0.0,1.0)
        // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
        // Draw triangle
    gl.drawArrays(gl.TRIANGLES,0,3);
}

function initVertexBuffer(gl){
        //generate interleaved vertex + color
    let vertices = new Float32Array([  
    Math.random()*2-1, -(Math.random()*2 -1), Math.random(), Math.random(), Math.random(),        //[x,y,r,g,b] [-1,1],[-1,1],[1,1],[1,1],[1,1]
    Math.random()*2-1, -(Math.random()*2 -1), Math.random(), Math.random(), Math.random(),         //[x,y,r,g,b] [-1,1],[-1,1],[1,1].[1,1],[1,1]
    Math.random()*2-1, -(Math.random()*2 -1), Math.random(), Math.random(), Math.random()           //[x,y,r,g,b] [-1,1],[-1,1],[1,1],[1,1],[1,1]
    ]);

        // Create VBO
    let vertexBuffer = gl.createBuffer();
        // Bind VBO to ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // Write data position of vertices to Buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // Define size Bytes Per Element(4)
    let FSIZE = Float32Array.BYTES_PER_ELEMENT;
        // Get storage location of a_Position, assign VBO and enable
    let a_Position = gl.getAttribLocation(gl.program,'a_Position');
    // Assign buffer object a_Position variable
    // (Attribute Location, Number of attribute per elements, Type of Element, Size of an individual vertex, offset from the beginning of a single vertext to these attribute )
    gl.vertexAttribPointer(a_Position,2 , gl.FLOAT, false, FSIZE * 5, 0); 
    // enable assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

     //  Get storage location of a_Color, assign VBO and enable
    let a_Color = gl.getAttribLocation(gl.program,'a_Color');
    gl.vertexAttribPointer(a_Color,3 , gl.FLOAT, false, FSIZE * 5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);

    // unbind VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}