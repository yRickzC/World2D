import React from 'react';
import { ModDevPage } from '../modDev/ModDevPage';

export interface DevelopmentPageProps {
  onExitToMainMenu: () => void;
}

export const DevelopmentPage: React.FC<DevelopmentPageProps> = ({ onExitToMainMenu }) => {
  return <ModDevPage onBackToMainMenu={onExitToMainMenu} />;
};
