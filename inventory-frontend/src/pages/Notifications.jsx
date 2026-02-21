import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle, FaTrash, FaSync } from 'react-icons/fa';
import { BellOff } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Dynamic Filtering State
  const [activeStatusTab, setActiveStatusTab] = useState('all'); // 'all', 'unread', 'read'
  const [activeTypeTab, setActiveTypeTab] = useState('all'); // 'all', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const orgId = user.orgId;

      if (!orgId) {
        setError('Organization ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await notificationService.getAll();

      // Filter by orgId and map fields
      const mappedNotifications = response.data
        .filter(notif => notif.orgId && String(notif.orgId) === String(orgId))
        .map(notif => ({
          id: notif.id,
          orgId: notif.orgId,
          type: notif.type || 'INFO',
          title: generateTitle(notif.type, notif.message),
          message: notif.message || 'No message provided',
          read: notif.readStatus === true,
          createdAt: notif.createdAt,
          requestEntityId: notif.requestEntityId,
          details: notif.requestEntityId ? `Related Entity ID: ${notif.requestEntityId}` : null
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const generateTitle = (type, message) => {
    if (!type) return 'Notification';
    const typeUpper = type.toUpperCase();
    if (message && message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    switch (typeUpper) {
      case 'SUCCESS': return 'Success Notification';
      case 'WARNING': return 'Warning Alert';
      case 'ERROR': return 'Error Alert';
      case 'INFO': return 'Information';
      default: return `${type} Notification`;
    }
  };

  // Loading state for bulk actions
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Click-to-Read Functionality
  const markAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));

      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on failure if needed, or just show error
      setError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (markingAllRead) return;
    if (!window.confirm('Mark all notifications as read?')) return;

    setMarkingAllRead(true);
    setError('');

    try {
      const unreadNotifications = notifications.filter(n => !n.read);

      if (unreadNotifications.length === 0) {
        setMarkingAllRead(false);
        return;
      }

      // Loop through unread items and call API for each
      // Ideally, backend should support a batch update endpoint for better performance
      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n.id)));

      // Update local state immediately
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all as read. Please try again.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Delete Functionality
  const deleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return <FaCheckCircle style={{ color: '#059669' }} />;
      case 'WARNING': return <FaExclamationTriangle style={{ color: '#d97706' }} />;
      case 'ERROR': return <FaTimesCircle style={{ color: '#dc2626' }} />;
      default: return <FaInfoCircle style={{ color: '#2563eb' }} />;
    }
  };

  const getBorderColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getBadgeStyles = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return { bg: '#ecfdf5', text: '#047857' };
      case 'WARNING': return { bg: '#fffbeb', text: '#b45309' };
      case 'ERROR': return { bg: '#fef2f2', text: '#b91c1c' };
      default: return { bg: '#eff6ff', text: '#1d4ed8' };
    }
  };

  const getFilterBackground = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return 'linear-gradient(135deg,#10b981,#059669)';
      case 'WARNING': return 'linear-gradient(135deg,#f59e0b,#d97706)';
      case 'ERROR': return 'linear-gradient(135deg,#ef4444,#dc2626)';
      case 'INFO': return 'linear-gradient(135deg,#3b82f6,#2563eb)';
      default: return 'linear-gradient(135deg,#6366f1,#4f46e5)';
    }
  };

  const getFilterShadow = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return '0 2px 8px rgba(16,185,129,0.30)';
      case 'WARNING': return '0 2px 8px rgba(245,158,11,0.30)';
      case 'ERROR': return '0 2px 8px rgba(239,68,68,0.30)';
      case 'INFO': return '0 2px 8px rgba(59,130,246,0.30)';
      default: return '0 2px 8px rgba(99,102,241,0.30)';
    }
  };

  // Dynamic Filtering Logic
  const filteredNotifications = notifications.filter(notif => {
    if (activeStatusTab === 'unread' && notif.read) return false;
    if (activeStatusTab === 'read' && !notif.read) return false;
    if (activeTypeTab !== 'all' && notif.type?.toUpperCase() !== activeTypeTab) return false;
    return true;
  });

  // Dynamic Statistics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;
  const errorCount = notifications.filter(n => n.type?.toUpperCase() === 'ERROR').length;

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.025em' }}>Notifications</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'You are all caught up'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={refreshNotifications}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 16px',
              color: '#374151',
              fontSize: '14px', fontWeight: 500,
              cursor: 'pointer',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            <FaSync style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAllRead || refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: markingAllRead ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#fff',
                fontSize: '14px', fontWeight: 600,
                cursor: (markingAllRead || refreshing) ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                opacity: (markingAllRead || refreshing) ? 0.7 : 1
              }}
            >
              {markingAllRead ? (
                <>
                  <FaSync className="animate-spin" /> Marking...
                </>
              ) : (
                <>
                  <FaCheckCircle /> Mark All as Read
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '24px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Filtering Tabs */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'unread', 'read'].map((tab) => {
            const isActive = activeStatusTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveStatusTab(tab)}
                style={{
                  padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  background: isActive ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.30)' : 'none',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div style={{ height: '24px', width: '1px', backgroundColor: '#e5e7eb' }}></div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((tab) => {
            const isActive = activeTypeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTypeTab(tab)}
                style={{
                  padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  background: isActive ? getFilterBackground(tab === 'all' ? 'DEFAULT' : tab) : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: isActive ? getFilterShadow(tab === 'all' ? 'DEFAULT' : tab) : 'none',
                }}
              >
                {tab.toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification List with Click-to-Read & Visual Differentiation */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        // Empty State
        <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <BellOff size={48} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#1e293b', margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>No notifications found</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {activeStatusTab !== 'all' || activeTypeTab !== 'all' ? 'No notifications match your current filters' : 'You\'re all caught up!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((notification) => {
            const badgeStyle = getBadgeStyles(notification.type);
            const isRead = notification.read;

            return (
              <div
                key={notification.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f3f4f6', // border-gray-100
                  borderRadius: '0.75rem', // rounded-xl
                  padding: '1rem', // p-4
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm
                  transition: 'all 0.2s ease',
                  opacity: isRead ? 0.75 : 1,
                  cursor: !isRead ? 'pointer' : 'default',
                  position: 'relative'
                }}
                onClick={() => !isRead && markAsRead(notification.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Left Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Icon */}
                    <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Title & Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '0.875rem', // text-sm
                        fontWeight: '600', // font-semibold
                        color: '#111827', // text-gray-900
                        whiteSpace: 'nowrap',
                      }}>
                        {notification.title || 'Notification'}
                      </h3>

                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.text
                      }}>
                        {notification.type || 'INFO'}
                      </span>
                      {!isRead && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb'
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '12px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Just now'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9ca3af';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div style={{
                  marginTop: '6px',
                  marginLeft: '30px', // Aligns with text start (18px icon + 12px gap)
                  fontSize: '0.875rem', // text-sm
                  color: '#4b5563', // text-gray-600
                  lineHeight: '1.5'
                }}>
                  {notification.message || 'No message provided'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Statistics Section */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
          Notification Statistics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', marginBottom: '4px' }}>Total</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{totalCount}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', marginBottom: '4px' }}>Unread</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb' }}>{unreadCount}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', marginBottom: '4px' }}>Read</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>{readCount}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', marginBottom: '4px' }}>Errors</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>{errorCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
