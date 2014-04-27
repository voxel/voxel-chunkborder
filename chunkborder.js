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

BorderPlugin.prototype.createBorderMesh = function(mesh, gl, vert_data, voxels) {
  var shape = voxels.shape

  console.log('border',voxels.shape.join(','));
};
