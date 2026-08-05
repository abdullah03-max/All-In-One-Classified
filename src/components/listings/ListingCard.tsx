import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MapPin, Clock, Eye, Star, Shield } from 'lucide-react';
import { Listing } from '../../types';
import { formatPrice, formatDate, cn } from '../../utils/helpers';
import { Badge, Avatar } from '../ui';
import { bookmarksService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ListingCardProps {
  listing: Listing;
  variant?: 'grid' | 'list';
  onBookmarkChange?: (id: string, bookmarked: boolean) => void;
  isBookmarked?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  variant = 'grid',
  onBookmarkChange,
  isBookmarked: initialBookmarked = false,
}) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login to save listings'); return; }
    
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await bookmarksService.removeBookmark(user.id, listing.id);
        setBookmarked(false);
        onBookmarkChange?.(listing.id, false);
        toast.success('Removed from saved');
      } else {
        await bookmarksService.addBookmark(user.id, listing.id);
        setBookmarked(true);
        onBookmarkChange?.(listing.id, true);
        toast.success('Saved to bookmarks');
      }
    } catch {
      toast.error('Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const primaryImage = listing.images?.[0];
  const isRentListing = Boolean(
    listing.category_id === 'c1000000-0000-0000-0000-000000000015' ||
    listing.category_id === 'a8dfa959-a83b-438c-8ffb-3faaa43b1626' ||
    listing.id === '24a25b38-e76d-4a3f-bc4a-10be14a363b6' ||
    listing.id === '8932b9d1-4729-42e8-aa4d-713d91657b91' ||
    listing.category?.slug === 'property-for-rent' ||
    listing.category?.slug === 'rent' ||
    (listing.category?.name && /property for rent|rent/i.test(listing.category.name)) ||
    (listing.subcategory_id && (listing.subcategory_id.startsWith('d1000000-0000-0000-0000-0000000001') || listing.subcategory_id.startsWith('pr-')))
  );

  const isServiceListing = Boolean(
    listing.category_id === 'c1000000-0000-0000-0000-000000000007' ||
    listing.category?.slug === 'services' ||
    (listing.category?.name && /services/i.test(listing.category.name)) ||
    (listing.subcategory_id && (listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000d') || listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000e'))) ||
    (listing.category_id && (listing.category_id.startsWith('d1000000-0000-0000-0000-000000000d') || listing.category_id.startsWith('d1000000-0000-0000-0000-000000000e')))
  );

  const isJobListing = Boolean(
    listing.category_id === 'c1000000-0000-0000-0000-000000000004' ||
    listing.category?.slug === 'jobs' ||
    (listing.category?.name && /jobs/i.test(listing.category.name)) ||
    (listing.subcategory_id && (
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000004') ||
      listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000119') ||
      listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000120') ||
      listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000121') ||
      listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000122') ||
      listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000123')
    )) ||
    (listing.category_id && (
      listing.category_id.startsWith('d1000000-0000-0000-0000-000000004') ||
      listing.category_id.startsWith('c1000000-0000-0000-0000-000000000119') ||
      listing.category_id.startsWith('c1000000-0000-0000-0000-000000000120') ||
      listing.category_id.startsWith('c1000000-0000-0000-0000-000000000121') ||
      listing.category_id.startsWith('c1000000-0000-0000-0000-000000000122') ||
      listing.category_id.startsWith('c1000000-0000-0000-0000-000000000123')
    ))
  );

  const propCatIds = [
    'c1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000015',
    'a8dfa959-a83b-438c-8ffb-3faaa43b1626',
    'd1000000-0000-0000-0000-000000000101',
    'd1000000-0000-0000-0000-000000000102',
    'd1000000-0000-0000-0000-000000000103',
    'd1000000-0000-0000-0000-000000000104',
    'd1000000-0000-0000-0000-000000000105',
    'd1000000-0000-0000-0000-000000000106',
    'd1000000-0000-0000-0000-000000000107',
    'd1000000-0000-0000-0000-000000000108'
  ];
  const propSlugs = ['property-for-sale', 'property', 'property-for-rent', 'houses', 'apartments-flats', 'land-plots', 'shops-offices-commercial-space', 'portions-floors'];

  const isPropertyListing = Boolean(
    propCatIds.includes(listing.category_id) ||
    (listing.subcategory_id && propCatIds.includes(listing.subcategory_id)) ||
    (listing.category?.slug && propSlugs.includes(listing.category.slug)) ||
    (listing.category?.name && /property|house|apartment|plot|land|portion|rent|commercial/i.test(listing.category.name)) ||
    listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000002' ||
    listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000015' ||
    listing.attributes?.virtual_category_id === 'a8dfa959-a83b-438c-8ffb-3faaa43b1626'
  );

  const isAnimalsListing = Boolean(
    listing.category_id === 'c1000000-0000-0000-0000-000000000009' ||
    listing.category?.slug === 'animals' ||
    listing.category?.slug === 'pets' ||
    (listing.category?.name && /animals|pets/i.test(listing.category.name)) ||
    listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000009' ||
    (listing.subcategory_id && (listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000b') || listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000c'))) ||
    (listing.category_id && (listing.category_id.startsWith('d1000000-0000-0000-0000-000000000b') || listing.category_id.startsWith('d1000000-0000-0000-0000-000000000c')))
  );

  const isAgriLandOrProduceListing = Boolean(
    listing.subcategory_id === 'd1000000-0000-0000-0000-00000000a010' ||
    listing.subcategory_id === 'd1000000-0000-0000-0000-00000000a011' ||
    listing.attributes?.virtual_subcategory_id === 'd1000000-0000-0000-0000-00000000a010' ||
    listing.attributes?.virtual_subcategory_id === 'd1000000-0000-0000-0000-00000000a011' ||
    (listing.subcategory_id && (
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-00000000aa') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-00000000ab')
    )) ||
    (listing.attributes?.virtual_subcategory_id && (
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-00000000aa') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-00000000ab')
    ))
  );

  const isElectronicsListing = Boolean(
    listing.category_id === 'c1000000-0000-0000-0000-000000000016' ||
    listing.category?.slug === 'electronics-home-appliances' ||
    listing.category?.name === 'Electronics & Home Appliances' ||
    listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000016' ||
    (listing.subcategory_id && (
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-0000000002') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-00000000030') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-0000000005') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-0000000006') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-0000000007') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-0000000008') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-0000000009') ||
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000a')
    )) ||
    (listing.attributes?.virtual_subcategory_id && (
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-0000000002') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-00000000030') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-0000000005') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-0000000006') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-0000000007') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-0000000008') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-0000000009') ||
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-000000000a')
    ))
  );

  const isFurniture = !isElectronicsListing && (
    listing.category_id === 'c1000000-0000-0000-0000-000000000006' ||
    listing.category?.slug === 'furniture-home-decor' ||
    listing.category?.name === 'Furniture & Home Decor' ||
    listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000006' ||
    (listing.subcategory_id && (
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-00000000031') || 
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-00000000032') || 
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000001') || 
      listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000002')
    )) ||
    (listing.attributes?.virtual_subcategory_id && (
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-00000000031') || 
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-00000000032') || 
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-000000001') || 
      listing.attributes.virtual_subcategory_id.startsWith('d1000000-0000-0000-0000-000000002')
    ))
  );

  const conditionBadge: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'default' }> = isFurniture ? {
    new: { label: 'New', variant: 'success' },
    like_new: { label: 'Like New', variant: 'info' },
    good: { label: 'Gently Used', variant: 'info' },
    fair: { label: 'Used', variant: 'default' },
    poor: { label: 'Needs Repair', variant: 'warning' },
  } : {
    new: { label: 'New', variant: 'success' },
    like_new: { label: 'Open Box', variant: 'info' },
    good: { label: 'Used', variant: 'default' },
    fair: { label: 'Refurbished', variant: 'warning' },
    poor: { label: 'For Parts / Not Working', variant: 'warning' },
  };
  const condInfo = conditionBadge[listing.condition] || { label: listing.condition, variant: 'default' };

  if (variant === 'list') {
    return (
      <motion.div
        whileHover={{ y: -1 }}
        className="card overflow-hidden hover:shadow-card-hover transition-shadow"
      >
        <Link to={`/listings/${listing.id}`} className="flex gap-4 p-3">
          <div className="relative w-32 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
            {primaryImage ? (
              <img src={primaryImage} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
            )}
            {listing.is_featured && (
              <div className="absolute top-1 left-1 bg-accent-500 text-white text-xs px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                <Star size={10} /> Featured
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2 mb-1">{listing.title}</h3>
                {!isServiceListing && !isJobListing && (
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {formatPrice(listing.price, listing.currency)}
                    {isRentListing && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400"> / month</span>}
                  </p>
                )}
              </div>
              <button onClick={handleBookmark} disabled={bookmarkLoading} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0">
                <Heart size={16} className={cn(bookmarked ? 'fill-red-500 text-red-500' : 'text-slate-400')} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><MapPin size={11} /> {listing.city}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(listing.created_at)}</span>
              <span className="flex items-center gap-1"><Eye size={11} /> {listing.views_count}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {!isJobListing && !isServiceListing && !isPropertyListing && !isAnimalsListing && !isAgriLandOrProduceListing && (
                <Badge variant={condInfo.variant}>{condInfo.label}</Badge>
              )}
              {isAnimalsListing && listing.attributes?.sex && (
                <Badge variant="info">{listing.attributes.sex}</Badge>
              )}
              {!isServiceListing && !isJobListing && !isPropertyListing && listing.is_negotiable && (
                <Badge variant="purple">Negotiable</Badge>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="card overflow-hidden hover:shadow-card-hover transition-shadow group"
    >
      <Link to={`/listings/${listing.id}`}>
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-700">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm">No image</div>
          )}
          {listing.is_featured && (
            <div className="absolute top-2 left-2 bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Star size={10} /> Featured
            </div>
          )}
          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-slate-800/90 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Heart size={15} className={cn(bookmarked ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-400')} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {listing.title}
          </h3>
          {!isServiceListing && !isJobListing && (
            <p className="text-base font-bold text-primary-600 dark:text-primary-400 mb-2">
              {formatPrice(listing.price, listing.currency)}
              {isRentListing && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400"> / month</span>}
              {listing.is_negotiable && <span className="ml-1 text-xs font-normal text-slate-500">(Nego)</span>}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><MapPin size={11} /> {listing.city}</span>
            <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(listing.created_at)}</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {!isJobListing && !isServiceListing && !isPropertyListing && !isAnimalsListing && !isAgriLandOrProduceListing && (
                <Badge variant={condInfo.variant}>{condInfo.label}</Badge>
              )}
              {isAnimalsListing && listing.attributes?.sex && (
                <Badge variant="info">{listing.attributes.sex}</Badge>
              )}
            </div>
            {listing.seller?.is_verified && (
              <span className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                <Shield size={11} className="fill-blue-500/10" /> Verified
              </span>
            )}
          </div>

          {listing.seller && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Avatar src={listing.seller.avatar_url} name={listing.seller.full_name} size="xs" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{listing.seller.full_name}</span>
              <span className="flex items-center gap-0.5 text-xs text-slate-400 ml-auto">
                <Eye size={11} /> {listing.views_count}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ListingCard;
