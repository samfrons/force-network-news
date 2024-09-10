import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const COLORS = {
  Technology: 0x4e79a7,
  Business: 0xf28e2c,
  Science: 0xe15759,
  Health: 0x76b7b2,
  World: 0x59a14f,
};

const RSS_FEEDS = [
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'Technology' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'Business' },
  { url: 'https://www.sciencedaily.com/rss/top.xml', category: 'Science' },
  { url: 'https://www.who.int/rss-feeds/news-english.xml', category: 'Health' },
  { url: 'https://www.un.org/en/feed/rss', category: 'World' },
];

const SocialMediaVisualization = () => {
  const mountRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const fetchRSSFeed = async (feed) => {
      try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
        const data = await response.json();
        return data.items.map(item => ({
          id: item.guid,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          category: feed.category,
          engagement: Math.floor(Math.random() * 100) // Simulated engagement
        }));
      } catch (error) {
        console.error('Error fetching RSS feed:', error);
        return [];
      }
    };

    const fetchAllFeeds = async () => {
      const allPosts = await Promise.all(RSS_FEEDS.map(feed => fetchRSSFeed(feed)));
      setPosts(allPosts.flat());
    };

    fetchAllFeeds();
    const interval = setInterval(fetchAllFeeds, 60000); // Fetch every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mountRef.current || posts.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    const spheres = posts.map(post => {
      const geometry = new THREE.SphereGeometry(post.engagement / 20 + 1, 32, 32);
      const material = new THREE.MeshPhongMaterial({ 
        color: COLORS[post.category],
        transparent: true,
        opacity: 0.7
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
      );
      sphere.userData = post;
      return sphere;
    });

    spheres.forEach(sphere => scene.add(sphere));

    // Add connections between nodes
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.3 });
    posts.forEach((post, index) => {
      const relatedPosts = posts.filter((p, i) => 
        i !== index && 
        (p.category === post.category || 
         new Date(p.pubDate).toDateString() === new Date(post.pubDate).toDateString())
      );

      relatedPosts.forEach(relatedPost => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          spheres[index].position,
          spheres[posts.indexOf(relatedPost)].position
        ]);
        const line = new THREE.Line(geometry, lineMaterial);
        scene.add(line);
      });
    });

    camera.position.z = 200;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spheres);

      if (intersects.length > 0) {
        const post = intersects[0].object.userData;
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
      } else {
        setTooltip(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Simple pulsating animation
      spheres.forEach(sphere => {
        sphere.scale.x = sphere.scale.y = sphere.scale.z = 
          1 + 0.1 * Math.sin(Date.now() * 0.001 + sphere.position.x);
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
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