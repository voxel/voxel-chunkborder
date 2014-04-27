'use strict';

var createBuffer = require('gl-buffer');
var createVAO = require('gl-vao');
var createShader = require('gl-shader');

module.exports = function(game, opts) {
  return new BorderPlugin(game, opts);
};
module.exports.pluginInfo = {
  loadAfter: ['voxel-mesher', 'voxel-shader', 'voxel-keys'],
  clientOnly: true
};

function BorderPlugin(game, opts) {
  this.game = game;
  this.shell = game.shell;
  this.mesherPlugin = game.plugins.get('voxel-mesher');
  if (!this.mesherPlugin) throw new Error('voxel-chunkborder requires voxel-mesher');

  this.shaderPlugin = game.plugins.get('voxel-shader');
  if (!this.shaderPlugin) throw new Error('voxel-chunkborder requires voxel-shader');

  this.keysPlugin = game.plugins.get('voxel-keys'); // optional

  this.showBorders = opts.showBorder !== undefined ? opts.showBorders : false; // also changed at runtime
  this.colorVector = opts.color !== undefined ? opts.color : [0,0,1,1]; // blue, RGBA TODO: convert from hex?

  this.enable();
}

BorderPlugin.prototype.enable = function() {
  this.shell.bind('chunkborder', 'F9');
  if (this.keysPlugin) this.keysPlugin.down.on('chunkborder', this.onToggle = this.toggle.bind(this));
  this.shell.on('gl-init', this.onInit = this.shaderInit.bind(this));
  this.shell.on('gl-render', this.onRender = this.render.bind(this));
  this.mesherPlugin.on('meshed', this.onMeshed = this.createBorderMesh.bind(this));
};

BorderPlugin.prototype.disable = function() {
  this.mesherPlugin.removeListener('meshed', this.onMeshed);
  this.shell.removeListener('gl-render', this.onRender);
  this.shell.removeListener('gl-init', this.onInit);
  this.shell.unbind('chunkborder');
  if (this.keysPlugin) this.keysPlugin.down.removeListener('chunkborder', this.onToggle);
};

BorderPlugin.prototype.toggle = function() {
  this.showBorders = !this.showBorders;
};

BorderPlugin.prototype.shaderInit = function() {
  this.borderShader = createShader(this.shell.gl,
"/* voxel-chunkborder vertex shader */\
attribute vec3 position;\
uniform mat4 projection;\
uniform mat4 view;\
uniform mat4 model;\
void main() {\
  gl_Position = projection * view * model * vec4(position, 1.0);\
}",

"/* voxel-chunkborder fragment shader */\
precision lowp float;\
uniform vec4 color;\
void main() {\
  gl_FragColor = color;\
}");
};

BorderPlugin.prototype.render = function() {
  if (this.showBorders) {
    var gl = this.shell.gl;

    this.borderShader.bind();
    this.borderShader.attributes.position.location = 0;
    this.borderShader.uniforms.projection = this.shaderPlugin.projectionMatrix;
    this.borderShader.uniforms.view = this.shaderPlugin.viewMatrix;
    this.borderShader.uniforms.color = this.colorVector;

    for (var chunkIndex in this.game.voxels.meshes) {
      var mesh = this.game.voxels.meshes[chunkIndex];

      this.borderShader.uniforms.model = mesh.modelMatrix;
      mesh.borderVAO.bind();
      mesh.borderVAO.draw(gl.LINES, mesh.borderVertexCount);
      mesh.borderVAO.unbind();
    }
  }
};

// Create the mesh around each chunk
// useful references:
// https://github.com/deathcap/voxel-wireframe
// https://github.com/hughsk/indexed-geometry-demo
// https://github.com/deathcap/avatar
BorderPlugin.prototype.createBorderMesh = function(mesh, gl, _vert_data, voxels) {
  var x = voxels.shape[0] - 2;
  var y = voxels.shape[1] - 2;
  var z = voxels.shape[2] - 2;

  var borderVertexArray = new Uint8Array([
    0,0,0,
    0,0,z,
    0,y,0,
    0,y,z,
    x,0,0,
    x,0,z,
    x,y,0,
    x,y,z
  ]);

  var indexArray = new Uint16Array([
    0,1, 0,2, 2,3, 3,1,
    0,4, 4,5, 5,1,
    5,7, 7,3,
    7,6, 6,2,
    6,4
  ]);

  var borderVertexCount = indexArray.length;

  var borderBuf = createBuffer(gl, borderVertexArray);
  var indexBuf = createBuffer(gl, indexArray, gl.ELEMENT_ARRAY_BUFFER);

  var borderVAO = createVAO(gl, [
      { buffer: borderBuf,
        type: gl.UNSIGNED_BYTE,
        size: 3
      }], indexBuf);

  mesh.borderVertexCount = borderVertexCount
  mesh.borderVAO = borderVAO;
};
