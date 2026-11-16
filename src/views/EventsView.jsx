import React, { useState } from 'react';
import { Search, Plus, Calendar, RefreshCw } from 'lucide-react';
import EventCard from '../components/cards/EventCard';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { CATEGORIES } from '../data/mockData';

export default function EventsView({
  events = [],
  selectedCategory = 'All',
  onSelectCategory,
  onBookEvent,
  onViewEventDetails,
  onCreateEvent
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((ev) => {
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
  });

  return (
    <div className="gateapass-events-view" style={{ textAlign: 'left', padding: '40px 0 64px' }}>
      <div className="container-desktop">
        {/* Title Header */}
        <div style={{ marginBottom: '32px' }}>
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
            Explore Campus Events
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-muted-text)', marginTop: '6px' }}>
            Book secure digital passes for conferences, hackathons, workshops, and student festivals.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          {/* Search Input */}
          <div style={{ maxWidth: '540px' }}>
            <Input
              icon={Search}
              placeholder="Search by event title, venue, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Pills (strictly 4px radius, no pill) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => onSelectCategory('All')}
              style={{
                height: '36px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: selectedCategory === 'All' ? 600 : 500,
                backgroundColor: selectedCategory === 'All' ? 'var(--color-black)' : 'var(--color-white)',
                color: selectedCategory === 'All' ? 'var(--color-white)' : 'var(--color-dark-text)',
                border: '1px solid var(--color-gray)',
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
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
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    fontSize: '13px',
                    fontWeight: isSel ? 600 : 500,
                    backgroundColor: isSel ? 'var(--color-black)' : 'var(--color-white)',
                    color: isSel ? 'var(--color-white)' : 'var(--color-dark-text)',
                    border: '1px solid var(--color-gray)',
                    borderRadius: 'var(--radius-control)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
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
