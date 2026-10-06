'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, MapPin, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Service } from '@/types';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminServicesPage() {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && isAuthenticated && !isAdmin) router.push('/dashboard');
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/services?limit=50');
      setServices(data.data);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchServices();
  }, [isAdmin]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}"? This will hide it from users.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service removed');
      setServices((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading || !isAdmin) return <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">Manage Services</h1>
          <Link href="/admin/services/new" className="btn btn-primary" id="new-service-btn">
            <Plus size={16} /> Add Service
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏛️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No services yet</h3>
            <Link href="/admin/services/new" className="btn btn-primary" style={{ marginTop: 20 }}>
              Add your first service
            </Link>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Service</span>
              <span>Category</span>
              <span>Location</span>
              <span>Price/Day</span>
              <span>Actions</span>
            </div>
            {services.map((svc) => (
              <div key={svc._id} className={styles.tableRow} id={`admin-service-${svc._id}`}>
                <div className={styles.serviceInfo}>
                  <span className={styles.serviceTitle}>{svc.title}</span>
                  <span className={styles.serviceDesc}>{svc.description.slice(0, 60)}…</span>
                </div>
                <div>
                  <span className={`badge badge-${svc.category}`}>{svc.category}</span>
                </div>
                <div className={styles.location}>
                  <MapPin size={12} /> {svc.location.city}
                </div>
                <div className={styles.price}>
                  <IndianRupee size={13} />{new Intl.NumberFormat('en-IN').format(svc.pricePerDay)}
                </div>
                <div className={styles.actions}>
                  <Link href={`/admin/services/${svc._id}/edit`} className="btn btn-secondary btn-sm" id={`edit-service-${svc._id}`}>
                    <Edit2 size={13} /> Edit
                  </Link>
                  <button
                    id={`delete-service-${svc._id}`}
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(svc._id, svc.title)}
                    disabled={deleting === svc._id}
                  >
                    <Trash2 size={13} /> {deleting === svc._id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
