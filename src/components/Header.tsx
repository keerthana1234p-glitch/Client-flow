import React from 'react';
import { User } from '../types';

interface HeaderProps {
  currentUser?: User;
}

export const Header: React.FC<HeaderProps> = () => {
  return <div className="p-2 text-xs">Header Component</div>;
};
