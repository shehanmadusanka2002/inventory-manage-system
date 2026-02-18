import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle, FaTrash, FaSync } from 'react-icons/fa';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, INFO, WARNING, ERROR, SUCCESS

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
      
      // Map backend fields to frontend expected fields
      const mappedNotifications = response.data
        .filter(notif => notif.orgId === orgId)
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
      case 'SUCCESS':
        return 'Success Notification';
      case 'WARNING':
        return 'Warning Alert';
      case 'ERROR':
        return 'Error Alert';
      case 'INFO':
        return 'Information';
      default:
        return `${type} Notification`;
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
      setTimeout(() => setError(''), 3000);
    }
  };

  const markAllAsRead = async () => {
    if (!window.confirm('Mark all notifications as read?')) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        setError('No unread notifications to mark');
        setTimeout(() => setError(''), 3000);
        return;
      }

      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n.id)));
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      
      // Show success message
      setError('');
      alert('All notifications marked as read successfully!');
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all notifications as read');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      // Note: Backend doesn't have delete endpoint, so we'll just remove from local state
      // You may need to add a delete endpoint in the backend
      setNotifications(notifications.filter(n => n.id !== id));
      alert('Notification removed (Note: This is a local removal only)');
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return <FaCheckCircle style={{ color: '#10b981' }} />;
      case 'WARNING':
        return <FaExclamationTriangle style={{ color: '#f59e0b' }} />;
      case 'ERROR':
        return <FaTimesCircle style={{ color: '#ef4444' }} />;
      default:
        return <FaInfoCircle style={{ color: '#3b82f6' }} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return '#10b981';
      case 'WARNING':
        return '#f59e0b';
      case 'ERROR':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;
    if (typeFilter !== 'all' && notif.type?.toUpperCase() !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All notifications are read'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn-secondary" 
            onClick={refreshNotifications}
            disabled={refreshing}
            style={{ opacity: refreshing ? 0.6 : 1 }}
          >
            <FaSync style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {unreadCount > 0 && (
            <button className="btn-primary" onClick={markAllAsRead}>
              <FaCheckCircle /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#7f1d1d',
          border: '1px solid #991b1b',
          borderRadius: '0.5rem',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Read/Unread Filter */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'unread', 'read'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === filterOption ? '#3b82f6' : '#1f2937',
                color: 'white',
                border: `1px solid ${filter === filterOption ? '#3b82f6' : '#374151'}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((typeOption) => (
            <button
              key={typeOption}
              onClick={() => setTypeFilter(typeOption)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: typeFilter === typeOption ? getTypeColor(typeOption === 'all' ? 'INFO' : typeOption) : '#1f2937',
                color: 'white',
                border: `1px solid ${typeFilter === typeOption ? getTypeColor(typeOption === 'all' ? 'INFO' : typeOption) : '#374151'}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {typeOption}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#1f2937',
          borderRadius: '0.5rem',
          border: '1px solid #374151',
        }}>
          <FaBell style={{ fontSize: '3rem', color: '#6b7280', marginBottom: '1rem' }} />
          <h3 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0' }}>No notifications</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {filter !== 'all' || typeFilter !== 'all'
              ? 'No notifications match your filters'
              : 'You\'re all caught up!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                padding: '1.5rem',
                backgroundColor: notification.read ? '#1f2937' : '#374151',
                borderLeft: `4px solid ${getTypeColor(notification.type)}`,
                borderRadius: '0.5rem',
                display: 'flex',
                gap: '1rem',
                transition: 'all 0.2s',
                cursor: notification.read ? 'default' : 'pointer',
              }}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              {/* Icon */}
              <div style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                {getTypeIcon(notification.type)}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                      {notification.title || 'Notification'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span className="badge" style={{ backgroundColor: getTypeColor(notification.type) }}>
                        {notification.type || 'INFO'}
                      </span>
                      {!notification.read && (
                        <span className="badge" style={{ backgroundColor: '#8b5cf6' }}>
                          New
                        </span>
                      )}
                      <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    title="Delete"
                    style={{ color: '#ef4444' }}
                  >
                    <FaTrash />
                  </button>
                </div>
                <p style={{ margin: 0, color: '#d1d5db', lineHeight: '1.6' }}>
                  {notification.message || 'No message provided'}
                </p>
                {notification.details && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#9ca3af',
                  }}>
                    {notification.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#1f2937',
        borderRadius: '0.5rem',
        border: '1px solid #374151',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
          Notification Statistics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{notifications.length}</div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Unread</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{unreadCount}</div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Read</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{notifications.length - unreadCount}</div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Errors</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
              {notifications.filter(n => n.type?.toUpperCase() === 'ERROR').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
