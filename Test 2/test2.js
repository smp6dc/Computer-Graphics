//This file includes WebGL program that Add a checkbox rotate? which, if checked, smoothly rotates Earth using y-roll (see video).
//Add a checkbox clouds? which, if checked, puts cloud texture on top of Earth texture using linear interpolation
var VSHADER_SOURCE = `#version 300 es
   in vec4 a_Position;
   in vec2 a_TexCoord;
   in vec4 a_Color; 
   in vec4 a_Normal;
   uniform mat4 u_MvpMatrix;      // MVP matrix
   uniform mat4 u_ModelMatrix;    // Model matrix
   uniform mat4 u_NormalMatrix;   // Transformation matrix of the normal
   uniform vec3 u_LightColor;     // Light color
   uniform vec3 u_LightPosition;  // Position of the light source
   uniform vec3 u_AmbientLight;   // Ambient light color
   out vec2 v_TexCoord; // UV-texture coord for this vertex 
   out vec4 v_Color; // diffuse + ambient reflection (grayscale)

   void main() {
     vec4 color = vec4(1.0, 1.0, 1.0, 1.0); // material color (grayscale)
     
     gl_Position = u_MvpMatrix * a_Position;
     
     // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
     vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
     
     // Calculate world coordinate of vertex
     vec4 vertexPosition = u_ModelMatrix * a_Position;
     
     // Calculate the light direction and make it 1.0 in length
     vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
     
     // The dot product of the light direction and the normal
     float nDotL = max(dot(lightDirection, normal), 0.0);
     
     // Calculate the color due to diffuse reflection
     vec3 diffuse = u_LightColor * color.rgb * nDotL;
     
     // Calculate the color due to ambient reflection
     vec3 ambient = u_AmbientLight * color.rgb;
     
     // Add the surface colors due to diffuse reflection and ambient reflection
     v_Color = vec4(diffuse + ambient, color.a);

     v_TexCoord = a_TexCoord; // send UV-coord to frag shader 
}`;

var FSHADER_SOURCE = `#version 300 es
   precision highp float;
  
   uniform sampler2D u_image[2];
   in vec2 v_TexCoord; // interpolated UV-coord for this pixel 
   in vec4 v_Color; // diffuse + ambient reflection (grayscale)
   out vec4 cg_FragColor;
   uniform bool u_cloud;
   
   void main() {
     vec4 c1 = texture(u_image[0], v_TexCoord); // texel color on this UV-coord 
     vec4 c2 = texture(u_image[1], v_TexCoord);
 
    if(u_cloud){ 
          cg_FragColor = mix(c1*v_Color,(c1+c2)*v_Color.a,(c2.r*v_Color));    // mix up cloud texture on the top of earth texture
     }

    else{ cg_FragColor = c1*v_Color; }
}`;

let config = {
    ROTATE: false,  // rotate object?
    CLOUDS: false,  // perform clouds texture on earth texture
}

let gui = new dat.GUI({ width: 300 });
function startGUI () {    
    gui.add(config, 'ROTATE').name('rotate?').onChange(update);
    gui.add(config, 'CLOUDS').name('clouds?').onChange(update);
}
startGUI();

let gl, canvas;
let url = []; // url for each texture image
let vert = []; // number of indices for each object
let vao = [];
let modelMatrix;
let animID;
let texUnit = [];
let imgs = [];
let texture = [];

function update() {
  cancelAnimationFrame(animID); // to avoid duplicate requests 
  loadImage();
}

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl2');

  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  // obtain urls for texture images
  url.push("http://www.cs.umsl.edu/~kang/htdocs/textures/8k_earth_daymap.jpg");
  url.push("http://www.cs.umsl.edu/~kang/htdocs/textures/8k_earth_clouds.png");
  
  modelMatrix = new Matrix4();  // Model matrix

  loadImage();
}

function loadImage() {

  let imagesToLoad = url.length; // total number of images to load
  
  for(let i = 0; i < imagesToLoad; i++){  // for loop to load images untill url.length
      texUnit.push(i);                  //   push  the  index  of image in texUnit list
      imgs.push(new Image());
      imgs[i].crossOrigin = "";
      imgs[i].src = url[i];
      imgs[i].onload = function(){
          imagesToLoad--;
          
          vert.push(generateSphere(gl));

          texture.push(gl.createTexture());
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); // Flip the image's y axis
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, texture[i]);

          // Set the parameters so we can render any size image.
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

          // Upload the image into the texture.
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[i]);
                 
          // Supply uniform texture sampler value as 0
          let u_Sampler = gl.getUniformLocation(gl.program, 'u_image');
      
          gl.uniform1iv(u_Sampler, texUnit);

          let u_cloud = gl.getUniformLocation(gl.program,'u_cloud');
          gl.uniform1i(u_cloud,config.CLOUDS);
      
          if(imagesToLoad == 0){ render(canvas, gl); }
      };
  }
}

function render(canvas, gl) {
 
  // Set the clear color and enable the depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables and so on
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 5.0, 8.0, 7.0);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
 
  var mvpMatrix = new Matrix4(); // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals
 
  function update() {
    if (config.ROTATE) {
      modelMatrix.rotate(0.4, 0, 1, 0); // y-roll
    }

    // Calculate the view projection matrix
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    mvpMatrix.lookAt(4, 1, 6, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    
    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Calculate the matrix to transform the normal based on the model matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    // Pass the transformation matrix for normals to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // bind vertex array for current object
    gl.bindVertexArray(vao[0]);

    // Draw the cube(Note that the 3rd argument is the gl.UNSIGNED_SHORT)
    gl.drawElements(gl.TRIANGLES, vert[0], gl.UNSIGNED_SHORT, 0);

    if (config.ROTATE) 
      animID = requestAnimationFrame(update);
  }
  update();
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

function generateSphere(gl) { // Create a sphere
  var RES = 50;
  let radius = 1.5;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var texcoords = []; // UV texture coordinates
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= RES; j++) { // vertical angle
    aj = j * Math.PI / RES;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= RES; i++) { // horizontal angle
      ai = i * 2 * Math.PI / RES;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(radius * si * sj);  // X
      positions.push(radius * cj);       // Y
      positions.push(radius * ci * sj);  // Z

      texcoords.push(i/RES * 1); // u 
      texcoords.push(j/RES * 1); // v 
    }
  }

  // Generate indices
  for (j = 0; j < RES; j++) {
    for (i = 0; i < RES; i++) {
      p1 = j * (RES+1) + i;
      p2 = p1 + (RES+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  vao[0] = gl.createVertexArray();
  gl.bindVertexArray(vao[0]);

  // Write the vertex properties to buffers (positions, normals, texcoords)
  initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3);
  // for sphere, vertex normal is the same as vertex position 
  initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3); 
  initArrayBuffer(gl, 'a_TexCoord', new Float32Array(texcoords), gl.FLOAT, 2);

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindVertexArray(null); // unbind this VAO

  return indices.length;
}