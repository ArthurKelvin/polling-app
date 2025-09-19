"use server";

import { getSupabaseServerClient } from '@/lib/auth/server';
import type { User } from '@supabase/supabase-js';

/**
 * Email notification service for poll-related events
 */

export interface NotificationData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface PollNotificationData {
  pollId: string;
  pollTitle: string;
  pollCreator: string;
  pollUrl: string;
  recipientEmail: string;
  recipientName?: string;
}

/**
 * Send email notification using Supabase Edge Functions
 */
async function sendEmailNotification(notification: NotificationData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    // For now, we'll use a simple approach with Supabase's built-in email
    // In production, you'd want to use a dedicated email service like SendGrid, Resend, or AWS SES
    
    // This is a placeholder - in a real implementation, you'd call an Edge Function
    // or use a third-party email service
    console.log('Email notification would be sent:', {
      to: notification.to,
      subject: notification.subject,
      html: notification.html
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    return { success: true };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Send poll creation notification to followers/subscribers
 */
export async function sendPollCreatedNotification(
  pollData: PollNotificationData,
  subscriberEmails: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const notifications = subscriberEmails.map(email => ({
      to: email,
      subject: `New Poll: ${pollData.pollTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Poll Created!</h2>
          <p>Hello!</p>
          <p><strong>${pollData.pollCreator}</strong> has created a new poll: <strong>"${pollData.pollTitle}"</strong></p>
          <div style="margin: 20px 0;">
            <a href="${pollData.pollUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View and Vote on Poll
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This poll was created by ${pollData.pollCreator}. 
            You can unsubscribe from these notifications in your account settings.
          </p>
        </div>
      `,
      text: `
        New Poll: ${pollData.pollTitle}
        
        ${pollData.pollCreator} has created a new poll: "${pollData.pollTitle}"
        
        View and vote: ${pollData.pollUrl}
        
        This poll was created by ${pollData.pollCreator}.
        You can unsubscribe from these notifications in your account settings.
      `
    }));

    // Send all notifications
    const results = await Promise.all(
      notifications.map(notification => sendEmailNotification(notification))
    );

    const failed = results.filter(result => !result.success);
    if (failed.length > 0) {
      console.warn(`Failed to send ${failed.length} notifications`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending poll created notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send notifications' 
    };
  }
}

/**
 * Send poll closing notification
 */
export async function sendPollClosingNotification(
  pollData: PollNotificationData,
  hoursUntilClose: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const notification: NotificationData = {
      to: pollData.recipientEmail,
      subject: `Poll Closing Soon: ${pollData.pollTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Poll Closing Soon!</h2>
          <p>Hello${pollData.recipientName ? ` ${pollData.recipientName}` : ''}!</p>
          <p>The poll <strong>"${pollData.pollTitle}"</strong> will close in ${hoursUntilClose} hour${hoursUntilClose !== 1 ? 's' : ''}.</p>
          <div style="margin: 20px 0;">
            <a href="${pollData.pollUrl}" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Vote Now Before It Closes
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Don't miss your chance to participate in this poll!
          </p>
        </div>
      `,
      text: `
        Poll Closing Soon: ${pollData.pollTitle}
        
        The poll "${pollData.pollTitle}" will close in ${hoursUntilClose} hour${hoursUntilClose !== 1 ? 's' : ''}.
        
        Vote now: ${pollData.pollUrl}
        
        Don't miss your chance to participate in this poll!
      `
    };

    return await sendEmailNotification(notification);
  } catch (error) {
    console.error('Error sending poll closing notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send notification' 
    };
  }
}

/**
 * Send poll results notification
 */
export async function sendPollResultsNotification(
  pollData: PollNotificationData,
  results: Array<{ option: string; votes: number; percentage: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const resultsHtml = results.map(result => 
      `<li><strong>${result.option}</strong>: ${result.votes} votes (${result.percentage.toFixed(1)}%)</li>`
    ).join('');

    const notification: NotificationData = {
      to: pollData.recipientEmail,
      subject: `Poll Results: ${pollData.pollTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Poll Results Are In!</h2>
          <p>Hello${pollData.recipientName ? ` ${pollData.recipientName}` : ''}!</p>
          <p>The poll <strong>"${pollData.pollTitle}"</strong> has closed. Here are the results:</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <ul style="list-style: none; padding: 0;">
              ${resultsHtml}
            </ul>
          </div>
          <div style="margin: 20px 0;">
            <a href="${pollData.pollUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Results
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Thank you for participating in this poll!
          </p>
        </div>
      `,
      text: `
        Poll Results: ${pollData.pollTitle}
        
        The poll "${pollData.pollTitle}" has closed. Here are the results:
        
        ${results.map(result => 
          `${result.option}: ${result.votes} votes (${result.percentage.toFixed(1)}%)`
        ).join('\n')}
        
        View full results: ${pollData.pollUrl}
        
        Thank you for participating in this poll!
      `
    };

    return await sendEmailNotification(notification);
  } catch (error) {
    console.error('Error sending poll results notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send notification' 
    };
  }
}

/**
 * Send comment notification to poll creator
 */
export async function sendCommentNotification(
  pollData: PollNotificationData,
  commenterEmail: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const notification: NotificationData = {
      to: pollData.recipientEmail,
      subject: `New Comment on Poll: ${pollData.pollTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">New Comment on Your Poll!</h2>
          <p>Hello${pollData.recipientName ? ` ${pollData.recipientName}` : ''}!</p>
          <p><strong>${commenterEmail}</strong> commented on your poll <strong>"${pollData.pollTitle}"</strong>:</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <p style="margin: 0; font-style: italic;">"${comment}"</p>
          </div>
          <div style="margin: 20px 0;">
            <a href="${pollData.pollUrl}" 
               style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Comment and Reply
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            You can manage your notification preferences in your account settings.
          </p>
        </div>
      `,
      text: `
        New Comment on Your Poll: ${pollData.pollTitle}
        
        ${commenterEmail} commented on your poll "${pollData.pollTitle}":
        
        "${comment}"
        
        View comment and reply: ${pollData.pollUrl}
        
        You can manage your notification preferences in your account settings.
      `
    };

    return await sendEmailNotification(notification);
  } catch (error) {
    console.error('Error sending comment notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send notification' 
    };
  }
}
