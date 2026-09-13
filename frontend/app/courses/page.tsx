'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Search, ExternalLink, Eye, X, 
  CheckCircle2, Clock, Building, ChevronLeft, ChevronRight, 
  RefreshCcw, Sparkles, AlertCircle, Layers
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';
import { CourseThumbnail } from './CourseThumbnail';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Recently');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 12,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false
  });

  // Course Preview Modal State
  const [previewCourse, setPreviewCourse] = useState<any | null>(null);

  // Fetch real iGOT courses from backend
  const fetchCourses = useCallback(async (
    targetPage: number = 1,
    search: string = '',
    filterTag: string = 'ALL'
  ) => {
    setLoading(true);
    setHasError(false);
    const base = getApiBaseUrl();

    try {
      const filterParam = filterTag === 'ALL' ? '' : encodeURIComponent(filterTag);
      const searchParam = encodeURIComponent(search);
      const url = `${base}/api/courses/?page=${targetPage}&page_size=12&search=${searchParam}&filter=${filterParam}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const data = await res.json();
      setCourses(data.courses || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
      if (data.last_synced_at) {
        setLastSyncedAt(data.last_synced_at);
      }
    } catch (err) {
      console.error('[CourseCatalog] Error querying iGOT course catalogue:', err);
      setCourses([]);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(1, '', 'ALL');
  }, [fetchCourses]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses(1, searchTerm, selectedFilter);
  };

  const handleFilterSelect = (filterTag: string) => {
    setSelectedFilter(filterTag);
    setPage(1);
    fetchCourses(1, searchTerm, filterTag);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCourses(newPage, searchTerm, selectedFilter);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#111111] py-8 sm:py-12 px-4 sm:px-8 max-w-[1360px] mx-auto space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="card-brutal-navy !bg-[#0B1F3A] !text-white p-6 sm:p-10 shadow-brutal-lg relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#061120] border-2 border-[#111111] text-[#FCD34D] text-xs font-mono shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F2A900]" />
            <span className="font-bold uppercase tracking-wider">
              iGOT KARMAYOGI &bull; OFFICIAL CIVIL SERVICE CATALOGUE
            </span>
          </div>

          <h1 className="display-section text-white">
            EXPLORE iGOT COURSES
          </h1>

          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-medium">
            Explore courses available through iGOT Karmayogi.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-zinc-300">
              Course catalogue updated recently &bull; Last updated: {lastSyncedAt} &bull; {pagination.total_count} courses available
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="card-brutal bg-white p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-brutal-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#111111] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, description, provider, competencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8F7F2] border-2 border-[#111111] rounded-full pl-10 pr-4 py-2.5 text-xs font-mono text-[#111111] font-medium placeholder:text-[#4B5563] focus:outline-none focus:bg-white shadow-brutal-sm"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'DIGITAL', label: 'DIGITAL' },
            { id: 'DATA', label: 'DATA' },
            { id: 'GOVERNANCE', label: 'GOVERNANCE' },
            { id: 'MANAGEMENT', label: 'MANAGEMENT' },
            { id: 'BEHAVIOURAL', label: 'BEHAVIOURAL' },
            { id: 'TECHNICAL', label: 'TECHNICAL' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilterSelect(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider whitespace-nowrap transition-all border-2 border-[#111111] ${
                selectedFilter === f.id
                  ? 'bg-[#F2A900] text-[#111111] shadow-brutal-sm'
                  : 'bg-white text-[#111111] hover:bg-[#F8F7F2]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid or Error */}
      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-[#4B5563] space-y-3 card-brutal bg-white">
          <span className="badge-starburst badge-starburst-saffron animate-pulse">
            ★ LOADING iGOT COURSES
          </span>
          <p>Querying real iGOT Karmayogi course records...</p>
        </div>
      ) : hasError ? (
        <div className="card-brutal bg-white p-12 text-center space-y-4 max-w-lg mx-auto shadow-brutal-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display font-extrabold uppercase text-lg text-[#111111]">
              Couldn&apos;t load courses right now.
            </h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Please try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchCourses(page, searchTerm, selectedFilter)}
            className="btn-brutal-primary !text-xs !py-2.5 !px-5 inline-flex items-center gap-2 font-bold"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="card-brutal bg-white p-12 text-center space-y-3 max-w-lg mx-auto shadow-brutal-md">
          <BookOpen className="w-10 h-10 text-[#4B5563] mx-auto" />
          <h3 className="font-display font-extrabold uppercase text-lg text-[#111111]">
            No Courses Found
          </h3>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Try another topic or search term, or select &ldquo;ALL&rdquo; to browse the entire catalogue.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedFilter('ALL');
              fetchCourses(1, '', 'ALL');
            }}
            className="btn-brutal-secondary !text-xs !py-2 !px-4 mt-2 inline-flex items-center gap-1.5"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Search &amp; Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any, idx: number) => {
            const relevantTopics: string[] = course.topics && course.topics.length > 0 
              ? course.topics 
              : (course.competencies || []);
            const igotUrl = course.igot_course_url || course.url;

            return (
              <div 
                key={course.id || course.igot_course_id || idx}
                className="card-brutal bg-white overflow-hidden flex flex-col justify-between shadow-brutal-md transition-all duration-200 hover:translate-y-[-2px]"
              >
                {/* 1. Large Top Real iGOT Course Image (16:9 aspect ratio) */}
                <div 
                  onClick={() => setPreviewCourse(course)}
                  className="cursor-pointer"
                >
                  <CourseThumbnail
                    thumbnailUrl={course.thumbnail_url}
                    title={course.title}
                    fallbackCategory={course.fallback_category || course.category}
                    category={course.category}
                  />
                </div>

                {/* 2. Course Card Body */}
                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Top row: Category Badge & Duration */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge-starburst badge-starburst-navy text-[10px]">
                        ★ {course.category || 'iGOT COURSE'}
                      </span>
                      <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-[#111111] text-white flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-[#F2A900]" />
                        <span>{course.duration || `${course.duration_hours || 2} Hours`}</span>
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 
                      onClick={() => setPreviewCourse(course)}
                      className="font-display font-extrabold uppercase text-lg text-[#111111] leading-snug cursor-pointer hover:text-[#0B1F3A] transition-colors"
                    >
                      {course.title}
                    </h3>

                    {/* Provider */}
                    <div className="text-xs font-mono text-[#0F766E] font-bold flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>By {course.provider_name || course.provider || 'iGOT Karmayogi'}</span>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-[#374151] font-medium leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    {/* Relevant Topic / Competency */}
                    {relevantTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {relevantTopics.slice(0, 3).map((topic, tIdx) => (
                          <span 
                            key={tIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F8F7F2] border border-[#111111] text-[#111111]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Card Footer Action Buttons */}
                  <div className="pt-4 border-t-2 border-[#111111] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="text-[#0F766E] uppercase">
                        {course.igot_course_id ? `ID: ${course.igot_course_id.slice(0, 18)}...` : 'iGOT Karmayogi'}
                      </span>
                      <span className="text-zinc-500 uppercase">
                        {course.difficulty || 'Civil Service'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewCourse(course)}
                        className="btn-brutal-secondary !text-xs !py-2.5 !px-3 flex items-center justify-center gap-1.5 text-center font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>VIEW COURSE</span>
                      </button>

                      {igotUrl ? (
                        <a
                          href={igotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-brutal-emerald !text-xs !py-2.5 !px-3 flex items-center justify-center gap-1.5 text-center font-bold"
                        >
                          <span>VIEW ON iGOT →</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-2.5 rounded-xl border-2 border-zinc-300 text-xs font-mono font-bold text-zinc-400 bg-zinc-100 cursor-not-allowed text-center"
                        >
                          Link Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server-Side Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="card-brutal bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-brutal-sm">
          <span className="text-xs font-mono font-bold text-[#111111]">
            Showing page {pagination.page} of {pagination.total_pages} ({pagination.total_count} courses)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.has_previous || loading}
              className="btn-brutal-secondary !text-xs !py-2 !px-3 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 rounded-lg border-2 border-[#111111] bg-[#F8F7F2] font-mono text-xs font-bold">
              {pagination.page}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.has_next || loading}
              className="btn-brutal-secondary !text-xs !py-2 !px-3 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Course Details / Preview Modal */}
      {previewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="fixed inset-0 bg-[#0B1F3A]/70 backdrop-blur-sm transition-opacity"
            onClick={() => setPreviewCourse(null)}
          />
          <div 
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl bg-white border-2 border-[#111111] rounded-2xl shadow-brutal-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="bg-[#0B1F3A] border-b-2 border-[#111111] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="badge-starburst badge-starburst-saffron text-[10px]">
                  ★ COURSE DETAILS
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-200">
                  iGOT Karmayogi &bull; Government of India
                </span>
              </div>
              <button
                onClick={() => setPreviewCourse(null)}
                className="p-1 rounded-lg border-2 border-[#111111] bg-white text-[#111111] hover:bg-[#F8F7F2]"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[80vh] overflow-y-auto font-sans">
              {/* Real iGOT Image */}
              <CourseThumbnail
                thumbnailUrl={previewCourse.thumbnail_url}
                title={previewCourse.title}
                fallbackCategory={previewCourse.fallback_category || previewCourse.category}
                category={previewCourse.category}
              />

              <div className="p-6 sm:p-8 space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded bg-[#111111] text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F2A900]" />
                      <span>{previewCourse.duration || `${previewCourse.duration_hours || 2} Hours`}</span>
                    </span>
                    <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded bg-emerald-100 text-emerald-950 border border-emerald-800">
                      {previewCourse.category || 'Civil Service Module'}
                    </span>
                    <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded bg-zinc-100 text-zinc-900 border border-zinc-300">
                      {previewCourse.difficulty || 'Intermediate'}
                    </span>
                    {previewCourse.igot_course_id && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-300">
                        ID: {previewCourse.igot_course_id}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display font-extrabold uppercase text-xl sm:text-2xl text-[#111111]">
                    {previewCourse.title}
                  </h2>

                  <div className="text-xs font-mono text-[#0F766E] font-bold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span>Provided by {previewCourse.provider_name || previewCourse.provider}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-xs font-bold uppercase text-[#111111]">
                    Description:
                  </h4>
                  <p className="text-sm text-[#374151] font-medium leading-relaxed bg-[#F8F7F2] p-4 rounded-xl border-2 border-[#111111]">
                    {previewCourse.description}
                  </p>
                </div>

                {/* Modules (if available) */}
                {previewCourse.modules && previewCourse.modules.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-mono text-xs font-bold uppercase text-[#111111] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Course Modules:</span>
                    </h4>
                    <div className="space-y-1.5 bg-[#F8F7F2] p-3 rounded-xl border border-zinc-200">
                      {previewCourse.modules.map((mod: string, mIdx: number) => (
                        <div key={mIdx} className="flex items-center gap-2 text-xs font-mono text-[#111111]">
                          <span className="w-5 h-5 rounded-full bg-white border border-[#111111] text-[10px] flex items-center justify-center font-bold shrink-0">
                            {mIdx + 1}
                          </span>
                          <span>{mod}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics & Competencies */}
                {(previewCourse.topics || previewCourse.competencies) && (
                  <div className="space-y-2">
                    <h4 className="font-mono text-xs font-bold uppercase text-[#111111]">
                      Competencies &amp; Topics:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(previewCourse.topics || previewCourse.competencies || []).map((t: string, i: number) => (
                        <span 
                          key={i}
                          className="px-3 py-1 rounded-lg bg-white border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] shadow-brutal-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t-2 border-[#111111] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewCourse(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] hover:bg-zinc-50"
                  >
                    Close
                  </button>

                  {(previewCourse.igot_course_url || previewCourse.url) ? (
                    <a
                      href={previewCourse.igot_course_url || previewCourse.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto btn-brutal-emerald !text-xs !py-3 !px-6 flex items-center justify-center gap-2 shadow-brutal-sm font-bold"
                    >
                      <span>VIEW ON iGOT →</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-zinc-300 text-xs font-mono font-bold text-zinc-400 bg-zinc-100 cursor-not-allowed"
                    >
                      Link Unavailable
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
