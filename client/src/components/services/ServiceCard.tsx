'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, IndianRupee, Calendar } from 'lucide-react';
import { Service } from '@/types';
import styles from './ServiceCard.module.css';

interface Props {
  service: Service;
}

const CATEGORY_ICONS: Record<string, string> = {
  venue: '🏛️', hotel: '🏨', caterer: '🍽️',
  cameraman: '📷', dj: '🎧', decorator: '🌸', other: '✨',
};

export default function ServiceCard({ service }: Props) {
  const formattedPrice = new Intl.NumberFormat('en-IN').format(service.pricePerDay);
  const categoryIcon = CATEGORY_ICONS[service.category] || '✨';
  const mainImage = service.images?.[0];

  return (
    <Link href={`/services/${service._id}`} className={styles.card} id={`service-card-${service._id}`}>
      {/* Image */}
      <div className={styles.imageWrapper}>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={service.title}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderIcon}>{categoryIcon}</span>
          </div>
        )}
        <div className={styles.categoryBadge}>
          <span className={`badge badge-${service.category}`}>
            {categoryIcon} {service.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{service.title}</h3>

        <div className={styles.location}>
          <MapPin size={13} />
          <span>{service.location.city}, {service.location.state}</span>
        </div>

        <p className={styles.description}>
          {service.description.length > 100
            ? service.description.slice(0, 100) + '…'
            : service.description}
        </p>

        <div className={styles.footer}>
          <div className={styles.price}>
            <IndianRupee size={14} />
            <span className={styles.priceAmount}>{formattedPrice}</span>
            <span className={styles.priceUnit}>/day</span>
          </div>
          <div className={styles.rating}>
            <Star size={13} fill="currentColor" />
            <span>{service.rating > 0 ? service.rating.toFixed(1) : 'New'}</span>
          </div>
        </div>

        {service.availability?.some((a) => !a.isBooked) && (
          <div className={styles.available}>
            <Calendar size={12} />
            <span>Available for booking</span>
          </div>
        )}
      </div>
    </Link>
  );
}
