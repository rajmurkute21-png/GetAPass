import React, { useState } from 'react';
import { Search, Plus, Calendar, RefreshCw, X, Clock, Sparkles, ArrowUpDown, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '../components/cards/EventCard';
import EventSkeleton from '../components/events/EventSkeleton';
import Button from '../components/common/Button';
import { CATEGORIES } from '../data/mockData';

export default function EventsView({
  events = [],
  selectedCategory = 'All',
  loading = false,
  syncError = null,
  onSelectCategory,
  onBookEvent,
  onViewEventDetails,
  onCreateEvent
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'price' | 'name'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'under500' | 'above500'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const SUGGESTIONS = [
    { label: 'Music Festival', icon: Clock, category: 'Festivals' },
    { label: 'Tech Summit', icon: Sparkles, category: 'Conferences' },
    { label: 'Art Exhibition', icon: Calendar, category: 'Exhibitions' }
  ];

  const filteredEvents = events
    .filter((ev) => {
      const category = ev.category || '';
      const title = ev.title || ev.name || '';
      const venue = ev.venue || '';
      const price = Number(ev.startingPrice || ev.price || 0);

      const matchesCategory =
        selectedCategory === 'All' || category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesPrice = true;
      if (priceFilter === 'under500') matchesPrice = price <= 500;
      if (priceFilter === 'above500') matchesPrice = price > 500;

      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        const pA = a.startingPrice || a.price || 0;
        const pB = b.startingPrice || b.price || 0;
        return pA - pB;
      }
      if (sortBy === 'name') {
        const nA = a.title || a.name || '';
        const nB = b.title || b.name || '';
        return nA.localeCompare(nB);
      }
      return 0; // Default order
    });

  return (
    <div className="gateapass-events-view" style={{ textAlign: 'left', padding: '40px 0 64px' }}>
      <div className="container-desktop">
        {/* Title Header */}
        <div style={{ marginBottom: '28px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-deep-violet)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            CATALOGUE
          </span>
          <h1 className="text-h1" style={{ color: 'var(--color-dark-text)', marginTop: '4px' }}>
            Discover Amazing Events
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--color-muted-text)', marginTop: '6px' }}>
            Book secure digital passes for conferences, hackathons, workshops, and campus festivals.
          </p>
        </div>

        {/* Floating Search & Filter Controls (Selective Liquid Glass) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          {/* Floating Glass Search & Sort Controls Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap'
            }}
          >
            {/* Search Input with Frosted Glass & Suggestions */}
            <div className="liquid-glass-search-wrap" style={{ position: 'relative' }}>
              <Search size={18} className="liquid-glass-search-icon" />
              <input
                type="text"
                className="liquid-glass-search-input"
                placeholder="Search events, venues, keywords..."
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 220)}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search events"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="liquid-glass-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}

              {/* Floating Suggestions Glass Card */}
              {searchFocused && (
                <div className="liquid-glass-suggestions">
                  <div style={{ padding: '6px 12px 4px', fontSize: '11px', fontWeight: 700, color: '#9333EA', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Quick Suggestions
                  </div>
                  {SUGGESTIONS.map((sug, i) => {
                    const SugIcon = sug.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery(sug.label);
                          if (onSelectCategory) {
                            onSelectCategory(sug.category);
                          }
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          border: 'none',
                          background: 'transparent',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#2D2342',
                          textAlign: 'left',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <SugIcon size={15} style={{ color: '#9333EA' }} />
                        <span>{sug.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sort & Filter Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Advanced Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '9999px',
                  background: showAdvancedFilters ? 'rgba(147, 51, 234, 0.12)' : 'rgba(255, 255, 255, 0.78)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: showAdvancedFilters ? '1px solid #9333EA' : '1px solid rgba(255, 255, 255, 0.92)',
                  color: showAdvancedFilters ? '#9333EA' : '#2D2342',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Filters {priceFilter !== 'all' && '• 1'}</span>
              </button>

              {/* Sort Control */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.78)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255, 255, 255, 0.92)',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06), 0 0 10px rgba(236, 72, 153, 0.04)'
                }}
              >
                <ArrowUpDown size={14} style={{ color: '#9333EA' }} />
                <label htmlFor="events-sort-select" style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Sort:</label>
                <select
                  id="events-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#2D2342',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="date">Upcoming Date</option>
                  <option value="price">Price: Low to High</option>
                  <option value="name">Title: A to Z</option>
                </select>
              </div>

              {/* View Switcher Capsule (Matching Selective Liquid Glass Design Reference) */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  height: '42px',
                  padding: '3px 4px',
                  borderRadius: '9999px',
                  background: 'rgba(20, 14, 38, 0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.18)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: 'none',
                    background: viewMode === 'grid' ? '#7C3AED' : 'transparent',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: viewMode === 'grid' ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none'
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: 'none',
                    background: viewMode === 'list' ? '#7C3AED' : 'transparent',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: viewMode === 'list' ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none'
                  }}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Advanced Filters Drawer with AnimatePresence */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Price Tier Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Price:</span>
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under500', label: 'Under ₹500' },
                    { id: 'above500', label: '₹500 & Above' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriceFilter(p.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: priceFilter === p.id ? 700 : 500,
                        borderRadius: '9999px',
                        border: priceFilter === p.id ? '1px solid #7C3AED' : '1px solid #E9E5F0',
                        background: priceFilter === p.id ? '#7C3AED' : '#FFFFFF',
                        color: priceFilter === p.id ? '#FFFFFF' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {priceFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setPriceFilter('all')}
                    style={{
                      fontSize: '12px',
                      color: '#9333EA',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Reset Price Filter
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Liquid Glass Category Filter Chips with Sliding layoutId Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '6px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <button
              type="button"
              onClick={() => onSelectCategory('All')}
              className={`liquid-glass-chip ${selectedCategory === 'All' ? 'is-active' : ''}`}
              style={{ position: 'relative' }}
            >
              {selectedCategory === 'All' && (
                <motion.div
                  layoutId="activeCategoryPill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '9999px',
                    backgroundColor: '#7C3AED',
                    zIndex: 0,
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>All Events</span>
            </button>
            {CATEGORIES.map((cat) => {
              const isSel = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`liquid-glass-chip ${isSel ? 'is-active' : ''}`}
                  style={{ position: 'relative' }}
                >
                  {isSel && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '9999px',
                        backgroundColor: '#7C3AED',
                        zIndex: 0,
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sync Error Notice if applicable */}
        {syncError && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF3F2',
              border: '1px solid #FECDCA',
              borderRadius: 'var(--radius-control)',
              color: '#B42318',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            <strong>Database Notice:</strong> {syncError.message || 'Live database sync is currently unreachable. Displaying cached events.'}
          </div>
        )}

        {/* Events Grid or Skeleton Loaders */}
        {loading && events.length === 0 ? (
          <EventSkeleton count={6} />
        ) : events.length === 0 ? (
          <div
            style={{
              padding: '64px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-gray)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-light-violet)',
                color: 'var(--color-deep-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-dark-text)', marginBottom: '8px' }}>
                No events currently published
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-muted-text)', maxWidth: '420px', lineHeight: '22px' }}>
                Create your event to start issuing branded digital passes, managing turnstiles, and tracking participants.
              </p>
            </div>
            {onCreateEvent && (
              <Button variant="violet" icon={Plus} onClick={onCreateEvent}>
                Create an Event
              </Button>
            )}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '64px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--color-off-white)',
              border: '1px solid var(--color-gray)',
              borderRadius: 'var(--radius-card)',
              color: 'var(--color-muted-text)'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-dark-text)', marginBottom: '8px' }}>
              No events found matching your filter
            </h3>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Try adjusting your search query or reset category to "All Events".
            </p>
            <Button
              variant="outline"
              size="compact"
              icon={RefreshCw}
              onClick={() => {
                setSearchQuery('');
                setPriceFilter('all');
                onSelectCategory('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <motion.div
            layout
            style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px'
            }}
          >
            <AnimatePresence>
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <EventCard
                    event={event}
                    onBook={() => onBookEvent(event)}
                    onViewDetails={() => onViewEventDetails(event)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
