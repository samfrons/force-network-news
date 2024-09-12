
import React, { useState, useEffect } from 'react';
import { debug } from './utils';

export const fetchRSSFeed = async (feed) => {
  debug("Fetching RSS feed: " + feed.url);
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
    const data = await response.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) {
      console.error('Invalid RSS feed data:', data);
      return [];
    }
    return data.items.map(item => ({
      id: item.guid || item.link,
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      category: feed.category,
      engagement: Math.floor(Math.random() * 100)
    }));
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
};

export const fetchAllFeeds = async (rssFeeds) => {
  debug("Fetching all feeds");
  try {
    const allPosts = await Promise.all(rssFeeds.map(fetchRSSFeed));
    return allPosts.flat();
  } catch (error) {
    console.error('Error fetching all feeds:', error);
    return [];
  }
};


