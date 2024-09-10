import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
  const spheresRef = useRef([]);
  const sceneRef = useRef(null);

  useEffect(() => {
    function fetchRSSFeed(feed) {
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
              engagement: Math.floor(Math.random() * 100) // Simulated engagement
            };
          });
        })
        .catch(function(error) {
          console.error('Error fetching RSS feed:', error);
          return [];
        });
    }

    function fetchAllFeeds() {
      Promise.all(RSS_FEEDS.map(fetchRSSFeed))
        .then(function(allPosts) {
          var newPosts = allPosts.flat();
          setPosts(function(prevPosts) {
            updateVisualization(prevPosts, newPosts);
            return newPosts;
          });
        });
    }

    fetchAllFeeds();
    var interval = setInterval(fetchAllFeeds, 60000); // Fetch every minute

    return function() {
      clearInterval(interval);
    };
  }, []);

  function updateVisualization(oldPosts, newPosts) {
    if (!sceneRef.current) return;

    // Remove old spheres
    spheresRef.current.forEach(function(sphere) {
      sceneRef.current.remove(sphere);
    });

    // Add new spheres
    spheresRef.current = newPosts.map(function(post) {
      var geometry = new THREE.SphereGeometry(post.engagement / 20 + 1, 32, 32);
      var material = new THREE.MeshPhongMaterial({ 
        color: COLORS[post.category],
        transparent: true,
        opacity: 0.7
      });
      var sphere = new THREE.Mesh(geometry, material);
      
      sphere.position.set(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
      );

      sphere.userData = post;
      sceneRef.current.add(sphere);
      return sphere;
    });

    // Update connections
    updateConnections();
  }

  function updateConnections() {
    if (!sceneRef.current) return;

    // Remove old connections
    sceneRef.current.children = sceneRef.current.children.filter(function(child) {
      return child.type !== 'Line';
    });

    // Add new connections
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
      } else {
        setTooltip(null);
        document.body.style.cursor = 'default';
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    function animate() {
      requestAnimationFrame(animate);
      
      // Simple pulsating animation
      spheresRef.current.forEach(function(sphere) {
        sphere.scale.x = sphere.scale.y = sphere.scale.z = 
          1 + 0.1 * Math.sin(Date.now() * 0.001 + sphere.position.x);
      });

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
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
};

export default SocialMediaVisualization;