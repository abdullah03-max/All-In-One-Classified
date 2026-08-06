import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
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
  callDuration: number;
  initiateCall: (targetUser: CallUser, conversationId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

const AudioCallContext = createContext<AudioCallContextType>({
  callState: 'idle',
  activeTargetUser: null,
  isMuted: false,
  callDuration: 0,
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
});

export const useAudioCall = () => useContext(AudioCallContext);

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const AudioCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeTargetUser, setActiveTargetUser] = useState<CallUser | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneAudioCtxRef = useRef<AudioContext | null>(null);
  const pendingOfferRef = useRef<any>(null);

  // Synthesize Ringtone Sound using Web Audio API
  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneAudioCtxRef.current) {
        ringtoneAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ringtoneAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }, []);

  // Cleanup WebRTC & Streams
  const cleanupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setIsMuted(false);
    setCallDuration(0);
    pendingOfferRef.current = null;
  }, []);

  // Send Broadcast Signal via Supabase
  const sendSignal = useCallback(async (targetUserId: string, type: string, payload: any) => {
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

  // Listen for Incoming Signals
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`call-signaling-${user.id}`);
    channel
      .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
        if (!payload) return;

        if (payload.type === 'offer') {
          setActiveTargetUser(payload.callerUser);
          setConversationId(payload.conversationId);
          pendingOfferRef.current = payload;
          setCallState('ringing');
          playRingtone();
        } else if (payload.type === 'answer') {
          if (pcRef.current && payload.sdp) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallState('connected');
          }
        } else if (payload.type === 'ice-candidate') {
          if (pcRef.current && payload.candidate) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {}
          }
        } else if (payload.type === 'rejected') {
          toast.error('Call declined');
          setCallState('ended');
          setTimeout(() => {
            setCallState('idle');
            setActiveTargetUser(null);
            cleanupCall();
          }, 1500);
        } else if (payload.type === 'ended') {
          toast('Call ended');
          setCallState('ended');
          setTimeout(() => {
            setCallState('idle');
            setActiveTargetUser(null);
            cleanupCall();
          }, 1500);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, playRingtone, cleanupCall]);

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

  // Initiate Outgoing Call
  const initiateCall = useCallback(async (targetUser: CallUser, convId: string) => {
    if (!user) return;
    try {
      setActiveTargetUser(targetUser);
      setConversationId(convId);
      setCallState('calling');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(targetUser.id, 'ice-candidate', { candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      const offer = await pc.createOffer();
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

      playRingtone();
    } catch (err: any) {
      toast.error('Could not access microphone');
      setCallState('idle');
      setActiveTargetUser(null);
      cleanupCall();
    }
  }, [user, sendSignal, playRingtone, cleanupCall]);

  // Accept Incoming Call
  const acceptCall = useCallback(async () => {
    if (!user || !pendingOfferRef.current || !activeTargetUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(activeTargetUser.id, 'ice-candidate', { candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current.sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal(activeTargetUser.id, 'answer', { sdp: answer });
      setCallState('connected');
    } catch (err: any) {
      toast.error('Could not access microphone');
      rejectCall();
    }
  }, [user, activeTargetUser, sendSignal]);

  // Reject Incoming Call
  const rejectCall = useCallback(() => {
    if (activeTargetUser) {
      sendSignal(activeTargetUser.id, 'rejected', {});
    }
    setCallState('idle');
    setActiveTargetUser(null);
    cleanupCall();
  }, [activeTargetUser, sendSignal, cleanupCall]);

  // End Active Call
  const endCall = useCallback(() => {
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

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

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
        callDuration,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
      }}
    >
      {children}

      {/* Hidden audio element for remote WebRTC audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

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
              {/* Avatar & Pulse */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                  {activeTargetUser.avatar_url ? (
                    <img src={activeTargetUser.avatar_url} alt={activeTargetUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    activeTargetUser.full_name?.charAt(0).toUpperCase()
                  )}
                </div>
                {callState === 'connected' && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                    <Volume2 size={12} className="text-white animate-pulse" />
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
                <div className="flex items-center gap-6">
                  <button
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isMuted ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button
                    onClick={endCall}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                    title="End Call"
                  >
                    <PhoneOff size={24} />
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
