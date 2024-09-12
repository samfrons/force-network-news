
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import SettingsPanel from './SettingsPanel';


const COLORS = {
  Technology: 0x4e79a7,
  Business: 0xf28e2c,
  Science: 0xe15759,
  Health: 0x76b7b2,
};


const SocialMediaVisualization = () => {
  const mountRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRotate, setAutoRotate] = useState(true)
  const materialsRef = useRef({});
  const [categoryVisibility, setCategoryVisibility] = useState({
    Technology: true,
    Business: true,
    Science: true,
    Health: true
  });
  const spheresRef = useRef([]);
  const sceneRef = useRef(null);

const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
const [rssFeeds, setRssFeeds] = useState([
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'Technology' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'Business' },
    { url: 'https://www.sciencedaily.com/rss/top.xml', category: 'Science' },
    { url: 'https://www.who.int/rss-feeds/news-english.xml', category: 'Health' },
  ]);
const controlsRef = useRef(null);
  const debug = useCallback((message) => {
    console.log("Debug:", message);
  }, []);

  const filterPostsByTime = useCallback((posts, filter) => {
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
  }, [debug]);

  const createParticleEffect = useCallback((position) => {
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
  }, [debug]);

  const updateConnections = useCallback(() => {
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
  }, [debug]);

  const updateVisualization = useCallback((oldPosts, newPosts) => {
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

 materialsRef.current = {};

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
        transparent: false,
        opacity: 0.7,
        emissive: COLORS[post.category],
        emissiveIntensity: 0.7
      });
       if (!materialsRef.current[post.category]) {
        materialsRef.current[post.category] = new THREE.MeshPhongMaterial({ 
          color: COLORS[post.category],
          transparent: true,
          opacity: 0.7,
          emissive: COLORS[post.category],
          emissiveIntensity: 0.3
        });
      }
      var sphere = new THREE.Mesh(geometry, materialsRef.current[post.category]);
      
      var basePosition = categoryPosition[post.category];
      var newPosition = {
        x: basePosition.x + (Math.random() * 40 - 20),
        y: basePosition.y + (Math.random() * 40 - 20),
        z: basePosition.z + (Math.random() * 40 - 20)
      };

      sphere.position.set(newPosition.x, newPosition.y, newPosition.z);
      
      if (!oldPosts.find(oldPost => oldPost.id === post.id)) {
        createParticleEffect(sphere.position);
      }

      sphere.userData = post;
      sceneRef.current.add(sphere);
      return sphere;
    });

    updateConnections();
  }, [debug, filterPostsByTime, timeFilter, categoryVisibility, searchTerm, createParticleEffect, updateConnections]);



  const fetchRSSFeed = useCallback((feed) => {
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
  }, [debug]);

  const fetchAllFeeds = useCallback(() => {
    debug("Fetching all feeds");
    Promise.all(rssFeeds.map(fetchRSSFeed))
      .then(function(allPosts) {
        var newPosts = allPosts.flat();
        debug("Total posts fetched: " + newPosts.length);
        setPosts(function(prevPosts) {
          updateVisualization(prevPosts, newPosts);
          return newPosts;
        });
      });
  }, [rssFeeds, fetchRSSFeed, debug, updateVisualization]);

  useEffect(() => {
    fetchAllFeeds();
    var interval = setInterval(fetchAllFeeds, 60000);
    return function() {
      debug("Component unmounting");
      clearInterval(interval);
    };
  }, [fetchAllFeeds, debug, updateVisualization]);

  useEffect(() => {
    if (!mountRef.current || posts.length === 0) return;
    debug("Setting up Three.js scene");

    const mount = mountRef.current;
    var scene = new THREE.Scene();
    sceneRef.current = scene;
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    var controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    controls.addEventListener('start', () => {
      setAutoRotate(false);
      controls.autoRotate = false;
    });

    controls.addEventListener('end', () => {
      setAutoRotate(true);
      controls.autoRotate = true;
    });


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




          Object.values(materialsRef.current).forEach(material => {
          material.emissiveIntensity = 0.3; // Reset all to default

        });

        spheresRef.current.forEach(function(sphere) {
          if (sphere === intersects[0].object) {
            sphere.material.emissiveIntensity = 1; // Bright highlight for selected post
            // lime sphere.material.emissive.setHex(0x00ff00);
        
          } else if (sphere.userData.category === post.category || 
              new Date(sphere.userData.pubDate).toDateString() === new Date(post.pubDate).toDateString()) {
            sphere.material.emissiveIntensity = 0.7; // Less bright highlight for related posts
          }
        });
      } else {
        setTooltip(null);
        document.body.style.cursor = 'default';
        // Reset highlights
        Object.values(materialsRef.current).forEach(material => {
          material.emissiveIntensity = 0.3; // Reset all to default
        });
      }
    }



        

    window.addEventListener('mousemove', onMouseMove);

    function updateBackgroundColor() {
      var now = new Date();
      var hours = now.getHours();
      var nightColor = new THREE.Color(0x001a33);
      var dayColor = new THREE.Color(0x001a33);
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

      controls.update(); // This will handle the auto-rotation

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
     
      if (mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [posts, debug, updateVisualization]);

  // Add this effect to trigger updates when filters change
  useEffect(() => {
    if (posts.length > 0) {
      updateVisualization(posts, posts);
    }
  }, [timeFilter, searchTerm, categoryVisibility, updateVisualization, posts]);

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
                color: 'navy',
                border: 'none',
                borderRadius: '0px',
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

 <button
        style={{
          position: 'absolute',
          top: '90px',
          right: '10px',
          padding: '5px 10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        onClick={() => setSettingsPanelOpen(true)}
      >
        Open Settings
      </button>

       <SettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        rssFeeds={rssFeeds}
        setRssFeeds={setRssFeeds}
        onFeedsUpdate={fetchAllFeeds}
      />


    </div>
  );
};

export default SocialMediaVisualization;