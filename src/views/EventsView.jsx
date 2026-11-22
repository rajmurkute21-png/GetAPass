import React, { useState } from 'react';
import { Search, Plus, Calendar, RefreshCw, X, Clock, Sparkles, ArrowUpDown } from 'lucide-react';
import EventCard from '../components/cards/EventCard';
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

      const matchesCategory =
        selectedCategory === 'All' || category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
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
                  <div style={{ padding: '6px 12px 4px', fontSize: '11px', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
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
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <SugIcon size={15} style={{ color: '#7C3AED' }} />
                        <span>{sug.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sort Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06)'
                }}
              >
                <ArrowUpDown size={14} style={{ color: '#7C3AED' }} />
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
            </div>
          </div>

          {/* Liquid Glass Category Filter Chips (Pill shaped, subtle glass background) */}
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
            >
              All Events
            </button>
            {CATEGORIES.map((cat) => {
              const isSel = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`liquid-glass-chip ${isSel ? 'is-active' : ''}`}
                >
                  {cat}
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

        {/* Events Grid */}
        {loading && events.length === 0 ? (
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
              gap: '12px',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            <RefreshCw
              size={28}
              style={{
                color: 'var(--color-deep-violet)',
                animation: 'spin 1.2s linear infinite'
              }}
            />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-dark-text)', margin: 0 }}>
              Syncing Campus Events...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', margin: 0 }}>
              Connecting to live database and loading published events.
            </p>
          </div>
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
                onSelectCategory('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px'
            }}
          >
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onBook={() => onBookEvent(event)}
                onViewDetails={() => onViewEventDetails(event)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
