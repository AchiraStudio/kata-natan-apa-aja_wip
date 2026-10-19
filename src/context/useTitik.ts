import { useContext } from 'react';
import { TitikContext } from './TitikContext';

export const useTitik = () => {
  const context = useContext(TitikContext);
  if (!context) {
    throw new Error('useTitik must be used within a TitikProvider');
  }
  return context;
};

