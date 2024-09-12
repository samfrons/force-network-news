import React, { useState, useEffect } from 'react';

const COLORS = {
  Technology: 0x4e79a7,
  Business: 0xf28e2c,
  Science: 0xe15759,
  Health: 0x76b7b2,
};

const Filters = ({ posts, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryVisibility, setCategoryVisibility] = useState({
    Technology: true,
    Business: true,
    Science: true,
    Health: true
  });
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    const filteredPosts = posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryVisibility[post.category];
      const matchesTime = filterPostsByTime(post, timeFilter);
      return matchesSearch && matchesCategory && matchesTime;
    });
    onFilterChange(filteredPosts);
  }, [posts, searchTerm, categoryVisibility, timeFilter, onFilterChange]);

  const filterPostsByTime = (post, filter) => {
    const now = new Date();
    const postDate = new Date(post.pubDate);
    switch(filter) {
      case 'hour': return (now - postDate) < 3600000;
      case 'day': return (now - postDate) < 86400000;
      case 'week': return (now - postDate) < 604800000;
      default: return true;
    }
  };

  return (
    <div className="filters">
      <div className="search">
        <input 
          type="text" 
          placeholder="Search posts..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="category-filters">
        {Object.keys(categoryVisibility).map(function(category) {
          return (
            <button 
              className="default" 
              key={category} 
              onClick={() => setCategoryVisibility(prev => ({ ...prev, [category]: !prev[category] }))}
              style={{
                margin: '0 5px',
                padding: '5px 10px',
                backgroundColor: categoryVisibility[category] ? COLORS[category] : '#000',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {categoryVisibility[category] ? 'Hide' : 'Show'} {category}
            </button>
          );
        })}
      </div>

      <div className="time-filters">
        <button onClick={() => setTimeFilter('all')}>All Time</button>
        <button onClick={() => setTimeFilter('week')}>Last Week</button>
        <button onClick={() => setTimeFilter('day')}>Last Day</button>
        <button onClick={() => setTimeFilter('hour')}>Last Hour</button>
      </div>
    </div>
  );
};

export default Filters;