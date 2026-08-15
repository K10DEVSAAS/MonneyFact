import React from 'react';
import { BrandSplashLoader } from '@/components/ui/BrandSplashLoader';

export default function DashboardLoading() {
  return (
    <BrandSplashLoader
      message="Chargement du tableau de bord..."
      submessage="Calcul des statistiques et encaissements FCFA..."
      fullScreen={false}
    />
  );
}
