'use client';

import { Fragment } from 'react';
import TodayTasks from '@/components/widgets/TodayTasks';
import ContentSummary from '@/components/widgets/ContentSummary';
import FinanceSummary from '@/components/widgets/FinanceSummary';

export default function MyHubOverviewPage() {
  return (
    <Fragment>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Hub, Nicola!</h1>
        <p className="text-lg text-gray-600 mt-1">This is your central space for managing Empower VA Services.</p>
      </header>
      
      <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-center">Business Health Dashboard</h2>
          <p className="text-center text-gray-500 mt-2 mb-6">A quick overview of your business activities.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TodayTasks />
            <ContentSummary />
            <FinanceSummary />
          </div>
      </div>
    </Fragment>
  );
}