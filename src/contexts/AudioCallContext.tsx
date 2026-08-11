import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallUser {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface AudioCallContextType {
  callState: CallState;
  activeTargetUser: CallUser | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  initiateCall: (targetUser: CallUser, conversationId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
}

const AudioCallContext = createContext<AudioCallContextType>({
  callState: 'idle',
  activeTargetUser: null,
  isMuted: false,
  isSpeakerOn: true,
  callDuration: 0,
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleSpeaker: () => {},
});

export const useAudioCall = () => useContext(AudioCallContext);

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Free OpenRelay TURN Relay Servers for Mobile 4G/5G Carrier NAT Traversal
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export const AudioCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeTargetUser, setActiveTargetUser] = useState<CallUser | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneAudioCtxRef = useRef<AudioContext | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Unlock browser audio hardware on user gesture
  const unlockAudioContext = useCallback(() => {
    try {
      if (!ringtoneAudioCtxRef.current) {
        ringtoneAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (ringtoneAudioCtxRef.current.state === 'suspended') {
        ringtoneAudioCtxRef.current.resume();
      }
      console.log('[WebRTC Debug] AudioContext state:', ringtoneAudioCtxRef.current.state);
    } catch (e) {
      console.error('[WebRTC Debug] unlockAudioContext error:', e);
    }
  }, []);

  // Stop looping ringtone
  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, []);

  // Synthesize realistic looping telephone bell sound using Web Audio API
  const startRingtone = useCallback(() => {
    stopRingtone();
    unlockAudioContext();

    const playSingleRing = () => {
      try {
        const ctx = ringtoneAudioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
        ringtoneAudioCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;

        // Dual Tone PSTN / WhatsApp style Ringtone (440 Hz + 480 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 1.8);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);
        gain2.gain.setValueAtTime(0.25, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 1.8);
      } catch {}
    };

    playSingleRing();
    ringtoneIntervalRef.current = setInterval(playSingleRing, 3200);
  }, [unlockAudioContext, stopRingtone]);

  // Play audio stream with retry for browser autoplay policies
  const startRemotePlayback = useCallback(() => {
    if (remoteAudioRef.current && remoteStreamRef.current) {
      console.log('[WebRTC Debug] Starting remote audio playback...');
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.4;

      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[WebRTC Debug] Remote audio playing loud and clear!');
          })
          .catch((err) => {
            console.warn('[WebRTC Debug] Autoplay blocked, attaching gesture retry:', err);
            const retryOnGesture = () => {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.play().then(() => {
                  console.log('[WebRTC Debug] Playback resumed on gesture!');
                }).catch(e => console.error('[WebRTC Debug] Retry failed:', e));
              }
              window.removeEventListener('click', retryOnGesture);
              window.removeEventListener('touchstart', retryOnGesture);
            };
            window.addEventListener('click', retryOnGesture);
            window.addEventListener('touchstart', retryOnGesture);
          });
      }
    }
  }, [isSpeakerOn]);

  // Cleanup WebRTC & Streams
  const cleanupCall = useCallback(() => {
    console.log('[WebRTC Debug] Cleaning up call resources...');
    stopRingtone();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[WebRTC Debug] Stopped local track:', track.id);
      });
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[WebRTC Debug] Stopped remote track:', track.id);
      });
      remoteStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setIsMuted(false);
    setIsSpeakerOn(true);
    setCallDuration(0);
    pendingOfferRef.current = null;
    iceCandidatesQueueRef.current = [];
  }, [stopRingtone]);

  // Send Broadcast Signal via Supabase
  const sendSignal = useCallback(async (targetUserId: string, type: string, payload: any) => {
    console.log(`[WebRTC Debug] Sending signal "${type}" to targetUser:`, targetUserId);
    const channel = supabase.channel(`call-signaling-${targetUserId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'call-signal',
          payload: { type, callerId: user?.id, ...payload },
        });
        setTimeout(() => channel.unsubscribe(), 1000);
      }
    });
  }, [user?.id]);

  // Process Queued ICE Candidates
  const processIceQueue = useCallback(async () => {
    if (!pcRef.current) return;
    console.log(`[WebRTC Debug] Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates...`);
    while (iceCandidatesQueueRef.current.length > 0) {
      const candidate = iceCandidatesQueueRef.current.shift();
      if (candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC Debug] Added queued ICE candidate');
        } catch (e) {
          console.error('[WebRTC Debug] Error adding queued ICE candidate:', e);
        }
      }
    }
  }, []);

  // Inspect PeerConnection Senders/Receivers/Transceivers
  const inspectPeerConnection = useCallback((label: string) => {
    if (!pcRef.current) return;
    const pc = pcRef.current;
    console.log(`--- [WebRTC Debug Inspection: ${label}] ---`);
    console.log('PeerConnection ConnectionState:', pc.connectionState);
    console.log('PeerConnection ICEConnectionState:', pc.iceConnectionState);
    console.log('Senders:', pc.getSenders().map(s => ({
      trackId: s.track?.id,
      kind: s.track?.kind,
      enabled: s.track?.enabled,
      readyState: s.track?.readyState
    })));
    console.log('Receivers:', pc.getReceivers().map(r => ({
      trackId: r.track?.id,
      kind: r.track?.kind,
      enabled: r.track?.enabled,
      readyState: r.track?.readyState
    })));
    console.log('-------------------------------------------');
  }, []);

  // Create Peer Connection with Media Event Listeners
  const createPeerConnection = useCallback((targetUserId: string) => {
    console.log('[WebRTC Debug] Creating RTCPeerConnection for target:', targetUserId);
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC Debug] Local ICE candidate generated:', event.candidate.candidate);
        sendSignal(targetUserId, 'ice-candidate', { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC Debug] Remote track received event!', event.track.kind, event.track.id, event.streams);
      let stream: MediaStream;
      if (event.streams && event.streams[0]) {
        stream = event.streams[0];
      } else {
        stream = new MediaStream([event.track]);
      }
      remoteStreamRef.current = stream;

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        startRemotePlayback();
      }
      inspectPeerConnection('ontrack fired');
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC Debug] PeerConnection state changed:', pc.connectionState);
      inspectPeerConnection('connectionstatechange: ' + pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        startRemotePlayback();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        toast('Connection interrupted');
      }
    };

    return pc;
  }, [sendSignal, startRemotePlayback, inspectPeerConnection]);

  // Capture Microphone Audio Stream with Graceful Fallback for Broken Laptop Microphones
  const getMicrophoneStream = useCallback(async (): Promise<MediaStream | null> => {
    console.log('[WebRTC Debug] Requesting getUserMedia audio stream...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      console.log('[WebRTC Debug] Local microphone stream obtained:', stream.id);
      return stream;
    } catch (e) {
      console.warn('[WebRTC Debug] High-quality getUserMedia failed, trying fallback:', e);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('[WebRTC Debug] Fallback microphone stream obtained:', fallbackStream.id);
        return fallbackStream;
      } catch (err) {
        console.warn('[WebRTC Debug] Laptop microphone is unavailable or broken! Operating in recvonly speaker mode:', err);
        return null; // Return null so speaker playback still functions for incoming audio!
      }
    }
  }, []);

  // Listen for Incoming Signals
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`call-signaling-${user.id}`);

    channel
      .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
        if (!payload) return;
        console.log(`[WebRTC Debug] Received broadcast signal "${payload.type}" from callerId:`, payload.callerId);

        if (payload.type === 'offer') {
          setActiveTargetUser(payload.callerUser);
          setConversationId(payload.conversationId);
          pendingOfferRef.current = payload;
          setCallState('ringing');
          startRingtone();

          // Push Web Notification for mobile / background
          if ('Notification' in window && Notification.permission === 'granted') {
            const notifOptions = {
              body: `Incoming audio call from ${payload.callerUser?.full_name || 'User'}`,
              icon: payload.callerUser?.avatar_url || '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: `call-${payload.conversationId}`,
              data: { url: `/chat?conv=${payload.conversationId}` },
              vibrate: [500, 200, 500, 200, 500],
            };
            if ('serviceWorker' in navigator) {
              try {
                const reg = await navigator.serviceWorker.ready;
                if (reg && reg.showNotification) {
                  await reg.showNotification(`📞 Call from ${payload.callerUser?.full_name}`, notifOptions);
                }
              } catch {}
            }
          }
        } else if (payload.type === 'answer') {
          console.log('[WebRTC Debug] Received SDP Answer from receiver!');
          stopRingtone();
          if (pcRef.current && payload.sdp) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            console.log('[WebRTC Debug] Caller setRemoteDescription success!');
            await processIceQueue();
            inspectPeerConnection('Caller setRemoteDescription');
            setCallState('connected');
            startRemotePlayback();
          }
        } else if (payload.type === 'ice-candidate') {
          if (payload.candidate) {
            console.log('[WebRTC Debug] Received ICE candidate signal:', payload.candidate.candidate);
            if (pcRef.current && pcRef.current.remoteDescription) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                console.log('[WebRTC Debug] Successfully added ICE candidate directly');
              } catch (e) {
                console.error('[WebRTC Debug] Error adding ICE candidate directly:', e);
              }
            } else {
              console.log('[WebRTC Debug] RemoteDescription not set yet, queuing ICE candidate');
              iceCandidatesQueueRef.current.push(payload.candidate);
            }
          }
        } else if (payload.type === 'rejected') {
          stopRingtone();
          toast.error('Call declined');
          setCallState('ended');
          setTimeout(() => {
            setCallState('idle');
            setActiveTargetUser(null);
            cleanupCall();
          }, 1200);
        } else if (payload.type === 'ended') {
          stopRingtone();
          toast('Call ended');
          setCallState('ended');
          setTimeout(() => {
            setCallState('idle');
            setActiveTargetUser(null);
            cleanupCall();
          }, 1200);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, startRingtone, stopRingtone, cleanupCall, processIceQueue, startRemotePlayback, inspectPeerConnection]);

  // Call Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Initiate Outgoing Call (Caller Side)
  const initiateCall = useCallback(async (targetUser: CallUser, convId: string) => {
    if (!user) return;
    console.log('[WebRTC Debug] Initiating call to:', targetUser.full_name, targetUser.id);
    unlockAudioContext();
    try {
      setActiveTargetUser(targetUser);
      setConversationId(convId);
      setCallState('calling');

      const stream = await getMicrophoneStream();
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetUser.id);

      if (stream && stream.getAudioTracks().length > 0) {
        stream.getAudioTracks().forEach(track => {
          console.log('[WebRTC Debug] Adding local audio track to Caller PeerConnection:', track.id);
          pc.addTrack(track, stream);
        });
      } else {
        console.warn('[WebRTC Debug] No local microphone tracks, adding recvonly transceiver');
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      inspectPeerConnection('Caller tracks added');

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      console.log('[WebRTC Debug] Caller created SDP Offer:', offer.sdp);
      await pc.setLocalDescription(offer);

      sendSignal(targetUser.id, 'offer', {
        sdp: offer,
        conversationId: convId,
        callerUser: {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url,
        },
      });

      startRingtone();
    } catch (err: any) {
      console.error('[WebRTC Debug] initiateCall error:', err);
      toast.error('Could not start call');
      setCallState('idle');
      setActiveTargetUser(null);
      cleanupCall();
    }
  }, [user, getMicrophoneStream, sendSignal, createPeerConnection, startRingtone, cleanupCall, unlockAudioContext, inspectPeerConnection]);

  // Accept Incoming Call (Answerer Side)
  const acceptCall = useCallback(async () => {
    if (!user || !pendingOfferRef.current || !activeTargetUser) {
      console.error('[WebRTC Debug] acceptCall missing user or pendingOffer!');
      return;
    }
    console.log('[WebRTC Debug] Receiver accepting call from:', activeTargetUser.full_name);
    stopRingtone();
    unlockAudioContext();
    try {
      const stream = await getMicrophoneStream();
      localStreamRef.current = stream;

      const pc = createPeerConnection(activeTargetUser.id);

      if (stream && stream.getAudioTracks().length > 0) {
        stream.getAudioTracks().forEach(track => {
          console.log('[WebRTC Debug] Adding local audio track to Answerer PeerConnection:', track.id);
          pc.addTrack(track, stream);
        });
      } else {
        console.warn('[WebRTC Debug] Answerer microphone unavailable, adding recvonly transceiver so laptop speaker plays audio');
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      console.log('[WebRTC Debug] Answerer setting RemoteDescription (Caller Offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current.sdp));
      console.log('[WebRTC Debug] Answerer setRemoteDescription success!');

      // Process any ICE candidates received while call was ringing
      await processIceQueue();

      inspectPeerConnection('Answerer remote description set');

      const answer = await pc.createAnswer({ offerToReceiveAudio: true });
      console.log('[WebRTC Debug] Answerer created SDP Answer:', answer.sdp);
      await pc.setLocalDescription(answer);

      sendSignal(activeTargetUser.id, 'answer', { sdp: answer });
      setCallState('connected');
      startRemotePlayback();
    } catch (err: any) {
      console.error('[WebRTC Debug] acceptCall error:', err);
      toast.error('Could not answer call');
      rejectCall();
    }
  }, [user, activeTargetUser, getMicrophoneStream, sendSignal, createPeerConnection, processIceQueue, startRemotePlayback, unlockAudioContext, stopRingtone, inspectPeerConnection]);

  // Reject Incoming Call
  const rejectCall = useCallback(() => {
    console.log('[WebRTC Debug] Rejecting call');
    if (activeTargetUser) {
      sendSignal(activeTargetUser.id, 'rejected', {});
    }
    setCallState('idle');
    setActiveTargetUser(null);
    cleanupCall();
  }, [activeTargetUser, sendSignal, cleanupCall]);

  // End Active Call
  const endCall = useCallback(() => {
    console.log('[WebRTC Debug] Ending call');
    if (activeTargetUser) {
      sendSignal(activeTargetUser.id, 'ended', {});
    }
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setActiveTargetUser(null);
      cleanupCall();
    }, 1000);
  }, [activeTargetUser, sendSignal, cleanupCall]);

  // Toggle Mute Microphone
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMutedState = !isMuted;
        audioTracks.forEach(track => {
          track.enabled = !nextMutedState;
          console.log('[WebRTC Debug] Audio track enabled set to:', track.enabled);
        });
        setIsMuted(nextMutedState);
      }
    }
  }, [isMuted]);

  // Toggle Speaker Output Volume
  const toggleSpeaker = useCallback(() => {
    const nextSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(nextSpeakerState);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextSpeakerState ? 1.0 : 0.3;
      console.log('[WebRTC Debug] Speaker volume set to:', remoteAudioRef.current.volume);
    }
  }, [isSpeakerOn]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AudioCallContext.Provider
      value={{
        callState,
        activeTargetUser,
        isMuted,
        isSpeakerOn,
        callDuration,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleSpeaker,
      }}
    >
      {children}

      {/* Persistent Audio Element for WebRTC Remote Playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Incoming / Outgoing Call Modal Overlay */}
      <AnimatePresence>
        {callState !== 'idle' && activeTargetUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 flex flex-col items-center text-center"
            >
              {/* Avatar & Audio Visualizer Pulse */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                  {activeTargetUser.avatar_url ? (
                    <img src={activeTargetUser.avatar_url} alt={activeTargetUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    activeTargetUser.full_name?.charAt(0).toUpperCase()
                  )}
                </div>
                {callState === 'connected' && (
                  <span className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                    <Volume2 size={13} className="text-white animate-pulse" />
                  </span>
                )}
              </div>

              {/* User Name & Status */}
              <h3 className="text-xl font-bold text-white mb-1">{activeTargetUser.full_name}</h3>
              <p className="text-sm font-medium text-slate-400 mb-8">
                {callState === 'calling' && 'Calling…'}
                {callState === 'ringing' && 'Incoming Audio Call'}
                {callState === 'connected' && `Connected (${formatTime(callDuration)})`}
                {callState === 'ended' && 'Call Ended'}
              </p>

              {/* Action Buttons */}
              {callState === 'ringing' ? (
                <div className="flex items-center gap-6">
                  <button
                    onClick={rejectCall}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                    title="Decline"
                  >
                    <PhoneOff size={24} />
                  </button>
                  <button
                    onClick={acceptCall}
                    className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer animate-bounce"
                    title="Accept"
                  >
                    <Phone size={24} />
                  </button>
                </div>
              ) : callState === 'calling' || callState === 'connected' ? (
                <div className="flex items-center gap-4">
                  {/* Mute Button */}
                  <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isMuted ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={endCall}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                    title="End Call"
                  >
                    <PhoneOff size={24} />
                  </button>

                  {/* Speaker Button */}
                  <button
                    onClick={toggleSpeaker}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      !isSpeakerOn ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title={isSpeakerOn ? 'Speaker Loud' : 'Speaker Soft'}
                  >
                    {!isSpeakerOn ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AudioCallContext.Provider>
  );
};
