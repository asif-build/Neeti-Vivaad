import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

# Lazy-loaded SentenceTransformer to prevent memory spikes and boot timeouts during startup on 512 MB instances
EMBEDDER = None
_embedder_attempted = False

def get_embedder():
    """
    Lazy-loads SentenceTransformer on demand when first needed.
    Keeps Django startup fast and lightweight, preventing worker timeouts or OOM kills on 512 MB instances.
    """
    global EMBEDDER, _embedder_attempted
    if _embedder_attempted:
        return EMBEDDER
    _embedder_attempted = True
    try:
        from sentence_transformers import SentenceTransformer
        EMBEDDER = SentenceTransformer('all-MiniLM-L6-v2')
    except Exception:
        EMBEDDER = None
    return EMBEDDER

def is_st_available():
    return get_embedder() is not None

# Backward compatibility alias
ST_AVAILABLE = False

def mock_vectorize(text_list, dim=384):
    """Fallback lightweight TF-IDF / Hashing vectorizer if SentenceTransformers is unavailable."""
    vectors = []
    for text in text_list:
        v = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for idx, w in enumerate(words):
            hash_val = hash(w) % dim
            v[hash_val] += 1.0
        norm = np.linalg.norm(v)
        if norm > 0:
            v /= norm
        vectors.append(v)
    return np.array(vectors, dtype=np.float32)

def get_embeddings(text_list):
    embedder = get_embedder()
    if embedder is not None:
        try:
            return embedder.encode(text_list, convert_to_numpy=True).astype(np.float32)
        except Exception:
            pass
    return mock_vectorize(text_list)

class CourseRecommendationEngine:
    def __init__(self, courses):
        self.courses = list(courses)
        self.dim = 384
        self.index = None
        self._build_index()

    def _build_index(self):
        if not self.courses:
            return
        
        texts = []
        for c in self.courses:
            subskills_str = ", ".join([s.name for s in c.target_subskills.all()])
            text = f"Title: {c.title}. Description: {c.description}. Subskills: {subskills_str}. Domain: {c.domain.name if c.domain else ''}"
            texts.append(text)
            
        embeddings = get_embeddings(texts)
        self.dim = embeddings.shape[1]
        
        if FAISS_AVAILABLE:
            self.index = faiss.IndexFlatIP(self.dim)  # Inner Product for Cosine Similarity (vectors normalized)
            # Normalize vectors for cosine similarity
            faiss.normalize_L2(embeddings)
            self.index.add(embeddings)
        else:
            self.embeddings = embeddings

    def recommend_for_gaps(self, gap_items, completed_course_ids=None, top_k=6):
        if not self.courses:
            return []

        completed_set = set(completed_course_ids or [])
        gap_dict = {g['subskill_name'].lower(): g['gap'] for g in gap_items}
        gap_id_set = {g['subskill_id'] for g in gap_items if g.get('gap', 0) > 0}

        scored_courses = []
        for course in self.courses:
            if course.id in completed_set:
                continue

            # Calculate gap affinity score
            course_subskills = list(course.target_subskills.all())
            matched_subs = [s for s in course_subskills if s.id in gap_id_set]
            
            base_score = 65.0
            if matched_subs:
                # Add up to 30 points based on gap magnitude
                highest_gap = max([gap_dict.get(s.name.lower(), 15.0) for s in matched_subs], default=15.0)
                boost = min(32.0, max(15.0, (highest_gap / 40.0) * 32.0))
                base_score = 68.0 + boost
            else:
                # Keyword matching on title/description
                text = f"{course.title} {course.description}".lower()
                matches = sum(1 for g_name in gap_dict.keys() if any(w in text for w in g_name.split() if len(w) > 3))
                if matches > 0:
                    base_score = min(84.0, 68.0 + (matches * 5.0))

            scored_courses.append((course, round(min(98.5, max(60.0, base_score)), 1), len(matched_subs)))

        # Sort by: matched_subs count descending, then score descending
        scored_courses.sort(key=lambda x: (x[2], x[1]), reverse=True)
        return [(item[0], item[1]) for item in scored_courses[:top_k]]

