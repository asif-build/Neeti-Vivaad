'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Star, MessageSquare, ShieldCheck, CheckCircle2, 
  AlertCircle, X, Sparkles, Send, User 
} from 'lucide-react';
import { getApiBaseUrl, getAccessToken, authFetch } from '../utils/api';
import { executeRecaptcha } from '../utils/recaptcha';

interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  display_name: string;
  feature_used: string;
  is_verified_learner: boolean;
  created_at: string;
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [featureUsed, setFeatureUsed] = useState('Neeti Vivaad');
  const [displayName, setDisplayName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isLoggedIn = Boolean(getAccessToken());

  useEffect(() => {
    fetchApprovedReviews();
  }, []);

  const fetchApprovedReviews = async () => {
    try {
      setLoading(true);
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/reviews/`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.warn('Could not fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSubmitSuccess(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setSubmitError('Please sign in to submit a review.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const captchaToken = await executeRecaptcha('submit_review');

      const res = await authFetch('/api/reviews/submit/', {
        method: 'POST',
        headers: {
          ...(captchaToken ? { 'X-Recaptcha-Token': captchaToken } : {})
        },
        body: JSON.stringify({
          rating,
          feature_used: featureUsed,
          display_name: displayName || undefined,
          comment,
          recaptcha_token: captchaToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSubmitSuccess(data.message || 'Thank you for your feedback! Your review has been submitted for moderation.');
      setComment('');
      setTimeout(() => {
        setModalOpen(false);
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while submitting your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full py-12 sm:py-16 px-4 sm:px-8 border-t-2 border-[#111111] bg-[#F8F7F2] font-sans">
      <div className="max-w-[1360px] mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#111111] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FEF3C7] border border-[#111111] shadow-brutal-sm mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>COMMUNITY PERSPECTIVES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight uppercase text-[#111111]">
              What People Think
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#4B5563] mt-0.5">
              Genuine feedback from public service learners and administrators.
            </p>
          </div>

          <div>
            <button
              onClick={handleOpenModal}
              className="btn-brutal-primary text-xs font-display font-extrabold uppercase !py-2.5 !px-5 inline-flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* Content: Real Reviews or Zero-Reviews Empty State */}
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#4B5563]">
            Loading real learner feedback...
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="card-brutal bg-white p-6 border-2 border-[#111111] rounded-2xl shadow-brutal flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Star Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= r.rating 
                              ? 'text-[#F2A900] fill-[#F2A900]' 
                              : 'text-zinc-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-300 text-[#4B5563]">
                      {r.feature_used}
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-[#111111] leading-relaxed font-normal italic">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>

                {/* Author & Verification Badge */}
                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#111111]">{r.display_name}</span>
                  {r.is_verified_learner && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#0F766E] font-bold bg-[#CCFBF1] px-2 py-0.5 rounded-full border border-[#0F766E]/30">
                      <ShieldCheck className="w-3 h-3" /> Verified learner
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Honest Empty State - Zero Fake Testimonials */
          <div className="card-brutal bg-white p-8 sm:p-12 border-2 border-[#111111] rounded-2xl shadow-brutal text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] border-2 border-[#111111] mx-auto flex items-center justify-center shadow-brutal-sm">
              <MessageSquare className="w-6 h-6 text-[#111111]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-display font-extrabold uppercase text-[#111111]">
                Be One of the First to Share Your Experience
              </h3>
              <p className="text-xs font-mono text-[#4B5563] max-w-sm mx-auto leading-relaxed">
                We value authentic feedback from public servants. We do not manufacture fake testimonials. Share your thoughts on Neeti Saarthi.
              </p>
            </div>
            <button
              onClick={handleOpenModal}
              className="btn-brutal-primary text-xs !py-2.5 !px-6 inline-flex items-center gap-2"
            >
              <span>Submit Learner Feedback</span>
            </button>
          </div>
        )}

        {/* Modal: Write a Review */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
            <div className="card-brutal bg-white w-full max-w-lg border-2 border-[#111111] rounded-2xl shadow-brutal-lg p-6 sm:p-7 space-y-5 relative">
              
              <button
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full border border-[#111111] hover:bg-zinc-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b-2 border-[#111111] pb-3">
                <h3 className="text-lg font-display font-black uppercase text-[#111111]">
                  Write a Review
                </h3>
                <p className="text-xs font-mono text-[#4B5563]">
                  Submissions are moderated before publication to prevent spam.
                </p>
              </div>

              {!isLoggedIn ? (
                <div className="space-y-4 text-center py-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono">
                    You must be signed in to an official learner account to submit a review.
                  </div>
                  <Link
                    href="/login?returnUrl=/"
                    className="btn-brutal-primary text-xs !py-2.5 !px-6 inline-flex items-center gap-2"
                  >
                    <span>Sign In to Review</span>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {submitSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-[#0F766E] text-[#0F766E] text-xs font-mono flex items-start gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitSuccess}</span>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs font-mono flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-[#111111]">Rating *</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= (hoverRating || rating)
                                ? 'text-[#F2A900] fill-[#F2A900]'
                                : 'text-zinc-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono font-bold text-[#4B5563] ml-2">
                        {rating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Feature Used */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-[#111111]">Feature Used</label>
                    <select
                      value={featureUsed}
                      onChange={(e) => setFeatureUsed(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono font-bold focus:bg-white focus:outline-none"
                    >
                      <option value="Neeti Vivaad">Neeti Vivaad</option>
                      <option value="Knowledge Check">Knowledge Check</option>
                      <option value="Learn">Learn &amp; Courses</option>
                      <option value="Profile">My Profile &amp; Skills</option>
                      <option value="Buddy">Neeti Saarthi Buddy</option>
                      <option value="Overall Platform">Overall Platform</option>
                    </select>
                  </div>

                  {/* Optional Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-[#111111]">Display Name (Optional)</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Statistical Officer, West Bengal"
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold uppercase text-[#111111]">Your Feedback / Review *</label>
                    <textarea
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="How has Neeti Saarthi helped your learning, skill practice, or decision making?"
                      className="w-full px-3 py-2 rounded-xl border-2 border-[#111111] bg-[#F8F7F2] text-xs font-mono focus:bg-white focus:outline-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-brutal-primary w-full !py-2.5 !text-xs sm:!text-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting for Moderation...' : 'Submit Review'}</span>
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
