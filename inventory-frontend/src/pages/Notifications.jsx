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
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
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
            // Visual Differentiation Logic
            const isRead = notification.read;
            const cardBg = isRead ? '#f8fafc' : '#ffffff'; // Light gray for Read, White for Unread
            const titleColor = isRead ? '#64748b' : '#111827'; // Softer text for Read
            const bodyColor = isRead ? '#94a3b8' : '#4b5563'; // Softer text for Read

            return (
              <div
                key={notification.id}
                style={{
                  padding: '20px',
                  backgroundColor: cardBg,
                  borderLeft: `4px solid ${getBorderColor(notification.type)}`,
                  border: '1px solid #e5e7eb',
                  borderLeftWidth: '4px',
                  borderRadius: '8px',
                  boxShadow: isRead ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.08)', // Soft shadow only for unread
                  display: 'flex',
                  gap: '16px',
                  cursor: !isRead ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease',
                }}
                onClick={() => !isRead && markAsRead(notification.id)}
              >
                <div style={{ fontSize: '20px', marginTop: '2px', flexShrink: 0, opacity: isRead ? 0.7 : 1 }}>
                  {getTypeIcon(notification.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: titleColor }}>
                        {notification.title || 'Notification'}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Just now'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        title="Delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      backgroundColor: isRead ? '#f1f5f9' : badgeStyle.bg,
                      color: isRead ? '#64748b' : badgeStyle.text,
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
                    }}>
                      {notification.type || 'INFO'}
                    </span>
                    {!isRead && (
                      <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        NEW
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, color: bodyColor, fontSize: '13.5px', lineHeight: '1.5' }}>
                    {notification.message || 'No message provided'}
                  </p>

                  {notification.details && (
                    <div style={{
                      marginTop: '12px', padding: '10px 12px',
                      backgroundColor: isRead ? '#f1f5f9' : '#f8fafc',
                      borderRadius: '6px', fontSize: '13px', color: '#64748b',
                      border: '1px solid #f1f5f9'
                    }}>
                      {notification.details}
                    </div>
                  )}
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
