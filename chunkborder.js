'use strict';

var createBuffer = require('gl-buffer');
var createVAO = require('gl-vao');

module.exports = function(game, opts) {
  return new BorderPlugin(game, opts);
};

function BorderPlugin(game, opts) {
  this.mesher = game.plugins.get('voxel-mesher');
  if (!this.mesher) throw new Error('voxel-chunkborder requires voxel-mesher');

  this.enable();
}

BorderPlugin.prototype.enable = function() {
  this.mesher.on('meshed', this.onMeshed = this.createBorderMesh.bind(this));
};

BorderPlugin.prototype.disable = function() {
  this.mesher.removeListener('meshed', this.onMeshed);
};

BorderPlugin.prototype.createBorderMesh = function(mesh, gl, _vert_data, voxels) {
  var s = voxels.shape;

  console.log('border',voxels.shape.join(','));

  var borderVertexArray = [
       0,   0,   0,
       0,   0,s[2],
       0,s[1],   0,
       0,s[1],s[2],
    s[0],   0,   0,
    s[0],   0,s[2],
    s[0],s[1],   0,
    s[0],s[1],s[2]
  ];

  var borderVertexCount = borderVertexArray.length / 3;

  var indexArray = [
    0,1, 0,2, 2,3, 3,1,
    0,4, 4,5, 5,1,
    5,7, 7,3,
    7,6, 6,2,
    6,4
  ];

  var borderBuf = createBuffer(gl, borderVertexArray);
  var indexBuf = createBuffer(gl, indexArray, gl.ELEMENT_ARRAY_BUFFER)


  var borderVAO = createVAO(gl, [
      { buffer: borderBuf,
        type: gl.UNSIGNED_BYTE,
        size: 3
      }], indexBuf);

  mesh.borderVertexCount = borderVertexCount
  mesh.borderVAO = borderVAO;
};
