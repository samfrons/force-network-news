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
          platform: feed.platform,
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
    const interval = setInterval(fetchAllFeeds, 30000); // Fetch every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    // Create spheres for posts
    const spheres = posts.map(post => {
      const geometry = new THREE.SphereGeometry(post.engagement / 20, 32, 32);
      const material = new THREE.MeshPhongMaterial({ color: COLORS[post.platform] });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      );
      sphere.userData = post;
      return sphere;
    });

    spheres.forEach(sphere => scene.add(sphere));

    camera.position.z = 100;

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Mouse move event handler
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
            Platform: ${post.platform}<br>
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
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