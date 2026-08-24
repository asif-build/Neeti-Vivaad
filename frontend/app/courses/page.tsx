'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Clock3,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

const PAGE_SIZE = 24;
const IGOT_CATALOG_URL = 'https://igotkarmayogi.gov.in/#/contentList';

type SortOption = 'catalog' | 'title' | 'provider' | 'duration';

interface IgotCourse {
  appIcon: string;
  description: string;
  duration: string;
  identifier: string;
  name: string;
  objectType: string;
  posterImage: string;
  primaryCategory: string;
  source: string;
}

interface CourseCatalogData {
  sourceUrl: string;
  importedAt: string;
  count: number;
  courses: IgotCourse[];
}

function formatDuration(duration: string) {
  const totalSeconds = Number(duration);

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return 'Self-paced';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours === 0) return `${Math.max(minutes, 1)} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function courseUrl(identifier: string) {
  return `https://portal.igotkarmayogi.gov.in/app/toc/${encodeURIComponent(identifier)}/overview`;
}

async function fetchCourseCatalog() {
  const response = await fetch('/data/igot-courses.json');
  if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);

  const data = (await response.json()) as CourseCatalogData;
  if (!Array.isArray(data.courses)) throw new Error('Catalog data is invalid');

  return data.courses;
}

function CourseImage({ course }: { course: IgotCourse }) {
  const initialSource = course.appIcon || course.posterImage;
  const [imageSource, setImageSource] = useState(initialSource);

  if (!imageSource) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-700">
        <BookOpen className="h-9 w-9" aria-hidden="true" />
      </div>
    );
  }

  return (
    // The official catalog uses several image hosts, so a native image keeps every source usable.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSource}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => {
        if (imageSource !== course.posterImage && course.posterImage) {
          setImageSource(course.posterImage);
        } else {
          setImageSource('');
        }
      }}
    />
  );
}

function CourseCard({ course }: { course: IgotCourse }) {
  return (
    <article className="card-supa-light flex h-full flex-col overflow-hidden shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#c7c7c7] hover:shadow-md">
      <div className="relative h-36 overflow-hidden border-b border-[#ededed] bg-[#f6f7f7]">
        <CourseImage course={course} />
        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 shadow-sm">
          Official iGOT course
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-mono text-[#707070]">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDuration(course.duration)}
          </span>
          <span className="truncate" title={course.identifier}>
            {course.identifier}
          </span>
        </div>

        <h2 className="text-base font-semibold leading-snug text-[#171717]">{course.name}</h2>

        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-emerald-700">
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{course.source || 'iGOT Karmayogi'}</span>
        </p>

        <p className="mt-3 flex-1 text-xs leading-relaxed text-[#707070]">{course.description}</p>

        <div className="mt-5 border-t border-[#ededed] pt-4">
          <a
            href={courseUrl(course.identifier)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary-green inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-xs"
            aria-label={`View ${course.name} on iGOT Karmayogi`}
          >
            View course on iGOT
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState<IgotCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('catalog');
  const [currentPage, setCurrentPage] = useState(1);

  const loadCourses = async () => {
    setLoading(true);
    setError('');

    try {
      setCourses(await fetchCourseCatalog());
    } catch (loadError) {
      console.error('Unable to load the iGOT course catalog', loadError);
      setError('The course catalog could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void fetchCourseCatalog()
      .then((catalogCourses) => {
        if (active) setCourses(catalogCourses);
      })
      .catch((loadError) => {
        console.error('Unable to load the iGOT course catalog', loadError);
        if (active) setError('The course catalog could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const providers = useMemo(
    () =>
      Array.from(new Set(courses.map((course) => course.source).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const matchingCourses = courses.filter((course) => {
      const matchesProvider = selectedProvider === 'ALL' || course.source === selectedProvider;
      if (!matchesProvider) return false;
      if (!query) return true;

      return [course.name, course.description, course.source, course.identifier, course.primaryCategory]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query);
    });

    if (sortBy === 'catalog') return matchingCourses;

    return [...matchingCourses].sort((first, second) => {
      if (sortBy === 'duration') return Number(first.duration) - Number(second.duration);
      if (sortBy === 'provider') return first.source.localeCompare(second.source);
      return first.name.localeCompare(second.name);
    });
  }, [courses, searchTerm, selectedProvider, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const visibleCourses = filteredCourses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasActiveFilters = Boolean(searchTerm) || selectedProvider !== 'ALL' || sortBy !== 'catalog';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProvider('ALL');
    setSortBy('catalog');
    setCurrentPage(1);
  };

  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1280px] space-y-7 bg-white px-4 py-10 font-sans text-[#171717] sm:px-6 lg:px-8">
      <section className="card-supa-light space-y-3 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill-tag-emerald">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Official iGOT Karmayogi catalog
          </span>
          {!loading && !error && (
            <span className="text-xs font-mono text-[#707070]">{courses.length} courses imported</span>
          )}
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
          iGOT Courses
        </h1>
        <p className="max-w-3xl text-xs leading-relaxed text-[#707070]">
          Browse the complete public iGOT Karmayogi course catalog. Search by course title, description,
          provider, or official content ID.
        </p>
        <a
          href={IGOT_CATALOG_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          View the source catalog
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </section>

      <section aria-label="Course search and filters" className="rounded-[8px] border border-[#dfdfdf] bg-[#fafafa] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_180px_auto]">
          <label className="relative block">
            <span className="sr-only">Search courses</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#707070]" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search title, description, provider, or content ID..."
              value={searchTerm}
              onChange={(event) => updateSearchTerm(event.target.value)}
              className="w-full rounded-[6px] border border-[#dfdfdf] bg-white py-2.5 pl-9 pr-9 text-xs font-mono text-[#171717] placeholder-[#9a9a9a] focus:border-[#171717] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => updateSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#707070] hover:bg-[#ededed] hover:text-[#171717]"
                aria-label="Clear course search"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </label>

          <label>
            <span className="sr-only">Filter by provider</span>
            <select
              value={selectedProvider}
              onChange={(event) => {
                setSelectedProvider(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-[6px] border border-[#dfdfdf] bg-white px-3 py-2.5 text-xs font-mono text-[#171717] focus:border-[#171717] focus:outline-none"
            >
              <option value="ALL">All providers ({providers.length})</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Sort courses</span>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="w-full rounded-[6px] border border-[#dfdfdf] bg-white px-3 py-2.5 text-xs font-mono text-[#171717] focus:border-[#171717] focus:outline-none"
            >
              <option value="catalog">Catalog order</option>
              <option value="title">Title A–Z</option>
              <option value="provider">Provider A–Z</option>
              <option value="duration">Shortest first</option>
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="rounded-[6px] border border-[#dfdfdf] bg-white px-4 py-2.5 text-xs font-mono text-[#707070] transition-colors hover:border-[#c7c7c7] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear filters
          </button>
        </div>

        {!loading && !error && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#707070]" aria-live="polite">
            <span>
              Showing {visibleCourses.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredCourses.length)} of {filteredCourses.length} courses
            </span>
            {searchTerm.trim() && <span>Search: “{searchTerm.trim()}”</span>}
          </div>
        )}
      </section>

      {loading && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading courses">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card-supa-light h-[430px] animate-pulse overflow-hidden">
              <div className="h-36 bg-[#ededed]" />
              <div className="space-y-4 p-5">
                <div className="h-3 w-1/3 rounded bg-[#ededed]" />
                <div className="h-5 w-5/6 rounded bg-[#ededed]" />
                <div className="h-3 w-2/3 rounded bg-[#ededed]" />
                <div className="h-16 rounded bg-[#ededed]" />
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && error && (
        <section className="card-supa-light flex flex-col items-center gap-4 px-6 py-16 text-center">
          <BookOpen className="h-9 w-9 text-[#707070]" aria-hidden="true" />
          <p className="text-sm text-[#707070]">{error}</p>
          <button type="button" onClick={() => void loadCourses()} className="btn-primary-green inline-flex items-center gap-2 px-4 py-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </section>
      )}

      {!loading && !error && visibleCourses.length > 0 && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="iGOT courses">
          {visibleCourses.map((course) => (
            <CourseCard key={course.identifier} course={course} />
          ))}
        </section>
      )}

      {!loading && !error && visibleCourses.length === 0 && (
        <section className="card-supa-light flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Search className="h-9 w-9 text-[#707070]" aria-hidden="true" />
          <h2 className="text-base font-semibold">No matching courses</h2>
          <p className="text-xs text-[#707070]">Try a broader search term or choose a different provider.</p>
          <button type="button" onClick={clearFilters} className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800">
            Clear all filters
          </button>
        </section>
      )}

      {!loading && !error && pageCount > 1 && (
        <nav aria-label="Course result pages" className="flex items-center justify-center gap-3 border-t border-[#ededed] pt-6">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#dfdfdf] bg-white px-3 py-2 text-xs font-mono text-[#171717] hover:border-[#c7c7c7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Previous
          </button>
          <span className="min-w-28 text-center text-xs font-mono text-[#707070]">
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            disabled={currentPage === pageCount}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#dfdfdf] bg-white px-3 py-2 text-xs font-mono text-[#171717] hover:border-[#c7c7c7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
