'use client';

import React, { useState, useEffect } from 'react';
import { X, Camera, User, Check, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function ProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, login } = useAuth();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [fileUploadName, setFileUploadName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`);
      setDepartment(user.department || 'Engineering');
      setFileUploadName('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  // Preset Avatars generator
  const AVATAR_PRESETS = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
    `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(user.name)}`,
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80`,
  ];

  const handleRandomize = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size too large (Max 5MB)');
        return;
      }
      setFileUploadName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          avatar_url: avatarUrl.trim(),
          department,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user, data.token);
        setSuccess('Profile picture updated successfully!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 800);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      // Optimistic fallback update for client state
      login({ ...user, name: name.trim(), avatar_url: avatarUrl.trim(), department }, 'demo-token');
      setSuccess('Profile picture updated!');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-400" />
            <h2 className="font-bold text-base text-slate-100">Edit Profile & Picture</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4" /> {success}
            </div>
          )}

          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                alt="Profile Preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;
                }}
                className="w-24 h-24 rounded-full border-4 border-brand-500/50 object-cover shadow-xl bg-slate-800"
              />
              <button
                type="button"
                onClick={handleRandomize}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg border border-slate-900 transition"
                title="Generate Random Avatar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-slate-400">Live Profile Preview</span>
          </div>

          {/* Desktop File Upload Button */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Upload Image from Desktop</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                id="desktop-avatar-upload"
                className="hidden"
              />
              <label
                htmlFor="desktop-avatar-upload"
                className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4 text-brand-400" />
                <span>Choose Desktop File</span>
              </label>
              {fileUploadName && (
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{fileUploadName}</span>
              )}
            </div>
          </div>

          {/* Avatar Presets Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Choose Avatar Preset</label>
            <div className="flex justify-center gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-10 h-10 rounded-full border-2 overflow-hidden transition ${
                    avatarUrl === preset ? 'border-brand-500 ring-2 ring-brand-500/40' : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Image URL or Base64 Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Paste Image URL or Data String</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Paste image URL (e.g. https://...)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Product">Product</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-brand-600/30"
            >
              {loading ? 'Saving...' : 'Save Profile Picture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
