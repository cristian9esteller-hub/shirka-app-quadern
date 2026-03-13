
import React from 'react';
import Icon from '../components/Icon';

const Missatgeria: React.FC = () => {
  return (
    <main className="p-4 md:p-8 lg:p-10 w-full flex flex-col items-center justify-center h-full text-center">
      <Icon name="forum" className="text-6xl text-primary mb-4" />
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Missatgeria</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Aquesta funcionalitat estarà disponible properament.
      </p>
    </main>
  );
};

export default Missatgeria;
