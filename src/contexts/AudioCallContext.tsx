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

const getRtcConfig = (): RTCConfiguration => {
  const nodeProc = typeof globalThis !== 'undefined' && (globalThis as any).process ? (globalThis as any).process : undefined;
  const envTurnUrl = (import.meta as any).env?.VITE_TURN_URL || nodeProc?.env?.NEXT_PUBLIC_TURN_URL || '';
  const envTurnUser = (import.meta as any).env?.VITE_TURN_USERNAME || nodeProc?.env?.NEXT_PUBLIC_TURN_USERNAME || '';
  const envTurnCred = (import.meta as any).env?.VITE_TURN_CREDENTIAL || nodeProc?.env?.NEXT_PUBLIC_TURN_CREDENTIAL || '';

  // Check URL query param ?relay_only=true for TURN relay isolation testing
  const isRelayOnly = typeof window !== 'undefined' && window.location.search.includes('relay_only=true');

  const defaultTurnUser = '6dc76375a8c5a83541d57f49';
  const defaultTurnCred = 'DtPn0f2wyVPKJBmM';

  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Dedicated Production Metered TURN Relay Servers for Mobile 4G/5G Carrier NAT Traversal
    {
      urls: [
        'turn:global.relay.metered.ca:80',
        'turn:global.relay.metered.ca:443',
        'turns:global.relay.metered.ca:443?transport=tcp',
      ],
      username: envTurnUser || defaultTurnUser,
      credential: envTurnCred || defaultTurnCred,
    },
  ];

  if (envTurnUrl) {
    console.log('[WebRTC Debug] Custom TURN Server configured from environment variables:', envTurnUrl);
    iceServers.push({
      urls: envTurnUrl.split(','),
      username: envTurnUser || undefined,
      credential: envTurnCred || undefined,
    });
  }

  const config: RTCConfiguration = {
    iceServers,
    iceCandidatePoolSize: 10,
  };

  if (isRelayOnly) {
    console.warn('[WebRTC Diagnostics] 🧪 RELAY-ONLY TEST MODE ACTIVATED! Forcing iceTransportPolicy = "relay"');
    config.iceTransportPolicy = 'relay';
  }

  return config;
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
  const timerRef = useRef<any>(null);
  const ringtoneAudioCtxRef = useRef<AudioContext | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const ringtoneIntervalRef = useRef<any>(null);
  const signalChannelsMapRef = useRef<Map<string, any>>(new Map());

  // Unlock mobile browser audio hardware and pre-authorize HTMLAudioElement on user gesture
  const unlockAudioContext = useCallback(() => {
    try {
      if (!ringtoneAudioCtxRef.current) {
        ringtoneAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (ringtoneAudioCtxRef.current.state === 'suspended') {
        ringtoneAudioCtxRef.current.resume();
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        const p = remoteAudioRef.current.play();
        if (p !== undefined) {
          p.catch(() => {
            // Safe catch for pre-unlocking empty element on touch/click gesture
          });
        }
      }
      console.log('[WebRTC Diagnostics] Mobile Audio Hardware & Element unlocked on user gesture!');
    } catch (e) {
      console.error('[WebRTC Diagnostics] unlockAudioContext error:', e);
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
      console.log('[WebRTC Diagnostics] Attaching remote stream to HTMLAudioElement...');
      const audioEl = remoteAudioRef.current;
      audioEl.srcObject = remoteStreamRef.current;
      audioEl.muted = false;
      audioEl.volume = isSpeakerOn ? 1.0 : 0.4;

      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[WebRTC Diagnostics] ✅ HTMLAudioElement.play() SUCCESS! Remote voice playing loud and clear.');
          })
          .catch((err) => {
            console.warn('[WebRTC Diagnostics] HTMLAudioElement.play() blocked by browser autoplay policy:', err);
            const retryOnGesture = () => {
              if (remoteAudioRef.current && remoteStreamRef.current) {
                remoteAudioRef.current.srcObject = remoteStreamRef.current;
                remoteAudioRef.current.muted = false;
                remoteAudioRef.current.play().then(() => {
                  console.log('[WebRTC Diagnostics] ✅ Remote audio play resumed on user touch/click gesture!');
                }).catch(e => console.error('[WebRTC Diagnostics] Gesture play retry failed:', e));
              }
              window.removeEventListener('click', retryOnGesture);
              window.removeEventListener('touchstart', retryOnGesture);
            };
            window.addEventListener('click', retryOnGesture);
            window.addEventListener('touchstart', retryOnGesture);
          });
      }
    } else {
      console.warn('[WebRTC Diagnostics] startRemotePlayback missing remoteAudioRef or remoteStreamRef', {
        hasAudioEl: !!remoteAudioRef.current,
        hasStream: !!remoteStreamRef.current
      });
    }
  }, [isSpeakerOn]);

  // Cleanup WebRTC & Streams
  const cleanupCall = useCallback(() => {
    console.log('[WebRTC Debug] Cleaning up all call resources & WebRTC tracks...');
    stopRingtone();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[WebRTC Debug] Local audio track stopped:', track.id);
      });
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[WebRTC Debug] Remote audio track stopped:', track.id);
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

    // Unsubscribe cached signal channels
    outgoingSignalQueuesRef.current.forEach((rec) => {
      try { rec.channel.unsubscribe(); } catch {}
    });
    outgoingSignalQueuesRef.current.clear();

    setIsMuted(false);
    setIsSpeakerOn(true);
    setCallDuration(0);
    pendingOfferRef.current = null;
    iceCandidatesQueueRef.current = [];
  }, [stopRingtone]);

  const outgoingSignalQueuesRef = useRef<Map<string, { channel: any; isSubscribed: boolean; queue: any[] }>>(new Map());

  // Send Broadcast Signal via Persistent & Queued Supabase Channel
  const sendSignal = useCallback(async (targetUserId: string, type: string, payload: any) => {
    console.log(`[WebRTC Diagnostics] Outgoing Signal "${type}" to targetUser:`, targetUserId);
    const signalData = { type, callerId: user?.id, ...payload };

    let record = outgoingSignalQueuesRef.current.get(targetUserId);

    if (!record) {
      const channel = supabase.channel(`call-signaling-${targetUserId}`);
      record = { channel, isSubscribed: false, queue: [signalData] };
      outgoingSignalQueuesRef.current.set(targetUserId, record);

      channel.subscribe((status: string) => {
        console.log(`[WebRTC Diagnostics] Signal Channel Status for ${targetUserId}:`, status);
        if (status === 'SUBSCRIBED') {
          if (record) {
            record.isSubscribed = true;
            // Flush all pending queued candidates / signals
            console.log(`[WebRTC Diagnostics] Flushing ${record.queue.length} pending signals for ${targetUserId}...`);
            while (record.queue.length > 0) {
              const item = record.queue.shift();
              channel.send({
                type: 'broadcast',
                event: 'call-signal',
                payload: item,
              });
            }
          }
        }
      });
    } else {
      if (record.isSubscribed) {
        record.channel.send({
          type: 'broadcast',
          event: 'call-signal',
          payload: signalData,
        });
      } else {
        console.log(`[WebRTC Diagnostics] Channel subscribing... Queuing signal "${type}"`);
        record.queue.push(signalData);
      }
    }
  }, [user?.id]);

  // Process Queued ICE Candidates
  const processIceQueue = useCallback(async () => {
    if (!pcRef.current) return;
    const pc = pcRef.current;
    if (!pc.remoteDescription || !pc.remoteDescription.type) {
      console.log('[WebRTC Diagnostics] RemoteDescription not ready yet, keeping candidates queued');
      return;
    }
    console.log(`[WebRTC Diagnostics] Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates...`);
    const queue = [...iceCandidatesQueueRef.current];
    iceCandidatesQueueRef.current = [];

    for (const candidate of queue) {
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC Diagnostics] Added queued ICE candidate successfully');
        } catch (e) {
          console.error('[WebRTC Diagnostics] Error adding queued ICE candidate, re-queuing:', e);
          iceCandidatesQueueRef.current.push(candidate);
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
    console.log('PeerConnection ICEGatheringState:', pc.iceGatheringState);
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
    console.log('Transceivers:', pc.getTransceivers().map(t => ({
      direction: t.direction,
      currentDirection: t.currentDirection,
      senderTrack: t.sender.track?.id,
      receiverTrack: t.receiver.track?.id
    })));
    console.log('-------------------------------------------');
  }, []);

  // Create Peer Connection with Media Event Listeners
  const createPeerConnection = useCallback((targetUserId: string) => {
    console.log('[WebRTC Debug] Creating RTCPeerConnection for target:', targetUserId);
    const config = getRtcConfig();
    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    console.log(`[WebRTC Diagnostics] Initializing Connection -> SignalingState: ${pc.signalingState}, ConnectionState: ${pc.connectionState}, ICEState: ${pc.iceConnectionState}`);

    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC Diagnostics] ICE Gathering State changed:', pc.iceGatheringState);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateObj = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
        const candidateType = event.candidate.type || (event.candidate.candidate.includes('typ relay') ? 'relay' : event.candidate.candidate.includes('typ srflx') ? 'srflx' : 'host');
        const protocol = event.candidate.protocol || (event.candidate.candidate.includes('tcp') ? 'TCP' : 'UDP');
        console.log(`[WebRTC Diagnostics] 📡 Local Candidate Generated -> Type: [${candidateType.toUpperCase()}] Protocol: ${protocol} Candidate: ${event.candidate.candidate}`);
        sendSignal(targetUserId, 'ice-candidate', { candidate: candidateObj });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC Diagnostics] 🎵 Remote Track Received -> Kind:', event.track.kind, 'ID:', event.track.id, 'Streams:', event.streams?.length);
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
      console.log('[WebRTC Diagnostics] ConnectionState changed:', pc.connectionState);
      inspectPeerConnection('connectionstatechange: ' + pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        startRemotePlayback();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        toast('Connection interrupted');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC Diagnostics] ICE ConnectionState changed:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        pc.getStats().then(stats => {
          const statsMap = stats as Map<string, any>;
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && (report.selected || report.state === 'succeeded' || report.nominated)) {
              const localCand = statsMap.get(report.localCandidateId);
              const remoteCand = statsMap.get(report.remoteCandidateId);
              console.log(`===================================================================`);
              console.log(`[WebRTC Diagnostics] ✅ SELECTED ICE CANDIDATE PAIR`);
              console.log(`Pair State: ${report.state} | Nominated: ${report.nominated}`);
              console.log(`Local Candidate  -> Type: [${localCand?.candidateType || 'unknown'}] Protocol: ${localCand?.protocol} (${localCand?.ip}:${localCand?.port})`);
              console.log(`Remote Candidate -> Type: [${remoteCand?.candidateType || 'unknown'}] Protocol: ${remoteCand?.protocol} (${remoteCand?.ip}:${remoteCand?.port})`);
              console.log(`Traffic Stats    -> Bytes Sent: ${report.bytesSent ?? 0} | Bytes Received: ${report.bytesReceived ?? 0}`);
              console.log(`===================================================================`);
            }
          });
        }).catch(e => console.error('[WebRTC Diagnostics] Error inspecting candidate-pair stats:', e));
      }
    };

    return pc;
  }, [sendSignal, startRemotePlayback, inspectPeerConnection]);

  // Capture Microphone Audio Stream
  const getMicrophoneStream = useCallback(async (): Promise<MediaStream> => {
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
      const audioTracks = stream.getAudioTracks();
      console.log('[WebRTC Debug] getUserMedia SUCCESS. Stream ID:', stream.id);
      audioTracks.forEach(track => {
        console.log(`[WebRTC Debug] Microphone Track -> ID: ${track.id}, Label: "${track.label}", Enabled: ${track.enabled}, ReadyState: ${track.readyState}`);
      });
      return stream;
    } catch (e: any) {
      console.error('[WebRTC Debug] getUserMedia FAILED:', e);
      toast.error('Microphone access denied or unavailable: ' + (e.message || 'Error'));
      throw e;
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
            console.log('[WebRTC Debug] Caller setRemoteDescription SUCCESS!');
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

      // Add local audio tracks to peer connection
      const tracks = stream.getAudioTracks();
      tracks.forEach(track => {
        console.log(`[WebRTC Debug] Adding local audio track to Caller PeerConnection -> ID: ${track.id}, Enabled: ${track.enabled}, ReadyState: ${track.readyState}`);
        pc.addTrack(track, stream);
      });

      inspectPeerConnection('Caller tracks added');

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      console.log('[WebRTC Debug] Caller created SDP Offer SUCCESS');
      await pc.setLocalDescription(offer);

      sendSignal(targetUser.id, 'offer', {
        sdp: offer,
        conversationId: convId,
        callerUser: {
          id: user.id,
          full_name: user.full_name || (user as any).user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.avatar_url || (user as any).user_metadata?.avatar_url,
        },
      });

      startRingtone();
    } catch (err: any) {
      console.error('[WebRTC Debug] initiateCall error:', err);
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

      // Add Answerer's local microphone tracks BEFORE creating Answer SDP!
      const tracks = stream.getAudioTracks();
      tracks.forEach(track => {
        console.log(`[WebRTC Debug] Adding local audio track to Answerer PeerConnection -> ID: ${track.id}, Enabled: ${track.enabled}, ReadyState: ${track.readyState}`);
        pc.addTrack(track, stream);
      });

      console.log('[WebRTC Debug] Answerer setting RemoteDescription (Caller Offer)...');
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current.sdp));
      console.log('[WebRTC Debug] Answerer setRemoteDescription SUCCESS!');

      // Process any ICE candidates received while call was ringing
      await processIceQueue();

      inspectPeerConnection('Answerer remote description set');

      const answer = await pc.createAnswer({ offerToReceiveAudio: true });
      console.log('[WebRTC Debug] Answerer created SDP Answer SUCCESS');
      await pc.setLocalDescription(answer);

      sendSignal(activeTargetUser.id, 'answer', { sdp: answer });
      setCallState('connected');
      startRemotePlayback();
    } catch (err: any) {
      console.error('[WebRTC Debug] acceptCall error:', err);
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
          console.log(`[WebRTC Debug] Audio track ${track.id} enabled set to:`, track.enabled);
        });
        setIsMuted(nextMutedState);
        toast(nextMutedState ? 'Microphone muted' : 'Microphone unmuted');
      }
    }
  }, [isMuted]);

  // Toggle Speaker Output Volume / setSinkId
  const toggleSpeaker = useCallback(async () => {
    const nextSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(nextSpeakerState);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextSpeakerState ? 1.0 : 0.3;
      console.log('[WebRTC Debug] Speaker volume set to:', remoteAudioRef.current.volume);

      const audioEl = remoteAudioRef.current as any;
      if (typeof audioEl.setSinkId === 'function') {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
            console.log('[WebRTC Debug] Available audio output devices:', audioOutputs);
            if (audioOutputs.length > 0) {
              const targetDevice = nextSpeakerState
                ? (audioOutputs.find(d => d.label.toLowerCase().includes('speaker') || d.label.toLowerCase().includes('loud')) || audioOutputs[0])
                : audioOutputs[0];
              if (targetDevice && targetDevice.deviceId) {
                await audioEl.setSinkId(targetDevice.deviceId);
                console.log('[WebRTC Debug] setSinkId success:', targetDevice.label || targetDevice.deviceId);
              }
            }
          }
        } catch (sinkErr) {
          console.warn('[WebRTC Debug] setSinkId error (using default browser routing):', sinkErr);
        }
      }
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

      {/* Real HTMLAudioElement mounted in DOM for WebRTC remote playback */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: 0, width: '1px', height: '1px', opacity: 0.01, pointerEvents: 'none' }}
      />

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
