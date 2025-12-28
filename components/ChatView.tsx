
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Message, Group, Role, MessageAttachment, CallInfo } from '../types';
import { WebRTCService } from '../services/webrtcService';
import { supabase } from '../services/supabaseService';
import { messageService } from '../services/supabaseService';
import { 
  Search, Send, ArrowLeft, User as UserIcon, MessageCircle, 
  Users, Plus, Hash, Trash2, Paperclip, Video, Phone, 
  X, ExternalLink, Image as ImageIcon, FileText, 
  Mic, Camera, PhoneOff, Link as LinkIcon, Check, CheckCheck, Reply, AtSign,
  Download, Maximize2, Trash
} from 'lucide-react';

interface ChatViewProps {
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  groups: Group[];
  onSendMessage: (receiverId: string | undefined, groupId: string | undefined, text: string, attachment?: MessageAttachment, replyToId?: string) => void;
  onDeleteMessage: (messageId: string, deleteForEveryone?: boolean) => void;
  onClearHistory: (receiverId: string | undefined, groupId: string | undefined, clearForEveryone: boolean) => void;
  onCreateGroup: (name: string, description: string) => void;
  onJoinGroup: (groupId: string) => void;
  onStartCall: (type: 'audio' | 'video', targetId: string, isGroup: boolean) => void;
  onEndCall: (callId: string) => void;
  initialUserId?: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ 
  currentUser, 
  allUsers, 
  messages, 
  groups,
  onSendMessage,
  onDeleteMessage,
  onClearHistory,
  onCreateGroup,
  onJoinGroup,
  onStartCall,
  onEndCall,
  initialUserId
}) => {
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  
  // Set initial user if provided
  useEffect(() => {
    if (initialUserId && allUsers.length > 0) {
      const user = allUsers.find(u => u.id === initialUserId);
      if (user && user.id !== currentUser.id) {
        setActiveChatUser(user);
      }
    }
  }, [initialUserId, allUsers, currentUser.id]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [showCallOverlay, setShowCallOverlay] = useState<CallInfo | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ from: string; callId: string; type: 'audio' | 'video' } | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({}); // userId -> userName
  const [isTyping, setIsTyping] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [clearHistoryForEveryone, setClearHistoryForEveryone] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCService | null>(null);
  const signalingChannelRef = useRef<any>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatUser, activeGroup, messages]);

  // Auto-save media to gallery when viewing on mobile
  useEffect(() => {
    if (viewingMedia && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      handleAutoSaveMedia(viewingMedia.url, viewingMedia.name, viewingMedia.type).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingMedia]);

  // Set up WebRTC and signaling
  useEffect(() => {
    if (!currentUser) return;

    // Set up Supabase realtime channel for call signaling
    const channel = supabase.channel(`calls_${currentUser.id}`)
      .on('broadcast', { event: 'call-signal' }, (payload) => {
        handleCallSignal(payload.payload);
      })
      .subscribe();

    signalingChannelRef.current = channel;

    return () => {
      stopRingtone();
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
      }
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Set up typing indicators
  useEffect(() => {
    if (!currentUser || (!activeChatUser && !activeGroup)) {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      return;
    }

    const targetId = activeChatUser?.id || activeGroup?.id;
    const channelName = activeGroup ? `typing_group_${targetId}` : `typing_dm_${currentUser.id}_${targetId}`;
    
    const typingChannel = supabase.channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, userName, isTyping: userIsTyping } = payload.payload;
        if (userId !== currentUser.id) {
          if (userIsTyping) {
            setTypingUsers(prev => ({ ...prev, [userId]: userName }));
            // Clear typing indicator after 3 seconds
            setTimeout(() => {
              setTypingUsers(prev => {
                const updated = { ...prev };
                delete updated[userId];
                return updated;
              });
            }, 3000);
          } else {
            setTypingUsers(prev => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
            });
          }
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      setTypingUsers({});
    };
  }, [currentUser, activeChatUser?.id, activeGroup?.id]);

  // Update video streams when WebRTC streams are available
  useEffect(() => {
    if (webrtcRef.current && localVideoRef.current) {
      const localStream = webrtcRef.current.getLocalStream();
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }

    if (webrtcRef.current && remoteVideoRef.current) {
      webrtcRef.current.setOnRemoteStream((stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });
    }
  }, [isCallActive]);

  const sendSignal = (type: string, to: string, data: any, callId?: string) => {
    if (signalingChannelRef.current && currentUser) {
      signalingChannelRef.current.send({
        type: 'broadcast',
        event: 'call-signal',
        payload: {
          type,
          from: currentUser.id,
          to,
          data,
          callId
        }
      });
    }
  };

  // Initialize audio element for ringtone
  useEffect(() => {
    if (!ringtoneRef.current) {
      // Try multiple possible paths for the ringtone file
      const audioPaths = [
        '/app_logo/ringtone.wav',  // If in public/app_logo
        './app_logo/ringtone.wav', // Alternative path
        'app_logo/ringtone.wav'    // Relative path
      ];
      
      let audio: HTMLAudioElement | null = null;
      for (const path of audioPaths) {
        try {
          audio = new Audio(path);
          audio.loop = true;
          audio.volume = 0.7;
          // Preload the audio
          audio.preload = 'auto';
          ringtoneRef.current = audio;
          console.log(`✅ Ringtone loaded from: ${path}`);
          break;
        } catch (e) {
          console.warn(`Failed to load ringtone from ${path}:`, e);
        }
      }
      
      if (!audio) {
        console.error('❌ Could not load ringtone file. Please ensure ringtone.wav is in the public/app_logo folder.');
      }
    }
  }, []);

  // Play ringing sound using audio file
  const playRingtone = () => {
    if (ringtoneIntervalRef.current || !ringtoneRef.current) return; // Already playing
    
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0; // Reset to start
        ringtoneRef.current.play().catch(error => {
          console.warn('Error playing ringtone:', error);
        });
      }
    } catch (error) {
      console.warn('Error initializing ringtone:', error);
    }
  };

  // Stop ringing sound
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  const handleCallSignal = async (signal: any) => {
    // Only process signals meant for current user
    if (!currentUser || signal.to !== currentUser.id) return;
    if (!webrtcRef.current && signal.type !== 'call-request') return;

    try {
      switch (signal.type) {
        case 'call-request':
          // Play ringing sound for incoming call
          playRingtone();
          // Incoming call - only show if not already in a call
          if (!showCallOverlay && !incomingCall) {
            setIncomingCall({
              from: signal.from,
              callId: signal.callId || 'call_' + Date.now(),
              type: signal.data?.type || 'audio'
            });
          }
          break;

        case 'call-accepted':
          // Call was accepted, we already sent offer in handleCall
          // Just wait for answer
          break;

        case 'offer':
          // Received offer, create answer (for incoming calls that we answered)
          if (webrtcRef.current && showCallOverlay && signal.data?.offer) {
            try {
              const answer = await webrtcRef.current.setRemoteOffer(signal.data.offer);
              sendSignal('answer', signal.from, { answer }, signal.callId);
            } catch (error) {
              console.error('Error handling offer:', error);
            }
          }
          break;

        case 'answer':
          // Received answer
          if (webrtcRef.current && signal.data?.answer) {
            try {
              await webrtcRef.current.setRemoteAnswer(signal.data.answer);
            } catch (error) {
              console.error('Error handling answer:', error);
            }
          }
          break;

        case 'ice-candidate':
          // Received ICE candidate
          if (webrtcRef.current && signal.data?.candidate) {
            try {
              await webrtcRef.current.addIceCandidate(signal.data.candidate);
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          }
          break;

        case 'call-ended':
        case 'call-rejected':
          // Call ended or rejected
          stopRingtone();
          endCall();
          break;
      }
    } catch (error) {
      console.error('Error handling call signal:', error);
    }
  };

  const canCreateGroup = currentUser.role === Role.ADMIN || 
                         currentUser.role === Role.MANAGEMENT || 
                         currentUser.role === Role.HOD;

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allUsers.filter(u => 
      u.id !== currentUser.id && 
      (u.name.toLowerCase().includes(query) || (u.username && `@${u.username.toLowerCase()}`.includes(query)))
    );
  }, [allUsers, searchQuery, currentUser.id]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return groups.filter(g => 
      g.name.toLowerCase().includes(query) || (g.description?.toLowerCase() || '').includes(query)
    );
  }, [groups, searchQuery]);

  const conversationMessages = useMemo(() => {
    if (activeChatUser) {
      return messages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === activeChatUser.id) ||
        (m.senderId === activeChatUser.id && m.receiverId === currentUser.id)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (activeGroup) {
      return messages.filter(m => m.groupId === activeGroup.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return [];
  }, [messages, activeChatUser, activeGroup, currentUser.id]);

  // Mark messages as seen when viewing conversation (must be after conversationMessages definition)
  useEffect(() => {
    if (!currentUser || (!activeChatUser && !activeGroup)) return;

    const markMessagesAsSeen = async () => {
      const targetId = activeChatUser?.id || activeGroup?.id;
      if (!targetId) return;

      // Find unread messages sent to current user (for direct messages)
      // Or messages in group where current user is a member
      const unreadMessages = conversationMessages.filter(msg => {
        if (activeChatUser) {
          // Direct message - mark as seen if I'm the receiver
          return msg.receiverId === currentUser.id && 
                 msg.status !== 'seen' &&
                 msg.senderId === targetId;
        } else if (activeGroup) {
          // Group message - mark as seen if I'm not the sender and status is not 'seen'
          return msg.groupId === targetId &&
                 msg.senderId !== currentUser.id &&
                 msg.status !== 'seen';
        }
        return false;
      });

      if (unreadMessages.length > 0) {
        // Update all unread messages to 'seen'
        for (const msg of unreadMessages) {
          try {
            await messageService.update(msg.id, { status: 'seen' });
          } catch (error) {
            console.error('Failed to mark message as seen:', error);
          }
        }
      }
    };

    // Add a small delay to ensure messages are rendered before marking as seen
    const timeoutId = setTimeout(() => {
      markMessagesAsSeen();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser, activeChatUser, activeGroup, conversationMessages]);

  const myGroups = useMemo(() => {
    return groups.filter(g => g.members.includes(currentUser.id));
  }, [groups, currentUser.id]);

  const recentDirectChats = useMemo(() => {
    const chatUserIds = new Set<string>();
    messages.forEach(m => {
      if (!m.groupId) {
        if (m.senderId === currentUser.id) chatUserIds.add(m.receiverId!);
        if (m.receiverId === currentUser.id) chatUserIds.add(m.senderId);
      }
    });
    return allUsers.filter(u => chatUserIds.has(u.id));
  }, [messages, allUsers, currentUser.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          data: reader.result as string,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Send typing indicator
  const sendTypingIndicator = (isTyping: boolean) => {
    if (!typingChannelRef.current || !currentUser) return;
    
    const targetId = activeChatUser?.id || activeGroup?.id;
    if (!targetId) return;

    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping
      }
    });
  };

  // Handle typing in message input
  const handleMessageChange = (value: string) => {
    setMessageText(value);
    
    const now = Date.now();
    // Throttle typing indicators (send every 2 seconds)
    if (now - lastTypingTimeRef.current > 2000) {
      if (value.trim().length > 0 && !isTyping) {
        setIsTyping(true);
        sendTypingIndicator(true);
        lastTypingTimeRef.current = now;
      }
    }

    // Clear typing indicator after user stops typing for 2 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(false);
      }
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !attachment) return;
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    const receiverId = activeChatUser?.id;
    const groupId = activeGroup?.id;
    onSendMessage(receiverId, groupId, messageText.trim(), attachment || undefined, replyingTo?.id);
    setMessageText('');
    setAttachment(null);
    setReplyingTo(null);
  };

  // Check and request permissions with better error handling
  const requestMediaPermissions = async (isVideo: boolean): Promise<MediaStream> => {
    // First, check current permission status
    let cameraStatus = 'prompt';
    let micStatus = 'prompt';
    
    try {
      if (navigator.permissions && navigator.permissions.query) {
        if (isVideo) {
          try {
            const cameraPermission = await (navigator.permissions as any).query({ name: 'camera' });
            cameraStatus = cameraPermission?.state || 'prompt';
          } catch (e) {
            console.warn('Could not check camera permission:', e);
          }
        }
        try {
          const micPermission = await (navigator.permissions as any).query({ name: 'microphone' });
          micStatus = micPermission?.state || 'prompt';
        } catch (e) {
          console.warn('Could not check microphone permission:', e);
        }
      }
    } catch (e) {
      console.warn('Permission API not available:', e);
    }

    // If permissions are denied, show helpful message
    if (cameraStatus === 'denied' && isVideo) {
      setPermissionError('CAMERA_DENIED');
      setShowPermissionModal(true);
      throw new Error('CAMERA_DENIED');
    }
    if (micStatus === 'denied') {
      setPermissionError('MICROPHONE_DENIED');
      setShowPermissionModal(true);
      throw new Error('MICROPHONE_DENIED');
    }

    // Try with advanced constraints first
    let constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: isVideo ? {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: 'user',
        frameRate: { ideal: 30, min: 15 }
      } : false
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error: any) {
      // If advanced constraints fail, try simpler ones
      if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        console.warn('Advanced constraints failed, trying simpler constraints');
        constraints = {
          audio: true,
          video: isVideo ? true : false
        };
        return await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      // Handle permission errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError(error.name);
        setShowPermissionModal(true);
      }
      throw error;
    }
  };

  // Request permissions manually
  const handleRequestPermissions = async (isVideo: boolean) => {
    setShowPermissionModal(false);
    setPermissionError(null);
    try {
      const stream = await requestMediaPermissions(isVideo);
      stream.getTracks().forEach(track => track.stop());
      // Retry the call
      if (isVideo) {
        handleCall('video');
      } else {
        handleCall('audio');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const handleCall = async (type: 'audio' | 'video') => {
    const targetId = activeChatUser ? activeChatUser.id : activeGroup!.id;
    const isGroup = !!activeGroup;

    // Request media access for both group and direct calls
    try {
      // Request camera/microphone permissions first
      const stream = await requestMediaPermissions(type === 'video');
      
      // Stop the stream immediately - we'll get it again when WebRTC is set up
      stream.getTracks().forEach(track => track.stop());

      if (isGroup) {
        // Group calls - update database and show overlay
        onStartCall(type, targetId, isGroup);
        setShowCallOverlay({
          id: 'call_' + Date.now(),
          type,
          status: 'active',
          startedBy: currentUser.id,
          groupId: targetId
        });
        return;
      }

      // Direct calls - use WebRTC
      const callId = 'call_' + Date.now();
      webrtcRef.current = new WebRTCService();
      
      // Set up remote stream handler
      webrtcRef.current.setOnRemoteStream((stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      // Set up call ended handler
      webrtcRef.current.setOnCallEnded(() => {
        endCall();
      });

      // Set up ICE candidate handler
      webrtcRef.current.setOnIceCandidate((candidate) => {
        sendSignal('ice-candidate', targetId, { candidate }, callId);
      });
      
      // Start local stream (permissions already granted, so this should work)
      const localStream = await webrtcRef.current.startCall(type === 'video');
      setIsCallActive(true);
      setIsMuted(false);
      setIsVideoOff(type === 'audio');

      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Set up call overlay
      setShowCallOverlay({
        id: callId,
        type,
        status: 'active',
        startedBy: currentUser.id
      });

      // Send call request
      sendSignal('call-request', targetId, { type }, callId);

      // Create and send offer
      const offer = await webrtcRef.current.createOffer();
      sendSignal('offer', targetId, { offer }, callId);

      // Notify via database
      onStartCall(type, targetId, false);
    } catch (error: any) {
      console.error('Failed to start call:', error);
      let errorMessage = '';
      let showInstructions = false;
      
      if (error.message === 'CAMERA_DENIED' || error.message === 'MICROPHONE_DENIED' || 
          error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/Microphone Access Denied\n\n';
        showInstructions = true;
        
        const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' :
                       navigator.userAgent.includes('Firefox') ? 'Firefox' :
                       navigator.userAgent.includes('Safari') ? 'Safari' : 'your browser';
        
        if (browser === 'Chrome') {
          errorMessage += 'To fix this in Chrome:\n' +
            '1. Click the lock icon (🔒) in the address bar\n' +
            '2. Find "Camera" and "Microphone" in the list\n' +
            '3. Change them from "Block" to "Allow"\n' +
            '4. Refresh the page and try again\n\n' +
            'OR go to: Settings → Privacy and security → Site settings → Camera/Microphone\n' +
            'Find this site and change to "Allow"';
        } else if (browser === 'Firefox') {
          errorMessage += 'To fix this in Firefox:\n' +
            '1. Click the shield icon in the address bar\n' +
            '2. Click "Permissions" → "Use Camera" and "Use Microphone"\n' +
            '3. Select "Allow" for both\n' +
            '4. Refresh the page and try again';
        } else if (browser === 'Safari') {
          errorMessage += 'To fix this in Safari:\n' +
            '1. Go to Safari → Settings → Websites\n' +
            '2. Select "Camera" and "Microphone"\n' +
            '3. Find this website and set to "Allow"\n' +
            '4. Refresh the page and try again';
        } else {
          errorMessage += 'To fix this:\n' +
            '1. Check your browser\'s site permissions\n' +
            '2. Allow camera and microphone for this site\n' +
            '3. Refresh the page and try again';
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found.\n\n' +
          'Please:\n' +
          '1. Make sure your camera/microphone is connected\n' +
          '2. Check that no other application is using them\n' +
          '3. Try refreshing the page';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use.\n\n' +
          'Please close other applications using your camera/microphone and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to access camera/microphone.\n\n' +
          'Please check your browser permissions and make sure your camera/microphone is connected.';
      }
      
      alert(errorMessage);
      if (showInstructions) {
        // Try to open browser settings if possible
        console.log('User needs to manually enable permissions in browser settings');
      }
      
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
        webrtcRef.current = null;
      }
      setIsCallActive(false);
      setShowCallOverlay(null);
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    // Stop ringing and play answer sound
    stopRingtone();
    
    // Play a short "answer" tone
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (audioError) {
      console.warn('Could not play answer sound:', audioError);
    }

    try {
      const callType = incomingCall.type;
      
      // Request camera/microphone permissions first
      const stream = await requestMediaPermissions(callType === 'video');
      
      // Stop the stream immediately - we'll get it again when WebRTC is set up
      stream.getTracks().forEach(track => track.stop());

      webrtcRef.current = new WebRTCService();
      
      // Set up remote stream handler
      webrtcRef.current.setOnRemoteStream((stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      // Set up call ended handler
      webrtcRef.current.setOnCallEnded(() => {
        endCall();
      });

      // Set up ICE candidate handler
      webrtcRef.current.setOnIceCandidate((candidate) => {
        sendSignal('ice-candidate', incomingCall.from, { candidate }, incomingCall.callId);
      });
      
      // Start local stream (permissions already granted, so this should work)
      const localStream = await webrtcRef.current.startCall(callType === 'video');
      setIsCallActive(true);
      setIsMuted(false);
      setIsVideoOff(callType === 'audio');

      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // Set up call overlay
      setShowCallOverlay({
        id: incomingCall.callId,
        type: callType,
        status: 'active',
        startedBy: incomingCall.from
      });

      // Accept call
      sendSignal('call-accepted', incomingCall.from, { type: callType }, incomingCall.callId);
      setIncomingCall(null);

      // Wait for offer from caller
      // The offer will be handled in handleCallSignal
    } catch (error: any) {
      console.error('Failed to answer call:', error);
      let errorMessage = '';
      let showInstructions = false;
      
      if (error.message === 'CAMERA_DENIED' || error.message === 'MICROPHONE_DENIED' || 
          error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/Microphone Access Denied\n\n';
        showInstructions = true;
        
        const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' :
                       navigator.userAgent.includes('Firefox') ? 'Firefox' :
                       navigator.userAgent.includes('Safari') ? 'Safari' : 'your browser';
        
        if (browser === 'Chrome') {
          errorMessage += 'To fix this in Chrome:\n' +
            '1. Click the lock icon (🔒) in the address bar\n' +
            '2. Find "Camera" and "Microphone" in the list\n' +
            '3. Change them from "Block" to "Allow"\n' +
            '4. Refresh the page and try again\n\n' +
            'OR go to: Settings → Privacy and security → Site settings → Camera/Microphone\n' +
            'Find this site and change to "Allow"';
        } else if (browser === 'Firefox') {
          errorMessage += 'To fix this in Firefox:\n' +
            '1. Click the shield icon in the address bar\n' +
            '2. Click "Permissions" → "Use Camera" and "Use Microphone"\n' +
            '3. Select "Allow" for both\n' +
            '4. Refresh the page and try again';
        } else if (browser === 'Safari') {
          errorMessage += 'To fix this in Safari:\n' +
            '1. Go to Safari → Settings → Websites\n' +
            '2. Select "Camera" and "Microphone"\n' +
            '3. Find this website and set to "Allow"\n' +
            '4. Refresh the page and try again';
        } else {
          errorMessage += 'To fix this:\n' +
            '1. Check your browser\'s site permissions\n' +
            '2. Allow camera and microphone for this site\n' +
            '3. Refresh the page and try again';
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found.\n\n' +
          'Please:\n' +
          '1. Make sure your camera/microphone is connected\n' +
          '2. Check that no other application is using them';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use.\n\n' +
          'Please close other applications using your camera/microphone and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to access camera/microphone.\n\n' +
          'Please check your browser permissions and make sure your camera/microphone is connected.';
      }
      
      alert(errorMessage);
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
        webrtcRef.current = null;
      }
      setIsCallActive(false);
      setShowCallOverlay(null);
      rejectCall();
    }
  };

  const rejectCall = () => {
    stopRingtone();
    if (incomingCall) {
      sendSignal('call-rejected', incomingCall.from, {}, incomingCall.callId);
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    stopRingtone();
    if (webrtcRef.current) {
      webrtcRef.current.endCall();
      webrtcRef.current = null;
    }
    
    if (showCallOverlay) {
      const targetId = showCallOverlay.groupId || activeChatUser?.id;
      if (targetId) {
        sendSignal('call-ended', targetId, {}, showCallOverlay.id);
      }
      onEndCall(showCallOverlay.id);
    }

    setShowCallOverlay(null);
    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (webrtcRef.current) {
      const isEnabled = webrtcRef.current.toggleMute();
      setIsMuted(!isEnabled);
    }
  };

  const toggleVideo = () => {
    if (webrtcRef.current) {
      const isEnabled = webrtcRef.current.toggleVideo();
      setIsVideoOff(!isEnabled);
    }
  };

  const userMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    allUsers.forEach(u => map[u.id] = u.name);
    return map;
  }, [allUsers]);

  const usernameMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    allUsers.forEach(u => map[u.username] = u.id);
    return map;
  }, [allUsers]);

  // Helper function to render user avatar (profile photo or initial)
  const renderUserAvatar = (user: User, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    };
    
    if (user.profilePhoto) {
      return (
        <img 
          src={user.profilePhoto} 
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-slate-100`}
        />
      );
    }
    
    return (
      <div className={`${sizeClasses[size]} bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-black`}>
        {user.name.charAt(0)}
      </div>
    );
  };

  const renderStatus = (status?: Message['status']) => {
    if (!status) return null;
    switch (status) {
      case 'sent':
        return <Check size={10} className="text-white opacity-60" />;
      case 'delivered':
        return <CheckCheck size={10} className="text-white opacity-60" />;
      case 'seen':
        return <CheckCheck size={10} className="text-blue-400" />;
      default:
        return null;
    }
  };

  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        if (usernameMap[username]) {
          return <span key={i} className="text-blue-400 font-bold bg-white/10 px-1 rounded">{part}</span>;
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Auto-save media to mobile gallery
  const handleAutoSaveMedia = async (dataUrl: string, filename: string, type: 'image' | 'video') => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // On mobile devices, this will trigger the save to gallery
      // For better mobile support, we can also try using the File System Access API or Web Share API
      if ('share' in navigator && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const file = new File([blob], filename, { type: type === 'image' ? 'image/jpeg' : 'video/mp4' });
        try {
          await navigator.share({
            files: [file],
            title: filename
          });
        } catch (shareError) {
          // Share API failed, download will still work
          console.log('Share API not available, using download');
        }
      }
    } catch (error) {
      console.error('Failed to save media:', error);
      // Fallback: open in new tab
      window.open(dataUrl, '_blank');
    }
  };

  const handleConfirmDelete = () => {
    if (messageToDelete) {
      onDeleteMessage(messageToDelete.id, deleteForEveryone);
      setMessageToDelete(null);
      setDeleteForEveryone(false);
    }
  };

  const handleConfirmClearHistory = () => {
    if (activeChatUser || activeGroup) {
      onClearHistory(activeChatUser?.id, activeGroup?.id, clearHistoryForEveryone);
      setShowClearHistoryModal(false);
      setClearHistoryForEveryone(false);
    }
  };

  // Clear History Modal
  if (showClearHistoryModal) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Clear Chat History</h3>
                <p className="text-xs text-slate-500 font-bold">This action cannot be undone</p>
              </div>
            </div>
            <button 
              onClick={() => { setShowClearHistoryModal(false); setClearHistoryForEveryone(false); }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to clear all messages from this chat? All messages, images, and videos will be permanently deleted.
          </p>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-6">
            <input
              type="checkbox"
              checked={clearHistoryForEveryone}
              onChange={(e) => setClearHistoryForEveryone(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              id="clearForEveryone"
            />
            <label 
              htmlFor="clearForEveryone" 
              className="text-sm font-bold text-slate-700 cursor-pointer flex-1"
            >
              Clear for everyone
              <span className="block text-xs text-slate-500 font-normal mt-0.5">
                This will delete all messages for both you and {activeChatUser ? activeChatUser.name : activeGroup?.name}
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowClearHistoryModal(false); setClearHistoryForEveryone(false); }}
              className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClearHistory}
              className="flex-1 py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delete Message Modal
  if (messageToDelete) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800">Delete Message</h3>
            <button 
              onClick={() => { setMessageToDelete(null); setDeleteForEveryone(false); }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to delete this message?
          </p>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-6">
            <input
              type="checkbox"
              checked={deleteForEveryone}
              onChange={(e) => setDeleteForEveryone(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              id="deleteForEveryone"
            />
            <label 
              htmlFor="deleteForEveryone" 
              className="text-sm font-bold text-slate-700 cursor-pointer flex-1"
            >
              Delete for everyone
              <span className="block text-xs text-slate-500 font-normal mt-0.5">
                This will delete the message for both you and the recipient
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setMessageToDelete(null); setDeleteForEveryone(false); }}
              className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Image/Video Viewer Modal
  if (viewingMedia) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={() => setViewingMedia(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm z-10"
          >
            <X size={24} />
          </button>
          {viewingMedia.type === 'image' ? (
            <img
              src={viewingMedia.url}
              alt={viewingMedia.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={viewingMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-full"
            >
              Your browser does not support the video tag.
            </video>
          )}
          <button
            onClick={() => handleAutoSaveMedia(viewingMedia.url, viewingMedia.name, viewingMedia.type)}
            className="absolute bottom-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm"
            title="Save to gallery"
          >
            <Download size={24} />
          </button>
        </div>
      </div>
    );
  }

  // Permission Modal
  if (showPermissionModal) {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <Camera size={32} className="text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Camera & Microphone Access Required</h2>
            <p className="text-sm text-slate-600">To make calls, we need access to your camera and microphone.</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-sm text-slate-800 mb-3">How to Allow Permissions:</h3>
            
            {isMobile ? (
              <div className="space-y-3 text-xs text-slate-700">
                {isChrome || (isMobile && !isSafari) ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <p>Look for the permission popup at the top or bottom of your screen</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <p>Tap <strong>"Allow"</strong> or <strong>"Allow access"</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">3.</span>
                      <p>If you don't see the popup, check your browser settings</p>
                    </div>
                  </>
                ) : isSafari ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <p>Tap the <strong>AA</strong> icon in the address bar</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <p>Select <strong>"Website Settings"</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">3.</span>
                      <p>Enable <strong>"Camera"</strong> and <strong>"Microphone"</strong></p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <p>Look for the permission popup</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <p>Tap <strong>"Allow"</strong></p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700">
                {isChrome ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <p>Look for the <strong>camera/microphone icon</strong> in the address bar (left side)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <p>Click it and select <strong>"Always allow"</strong> for camera and microphone</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">3.</span>
                      <p>Or go to: <strong>Settings → Privacy → Site Settings → Camera/Microphone</strong></p>
                    </div>
                  </>
                ) : isFirefox ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <p>Look for the permission popup in the address bar</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <p>Click <strong>"Allow"</strong> for camera and microphone</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">3.</span>
                      <p>Or go to: <strong>Preferences → Privacy → Permissions → Camera/Microphone</strong></p>
                    </div>
                  </>
                ) : isSafari ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <p>Go to: <strong>Safari → Preferences → Websites</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <p>Select <strong>"Camera"</strong> and <strong>"Microphone"</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">3.</span>
                      <p>Set this website to <strong>"Allow"</strong></p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">1.</span>
                      <p>Look for the permission popup in your browser</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-orange-600">2.</span>
                      <p>Click <strong>"Allow"</strong> for camera and microphone</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPermissionModal(false);
                setPermissionError(null);
              }}
              className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRequestPermissions(permissionError === 'CAMERA_DENIED' || permissionError?.includes('video'))}
              className="flex-1 py-3 px-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Incoming call UI
  if (incomingCall) {
    const caller = allUsers.find(u => u.id === incomingCall.from);
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full mx-auto mb-8 ring-8 ring-orange-600/30 animate-pulse overflow-hidden flex items-center justify-center bg-orange-600">
            {caller && caller.profilePhoto ? (
              <img 
                src={caller.profilePhoto} 
                alt={caller.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {incomingCall.type === 'video' ? <Camera size={48} className="text-white" /> : <Phone size={48} className="text-white" />}
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {caller?.name || 'Unknown User'}
          </h2>
          <p className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-8 animate-pulse">
            Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call
          </p>
          
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={rejectCall}
              className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-900/50 active:scale-90 transition-all hover:bg-rose-700"
              title="Decline"
            >
              <PhoneOff size={28} />
            </button>
            <button
              onClick={answerCall}
              className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/50 active:scale-90 transition-all hover:bg-emerald-700 animate-pulse"
              title="Answer"
            >
              <Phone size={32} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-12 mt-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Decline</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Answer</span>
          </div>
        </div>
      </div>
    );
  }

  if (showCallOverlay) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between p-10 animate-in fade-in zoom-in">
        <div className="text-center mt-10">
          <div className="w-24 h-24 bg-orange-600 rounded-full mx-auto flex items-center justify-center mb-6 ring-4 ring-orange-600/20">
            {showCallOverlay.type === 'video' ? <Camera size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {showCallOverlay.groupId ? groups.find(g => g.id === showCallOverlay.groupId)?.name : activeChatUser?.name}
          </h2>
          <p className="text-orange-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            {showCallOverlay.type === 'video' ? 'Video Conference' : 'Audio Channel'} Active
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
           <div className="bg-slate-800 p-6 rounded-3xl grid grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all active:scale-95 ${
                    isMuted ? 'bg-rose-600' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <Mic size={24} />
                </button>
                <span className="text-[10px] text-slate-400 font-bold">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>
              {showCallOverlay.type === 'video' && (
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all active:scale-95 ${
                      isVideoOff ? 'bg-rose-600' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <Camera size={24} />
                  </button>
                  <span className="text-[10px] text-slate-400 font-bold">{isVideoOff ? 'Show' : 'Hide'}</span>
                </div>
              )}
           </div>
           
           <button 
             onClick={endCall}
             className="w-20 h-20 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-900/50 active:scale-90 transition-all hover:bg-rose-700"
             title="End Call"
           >
             <PhoneOff size={32} />
           </button>
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">End Call</span>
        </div>
      </div>
    );
  }

  if (activeChatUser || activeGroup) {
    const title = activeChatUser ? activeChatUser.name : activeGroup?.name;
    const subtitle = activeChatUser ? `@${activeChatUser.username}` : `${activeGroup?.members.length} members`;
    const initial = activeChatUser ? activeChatUser.name.charAt(0) : '#';

    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveChatUser(null); setActiveGroup(null); setReplyingTo(null); }} className="p-2 bg-white rounded-xl border border-slate-100 text-slate-500 shadow-sm">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              {activeChatUser ? (
                renderUserAvatar(activeChatUser, 'sm')
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm bg-slate-900 text-white`}>
                  #
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowClearHistoryModal(true)}
              className="p-2.5 text-slate-400 hover:text-rose-600 transition-colors"
              title="Clear chat history"
            >
              <Trash size={18} />
            </button>
            <button onClick={() => handleCall('audio')} className="p-2.5 text-slate-400 hover:text-orange-600 transition-colors">
              <Phone size={18} />
            </button>
            <button onClick={() => handleCall('video')} className="p-2.5 text-slate-400 hover:text-orange-600 transition-colors">
              <Video size={18} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar mb-4">
          {conversationMessages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            const repliedMessage = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
            return (
              <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                {activeGroup && !isMe && (
                  <span className="text-[8px] font-bold text-slate-400 ml-1 mb-1 uppercase">
                    {userMap[msg.senderId] || 'User'}
                  </span>
                )}
                <div className={`relative max-w-[85%] rounded-2xl text-xs font-medium shadow-sm transition-all group-hover:pr-14 ${
                  msg.attachment && (msg.attachment.type.startsWith('image/') || msg.attachment.type.startsWith('video/'))
                    ? (isMe ? 'bg-transparent p-0' : 'bg-transparent p-0')
                    : (isMe 
                        ? 'bg-orange-600 text-white rounded-tr-none p-3' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none p-3')
                }`}>
                  {repliedMessage && !msg.attachment && (
                    <div className={`mb-2 p-2 rounded-lg border-l-4 text-[10px] ${isMe ? 'bg-black/10 border-white/40' : 'bg-slate-50 border-orange-500'} italic truncate`}>
                      <span className="font-bold block not-italic mb-1 opacity-70">Replying to {userMap[repliedMessage.senderId] || 'User'}</span>
                      {repliedMessage.text}
                    </div>
                  )}

                  {msg.attachment && (
                    <div className="mb-1">
                      {msg.attachment.type.startsWith('image/') ? (
                        <div className="rounded-xl overflow-hidden max-w-[250px] shadow-md relative group">
                          <img 
                            src={msg.attachment.data} 
                            alt={msg.attachment.name}
                            className="w-full h-auto object-cover cursor-pointer"
                            onClick={() => {
                              setViewingMedia({
                                url: msg.attachment!.data,
                                type: 'image',
                                name: msg.attachment!.name
                              });
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoSaveMedia(msg.attachment!.data, msg.attachment!.name, 'image');
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Save to gallery"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ) : msg.attachment.type.startsWith('video/') ? (
                        <div className="rounded-xl overflow-hidden max-w-[250px] shadow-md relative group">
                          <video 
                            src={msg.attachment.data} 
                            controls
                            className="w-full h-auto"
                            style={{ maxHeight: '300px' }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setViewingMedia({
                                url: msg.attachment!.data,
                                type: 'video',
                                name: msg.attachment!.name
                              });
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoSaveMedia(msg.attachment!.data, msg.attachment!.name, 'video');
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Save to gallery"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-xl flex items-center gap-3 max-w-[250px] ${isMe ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-orange-100'}`}>
                            {msg.attachment.type === 'application/pdf' ? (
                              <FileText size={20} className={isMe ? 'text-white' : 'text-orange-600'} />
                            ) : (
                              <FileText size={20} className={isMe ? 'text-white' : 'text-slate-600'} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-800 truncate">{msg.attachment.name}</p>
                            <p className="text-[8px] text-slate-400 font-medium">
                              {msg.attachment.type === 'application/pdf' ? 'PDF Document' : 
                               msg.attachment.type.includes('word') ? 'Word Document' :
                               msg.attachment.type.includes('excel') || msg.attachment.type.includes('spreadsheet') ? 'Spreadsheet' :
                               'Document'}
                            </p>
                          </div>
                          <a 
                            href={msg.attachment.data} 
                            download={msg.attachment.name} 
                            className={`p-2 rounded-lg transition-all ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                            title="Download"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {msg.text && (
                    <div className={msg.attachment && (msg.attachment.type.startsWith('image/') || msg.attachment.type.startsWith('video/')) 
                      ? `mt-2 p-2 rounded-lg ${isMe ? 'bg-orange-600 text-white' : 'bg-white text-slate-700 border border-slate-100'}` 
                      : ''}>
                      <p className="leading-relaxed whitespace-pre-wrap">{renderTextWithMentions(msg.text)}</p>
                    </div>
                  )}

                  <div className={`text-[8px] mt-1 opacity-60 text-right flex items-center justify-end gap-1`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && renderStatus(msg.status)}
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className="p-1.5 text-slate-300 hover:text-white transition-colors"
                      title="Reply"
                    >
                      <Reply size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        setMessageToDelete(msg);
                        setDeleteForEveryone(false);
                      }}
                      className={`p-1.5 transition-colors ${isMe ? 'text-rose-300 hover:text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="flex items-center gap-2 text-slate-400 animate-pulse">
              <div className="flex gap-1 px-3 py-2 bg-white border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-bold">
                  {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}
        </div>

        {replyingTo && (
          <div className="p-3 bg-white border border-slate-100 rounded-t-2xl flex items-center justify-between mb-1 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 border-l-4 border-orange-500 pl-3 overflow-hidden">
               <div className="flex-1 truncate">
                 <p className="text-[10px] font-bold text-orange-600 uppercase">Replying to {userMap[replyingTo.senderId]}</p>
                 <p className="text-[11px] text-slate-500 truncate">{replyingTo.text || (replyingTo.attachment ? 'Attachment' : 'Message')}</p>
               </div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-rose-500">
              <X size={18} />
            </button>
          </div>
        )}

        {attachment && (
          <div className="mb-1">
            {attachment.type.startsWith('image/') ? (
              <div className="relative bg-white border border-slate-100 rounded-t-2xl p-2">
                <img 
                  src={attachment.data} 
                  alt={attachment.name}
                  className="w-full max-w-[200px] h-auto rounded-lg object-cover"
                />
                <button 
                  onClick={() => setAttachment(null)} 
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ) : attachment.type.startsWith('video/') ? (
              <div className="relative bg-white border border-slate-100 rounded-t-2xl p-2">
                <video 
                  src={attachment.data} 
                  className="w-full max-w-[200px] h-auto rounded-lg"
                  controls
                >
                  Your browser does not support the video tag.
                </video>
                <button 
                  onClick={() => setAttachment(null)} 
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="p-3 bg-white border border-slate-100 rounded-t-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  {attachment.type === 'application/pdf' ? (
                    <FileText size={18} className="text-orange-600" />
                  ) : (
                    <FileText size={18} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{attachment.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {attachment.type === 'application/pdf' ? 'PDF Document' : 
                     attachment.type.includes('word') ? 'Word Document' :
                     attachment.type.includes('excel') || attachment.type.includes('spreadsheet') ? 'Spreadsheet' :
                     'Document'}
                  </p>
                </div>
                <button 
                  onClick={() => setAttachment(null)} 
                  className="text-slate-400 hover:text-rose-500 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-orange-600 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="relative flex-1">
             <input 
              className="w-full bg-transparent p-3 text-sm focus:ring-0"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => handleMessageChange(e.target.value)}
            />
          </div>
          <button type="submit" className="p-3 bg-orange-600 text-white rounded-xl active:scale-95 transition-all">
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Enterprise Chat</h2>
          <p className="text-xs text-slate-400 font-medium">Connect with SRJ Personnel</p>
        </div>
        {canCreateGroup && (
          <button 
            onClick={() => setIsCreatingGroup(!isCreatingGroup)}
            className={`p-2.5 rounded-xl border transition-all ${isCreatingGroup ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-100'}`}
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {isCreatingGroup && (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!groupName.trim()) return;
          onCreateGroup(groupName, groupDesc);
          setGroupName('');
          setGroupDesc('');
          setIsCreatingGroup(false);
        }} className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm animate-in slide-in-from-top-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Launch Work Group</h3>
          <input 
            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-bold"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <textarea 
            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm resize-none"
            placeholder="Group Objective"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
          />
          <button type="submit" className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-100 active:scale-95 transition-all">
            Initialize Huddle
          </button>
        </form>
      )}

      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('direct')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${activeTab === 'direct' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
        >
          Personnel
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${activeTab === 'groups' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
        >
          Huddles
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input 
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 transition-all shadow-sm text-sm"
          placeholder={activeTab === 'direct' ? "Search by @username..." : "Search for groups..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {activeTab === 'direct' ? (
        <div className="space-y-3">
          {searchQuery ? (
            filteredUsers.map(user => (
              <button key={user.id} onClick={() => setActiveChatUser(user)} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                  {renderUserAvatar(user, 'md')}
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">@{user.username}</p>
                  </div>
                </div>
                <MessageCircle size={18} className="text-slate-300 group-hover:text-orange-600" />
              </button>
            ))
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Recent threads</p>
              {recentDirectChats.map(user => (
                <button key={user.id} onClick={() => setActiveChatUser(user)} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    {renderUserAvatar(user, 'md')}
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-800">{user.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">@{user.username}</p>
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                </button>
              ))}
              {recentDirectChats.length === 0 && (
                <div className="py-20 text-center text-slate-300">
                  <UserIcon className="mx-auto mb-4 opacity-5" size={64} />
                  <p className="text-xs font-bold uppercase tracking-widest">No active personnel threads</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {searchQuery ? (
            filteredGroups.map(group => {
              const isMember = group.members.includes(currentUser.id);
              return (
                <div key={group.id} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black shadow-sm">
                      <Hash size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-800">{group.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{group.members.length} members</p>
                    </div>
                  </div>
                  {isMember ? (
                    <button onClick={() => setActiveGroup(group)} className="p-2 text-orange-600 bg-orange-50 rounded-lg">
                      <MessageCircle size={18} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => onJoinGroup(group.id)}
                      className="px-4 py-2 bg-orange-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md"
                    >
                      Join
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Active Huddles</p>
              {myGroups.map(group => (
                <button key={group.id} onClick={() => setActiveGroup(group)} className="w-full bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black">
                      <Hash size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-800">{group.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{group.members.length} members</p>
                    </div>
                  </div>
                  {group.activeCall ? (
                     <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full animate-pulse">
                        <Video size={14} />
                        <span className="text-[10px] font-black uppercase">Live</span>
                     </div>
                  ) : (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white" />
                  )}
                </button>
              ))}
              {myGroups.length === 0 && (
                <div className="py-20 text-center text-slate-300">
                  <Users className="mx-auto mb-4 opacity-5" size={64} />
                  <p className="text-xs font-bold uppercase tracking-widest">Join a group to huddle</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
