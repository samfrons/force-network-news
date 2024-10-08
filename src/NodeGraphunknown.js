import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Tween, update as updateTween } from '@tweenjs/tween.js';

const COLORS = {
  Technology: 0x4e79a7,
  Business: 0xf28e2c,
  Science: 0xe15759,
  Health: 0x76b7b2,
};

const RSS_FEEDS = [
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'Technology' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'Business' },
  { url: 'https://www.sciencedaily.com/rss/top.xml', category: 'Science' },
  { url: 'https://www.who.int/rss-feeds/news-english.xml', category: 'Health' },
];

const SocialMediaVisualization = () => {
  const mountRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryVisibility, setCategoryVisibility] = useState({
    Technology: true,
    Business: true,
    Science: true,
    Health: true
  });
  const spheresRef = useRef([]);
  const sceneRef = useRef(null);

  function debug(message) {
    console.log("Debug:", message);
  }

  useEffect(() => {
    debug("Component mounted");
    function fetchRSSFeed(feed) {
      debug("Fetching RSS feed: " + feed.url);
      return fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`)
        .then(response => response.json())
        .then(data => {
          if (data.status !== 'ok' || !Array.isArray(data.items)) {
            console.error('Invalid RSS feed data:', data);
            return [];
          }
          return data.items.map(function(item) {
            return {
              id: item.guid || item.link,
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              category: feed.category,
              engagement: Math.floor(Math.random() * 100)
            };
          });
        })
        .catch(function(error) {
          console.error('Error fetching RSS feed:', error);
          return [];
        });
    }

    function fetchAllFeeds() {
      debug("Fetching all feeds");
      Promise.all(RSS_FEEDS.map(fetchRSSFeed))
        .then(function(allPosts) {
          var newPosts = allPosts.flat();
          debug("Total posts fetched: " + newPosts.length);
          setPosts(function(prevPosts) {
            updateVisualization(prevPosts, newPosts);
            return newPosts;
          });
        });
    }

    fetchAllFeeds();
    var interval = setInterval(fetchAllFeeds, 60000);

    return function() {
      debug("Component unmounting");
      clearInterval(interval);
    };
  }, []);

  function filterPostsByTime(posts, filter) {
    debug("Filtering posts by time: " + filter);
    var now = new Date();
    return posts.filter(function(post) {
      var postDate = new Date(post.pubDate);
      switch(filter) {
        case 'hour': return (now - postDate) < 3600000;
        case 'day': return (now - postDate) < 86400000;
        case 'week': return (now - postDate) < 604800000;
        default: return true;
      }
    });
  }

  function createParticleEffect(position) {
    debug("Creating particle effect at position: " + JSON.stringify(position));
    var particleGeometry = new THREE.BufferGeometry();
    var particleCount = 100;
    var posArray = new Float32Array(particleCount * 3);
    
    for (var i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    var particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1
    });
    
    var particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.position.copy(position);
    sceneRef.current.add(particleSystem);
    
    setTimeout(function() {
      sceneRef.current.remove(particleSystem);
    }, 2000);
  }

  function updateVisualization(oldPosts, newPosts) {
    debug("Updating visualization");
    if (!sceneRef.current) return;

    var filteredPosts = filterPostsByTime(newPosts, timeFilter)
      .filter(function(post) {
        return categoryVisibility[post.category] && 
               post.title.toLowerCase().includes(searchTerm.toLowerCase());
      });

    debug("Filtered posts: " + filteredPosts.length);

    spheresRef.current.forEach(function(sphere) {
      sceneRef.current.remove(sphere);
    });

    var categoryPosition = {
      Technology: { x: -50, y: 50, z: 0 },
      Business: { x: 50, y: 50, z: 0 },
      Science: { x: -50, y: -50, z: 0 },
      Health: { x: 50, y: -50, z: 0 }
    };

    spheresRef.current = filteredPosts.map(function(post) {
      var radius = (post.engagement / 100) * 3 + 1;
      var geometry = new THREE.SphereGeometry(radius, 32, 32);
      var material = new THREE.MeshPhongMaterial({ 
        color: COLORS[post.category],
        transparent: true,
        opacity: 0.7
      });
      var sphere = new THREE.Mesh(geometry, material);
      
      var basePosition = categoryPosition[post.category];
      var newPosition = {
        x: basePosition.x + (Math.random() * 40 - 20),
        y: basePosition.y + (Math.random() * 40 - 20),
        z: basePosition.z + (Math.random() * 40 - 20)
      };

      if (oldPosts.find(oldPost => oldPost.id === post.id)) {
        new Tween(sphere.position)
          .to(newPosition, 1000)
          .easing(Tween.Easing.Quadratic.Out)
          .start();
      } else {
        sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
        createParticleEffect(sphere.position);
      }

      sphere.userData = post;
      sceneRef.current.add(sphere);
      return sphere;
    });

    updateConnections();
  }
   function updateConnections() {
    debug("Updating connections");
    if (!sceneRef.current) return;

    sceneRef.current.children = sceneRef.current.children.filter(function(child) {
      return child.type !== 'Line';
    });

    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.3 });
    spheresRef.current.forEach(function(sphere, index) {
      var post = sphere.userData;
      var relatedSpheres = spheresRef.current.filter(function(s, i) {
        return i !== index && 
          (s.userData.category === post.category || 
           new Date(s.userData.pubDate).toDateString() === new Date(post.pubDate).toDateString());
      });

      relatedSpheres.forEach(function(relatedSphere) {
        var geometry = new THREE.BufferGeometry().setFromPoints([
          sphere.position,
          relatedSphere.position
        ]);
        var line = new THREE.Line(geometry, lineMaterial);
        sceneRef.current.add(line);
      });
    });
  }

  useEffect(() => {
    if (!mountRef.current || posts.length === 0) return;
    debug("Setting up Three.js scene");

    var scene = new THREE.Scene();
    sceneRef.current = scene;
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    updateVisualization([], posts);

    camera.position.z = 200;

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(spheresRef.current);

      if (intersects.length > 0) {
        var post = intersects[0].object.userData;
        setTooltip({
          content: `
            <strong>${post.title}</strong><br>
            Category: ${post.category}<br>
            Published: ${new Date(post.pubDate).toLocaleString()}<br>
            Engagement: ${post.engagement}
          `,
          x: event.clientX,
          y: event.clientY
        });
        document.body.style.cursor = 'pointer';

        // Highlight related posts
        spheresRef.current.forEach(function(sphere) {
          if (sphere.userData.category === post.category || 
              new Date(sphere.userData.pubDate).toDateString() === new Date(post.pubDate).toDateString()) {
            sphere.material.emissive.setHex(0x00ff00);
          } else {
            sphere.material.emissive.setHex(0x000000);
          }
        });
      } else {
        setTooltip(null);
        document.body.style.cursor = 'default';
        // Reset highlights
        spheresRef.current.forEach(function(sphere) {
          sphere.material.emissive.setHex(0x000000);
        });
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    function updateBackgroundColor() {
      var now = new Date();
      var hours = now.getHours();
      var nightColor = new THREE.Color(0x001a33);
      var dayColor = new THREE.Color(0x87ceeb);
      var t = Math.sin((hours / 24) * Math.PI);
      var color = new THREE.Color().lerpColors(nightColor, dayColor, t);
      scene.background = color;
    }

    function animate() {
      requestAnimationFrame(animate);
      
      spheresRef.current.forEach(function(sphere) {
        sphere.scale.x = sphere.scale.y = sphere.scale.z = 
          1 + 0.1 * Math.sin(Date.now() * 0.001 + sphere.position.x);
      });

      updateTween();
      updateBackgroundColor();
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    return function() {
      debug("Cleaning up Three.js scene");
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [posts]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Legend */}
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 5 }}>
        {Object.entries(COLORS).map(([category, color]) => (
          <div key={category} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
            <div style={{ width: 20, height: 20, background: '#' + color.toString(16).padStart(6, '0'), marginRight: 10 }}></div>
            <span style={{ color: 'white' }}>{category}</span>
          </div>
        ))}
      </div>

      {/* Time filter buttons */}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <button onClick={() => setTimeFilter('all')}>All Time</button>
        <button onClick={() => setTimeFilter('week')}>Last Week</button>
        <button onClick={() => setTimeFilter('day')}>Last Day</button>
        <button onClick={() => setTimeFilter('hour')}>Last Hour</button>
      </div>

      {/* Search input */}
      <div style={{ position: 'absolute', top: 50, right: 10 }}>
        <input 
          type="text" 
          placeholder="Search posts..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category visibility toggles */}
      <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
        {Object.keys(categoryVisibility).map(function(category) {
          return (
            <button 
              key={category} 
              onClick={() => setCategoryVisibility(prev => ({ ...prev, [category]: !prev[category] }))}
              style={{
                margin: '0 5px',
                padding: '5px 10px',
                backgroundColor: categoryVisibility[category] ? COLORS[category] : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {categoryVisibility[category] ? 'Hide' : 'Show'} {category}
            </button>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Debug info */}
      <div style={{ position: 'absolute', bottom: 10, right: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.7)', padding: '5px', borderRadius: '5px' }}>
        Posts: {posts.length} | Visible: {spheresRef.current.length}
      </div>
    </div>
  );
};

export default SocialMediaVisualization;