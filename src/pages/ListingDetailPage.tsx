import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Eye, Share2, Flag, MessageCircle,
  Phone, Shield, Heart, ChevronRight, Tag, DollarSign, CheckCircle, Sparkles
} from 'lucide-react';
import { PromoteListingModal } from '../components/listings/PromoteListingModal';
import { listingsService } from '../services/listingsService';
import { chatService } from '../services/chatService';
import { bookmarksService, reportsService, offersService, categoriesService } from '../services';
import { Listing } from '../types';
import ImageGallery from '../components/listings/ImageGallery';
import ListingCard from '../components/listings/ListingCard';
import { Avatar, Badge, Button, Modal, Spinner, EmptyState, Textarea, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, formatDate } from '../utils/helpers';
import { CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';
import Icon from '../components/ui/Icon';

const ignoredKeys = new Set([
  'virtual_category_id',
  'virtual_subcategory_id',
  'virtual_sub_subcategory_id',
  'subcategory_name',
  'sub_subcategory_name',
  'contact_name',
  'show_phone'
]);

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Listing[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await listingsService.getListing(id);
        setListing(data);

        // Check bookmark
        if (user) {
          const isBookmarked = await bookmarksService.isBookmarked(user.id, id);
          setBookmarked(isBookmarked);
        }

        // Get related listings with hierarchy fallback
        const allCats = await categoriesService.getCategories();
        const currentCat = allCats.find(c => c.id === data.category_id);
        
        let queryCategoryId = data.category_id;
        if (currentCat?.parent_id) {
          queryCategoryId = currentCat.parent_id;
        }

        const relatedRes = await listingsService.getListings({ category_id: queryCategoryId }, 1, 10);
        const filteredRelated = relatedRes.data.filter(l => l.id !== id);
        
        if (filteredRelated.length === 0 && currentCat?.parent_id) {
          const parentCat = allCats.find(c => c.id === currentCat.parent_id);
          if (parentCat?.parent_id) {
            const grandParentRes = await listingsService.getListings({ category_id: parentCat.parent_id }, 1, 10);
            setRelated(grandParentRes.data.filter(l => l.id !== id));
          } else {
            setRelated([]);
          }
        } else {
          setRelated(filteredRelated);
        }
      } catch {
        toast.error('Listing not found');
        navigate('/listings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleContact = async () => {
    if (!user) { toast.error('Please login to contact seller'); navigate('/login'); return; }
    if (!listing) return;
    setContactLoading(true);
    try {
      const convId = await chatService.getOrCreateConversation(
        listing.id, user.id, listing.seller_id
      );
      navigate(`/chat?conv=${convId}`);
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setContactLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) { toast.error('Please login to save listings'); return; }
    if (!listing) return;
    try {
      if (bookmarked) {
        await bookmarksService.removeBookmark(user.id, listing.id);
        setBookmarked(false);
        toast.success('Removed from saved');
      } else {
        await bookmarksService.addBookmark(user.id, listing.id);
        setBookmarked(true);
        toast.success('Added to saved');
      }
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleReport = async () => {
    if (!user) { toast.error('Please login to report'); return; }
    if (!listing || !reportReason) { toast.error('Please select a reason'); return; }
    try {
      await reportsService.createReport({
        reporter_id: user.id,
        listing_id: listing.id,
        reason: reportReason,
        description: reportDesc,
        status: 'pending',
      });
      setReportOpen(false);
      setReportReason('');
      setReportDesc('');
      toast.success('Report submitted. We\'ll review it shortly.');
    } catch {
      toast.error('Failed to submit report');
    }
  };

  const handleOffer = async () => {
    if (!user) { toast.error('Please login to make an offer'); return; }
    if (!listing || !offerAmount) { toast.error('Please enter an offer amount'); return; }
    try {
      await offersService.createOffer({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: Number(offerAmount),
        message: offerMessage,
        status: 'pending',
      });
      setOfferOpen(false);
      setOfferAmount('');
      setOfferMessage('');
      toast.success('Offer sent successfully!');
    } catch {
      toast.error('Failed to send offer');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size={36} />
    </div>
  );

  if (!listing) return (
    <EmptyState title="Listing not found" description="This listing may have been removed or doesn't exist." />
  );

  const category = CATEGORIES.find(c => c.id === listing.category_id);
  const isSeller = user?.id === listing.seller_id;

  const isElectronics = listing.category_id === 'c1000000-0000-0000-0000-000000000016' ||
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
    ));

  const isFurniture = !isElectronics && (
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

  const conditionLabels: Record<string, string> = isFurniture ? {
    new: 'New', like_new: 'Like New', good: 'Gently Used', fair: 'Used', poor: 'Needs Repair'
  } : {
    new: 'New', like_new: 'Open Box', good: 'Used', fair: 'Refurbished', poor: 'For Parts / Not Working'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-500 mb-4">
        <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link to="/listings" className="hover:text-primary-600 transition-colors">Listings</Link>
        {category && (
          <>
            <ChevronRight size={14} />
            <Link to={`/category/${category.slug}`} className="hover:text-primary-600 transition-colors">{category.name}</Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-slate-700 dark:text-slate-300 truncate max-w-40">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-5">
          <ImageGallery images={listing.images} videoUrl={listing.video_url} title={listing.title} />

          {/* Title & Price */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {listing.is_featured && (
                  <div className="inline-flex items-center gap-1 text-xs bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 px-2 py-0.5 rounded-full mb-2">
                    ⭐ Featured Listing
                  </div>
                )}
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{listing.title}</h1>
                <div className="flex items-center gap-3">
                  {(() => {
                    const isServices = listing.category_id === 'c1000000-0000-0000-0000-000000000007' ||
                      listing.category?.slug === 'services' ||
                      (listing.category?.name && /services/i.test(listing.category.name)) ||
                      Boolean(listing.subcategory_id?.startsWith('d1000000-0000-0000-0000-000000000d')) ||
                      Boolean(listing.subcategory_id?.startsWith('d1000000-0000-0000-0000-000000000e')) ||
                      Boolean(listing.category_id?.startsWith('d1000000-0000-0000-0000-000000000d')) ||
                      Boolean(listing.category_id?.startsWith('d1000000-0000-0000-0000-000000000e'));

                    const isJob = listing.category_id === 'c1000000-0000-0000-0000-000000000004' ||
                      listing.category?.slug === 'jobs' ||
                      (listing.category?.name && /jobs/i.test(listing.category.name)) ||
                      Boolean(listing.subcategory_id?.startsWith('d1000000-0000-0000-0000-000000004')) ||
                      Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000119')) ||
                      Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000120')) ||
                      Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000121')) ||
                      Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000122')) ||
                      Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000123')) ||
                      Boolean(listing.category_id?.startsWith('d1000000-0000-0000-0000-000000004')) ||
                      Boolean(listing.category_id?.startsWith('c1000000-0000-0000-0000-000000000119')) ||
                      Boolean(listing.category_id?.startsWith('c1000000-0000-0000-0000-000000000120')) ||
                      Boolean(listing.category_id?.startsWith('c1000000-0000-0000-0000-000000000121')) ||
                      Boolean(listing.category_id?.startsWith('c1000000-0000-0000-0000-000000000122')) ||
                      Boolean(listing.category_id?.startsWith('c1000000-0000-0000-0000-000000000123'));

                    if (isServices || isJob) {
                      return null;
                    }

                    const isRentProp = listing.category_id === 'c1000000-0000-0000-0000-000000000015' ||
                      listing.category_id === 'a8dfa959-a83b-438c-8ffb-3faaa43b1626' ||
                      listing.category?.slug === 'property-for-rent' ||
                      listing.category?.slug === 'rent' ||
                      (listing.category?.name && /property for rent|rent/i.test(listing.category.name)) ||
                      Boolean(listing.subcategory_id?.startsWith('d1000000-0000-0000-0000-0000000001')) ||
                      Boolean(listing.subcategory_id?.startsWith('pr-'));

                    return (
                      <>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {formatPrice(listing.price, listing.currency)}
                          {isRentProp && <span className="text-base font-semibold text-slate-500 dark:text-slate-400"> / month</span>}
                        </span>
                        {listing.is_negotiable && (
                          <Badge variant="purple">Negotiable</Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleBookmark} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Heart size={20} className={bookmarked ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                </button>
                <button onClick={handleShare} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {listing.city}{listing.location && !listing.location.includes('Lat/Lng') && `, ${listing.location}`}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(listing.created_at)}</span>
              <span className="flex items-center gap-1.5"><Eye size={14} /> {listing.views_count} views</span>
              {category && (
                <Link to={`/category/${category.slug}`} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                  <Icon name={category.icon} size={14} style={{ color: category.color }} />
                  {category.name}
                </Link>
              )}
            </div>
          </div>

          {/* Details */}
          {(() => {
            const propCatIds = [
              'c1000000-0000-0000-0000-000000000002',
              'c1000000-0000-0000-0000-000000000015',
              '24e59436-fa5b-4fe6-898c-4ce34c4b901f',
              '9ef60e0a-9e89-4a78-86ef-5c9ea8b923dd',
              '4c4a2d5d-7303-4b97-8e1e-775337fe894e',
              '3f9d177a-5fc9-4a78-803e-111cbbd5831c',
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
            const isProp = propCatIds.includes(listing.category_id) ||
              (listing.subcategory_id && propCatIds.includes(listing.subcategory_id)) ||
              (listing.category?.slug && propSlugs.includes(listing.category.slug)) ||
              (category?.name && /property|house|apartment|plot|land|portion|rent|commercial/i.test(category.name)) ||
              listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000002' ||
              listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000015' ||
              listing.attributes?.virtual_category_id === 'a8dfa959-a83b-438c-8ffb-3faaa43b1626';

            const isAnimal = listing.category_id === 'c1000000-0000-0000-0000-000000000009' ||
              listing.category?.slug === 'animals' || listing.category?.slug === 'pets' ||
              listing.category?.name === 'Animals' || listing.category?.name === 'Pets' ||
              (category?.name && /animals|pets/i.test(category.name)) ||
              listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000009' ||
              (listing.subcategory_id && (listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000b') || listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000c')));

            const isService = listing.category_id === 'c1000000-0000-0000-0000-000000000007' ||
              listing.category?.slug === 'services' || listing.category?.name === 'Services' ||
              (category?.name && /services/i.test(category.name)) ||
              listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000007' ||
              (listing.subcategory_id && (listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000d') || listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000000e')));

            const isJob = listing.category_id === 'c1000000-0000-0000-0000-000000000004' ||
              listing.category?.slug === 'jobs' || listing.category?.name === 'Jobs' ||
              (category?.name && /jobs/i.test(category.name)) ||
              listing.attributes?.virtual_category_id === 'c1000000-0000-0000-0000-000000000004' ||
              (listing.subcategory_id && (
                listing.subcategory_id.startsWith('d1000000-0000-0000-0000-000000004') ||
                listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000119') ||
                listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000120') ||
                listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000121') ||
                listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000122') ||
                listing.subcategory_id.startsWith('c1000000-0000-0000-0000-000000000123')
              ));

            return (
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Tag size={16} /> Item Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {!isProp && !isAnimal && !isService && !isJob && (
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Condition</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{conditionLabels[listing.condition]}</p>
                    </div>
                  )}
                  {isAnimal && listing.attributes?.sex && (
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Sex</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{listing.attributes.sex}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Location</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{listing.city}, {listing.country}</p>
                  </div>
                  
                  {/* Dynamic category specifications */}
                  {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                    Object.entries(listing.attributes).map(([key, value]) => {
                      if (!value || ignoredKeys.has(key.toLowerCase())) return null;
                      const formattedKey = key
                        .replace(/_/g, ' ')
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <div key={key}>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{formattedKey}</span>
                          <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">{value}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* Description */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Description</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line text-sm">
              {listing.description}
            </p>
          </div>

          {/* Safety tips */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <Shield size={16} /> Safety Tips
            </h3>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
              <li>Meet in a public place with good lighting</li>
              <li>Inspect the item before making payment</li>
              <li>Never send money in advance for unverified items</li>
              <li>Be cautious of prices that seem too good to be true</li>
            </ul>
          </div>

          {/* Report */}
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors"
          >
            <Flag size={14} /> Report this listing
          </button>
        </div>

        {/* Right: Seller + Contact */}
        <div className="space-y-4">
          {/* Seller card */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Seller Information</h3>
            <div className="flex items-center gap-3 mb-4">
              <Avatar src={listing.seller?.avatar_url} name={listing.attributes?.contact_name || listing.seller?.full_name || ''} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{listing.attributes?.contact_name || listing.seller?.full_name}</p>
                  {listing.seller?.is_verified && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle size={15} className="text-blue-500 fill-blue-500/10" title="Verified Account" />
                      <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Verified Account</span>
                    </div>
                  )}
                </div>
                {listing.seller?.city && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {listing.seller.city}
                  </p>
                )}
              </div>
            </div>

            {isSeller ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPromoteOpen(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-sm"
                >
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                  <span>Promote / Feature Ad</span>
                </button>
                <Link
                  to={`/listings/${listing.id}/edit`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  Edit Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  icon={<MessageCircle size={17} />}
                  onClick={handleContact}
                  loading={contactLoading}
                >
                  Chat with Seller
                </Button>
                
                {/* Call Seller Button */}
                {isMobile ? (
                  listing.seller?.phone && listing.attributes?.show_phone !== 'false' ? (
                    <a
                      href={`tel:${listing.seller.phone}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-green-500 text-green-600 font-medium rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm"
                    >
                      <Phone size={17} /> Call Seller
                    </a>
                  ) : (
                    <button
                      onClick={handleContact}
                      className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      <Phone size={17} /> Ask for Phone Number
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-green-500 text-green-600 font-medium rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm"
                  >
                    <Phone size={17} /> {showPhoneNumber ? 'Hide Phone' : 'Call Seller'}
                  </button>
                )}
                
                {!isMobile && showPhoneNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 border rounded-xl text-center ${
                      listing.seller?.phone && listing.attributes?.show_phone !== 'false'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {listing.seller?.phone && listing.attributes?.show_phone !== 'false' ? (
                      <>
                        <p className="text-xs text-green-700 dark:text-green-400 mb-1">Seller's Phone Number</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 font-mono select-all cursor-pointer">{listing.seller.phone}</p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-2">You can now call or message this number</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mb-1">Phone Number Not Shared by Seller</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Chat with the seller to get their contact information</p>
                      </>
                    )}
                  </motion.div>
                )}
                
                {listing.is_negotiable && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    icon={<DollarSign size={17} />}
                    onClick={() => setOfferOpen(true)}
                  >
                    Make an Offer
                  </Button>
                )}
              </div>
            )}

            {isSeller && (
              <Link to={`/dashboard/listings/${listing.id}/edit`}>
                <Button variant="secondary" className="w-full">Edit This Listing</Button>
              </Link>
            )}
          </div>

          {/* Related Listings Sidebar (YouTube style) */}
          {related.length > 0 && (
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Icon name="Compass" size={16} className="text-primary-500" />
                Related Ads
              </h3>
              <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-1">
                {related.map(r => (
                  <Link
                    key={r.id}
                    to={`/listings/${r.id}`}
                    className="flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 group"
                  >
                    <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                      <img
                        src={r.images?.[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12'}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight group-hover:text-primary-500 transition-colors">
                          {r.title}
                        </h4>
                        <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-1">
                          {formatPrice(r.price, r.currency)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="truncate max-w-[80px]">{r.city}</span>
                        <span>{formatDate(r.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Listing" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Reason *</label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="input"
            >
              <option value="">Select a reason</option>
              {['Spam or misleading', 'Wrong category', 'Prohibited item', 'Scam or fraud', 'Duplicate listing', 'Inappropriate content', 'Other'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <Textarea
            label="Additional details (optional)"
            value={reportDesc}
            onChange={e => setReportDesc(e.target.value)}
            placeholder="Provide more details..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleReport}>Submit Report</Button>
          </div>
        </div>
      </Modal>

      {/* Offer Modal */}
      <Modal isOpen={offerOpen} onClose={() => setOfferOpen(false)} title="Make an Offer" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Listed price: <strong className="text-primary-600">{formatPrice(listing.price)}</strong></p>
          <Input
            label="Your offer (PKR) *"
            type="number"
            value={offerAmount}
            onChange={e => setOfferAmount(e.target.value)}
            placeholder="Enter your offer"
          />
          <Textarea
            label="Message (optional)"
            value={offerMessage}
            onChange={e => setOfferMessage(e.target.value)}
            placeholder="Explain your offer..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setOfferOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleOffer}>Send Offer</Button>
          </div>
        </div>
      </Modal>

      {/* Promote Listing Modal */}
      {listing && (
        <PromoteListingModal
          isOpen={promoteOpen}
          onClose={() => setPromoteOpen(false)}
          listing={listing}
          onSuccess={() => {
            if (id) listingsService.getListing(id).then(setListing);
          }}
        />
      )}
    </div>
  );
};

export default ListingDetailPage;
