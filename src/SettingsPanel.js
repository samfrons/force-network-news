import React, { useState } from 'react';

const SettingsPanel = ({ isOpen, onClose, autoRotate, setAutoRotate, rssFeeds, setRssFeeds, onFeedsUpdate }) => {
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newFeedCategory, setNewFeedCategory] = useState('');

  if (!isOpen) return null;

  const addNewFeed = () => {
    if (newFeedUrl && newFeedCategory) {
      setRssFeeds([...rssFeeds, { url: newFeedUrl, category: newFeedCategory }]);
      setNewFeedUrl('');
      setNewFeedCategory('');
      onFeedsUpdate();
    }
  };

  const removeFeed = (index) => {
    const updatedFeeds = rssFeeds.filter((_, i) => i !== index);
    setRssFeeds(updatedFeeds);
    onFeedsUpdate();
  };

  return (
   <div className="sidebar">
  <h2>Settings</h2>
  <button className="close-button" onClick={onClose}>Close</button>
  
  <div>
    <label>
      <input
        type="checkbox"
        checked={autoRotate}
        onChange={(e) => setAutoRotate(e.target.checked)}
      />
      Auto Rotate
    </label>
  </div>

  <h3>RSS Feeds</h3>
  {rssFeeds.map((feed, index) => (
    <div key={index}>
      <div className="feed-item">
        {feed.url} ({feed.category})
        <div className="feed-actions">
          <button onClick={() => removeFeed(index)}>Remove</button>
        </div>
      </div>
    </div>
  ))}

  <h4>Add New Feed</h4>
  <input
    type="text"
    value={newFeedUrl}
    onChange={(e) => setNewFeedUrl(e.target.value)}
    placeholder="Enter RSS feed URL"
  />
  <input
    type="text"
    value={newFeedCategory}
    onChange={(e) => setNewFeedCategory(e.target.value)}
    placeholder="Enter category"
  />
  <button onClick={addNewFeed}>Add Feed</button>
</div>
  );
};

export default SettingsPanel;