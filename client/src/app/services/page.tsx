import { Suspense } from 'react';
import ServicesPageContent from './ServicesPageContent';

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="spinner" />
      </div>
    }>
      <ServicesPageContent />
    </Suspense>
  );
}
