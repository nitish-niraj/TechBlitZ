import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";

export function setupSocketIO(io: SocketIOServer) {
  // Middleware for Socket.IO authentication
  io.use(async (socket, next) => {
    try {
      // For development, we'll authenticate based on user data passed from client
      const userType = socket.handshake.auth.userType || 'admin';
      const userId = userType === 'admin' ? 'dev-user-123' : 'dev-user-456';
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return next(new Error('Authentication failed'));
      }
      
      // Attach user to socket
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.data.user.firstName} connected`);

    // Join complaint rooms for real-time updates
    socket.on('join-complaint', async (complaintId: string) => {
      try {
        // Verify user has access to this complaint
        const complaint = await storage.getComplaint(complaintId);
        if (!complaint) {
          socket.emit('error', { message: 'Complaint not found' });
          return;
        }

        // Check if user has permission to view this complaint
        const user = socket.data.user;
        const hasAccess = 
          user.role === 'admin' || 
          user.role === 'staff' ||
          complaint.userId === user.id ||
          complaint.assignedToId === user.id;

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`complaint-${complaintId}`);
        console.log(`User ${user.firstName} joined complaint ${complaintId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join complaint' });
      }
    });

    // Leave complaint room
    socket.on('leave-complaint', (complaintId: string) => {
      socket.leave(`complaint-${complaintId}`);
      console.log(`User ${socket.data.user.firstName} left complaint ${complaintId}`);
    });

    // Handle sending messages
    socket.on('send-message', async (data: {
      complaintId: string;
      message: string;
      messageType?: string;
    }) => {
      try {
        const user = socket.data.user;
        
        // Create the message in database
        const newMessage = await storage.createChatMessage({
          complaintId: data.complaintId,
          senderId: user.id,
          message: data.message,
          messageType: data.messageType || 'text'
        });

        // Get the message with sender details
        const messageWithSender = {
          ...newMessage,
          sender: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profileImageUrl: user.profileImageUrl
          }
        };

        // Broadcast to all users in the complaint room
        io.to(`complaint-${data.complaintId}`).emit('new-message', messageWithSender);

        // Create notification for other participants
        const complaint = await storage.getComplaint(data.complaintId);
        if (complaint) {
          const participantIds = [
            complaint.userId,
            complaint.assignedToId
          ].filter((id): id is string => id !== null && id !== user.id);

          for (const participantId of participantIds) {
            await storage.createNotification({
              userId: participantId,
              title: 'New Message',
              message: `${user.firstName} sent a message: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
              type: 'chat_message',
              relatedComplaintId: data.complaintId
            });
          }

          // Broadcast notification to participants
          io.to(`complaint-${data.complaintId}`).emit('notification', {
            type: 'new_message',
            complaintId: data.complaintId,
            sender: user.firstName
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle editing messages
    socket.on('edit-message', async (data: {
      messageId: string;
      newMessage: string;
      complaintId: string;
    }) => {
      try {
        const user = socket.data.user;
        
        // Update the message in database
        const updatedMessage = await storage.updateChatMessage(data.messageId, data.newMessage);

        // Broadcast the edit to all users in the complaint room
        io.to(`complaint-${data.complaintId}`).emit('message-edited', {
          messageId: data.messageId,
          newMessage: data.newMessage,
          editedAt: updatedMessage.editedAt
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle complaint status updates
    socket.on('complaint-status-updated', (data: {
      complaintId: string;
      status: string;
      updatedBy: string;
    }) => {
      // Broadcast status update to all users in the complaint room
      io.to(`complaint-${data.complaintId}`).emit('status-updated', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.firstName} disconnected`);
    });
  });
}

// Export io instance for use in routes
export let ioInstance: SocketIOServer;

export function setIOInstance(io: SocketIOServer) {
  ioInstance = io;
}
