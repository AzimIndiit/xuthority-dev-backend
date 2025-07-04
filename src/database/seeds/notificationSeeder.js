const mongoose = require('mongoose');
const Notification = require('../../models/Notification');
const User = require('../../models/User');

const seedNotifications = async () => {
  try {
    console.log('🔔 Starting notification seeding...');

    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('🗑️ Cleared existing notifications');

    // Get some users to assign notifications to
    const users = await User.find({}).limit(5);
    if (users.length === 0) {
      console.log('⚠️ No users found. Please run user seeder first.');
      return;
    }

    // Sample notifications data
    const notificationTypes = [
      {
        type: 'WELCOME',
        title: 'Welcome to XUTHORITY!',
        message: 'Welcome to XUTHORITY! Start exploring and sharing your reviews today.',
        actionUrl: '/dashboard'
      },
      {
        type: 'REVIEW_DISPUTE',
        title: 'Your Review is Under Dispute',
        message: 'Another user has raised a dispute on your review. Our moderation team is reviewing it, and please check your review and add explanation for it.',
        actionUrl: '/disputes'
      },
      {
        type: 'PRODUCT_REVIEW',
        title: 'Review Submission',
        message: 'Your review for Slack has been submitted and is under moderation.',
        actionUrl: '/profile/reviews'
      },
      {
        type: 'FOLLOW',
        title: 'New Review Submitted by Robert William',
        message: 'Robert William has just submitted a new review.',
        actionUrl: '/profile/robert-william'
      },
      {
        type: 'PRODUCT_REVIEW',
        title: 'Review Update',
        message: 'You\'ve successfully updated your review for ClickUp.',
        actionUrl: '/profile/reviews'
      },
      {
        type: 'PASSWORD_CHANGE',
        title: 'Password Change',
        message: 'Your password was changed successfully. If this wasn\'t you, contact support immediately.',
        actionUrl: '/profile/security'
      }
    ];

    // Create notifications for each user
    const notifications = [];
    for (const user of users) {
      for (let i = 0; i < notificationTypes.length; i++) {
        const notificationData = notificationTypes[i];
        const createdAt = new Date();
        createdAt.setHours(createdAt.getHours() - (i * 2)); // Spread notifications over time

        notifications.push({
          userId: user._id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          actionUrl: notificationData.actionUrl,
          isRead: i > 2, // Make first few notifications unread
          status: 'sent',
          createdAt: createdAt,
          updatedAt: createdAt
        });
      }
    }

    // Insert notifications
    const createdNotifications = await Notification.insertMany(notifications);

    console.log(`✅ Created ${notifications.length} notifications for ${users.length} users`);
    console.log('🔔 Notification seeding completed successfully!');

    return createdNotifications;

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  }
};

module.exports = seedNotifications; 