
import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

export const debug = (message) => {
  console.log("Debug:", message);
};

export const createParticleEffect = (position, scene) => {
  debug("Creating particle effect at position: " + JSON.stringify(position));
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 100;
  const posArray = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 10;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1
  });
  
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  particleSystem.position.copy(position);
  scene.add(particleSystem);
  
  setTimeout(() => {
    scene.remove(particleSystem);
  }, 2000);
};