import React, { useState } from 'react';
import NewsList from './components/NewsList';
import Categories from './components/Categories';
import { useCallback } from 'react';

const News = () => {
  const [category, setCategory] = useState('all');
  const onSelect = useCallback(category => setCategory(category), []);

  return (
    <>
      <Categories category={category} onSelect={onSelect} />
      <NewsList category={category} />  
    </>
  )
};
export default News;