// WebRTC Service for Real Audio/Video Calling
// Uses browser's native WebRTC API for peer-to-peer connections

export interface CallSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
  from: string;
  to: string;
  data?: any;
  callId?: string;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onCallEnded: (() => void) | null = null;
  private onIceCandidate: ((candidate: RTCIceCandidate) => void) | null = null;

  constructor() {
    // Use free STUN servers for NAT traversal
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    this.onIceCandidate = null;
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        // Send ICE candidate via signaling
        this.onIceCandidate(event.candidate);
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'disconnected' || 
          this.peerConnection?.connectionState === 'failed' ||
          this.peerConnection?.connectionState === 'closed') {
        this.cleanup();
        if (this.onCallEnded) {
          this.onCallEnded();
        }
      }
    };
  }

  async startCall(isVideo: boolean): Promise<MediaStream> {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Edge.');
      }

      // Check if we're on HTTPS (required for getUserMedia in most browsers)
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
          console.warn('getUserMedia requires HTTPS in production. Current protocol:', protocol);
        }
      }

      // Check permissions first (if supported)
      try {
        if (navigator.permissions && navigator.permissions.query) {
          if (isVideo) {
            try {
              const cameraPermission = await (navigator.permissions as any).query({ name: 'camera' });
              if (cameraPermission && cameraPermission.state === 'denied') {
                throw new Error('Camera access is denied. Please enable camera permissions in your browser settings and reload the page.');
              }
            } catch (camError: any) {
              // Camera permission API might not be supported, continue
              console.warn('Camera permission check not available:', camError);
            }
          }
          try {
            const micPermission = await (navigator.permissions as any).query({ name: 'microphone' });
            if (micPermission && micPermission.state === 'denied') {
              throw new Error('Microphone access is denied. Please enable microphone permissions in your browser settings and reload the page.');
            }
          } catch (micError: any) {
            // Microphone permission API might not be supported, continue
            console.warn('Microphone permission check not available:', micError);
          }
        }
      } catch (permError: any) {
        // Permission API might not be supported or might fail, continue anyway
        console.warn('Permission check failed, continuing:', permError);
      }

      // Get user media (camera/microphone)
      const constraints: MediaStreamConstraints = {
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

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Verify we got the expected tracks
      const audioTracks = this.localStream.getAudioTracks();
      const videoTracks = this.localStream.getVideoTracks();
      
      if (audioTracks.length === 0) {
        throw new Error('No microphone found or microphone access was denied.');
      }
      
      if (isVideo && videoTracks.length === 0) {
        throw new Error('No camera found or camera access was denied.');
      }
      
      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      return this.localStream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to access camera/microphone. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone access was denied. Please:\n' +
          '1. Click the lock icon in your browser\'s address bar\n' +
          '2. Allow camera and microphone permissions\n' +
          '3. Reload the page and try again';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please:\n' +
          '1. Make sure your camera/microphone is connected\n' +
          '2. Check that no other application is using them\n' +
          '3. Try refreshing the page';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application. Please close other applications using your camera/microphone and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera/microphone settings are not supported. Trying with basic settings...';
        // Try with simpler constraints
        try {
          const simpleConstraints: MediaStreamConstraints = {
            audio: true,
            video: isVideo ? true : false
          };
          this.localStream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
          this.localStream.getTracks().forEach(track => {
            if (this.peerConnection) {
              this.peerConnection.addTrack(track, this.localStream!);
            }
          });
          return this.localStream;
        } catch (retryError: any) {
          errorMessage = 'Failed to access camera/microphone with basic settings. Please check your device permissions.';
          throw new Error(errorMessage);
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage += 'Please check your browser permissions and make sure your camera/microphone is connected.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async setRemoteOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Create answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  setOnCallEnded(callback: () => void) {
    this.onCallEnded = callback;
  }

  setOnIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidate = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  endCall() {
    this.cleanup();
  }

  private cleanup() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }
}

