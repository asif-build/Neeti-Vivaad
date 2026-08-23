import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    EMBEDDER = SentenceTransformer('all-MiniLM-L6-v2')
    ST_AVAILABLE = True
except Exception:
    ST_AVAILABLE = False
    EMBEDDER = None

def mock_vectorize(text_list, dim=384):
    """Fallback lightweight TF-IDF / Hashing vectorizer if SentenceTransformers is loading."""
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
    if ST_AVAILABLE and EMBEDDER is not None:
        try:
            return EMBEDDER.encode(text_list, convert_to_numpy=True).astype(np.float32)
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

    def recommend_for_gaps(self, gap_items, top_k=6):
        if not self.courses:
            return []

        # Create query from high-priority gaps
        query_text = "Target skill gaps to improve: " + "; ".join(
            [f"{g['subskill_name']} in {g['domain_name']} (gap: {g['gap']} points)" for g in gap_items]
        )
        
        query_vector = get_embeddings([query_text])[0]
        
        results = []
        if FAISS_AVAILABLE and self.index is not None:
            q_vec = query_vector.reshape(1, -1)
            faiss.normalize_L2(q_vec)
            scores, indices = self.index.search(q_vec, min(top_k, len(self.courses)))
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.courses):
                    course = self.courses[idx]
                    match_score = min(99.0, max(60.0, float(score * 100.0 if score <= 1.0 else score)))
                    results.append((course, round(match_score, 1)))
        else:
            # Fallback Dot Product
            q_norm = query_vector / (np.linalg.norm(query_vector) + 1e-9)
            sims = np.dot(self.embeddings, q_norm)
            top_indices = np.argsort(sims)[::-1][:top_k]
            for idx in top_indices:
                course = self.courses[idx]
                sim = float(sims[idx])
                match_score = min(98.5, max(65.0, round(75.0 + sim * 25.0, 1)))
                results.append((course, match_score))

        return results
